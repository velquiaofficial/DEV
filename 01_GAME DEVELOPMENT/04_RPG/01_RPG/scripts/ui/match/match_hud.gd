extends CanvasLayer

const App := preload("res://scripts/shared/app.gd")
const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Clock := preload("res://scripts/shared/clock.gd")
const Palette := preload("res://scripts/shared/palette.gd")
const Domains := preload("res://scripts/ui/match/domains.gd")
const ACCENTS: Array = [
	Color(0.95, 0.62, 0.22),
	Color(0.35, 0.62, 0.95),
	Color(0.92, 0.78, 0.38),
	Color(0.92, 0.38, 0.58),
	Color(0.62, 0.38, 0.92),
]

@onready var field: Node2D = $"../MemoryField"

var _ended := false
var _release := PackedStringArray()
var _unit_ids := PackedStringArray()
var _hp_bars: Array = []
var _hp_texts: Array = []
var _time: Label
var _wave: Label
var _title: Label
var _domain: Label
var _enemy_name: Label
var _enemy_text: Label
var _relic: ProgressBar
var _relic_text: Label
var _ours: Label
var _goal: Label
var _skill_buttons: Array = []
var _cards: Array = []
var _speed := 1.0
var _auto := false
var _mode_normal: Button
var _mode_auto: Button
var _lane: Sprite2D
var _lane_key := ""


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	if has_node("Root"):
		$Root.visible = false
	_build_overlay()
	call_deferred("_boot_field")


func _exit_tree() -> void:
	_release_holds()
	Engine.time_scale = 1.0
	if is_inside_tree():
		get_tree().paused = false


func _process(_delta: float) -> void:
	if _ended:
		return
	_refresh_hud()
	if not _release.is_empty():
		for action in _release:
			Input.action_release(String(action))
		_release = PackedStringArray()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_leave()


func _boot_field() -> void:
	var parent := get_parent()
	if parent == null:
		return
	var backdrop := parent.get_node_or_null("Backdrop")
	if backdrop is CanvasItem:
		(backdrop as CanvasItem).visible = true
		if backdrop is ColorRect:
			(backdrop as ColorRect).color = Color(0.03, 0.02, 0.05)
	var cam := parent.get_node_or_null("FollowCamera") as Camera2D
	if cam:
		cam.enabled = true
		cam.position_smoothing_enabled = false
		cam.zoom = Vector2(0.8, 0.8)
		cam.position = Vector2(0, -10)
	if field:
		field.visible = true
		_lay_stage()
	_set_mode(false)
	_apply_stage_banner()
	if field and field.has_method("set_stage_foes"):
		var picked: Dictionary = App.stage
		var ids := PackedStringArray()
		var raw = picked.get("foes", [])
		if raw is PackedStringArray:
			ids = raw
		elif raw is Array:
			for foe_id in raw:
				ids.append(String(foe_id))
		if ids.size() > 0:
			field.set_stage_foes(ids, String(picked.get("enemy", "")))
			if field.has_method("set_stage_civ"):
				field.set_stage_civ(String(picked.get("enemy_civ", "")))
			if field.has_method("set_stage_level"):
				field.set_stage_level(int(picked.get("recommend", 1)))
	if field and field.has_method("start_match"):
		field.start_match()
		if field.has_signal("match_ended") and not field.match_ended.is_connected(_on_match_ended):
			field.connect("match_ended", _on_match_ended)


