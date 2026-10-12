#include "core/session.hpp"

#include "core/chain_eval.hpp"

#include <godot_cpp/core/class_db.hpp>

using namespace godot;

void AeternaSession::_bind_methods() {
	ClassDB::bind_method(D_METHOD("load_catalog", "path"), &AeternaSession::load_catalog);
	ClassDB::bind_method(D_METHOD("is_catalog_loaded"), &AeternaSession::is_catalog_loaded);
	ClassDB::bind_method(D_METHOD("get_roster"), &AeternaSession::get_roster);
	ClassDB::bind_method(D_METHOD("get_playable_roster"), &AeternaSession::get_playable_roster);
	ClassDB::bind_method(D_METHOD("get_character", "id"), &AeternaSession::get_character);
	ClassDB::bind_method(D_METHOD("get_stories"), &AeternaSession::get_stories);
	ClassDB::bind_method(D_METHOD("get_chains"), &AeternaSession::get_chains);
	ClassDB::bind_method(D_METHOD("get_regions"), &AeternaSession::get_regions);
	ClassDB::bind_method(D_METHOD("get_belts"), &AeternaSession::get_belts);
	ClassDB::bind_method(D_METHOD("get_civilizations"), &AeternaSession::get_civilizations);
	ClassDB::bind_method(D_METHOD("get_eras"), &AeternaSession::get_eras);
	ClassDB::bind_method(D_METHOD("get_founders"), &AeternaSession::get_founders);
	ClassDB::bind_method(D_METHOD("get_roster_by_land", "land"), &AeternaSession::get_roster_by_land);
	ClassDB::bind_method(D_METHOD("get_roster_by_belt", "belt"), &AeternaSession::get_roster_by_belt);
	ClassDB::bind_method(D_METHOD("get_roster_by_civilization", "civ"), &AeternaSession::get_roster_by_civilization);
	ClassDB::bind_method(D_METHOD("get_civilization", "id"), &AeternaSession::get_civilization);
	ClassDB::bind_method(D_METHOD("get_relics"), &AeternaSession::get_relics);
	ClassDB::bind_method(D_METHOD("get_fusions"), &AeternaSession::get_fusions);
	ClassDB::bind_method(D_METHOD("get_chapters"), &AeternaSession::get_chapters);
	ClassDB::bind_method(D_METHOD("get_areas"), &AeternaSession::get_areas);
	ClassDB::bind_method(D_METHOD("get_seed_cast"), &AeternaSession::get_seed_cast);
	ClassDB::bind_method(D_METHOD("get_relic", "id"), &AeternaSession::get_relic);
	ClassDB::bind_method(D_METHOD("evaluate_fusion"), &AeternaSession::evaluate_fusion);
	ClassDB::bind_method(D_METHOD("get_season"), &AeternaSession::get_season);
	ClassDB::bind_method(D_METHOD("get_gallery"), &AeternaSession::get_gallery);
	ClassDB::bind_method(D_METHOD("set_selected_id", "id"), &AeternaSession::set_selected_id);
	ClassDB::bind_method(D_METHOD("get_selected_id"), &AeternaSession::get_selected_id);
	ClassDB::bind_method(D_METHOD("set_party", "ids"), &AeternaSession::set_party);
	ClassDB::bind_method(D_METHOD("get_party"), &AeternaSession::get_party);
	ClassDB::bind_method(D_METHOD("is_unlocked", "id"), &AeternaSession::is_unlocked);
	ClassDB::bind_method(D_METHOD("get_fragments"), &AeternaSession::get_fragments);
	ClassDB::bind_method(D_METHOD("get_memory_rank", "id"), &AeternaSession::get_memory_rank);
	ClassDB::bind_method(D_METHOD("unlock_character", "id"), &AeternaSession::unlock_character);
	ClassDB::bind_method(D_METHOD("unlock_memory", "id"), &AeternaSession::unlock_memory);
	ClassDB::bind_method(D_METHOD("get_loadout", "id"), &AeternaSession::get_loadout);
	ClassDB::bind_method(D_METHOD("evaluate_party"), &AeternaSession::evaluate_party);
	ClassDB::bind_method(D_METHOD("collect_civilization", "civ"), &AeternaSession::collect_civilization);
	ClassDB::bind_method(D_METHOD("get_restored"), &AeternaSession::get_restored);
	ClassDB::bind_method(D_METHOD("mark_story", "id"), &AeternaSession::mark_story);
	ClassDB::bind_method(D_METHOD("is_story_read"), &AeternaSession::is_story_read);
	ClassDB::bind_method(D_METHOD("mark_character_story", "id"), &AeternaSession::mark_character_story);
	ClassDB::bind_method(D_METHOD("record_result", "result"), &AeternaSession::record_result);
	ClassDB::bind_method(D_METHOD("get_last_result"), &AeternaSession::get_last_result);
	ClassDB::bind_method(D_METHOD("get_progress"), &AeternaSession::get_progress);
	ClassDB::bind_method(D_METHOD("save_progress"), &AeternaSession::save_progress);
	ClassDB::bind_method(D_METHOD("load_progress"), &AeternaSession::load_progress);
	ClassDB::bind_method(D_METHOD("get_bond", "id"), &AeternaSession::get_bond);
	ClassDB::bind_method(D_METHOD("get_character_level", "id"), &AeternaSession::get_character_level);
	ClassDB::bind_method(D_METHOD("get_character_xp", "id"), &AeternaSession::get_character_xp);
	ClassDB::bind_method(D_METHOD("xp_to_next", "id"), &AeternaSession::xp_to_next);
	ClassDB::bind_method(D_METHOD("awaken_rank", "id"), &AeternaSession::awaken_rank);
	ClassDB::bind_method(D_METHOD("add_experience", "id", "amount"), &AeternaSession::add_experience);
	ClassDB::bind_method(D_METHOD("get_relic_level", "id"), &AeternaSession::get_relic_level);
	ClassDB::bind_method(D_METHOD("get_civilization_level", "civ"), &AeternaSession::get_civilization_level);
	ClassDB::bind_method(D_METHOD("raise_bond", "id"), &AeternaSession::raise_bond);
	ClassDB::bind_method(D_METHOD("excavate_relic"), &AeternaSession::excavate_relic);
	ClassDB::bind_method(D_METHOD("add_fragments", "amount"), &AeternaSession::add_fragments);
	ClassDB::bind_method(D_METHOD("level_cost", "id"), &AeternaSession::level_cost);
	ClassDB::bind_method(D_METHOD("raise_level", "id"), &AeternaSession::raise_level);
	ClassDB::bind_method(D_METHOD("grant_level", "id"), &AeternaSession::grant_level);
}

