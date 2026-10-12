extends Control

const App := preload("res://scripts/shared/app.gd")
const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")

var _settings := false


func _ready() -> void:
	App.ensure_catalog()
	_build()


func _build() -> void:
	for child in get_children():
		child.queue_free()
	theme = Chrome.theme()

	var bg := TextureRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	var title_bg := Art.slot("title.bg")
	bg.texture = title_bg if title_bg else Art.world()
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)

	var shade := ColorRect.new()
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.color = Color(0.01, 0.015, 0.03, 0.28)
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(shade)

	var left := ColorRect.new()
	left.set_anchors_preset(Control.PRESET_FULL_RECT)
	left.anchor_right = 0.48
	left.color = Color(0.02, 0.025, 0.04, 0.72)
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(left)

	var stand := TextureRect.new()
	stand.anchor_left = 0.34
	stand.anchor_top = 0.0
	stand.anchor_right = 1.0
	stand.anchor_bottom = 1.0
	stand.offset_bottom = -8
	stand.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stand.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	stand.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var title_stand := Art.slot("title.stand", {"id": "amaterasu"})
	stand.texture = title_stand if title_stand else Art.portrait({}, "amaterasu")
	add_child(stand)

	var block := VBoxContainer.new()
	block.offset_left = 72
	block.offset_top = 78
	block.offset_right = 640
	block.offset_bottom = 820
	block.add_theme_constant_override("separation", 6)
	add_child(block)

	var title := Label.new()
	title.text = "永結のレリクシア"
	title.add_theme_font_size_override("font_size", 54)
	title.add_theme_color_override("font_color", Color(0.96, 0.94, 0.9))
	block.add_child(title)
	var en := Label.new()
	en.text = "AETERNA RELIXIA"
	en.add_theme_font_size_override("font_size", 18)
	en.add_theme_color_override("font_color", Palette.GOLD)
	block.add_child(en)
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 28)
	block.add_child(gap)

	var start := Chrome.menu_button("GAME START")
	start.pressed.connect(_enter.bind("opening"))
	block.add_child(start)
	var cont := Chrome.menu_button("CONTINUE")
	cont.pressed.connect(_enter.bind("home"))
	block.add_child(cont)
	var chars := Chrome.menu_button("CHARACTER")
	chars.pressed.connect(_enter.bind("book"))
	block.add_child(chars)
	var archive := Chrome.menu_button("ARCHIVE")
	archive.pressed.connect(_enter.bind("story"))
	block.add_child(archive)
	var settings := Chrome.menu_button("SETTINGS")
	settings.pressed.connect(_toggle_settings)
	block.add_child(settings)
	var quit := Chrome.menu_button("EXIT")
	quit.pressed.connect(func() -> void: get_tree().quit())
	block.add_child(quit)

	var ver := Label.new()
	ver.text = "ver 0.1.0"
	ver.anchor_top = 1.0
	ver.anchor_bottom = 1.0
	ver.offset_left = 72
	ver.offset_top = -48
	ver.offset_bottom = -20
	ver.add_theme_color_override("font_color", Palette.MUTED)
	add_child(ver)

	if _settings:
		var dim := ColorRect.new()
		dim.set_anchors_preset(Control.PRESET_FULL_RECT)
		dim.color = Color(0, 0, 0, 0.45)
		add_child(dim)
		var card := PanelContainer.new()
		card.anchor_left = 0.5
		card.anchor_top = 0.5
		card.anchor_right = 0.5
		card.anchor_bottom = 0.5
		card.offset_left = -260
		card.offset_top = -140
		card.offset_right = 260
		card.offset_bottom = 140
		add_child(card)
		var body := VBoxContainer.new()
		body.add_theme_constant_override("separation", 10)
		card.add_child(body)
		var head := Label.new()
		head.text = "SETTINGS"
		head.add_theme_font_size_override("font_size", 24)
		head.add_theme_color_override("font_color", Palette.GOLD)
		body.add_child(head)
		var note := Label.new()
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		note.text = "画面 1600×900。移動は WASD、攻撃は J、スキルは E / Q、奥義は R、回避は Space。"
		body.add_child(note)
		var close := Chrome.gold_button("閉じる")
		close.pressed.connect(_toggle_settings)
		body.add_child(close)


func _toggle_settings() -> void:
	_settings = not _settings
	_build()


func _enter(tab: String) -> void:
	if tab == "opening":
		get_tree().change_scene_to_file(App.OPENING_SCENE)
		return
	var s = App.session()
	if s and tab == "home" and s.has_method("load_progress"):
		s.load_progress()
	App.open_tab = tab
	get_tree().change_scene_to_file(App.HUB_SCENE)
