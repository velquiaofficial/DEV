#pragma once

#include <godot_cpp/variant/color.hpp>
#include <godot_cpp/variant/string.hpp>

namespace aeterna {

struct KitLook {
	godot::Color body = godot::Color(0.94f, 0.93f, 0.88f);
	godot::Color emit = godot::Color(1.0f, 0.82f, 0.35f);
};

struct KitTune {
	float attack_range = 96.0f;
	float speed_mul = 1.0f;
	bool pending_revive = false;
	bool override_combat = false;
	float max_hp = 0.0f;
	float move_speed = 0.0f;
	float attack_damage = 0.0f;
};

KitLook look_for(const godot::String &id);
KitTune tune_for(const godot::String &id);

} // namespace aeterna
