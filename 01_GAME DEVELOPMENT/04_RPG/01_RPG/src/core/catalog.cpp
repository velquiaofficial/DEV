#include "core/catalog.hpp"

#include <godot_cpp/classes/file_access.hpp>
#include <godot_cpp/classes/json.hpp>
#include <godot_cpp/variant/utility_functions.hpp>

using namespace godot;

namespace aeterna {

bool Catalog::load(const String &path) {
	Ref<FileAccess> file = FileAccess::open(path, FileAccess::READ);
	if (file.is_null()) {
		UtilityFunctions::push_error("AeternaSession: failed to open " + path);
		return false;
	}
	Ref<JSON> json;
	json.instantiate();
	if (json->parse(file->get_as_text()) != OK) {
		UtilityFunctions::push_error("AeternaSession: JSON parse failed");
		return false;
	}
	Variant data = json->get_data();
	if (data.get_type() != Variant::DICTIONARY) {
		return false;
	}
	Dictionary root = data;
	characters = root.get("characters", Array());
	chains = root.get("chains", Array());
	stories = root.get("stories", Array());
	civilizations = root.get("civilizations", Array());
	regions = civilizations;
	if (regions.is_empty()) {
		regions = root.get("belts", Array());
	}
	if (regions.is_empty()) {
		regions = root.get("regions", Array());
	}
	if (civilizations.is_empty()) {
		civilizations = regions;
	}
	eras = root.get("eras", Array());
	founders = root.get("founders", Array());
	relics = root.get("relics", Array());
	fusions = root.get("fusions", Array());
	chapters = root.get("chapters", Array());
	areas = root.get("areas", Array());
	seed_cast = root.get("seed_cast", Array());
	season = root.get("season", Dictionary());
	gallery = root.get("gallery", Dictionary());
	loaded = true;
	return true;
}

bool Catalog::is_loaded() const { return loaded; }
Array Catalog::roster() const { return characters; }
Array Catalog::get_stories() const { return stories; }
Array Catalog::get_chains() const { return chains; }
Array Catalog::get_regions() const { return regions; }
Array Catalog::get_civilizations() const { return civilizations; }
Array Catalog::get_eras() const { return eras; }
Array Catalog::get_founders() const { return founders; }
Array Catalog::get_relics() const { return relics; }
Array Catalog::get_fusions() const { return fusions; }
Array Catalog::get_chapters() const { return chapters; }
Array Catalog::get_areas() const { return areas; }
Array Catalog::get_seed_cast() const { return seed_cast; }
Dictionary Catalog::get_season() const { return season; }
Dictionary Catalog::get_gallery() const { return gallery; }

Array Catalog::by_land(const String &land) const {
	Array out;
	if (land.is_empty() || land == String("all")) {
		return playable();
	}
	for (int i = 0; i < characters.size(); i++) {
		Dictionary entry = characters[i];
		String id = entry.get(String("id"), String());
		if (id == String("oblivion")) {
			continue;
		}
		String belt = entry.get(String("belt"), String());
		String home = entry.get(String("land"), String());
		String civ = entry.get(String("civilization"), String());
		String civ_id = entry.get(String("civilization_id"), String());
		String civ_key = entry.get(String("civ"), String());
		if (belt == land || home == land || civ == land || civ_id == land || civ_key == land || civ.to_lower() == land.to_lower()) {
			out.append(entry);
		}
	}
	return out;
}

Array Catalog::playable() const {
	Array out;
	for (int i = 0; i < characters.size(); i++) {
		Dictionary entry = characters[i];
		if (String(entry.get("id", "")) == String("oblivion")) {
			continue;
		}
		out.append(entry);
	}
	return out;
}

Dictionary Catalog::character(const String &id) const {
	for (int i = 0; i < characters.size(); i++) {
		Dictionary entry = characters[i];
		if (String(entry.get("id", "")) == id || String(entry.get("uid", "")) == id) {
			return entry;
		}
	}
	return Dictionary();
}

Dictionary Catalog::civilization(const String &id) const {
	for (int i = 0; i < civilizations.size(); i++) {
		Dictionary entry = civilizations[i];
		String cid = entry.get(String("id"), String());
		String code = entry.get(String("code"), String());
		String key = entry.get(String("civ"), String());
		if (cid == id || code == id || key == id || code.to_lower() == id.to_lower()) {
			return entry;
		}
	}
	return Dictionary();
}

Dictionary Catalog::relic(const String &id) const {
	for (int i = 0; i < relics.size(); i++) {
		Dictionary entry = relics[i];
		if (String(entry.get("id", "")) == id) {
			return entry;
		}
	}
	return Dictionary();
}

Dictionary Catalog::evaluate_fusion(const PackedStringArray &party) const {
	Dictionary out;
	out[String("id")] = String();
	out[String("name")] = String();
	Array features;
	PackedStringArray civs;
	for (int i = 0; i < party.size(); i++) {
		Dictionary ch = character(party[i]);
		String key = ch.get(String("civ"), String());
		if (key.is_empty()) {
			continue;
		}
		bool seen = false;
		for (int c = 0; c < civs.size(); c++) {
			if (civs[c] == key) {
				seen = true;
			}
		}
		if (!seen) {
			civs.push_back(key);
		}
	}
	for (int f = 0; f < fusions.size(); f++) {
		Dictionary fusion = fusions[f];
		Array members = fusion.get("members", Array());
		int hit = 0;
		for (int m = 0; m < members.size(); m++) {
			for (int c = 0; c < civs.size(); c++) {
				if (String(members[m]) == civs[c]) {
					hit++;
				}
			}
		}
		if (hit >= members.size() && members.size() >= 2) {
			out[String("id")] = fusion.get("id", String());
			out[String("name")] = fusion.get("name_ja", String());
			out[String("text")] = fusion.get("text", String());
			out[String("buff")] = fusion.get("buff", Dictionary());
			out[String("features")] = fusion.get("features", Array());
			break;
		}
	}
	out[String("civs")] = civs;
	return out;
}

} // namespace aeterna
