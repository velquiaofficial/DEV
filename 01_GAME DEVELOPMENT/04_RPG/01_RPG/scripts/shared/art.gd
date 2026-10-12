extends RefCounted

const EXTS: PackedStringArray = ["png", "jpg", "jpeg", "webp"]

const STEMS := {
	"title.bg": ["res://assets/title/bg", "res://assets/world/tokyo_ruins"],
	"title.logo": ["res://assets/title/logo"],
	"title.stand": ["res://assets/title/stand", "res://assets/characters/profile/{id}", "res://assets/characters/select/{id}"],
	"home.bg": ["res://assets/home/bg", "res://assets/world/tokyo_ruins"],
	"home.stand": ["res://assets/home/stand", "res://assets/characters/profile/{id}", "res://assets/characters/select/{id}"],
	"opening.cut": ["res://assets/opening/{nnn}", "res://assets/opening/cuts/{nnn}"],
	"opening.poster": ["res://assets/opening/poster/main", "res://assets/opening/015"],
	"character.profile": ["res://assets/characters/profile/{id}", "res://assets/characters/select/{id}", "res://assets/characters/cards/{id}"],
	"character.emblem": ["res://assets/characters/emblem/{id}"],
	"character.expr": ["res://assets/characters/expr/{id}_{face}", "res://assets/characters/expr/{id}"],
	"character.select": ["res://assets/characters/select/{id}"],
	"character.dock": ["res://assets/characters/dock/{id}"],
	"character.battle": ["res://assets/characters/battle/{id}"],
	"story.bg": ["res://assets/story/{id}", "res://assets/opening/{nnn}"],
	"stage.plate": ["res://assets/campaign/{code}", "res://assets/stages/{code}"],
	"map.plate": ["res://assets/map/{id}"],
	"shop.pickup": ["res://assets/shop/pickup"],
	"shop.normal": ["res://assets/shop/normal"],
	"shop.event": ["res://assets/shop/event"],
	"event.banner": ["res://assets/event/banner"],
	"result.win": ["res://assets/result/win"],
	"result.lose": ["res://assets/result/lose"],
	"battle.backdrop": ["res://assets/battle/backdrop", "res://assets/world/battlefield_tokyo"],
	"battle.lane": ["res://assets/battle/lane"],
	"ui.frame": ["res://assets/ui/frame"],
	"relic.icon": ["res://assets/relics/{id}"],
}

static var _catalog: Dictionary = {}
static var _catalog_ready := false
static var _over: Dictionary = {}
static var _over_ready := false


static func exists(path: String) -> bool:
	if path.is_empty():
		return false
	if ResourceLoader.exists(path):
		return true
	return FileAccess.file_exists(path)


static func tex(path: String) -> Texture2D:
	if not exists(path):
		return null
	var bytes := FileAccess.get_file_as_bytes(path)
	if bytes.size() < 4:
		return null
	var image := Image.new()
	var ok := false
	if bytes[0] == 0x89 and bytes[1] == 0x50:
		ok = image.load_png_from_buffer(bytes) == OK
	elif bytes[0] == 0xFF and bytes[1] == 0xD8:
		ok = image.load_jpg_from_buffer(bytes) == OK
	elif bytes[0] == 0x52 and bytes[1] == 0x49:
		ok = image.load_webp_from_buffer(bytes) == OK
	if not ok:
		return null
	return ImageTexture.create_from_image(image)


static func stem(path: String) -> Texture2D:
	if path.is_empty():
		return null
	var direct := tex(path)
	if direct:
		return direct
	var ext := path.get_extension()
	var base := path
	if ext != "":
		base = path.substr(0, path.length() - ext.length() - 1)
	for try_ext in EXTS:
		if try_ext == ext:
			continue
		var found := tex(base + "." + try_ext)
		if found:
			return found
	return null


static func resolve(path: String) -> Texture2D:
	if path.is_empty():
		return null
	var key := _key_from_path(path)
	if key != "":
		var forced := String(_over_map().get(key, "")).strip_edges()
		if forced != "":
			var swapped := stem(forced)
			if swapped:
				return swapped
	return stem(path)


static func slot(id: String, tokens: Dictionary = {}) -> Texture2D:
	var keys: Array = []
	if tokens.has("id"):
		keys.append("%s.%s" % [id, String(tokens["id"])])
	keys.append(id)
	for key in keys:
		var forced := String(_over_map().get(key, "")).strip_edges()
		if forced == "":
			continue
		var swapped := stem(_fill(forced, tokens))
		if swapped:
			return swapped
	for raw in _paths_for(id):
		var found := stem(_fill(String(raw), tokens))
		if found:
			return found
	return null