func _lay_stage() -> void:
	var sky_image := Image.create(4, 256, false, Image.FORMAT_RGBA8)
	var top := Color(0.07, 0.04, 0.14)
	var horizon := Color(0.36, 0.1, 0.16)
	var ground := Color(0.02, 0.015, 0.04)
	for y in 256:
		var t := float(y) / 255.0
		var color := top.lerp(horizon, clampf(t / 0.62, 0.0, 1.0))
		if t > 0.62:
			color = horizon.lerp(ground, (t - 0.62) / 0.38)
		for x in 4:
			sky_image.set_pixel(x, y, color)
	var sky := Sprite2D.new()
	sky.z_index = -40
	sky.centered = true
	sky.position = Vector2(0, 40)
	var backdrop := Art.slot("battle.backdrop")
	if backdrop:
		sky.texture = backdrop
		var sz := backdrop.get_size()
		sky.scale = Vector2(1800.0 / maxf(sz.x, 1.0), 1000.0 / maxf(sz.y, 1.0))
		sky.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
	else:
		sky.texture = ImageTexture.create_from_image(sky_image)
		sky.texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR
		sky.scale = Vector2(480, 4.0)
	field.add_child(sky)

	var image := Image.create(4, 4, false, Image.FORMAT_RGBA8)
	image.fill(Color(0.22, 0.06, 0.1, 1))
	_lane = Sprite2D.new()
	_lane.name = "Lane"
	_lane.z_index = -24
	_lane.centered = true
	_lane.position = Vector2(0, 16)
	_lane.texture = ImageTexture.create_from_image(image)
	_lane.scale = Vector2(520, 10)
	field.add_child(_lane)


func _build_overlay() -> void:
	var root := Control.new()
	root.name = "BattleRoot"
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = Chrome.theme()
	root.process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(root)

	_build_top(root)
	_build_modes(root)
	_build_speeds(root)
	_build_dock(root)


func _build_top(root: Control) -> void:
	var bar := Panel.new()
	bar.set_anchors_preset(Control.PRESET_TOP_WIDE)
	bar.offset_bottom = 78
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.add_theme_stylebox_override("panel", Chrome.flat(Color(0.02, 0.02, 0.04, 0.72), Color(0, 0, 0, 0), 0, 0))
	root.add_child(bar)

	var pause := Button.new()
	pause.text = "II"
	pause.offset_left = 16
	pause.offset_top = 16
	pause.offset_right = 64
	pause.offset_bottom = 60
	pause.add_theme_font_size_override("font_size", 18)
	pause.pressed.connect(_toggle_pause)
	root.add_child(pause)

	var center := VBoxContainer.new()
	center.set_anchors_preset(Control.PRESET_CENTER_TOP)
	center.offset_left = -280
	center.offset_top = 6
	center.offset_right = 280
	center.offset_bottom = 74
	center.alignment = BoxContainer.ALIGNMENT_CENTER
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(center)
	var head := HBoxContainer.new()
	head.alignment = BoxContainer.ALIGNMENT_CENTER
	head.add_theme_constant_override("separation", 16)
	center.add_child(head)
	_wave = Label.new()
	_wave.text = "6 vs 6"
	_wave.add_theme_font_size_override("font_size", 18)
	head.add_child(_wave)
	_time = Label.new()
	_time.text = "01:28"
	_time.add_theme_font_size_override("font_size", 18)
	head.add_child(_time)
	_title = Label.new()
	_title.text = "桜ノ廃都・常世の門"
	_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_title.add_theme_font_size_override("font_size", 26)
	_title.add_theme_color_override("font_color", Palette.INK)
	center.add_child(_title)
	_domain = Label.new()
	_domain.text = "YAMATO DOMAIN"
	_domain.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_domain.add_theme_font_size_override("font_size", 13)
	_domain.add_theme_color_override("font_color", Palette.GOLD)
	center.add_child(_domain)

	var foe := VBoxContainer.new()
	foe.anchor_left = 1.0
	foe.anchor_right = 1.0
	foe.offset_left = -280
	foe.offset_top = 12
	foe.offset_right = -88
	foe.offset_bottom = 70
	foe.alignment = BoxContainer.ALIGNMENT_END
	root.add_child(foe)
	_enemy_name = Label.new()
	_enemy_name.text = "敵"
	_enemy_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_enemy_name.add_theme_color_override("font_color", Color(0.95, 0.35, 0.32))
	foe.add_child(_enemy_name)
	_enemy_text = Label.new()
	_enemy_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_enemy_text.text = "0"
	foe.add_child(_enemy_text)

	var leave := Button.new()
	leave.text = "戻る"
	leave.anchor_left = 1.0
	leave.anchor_right = 1.0
	leave.offset_left = -72
	leave.offset_top = 16
	leave.offset_right = -16
	leave.offset_bottom = 60
	leave.pressed.connect(_leave)
	root.add_child(leave)


