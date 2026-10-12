extends Control

const App := preload("res://scripts/shared/app.gd")
const Art := preload("res://scripts/shared/art.gd")
const Chrome := preload("res://scripts/shared/chrome.gd")
const Palette := preload("res://scripts/shared/palette.gd")
const Pages := preload("res://scripts/ui/hub/hub_pages.gd")
const Kit := preload("res://scripts/ui/hub/hub_kit.gd")

var _tab := "home"
var _selected := "amaterasu"
var _filter := "all"
var _story_id := "ch0"
var _story_page := 0
var _story_log := true
var _shop := "pickup"
var _note := ""
var _stage_code := "1-1"
var _chapter_id := "1"
var _brief_mode := "stage"
var _brief_page := 0
var _bond_rank := 1
var _chronicle_vol := 1
var _skill_focus := ""


func _ready() -> void:
	var s = App.ensure_catalog()
	_selected = "amaterasu"
	if s:
		s.set_selected_id("amaterasu")
	if App.open_tab != "":
		_tab = App.open_tab
	App.open_tab = "home"
	_build()


func _build() -> void:
	for child in get_children():
		child.queue_free()
	theme = Chrome.theme()
	var s = App.session()
	var info: Dictionary = s.get_character(_selected) if s else {}
	var full := _tab in Pages.FULL_BLEED

	var bg := TextureRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	var plate := Art.slot("home.bg") if not full else Art.slot("battle.backdrop")
	if plate == null:
		plate = Art.world() if not full else Art.battlefield()
	bg.texture = plate
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	var veil := ColorRect.new()
	veil.set_anchors_preset(Control.PRESET_FULL_RECT)
	veil.color = Color(0.015, 0.02, 0.035, 0.62 if not full else 0.28)
	veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(veil)

	if not full:
		_build_rail(s, info)
		_build_top(s)
	var stage := Control.new()
	stage.name = "Stage"
	stage.set_anchors_preset(Control.PRESET_FULL_RECT)
	stage.offset_left = 0.0 if full else 252.0
	stage.offset_top = 0.0 if full else 72.0
	stage.offset_right = -16.0
	stage.offset_bottom = -12.0
	stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(stage)

	var page = Pages.PAGES.get(_tab, Pages.PAGES["home"])
	page.fill(self, stage, s, info)


func _build_rail(s, info: Dictionary) -> void:
	var rail := Panel.new()
	rail.anchor_bottom = 1.0
	rail.offset_right = 236.0
	rail.offset_bottom = 0.0
	rail.add_theme_stylebox_override("panel", Chrome.flat(Color(0.03, 0.035, 0.05, 0.92), Color(0.45, 0.36, 0.18, 0.45), 0, 0))
	add_child(rail)

	var box := VBoxContainer.new()
	box.set_anchors_preset(Control.PRESET_FULL_RECT)
	box.offset_left = 14
	box.offset_top = 18
	box.offset_right = -12
	box.offset_bottom = -16
	box.add_theme_constant_override("separation", 4)
	rail.add_child(box)

	var who := Label.new()
	who.text = String(info.get("name_ja", "プレイヤー"))
	who.add_theme_font_size_override("font_size", 18)
	box.add_child(who)
	var lv := Label.new()
	var level := int(s.get_character_level(_selected)) if s else 1
	lv.text = "Lv.%d" % level
	lv.add_theme_color_override("font_color", Palette.GOLD)
	box.add_child(lv)
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 16)
	box.add_child(gap)

	for pair in Pages.NAV:
		var key := String(pair[0])
		var button := Chrome.nav_button(String(pair[1]), _tab == key or (_tab == "detail" and key == "book"))
		button.pressed.connect(_set_tab.bind(key))
		box.add_child(button)

	var spring := Control.new()
	spring.size_flags_vertical = Control.SIZE_EXPAND_FILL
	box.add_child(spring)
	var go := Chrome.gold_button("出撃")
	go.custom_minimum_size = Vector2(0, 52)
	go.pressed.connect(_sortie)
	box.add_child(go)
	var back := Button.new()
	back.text = "タイトルへ"
	back.pressed.connect(func() -> void: get_tree().change_scene_to_file(App.TITLE_SCENE))
	box.add_child(back)


