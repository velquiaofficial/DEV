#pragma once

#include <godot_cpp/classes/character_body2d.hpp>
#include <godot_cpp/classes/texture2d.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/string.hpp>

namespace godot {

class AeternaPawn : public CharacterBody2D {
	GDCLASS(AeternaPawn, CharacterBody2D);

	int team = 0;
	String character_id = "amaterasu";
	bool player_controlled = false;
	bool yield_to_ai = false;
	bool halted = false;
	bool advancing = false;

	float max_hp = 120.0f;
	float hp = 120.0f;
	float move_speed = 320.0f;
	float attack_damage = 14.0f;
	float attack_range = 96.0f;
	float attack_cd = 0.0f;
	float skill1_cd = 0.0f;
	float skill2_cd = 0.0f;
	float ult_charge = 0.0f;
	float ult_flash = 0.0f;
	int growth_level = 1;
	int awaken_rank = 0;
	float awaken_gauge = 0.0f;
	float awaken_timer = 0.0f;
	float awaken_flash = 0.0f;
	float level_banner = 0.0f;
	float awaken_banner = 0.0f;
	int battle_xp = 0;
	int xp_earned = 0;
	bool awaken_used = false;
	float dodge_cd = 0.0f;
	float i_frames = 0.0f;
	float bless_timer = 0.0f;
	float shield_timer = 0.0f;
	float counter_timer = 0.0f;
	float capture_boost = 1.0f;
	float incoming_mult = 1.0f;
	int last_action = 0;
	bool pending_revive = false;
	Color body_color = Color(0.94f, 0.93f, 0.88f);
	Color emit_color = Color(1.0f, 0.82f, 0.35f);
	godot::Ref<godot::Texture2D> portrait;
	Vector2 move_wish;
	float dodge_timer = 0.0f;
	float anim_time = 0.0f;
	float facing = 1.0f;
	float strike = 0.0f;

	void apply_kit_stats();
	void load_portrait();

protected:
	static void _bind_methods();

public:
	void _ready() override;
	void _physics_process(double delta) override;
	void _draw() override;

	void configure(int p_team, const String &p_id, bool p_player);
	void scale_power(float mul);
	void apply_damage(float amount);
	void heal(float amount);
	void add_ult(float amount);
	void add_shield(float seconds, float mult);
	void add_counter(float seconds);
	void set_capture_boost(float value);
	void revive(float ratio);
	bool try_attack(AeternaPawn *target);
	void command_attack();
	void command_dodge();
	bool try_skill1();
	bool try_skill2();
	bool try_ultimate();
	bool try_awaken();
	bool try_dodge(const Vector2 &dir);
	void reward_xp(int amount);
	int take_battle_xp();
	void gain_awaken(float amount);
	bool grow_to_level(int new_level);
	float outgoing_mul() const;
	void command_move(const Vector2 &dir);
	void halt();
	void set_yield_to_ai(bool enabled);
	void look_at_x(float x);
	void impulse(const Vector2 &velocity, float seconds);

	int get_team() const;
	String get_character_id() const;
	bool is_player_controlled() const;
	bool is_alive() const;
	float get_hp() const;
	float get_max_hp() const;
	float get_skill1_cd() const;
	float get_skill2_cd() const;
	float get_ult_charge() const;
	float get_attack_range() const;
	float get_capture_boost() const;
	float get_attack_damage() const;
	bool has_counter() const;
	bool has_portrait() const;
	Dictionary get_status() const;
	int consume_last_action();
	bool has_pending_action() const;
	bool is_advancing() const;
};

} // namespace godot