func _build_modes(root: Control) -> void:
	var row := HBoxContainer.new()
	row.offset_left = 80
	row.offset_top = 16
	row.offset_right = 300
	row.offset_bottom = 62
	row.add_theme_constant_override("separation", 8)
	root.add_child(row)
	_mode_normal = Button.new()
	_mode_normal.text = "通常"
	_mode_normal.custom_minimum_size = Vector2(96, 40)
	_mode_normal.pressed.connect(_set_mode.bind(false))
	row.add_child(_mode_normal)
	_mode_auto = Button.new()
	_mode_auto.text = "オート"
	_mode_auto.custom_minimum_size = Vector2(96, 40)
	_mode_auto.pressed.connect(_set_mode.bind(true))
	row.add_child(_mode_auto)
	_paint_modes()


func _set_mode(auto: bool) -> void:
	_auto = auto
	if field and field.has_method("set_auto_mode"):
		field.set_auto_mode(auto)
	_paint_modes()


func _paint_modes() -> void:
	_style_mode(_mode_normal, not _auto)
	_style_mode(_mode_auto, _auto)


func _style_mode(button: Button, on: bool) -> void:
	if button == null:
		return
	var bg := Color(0.72, 0.55, 0.18, 0.96) if on else Color(0.08, 0.08, 0.11, 0.92)
	var border := Color(0.98, 0.86, 0.48) if on else Color(0.4, 0.36, 0.24, 0.8)
	var box := Chrome.flat(bg, border, 6, 1)
	button.add_theme_stylebox_override("normal", box)
	button.add_theme_stylebox_override("hover", box)
	button.add_theme_stylebox_override("pressed", box)
	button.add_theme_stylebox_override("focus", box)
	button.add_theme_color_override("font_color", Color(0.12, 0.08, 0.03) if on else Palette.INK)


func _build_speeds(root: Control) -> void:
	var col := VBoxContainer.new()
	col.offset_left = 16
	col.offset_top = 96
	col.offset_right = 88
	col.offset_bottom = 250
	col.add_theme_constant_override("separation", 8)
	root.add_child(col)
	var slow := Button.new()
	slow.text = "x1"
	slow.custom_minimum_size = Vector2(64, 36)
	slow.pressed.connect(_set_speed.bind(1.0))
	col.add_child(slow)
	var fast := Button.new()
	fast.text = "x2"
	fast.custom_minimum_size = Vector2(64, 36)
	fast.pressed.connect(_set_speed.bind(2.0))
	col.add_child(fast)


func _tight(bg: Color, border: Color) -> StyleBoxFlat:
	var box := Chrome.flat(bg, border, 6, 1)
	box.content_margin_left = 2
	box.content_margin_right = 2
	box.content_margin_top = 2
	box.content_margin_bottom = 2
	return box


