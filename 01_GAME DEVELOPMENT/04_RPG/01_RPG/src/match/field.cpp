#include "match/field.hpp"

#include "combat/pawn.hpp"
#include "core/session_access.hpp"
#include "match/kit_effects.hpp"
#include "match/match_ai.hpp"
#include "match/relic.hpp"

#include <godot_cpp/classes/collision_shape2d.hpp>
#include <godot_cpp/classes/rectangle_shape2d.hpp>
#include <godot_cpp/classes/static_body2d.hpp>
#include <godot_cpp/core/class_db.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>

using namespace godot;

void MemoryField::_bind_methods() {
	ClassDB::bind_method(D_METHOD("start_match"), &MemoryField::start_match);
	ClassDB::bind_method(D_METHOD("set_stage_foes", "ids", "label"), &MemoryField::set_stage_foes);
	ClassDB::bind_method(D_METHOD("set_stage_civ", "civ"), &MemoryField::set_stage_civ);
	ClassDB::bind_method(D_METHOD("set_stage_level", "level"), &MemoryField::set_stage_level);
	ClassDB::bind_method(D_METHOD("set_auto_mode", "enabled"), &MemoryField::set_auto_mode);
	ClassDB::bind_method(D_METHOD("is_auto_mode"), &MemoryField::is_auto_mode);
	ClassDB::bind_method(D_METHOD("is_running"), &MemoryField::is_running);
	ClassDB::bind_method(D_METHOD("is_finished"), &MemoryField::is_finished);
	ClassDB::bind_method(D_METHOD("get_winner_team"), &MemoryField::get_winner_team);
	ClassDB::bind_method(D_METHOD("get_snapshot"), &MemoryField::get_snapshot);
	ClassDB::bind_method(D_METHOD("activate_civilization", "civ"), &MemoryField::activate_civilization);
	ADD_SIGNAL(MethodInfo("match_ended", PropertyInfo(Variant::INT, "winner_team")));
	ADD_SIGNAL(MethodInfo("relic_captured", PropertyInfo(Variant::INT, "zone"), PropertyInfo(Variant::INT, "team")));
	ADD_SIGNAL(MethodInfo("civilization_restored", PropertyInfo(Variant::INT, "zone"), PropertyInfo(Variant::STRING, "civ")));
	ADD_SIGNAL(MethodInfo("era_shifted", PropertyInfo(Variant::STRING, "era")));
}

void MemoryField::_ready() { build_arena(); }

void MemoryField::add_wall(const Vector2 &pos, const Vector2 &size) {
	StaticBody2D *body = memnew(StaticBody2D);
	body->set_position(pos);
	CollisionShape2D *col = memnew(CollisionShape2D);
	Ref<RectangleShape2D> shape;
	shape.instantiate();
	shape->set_size(size);
	col->set_shape(shape);
	body->add_child(col);
	add_child(body);
}

void MemoryField::build_arena() {
	add_wall(Vector2(0, -720), Vector2(2200, 40));
	add_wall(Vector2(0, 720), Vector2(2200, 40));
	add_wall(Vector2(-1100, 0), Vector2(40, 1480));
	add_wall(Vector2(1100, 0), Vector2(40, 1480));
	queue_redraw();
}

void MemoryField::_draw() {
}

