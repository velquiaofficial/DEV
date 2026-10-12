extends RefCounted

const Stages := preload("res://scripts/shared/stages.gd")

const WORLD_PATH := "res://data/campaign/world.json"
const CODEX_PATH := "res://data/campaign/codex.json"
const GROWTH_PATH := "res://data/campaign/growth.json"

static var _world: Dictionary = {}
static var _codex: Dictionary = {}
static var _growth: Dictionary = {}
static var _loaded := false


static func _ensure() -> void:
	if _loaded:
		return
	_loaded = true
	_world = _read(WORLD_PATH)
	_codex = _read(CODEX_PATH)
	_growth = _read(GROWTH_PATH)


static func _read(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	return parsed


static func chapters() -> Array:
	_ensure()
	var rows: Array = _world.get("chapters", [])
	return rows if typeof(rows) == TYPE_ARRAY else []


static func chapter(id: String) -> Dictionary:
	for raw in chapters():
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if String(row.get("id", "")) == id:
			return row
	var all := chapters()
	if all.size() > 0 and typeof(all[0]) == TYPE_DICTIONARY:
		return all[0]
	return {}


static func chapter_for_civ(civ_id: String) -> Dictionary:
	var key := civ_id.to_lower()
	for raw in chapters():
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if String(row.get("civ_id", "")).to_lower() == key or String(row.get("civ", "")).to_lower() == key:
			return row
	return {}


static func stages_of(chapter_id: String) -> Array:
	var row := chapter(chapter_id)
	var rows: Array = row.get("stages", [])
	return rows if typeof(rows) == TYPE_ARRAY else []


static func flat_stages() -> Array:
	var out: Array = []
	for raw in chapters():
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var stages: Array = row.get("stages", [])
		for stage in stages:
			if typeof(stage) == TYPE_DICTIONARY:
				out.append(stage)
	return out


static func by_code(code: String) -> Dictionary:
	for raw in flat_stages():
		var row: Dictionary = raw
		if String(row.get("code", "")) == code:
			return row
	return Stages.by_code(code)


static func profile(id: String) -> Dictionary:
	_ensure()
	var rows: Array = _codex.get("characters", [])
	for raw in rows:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if String(row.get("id", "")) == id:
			return row
	return {}


static func episode(id: String) -> Array:
	var row := profile(id)
	var lines: Array = row.get("episode", [])
	return lines if typeof(lines) == TYPE_ARRAY else []


static func rank_note(level: int) -> String:
	_ensure()
	var rows: Array = _growth.get("ranks", [])
	for raw in rows:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if int(row.get("level", 0)) == level:
			return String(row.get("note", ""))
	return ""


static func id_for_name(speaker: String) -> String:
	var key := speaker.strip_edges()
	if key == "":
		return ""
	_ensure()
	var rows: Array = _codex.get("characters", [])
	for raw in rows:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if String(row.get("name", "")) == key or String(row.get("id", "")) == key:
			return String(row.get("id", ""))
	return ""
