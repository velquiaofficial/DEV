#pragma once

#include "core/catalog.hpp"
#include "core/progress_store.hpp"

#include <godot_cpp/classes/object.hpp>
#include <godot_cpp/variant/array.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/string.hpp>

namespace godot {

class AeternaSession : public Object {
	GDCLASS(AeternaSession, Object);

	aeterna::Catalog catalog;
	aeterna::ProgressStore store;

	void ensure_progress();

protected:
	static void _bind_methods();

public:
	void load_catalog(const String &path);
	bool is_catalog_loaded() const;
	Array get_roster() const;
	Array get_playable_roster() const;
	Dictionary get_character(const String &id) const;
	Array get_stories() const;
	Array get_chains() const;
	Array get_regions() const;
	Array get_belts() const;
	Array get_civilizations() const;
	Array get_eras() const;
	Array get_founders() const;
	Array get_roster_by_land(const String &land) const;
	Array get_roster_by_belt(const String &belt) const;
	Array get_roster_by_civilization(const String &civ) const;
	Dictionary get_civilization(const String &id) const;
	Array get_relics() const;
	Array get_fusions() const;
	Array get_chapters() const;
	Array get_areas() const;
	Array get_seed_cast() const;
	Dictionary get_relic(const String &id) const;
	Dictionary evaluate_fusion() const;
	Dictionary get_season() const;
	Dictionary get_gallery() const;

	void set_selected_id(const String &id);
	String get_selected_id() const;
	void set_party(const PackedStringArray &ids);
	PackedStringArray get_party() const;

	bool is_unlocked(const String &id) const;
	int get_fragments() const;
	int get_memory_rank(const String &id) const;
	bool unlock_character(const String &id);
	bool unlock_memory(const String &id);
	Dictionary get_loadout(const String &id) const;
	Dictionary evaluate_party() const;

	void collect_civilization(const String &civ);
	Dictionary get_restored() const;
	void mark_story(const String &id);
	bool is_story_read(const String &id) const;
	void mark_character_story(const String &id);

	void record_result(const Dictionary &result);
	Dictionary get_last_result() const;
	Dictionary get_progress() const;

	int get_bond(const String &id) const;
	int get_character_level(const String &id) const;
	int get_character_xp(const String &id) const;
	int xp_to_next(const String &id) const;
	int awaken_rank(const String &id) const;
	int bank_experience(const String &id, int amount);
	int add_experience(const String &id, int amount);
	int get_relic_level(const String &id) const;
	int get_civilization_level(const String &civ) const;
	bool raise_bond(const String &id);
	bool excavate_relic();
	void add_fragments(int amount);
	int level_cost(const String &id) const;
	bool raise_level(const String &id);
	void grant_level(const String &id);

	void save_progress();
	void load_progress();
};

} // namespace godot
