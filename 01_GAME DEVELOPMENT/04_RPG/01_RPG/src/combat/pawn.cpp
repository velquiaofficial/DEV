#include "combat/pawn.hpp"

#include "combat/kit_palette.hpp"
#include "core/session_access.hpp"

#include <godot_cpp/classes/capsule_shape2d.hpp>
#include <godot_cpp/classes/collision_shape2d.hpp>
#include <godot_cpp/classes/file_access.hpp>
#include <godot_cpp/classes/image.hpp>
#include <godot_cpp/classes/image_texture.hpp>
#include <godot_cpp/classes/input.hpp>
#include <godot_cpp/classes/resource_loader.hpp>
#include <godot_cpp/classes/texture2d.hpp>
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>

using namespace godot;

void AeternaPawn::_bind_methods() {
	ClassDB::bind_method(D_METHOD("configure", "team", "id", "player"), &AeternaPawn::configure);
	ClassDB::bind_method(D_METHOD("apply_damage", "amount"), &AeternaPawn::apply_damage);
	ClassDB::bind_method(D_METHOD("heal", "amount"), &AeternaPawn::heal);
	ClassDB::bind_method(D_METHOD("add_ult", "amount"), &AeternaPawn::add_ult);
	ClassDB::bind_method(D_METHOD("command_attack"), &AeternaPawn::command_attack);
	ClassDB::bind_method(D_METHOD("command_dodge"), &AeternaPawn::command_dodge);
	ClassDB::bind_method(D_METHOD("try_skill1"), &AeternaPawn::try_skill1);
	ClassDB::bind_method(D_METHOD("try_skill2"), &AeternaPawn::try_skill2);
	ClassDB::bind_method(D_METHOD("try_ultimate"), &AeternaPawn::try_ultimate);
	ClassDB::bind_method(D_METHOD("try_awaken"), &AeternaPawn::try_awaken);
	ClassDB::bind_method(D_METHOD("get_team"), &AeternaPawn::get_team);
	ClassDB::bind_method(D_METHOD("get_character_id"), &AeternaPawn::get_character_id);
	ClassDB::bind_method(D_METHOD("has_portrait"), &AeternaPawn::has_portrait);
	ClassDB::bind_method(D_METHOD("is_player_controlled"), &AeternaPawn::is_player_controlled);
	ClassDB::bind_method(D_METHOD("is_alive"), &AeternaPawn::is_alive);
	ClassDB::bind_method(D_METHOD("get_hp"), &AeternaPawn::get_hp);
	ClassDB::bind_method(D_METHOD("get_max_hp"), &AeternaPawn::get_max_hp);
	ClassDB::bind_method(D_METHOD("get_skill1_cd"), &AeternaPawn::get_skill1_cd);
	ClassDB::bind_method(D_METHOD("get_skill2_cd"), &AeternaPawn::get_skill2_cd);
	ClassDB::bind_method(D_METHOD("get_ult_charge"), &AeternaPawn::get_ult_charge);
	ClassDB::bind_method(D_METHOD("get_attack_range"), &AeternaPawn::get_attack_range);
	ClassDB::bind_method(D_METHOD("get_status"), &AeternaPawn::get_status);
	ClassDB::bind_method(D_METHOD("consume_last_action"), &AeternaPawn::consume_last_action);
}

