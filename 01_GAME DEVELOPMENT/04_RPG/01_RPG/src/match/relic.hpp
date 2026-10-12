#pragma once

#include <godot_cpp/classes/node2d.hpp>

namespace godot {

class RelicShard : public Node2D {
	GDCLASS(RelicShard, Node2D);

	int owner_team = -1;
	int contest_team = -1;
	float capture_progress = 0.0f;
	float capture_time = 2.2f;
	float radius = 128.0f;
	int zone_index = 0;
	String civilization = "amaterasu";
	float spin_t = 0.0f;

protected:
	static void _bind_methods();

public:
	void _ready() override;
	void _process(double delta) override;
	void _draw() override;

	void setup(int p_zone, const String &p_civ, const Vector2 &p_origin);
	void apply_presence(int team, double delta, bool contested);
	void force_capture(int team);

	int get_owner_team() const;
	int get_contest_team() const;
	float get_progress() const;
	float get_radius() const;
	int get_zone_index() const;
	String get_civilization() const;
};

} // namespace godot
