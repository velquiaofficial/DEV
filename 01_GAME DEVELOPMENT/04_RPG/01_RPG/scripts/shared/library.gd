extends RefCounted

const Campaign := preload("res://scripts/shared/campaign.gd")

static var _id := ""
static var _book: Dictionary = {}


static func book(id: String) -> Dictionary:
	if id == "":
		return {}
	if _id == id and not _book.is_empty():
		return _book
	var file := FileAccess.open("res://data/library/%s.json" % id, FileAccess.READ)
	if file == null:
		_id = ""
		_book = {}
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	_id = id
	_book = parsed if typeof(parsed) == TYPE_DICTIONARY else {}
	return _book


static func skill_text(id: String, slot: String, level: int) -> String:
	var rows: Array = book(id).get("skills", [])
	for raw in rows:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		if String(row.get("slot", "")) != slot:
			continue
		var levels: Array = row.get("levels", [])
		if levels.is_empty():
			return String(row.get("name", ""))
		var pick: int = clampi(level, 1, levels.size()) - 1
		if typeof(levels[pick]) != TYPE_DICTIONARY:
			return ""
		var entry: Dictionary = levels[pick]
		return "%s  Lv.%d\n%s" % [row.get("name", slot), int(entry.get("level", pick + 1)), entry.get("text", "")]
	return ""


static func bond_count(id: String) -> int:
	var rows: Array = book(id).get("bonds", [])
	if rows.is_empty():
		return 1 if Campaign.episode(id).size() > 0 else 0
	return rows.size()


static func bond_lines(id: String, rank: int) -> Array:
	var rows: Array = book(id).get("bonds", [])
	if rows.is_empty():
		return Campaign.episode(id)
	var index: int = clampi(rank, 1, rows.size()) - 1
	if typeof(rows[index]) != TYPE_DICTIONARY:
		return []
	var row: Dictionary = rows[index]
	var lines: Array = row.get("lines", [])
	return lines if typeof(lines) == TYPE_ARRAY else []


static func bond_title(id: String, rank: int) -> String:
	var rows: Array = book(id).get("bonds", [])
	if rows.is_empty():
		return "個人記憶"
	var index: int = clampi(rank, 1, rows.size()) - 1
	if typeof(rows[index]) != TYPE_DICTIONARY:
		return "個人記憶"
	var row: Dictionary = rows[index]
	return String(row.get("title", "個人記憶"))


static func missions() -> Array:
	var file := FileAccess.open("res://data/library/missions.json", FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return []
	var rows: Array = parsed.get("missions", [])
	return rows if typeof(rows) == TYPE_ARRAY else []