void AeternaPawn::apply_kit_stats() {
	if (AeternaSession *session = aeterna::session_or_null()) {
		Dictionary loadout = session->get_loadout(character_id);
		if (!loadout.is_empty()) {
			max_hp = float(loadout.get("hp", max_hp));
			move_speed = float(loadout.get("speed", 8.0)) * 38.0f;
			attack_damage = float(loadout.get("damage", attack_damage));
		}
	}
	aeterna::KitTune tune = aeterna::tune_for(character_id);
	attack_range = tune.attack_range;
	move_speed *= tune.speed_mul;
	if (tune.override_combat) {
		max_hp = tune.max_hp;
		move_speed = tune.move_speed;
		attack_damage = tune.attack_damage;
	}
	hp = max_hp;
	pending_revive = tune.pending_revive;
	aeterna::KitLook look = aeterna::look_for(character_id);
	body_color = look.body;
	emit_color = look.emit;
	if (team == 0) {
		growth_level = 1;
		if (AeternaSession *session = aeterna::session_or_null()) {
			growth_level = session->get_character_level(character_id);
			if (growth_level < 1) {
				growth_level = 1;
			}
		}
		awaken_rank = growth_level >= 80 ? 4 : growth_level >= 60 ? 3 : growth_level >= 40 ? 2 : growth_level >= 20 ? 1 : 0;
		float mul = (1.0f + 0.03f * float(growth_level - 1)) * (1.0f + 0.08f * float(awaken_rank));
		max_hp *= mul;
		attack_damage *= mul;
		hp = max_hp;
	}
}

void AeternaPawn::scale_power(float mul) {
	if (mul <= 0.0f) {
		return;
	}
	max_hp *= mul;
	attack_damage *= mul;
	hp = max_hp;
}

void AeternaPawn::configure(int p_team, const String &p_id, bool p_player) {
	team = p_team;
	character_id = p_id;
	player_controlled = p_player;
	apply_kit_stats();
	load_portrait();
}

void AeternaPawn::load_portrait() {
	PackedStringArray paths;
	paths.push_back("res://assets/characters/battle/" + character_id + ".png");
	paths.push_back("res://assets/characters/cards/" + character_id + ".jpg");
	ResourceLoader *loader = ResourceLoader::get_singleton();
	for (int i = 0; i < paths.size(); i++) {
		String path = paths[i];
		if (path.is_empty() || !FileAccess::file_exists(path)) {
			continue;
		}
		if (loader && loader->exists(path)) {
			portrait = loader->load(path);
			if (portrait.is_valid()) {
				return;
			}
		}
		Ref<Image> image;
		image.instantiate();
		if (image.is_null()) {
			continue;
		}
		bool decoded = image->load(path) == OK;
		if (!decoded) {
			Ref<FileAccess> file = FileAccess::open(path, FileAccess::READ);
			if (file.is_valid()) {
				PackedByteArray bytes = file->get_buffer(file->get_length());
				file->close();
				decoded = image->load_png_from_buffer(bytes) == OK || image->load_jpg_from_buffer(bytes) == OK || image->load_webp_from_buffer(bytes) == OK;
			}
		}
		if (decoded) {
			portrait = ImageTexture::create_from_image(image);
			if (portrait.is_valid()) {
				return;
			}
		}
	}
}

void AeternaPawn::_ready() {
	set_motion_mode(MOTION_MODE_FLOATING);
	CollisionShape2D *col = memnew(CollisionShape2D);
	Ref<CapsuleShape2D> shape;
	shape.instantiate();
	shape->set_radius(character_id == "oblivion" ? 28.0f : 20.0f);
	shape->set_height(character_id == "oblivion" ? 86.0f : 64.0f);
	col->set_shape(shape);
	add_child(col);
	set_texture_filter(TEXTURE_FILTER_NEAREST);
	queue_redraw();
}