func _build_top(s) -> void:
	var bar := HBoxContainer.new()
	bar.anchor_left = 0.0
	bar.anchor_right = 1.0
	bar.offset_left = 268
	bar.offset_top = 16
	bar.offset_right = -24
	bar.offset_bottom = 60
	bar.alignment = BoxContainer.ALIGNMENT_END
	bar.add_theme_constant_override("separation", 8)
	add_child(bar)
	var frags := 0
	var wins := 0
	if s:
		frags = int(s.get_fragments())
		var prog: Dictionary = s.get_progress()
		wins = int(prog.get("wins", 0))
	bar.add_child(Chrome.chip("記憶片  %d" % frags))
	bar.add_child(Chrome.chip("勝利  %d" % wins))
	var restored: Dictionary = s.get_restored() if s else {}
	bar.add_child(Chrome.chip("復元  %d" % restored.size()))


func _set_tab(tab: String) -> void:
	_tab = tab
	_note = ""
	_build()


func _set_filter(key: String) -> void:
	_filter = key
	_tab = "book"
	_build()


func _set_shop(key: String) -> void:
	_shop = key
	_tab = "shop"
	_note = ""
	_build()


func _open_detail(id: String) -> void:
	_selected = id
	var s = App.session()
	if s:
		s.set_selected_id(id)
	_tab = "detail"
	_build()


func _pick(id: String) -> void:
	_open_detail(id)


func _assign(id: String) -> void:
	var s = App.session()
	if s == null:
		return
	if id == "oblivion":
		_note = "忘却は出撃しない"
		_tab = "detail"
		_selected = id
		_build()
		return
	if not bool(s.is_unlocked(id)):
		_note = "まだ解放されていない"
		_tab = "detail"
		_selected = id
		_build()
		return
	var party: PackedStringArray = s.get_party()
	var next := PackedStringArray()
	for member in party:
		if String(member) != id:
			next.append(member)
	if next.size() >= 6:
		next.remove_at(0)
	next.append(id)
	s.set_party(next)
	s.set_selected_id(id)
	_selected = id
	_tab = "form"
	_note = ""
	_build()


func _clear_slot(index: int) -> void:
	var s = App.session()
	if s == null:
		return
	var party: PackedStringArray = s.get_party()
	var next := PackedStringArray()
	for i in range(party.size()):
		if i != index:
			next.append(party[i])
	s.set_party(next)
	_build()


func _auto_party() -> void:
	var s = App.session()
	if s == null:
		return
	var next := PackedStringArray()
	for entry in s.get_playable_roster():
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var id := String(entry.get("id", ""))
		if id == "" or id == "oblivion":
			continue
		if bool(s.is_unlocked(id)):
			next.append(id)
		if next.size() >= 6:
			break
	if next.is_empty():
		next.append("amaterasu")
	s.set_party(next)
	s.set_selected_id(String(next[0]))
	_selected = String(next[0])
	_tab = "form"
	_build()


func _summon(times: int) -> void:
	var s = App.session()
	if s == null:
		return
	var got: PackedStringArray = PackedStringArray()
	for _i in range(times):
		var id := _locked_id(s)
		if id == "":
			break
		if bool(s.unlock_character(id)):
			got.append(id)
		else:
			break
	if got.is_empty():
		_note = "記憶片が足りないか、解放できる相手がいない"
	else:
		_selected = String(got[got.size() - 1])
		s.set_selected_id(_selected)
		_note = "迎えた  %d人" % got.size()
	_tab = "shop"
	_build()


func _locked_id(s) -> String:
	var roster: Array = s.get_playable_roster()
	for entry in roster:
		if typeof(entry) != TYPE_DICTIONARY:
			continue
		var id := String(entry.get("id", ""))
		if id == "" or id == "oblivion":
			continue
		if not bool(s.is_unlocked(id)):
			return id
	return ""


func _toggle_story_log() -> void:
	_story_log = not _story_log
	_build()


func _open_chapter(id: String) -> void:
	_story_id = id
	_story_page = 0
	_story_log = false
	_tab = "story"
	_build()


func _prev_page() -> void:
	if _story_page > 0:
		_story_page -= 1
	_build()


func _advance_story(page_count: int) -> void:
	if page_count <= 0 or _story_page >= page_count - 1:
		_next_chapter()
		return
	_story_page += 1
	_build()


func _skip_story(page_count: int) -> void:
	if page_count <= 0:
		_next_chapter()
		return
	_story_page = page_count - 1
	_build()


