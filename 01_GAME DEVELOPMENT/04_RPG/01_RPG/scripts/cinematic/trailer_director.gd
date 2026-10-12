extends Node

const App := preload("res://scripts/shared/app.gd")

@onready var field: Node2D = $"../MemoryField"

var _elapsed := 0.0
var _shots: Array = []
var _fired: Dictionary = {}
var _playing := false


func _ready() -> void:
	if not App.trailer_mode:
		set_process(false)
		return
	_shots = _load_shots()
	_playing = true


func _process(delta: float) -> void:
	if not _playing:
		return
	_elapsed += delta
	for shot in _shots:
		var key := "%s_%s" % [shot.get("scene", 0), shot.get("id", shot.get("start", 0))]
		if _fired.get(key, false):
			continue
		if _elapsed + 0.05 < float(shot.get("start", 0)):
			continue
		_fired[key] = true
		_fire(shot)
	if _elapsed >= 30.0:
		_playing = false
		App.trailer_mode = false
		get_tree().change_scene_to_file(App.HUB_SCENE)


func _fire(shot: Dictionary) -> void:
	if field == null or not field.has_method("activate_civilization"):
		return
	var cue := String(shot.get("id", ""))
	if cue in ["RelicActivation", "MemoryWave", "YamatoShift"]:
		field.activate_civilization("japan")
	elif cue in ["AthenaArrival", "CivilizationCollision"]:
		field.activate_civilization("greece")
		if cue == "CivilizationCollision":
			field.activate_civilization("japan")


func _load_shots() -> Array:
	var file := FileAccess.open("res://trailer/trailer.json", FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return []
	var shots = parsed.get("shots", [])
	return shots if typeof(shots) == TYPE_ARRAY else []
