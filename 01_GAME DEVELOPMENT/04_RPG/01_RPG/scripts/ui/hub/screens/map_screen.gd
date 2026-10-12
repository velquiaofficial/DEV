extends RefCounted

const Art := preload("res://scripts/shared/art.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(_host, stage: Control, s, _info: Dictionary) -> void:
	var board := Control.new()
	board.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(board)
	var title := Label.new()
	title.text = "神域"
	title.offset_left = 8
	title.offset_top = 4
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Palette.GOLD)
	board.add_child(title)
	var sub := Label.new()
	sub.text = "OPERATION MAP"
	sub.offset_left = 110
	sub.offset_top = 16
	sub.add_theme_color_override("font_color", Palette.MUTED)
	board.add_child(sub)

	var restored: Dictionary = s.get_restored() if s else {}
	var civs: Array = s.get_civilizations() if s else []
	var grid := GridContainer.new()
	grid.columns = 3
	grid.anchor_right = 1.0
	grid.anchor_bottom = 1.0
	grid.offset_left = 8
	grid.offset_top = 64
	grid.offset_right = -280
	grid.add_theme_constant_override("h_separation", 14)
	grid.add_theme_constant_override("v_separation", 14)
	board.add_child(grid)
	var shown := 0
	for raw in civs:
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var civ: Dictionary = raw
		if shown >= 9:
			break
		shown += 1
		var id := String(civ.get("id", ""))
		var owned := restored.has(id) or restored.has(String(civ.get("civ", ""))) or restored.has(String(civ.get("code", "")))
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(280, 120)
		var body := VBoxContainer.new()
		card.add_child(body)
		var plate := Art.slot("map.plate", {"id": id})
		if plate:
			var pic := TextureRect.new()
			pic.custom_minimum_size = Vector2(0, 84)
			pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
			pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
			pic.texture = plate
			body.add_child(pic)
		var name := Label.new()
		name.text = String(civ.get("name", id))
		name.add_theme_font_size_override("font_size", 26)
		body.add_child(name)
		var en := Label.new()
		en.text = String(civ.get("name_en", civ.get("code", "")))
		en.add_theme_color_override("font_color", Palette.GOLD)
		body.add_child(en)
		var bar := ProgressBar.new()
		bar.max_value = 100
		bar.value = 100 if owned else 12
		bar.show_percentage = false
		bar.custom_minimum_size = Vector2(0, 10)
		body.add_child(bar)
		var state := Label.new()
		state.text = "復元済み" if owned else "未復元"
		body.add_child(state)
		var open := Button.new()
		open.text = "この神域へ出撃"
		open.pressed.connect(_host._open_region.bind(id))
		body.add_child(open)
		grid.add_child(card)

	var side := PanelContainer.new()
	side.anchor_left = 1.0
	side.anchor_right = 1.0
	side.anchor_top = 0.0
	side.anchor_bottom = 1.0
	side.offset_left = -260
	side.offset_top = 64
	board.add_child(side)
	var list := VBoxContainer.new()
	side.add_child(list)
	var cap := Label.new()
	cap.text = "勢力状況"
	cap.add_theme_color_override("font_color", Palette.GOLD)
	list.add_child(cap)
	shown = 0
	for raw in civs:
		if typeof(raw) != TYPE_DICTIONARY or shown >= 6:
			continue
		var civ: Dictionary = raw
		shown += 1
		var id := String(civ.get("id", ""))
		var owned := restored.has(id) or restored.has(String(civ.get("civ", "")))
		var line := Label.new()
		line.text = "%s    %s" % [civ.get("name", id), "100%" if owned else "—"]
		list.add_child(line)