func _next_chapter() -> void:
	var entries := Kit.story_entries(App.session())
	var index := 0
	for i in range(entries.size()):
		if typeof(entries[i]) == TYPE_DICTIONARY and String(entries[i].get("id", "")) == _story_id:
			index = i
			break
	if entries.size() > 0:
		var nxt: Variant = entries[(index + 1) % entries.size()]
		if typeof(nxt) == TYPE_DICTIONARY:
			_story_id = String(nxt.get("id", _story_id))
			_story_page = 0
	_build()


func _sortie() -> void:
	_set_tab("sortie")


func _pick_stage(code: String) -> void:
	_stage_code = code
	_tab = "sortie"
	_build()


func _begin_stage() -> void:
	var Campaign := preload("res://scripts/shared/campaign.gd")
	var Ledger := preload("res://scripts/shared/ledger.gd")
	if not Ledger.is_open(_stage_code):
		_note = "前の地を取り戻してから"
		_tab = "sortie"
		_build()
		return
	App.stage = Campaign.by_code(_stage_code)
	get_tree().change_scene_to_file(App.MATCH_SCENE)


func _pick_chapter(chapter_id: String) -> void:
	_chapter_id = chapter_id
	var Campaign := preload("res://scripts/shared/campaign.gd")
	var rows: Array = Campaign.stages_of(chapter_id)
	if rows.size() > 0 and typeof(rows[0]) == TYPE_DICTIONARY:
		var first: Dictionary = rows[0]
		_stage_code = String(first.get("code", _stage_code))
	_tab = "sortie"
	_build()


func _open_region(civ_id: String) -> void:
	var Campaign := preload("res://scripts/shared/campaign.gd")
	var row := Campaign.chapter_for_civ(civ_id)
	var chapter_id := String(row.get("id", ""))
	if chapter_id == "":
		_note = "この神域の章は、まだ開いていない"
		_build()
		return
	_pick_chapter(chapter_id)


func _open_brief() -> void:
	_brief_mode = "stage"
	_brief_page = 0
	_set_tab("brief")


func _open_episode() -> void:
	_brief_mode = "episode"
	_brief_page = 0
	_bond_rank = 1
	_set_tab("brief")


func _open_chronicle() -> void:
	_brief_mode = "chronicle"
	_brief_page = 0
	_chronicle_vol = 1
	_set_tab("brief")


func _next_chronicle() -> void:
	_chronicle_vol += 1
	_brief_page = 0
	_build()


func _next_bond() -> void:
	_bond_rank += 1
	_brief_page = 0
	_build()


func _focus_skill(slot: String) -> void:
	_skill_focus = slot
	_tab = "detail"
	_build()


func _deepen_bond() -> void:
	var s = App.session()
	if s and s.has_method("raise_bond") and bool(s.raise_bond(_selected)):
		_note = "絆が深まった"
	else:
		_note = "記憶片が足りない"
	_build()


func _claim_mission(mission_id: String, reward: int) -> void:
	var Ledger := preload("res://scripts/shared/ledger.gd")
	var s = App.session()
	if not Ledger.claim(mission_id):
		_note = "受け取り済み"
		_build()
		return
	if s and s.has_method("add_fragments"):
		s.add_fragments(reward)
	_note = "記憶片 +%d" % reward
	_build()


func _advance_brief() -> void:
	_brief_page += 1
	_build()


func _close_brief() -> void:
	_set_tab("sortie" if _brief_mode == "stage" else "detail")


func _raise_selected() -> void:
	var s = App.session()
	if s and s.has_method("raise_level") and bool(s.raise_level(_selected)):
		_note = "レベルが上がった"
	else:
		_note = "記憶片が足りない"
	_build()


func _unlock_char() -> void:
	var s = App.session()
	if s and bool(s.unlock_character(_selected)):
		_note = "解放した"
	else:
		_note = "記憶片が足りない"
	_build()


func _excavate() -> void:
	var s = App.session()
	if s and s.has_method("excavate_relic") and bool(s.excavate_relic()):
		_note = "RELICを発掘した"
	else:
		_note = "記憶片が足りない"
	_build()


func _play_opening() -> void:
	get_tree().change_scene_to_file(App.OPENING_SCENE)


func _play_trailer() -> void:
	App.trailer_mode = true
	get_tree().change_scene_to_file(App.MATCH_SCENE)
