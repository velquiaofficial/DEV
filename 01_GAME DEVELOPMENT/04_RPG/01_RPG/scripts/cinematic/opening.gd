extends Control

const App := preload("res://scripts/shared/app.gd")
const Palette := preload("res://scripts/shared/palette.gd")
const Art := preload("res://scripts/shared/art.gd")

var _beats: Array = []
var _index: int = 0
var _hold: float = 0.0
var _limit: float = 3.0
var _finished := false

@onready var _bg: TextureRect = $Backdrop
@onready var _portrait: TextureRect = $Portrait
@onready var _speaker: Label = $Box/Speaker
@onready var _line: Label = $Box/Line
@onready var _hint: Label = $Hint


func _ready() -> void:
	App.ensure_catalog()
	_beats = _load_beats()
	if _beats.is_empty():
		_go_hub()
		return
	_show(0)


func _process(delta: float) -> void:
	if _finished:
		return
	_hold += delta
	var span := maxf(_limit, 0.2)
	var zoom := lerpf(1.0, 1.06, clampf(_hold / span, 0.0, 1.0))
	_bg.pivot_offset = get_viewport_rect().size * 0.5
	_bg.scale = Vector2(zoom, zoom)
	if _hold >= _limit:
		_advance()


func _input(event: InputEvent) -> void:
	if _finished:
		return
	if event.is_action_pressed("ui_accept") or event.is_action_pressed("ui_select"):
		_advance()
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_advance()


func _on_skip() -> void:
	_go_hub()


func _advance() -> void:
	_show(_index + 1)


func _show(i: int) -> void:
	if i >= _beats.size():
		_go_hub()
		return
	_index = i
	_hold = 0.0
	_bg.scale = Vector2.ONE
	var beat: Dictionary = _beats[i]
	_limit = float(beat.get("hold", 3.5))
	var bg := Art.resolve(String(beat.get("bg", "")))
	if bg == null:
		bg = Art.slot("opening.cut", {"nnn": "%03d" % (i + 1)})
	_bg.texture = bg if bg else Art.slot("opening.poster")
	if _bg.texture == null:
		_bg.texture = Art.world()
	var speaker := String(beat.get("speaker", ""))
	var face: Texture2D = null
	var portrait_path := String(beat.get("portrait", ""))
	if portrait_path != "":
		face = Art.resolve(portrait_path)
	_portrait.texture = face
	_portrait.visible = face != null and not bool(beat.get("title", false))
	_speaker.text = speaker
	_speaker.visible = speaker != ""
	_line.text = String(beat.get("text", ""))
	if bool(beat.get("title", false)):
		_line.add_theme_font_size_override("font_size", 28)
		_line.add_theme_color_override("font_color", Palette.GOLD)
	else:
		_line.add_theme_font_size_override("font_size", 22)
		_line.add_theme_color_override("font_color", Palette.INK)
	_hint.text = "クリック / Enter  次へ      Esc  スキップ"


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_go_hub()


func _go_hub() -> void:
	if _finished:
		return
	_finished = true
	get_tree().change_scene_to_file(App.HUB_SCENE)


func _load_beats() -> Array:
	var file := FileAccess.open("res://data/stories/opening.json", FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return []
	var beats = parsed.get("beats", [])
	return beats if typeof(beats) == TYPE_ARRAY else []
