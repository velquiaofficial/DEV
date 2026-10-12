extends RefCounted

const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")

const FILTERS := [
	["all", "ALL"],
	["jp", "日本"],
	["gr", "ギリシャ"],
	["eg", "エジプト"],
	["rm", "ローマ"],
	["cn", "中国"],
	["ot", "その他"],
]

const NATIONS := [
	["jp", ["japan", "yamato", "tokyo"]],
	["gr", ["greece", "hellas"]],
	["eg", ["egypt", "kemet"]],
	["rm", ["rome", "roma"]],
	["cn", ["china", "huaxia"]],
]

const SPEAKERS := {
	"天照": "amaterasu",
	"月読": "tsukuyomi",
	"須佐之男": "susanoo",
	"アテナ": "athena",
	"イシス": "isis",
	"アヌビス": "anubis",
	"イシュタル": "ishtar",
	"スカアハ": "scathach",
	"忘却": "oblivion",
	"江戸": "edo",
	"西施": "xishi",
	"ローマ": "roma",
}


static func nation(entry: Dictionary) -> String:
	var blob := "%s %s %s %s" % [entry.get("civ", ""), entry.get("civilization_id", ""), entry.get("civilization", ""), entry.get("land", "")]
	blob = blob.to_lower()
	for pair in NATIONS:
		for token in pair[1]:
			if blob.contains(String(token)):
				return String(pair[0])
	return "ot"


static func speaker_id(speaker: String) -> String:
	var known := String(SPEAKERS.get(speaker, ""))
	if known != "":
		return known
	var Campaign := preload("res://scripts/shared/campaign.gd")
	return Campaign.id_for_name(speaker)


static func _read_entries(path: String) -> Array:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if typeof(parsed) == TYPE_ARRAY else []


static func _absorb(out: Array, index: Dictionary, pack: Array, replace: bool) -> void:
	for raw in pack:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var sid := String(row.get("id", ""))
		if sid == "":
			continue
		if index.has(sid):
			if replace:
				out[int(index[sid])] = row
			continue
		index[sid] = out.size()
		out.append(row)


static func _revision_chapters() -> Array:
	var file := FileAccess.open("res://data/stories/revision.json", FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return []
	var rows: Array = parsed.get("chapters", [])
	return rows if typeof(rows) == TYPE_ARRAY else []


static func story_entries(s) -> Array:
	var out: Array = []
	var index := {}
	_absorb(out, index, _read_entries("res://data/stories/chapters.json"), false)
	_absorb(out, index, _read_entries("res://data/stories/finale.json"), false)
	_absorb(out, index, _read_entries("res://data/stories/lore.json"), false)
	if s != null and s.has_method("get_chapters"):
		var from_catalog: Array = s.get_chapters()
		_absorb(out, index, from_catalog, false)
	if s != null and s.has_method("get_stories"):
		var more: Array = s.get_stories()
		_absorb(out, index, more, false)
	_absorb(out, index, _revision_chapters(), true)
	return out


static func ending_chapter() -> Dictionary:
	var best: Dictionary = {}
	var best_n := -1
	for raw in story_entries(null):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var sid := String(row.get("id", ""))
		if not sid.begins_with("ch"):
			continue
		var n := sid.substr(2).to_int()
		if n >= best_n:
			best_n = n
			best = row
	return best


static func banner_card(title: String, body: String, action: String, handler: Callable) -> PanelContainer:
	var card := PanelContainer.new()
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size = Vector2(0, 120)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 4)
	card.add_child(box)
	var head := Label.new()
	head.text = title
	head.add_theme_color_override("font_color", Palette.GOLD)
	head.add_theme_font_size_override("font_size", 14)
	box.add_child(head)
	var line := Label.new()
	line.text = body
	line.add_theme_font_size_override("font_size", 20)
	box.add_child(line)
	var button := Button.new()
	button.text = action
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.pressed.connect(handler)
	box.add_child(button)
	return card


static func unit_card(host, entry: Dictionary, s, size: Vector2, assign: bool) -> Control:
	var id := String(entry.get("id", ""))
	var locked := false
	if s:
		locked = id != "oblivion" and not bool(s.is_unlocked(id))
	var root := Control.new()
	root.custom_minimum_size = size
	var frame := Panel.new()
	frame.set_anchors_preset(Control.PRESET_FULL_RECT)
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(frame)
	var pic := TextureRect.new()
	pic.set_anchors_preset(Control.PRESET_FULL_RECT)
	pic.offset_left = 4
	pic.offset_top = 4
	pic.offset_right = -4
	pic.offset_bottom = -36
	pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	pic.texture = Art.card(entry, id)
	pic.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if locked:
		pic.modulate = Color(0.35, 0.35, 0.4)
	root.add_child(pic)
	var level := int(s.get_character_level(id)) if s else 1
	var lv := Label.new()
	lv.text = "Lv.%d" % level
	lv.offset_left = 8
	lv.offset_top = 6
	lv.add_theme_font_size_override("font_size", 14)
	lv.add_theme_color_override("font_color", Palette.GOLD)
	lv.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(lv)
	var name := Label.new()
	name.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	name.offset_top = -32
	name.text = String(entry.get("name_ja", id))
	name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(name)
	var hit := Button.new()
	hit.set_anchors_preset(Control.PRESET_FULL_RECT)
	hit.text = ""
	hit.flat = true
	var empty := Chrome.flat(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 0, 0)
	hit.add_theme_stylebox_override("normal", empty)
	hit.add_theme_stylebox_override("hover", Chrome.flat(Color(1, 0.9, 0.6, 0.08), Color(0.9, 0.75, 0.35, 0.8), 8, 1))
	hit.add_theme_stylebox_override("pressed", empty)
	hit.add_theme_stylebox_override("focus", empty)
	if assign:
		hit.pressed.connect(host._assign.bind(id))
	else:
		hit.pressed.connect(host._open_detail.bind(id))
	root.add_child(hit)
	return root