func _build_dock(root: Control) -> void:
	var dock := Panel.new()
	dock.name = "Dock"
	dock.anchor_top = 1.0
	dock.anchor_right = 1.0
	dock.anchor_bottom = 1.0
	dock.offset_top = -188
	dock.mouse_filter = Control.MOUSE_FILTER_STOP
	dock.add_theme_stylebox_override("panel", Chrome.flat(Color(0.015, 0.016, 0.024, 0.94), Color(0.55, 0.45, 0.22, 0.9), 0, 1))
	root.add_child(dock)

	var body := HBoxContainer.new()
	body.name = "Body"
	body.set_anchors_preset(Control.PRESET_FULL_RECT)
	body.offset_left = 8
	body.offset_top = 8
	body.offset_right = -8
	body.offset_bottom = -32
	body.add_theme_constant_override("separation", 8)
	dock.add_child(body)

	var pad := VBoxContainer.new()
	pad.custom_minimum_size = Vector2(112, 0)
	pad.add_theme_constant_override("separation", 4)
	body.add_child(pad)
	var lead := Label.new()
	lead.text = "先導"
	lead.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lead.add_theme_font_size_override("font_size", 14)
	lead.add_theme_color_override("font_color", Palette.GOLD)
	pad.add_child(lead)
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 4)
	grid.add_theme_constant_override("v_separation", 4)
	pad.add_child(grid)
	_move_key(grid, "", "")
	_move_key(grid, "前", "move_forward")
	_move_key(grid, "", "")
	_move_key(grid, "左", "move_left")
	_dodge_key(grid)
	_move_key(grid, "右", "move_right")
	_move_key(grid, "", "")
	_move_key(grid, "後", "move_back")
	_move_key(grid, "", "")

	var party := HBoxContainer.new()
	party.name = "Party"
	party.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	party.mouse_filter = Control.MOUSE_FILTER_STOP
	party.add_theme_constant_override("separation", 8)
	body.add_child(party)

	var relic_row := HBoxContainer.new()
	relic_row.anchor_top = 1.0
	relic_row.anchor_right = 1.0
	relic_row.anchor_bottom = 1.0
	relic_row.offset_left = 16
	relic_row.offset_top = -30
	relic_row.offset_right = -16
	relic_row.offset_bottom = -4
	relic_row.add_theme_constant_override("separation", 12)
	dock.add_child(relic_row)
	_ours = Label.new()
	_ours.text = "味方 6"
	_ours.custom_minimum_size = Vector2(88, 0)
	_ours.add_theme_color_override("font_color", Palette.GOLD)
	_ours.add_theme_font_size_override("font_size", 16)
	relic_row.add_child(_ours)
	_goal = Label.new()
	_goal.text = "敵を全滅させよ"
	_goal.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_goal.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_goal.add_theme_font_size_override("font_size", 16)
	relic_row.add_child(_goal)
	_relic_text = Label.new()
	_relic_text.text = "敵 6"
	_relic_text.custom_minimum_size = Vector2(88, 0)
	_relic_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_relic_text.add_theme_color_override("font_color", Color(0.95, 0.35, 0.32))
	_relic_text.add_theme_font_size_override("font_size", 16)
	relic_row.add_child(_relic_text)


func _move_key(grid: GridContainer, label: String, action: String) -> void:
	if label == "":
		var gap := Control.new()
		gap.custom_minimum_size = Vector2(34, 28)
		gap.mouse_filter = Control.MOUSE_FILTER_IGNORE
		grid.add_child(gap)
		return
	var button := Button.new()
	button.text = label
	button.custom_minimum_size = Vector2(34, 28)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 13)
	button.add_theme_stylebox_override("normal", _tight(Color(0.1, 0.1, 0.14), Color(0.7, 0.58, 0.28)))
	button.button_down.connect(_hold.bind(action, true))
	button.button_up.connect(_hold.bind(action, false))
	grid.add_child(button)


func _dodge_key(grid: GridContainer) -> void:
	var button := Button.new()
	button.text = "避"
	button.custom_minimum_size = Vector2(34, 28)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 13)
	button.tooltip_text = "先導の回避"
	button.add_theme_stylebox_override("normal", _tight(Color(0.16, 0.12, 0.05), Color(0.9, 0.75, 0.35)))
	button.pressed.connect(func() -> void: _cast_on("Player", "command_dodge"))
	grid.add_child(button)


func _hold(action: String, down: bool) -> void:
	if _ended or get_tree().paused:
		if not down:
			Input.action_release(action)
		return
	if down:
		Input.action_press(action)
	else:
		Input.action_release(action)


func _release_holds() -> void:
	for action in ["move_left", "move_right", "move_forward", "move_back"]:
		Input.action_release(action)


func _skill_name(id: String, key: String, fallback: String) -> String:
	var s = App.session()
	if s == null:
		return fallback
	var info: Dictionary = s.get_character(id)
	var pack = info.get(key, {})
	if typeof(pack) != TYPE_DICTIONARY:
		return fallback
	var full := String(pack.get("name_ja", ""))
	return full if full != "" else fallback


func _short(full: String) -> String:
	if full.length() <= 4:
		return full
	return full.substr(0, 4)


