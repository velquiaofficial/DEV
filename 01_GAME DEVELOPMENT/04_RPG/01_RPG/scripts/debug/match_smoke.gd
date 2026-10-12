extends SceneTree

const App := preload("res://scripts/shared/app.gd")

func _initialize() -> void:
	var err := change_scene_to_file(App.MATCH_SCENE)
	if err != OK:
		push_error("failed to open match scene: %s" % err)
		quit(1)

func _process(_delta: float) -> bool:
	var field := root.get_node_or_null("/root/Match/MemoryField")
	if field == null:
		field = root.get_node_or_null("Match/MemoryField")
	if field == null:
		return false
	if field.has_method("is_running") and field.is_running():
		var snap: Dictionary = field.get_snapshot()
		print("AETERNA_MATCH_OK relics=", snap.get("player_relics", -1), " running=", snap.get("running", false))
		quit(0)
		return true
	return false