void AeternaPawn::_draw() {
	const bool boss = character_id == "oblivion";
	float lunge = is_alive() && strike > 0.0f ? Math::sin(strike / 0.2f * 3.1415926f) * (ult_flash > 0.0f ? 18.0f : 8.0f) : 0.0f;
	float fallen = is_alive() ? 0.0f : 46.0f;
	float pulse = ult_flash > 0.0f ? 1.0f + 0.2f * (ult_flash / 0.8f) : 1.0f;
	draw_set_transform(Vector2(lunge, fallen), 0.0f, Vector2(facing * pulse, (is_alive() ? 1.0f : 0.92f) * pulse));
	if (portrait.is_valid()) {
		Vector2 sz = portrait->get_size();
		float scale = 1.0f;
		if (sz.y > 200.0f) {
			scale = 150.0f / sz.y;
		} else if (sz.y <= 90.0f) {
			scale = 2.0f;
		}
		Vector2 draw_sz = sz * scale;
		Color tint = is_alive() ? Color(1, 1, 1) : Color(0.25f, 0.25f, 0.28f);
		draw_texture_rect(portrait, Rect2(-draw_sz.x * 0.5f, -draw_sz.y + 22.0f, draw_sz.x, draw_sz.y), false, tint);
	} else {
		float body_r = boss ? 30.0f : 20.0f;
		Color dim = is_alive() ? body_color : Color(0.15f, 0.15f, 0.16f);
		draw_circle(Vector2(0, 8), body_r + 6.0f, Color(emit_color.r, emit_color.g, emit_color.b, 0.18f));
		draw_circle(Vector2(0, 10), body_r, dim);
		draw_circle(Vector2(0, -18), boss ? 16.0f : 13.0f, dim.lerp(Color(1, 1, 1), 0.12f));
		draw_circle(Vector2(0, -34), 7.0f, emit_color);
	}
	if (strike > 0.0f) {
		float slash = ult_flash > 0.0f ? 210.0f : 96.0f;
		draw_line(Vector2(8, -30), Vector2(slash, -18), Color(emit_color.r, emit_color.g, emit_color.b, 0.9f), ult_flash > 0.0f ? 6.0f : 3.0f);
		draw_arc(Vector2(22, -36), 28.0f, -0.8f, 0.9f, 12, Color(emit_color.r, emit_color.g, emit_color.b, 0.85f), 3.0f);
	}
	draw_set_transform(Vector2(), 0.0f, Vector2(1, 1));
	if (ult_flash > 0.0f) {
		float glow = Math::clamp(ult_flash / 0.8f, 0.0f, 1.0f);
		draw_arc(Vector2(0, -48), 78.0f + (1.0f - glow) * 64.0f, 0.0f, 6.283185f, 36, Color(1.0f, 0.9f, 0.45f, 0.9f * glow), 7.0f);
		draw_arc(Vector2(0, -48), 128.0f + (1.0f - glow) * 90.0f, 0.0f, 6.283185f, 40, Color(1.0f, 0.45f, 0.18f, 0.55f * glow), 4.0f);
	}
	if (awaken_timer > 0.0f || awaken_flash > 0.0f) {
		float glow = awaken_flash > 0.0f ? Math::clamp(awaken_flash / 1.1f, 0.35f, 1.0f) : 0.55f;
		draw_arc(Vector2(0, -40), 96.0f, 0.0f, 6.283185f, 40, Color(1.0f, 0.95f, 0.72f, 0.85f * glow), 8.0f);
		draw_arc(Vector2(0, -40), 150.0f, 0.0f, 6.283185f, 48, Color(0.95f, 0.55f, 0.2f, 0.45f * glow), 5.0f);
	}
	if (shield_timer > 0.0f) {
		draw_arc(Vector2(), 38.0f, 0.0f, 6.283185f, 28, Color(0.7f, 0.85f, 1.0f, 0.7f), 3.0f);
	}
	if (!is_alive()) {
		return;
	}
	float ratio = max_hp > 0.0f ? hp / max_hp : 0.0f;
	draw_rect(Rect2(-28, 36, 56, 6), Color(0.08f, 0.08f, 0.1f));
	draw_rect(Rect2(-28, 36, 56.0f * ratio, 6), team == 0 ? Color(0.9f, 0.78f, 0.35f) : Color(0.85f, 0.2f, 0.28f));
}