void MemoryField::spawn_combatants() {
	PackedStringArray party;
	party.push_back("amaterasu");
	if (AeternaSession *session = aeterna::session_or_null()) {
		if (!session->is_catalog_loaded()) {
			session->load_catalog("res://data/relicsia.json");
		}
		party = session->get_party();
		world.party_bonus = session->evaluate_party();
		world.fusion = session->evaluate_fusion();
	}
	if (party.is_empty()) {
		party.push_back("amaterasu");
	}
	party = pad_roster(party, PackedStringArray(), String());

	const Vector2 spots[6] = {
		Vector2(-210, -30), Vector2(-380, -30), Vector2(-550, -30),
		Vector2(-270, -230), Vector2(-440, -230), Vector2(-610, -230),
	};
	world.player = memnew(AeternaPawn);
	world.player->set_name("Player");
	world.player->configure(0, party[0], true);
	world.player->set_meta("form_slot", 0);
	world.player->set_meta("home", spots[0]);
	world.player->set_position(spots[0]);
	add_child(world.player);
	world.player->look_at_x(400.0f);

	for (int i = 1; i < party.size() && i < 6; i++) {
		AeternaPawn *ally = memnew(AeternaPawn);
		ally->set_name("Ally" + String::num_int64(i));
		ally->configure(0, party[i], false);
		ally->set_meta("form_slot", i);
		ally->set_meta("home", spots[i]);
		ally->set_position(spots[i]);
		add_child(ally);
		ally->look_at_x(400.0f);
		world.allies.append(ally);
	}

	world.foes.clear();
	PackedStringArray foes = staged_foes;
	if (foes.is_empty()) {
		foes = pick_auto_foes(party);
	} else if (!staged_label.is_empty()) {
		world.enemy_domain = staged_label;
	}
	foes = pad_roster(foes, party, staged_civ);
	const Vector2 foe_spots[6] = {
		Vector2(210, -30), Vector2(380, -30), Vector2(550, -30),
		Vector2(270, -230), Vector2(440, -230), Vector2(610, -230),
	};
	for (int i = 0; i < foes.size() && i < 6; i++) {
		AeternaPawn *foe = memnew(AeternaPawn);
		foe->configure(1, foes[i], false);
		float growth = 0.78f + 0.006f * float(staged_level - 1);
		if (growth > 1.35f) {
			growth = 1.35f;
		}
		foe->scale_power(growth);
		foe->set_meta("form_slot", i);
		foe->set_meta("home", foe_spots[i]);
		foe->set_position(foe_spots[i]);
		add_child(foe);
		foe->look_at_x(-400.0f);
		if (i == 0) {
			foe->set_name("Captain");
			world.antagonist = foe;
		} else {
			foe->set_name("Foe" + String::num_int64(i));
			world.foes.append(foe);
		}
	}
}

String MemoryField::civilization_label(const String &civ) const {
	String key = civ.to_upper();
	if (key == "YAMATO" || key == "JAPAN") {
		return "大和";
	}
	if (key == "HELLAS" || key == "GREECE") {
		return "ヘラス";
	}
	if (key == "KEMET" || key == "EGYPT") {
		return "ケメト";
	}
	if (key == "ROME" || key == "ROMA") {
		return "ローマ";
	}
	if (key == "HUAXIA" || key == "CHINA") {
		return "華夏";
	}
	if (key == "NORSE") {
		return "北欧";
	}
	if (key == "MESOPOTAMIA") {
		return "メソポタミア";
	}
	if (key == "CELTIC" || key == "CELT") {
		return "ケルト";
	}
	if (key == "TOKYO") {
		return "東京";
	}
	return civ;
}

String MemoryField::opposing_civilization(const String &ours, const PackedStringArray &civs) const {
	const char *cycle[] = {
		"YAMATO", "HELLAS", "KEMET", "ROME", "HUAXIA", "NORSE", "MESOPOTAMIA", "CELTIC", "TOKYO",
	};
	const int count = 9;
	int start = 0;
	String home = ours.to_upper();
	for (int i = 0; i < count; i++) {
		if (home == String(cycle[i])) {
			start = (i + 1) % count;
			break;
		}
	}
	for (int step = 0; step < count; step++) {
		String want = String(cycle[(start + step) % count]);
		if (want == home) {
			continue;
		}
		for (int i = 0; i < civs.size(); i++) {
			if (civs[i].to_upper() == want) {
				return civs[i];
			}
		}
	}
	for (int i = 0; i < civs.size(); i++) {
		if (civs[i].to_upper() != home && civs[i].to_upper() != "VOID") {
			return civs[i];
		}
	}
	return civs.is_empty() ? String("HELLAS") : civs[0];
}

