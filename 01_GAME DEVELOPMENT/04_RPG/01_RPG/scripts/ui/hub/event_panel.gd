extends RefCounted

const Palette := preload("res://scripts/shared/palette.gd")


static func fill(body: VBoxContainer, s, host: Control) -> void:
	var hint := Label.new()
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.text = "召喚しない。RELIC発掘 → 古代文字解析 → 記憶同期 → 世界が変化 → 少女の目が開く。"
	body.add_child(hint)
	if s == null:
		return
	var dug: Array = []
	var prog: Dictionary = s.get_progress()
	if prog.has("excavated"):
		dug = prog.get("excavated", [])
	var count := Label.new()
	count.text = "発掘したRELIC  %s    記憶片 %d" % [str(dug.size() if typeof(dug) != TYPE_NIL else 0), s.get_fragments()]
	count.add_theme_color_override("font_color", Palette.GOLD)
	body.add_child(count)
	var steps := Label.new()
	steps.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	steps.text = "1 発掘    2 解析    3 同期    4 文明復元    5 シルエット    6 開眼    7 名前"
	body.add_child(steps)
	var dig := Button.new()
	dig.text = "RELICを発掘する（記憶片40）"
	dig.custom_minimum_size = Vector2(0, 52)
	dig.pressed.connect(host._excavate)
	body.add_child(dig)
	var op := Button.new()
	op.text = "オープニングを再生"
	op.custom_minimum_size = Vector2(0, 52)
	op.pressed.connect(host._play_opening)
	body.add_child(op)
	var pv := Button.new()
	pv.text = "30秒PVを本編システムで再生"
	pv.custom_minimum_size = Vector2(0, 52)
	pv.pressed.connect(host._play_trailer)
	body.add_child(pv)
	var Library := preload("res://scripts/shared/library.gd")
	var Ledger := preload("res://scripts/shared/ledger.gd")
	var shown := 0
	for raw in Library.missions():
		if typeof(raw) != TYPE_DICTIONARY or shown >= 8:
			continue
		var mission: Dictionary = raw
		var mid := String(mission.get("id", ""))
		if Ledger.is_claimed(mid):
			continue
		var need := String(mission.get("stage", ""))
		var row := Button.new()
		row.custom_minimum_size = Vector2(0, 44)
		if Ledger.is_cleared(need):
			row.text = "受け取る  %s  +%d" % [mission.get("title", mid), int(mission.get("reward", 0))]
			row.pressed.connect(host._claim_mission.bind(mid, int(mission.get("reward", 0))))
		else:
			row.text = "未達  %s" % mission.get("title", mid)
			row.disabled = true
			shown = 8
		body.add_child(row)
		shown += 1
	var pv_note := Label.new()
	pv_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	pv_note.text = "偽演出ではない。色を失った東京 → 天照 → RELIC → ヤマト復元 → アテナ → ヘラス → 衝突 → タイトル。"
	pv_note.add_theme_color_override("font_color", Palette.FLAVOR)
	body.add_child(pv_note)
