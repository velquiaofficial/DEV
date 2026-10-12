extends Control

const App := preload("res://scripts/shared/app.gd")
const Art := preload("res://scripts/shared/art.gd")
const Clock := preload("res://scripts/shared/clock.gd")


func _ready() -> void:
	var session = App.session()
	var result: Dictionary = session.get_last_result() if session else {}
	var winner := int(result.get("winner_team", -1))
	var restored := winner == 0
	var plate := Art.slot("result.win" if restored else "result.lose")
	if plate:
		var bg := TextureRect.new()
		bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		bg.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		bg.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
		bg.texture = plate
		add_child(bg)
		move_child(bg, 0)
	%Outcome.text = "文明、復元。" if restored else "記憶、消失。"
	%OutcomeEn.text = "MEMORY RECLAIMED" if restored else "OBLIVION PREVAILS"
	%Detail.text = "RELIC %d — %d    時間 %s    ERA %s    残光 %d" % [
		int(result.get("player_relics", 0)),
		int(result.get("void_relics", 0)),
		Clock.fmt_time(float(result.get("time", 0))),
		String(result.get("era", "-")),
		int(result.get("player_hp", 0)),
	]
	var civs: Array = result.get("restored_civs", [])
	var stage: Dictionary = App.stage
	var extra := ""
	if not stage.is_empty():
		extra = _grant(session, stage, restored)
	%Flavor.text = ("取り戻した文明  " + str(civs) + "\n" + extra + "失われた世界の記憶は、少女たちと共に生きている。") if restored else "忘れられた文明は、存在しなかったことになるのか。"


func _grant(session, stage: Dictionary, restored: bool) -> String:
	var Ledger := preload("res://scripts/shared/ledger.gd")
	var code := String(stage.get("code", ""))
	if code == "" or session == null:
		return ""
	var first := false
	var reward := 0
	if restored:
		first = Ledger.mark_clear(code)
		if first:
			reward = int(stage.get("reward", 0))
			if reward > 0 and session.has_method("add_fragments"):
				session.add_fragments(reward)
			if bool(stage.get("chapter_end", false)) and session.has_method("collect_civilization"):
				session.collect_civilization(String(stage.get("civ_id", "")))
				if session.has_method("save_progress"):
					session.save_progress()
	var xp := 8
	if restored:
		xp = 16 + int(stage.get("recommend", 1))
		if not first:
			xp = maxi(8, int(xp / 3))
	var party: PackedStringArray = session.get_party() if session.has_method("get_party") else PackedStringArray()
	var ups := 0
	var woke := PackedStringArray()
	var marks := ["", "I", "II", "III", "IV"]
	if session.has_method("add_experience"):
		for id in party:
			var who := String(id)
			var before := int(session.awaken_rank(who)) if session.has_method("awaken_rank") else 0
			ups += int(session.add_experience(who, xp))
			var after := int(session.awaken_rank(who)) if session.has_method("awaken_rank") else before
			if after > before:
				var named: Dictionary = session.get_character(who) if session.has_method("get_character") else {}
				var label := String(named.get("name_ja", who))
				woke.append("%sが覚醒 %s" % [label, marks[mini(after, 4)]])
	var growth := "出撃メンバーに経験 +%d。" % xp
	if ups > 0:
		growth += " %d人のLvが上がった。" % ups
	if woke.size() > 0:
		growth += " " + "、".join(woke) + "。"
	if restored and first:
		return "%s を取り戻した。記憶片 +%d。%s\n" % [stage.get("place", code), reward, growth]
	if restored:
		return "この地は、すでに取り戻している。%s\n" % growth
	return "敗れても、経験は残る。%s\n" % growth


func _on_return_pressed() -> void:
	get_tree().change_scene_to_file(App.HUB_SCENE)