PackedStringArray MemoryField::pick_auto_foes(const PackedStringArray &party) {
	Dictionary buckets;
	PackedStringArray civs;
	String ours = "YAMATO";
	AeternaSession *session = aeterna::session_or_null();
	if (session) {
		Dictionary lead = session->get_character(party[0]);
		String lead_civ = String(lead.get("civilization", ""));
		if (!lead_civ.is_empty()) {
			ours = lead_civ;
		}
		Array roster = session->get_playable_roster();
		for (int i = 0; i < roster.size(); i++) {
			Dictionary row = roster[i];
			String id = String(row.get("id", ""));
			String civ = String(row.get("civilization", ""));
			if (id.is_empty() || id == String("oblivion") || civ.is_empty() || civ.to_upper() == "VOID") {
				continue;
			}
			bool in_party = false;
			for (int p = 0; p < party.size(); p++) {
				if (party[p] == id) {
					in_party = true;
					break;
				}
			}
			if (in_party) {
				continue;
			}
			Array members = buckets.get(civ, Array());
			members.append(id);
			buckets[civ] = members;
			bool seen = false;
			for (int c = 0; c < civs.size(); c++) {
				if (civs[c] == civ) {
					seen = true;
					break;
				}
			}
			if (!seen) {
				civs.push_back(civ);
			}
		}
	}
	String foe_civ = opposing_civilization(ours, civs);
	world.enemy_domain = civilization_label(foe_civ);
	PackedStringArray out;
	Array chosen = buckets.get(foe_civ, Array());
	if (chosen.is_empty()) {
		for (int i = 0; i < civs.size(); i++) {
			Array members = buckets.get(civs[i], Array());
			if (members.size() > chosen.size()) {
				chosen = members;
				world.enemy_domain = civilization_label(civs[i]);
			}
		}
	}
	for (int i = 0; i < chosen.size() && i < 6; i++) {
		out.push_back(String(chosen[i]));
	}
	if (out.is_empty()) {
		world.enemy_domain = "ヘラス";
		out.push_back("athena");
		out.push_back("isis");
		out.push_back("anubis");
	}
	return out;
}

void MemoryField::spawn_relics() {
	const Vector2 spots[5] = {
		Vector2(0, 210),
		Vector2(-60, 250),
		Vector2(60, 250),
		Vector2(-30, 170),
		Vector2(30, 170),
	};
	const char *civs[5] = { "japan", "greece", "egypt", "norse", "mesopotamia" };
	for (int i = 0; i < 5; i++) {
		RelicShard *relic = memnew(RelicShard);
		relic->set_name("Relic_" + String::num_int64(i));
		add_child(relic);
		relic->setup(i, String(civs[i]), spots[i]);
		world.relics.append(relic);
	}
}

void MemoryField::set_stage_level(int level) {
	staged_level = level < 1 ? 1 : level;
}

void MemoryField::set_stage_foes(const PackedStringArray &ids, const String &label) {
	staged_foes = ids;
	staged_label = label;
}

void MemoryField::set_stage_civ(const String &civ) { staged_civ = civ; }

static bool list_has(const PackedStringArray &ids, const String &id) {
	for (int i = 0; i < ids.size(); i++) {
		if (ids[i] == id) {
			return true;
		}
	}
	return false;
}

PackedStringArray MemoryField::pad_roster(const PackedStringArray &seeds, const PackedStringArray &block, const String &civ) const {
	PackedStringArray out;
	auto push_unique = [&](const String &id) {
		if (id.is_empty() || id == String("oblivion") || list_has(block, id) || list_has(out, id) || out.size() >= 6) {
			return;
		}
		out.push_back(id);
	};
	for (int i = 0; i < seeds.size(); i++) {
		push_unique(seeds[i]);
	}
	const char *fallback[] = {
		"amaterasu", "tsukuyomi", "susanoo", "athena", "poseidon", "apollo",
		"artemis", "sparta", "minos", "roma", "venice", "anubis",
		"isis", "freya", "thor", "scathach", "ishtar", "xishi",
		"edo", "tokyo", "london", "paris", nullptr,
	};
	AeternaSession *session = aeterna::session_or_null();
	String want = civ.to_upper();
	if (session && session->is_catalog_loaded() && !want.is_empty()) {
		Array roster = session->get_playable_roster();
		for (int pass = 0; pass < 2 && out.size() < 6; pass++) {
			for (int i = 0; i < roster.size() && out.size() < 6; i++) {
				Dictionary row = roster[i];
				String id = String(row.get("id", ""));
				String row_civ = String(row.get("civilization", "")).to_upper();
				if (pass == 0 && row_civ != want) {
					continue;
				}
				push_unique(id);
			}
		}
	}
	for (int i = 0; fallback[i] != nullptr && out.size() < 6; i++) {
		push_unique(String(fallback[i]));
	}
	return out;
}

void MemoryField::set_auto_mode(bool enabled) { auto_mode = enabled; }

bool MemoryField::is_auto_mode() const { return auto_mode; }

void MemoryField::start_match() {
	if (running) {
		return;
	}
	spawn_combatants();
	spawn_relics();
	running = true;
	combat_started = true;
	finished = false;
	winner_team = -1;
	match_time = 0.0f;
	era.reset();
	world.layers = PackedStringArray();
	world.active_domain = String();
	world.domain_shift = Dictionary();
	world.pending_civ = String();
	world.memory_wave = 0.0f;
	queue_redraw();
}

