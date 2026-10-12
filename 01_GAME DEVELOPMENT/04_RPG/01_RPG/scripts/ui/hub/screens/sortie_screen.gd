extends RefCounted

const Campaign := preload("res://scripts/shared/campaign.gd")
const Ledger := preload("res://scripts/shared/ledger.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, _info: Dictionary) -> void:
	var chosen: Dictionary = Campaign.by_code(String(host._stage_code))
	var chapter: Dictionary = Campaign.chapter(String(chosen.get("chapter", host._chapter_id)))
	host._chapter_id = String(chapter.get("id", host._chapter_id))
	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.add_theme_constant_override("separation", 8)
	stage.add_child(box)

	var chapters := GridContainer.new()
	chapters.columns = 6
	chapters.add_theme_constant_override("h_separation", 6)
	chapters.add_theme_constant_override("v_separation", 6)
	box.add_child(chapters)
	for raw in Campaign.chapters():
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var cid := String(row.get("id", ""))
		var button := Button.new()
		button.text = "%s %s" % [cid, row.get("name", "")]
		button.custom_minimum_size = Vector2(108, 36)
		if cid == String(host._chapter_id):
			button.modulate = Color(1.2, 1.05, 0.7)
		button.pressed.connect(host._pick_chapter.bind(cid))
		chapters.add_child(button)

	var head := Label.new()
	head.text = "%s    対  %s" % [chapter.get("name", ""), chapter.get("enemy", "")]
	head.add_theme_font_size_override("font_size", 26)
	head.add_theme_color_override("font_color", Palette.GOLD)
	box.add_child(head)

	var blurb := Label.new()
	blurb.text = String(chapter.get("blurb", ""))
	blurb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	blurb.add_theme_color_override("font_color", Palette.FLAVOR)
	box.add_child(blurb)

	var place := Label.new()
	place.text = "%s    %s" % [chosen.get("code", ""), chosen.get("place", "")]
	place.add_theme_font_size_override("font_size", 22)
	box.add_child(place)

	var foe := Label.new()
	foe.text = "相手    %s    推奨Lv.%d    初回報酬 記憶片%d" % [
		_enemy_line(s, chosen),
		int(chosen.get("recommend", 1)),
		int(chosen.get("reward", 0)),
	]
	foe.add_theme_color_override("font_color", Color(0.95, 0.45, 0.4))
	foe.add_theme_font_size_override("font_size", 18)
	box.add_child(foe)

	var brief := Label.new()
	brief.text = String(chosen.get("brief", ""))
	brief.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	box.add_child(brief)

	var open := Ledger.is_open(String(chosen.get("code", "")))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	box.add_child(actions)
	var talk := Button.new()
	talk.text = "この地の記憶"
	talk.custom_minimum_size = Vector2(180, 48)
	talk.disabled = not open
	talk.pressed.connect(host._open_brief)
	actions.add_child(talk)
	var go := Chrome.gold_button("このステージで戦闘" if open else "まだ入れない")
	go.custom_minimum_size = Vector2(280, 48)
	go.disabled = not open
	go.pressed.connect(host._begin_stage)
	actions.add_child(go)
	if Ledger.is_cleared(String(chosen.get("code", ""))):
		var done := Label.new()
		done.text = "取り戻した"
		done.add_theme_color_override("font_color", Palette.GOLD)
		actions.add_child(done)

	var grid := GridContainer.new()
	grid.columns = 5
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 8)
	grid.add_theme_constant_override("v_separation", 8)
	box.add_child(grid)
	for raw in Campaign.stages_of(String(host._chapter_id)):
		if typeof(raw) != TYPE_DICTIONARY:
			continue
		var row: Dictionary = raw
		var code := String(row.get("code", ""))
		var button := Button.new()
		var mark := "済" if Ledger.is_cleared(code) else ""
		button.text = "%s  %s\n%s" % [code, mark, row.get("place", "")]
		button.custom_minimum_size = Vector2(168, 64)
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.disabled = not Ledger.is_open(code)
		if code == String(chosen.get("code", "")):
			button.modulate = Color(1.2, 1.05, 0.7)
		button.pressed.connect(host._pick_stage.bind(code))
		grid.add_child(button)


static func _enemy_line(s, chosen: Dictionary) -> String:
	var names: PackedStringArray = PackedStringArray()
	var foes: PackedStringArray = PackedStringArray()
	var raw = chosen.get("foes", [])
	if raw is PackedStringArray:
		foes = raw
	elif raw is Array:
		for id in raw:
			foes.append(String(id))
	for id in foes:
		var entry: Dictionary = s.get_character(String(id)) if s else {}
		var name := String(entry.get("name_ja", id))
		names.append(name if name != "" else String(id))
	return "%s    %s" % [chosen.get("enemy", ""), " / ".join(names)]
