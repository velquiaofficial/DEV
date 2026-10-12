extends RefCounted

const Campaign := preload("res://scripts/shared/campaign.gd")
const PATH := "user://aeterna_campaign.json"

static var _data: Dictionary = {}
static var _loaded := false


static func _ensure() -> void:
	if _loaded:
		return
	_loaded = true
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		_data = {"cleared": {}}
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		_data = parsed
	if typeof(_data.get("cleared", {})) != TYPE_DICTIONARY:
		_data["cleared"] = {}


static func _save() -> void:
	var file := FileAccess.open(PATH, FileAccess.WRITE)
	if file == null:
		return
	file.store_string(JSON.stringify(_data))


static func is_cleared(code: String) -> bool:
	_ensure()
	var cleared: Dictionary = _data.get("cleared", {})
	return bool(cleared.get(code, false))


static func is_open(code: String) -> bool:
	return code != ""


static func mark_clear(code: String) -> bool:
	_ensure()
	var cleared: Dictionary = _data.get("cleared", {})
	if bool(cleared.get(code, false)):
		return false
	cleared[code] = true
	_data["cleared"] = cleared
	_save()
	return true


static func cleared_count() -> int:
	_ensure()
	var cleared: Dictionary = _data.get("cleared", {})
	return cleared.size()


static func is_claimed(id: String) -> bool:
	_ensure()
	var claimed: Dictionary = _data.get("claimed", {})
	return bool(claimed.get(id, false))


static func claim(id: String) -> bool:
	_ensure()
	var claimed: Dictionary = _data.get("claimed", {})
	if bool(claimed.get(id, false)):
		return false
	claimed[id] = true
	_data["claimed"] = claimed
	_save()
	return true


static func next_stage() -> Dictionary:
	for raw in Campaign.flat_stages():
		var row: Dictionary = raw
		var code := String(row.get("code", ""))
		if is_open(code) and not is_cleared(code):
			return row
	var all := Campaign.flat_stages()
	if all.size() > 0 and typeof(all[all.size() - 1]) == TYPE_DICTIONARY:
		return all[all.size() - 1]
	return {}