void AeternaPawn::_physics_process(double delta) {
	queue_redraw();
	if (halted || !is_alive()) {
		move_wish = Vector2();
		advancing = false;
		strike = 0.0f;
		set_velocity(Vector2());
		set_collision_layer(0);
		set_collision_mask(0);
		queue_redraw();
		return;
	}

	ult_flash = Math::max(0.0f, ult_flash - (float)delta);
	awaken_timer = Math::max(0.0f, awaken_timer - (float)delta);
	awaken_flash = Math::max(0.0f, awaken_flash - (float)delta);
	level_banner = Math::max(0.0f, level_banner - (float)delta);
	awaken_banner = Math::max(0.0f, awaken_banner - (float)delta);
	attack_cd = Math::max(0.0f, attack_cd - (float)delta);
	skill1_cd = Math::max(0.0f, skill1_cd - (float)delta);
	skill2_cd = Math::max(0.0f, skill2_cd - (float)delta);
	dodge_cd = Math::max(0.0f, dodge_cd - (float)delta);
	i_frames = Math::max(0.0f, i_frames - (float)delta);
	bless_timer = Math::max(0.0f, bless_timer - (float)delta);
	shield_timer = Math::max(0.0f, shield_timer - (float)delta);
	counter_timer = Math::max(0.0f, counter_timer - (float)delta);
	if (shield_timer <= 0.0f) {
		incoming_mult = 1.0f;
	}

	Vector2 wish;
	if (player_controlled) {
		Input *input = Input::get_singleton();
		if (input->is_physical_key_pressed(KEY_A) || input->is_action_pressed("move_left")) {
			wish.x -= 1.0f;
		}
		if (input->is_physical_key_pressed(KEY_D) || input->is_action_pressed("move_right")) {
			wish.x += 1.0f;
		}
		if (input->is_physical_key_pressed(KEY_W) || input->is_action_pressed("move_forward")) {
			wish.y -= 1.0f;
		}
		if (input->is_physical_key_pressed(KEY_S) || input->is_action_pressed("move_back")) {
			wish.y += 1.0f;
		}
		if (wish.length_squared() > 0.001f) {
			wish = wish.normalized();
		}
		if (input->is_action_just_pressed("dodge")) {
			try_dodge(wish);
		}
		if (input->is_action_just_pressed("attack")) {
			try_attack(nullptr);
		}
		if (input->is_action_just_pressed("skill_1")) {
			try_skill1();
		}
		if (input->is_action_just_pressed("skill_2")) {
			try_skill2();
		}
		if (input->is_action_just_pressed("ultimate")) {
			try_ultimate();
		}
	}

	if (player_controlled && !yield_to_ai) {
		move_wish = wish;
		advancing = wish.length_squared() > 0.001f;
	} else if (player_controlled) {
		advancing = false;
	}
	anim_time += (float)delta;
	if (strike > 0.0f) {
		strike = Math::max(0.0f, strike - (float)delta);
	}
	float speed = move_speed * (bless_timer > 0.0f ? 1.35f : 1.0f);
	if (dodge_timer > 0.0f) {
		dodge_timer = Math::max(0.0f, dodge_timer - (float)delta);
		set_velocity(get_velocity() * (1.0f - 2.2f * (float)delta));
	} else {
		Vector2 target = move_wish * speed;
		float blend = 1.0f - Math::exp(-12.0f * (float)delta);
		set_velocity(get_velocity().lerp(target, blend));
	}
	if (Math::abs(get_velocity().x) > 14.0f) {
		facing = get_velocity().x > 0.0f ? 1.0f : -1.0f;
	}
	move_and_slide();
}

void AeternaPawn::apply_damage(float amount) {
	if (!is_alive() || i_frames > 0.0f) {
		return;
	}
	float dealt = amount * incoming_mult;
	if (awaken_timer > 0.0f) {
		dealt *= 0.75f;
	}
	if (character_id == "athena" && shield_timer <= 0.0f) {
		incoming_mult = 0.82f;
		shield_timer = 1.2f;
	}
	hp = Math::max(0.0f, hp - dealt);
	i_frames = 0.08f;
	if (team == 0) {
		gain_awaken(4.0f);
	}
	if (hp <= 0.0f) {
		set_collision_layer(0);
		set_collision_mask(0);
	}
	if (hp <= 0.0f && pending_revive && character_id == "isis") {
		pending_revive = false;
		hp = max_hp * 0.35f;
	}
}

void AeternaPawn::heal(float amount) {
	if (!is_alive()) {
		return;
	}
	hp = Math::min(max_hp, hp + amount);
}

void AeternaPawn::add_ult(float amount) {
	float mul = (character_id == "newyork" || character_id == "freya") ? 1.25f : 1.0f;
	ult_charge = Math::min(100.0f, ult_charge + amount * mul);
}

