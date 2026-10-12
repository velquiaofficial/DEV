extends RefCounted

const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, info: Dictionary) -> void:
	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 16)
	stage.add_child(row)
	var menu := VBoxContainer.new()
	menu.custom_minimum_size = Vector2(180, 0)
	row.add_child(menu)
	var shop_title := Label.new()
	shop_title.text = "ショップ"
	shop_title.add_theme_font_size_override("font_size", 24)
	shop_title.add_theme_color_override("font_color", Palette.GOLD)
	menu.add_child(shop_title)
	for pair in [["pickup", "ピックアップ"], ["normal", "通常召喚"], ["event", "発掘"]]:
		var button := Chrome.nav_button(String(pair[1]), host._shop == String(pair[0]))
		button.pressed.connect(host._set_shop.bind(String(pair[0])))
		menu.add_child(button)

	var banner := PanelContainer.new()
	banner.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(banner)
	var art := TextureRect.new()
	art.custom_minimum_size = Vector2(420, 520)
	art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	var banner_id: String = host._selected if host._shop == "pickup" else "athena"
	var banner_art := Art.slot("shop.%s" % String(host._shop), {"id": banner_id})
	art.texture = banner_art if banner_art else Art.portrait(info if host._shop == "pickup" else {}, banner_id)
	banner.add_child(art)

	var pull := VBoxContainer.new()
	pull.custom_minimum_size = Vector2(280, 0)
	pull.add_theme_constant_override("separation", 10)
	row.add_child(pull)
	var head := Label.new()
	head.text = "ピックアップ召喚" if host._shop != "event" else "RELIC発掘"
	head.add_theme_font_size_override("font_size", 26)
	pull.add_child(head)
	var focus: Dictionary = s.get_character(banner_id) if s else {}
	var name := Label.new()
	name.text = String(focus.get("name_ja", banner_id))
	name.add_theme_font_size_override("font_size", 32)
	name.add_theme_color_override("font_color", Palette.GOLD)
	pull.add_child(name)
	var quote := Label.new()
	quote.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quote.text = String(focus.get("story", ""))
	pull.add_child(quote)
	if host._note != "":
		var note := Label.new()
		note.text = host._note
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		note.add_theme_color_override("font_color", Palette.GOLD)
		pull.add_child(note)
	if host._shop == "event":
		var dig := Chrome.gold_button("発掘する")
		dig.custom_minimum_size = Vector2(0, 64)
		dig.pressed.connect(host._excavate)
		pull.add_child(dig)
	else:
		var one := Chrome.gold_button("1回召喚\n80")
		one.custom_minimum_size = Vector2(0, 72)
		one.pressed.connect(host._summon.bind(1))
		pull.add_child(one)
		var ten := Button.new()
		ten.text = "10回召喚\n800"
		ten.custom_minimum_size = Vector2(0, 72)
		ten.pressed.connect(host._summon.bind(10))
		pull.add_child(ten)
		var bond := Button.new()
		bond.text = "絆を深める\n記憶片20"
		bond.custom_minimum_size = Vector2(0, 64)
		bond.pressed.connect(host._deepen_bond)
		pull.add_child(bond)
		var train := Button.new()
		train.text = "鍛錬する"
		train.custom_minimum_size = Vector2(0, 64)
		train.pressed.connect(host._raise_selected)
		pull.add_child(train)
