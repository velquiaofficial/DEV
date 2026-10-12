#include "combat/kit_palette.hpp"

#include "core/session_access.hpp"

using namespace godot;

namespace aeterna {

static Color color_from_variant(const Variant &value, const Color &fallback) {
	if (value.get_type() == Variant::ARRAY) {
		Array arr = value;
		if (arr.size() >= 3) {
			return Color(float(arr[0]), float(arr[1]), float(arr[2]));
		}
	}
	return fallback;
}

KitLook look_for(const String &id) {
	if (AeternaSession *session = session_or_null()) {
		Dictionary entry = session->get_character(id);
		Dictionary colors = entry.get(String("colors"), Dictionary());
		if (!colors.is_empty()) {
			KitLook look;
			look.body = color_from_variant(colors.get(String("body"), Array()), look.body);
			look.emit = color_from_variant(colors.get(String("emit"), Array()), look.emit);
			return look;
		}
	}
	KitLook look;
	if (id == "amaterasu") {
		look.body = Color(0.94f, 0.93f, 0.88f);
		look.emit = Color(1.0f, 0.82f, 0.35f);
	} else if (id == "tsukuyomi") {
		look.body = Color(0.18f, 0.2f, 0.32f);
		look.emit = Color(0.55f, 0.65f, 1.0f);
	} else if (id == "athena") {
		look.body = Color(0.86f, 0.88f, 0.92f);
		look.emit = Color(0.45f, 0.62f, 0.95f);
	} else if (id == "isis") {
		look.body = Color(0.08f, 0.12f, 0.22f);
		look.emit = Color(0.25f, 0.55f, 0.95f);
	} else if (id == "anubis") {
		look.body = Color(0.12f, 0.08f, 0.05f);
		look.emit = Color(0.85f, 0.62f, 0.15f);
	} else if (id == "roma") {
		look.body = Color(0.62f, 0.12f, 0.14f);
		look.emit = Color(0.9f, 0.72f, 0.28f);
	} else if (id == "freya") {
		look.body = Color(0.72f, 0.28f, 0.38f);
		look.emit = Color(0.95f, 0.55f, 0.7f);
	} else if (id == "edo") {
		look.body = Color(0.1f, 0.08f, 0.09f);
		look.emit = Color(0.85f, 0.18f, 0.28f);
	} else if (id == "venice") {
		look.body = Color(0.25f, 0.42f, 0.48f);
		look.emit = Color(0.55f, 0.85f, 0.9f);
	} else if (id == "london") {
		look.body = Color(0.22f, 0.24f, 0.28f);
		look.emit = Color(0.7f, 0.75f, 0.82f);
	} else if (id == "tokyo") {
		look.body = Color(0.08f, 0.1f, 0.16f);
		look.emit = Color(0.2f, 0.85f, 0.95f);
	} else if (id == "newyork") {
		look.body = Color(0.15f, 0.18f, 0.28f);
		look.emit = Color(0.95f, 0.85f, 0.35f);
	} else {
		look.body = Color(0.07f, 0.07f, 0.09f);
		look.emit = Color(0.7f, 0.08f, 0.16f);
	}
	return look;
}

KitTune tune_for(const String &id) {
	KitTune tune;
	if (id == "edo") {
		tune.attack_range = 78.0f;
		tune.speed_mul = 1.08f;
	} else if (id == "roma" || id == "athena") {
		tune.attack_range = 110.0f;
	} else if (id == "oblivion") {
		tune.override_combat = true;
		tune.max_hp = 280.0f;
		tune.move_speed = 250.0f;
		tune.attack_damage = 16.0f;
		tune.attack_range = 120.0f;
	} else if (id == "isis") {
		tune.pending_revive = true;
	}
	return tune;
}

} // namespace aeterna
