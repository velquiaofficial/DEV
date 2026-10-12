extends RefCounted

const Art := preload("res://scripts/shared/art.gd")
const EventPanel := preload("res://scripts/ui/hub/event_panel.gd")


static func fill(host, stage: Control, s, _info: Dictionary) -> void:
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.add_child(box)
	var back := Button.new()
	back.text = "＜  ホーム"
	back.pressed.connect(host._set_tab.bind("home"))
	box.add_child(back)
	var banner := Art.slot("event.banner")
	if banner:
		var pic := TextureRect.new()
		pic.custom_minimum_size = Vector2(0, 180)
		pic.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		pic.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		pic.texture = banner
		box.add_child(pic)
	EventPanel.fill(box, s, host)
