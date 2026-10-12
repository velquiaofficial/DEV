#include "core/progress_store.hpp"

#include <godot_cpp/classes/file_access.hpp>
#include <godot_cpp/classes/json.hpp>

using namespace godot;

namespace aeterna {

static const char *SAVE_PATH = "user://aeterna_save.json";

static PackedStringArray as_ids(const Variant &raw) {
	PackedStringArray out;
	if (raw.get_type() == Variant::PACKED_STRING_ARRAY) {
		out = raw;
	} else if (raw.get_type() == Variant::ARRAY) {
		Array arr = raw;
		for (int i = 0; i < arr.size(); i++) {
			out.push_back(String(arr[i]));
		}
	}
	return out;
}

void ProgressStore::default_progress() {
	progress.clear();
	progress["fragments"] = 400;
	PackedStringArray unlocked;
	unlocked.push_back("amaterasu");
	unlocked.push_back("athena");
	unlocked.push_back("anubis");
	unlocked.push_back("ishtar");
	unlocked.push_back("scathach");
	unlocked.push_back("isis");
	unlocked.push_back("roma");
	unlocked.push_back("xishi");
	unlocked.push_back("edo");
	progress["unlocked"] = unlocked;
	Dictionary memories;
	memories["amaterasu"] = 1;
	progress["memories"] = memories;
	progress["restored"] = Dictionary();
	progress["stories"] = Dictionary();
	progress["char_stories"] = Dictionary();
	PackedStringArray party;
	party.push_back("amaterasu");
	party.push_back("tsukuyomi");
	party.push_back("susanoo");
	party.push_back("athena");
	party.push_back("anubis");
	party.push_back("ishtar");
	progress["party"] = party;
	progress["battle_party_v6"] = true;
	progress["selected"] = "amaterasu";
	progress["matches"] = 0;
	progress["wins"] = 0;
	progress["skins"] = Dictionary();
	progress["bonds"] = Dictionary();
	progress["char_levels"] = Dictionary();
	progress["relic_levels"] = Dictionary();
	progress["civ_levels"] = Dictionary();
	progress["excavated"] = PackedStringArray();
}

void ProgressStore::merge_seed_unlocks() {
	const char *seed[] = {
		"amaterasu", "athena", "anubis", "ishtar", "scathach", "edo", nullptr
	};
	PackedStringArray unlocked = as_ids(progress.get("unlocked", Array()));
	for (int i = 0; seed[i] != nullptr; i++) {
		String id = String(seed[i]);
		bool have = false;
		for (int u = 0; u < unlocked.size(); u++) {
			if (unlocked[u] == id) {
				have = true;
				break;
			}
		}
		if (!have) {
			unlocked.push_back(id);
		}
	}
	progress["unlocked"] = unlocked;
	if (int(progress.get("fragments", 0)) < 200) {
		progress["fragments"] = 400;
	}
	if (!progress.has("bonds")) {
		progress["bonds"] = Dictionary();
	}
	if (!progress.has("char_levels")) {
		progress["char_levels"] = Dictionary();
	}
	if (!progress.has("relic_levels")) {
		progress["relic_levels"] = Dictionary();
	}
	if (!progress.has("civ_levels")) {
		progress["civ_levels"] = Dictionary();
	}
	if (!bool(progress.get("battle_party_v6", false))) {
		const char *cast[] = { "amaterasu", "tsukuyomi", "susanoo", "athena", "anubis", "ishtar", nullptr };
		PackedStringArray party = as_ids(progress.get("party", Array()));
		for (int i = 0; cast[i] != nullptr && party.size() < 6; i++) {
			String id = String(cast[i]);
			bool have = false;
			for (int u = 0; u < party.size(); u++) {
				if (party[u] == id) {
					have = true;
					break;
				}
			}
			if (!have) {
				party.push_back(id);
			}
		}
		progress["party"] = party;
		progress["battle_party_v6"] = true;
		save();
	}
}

void ProgressStore::unlock_ids(const PackedStringArray &ids) {
	ensure();
	PackedStringArray unlocked = as_ids(progress.get("unlocked", Array()));
	bool changed = false;
	for (int i = 0; i < ids.size(); i++) {
		String id = ids[i];
		if (id.is_empty() || id == String("oblivion")) {
			continue;
		}
		bool have = false;
		for (int u = 0; u < unlocked.size(); u++) {
			if (unlocked[u] == id) {
				have = true;
				break;
			}
		}
		if (!have) {
			unlocked.push_back(id);
			changed = true;
		}
	}
	if (!changed) {
		return;
	}
	progress["unlocked"] = unlocked;
	save();
}

void ProgressStore::ensure() {
	if (progress.is_empty()) {
		load();
	}
	if (progress.is_empty()) {
		default_progress();
	}
}

void ProgressStore::save() const {
	Ref<FileAccess> file = FileAccess::open(SAVE_PATH, FileAccess::WRITE);
	if (file.is_null()) {
		return;
	}
	file->store_string(JSON::stringify(progress));
}

void ProgressStore::load() {
	if (!FileAccess::file_exists(SAVE_PATH)) {
		default_progress();
		return;
	}
	Ref<FileAccess> file = FileAccess::open(SAVE_PATH, FileAccess::READ);
	if (file.is_null()) {
		default_progress();
		return;
	}
	Ref<JSON> json;
	json.instantiate();
	if (json->parse(file->get_as_text()) != OK) {
		default_progress();
		return;
	}
	Variant data = json->get_data();
	if (data.get_type() == Variant::DICTIONARY) {
		progress = data;
		merge_seed_unlocks();
	} else {
		default_progress();
	}
}

Dictionary ProgressStore::get_progress() const { return progress; }
Dictionary ProgressStore::get_last_result() const { return last_result; }
void ProgressStore::set_last_result(const Dictionary &result) { last_result = result; }

void ProgressStore::set_selected_id(const String &id) {
	ensure();
	progress["selected"] = id;
	save();
}

String ProgressStore::get_selected_id() const {
	return progress.get("selected", "amaterasu");
}

void ProgressStore::set_party(const PackedStringArray &ids) {
	ensure();
	PackedStringArray clean;
	for (int i = 0; i < ids.size() && clean.size() < 3; i++) {
		String id = ids[i];
		if (id.is_empty() || !is_unlocked(id)) {
			continue;
		}
		bool dup = false;
		for (int j = 0; j < clean.size(); j++) {
			if (clean[j] == id) {
				dup = true;
			}
		}
		if (!dup) {
			clean.push_back(id);
		}
	}
	if (clean.is_empty()) {
		clean.push_back("amaterasu");
	}
	progress["party"] = clean;
	progress["selected"] = clean[0];
	save();
}

PackedStringArray ProgressStore::get_party() const {
	PackedStringArray party = as_ids(progress.get("party", Array()));
	if (party.is_empty()) {
		party.push_back("amaterasu");
	}
	return party;
}

bool ProgressStore::is_unlocked(const String &id) const {
	PackedStringArray unlocked = as_ids(progress.get("unlocked", Array()));
	for (int i = 0; i < unlocked.size(); i++) {
		if (unlocked[i] == id) {
			return true;
		}
	}
	return id == "amaterasu";
}

int ProgressStore::get_fragments() const {
	return int(progress.get("fragments", 0));
}

void ProgressStore::set_fragments(int value) {
	progress["fragments"] = value;
}

int ProgressStore::get_memory_rank(const String &id) const {
	Dictionary memories = progress.get("memories", Dictionary());
	return int(memories.get(id, 0));
}

bool ProgressStore::unlock_character(const String &id) {
	ensure();
	if (is_unlocked(id) || id == "oblivion") {
		return false;
	}
	int cost = 80;
	int frag = get_fragments();
	if (frag < cost) {
		return false;
	}
	progress["fragments"] = frag - cost;
	PackedStringArray unlocked = as_ids(progress.get("unlocked", Array()));
	unlocked.push_back(id);
	progress["unlocked"] = unlocked;
	save();
	return true;
}

bool ProgressStore::unlock_memory(const String &id) {
	ensure();
	if (!is_unlocked(id)) {
		return false;
	}
	int rank = get_memory_rank(id);
	if (rank >= 3) {
		return false;
	}
	int cost = 30 + rank * 20;
	int frag = get_fragments();
	if (frag < cost) {
		return false;
	}
	progress["fragments"] = frag - cost;
	Dictionary memories = progress.get("memories", Dictionary());
	memories[id] = rank + 1;
	progress["memories"] = memories;
	save();
	return true;
}

void ProgressStore::collect_civilization(const String &civ) {
	ensure();
	Dictionary restored = progress.get("restored", Dictionary());
	restored[civ] = int(restored.get(civ, 0)) + 1;
	progress["restored"] = restored;
	Dictionary levels = progress.get("civ_levels", Dictionary());
	levels[civ] = int(levels.get(civ, 0)) + 1;
	progress["civ_levels"] = levels;
}

Dictionary ProgressStore::get_restored() const {
	return progress.get("restored", Dictionary());
}

void ProgressStore::mark_story(const String &id) {
	ensure();
	Dictionary stories_read = progress.get("stories", Dictionary());
	stories_read[id] = true;
	progress["stories"] = stories_read;
	save();
}

bool ProgressStore::is_story_read(const String &id) const {
	Dictionary stories_read = progress.get("stories", Dictionary());
	return bool(stories_read.get(id, false));
}

void ProgressStore::mark_character_story(const String &id) {
	ensure();
	Dictionary cs = progress.get("char_stories", Dictionary());
	cs[id] = true;
	progress["char_stories"] = cs;
	save();
}

void ProgressStore::add_match(bool win) {
	ensure();
	progress["matches"] = int(progress.get("matches", 0)) + 1;
	if (win) {
		progress["wins"] = int(progress.get("wins", 0)) + 1;
	}
}

int ProgressStore::get_bond(const String &id) const {
	Dictionary bonds = progress.get("bonds", Dictionary());
	return int(bonds.get(id, 0));
}

int ProgressStore::get_character_level(const String &id) const {
	Dictionary levels = progress.get("char_levels", Dictionary());
	return int(levels.get(id, 1));
}

int ProgressStore::get_character_xp(const String &id) const {
	Dictionary xp = progress.get("char_xp", Dictionary());
	return int(xp.get(id, 0));
}

int ProgressStore::xp_to_next(const String &id) const {
	int level = get_character_level(id);
	if (level >= 80) {
		return 0;
	}
	return 30 + level * 20;
}

int ProgressStore::awaken_rank(const String &id) const {
	return awaken_rank_for_level(get_character_level(id));
}

int ProgressStore::bank_experience(const String &id, int amount) {
	ensure();
	int level = get_character_level(id);
	if (id.is_empty() || amount <= 0) {
		return level;
	}
	Dictionary xp = progress.get("char_xp", Dictionary());
	Dictionary levels = progress.get("char_levels", Dictionary());
	int have = int(xp.get(id, 0)) + amount;
	while (level < 80) {
		int need = 30 + level * 20;
		if (have < need) {
			break;
		}
		have -= need;
		level += 1;
	}
	if (level >= 80) {
		have = 0;
	}
	xp[id] = have;
	levels[id] = level;
	progress["char_xp"] = xp;
	progress["char_levels"] = levels;
	return level;
}

int ProgressStore::add_experience(const String &id, int amount) {
	int before = get_character_level(id);
	int level = bank_experience(id, amount);
	if (amount > 0 && !id.is_empty()) {
		save();
	}
	return level > before ? level - before : 0;
}

int ProgressStore::get_relic_level(const String &id) const {
	Dictionary levels = progress.get("relic_levels", Dictionary());
	return int(levels.get(id, 1));
}

int ProgressStore::get_civilization_level(const String &civ) const {
	Dictionary levels = progress.get("civ_levels", Dictionary());
	return int(levels.get(civ, 0));
}

bool ProgressStore::raise_bond(const String &id) {
	ensure();
	int frag = get_fragments();
	if (frag < 20) {
		return false;
	}
	progress["fragments"] = frag - 20;
	Dictionary bonds = progress.get("bonds", Dictionary());
	bonds[id] = int(bonds.get(id, 0)) + 1;
	progress["bonds"] = bonds;
	save();
	return true;
}

void ProgressStore::add_fragments(int amount) {
	ensure();
	int next = get_fragments() + amount;
	if (next < 0) {
		next = 0;
	}
	progress["fragments"] = next;
	save();
}

int ProgressStore::level_cost(const String &id) const {
	int level = get_character_level(id);
	if (level >= 80) {
		return 0;
	}
	return 10 + level * 6;
}

bool ProgressStore::raise_level(const String &id) {
	ensure();
	int level = get_character_level(id);
	int cost = level_cost(id);
	if (cost <= 0 || get_fragments() < cost) {
		return false;
	}
	progress["fragments"] = get_fragments() - cost;
	Dictionary levels = progress.get("char_levels", Dictionary());
	levels[id] = level + 1;
	progress["char_levels"] = levels;
	save();
	return true;
}

void ProgressStore::grant_level(const String &id) {
	ensure();
	int level = get_character_level(id);
	if (level >= 80) {
		return;
	}
	Dictionary levels = progress.get("char_levels", Dictionary());
	levels[id] = level + 1;
	progress["char_levels"] = levels;
	save();
}

bool ProgressStore::excavate_relic() {
	ensure();
	int frag = get_fragments();
	if (frag < 40) {
		return false;
	}
	progress["fragments"] = frag - 40;
	PackedStringArray dug = as_ids(progress.get("excavated", Array()));
	dug.push_back("relic_" + String::num_int64(dug.size() + 1));
	progress["excavated"] = dug;
	save();
	return true;
}

} // namespace aeterna