static func profile(id: String) -> Texture2D:
	var found := slot("character.profile", {"id": id})
	if found:
		return found
	return portrait({}, id)


static func _key_from_path(path: String) -> String:
	var file := path.get_file().get_basename()
	var folder := path.get_base_dir().get_file()
	if folder == "" or file == "":
		return ""
	return "%s.%s" % [folder, file]


static func _fill(path: String, tokens: Dictionary) -> String:
	var filled := path
	for key in tokens.keys():
		filled = filled.replace("{%s}" % String(key), String(tokens[key]))
	return filled


static func _paths_for(id: String) -> Array:
	var catalog := _load_catalog()
	if catalog.has(id) and catalog[id] is Array:
		return catalog[id]
	var fallback = STEMS.get(id, [])
	return fallback if fallback is Array else []


static func _load_catalog() -> Dictionary:
	if _catalog_ready:
		return _catalog
	_catalog_ready = true
	_catalog = {}
	var file := FileAccess.open("res://data/art/slots.json", FileAccess.READ)
	if file == null:
		return _catalog
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return _catalog
	var rows: Array = parsed.get("slots", [])
	for raw in rows:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var sid := String(row.get("id", ""))
		var paths: Array = row.get("paths", [])
		if sid != "" and not paths.is_empty():
			_catalog[sid] = paths
	return _catalog


static func _over_map() -> Dictionary:
	if _over_ready:
		return _over
	_over_ready = true
	_over = {}
	var file := FileAccess.open("res://data/art/overrides.json", FileAccess.READ)
	if file == null:
		return _over
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		_over = parsed
	return _over


static func sheet_path(id: String) -> String:
	var p := "res://assets/characters/sheet/%s.png" % id
	if exists(p):
		return p
	return ""


static func face_for_speaker(speaker: String) -> Texture2D:
	var key := speaker.strip_edges()
	if key == "":
		return null
	var aliases := {
		"天照": "amaterasu",
		"月読": "tsukuyomi",
		"須佐之男": "susanoo",
		"アテナ": "athena",
		"イシス": "isis",
		"アヌビス": "anubis",
		"イシュタル": "ishtar",
		"スカアハ": "scathach",
		"忘却": "oblivion",
		"西施": "xishi",
		"江戸": "edo",
	}
	var id := String(aliases.get(key, key.to_lower()))
	var sheet := sheet_path(id)
	if sheet != "":
		return tex(sheet)
	return portrait({}, id)


static func face(info: Dictionary, id: String) -> Texture2D:
	var sheet := sheet_path(id)
	if sheet != "":
		return tex(sheet)
	return portrait(info, id)


static func portrait_path(_info: Dictionary, id: String) -> String:
	var path := "res://assets/characters/cards/%s.jpg" % id
	if exists(path):
		return path
	return ""


static func portrait(info: Dictionary, id: String) -> Texture2D:
	var select := "res://assets/characters/select/%s.jpg" % id
	if exists(select):
		return tex(select)
	return tex(portrait_path(info, id))


static func dock(id: String) -> Texture2D:
	var path := "res://assets/characters/dock/%s.png" % id
	if exists(path):
		return tex(path)
	return portrait({}, id)


static func card(info: Dictionary, id: String) -> Texture2D:
	var select := "res://assets/characters/select/%s.jpg" % id
	if exists(select):
		return tex(select)
	var path := "res://assets/characters/cards/%s.jpg" % id
	if exists(path):
		return tex(path)
	return portrait(info, id)


static func world() -> Texture2D:
	return tex("res://assets/world/tokyo_ruins.png")


static func stage_plate(code: String) -> Texture2D:
	var path := "res://assets/campaign/%s.png" % code.replace("-", "_")
	var found := tex(path)
	if found:
		return found
	var opening := tex("res://assets/opening/001.png")
	if opening:
		return opening
	return world()


static func battlefield() -> Texture2D:
	var t := tex("res://assets/world/battlefield_tokyo.png")
	if t:
		return t
	t = tex("res://assets/characters/battlefield_tokyo.png")
	return t if t else world()


static func relic(id: String) -> Texture2D:
	return tex("res://assets/relics/%s.png" % id)


static func picture(parent: Control, texture: Texture2D, size: Vector2) -> TextureRect:
	var rect := TextureRect.new()
	rect.texture = texture
	rect.custom_minimum_size = size
	rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	parent.add_child(rect)
	return rect