void AeternaPawn::add_shield(float seconds, float mult) {
	shield_timer = seconds;
	incoming_mult = mult;
}

void AeternaPawn::add_counter(float seconds) { counter_timer = seconds; }
void AeternaPawn::set_capture_boost(float value) { capture_boost = value; }

void AeternaPawn::revive(float ratio) {
	if (hp <= 0.0f) {
		hp = max_hp * ratio;
		set_collision_layer(1);
		set_collision_mask(1);
	}
}

void AeternaPawn::command_attack() { try_attack(nullptr); }

void AeternaPawn::command_dodge() { try_dodge(Vector2(facing, 0.0f)); }

bool AeternaPawn::try_attack(AeternaPawn *target) {
	if (!is_alive() || attack_cd > 0.0f) {
		return false;
	}
	attack_cd = character_id == "edo" ? 0.32f : 0.42f;
	last_action = 1;
	strike = 0.2f;
	if (target && target->is_alive()) {
		look_at_x(target->get_global_position().x);
	}
	return true;
}

bool AeternaPawn::try_skill1() {
	if (!is_alive() || skill1_cd > 0.0f) {
		return false;
	}
	skill1_cd = 5.5f;
	last_action = 2;
	strike = 0.28f;
	add_ult(10.0f);
	return true;
}

bool AeternaPawn::try_skill2() {
	if (!is_alive() || skill2_cd > 0.0f) {
		return false;
	}
	skill2_cd = 7.5f;
	last_action = 3;
	strike = 0.28f;
	if (character_id == "amaterasu" || character_id == "isis" || character_id == "freya") {
		heal(18.0f);
		bless_timer = 3.0f;
	}
	if (character_id == "athena") {
		add_shield(3.5f, 0.55f);
		add_counter(3.5f);
	}
	add_ult(8.0f);
	return true;
}

bool AeternaPawn::try_ultimate() {
	if (!is_alive() || ult_charge < 100.0f) {
		return false;
	}
	ult_charge = 0.0f;
	last_action = 4;
	ult_flash = 0.8f;
	strike = 0.45f;
	i_frames = 0.45f;
	return true;
}

bool AeternaPawn::try_awaken() {
	if (!is_alive() || team != 0 || awaken_used || awaken_gauge < 100.0f) {
		return false;
	}
	awaken_used = true;
	awaken_gauge = 0.0f;
	awaken_timer = 12.0f;
	awaken_flash = 1.1f;
	strike = 0.45f;
	i_frames = 0.55f;
	heal(max_hp * (0.12f + 0.03f * float(awaken_rank)));
	return true;
}

void AeternaPawn::reward_xp(int amount) {
	if (team != 0 || amount <= 0 || xp_earned >= 64) {
		return;
	}
	int room = 64 - xp_earned;
	if (amount > room) {
		amount = room;
	}
	battle_xp += amount;
	xp_earned += amount;
}

int AeternaPawn::take_battle_xp() {
	int taken = battle_xp;
	battle_xp = 0;
	return taken;
}

void AeternaPawn::gain_awaken(float amount) {
	if (team != 0 || awaken_used || !is_alive() || amount <= 0.0f) {
		return;
	}
	awaken_gauge = Math::min(100.0f, awaken_gauge + amount);
}

bool AeternaPawn::grow_to_level(int new_level) {
	if (team != 0 || new_level <= growth_level) {
		return false;
	}
	auto mul_of = [](int level) {
		int safe = level < 1 ? 1 : level;
		int rank = safe >= 80 ? 4 : safe >= 60 ? 3 : safe >= 40 ? 2 : safe >= 20 ? 1 : 0;
		return (1.0f + 0.03f * float(safe - 1)) * (1.0f + 0.08f * float(rank));
	};
	float ratio = mul_of(new_level) / mul_of(growth_level);
	if (ratio < 1.0f) {
		ratio = 1.0f;
	}
	float before = max_hp;
	max_hp *= ratio;
	attack_damage *= ratio;
	hp = Math::min(max_hp, hp + (max_hp - before));
	int previous = awaken_rank;
	growth_level = new_level;
	awaken_rank = new_level >= 80 ? 4 : new_level >= 60 ? 3 : new_level >= 40 ? 2 : new_level >= 20 ? 1 : 0;
	level_banner = 1.5f;
	if (awaken_rank > previous) {
		awaken_banner = 1.8f;
		awaken_flash = 1.1f;
		heal(max_hp * 0.2f);
	}
	return true;
}

