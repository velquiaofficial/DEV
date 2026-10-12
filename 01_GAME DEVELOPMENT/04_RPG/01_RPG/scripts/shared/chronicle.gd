extends RefCounted

static var _index_id := ""
static var _index: Dictionary = {}
static var _id := ""
static var _volume := 0
static var _book: Dictionary = {}


static func volume_count(id: String) -> int:
	var index := _load_index(id)
	return int(index.get("volumes", 0))


static func volume_title(id: String, volume: int) -> String:
	var index := _load_index(id)
	var titles: Array = index.get("titles", [])
	var pick: int = volume - 1
	if pick < 0 or pick >= titles.size():
		return "戦記"
	return String(titles[pick])


static func beats(id: String, volume: int) -> Array:
	if id == "" or volume < 1:
		return []
	if _id == id and _volume == volume and not _book.is_empty():
		var cached: Array = _book.get("beats", [])
		return cached
	var path := "res://data/chronicle/%s/v%03d.json" % [id, volume]
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_id = ""
		_volume = 0
		_book = {}
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	_id = id
	_volume = volume
	_book = parsed if typeof(parsed) == TYPE_DICTIONARY else {}
	var rows: Array = _book.get("beats", [])
	return rows


static func _load_index(id: String) -> Dictionary:
	if id == "":
		return {}
	if _index_id == id and not _index.is_empty():
		return _index
	var file := FileAccess.open("res://data/chronicle/%s/index.json" % id, FileAccess.READ)
	if file == null:
		_index_id = ""
		_index = {}
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	_index_id = id
	_index = parsed if typeof(parsed) == TYPE_DICTIONARY else {}
	return _index