func _unit_card(info: Dictionary, index: int) -> Control:
	var accent: Color = ACCENTS[index % ACCENTS.size()]
	var pawn_name := "Player" if index == 0 else "Ally%d" % index
	var card := PanelContainer.new()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _tight(Color(0.04, 0.045, 0.07, 0.94), accent))
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 3)
	card.add_child(box)

	var id := String(info.get("id", ""))
	var head := HBoxContainer.new()
	head.add_theme_constant_override("separation", 6)
	box.add_child(head)
	var face := TextureRect.new()
	face.custom_minimum_size = Vector2(44, 44)
	face.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	face.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	face.mouse_filter = Control.MOUSE_FILTER_IGNORE
	face.texture = Art.dock(id)
	head.add_child(face)

	var meta := VBoxContainer.new()
	meta.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	meta.add_theme_constant_override("separation", 1)
	head.add_child(meta)
	var s = App.session()
	var named: Dictionary = s.get_character(id) if s else {}
	var name := Label.new()
	name.text = String(named.get("name_ja", id))
	name.mouse_filter = Control.MOUSE_FILTER_IGNORE
	name.add_theme_font_size_override("font_size", 15)
	name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	meta.add_child(name)

	var hp_text := Label.new()
	hp_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp_text.add_theme_color_override("font_color", Palette.INK)
	hp_text.add_theme_font_size_override("font_size", 13)
	hp_text.text = "%d" % int(info.get("hp", 0))
	meta.add_child(hp_text)
	card.set_meta("hp_text", hp_text)

	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(0, 8)
	bar.max_value = maxf(1.0, float(info.get("max_hp", 1)))
	bar.value = float(info.get("hp", 0))
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bar.show_percentage = false
	bar.add_theme_stylebox_override("fill", Chrome.flat(Color(0.35, 0.82, 0.42), Color(0, 0, 0, 0), 3, 0))
	meta.add_child(bar)
	card.set_meta("hp_bar", bar)
	var growth := Label.new()
	growth.mouse_filter = Control.MOUSE_FILTER_IGNORE
	growth.add_theme_font_size_override("font_size", 12)
	growth.add_theme_color_override("font_color", Palette.GOLD)
	growth.text = "Lv.%d" % int(info.get("level", 1))
	meta.add_child(growth)
	card.set_meta("growth", growth)

	var skills := HBoxContainer.new()
	skills.add_theme_constant_override("separation", 3)
	box.add_child(skills)
	var attack_name := _skill_name(id, "normal_attack", "攻撃")
	var skill_name := _skill_name(id, "skill_1", "技能")
	var guard_name := _skill_name(id, "skill_2", "秘技")
	var ult_name := _skill_name(id, "ultimate", "必殺")
	card.set_meta("attack", _cast_button(skills, _short(attack_name), attack_name, accent, pawn_name, "command_attack"))
	card.set_meta("skill1", _cast_button(skills, _short(skill_name), skill_name, accent, pawn_name, "try_skill1"))
	card.set_meta("skill2", _cast_button(skills, _short(guard_name), guard_name, accent.darkened(0.15), pawn_name, "try_skill2"))
	card.set_meta("ult", _cast_button(skills, _short(ult_name), ult_name, Color(0.95, 0.72, 0.28), pawn_name, "try_ultimate"))
	card.set_meta("wake", _cast_button(skills, "醒", "覚醒。一度だけ、攻撃が上がり被ダメが減る", Color(1.0, 0.86, 0.45), pawn_name, "try_awaken"))
	return card


func _cast_button(parent: Node, label: String, full: String, accent: Color, pawn_name: String, method: String) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(0, 34)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.mouse_filter = Control.MOUSE_FILTER_STOP
	button.focus_mode = Control.FOCUS_NONE
	button.clip_text = true
	button.text = label
	button.tooltip_text = full
	button.set_meta("ready", label)
	button.add_theme_font_size_override("font_size", 12)
	button.add_theme_stylebox_override("normal", _tight(accent.darkened(0.5), accent))
	button.add_theme_stylebox_override("hover", _tight(accent.darkened(0.25), accent))
	button.add_theme_stylebox_override("pressed", _tight(accent.darkened(0.1), Color(1, 1, 1)))
	button.add_theme_stylebox_override("disabled", _tight(Color(0.07, 0.07, 0.09), Color(0.22, 0.22, 0.24)))
	button.pressed.connect(_cast_on.bind(pawn_name, method))
	parent.add_child(button)
	return button


