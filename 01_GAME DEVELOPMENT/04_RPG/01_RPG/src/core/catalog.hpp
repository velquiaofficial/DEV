#pragma once

#include <godot_cpp/variant/array.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/string.hpp>
#include <godot_cpp/variant/variant.hpp>

namespace aeterna {

class Catalog {
	godot::Array characters;
	godot::Array chains;
	godot::Array stories;
	godot::Array regions;
	godot::Array civilizations;
	godot::Array eras;
	godot::Array founders;
	godot::Array relics;
	godot::Array fusions;
	godot::Array chapters;
	godot::Array areas;
	godot::Array seed_cast;
	godot::Dictionary season;
	godot::Dictionary gallery;
	bool loaded = false;

public:
	bool load(const godot::String &path);
	bool is_loaded() const;
	godot::Array roster() const;
	godot::Array playable() const;
	godot::Dictionary character(const godot::String &id) const;
	godot::Dictionary civilization(const godot::String &id) const;
	godot::Array get_stories() const;
	godot::Array get_chains() const;
	godot::Array get_regions() const;
	godot::Array get_civilizations() const;
	godot::Array get_eras() const;
	godot::Array get_founders() const;
	godot::Array get_relics() const;
	godot::Array get_fusions() const;
	godot::Array get_chapters() const;
	godot::Array get_areas() const;
	godot::Array get_seed_cast() const;
	godot::Dictionary relic(const godot::String &id) const;
	godot::Dictionary evaluate_fusion(const godot::PackedStringArray &party) const;
	godot::Array by_land(const godot::String &land) const;
	godot::Dictionary get_season() const;
	godot::Dictionary get_gallery() const;
};

} // namespace aeterna
