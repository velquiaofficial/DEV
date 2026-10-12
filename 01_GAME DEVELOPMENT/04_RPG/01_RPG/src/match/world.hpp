#pragma once

#include <godot_cpp/variant/array.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/string.hpp>
#include <godot_cpp/variant/vector2.hpp>

namespace godot {
class AeternaPawn;
class RelicShard;
} // namespace godot

namespace aeterna {

struct MatchWorld {
	godot::AeternaPawn *player = nullptr;
	godot::AeternaPawn *antagonist = nullptr;
	godot::Array allies;
	godot::Array foes;
	godot::Array relics;
	godot::Dictionary party_bonus;
	godot::Dictionary domain_shift;
	godot::String active_domain;
	godot::String enemy_domain;
	godot::PackedStringArray layers;
	godot::Dictionary fusion;
	godot::String pending_civ;
	float memory_wave = 0.0f;

	godot::AeternaPawn *nearest_foe(godot::AeternaPawn *src) const;
	godot::RelicShard *nearest_relic(const godot::Vector2 &from, int prefer_owner) const;
	int count_owned(int team) const;
	bool any_relicsia_alive() const;
};

} // namespace aeterna
