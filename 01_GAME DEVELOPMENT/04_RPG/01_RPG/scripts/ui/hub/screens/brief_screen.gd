extends RefCounted

const Campaign := preload("res://scripts/shared/campaign.gd")
const Chronicle := preload("res://scripts/shared/chronicle.gd")
const Library := preload("res://scripts/shared/library.gd")
const Kit := preload("res://scripts/ui/hub/hub_kit.gd")
const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, _s, _info: Dictionary) -> void:
	var lines := _lines(host)
	var index: int = clampi(host._brief_page, 0, maxi(lines.size() - 1, 0))
	host._brief_page = index
	var beat: Dictionary = {}
	if lines.size() > 0 and typeof(lines[index]) == TYPE_DICTIONARY:
		beat = lines[index]
	var speaker := String(beat.get("speaker", ""))
	var speaker_id := Campaign.id_for_name(speaker)
	var plate := TextureRect.new()
	plate.set_anchors_preset(Control.PRESET_FULL_RECT)
	plate.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	plate.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	plate.texture = _background(host)
	stage.add_child(plate)
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.02, 0.02, 0.04, 0.35)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.add_child(dim)

	var stand := TextureRect.new()
	stand.anchor_bottom = 1.0
	stand.offset_left = 24
	stand.offset_top = 16
	stand.offset_right = 560
	stand.offset_bottom = -150
	stand.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stand.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	stand.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if speaker_id != "":
		var face := Art.slot("character.expr", {"id": speaker_id, "face": "talk"})
		stand.texture = face if face else Art.portrait({}, speaker_id)
	stage.add_child(stand)

	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 20
	top.offset_top = 12
	top.offset_right = -20
	top.offset_bottom = 56
	stage.add_child(top)
	var back := Button.new()
	back.text = "＜  戻る"
	back.pressed.connect(host._close_brief)
	top.add_child(back)
	var title := Label.new()
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var heading := "%d / %d" % [index + 1, maxi(lines.size(), 1)]
	if String(host._brief_mode) == "episode":
		heading = "%s    %s" % [Library.bond_title(String(host._selected), int(host._bond_rank)), heading]
	elif String(host._brief_mode) == "chronicle":
		heading = "%s    %s" % [Chronicle.volume_title(String(host._selected), int(host._chronicle_vol)), heading]
	title.text = heading
	title.add_theme_font_size_override("font_size", 22)
	top.add_child(title)

	var box := PanelContainer.new()
	box.anchor_top = 1.0
	box.anchor_right = 1.0
	box.anchor_bottom = 1.0
	box.offset_left = 24
	box.offset_top = -168
	box.offset_right = -24
	box.offset_bottom = -16
	stage.add_child(box)
	var body := VBoxContainer.new()
	body.add_theme_constant_override("separation", 8)
	box.add_child(body)
	if speaker != "":
		var who := Label.new()
		who.text = speaker
		who.add_theme_color_override("font_color", Palette.GOLD)
		who.add_theme_font_size_override("font_size", 20)
		body.add_child(who)
	var line := Label.new()
	line.text = String(beat.get("text", ""))
	line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	line.add_theme_font_size_override("font_size", 22)
	body.add_child(line)
	var actions := HBoxContainer.new()
	actions.alignment = BoxContainer.ALIGNMENT_END
	body.add_child(actions)
	var last := index >= lines.size() - 1
	if host._brief_mode == "stage" and last:
		var fight := Chrome.gold_button("この記憶で戦闘")
		fight.pressed.connect(host._begin_stage)
		actions.add_child(fight)
	elif host._brief_mode == "episode" and last and int(host._bond_rank) < Library.bond_count(String(host._selected)):
		var more := Chrome.gold_button("次の巻")
		more.pressed.connect(host._next_bond)
		actions.add_child(more)
	elif host._brief_mode == "chronicle" and last and int(host._chronicle_vol) < Chronicle.volume_count(String(host._selected)):
		var next_vol := Chrome.gold_button("次の巻")
		next_vol.pressed.connect(host._next_chronicle)
		actions.add_child(next_vol)
	else:
		var nxt := Chrome.gold_button("次へ" if not last else "閉じる")
		if last:
			nxt.pressed.connect(host._close_brief)
		else:
			nxt.pressed.connect(host._advance_brief)
		actions.add_child(nxt)


static func _lines(host) -> Array:
	if String(host._brief_mode) == "chronicle":
		return Chronicle.beats(String(host._selected), int(host._chronicle_vol))
	if String(host._brief_mode) == "episode":
		return Library.bond_lines(String(host._selected), int(host._bond_rank))
	var row := Campaign.by_code(String(host._stage_code))
	if bool(row.get("chapter_end", false)) and String(row.get("chapter", "")) == "12":
		var ending := Kit.ending_chapter()
		var pages: Array = ending.get("pages", [])
		if pages.size() > 0:
			return pages
	var lines: Array = row.get("lines", [])
	return lines if typeof(lines) == TYPE_ARRAY else []


static func _background(host) -> Texture2D:
	if String(host._brief_mode) == "stage":
		var row := Campaign.by_code(String(host._stage_code))
		var plate := Art.resolve(String(row.get("art", "")))
		if plate == null:
			plate = Art.slot("stage.plate", {"code": String(row.get("code", "")).replace("-", "_")})
		if plate:
			return plate
	var opening := Art.slot("opening.cut", {"nnn": "001"})
	if opening:
		return opening
	return Art.world()