void MemoryField::_physics_process(double delta) {
	if (!running || finished) {
		return;
	}
	if (!combat_started) {
		bool acted = world.player && (world.player->has_pending_action() || world.player->is_advancing());
		combat_started = auto_mode || acted;
	}
	if (!combat_started) {
		hold_line();
		return;
	}
	match_time += (float)delta;
	if (world.memory_wave > 0.0f) {
		world.memory_wave = Math::max(0.0f, world.memory_wave - (float)delta * 0.35f);
		queue_redraw();
	}
	if (era.tick(delta, bool(world.party_bonus.get("ult", false)))) {
		emit_signal("era_shifted", era.name());
		queue_redraw();
	}
	apply_passive_heals(delta);
	growth_tick += (float)delta;
	if (growth_tick >= 1.5f) {
		growth_tick = 0.0f;
		flush_growth(false);
	}
	update_captures(delta);
	resolve_actions();
	if (!world.pending_civ.is_empty()) {
		activate_civilization(world.pending_civ);
		world.pending_civ = String();
	}
	update_ai();
	check_victory();
}

void MemoryField::apply_civilization_shift(int team, const String &civ) {
	if (team != 0) {
		return;
	}
	world.active_domain = civ;
	bool have = false;
	for (int i = 0; i < world.layers.size(); i++) {
		if (world.layers[i] == civ) {
			have = true;
		}
	}
	if (!have) {
		world.layers.push_back(civ);
	}
	if (AeternaSession *session = aeterna::session_or_null()) {
		world.domain_shift = session->get_civilization(civ).get("civilization_shift", Dictionary());
		world.fusion = session->evaluate_fusion();
	}
	world.memory_wave = 1.0f;
	if ((civ == "greece" || civ == "HELLAS" || civ == "hellas") && world.player) {
		world.player->add_shield(6.0f, 0.85f);
	}
}

void MemoryField::apply_passive_heals(double delta) {
	if (!world.player || !world.player->is_alive()) {
		return;
	}
	float heal_mul = 1.0f + float(world.domain_shift.get("healing", 0)) / 100.0f;
	bool yamato_hero = world.player->get_character_id() == "amaterasu" || world.active_domain == "YAMATO";
	if (!yamato_hero && heal_mul <= 1.0f) {
		return;
	}
	for (int i = 0; i < world.relics.size(); i++) {
		RelicShard *relic = Object::cast_to<RelicShard>(world.relics[i]);
		if (relic && relic->get_owner_team() == 0 && world.player->get_global_position().distance_to(relic->get_global_position()) < 220.0f) {
			world.player->heal(3.0f * (float)delta * heal_mul);
		}
	}
}

void MemoryField::update_captures(double delta) {
	float era_mul = (era.get_index() == 1 || era.get_index() == 6) ? 1.15f : 1.0f;
	for (int i = 0; i < world.relics.size(); i++) {
		RelicShard *relic = Object::cast_to<RelicShard>(world.relics[i]);
		if (!relic) {
			continue;
		}
		bool ours = false;
		float our_boost = 1.0f;
		if (world.player && world.player->is_alive() && world.player->get_global_position().distance_to(relic->get_global_position()) <= relic->get_radius()) {
			ours = true;
			our_boost = Math::max(our_boost, world.player->get_capture_boost());
		}
		for (int a = 0; a < world.allies.size(); a++) {
			AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[a]);
			if (ally && ally->is_alive() && ally->get_global_position().distance_to(relic->get_global_position()) <= relic->get_radius()) {
				ours = true;
				our_boost = Math::max(our_boost, ally->get_capture_boost());
			}
		}
		bool foe = world.antagonist && world.antagonist->is_alive() && world.antagonist->get_global_position().distance_to(relic->get_global_position()) <= relic->get_radius();
		if (bool(world.party_bonus.get("capture", false))) {
			our_boost *= 1.2f;
		}
		our_boost *= 1.0f + float(world.domain_shift.get("relic_generation", 0)) / 100.0f;
		our_boost *= 1.0f + float(world.domain_shift.get("capture", 0)) / 100.0f;
		double step = delta * double(our_boost) * double(era_mul);
		if (ours && !foe) {
			relic->apply_presence(0, step, false);
		} else if (foe && !ours) {
			relic->apply_presence(1, delta, false);
		} else if (ours && foe) {
			relic->apply_presence(0, step, true);
		} else {
			relic->apply_presence(-1, delta, false);
		}

		int owner = relic->get_owner_team();
		if (owner != last_owner[i] && owner >= 0) {
			last_owner[i] = owner;
			restore_zone(i, owner, relic->get_civilization());
			emit_signal("relic_captured", i, owner);
			if (owner == 0) {
				emit_signal("civilization_restored", i, relic->get_civilization());
				if (world.player) {
					world.player->add_ult(14.0f);
					if (bool(world.party_bonus.get("heal", false))) {
						world.player->heal(12.0f);
					}
				}
			}
		}
	}
}

