extends RefCounted

const Kit := preload("res://scripts/ui/hub/hub_kit.gd")


static func fill(host, stage: Control, s, _info: Dictionary) -> void:
	var filters := HBoxContainer.new()
	filters.set_anchors_preset(Control.PRESET_TOP_WIDE)
	filters.offset_bottom = 44
	filters.add_theme_constant_override("separation", 6)
	stage.add_child(filters)
	for pair in Kit.FILTERS:
		var key := String(pair[0])
		var button := Button.new()
		button.text = String(pair[1])
		button.custom_minimum_size = Vector2(96, 36)
		if host._filter == key:
			button.modulate = Color(1.2, 1.05, 0.7)
		button.pressed.connect(host._set_filter.bind(key))
		filters.add_child(button)

	var scroll := ScrollContainer.new()
	scroll.anchor_right = 1.0
	scroll.anchor_bottom = 1.0
	scroll.offset_top = 52
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	stage.add_child(scroll)
	var grid := GridContainer.new()
	grid.columns = 6
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	scroll.add_child(grid)
	if s == null:
		return
	var roster: Array = s.get_playable_roster() if s.has_method("get_playable_roster") else s.get_roster()
	for entry in roster:
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var card_info: Dictionary = entry
		if host._filter != "all" and Kit.nation(card_info) != host._filter:
			continue
		grid.add_child(Kit.unit_card(host, card_info, s, Vector2(168, 220), false))
