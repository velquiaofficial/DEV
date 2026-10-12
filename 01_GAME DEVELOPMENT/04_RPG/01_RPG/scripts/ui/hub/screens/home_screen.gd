extends RefCounted

const Kit := preload("res://scripts/ui/hub/hub_kit.gd")
const Art := preload("res://scripts/shared/art.gd")
const Palette := preload("res://scripts/shared/palette.gd")


static func fill(host, stage: Control, s, info: Dictionary) -> void:
	var row := HBoxContainer.new()
	row.set_anchors_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 18)
	stage.add_child(row)

	var quote := Label.new()
	quote.custom_minimum_size = Vector2(28, 0)
	quote.size_flags_vertical = Control.SIZE_EXPAND_FILL
	quote.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	quote.text = "人類の記憶は、少女となって永遠を戦う。"
	quote.add_theme_color_override("font_color", Color(0.9, 0.86, 0.74, 0.9))
	quote.add_theme_font_size_override("font_size", 16)
	row.add_child(quote)

	var stand := TextureRect.new()
	stand.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	stand.size_flags_vertical = Control.SIZE_EXPAND_FILL
	stand.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	stand.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	var hero_art := Art.slot("home.stand", {"id": "amaterasu"})
	stand.texture = hero_art if hero_art else Art.portrait({}, "amaterasu")
	stand.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(stand)

	var side := VBoxContainer.new()
	side.custom_minimum_size = Vector2(360, 0)
	side.add_theme_constant_override("separation", 12)
	row.add_child(side)
	side.add_child(Kit.banner_card("メインストーリー", "第一章  失われた世界", "アーカイブを開く", host._set_tab.bind("story")))
	side.add_child(Kit.banner_card("イベント", "桜の記憶", "発掘と開眼", host._set_tab.bind("event")))
	var Ledger := preload("res://scripts/shared/ledger.gd")
	var nxt: Dictionary = Ledger.next_stage()
	if not nxt.is_empty():
		var where := "%s  %s" % [nxt.get("code", ""), nxt.get("place", "")]
		side.add_child(Kit.banner_card("次の出撃", where, "出撃へ", host._pick_stage.bind(String(nxt.get("code", "1-1")))))
	var pick_name := String(info.get("name_ja", "天照"))
	side.add_child(Kit.banner_card("ピックアップ召喚", "%s  出現率UP" % pick_name, "ショップへ", host._set_tab.bind("shop")))
	if host._note != "":
		var note := Label.new()
		note.text = host._note
		note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		note.add_theme_color_override("font_color", Palette.GOLD)
		side.add_child(note)
