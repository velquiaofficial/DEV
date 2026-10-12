extends RefCounted

const Kit := preload("res://scripts/ui/hub/hub_kit.gd")
const Art := preload("res://scripts/shared/art.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, _info: Dictionary) -> void:
	var entries := Kit.story_entries(s)
	var chosen: Dictionary = {}
	for raw in entries:
		if typeof(raw) == TYPE_DICTIONARY and String(raw.get("id", "")) == host._story_id:
			chosen = raw
	if chosen.is_empty() and entries.size() > 0 and typeof(entries[0]) == TYPE_DICTIONARY:
		chosen = entries[0]
		host._story_id = String(chosen.get("id", host._story_id))
	var pages: Array = chosen.get("pages", []) if typeof(chosen.get("pages", [])) == TYPE_ARRAY else []
	var page: Dictionary = {}
	if pages.size() > 0:
		host._story_page = clampi(host._story_page, 0, pages.size() - 1)
		if typeof(pages[host._story_page]) == TYPE_DICTIONARY:
			page = pages[host._story_page]
	var speaker := String(page.get("speaker", ""))
	var speaker_id := Kit.speaker_id(speaker)
	var bg_path := String(page.get("bg", chosen.get("bg", "")))
	var bg := Art.resolve(bg_path) if bg_path != "" else null
	if bg == null:
		bg = Art.slot("story.bg", {"id": String(chosen.get("id", "")), "nnn": "%03d" % ((host._story_page % 15) + 1)})
	if bg == null:
		bg = Art.world()

	var plate := TextureRect.new()
	plate.set_anchors_preset(Control.PRESET_FULL_RECT)
	plate.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	plate.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	plate.mouse_filter = Control.MOUSE_FILTER_IGNORE
	plate.texture = bg
	stage.add_child(plate)
	var dim := ColorRect.new()
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	dim.color = Color(0.02, 0.02, 0.04, 0.22)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stage.add_child(dim)

	var stand := TextureRect.new()
	stand.anchor_bottom = 1.0
	stand.offset_left = 20
	stand.offset_top = 20
	stand.offset_right = 640
	stand.offset_bottom = -150
	stand.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stand.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	stand.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var stand_id := speaker_id if speaker_id != "" else String(host._selected)
	var face := Art.slot("character.expr", {"id": stand_id, "face": "talk"})
	stand.texture = face if face else Art.portrait({}, stand_id)
	stage.add_child(stand)

	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 24
	top.offset_top = 16
	top.offset_right = -24
	top.offset_bottom = 56
	stage.add_child(top)
	var back := Button.new()
	back.text = "＜  ホーム"
	back.pressed.connect(host._set_tab.bind("home"))
	top.add_child(back)
	var title := Label.new()
	var shown: int = host._story_page + 1 if pages.size() > 0 else 1
	var total := maxi(pages.size(), 1)
	title.text = "%s    %d/%d" % [chosen.get("title", "アーカイブ"), shown, total]
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title.add_theme_font_size_override("font_size", 22)
	top.add_child(title)
	var log := Button.new()
	log.text = "章"
	log.pressed.connect(host._toggle_story_log)
	top.add_child(log)
	var skip := Button.new()
	skip.text = "SKIP"
	skip.pressed.connect(host._skip_story.bind(pages.size()))
	top.add_child(skip)

	var box := PanelContainer.new()
	box.anchor_top = 1.0
	box.anchor_right = 1.0
	box.anchor_bottom = 1.0
	box.offset_left = 36
	box.offset_top = -168
	box.offset_right = -36
	box.offset_bottom = -18
	stage.add_child(box)
	var body := VBoxContainer.new()
	box.add_child(body)
	var who := Label.new()
	who.text = speaker if speaker != "" else String(chosen.get("title", ""))
	who.add_theme_color_override("font_color", Palette.GOLD)
	who.add_theme_font_size_override("font_size", 20)
	body.add_child(who)
	var line := Label.new()
	line.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	line.text = String(page.get("text", chosen.get("body", "")))
	line.add_theme_font_size_override("font_size", 22)
	line.custom_minimum_size = Vector2(0, 72)
	body.add_child(line)
	var nav := HBoxContainer.new()
	nav.add_theme_constant_override("separation", 8)
	body.add_child(nav)
	if host._story_page > 0:
		var prev := Button.new()
		prev.text = "前へ"
		prev.pressed.connect(host._prev_page)
		nav.add_child(prev)
	var next := Button.new()
	next.text = "次へ"
	next.pressed.connect(host._advance_story.bind(pages.size()))
	nav.add_child(next)

	if host._story_log:
		var list := ScrollContainer.new()
		list.anchor_left = 1.0
		list.anchor_right = 1.0
		list.anchor_bottom = 1.0
		list.offset_left = -360
		list.offset_top = 64
		list.offset_right = -24
		list.offset_bottom = -190
		stage.add_child(list)
		var col := VBoxContainer.new()
		col.custom_minimum_size = Vector2(320, 0)
		list.add_child(col)
		for raw in entries:
			if typeof(raw) != TYPE_DICTIONARY:
				continue
			var sid := String(raw.get("id", ""))
			if sid == "":
				continue
			var jump := Button.new()
			jump.text = String(raw.get("title", sid))
			jump.alignment = HORIZONTAL_ALIGNMENT_LEFT
			if sid == host._story_id:
				jump.modulate = Color(1.2, 1.05, 0.7)
			jump.pressed.connect(host._open_chapter.bind(sid))
			col.add_child(jump)
	if s:
		s.mark_story(String(chosen.get("id", host._story_id)))