void MemoryField::restore_zone(int zone, int team, const String &civ) {
	if (zone < 0 || zone >= 5) {
		return;
	}
	last_owner[zone] = team;
	last_civ[zone] = civ;
	apply_civilization_shift(team, civ);
	queue_redraw();
}

void MemoryField::resolve_actions() {
	if (world.player) {
		aeterna::resolve_kit(world, world.player, world.player->consume_last_action());
	}
	for (int i = 0; i < world.allies.size(); i++) {
		AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[i]);
		if (ally) {
			aeterna::resolve_kit(world, ally, ally->consume_last_action());
		}
	}
	if (world.antagonist) {
		aeterna::resolve_kit(world, world.antagonist, world.antagonist->consume_last_action());
	}
	for (int i = 0; i < world.foes.size(); i++) {
		AeternaPawn *foe = Object::cast_to<AeternaPawn>(world.foes[i]);
		if (foe) {
			aeterna::resolve_kit(world, foe, foe->consume_last_action());
		}
	}
}

void MemoryField::hold_line() const {
	auto stop = [](AeternaPawn *pawn) {
		if (pawn && pawn->is_alive()) {
			pawn->command_move(Vector2());
		}
	};
	for (int i = 0; i < world.allies.size(); i++) {
		stop(Object::cast_to<AeternaPawn>(world.allies[i]));
	}
	stop(world.antagonist);
	for (int i = 0; i < world.foes.size(); i++) {
		stop(Object::cast_to<AeternaPawn>(world.foes[i]));
	}
}

bool MemoryField::player_engaged() const {
	if (!world.player || !world.player->is_alive()) {
		return false;
	}
	Vector2 pos = world.player->get_global_position();
	auto near = [&](AeternaPawn *pawn) {
		return pawn && pawn->is_alive() && pos.distance_to(pawn->get_global_position()) < 150.0f;
	};
	if (near(world.antagonist)) {
		return true;
	}
	for (int i = 0; i < world.foes.size(); i++) {
		if (near(Object::cast_to<AeternaPawn>(world.foes[i]))) {
			return true;
		}
	}
	return false;
}

void MemoryField::flush_growth(bool persist) {
	AeternaSession *session = aeterna::session_or_null();
	if (!session) {
		return;
	}
	bool dirty = false;
	bool leveled = false;
	auto apply = [&](AeternaPawn *pawn) {
		if (!pawn || pawn->get_team() != 0) {
			return;
		}
		int chunk = pawn->take_battle_xp();
		if (chunk <= 0) {
			return;
		}
		dirty = true;
		int level = session->bank_experience(pawn->get_character_id(), chunk);
		if (pawn->grow_to_level(level)) {
			leveled = true;
		}
	};
	apply(world.player);
	for (int i = 0; i < world.allies.size(); i++) {
		apply(Object::cast_to<AeternaPawn>(world.allies[i]));
	}
	if (dirty && (persist || leveled)) {
		session->save_progress();
	}
}

void MemoryField::update_ai() {
	if (world.player) {
		world.player->set_yield_to_ai(auto_mode);
	}
	if (!combat_started) {
		combat_started = auto_mode || player_engaged();
	}
	if (!combat_started) {
		hold_line();
		return;
	}
	int hands = auto_mode ? 2 : 0;
	aeterna::drive_ai(world, world.antagonist, true, 1);
	for (int i = 0; i < world.foes.size(); i++) {
		aeterna::drive_ai(world, Object::cast_to<AeternaPawn>(world.foes[i]), true, 1);
	}
	for (int i = 0; i < world.allies.size(); i++) {
		aeterna::drive_ai(world, Object::cast_to<AeternaPawn>(world.allies[i]), false, hands);
	}
	aeterna::drive_ai(world, world.player, false, hands);
}

bool MemoryField::any_enemy_alive() const {
	if (world.antagonist && world.antagonist->is_alive()) {
		return true;
	}
	for (int i = 0; i < world.foes.size(); i++) {
		AeternaPawn *foe = Object::cast_to<AeternaPawn>(world.foes[i]);
		if (foe && foe->is_alive()) {
			return true;
		}
	}
	return false;
}