float AeternaPawn::outgoing_mul() const {
	if (awaken_timer <= 0.0f) {
		return 1.0f;
	}
	return 1.28f + 0.06f * float(awaken_rank);
}

bool AeternaPawn::try_dodge(const Vector2 &dir) {
	if (!is_alive() || dodge_cd > 0.0f) {
		return false;
	}
	dodge_cd = character_id == "edo" ? 0.85f : 1.15f;
	i_frames = 0.32f;
	Vector2 d = dir.length_squared() > 0.001f ? dir.normalized() : Vector2(facing, 0);
	impulse(d * 760.0f, 0.16f);
	return true;
}

void AeternaPawn::halt() {
	halted = true;
	move_wish = Vector2();
	strike = 0.0f;
	set_velocity(Vector2());
}

void AeternaPawn::command_move(const Vector2 &dir) {
	move_wish = dir.length_squared() > 0.01f ? dir.normalized() : Vector2();
}

void AeternaPawn::set_yield_to_ai(bool enabled) { yield_to_ai = enabled; }

void AeternaPawn::look_at_x(float x) {
	float dx = x - get_global_position().x;
	if (Math::abs(dx) > 6.0f) {
		facing = dx > 0.0f ? 1.0f : -1.0f;
	}
}

void AeternaPawn::impulse(const Vector2 &velocity, float seconds) {
	dodge_timer = seconds;
	set_velocity(velocity);
	strike = 0.16f;
	if (Math::abs(velocity.x) > 8.0f) {
		facing = velocity.x > 0.0f ? 1.0f : -1.0f;
	}
}

int AeternaPawn::get_team() const { return team; }
String AeternaPawn::get_character_id() const { return character_id; }
bool AeternaPawn::has_portrait() const { return portrait.is_valid(); }
bool AeternaPawn::is_player_controlled() const { return player_controlled; }
bool AeternaPawn::is_alive() const { return hp > 0.0f; }
float AeternaPawn::get_hp() const { return hp; }
float AeternaPawn::get_max_hp() const { return max_hp; }
float AeternaPawn::get_skill1_cd() const { return skill1_cd; }
float AeternaPawn::get_skill2_cd() const { return skill2_cd; }
float AeternaPawn::get_ult_charge() const { return ult_charge; }
float AeternaPawn::get_attack_range() const { return attack_range; }
float AeternaPawn::get_capture_boost() const { return capture_boost; }
float AeternaPawn::get_attack_damage() const { return attack_damage; }
bool AeternaPawn::has_counter() const { return counter_timer > 0.0f; }

Dictionary AeternaPawn::get_status() const {
	Dictionary d;
	d["id"] = character_id;
	d["team"] = team;
	d["hp"] = hp;
	d["max_hp"] = max_hp;
	d["skill1"] = skill1_cd;
	d["skill2"] = skill2_cd;
	d["ult"] = ult_charge;
	d["alive"] = is_alive();
	d["shield"] = shield_timer;
	d["level"] = growth_level;
	d["awaken"] = awaken_rank;
	d["awaken_gauge"] = awaken_gauge;
	d["awaken_used"] = awaken_used;
	d["awaken_left"] = awaken_timer;
	d["level_banner"] = level_banner;
	d["awaken_banner"] = awaken_banner;
	return d;
}

int AeternaPawn::consume_last_action() {
	int action = last_action;
	last_action = 0;
	return action;
}

bool AeternaPawn::has_pending_action() const { return last_action > 0; }

bool AeternaPawn::is_advancing() const { return advancing; }