func _toggle_pause() -> void:
	get_tree().paused = not get_tree().paused


func _set_speed(scale: float) -> void:
	_speed = scale
	if not get_tree().paused:
		Engine.time_scale = scale


func _apply_lane(domain: String) -> void:
	if _lane == null:
		return
	var key := domain.to_lower()
	if key == "none":
		key = ""
	if key == _lane_key:
		return
	_lane_key = key
	_lane.modulate = Domains.lane_tint(key)


func _leave() -> void:
	_release_holds()
	Engine.time_scale = 1.0
	get_tree().paused = false
	get_tree().change_scene_to_file(App.HUB_SCENE)


func _tap(action: String) -> void:
	if get_tree().paused:
		return
	Input.action_press(action)
	_release.append(action)


func _cast(method: String) -> void:
	_cast_on("Player", method)


func _cast_on(pawn_name: String, method: String) -> void:
	if _ended or get_tree().paused or field == null:
		return
	var pawn := field.get_node_or_null(pawn_name)
	if pawn and pawn.has_method(method):
		var fired = pawn.call(method)
		if method == "try_ultimate" and bool(fired):
			_flash_ultimate()
		if method == "try_awaken" and bool(fired):
			_flash_awaken()


func _flash_ultimate() -> void:
	_flash_screen(Color(1.0, 0.82, 0.35, 0.38), 0.45)


func _flash_awaken() -> void:
	_flash_screen(Color(1.0, 0.94, 0.72, 0.55), 0.7)


func _flash_screen(color: Color, seconds: float) -> void:
	var flash := ColorRect.new()
	flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	flash.color = color
	add_child(flash)
	var tween := create_tween()
	tween.tween_property(flash, "modulate:a", 0.0, seconds)
	tween.finished.connect(flash.queue_free)


func _apply_stage_banner() -> void:
	var picked: Dictionary = App.stage
	if picked.is_empty() or _title == null:
		return
	_title.text = "%s  %s" % [picked.get("code", ""), picked.get("place", "")]
	if _domain:
		_domain.text = "対  %s" % String(picked.get("enemy", ""))
	if _enemy_name:
		var foes: PackedStringArray = picked.get("foes", PackedStringArray())
		var session = App.session()
		var lead := ""
		if foes.size() > 0 and session:
			var named: Dictionary = session.get_character(String(foes[0]))
			lead = String(named.get("name_ja", foes[0]))
		_enemy_name.text = "%s  ほか5" % lead if lead != "" else "敵  6体"


func _refresh_hud() -> void:
	if field == null or not field.has_method("get_snapshot") or _time == null:
		return
	_apply_stage_banner()
	var snap: Dictionary = field.get_snapshot()
	_time.text = Clock.fmt_time(float(snap.get("time", 0)))
	var foe: Dictionary = snap.get("void", {})
	if _enemy_name and App.stage.is_empty():
		var banner := String(snap.get("enemy_domain", ""))
		if banner != "":
			_enemy_name.text = banner
		else:
			var foe_id := String(foe.get("id", ""))
			var session = App.session()
			var named: Dictionary = session.get_character(foe_id) if session and foe_id != "" else {}
			var foe_name := String(named.get("name_ja", foe_id))
			_enemy_name.text = foe_name if foe_name != "" else "敵"
	var allies_left := int(snap.get("living_allies", 6))
	var enemies_left := int(snap.get("living_enemies", 6))
	if _wave:
		_wave.text = "味方 %d  対  敵 %d" % [allies_left, enemies_left]
	if _enemy_text:
		_enemy_text.text = "HP %d" % int(foe.get("hp", 0))
	if _ours:
		_ours.text = "味方 %d" % allies_left
	if _relic_text:
		_relic_text.text = "敵 %d" % enemies_left
	if _goal and not _ended:
		_goal.text = "オート：技能まで任せる" if _auto else "通常：攻撃は自動、技能はボタン"
	_apply_lane(String(snap.get("domain", "")))
	_sync_party(snap)


