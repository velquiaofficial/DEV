extends RefCounted

const Kit := preload("res://scripts/ui/hub/hub_kit.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, _info: Dictionary) -> void:
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.add_theme_constant_override("separation", 12)
	stage.add_child(box)
	var head := Label.new()
	head.text = "編成    FORMATION"
	head.add_theme_font_size_override("font_size", 28)
	head.add_theme_color_override("font_color", Palette.GOLD)
	box.add_child(head)

	var party: PackedStringArray = s.get_party() if s else PackedStringArray()
	var slots := HBoxContainer.new()
	slots.add_theme_constant_override("separation", 12)
	slots.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_child(slots)
	for i in range(6):
		if i < party.size() and i < 6:
			var id := String(party[i])
			var entry: Dictionary = s.get_character(id) if s else {}
			var slot := VBoxContainer.new()
			slot.add_child(Kit.unit_card(host, entry, s, Vector2(180, 220), true))
			var clear := Button.new()
			clear.text = "外す"
			clear.pressed.connect(host._clear_slot.bind(i))
			slot.add_child(clear)
			slots.add_child(slot)
		else:
			var empty := PanelContainer.new()
			empty.custom_minimum_size = Vector2(180, 240)
			var label := Label.new()
			label.text = "空き"
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
			empty.add_child(label)
			slots.add_child(empty)

	var bonus: Dictionary = s.evaluate_party() if s else {}
	var lead := Label.new()
	lead.text = "リーダースキル    %s" % str(bonus.get("names", []))
	lead.add_theme_color_override("font_color", Palette.GOLD)
	box.add_child(lead)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	box.add_child(actions)
	var auto := Chrome.gold_button("おまかせ編成")
	auto.pressed.connect(host._auto_party)
	actions.add_child(auto)
	var fight := Chrome.gold_button("出撃")
	fight.pressed.connect(host._sortie)
	actions.add_child(fight)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	box.add_child(scroll)
	var grid := GridContainer.new()
	grid.columns = 8
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	scroll.add_child(grid)
	if s == null:
		return
	var roster: Array = s.get_playable_roster()
	for entry in roster:
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var card_info: Dictionary = entry
		if not bool(s.is_unlocked(String(card_info.get("id", "")))):
			continue
		grid.add_child(Kit.unit_card(host, card_info, s, Vector2(120, 156), true))
