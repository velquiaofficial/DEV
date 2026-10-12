#pragma once

#include "core/session.hpp"

#include <godot_cpp/classes/engine.hpp>

namespace aeterna {

inline godot::AeternaSession *session_or_null() {
	godot::Engine *engine = godot::Engine::get_singleton();
	if (!engine || !engine->has_singleton("AeternaSession")) {
		return nullptr;
	}
	return godot::Object::cast_to<godot::AeternaSession>(engine->get_singleton("AeternaSession"));
}

} // namespace aeterna
