extends Control

const App := preload("res://scripts/shared/app.gd")


func _ready() -> void:
	var session = App.ensure_catalog()
	if session and String(session.get_selected_id()).is_empty():
		session.set_selected_id("amaterasu")
	get_tree().change_scene_to_file.call_deferred(App.TITLE_SCENE)
