extends RefCounted

const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, info: Dictionary) -> void:
	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 20)
	stage.add_child(row)

	var art := TextureRect.new()
	art.custom_minimum_size = Vector2(520, 0)
	art.size_flags_vertical = Control.SIZE_EXPAND_FILL
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	art.texture = Art.profile(String(host._selected))
	row.add_child(art)

	var pane := VBoxContainer.new()
	pane.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pane.add_theme_constant_override("separation", 8)
	row.add_child(pane)
	var back := Button.new()
	back.text = "＜  キャラクター"
	back.alignment = HORIZONTAL_ALIGNMENT_LEFT
	back.pressed.connect(host._set_tab.bind("book"))
	pane.add_child(back)
	var name := Label.new()
	name.text = String(info.get("name_ja", host._selected))
	name.add_theme_font_size_override("font_size", 40)
	pane.add_child(name)
	var en := Label.new()
	en.text = String(info.get("name_en", ""))
	en.add_theme_color_override("font_color", Palette.GOLD)
	pane.add_child(en)
	var role := Label.new()
	role.text = "%s    %s" % [info.get("role_ui", info.get("role", "")), info.get("civilization", info.get("land", ""))]
	role.add_theme_color_override("font_color", Palette.MUTED)
	pane.add_child(role)
	var level := int(s.get_character_level(host._selected)) if s else 1
	var have := int(s.get_character_xp(host._selected)) if s and s.has_method("get_character_xp") else 0
	var need := int(s.xp_to_next(host._selected)) if s and s.has_method("xp_to_next") else 0
	var CampaignRank := preload("res://scripts/shared/campaign.gd")
	var lv := Label.new()
	var awaken := int(s.awaken_rank(host._selected)) if s and s.has_method("awaken_rank") else 0
	var awaken_name: String = ["未覚醒", "覚醒 I", "覚醒 II", "覚醒 III", "覚醒 IV"][mini(awaken, 4)]
	lv.text = "Lv.%d / 80    経験 %d / %d    %s" % [level, have, need, awaken_name] if need > 0 else "Lv.%d / 80    経験は最大    %s" % [level, awaken_name]
	lv.add_theme_font_size_override("font_size", 22)
	lv.add_theme_color_override("font_color", Palette.GOLD)
	pane.add_child(lv)
	var rank := Label.new()
	rank.text = CampaignRank.rank_note(level)
	rank.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rank.add_theme_color_override("font_color", Palette.MUTED)
	pane.add_child(rank)

	var stats: Dictionary = info.get("stats", {})
	var lines: Array = [
		["HP", stats.get("hp", info.get("hp", "-"))],
		["攻撃力", stats.get("attack", info.get("damage", "-"))],
		["防御力", stats.get("defense", "-")],
		["速度", stats.get("speed", info.get("speed", "-"))],
	]
	for pair in lines:
		var stat := Label.new()
		stat.text = "%s        %s" % [pair[0], str(pair[1])]
		stat.add_theme_font_size_override("font_size", 18)
		pane.add_child(stat)

	var Campaign := preload("res://scripts/shared/campaign.gd")
	var profile := Campaign.profile(String(host._selected))
	var paragraphs: Array = profile.get("paragraphs", [])
	var story := Label.new()
	story.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if paragraphs.size() > 0:
		var text := ""
		for paragraph in paragraphs:
			text += String(paragraph) + "\n"
		story.text = text
	else:
		story.text = String(info.get("story", ""))
	story.add_theme_color_override("font_color", Palette.FLAVOR)
	pane.add_child(story)

	var skills := HBoxContainer.new()
	skills.add_theme_constant_override("separation", 8)
	pane.add_child(skills)
	for key in ["normal_attack", "skill_1", "skill_2", "ultimate", "passive"]:
		var pack = info.get(key, {})
		if typeof(pack) != TYPE_DICTIONARY:
			continue
		var skill_name := String(pack.get("name_ja", ""))
		if skill_name == "":
			continue
		var chip := Button.new()
		chip.text = skill_name
		chip.custom_minimum_size = Vector2(96, 64)
		chip.pressed.connect(host._focus_skill.bind(String(key)))
		skills.add_child(chip)
	if String(host._skill_focus) != "":
		var Library := preload("res://scripts/shared/library.gd")
		var shown_level := int(s.get_character_level(host._selected)) if s else 1
		var skill_body := Label.new()
		skill_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		skill_body.text = Library.skill_text(String(host._selected), String(host._skill_focus), shown_level)
		skill_body.add_theme_color_override("font_color", Palette.FLAVOR)
		pane.add_child(skill_body)

	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 8)
	pane.add_child(actions)
	var form := Chrome.gold_button("編成に入れる")
	form.pressed.connect(host._assign.bind(host._selected))
	actions.add_child(form)
	var memory := Button.new()
	memory.text = "個人記憶"
	memory.pressed.connect(host._open_episode)
	actions.add_child(memory)
	var chronicle := Button.new()
	chronicle.text = "戦記"
	chronicle.pressed.connect(host._open_chronicle)
	actions.add_child(chronicle)
	if s and s.has_method("raise_level"):
		var cost := int(s.level_cost(host._selected))
		var grow := Button.new()
		grow.text = "Lvを上げる（記憶片%d）" % cost if cost > 0 else "Lv上限"
		grow.disabled = cost <= 0
		grow.pressed.connect(host._raise_selected)
		actions.add_child(grow)
	if s and not bool(s.is_unlocked(host._selected)):
		var unlock := Button.new()
		unlock.text = "80記憶片で解放"
		unlock.pressed.connect(host._unlock_char)
		actions.add_child(unlock)