func _sync_party(snap: Dictionary) -> void:
	var party := get_node_or_null("BattleRoot/Dock/Body/Party") as HBoxContainer
	if party == null:
		return
	var units: Array = []
	var ids := PackedStringArray()
	var player: Dictionary = snap.get("player", {})
	if not player.is_empty():
		units.append(player)
		ids.append(String(player.get("id", "")))
	var allies: Array = snap.get("allies", [])
	for ally in allies:
		if typeof(ally) != TYPE_DICTIONARY:
			continue
		units.append(ally)
		ids.append(String(ally.get("id", "")))
	if ids != _unit_ids:
		_unit_ids = ids
		for child in party.get_children():
			child.queue_free()
		_hp_bars.clear()
		_hp_texts.clear()
		_cards.clear()
		for i in range(units.size()):
			var card := _unit_card(units[i], i)
			party.add_child(card)
			_cards.append(card)
		return
	for i in range(mini(_cards.size(), units.size())):
		_paint_card(_cards[i], units[i])


func _paint_card(card: Control, info: Dictionary) -> void:
	if card == null:
		return
	var alive := bool(info.get("alive", true))
	card.modulate = Color(1, 1, 1) if alive else Color(0.42, 0.42, 0.46)
	var bar := card.get_meta("hp_bar") as ProgressBar
	var text := card.get_meta("hp_text") as Label
	if bar:
		bar.max_value = maxf(1.0, float(info.get("max_hp", 1)))
		bar.value = float(info.get("hp", 0))
	if text:
		text.text = "%d / %d" % [int(info.get("hp", 0)), int(info.get("max_hp", 1))]
	_paint_wait(card.get_meta("attack") as Button, alive, 0.0, false)
	_paint_wait(card.get_meta("skill1") as Button, alive, float(info.get("skill1", 0)), false)
	_paint_wait(card.get_meta("skill2") as Button, alive, float(info.get("skill2", 0)), false)
	_paint_wait(card.get_meta("ult") as Button, alive, float(info.get("ult", 0)), true)
	var growth := card.get_meta("growth") as Label
	if growth:
		var rank := int(info.get("awaken", 0))
		var marks := ["未覚醒", "覚醒 I", "覚醒 II", "覚醒 III", "覚醒 IV"]
		var note: String = marks[mini(rank, 4)]
		if float(info.get("awaken_banner", 0.0)) > 0.05:
			note = "覚醒した"
		elif float(info.get("level_banner", 0.0)) > 0.05:
			note = "Lv UP"
		growth.text = "Lv.%d  %s" % [int(info.get("level", 1)), note]
	var wake := card.get_meta("wake") as Button
	if wake:
		var used := bool(info.get("awaken_used", false))
		var left := float(info.get("awaken_left", 0.0))
		var gauge := int(float(info.get("awaken_gauge", 0.0)))
		if not alive or used:
			wake.disabled = true
			wake.text = "済" if used else "—"
		elif left > 0.05:
			wake.disabled = true
			wake.text = "醒"
		elif gauge >= 100:
			wake.disabled = false
			wake.text = "醒"
		else:
			wake.disabled = true
			wake.text = "%d" % gauge


func _paint_wait(button: Button, alive: bool, value: float, ultimate: bool) -> void:
	if button == null:
		return
	var ready := String(button.get_meta("ready"))
	if not alive:
		button.disabled = true
		button.text = "—"
		return
	if ultimate:
		var charge := int(value)
		button.disabled = charge < 100
		button.text = ready if charge >= 100 else "%d" % charge
		return
	button.disabled = value > 0.05
	button.text = ready if value <= 0.05 else "%.0f" % value


func _on_match_ended(winner: int) -> void:
	if _ended:
		return
	_ended = true
	_release_holds()
	Engine.time_scale = 1.0
	get_tree().paused = false
	if _title:
		_title.text = "記憶、復元" if int(winner) == 0 else "記憶、喪失"
	if _domain:
		_domain.text = "決着"
	if _goal:
		_goal.text = "決着"
	await get_tree().create_timer(0.45).timeout
	get_tree().change_scene_to_file(App.RESULT_SCENE)