void AeternaSession::ensure_progress() { store.ensure(); }

void AeternaSession::load_catalog(const String &path) {
	if (catalog.load(path)) {
		ensure_progress();
		PackedStringArray ids;
		Array roster = catalog.playable();
		for (int i = 0; i < roster.size(); i++) {
			Dictionary row = roster[i];
			ids.push_back(String(row.get("id", "")));
		}
		store.unlock_ids(ids);
	}
}

bool AeternaSession::is_catalog_loaded() const { return catalog.is_loaded(); }
Array AeternaSession::get_roster() const { return catalog.roster(); }
Array AeternaSession::get_playable_roster() const { return catalog.playable(); }
Dictionary AeternaSession::get_character(const String &id) const { return catalog.character(id); }
Array AeternaSession::get_stories() const { return catalog.get_stories(); }
Array AeternaSession::get_chains() const { return catalog.get_chains(); }
Array AeternaSession::get_regions() const { return catalog.get_regions(); }
Array AeternaSession::get_belts() const { return catalog.get_regions(); }
Array AeternaSession::get_civilizations() const { return catalog.get_civilizations(); }
Array AeternaSession::get_eras() const { return catalog.get_eras(); }
Array AeternaSession::get_founders() const { return catalog.get_founders(); }
Array AeternaSession::get_roster_by_land(const String &land) const { return catalog.by_land(land); }
Array AeternaSession::get_roster_by_belt(const String &belt) const { return catalog.by_land(belt); }
Array AeternaSession::get_roster_by_civilization(const String &civ) const { return catalog.by_land(civ); }
Dictionary AeternaSession::get_civilization(const String &id) const { return catalog.civilization(id); }
Array AeternaSession::get_relics() const { return catalog.get_relics(); }
Array AeternaSession::get_fusions() const { return catalog.get_fusions(); }
Array AeternaSession::get_chapters() const { return catalog.get_chapters(); }
Array AeternaSession::get_areas() const { return catalog.get_areas(); }
Array AeternaSession::get_seed_cast() const { return catalog.get_seed_cast(); }
Dictionary AeternaSession::get_relic(const String &id) const { return catalog.relic(id); }
Dictionary AeternaSession::evaluate_fusion() const { return catalog.evaluate_fusion(store.get_party()); }
Dictionary AeternaSession::get_season() const { return catalog.get_season(); }
Dictionary AeternaSession::get_gallery() const { return catalog.get_gallery(); }

void AeternaSession::set_selected_id(const String &id) { store.set_selected_id(id); }
String AeternaSession::get_selected_id() const { return store.get_selected_id(); }
void AeternaSession::set_party(const PackedStringArray &ids) { store.set_party(ids); }
PackedStringArray AeternaSession::get_party() const { return store.get_party(); }

bool AeternaSession::is_unlocked(const String &id) const { return store.is_unlocked(id); }
int AeternaSession::get_fragments() const { return store.get_fragments(); }
int AeternaSession::get_memory_rank(const String &id) const { return store.get_memory_rank(id); }
bool AeternaSession::unlock_character(const String &id) { return store.unlock_character(id); }
bool AeternaSession::unlock_memory(const String &id) { return store.unlock_memory(id); }