void MemoryField::check_victory() {
	int p = world.count_owned(0);
	int v = world.count_owned(1);
	if (!world.any_relicsia_alive()) {
		finished = true;
		winner_team = 1;
	} else if (!any_enemy_alive()) {
		finished = true;
		winner_team = 0;
	} else if (match_time >= 300.0f) {
		finished = true;
		int ours = world.player && world.player->is_alive() ? 1 : 0;
		for (int i = 0; i < world.allies.size(); i++) {
			AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[i]);
			if (ally && ally->is_alive()) {
				ours++;
			}
		}
		int theirs = world.antagonist && world.antagonist->is_alive() ? 1 : 0;
		for (int i = 0; i < world.foes.size(); i++) {
			AeternaPawn *foe = Object::cast_to<AeternaPawn>(world.foes[i]);
			if (foe && foe->is_alive()) {
				theirs++;
			}
		}
		winner_team = ours >= theirs ? 0 : 1;
	}
	if (!finished) {
		return;
	}
	flush_growth(true);
	auto stop = [](AeternaPawn *pawn) {
		if (pawn) {
			pawn->halt();
		}
	};
	stop(world.player);
	stop(world.antagonist);
	for (int i = 0; i < world.allies.size(); i++) {
		stop(Object::cast_to<AeternaPawn>(world.allies[i]));
	}
	for (int i = 0; i < world.foes.size(); i++) {
		stop(Object::cast_to<AeternaPawn>(world.foes[i]));
	}
	Dictionary result;
	result["winner_team"] = winner_team;
	result["player_relics"] = p;
	result["void_relics"] = v;
	result["time"] = match_time;
	result["player_hp"] = world.player ? world.player->get_hp() : 0.0f;
	result["era"] = era.name();
	Array civs;
	for (int i = 0; i < world.relics.size(); i++) {
		RelicShard *relic = Object::cast_to<RelicShard>(world.relics[i]);
		if (relic && relic->get_owner_team() == 0) {
			civs.append(relic->get_civilization());
		}
	}
	result["restored_civs"] = civs;
	if (AeternaSession *session = aeterna::session_or_null()) {
		session->record_result(result);
	}
	emit_signal("match_ended", winner_team);
}

void MemoryField::activate_civilization(const String &civ) {
	apply_civilization_shift(0, civ);
	emit_signal("civilization_restored", 0, civ);
	queue_redraw();
}

bool MemoryField::is_running() const { return running; }
bool MemoryField::is_finished() const { return finished; }
int MemoryField::get_winner_team() const { return winner_team; }

Dictionary MemoryField::get_snapshot() const {
	Dictionary d;
	d["time"] = match_time;
	d["running"] = running;
	d["finished"] = finished;
	d["combat"] = combat_started;
	d["winner"] = winner_team;
	int ours = world.player && world.player->is_alive() ? 1 : 0;
	for (int i = 0; i < world.allies.size(); i++) {
		AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[i]);
		if (ally && ally->is_alive()) {
			ours++;
		}
	}
	int theirs = world.antagonist && world.antagonist->is_alive() ? 1 : 0;
	for (int i = 0; i < world.foes.size(); i++) {
		AeternaPawn *foe = Object::cast_to<AeternaPawn>(world.foes[i]);
		if (foe && foe->is_alive()) {
			theirs++;
		}
	}
	d["living_allies"] = ours;
	d["living_enemies"] = theirs;
	d["player_relics"] = world.count_owned(0);
	d["void_relics"] = world.count_owned(1);
	d["restoration"] = (float)world.count_owned(0) / 5.0f;
	d["relic_gauge"] = world.count_owned(0);
	d["civ_gauge"] = world.layers.size();
	d["memory_wave"] = world.memory_wave;
	d["era"] = era.name();
	d["domain"] = world.active_domain;
	d["enemy_domain"] = world.enemy_domain;
	d["layers"] = world.layers;
	d["fusion"] = world.fusion.get("name", String());
	d["chains"] = world.party_bonus.get("names", Array());
	if (world.player) {
		d["player"] = world.player->get_status();
	}
	if (world.antagonist) {
		d["void"] = world.antagonist->get_status();
	}
	Array ally_info;
	for (int i = 0; i < world.allies.size(); i++) {
		AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[i]);
		if (ally) {
			ally_info.append(ally->get_status());
		}
	}
	d["allies"] = ally_info;
	return d;
}
