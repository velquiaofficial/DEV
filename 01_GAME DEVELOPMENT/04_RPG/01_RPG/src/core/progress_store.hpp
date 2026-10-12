#pragma once

#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/string.hpp>
#include <godot_cpp/variant/variant.hpp>

namespace aeterna {

inline int awaken_rank_for_level(int level) {
	if (level >= 80) {
		return 4;
	}
	if (level >= 60) {
		return 3;
	}
	if (level >= 40) {
		return 2;
	}
	if (level >= 20) {
		return 1;
	}
	return 0;
}

class ProgressStore {
	godot::Dictionary progress;
	godot::Dictionary last_result;

	void default_progress();
	void merge_seed_unlocks();

public:
	void ensure();
	void save() const;
	void load();

	godot::Dictionary get_progress() const;
	godot::Dictionary get_last_result() const;
	void set_last_result(const godot::Dictionary &result);

	void set_selected_id(const godot::String &id);
	godot::String get_selected_id() const;
	void set_party(const godot::PackedStringArray &ids);
	godot::PackedStringArray get_party() const;

	bool is_unlocked(const godot::String &id) const;
	void unlock_ids(const godot::PackedStringArray &ids);
	int get_fragments() const;
	void set_fragments(int value);
	int get_memory_rank(const godot::String &id) const;
	bool unlock_character(const godot::String &id);
	bool unlock_memory(const godot::String &id);

	void collect_civilization(const godot::String &civ);
	godot::Dictionary get_restored() const;
	void mark_story(const godot::String &id);
	bool is_story_read(const godot::String &id) const;
	void mark_character_story(const godot::String &id);

	void add_match(bool win);

	int get_bond(const godot::String &id) const;
	int get_character_level(const godot::String &id) const;
	int get_character_xp(const godot::String &id) const;
	int xp_to_next(const godot::String &id) const;
	int awaken_rank(const godot::String &id) const;
	int bank_experience(const godot::String &id, int amount);
	int add_experience(const godot::String &id, int amount);
	int get_relic_level(const godot::String &id) const;
	int get_civilization_level(const godot::String &civ) const;
	bool raise_bond(const godot::String &id);
	bool excavate_relic();
	void add_fragments(int amount);
	int level_cost(const godot::String &id) const;
	bool raise_level(const godot::String &id);
	void grant_level(const godot::String &id);
};

} // namespace aeterna