Dictionary AeternaSession::get_loadout(const String &id) const {
	Dictionary src = catalog.character(id);
	Dictionary out;
	int rank = store.get_memory_rank(id);
	Dictionary stats = src.get("stats", Dictionary());
	float hp = float(src.get("hp", 120));
	float speed = float(src.get("speed", 8.0));
	float dmg = float(src.get("damage", 12));
	if (!stats.is_empty()) {
		if (hp <= 0.0f) {
			hp = float(stats.get("hp", 850)) / 7.1f;
		}
		if (dmg <= 0.0f) {
			dmg = float(stats.get("attack", 82)) / 5.2f;
		}
		if (speed <= 0.0f) {
			speed = float(stats.get("speed", 72)) / 9.0f;
		}
	}
	hp += rank * 12.0f;
	dmg += rank * 1.5f;
	if (rank >= 3) {
		speed += 0.4f;
	}
	Dictionary party_bonus = aeterna::evaluate_chains(catalog, store.get_party());
	if (bool(party_bonus.get("hp", false))) {
		hp *= 1.1f;
	}
	out["hp"] = hp;
	out["speed"] = speed;
	out["damage"] = dmg;
	out["id"] = id;
	out["name"] = src.get("name", id);
	out["name_en"] = src.get("name_en", id);
	out["skills"] = src.get("skills", Array());
	out["role"] = src.get("role", "");
	out["rank"] = rank;
	return out;
}

Dictionary AeternaSession::evaluate_party() const {
	Dictionary out = aeterna::evaluate_chains(catalog, store.get_party());
	Dictionary fusion = catalog.evaluate_fusion(store.get_party());
	if (String(fusion.get("id", String())) != String()) {
		Array names = out.get("names", Array());
		names.append(fusion.get("name", String("FUSION")));
		out["names"] = names;
		out["fusion"] = fusion;
		Dictionary buff = fusion.get("buff", Dictionary());
		if (int(buff.get("healing", 0)) > 0) {
			out["heal"] = true;
		}
		if (int(buff.get("guard", 0)) > 0) {
			out["guard"] = true;
		}
		if (int(buff.get("power", 0)) > 0) {
			out["hp"] = true;
		}
	}
	return out;
}

void AeternaSession::collect_civilization(const String &civ) { store.collect_civilization(civ); }
Dictionary AeternaSession::get_restored() const { return store.get_restored(); }
void AeternaSession::mark_story(const String &id) { store.mark_story(id); }
bool AeternaSession::is_story_read(const String &id) const { return store.is_story_read(id); }
void AeternaSession::mark_character_story(const String &id) { store.mark_character_story(id); }

void AeternaSession::record_result(const Dictionary &result) {
	ensure_progress();
	store.set_last_result(result);
	bool win = int(result.get("winner_team", -1)) == 0;
	store.add_match(win);
	if (win) {
		store.set_fragments(store.get_fragments() + 50);
		Array civs = result.get("restored_civs", Array());
		for (int i = 0; i < civs.size(); i++) {
			store.collect_civilization(String(civs[i]));
		}
		PackedStringArray party = store.get_party();
		if (party.size() > 0) {
			store.mark_character_story(party[0]);
		}
	} else {
		store.set_fragments(store.get_fragments() + 15);
	}
	store.save();
}

Dictionary AeternaSession::get_last_result() const { return store.get_last_result(); }
Dictionary AeternaSession::get_progress() const { return store.get_progress(); }
void AeternaSession::save_progress() { store.save(); }
void AeternaSession::load_progress() { store.load(); }
int AeternaSession::get_bond(const String &id) const { return store.get_bond(id); }
int AeternaSession::get_character_level(const String &id) const { return store.get_character_level(id); }
int AeternaSession::get_character_xp(const String &id) const { return store.get_character_xp(id); }
int AeternaSession::xp_to_next(const String &id) const { return store.xp_to_next(id); }
int AeternaSession::awaken_rank(const String &id) const { return store.awaken_rank(id); }
int AeternaSession::bank_experience(const String &id, int amount) { ensure_progress(); return store.bank_experience(id, amount); }
int AeternaSession::add_experience(const String &id, int amount) { ensure_progress(); return store.add_experience(id, amount); }
int AeternaSession::get_relic_level(const String &id) const { return store.get_relic_level(id); }
int AeternaSession::get_civilization_level(const String &civ) const { return store.get_civilization_level(civ); }
bool AeternaSession::raise_bond(const String &id) { return store.raise_bond(id); }
bool AeternaSession::excavate_relic() { return store.excavate_relic(); }
void AeternaSession::add_fragments(int amount) { ensure_progress(); store.add_fragments(amount); }
int AeternaSession::level_cost(const String &id) const { return store.level_cost(id); }
bool AeternaSession::raise_level(const String &id) { ensure_progress(); return store.raise_level(id); }
void AeternaSession::grant_level(const String &id) { ensure_progress(); store.grant_level(id); }
