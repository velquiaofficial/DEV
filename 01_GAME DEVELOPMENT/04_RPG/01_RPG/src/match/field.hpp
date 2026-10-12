#pragma once

#include "match/era_clock.hpp"
#include "match/world.hpp"

#include <godot_cpp/classes/node2d.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/string.hpp>

namespace godot {

class MemoryField : public Node2D {
	GDCLASS(MemoryField, Node2D);

	aeterna::MatchWorld world;
	aeterna::EraClock era;

	bool running = false;
	bool finished = false;
	bool auto_mode = false;
	bool combat_started = false;
	int winner_team = -1;
	float match_time = 0.0f;
	int last_owner[5] = { -1, -1, -1, -1, -1 };
	String last_civ[5];
	PackedStringArray staged_foes;
	String staged_label;
	String staged_civ;
	int staged_level = 1;
	float growth_tick = 0.0f;

	void flush_growth(bool persist);

	void build_arena();
	void spawn_combatants();
	PackedStringArray pick_auto_foes(const PackedStringArray &party);
	String opposing_civilization(const String &ours, const PackedStringArray &civs) const;
	String civilization_label(const String &civ) const;
	void spawn_relics();
	void update_captures(double delta);
	void resolve_actions();
	void update_ai();
	void hold_line() const;
	bool player_engaged() const;
	void restore_zone(int zone, int team, const String &civ);
	void check_victory();
	bool any_enemy_alive() const;
	void apply_passive_heals(double delta);
	void apply_civilization_shift(int team, const String &civ);
	void add_wall(const Vector2 &pos, const Vector2 &size);

protected:
	static void _bind_methods();

public:
	void _ready() override;
	void _physics_process(double delta) override;
	void _draw() override;

	void start_match();
	void set_stage_foes(const PackedStringArray &ids, const String &label);
	void set_stage_civ(const String &civ);
	void set_stage_level(int level);
	PackedStringArray pad_roster(const PackedStringArray &seeds, const PackedStringArray &block, const String &civ) const;
	void set_auto_mode(bool enabled);
	bool is_auto_mode() const;
	void activate_civilization(const String &civ);
	bool is_running() const;
	bool is_finished() const;
	int get_winner_team() const;
	Dictionary get_snapshot() const;
};

} // namespace godot
