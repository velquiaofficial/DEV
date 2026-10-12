extends SceneTree

const App := preload("res://scripts/shared/app.gd")

func _initialize() -> void:
	var session = App.ensure_catalog()
	if session == null:
		push_error("AeternaSession singleton missing")
		quit(1)
		return
	if not session.is_catalog_loaded():
		push_error("catalog failed")
		quit(1)
		return
	var roster: Array = session.get_roster()
	var playable: Array = session.get_playable_roster()
	if playable.size() < 100:
		push_error("playable roster too small: %s" % playable.size())
		quit(1)
		return
	var regions: Array = session.get_civilizations() if session.has_method("get_civilizations") else (session.get_belts() if session.has_method("get_belts") else session.get_regions())
	if regions.size() < 10:
		push_error("civilizations missing")
		quit(1)
		return
	var xishi: Dictionary = session.get_character("xishi")
	if xishi.is_empty() or String(xishi.get("civ", "")) != "china":
		push_error("founder xishi missing")
		quit(1)
		return
	var ama: Dictionary = session.get_character("amaterasu")
	if String(ama.get("civ", "")) != "japan" or String(ama.get("relic", "")) != "yata_mirror":
		push_error("amaterasu schema mismatch")
		quit(1)
		return
	var scathach: Dictionary = session.get_character("scathach")
	if scathach.is_empty() or String(scathach.get("civ", "")) != "celtic":
		push_error("scathach missing")
		quit(1)
		return
	if session.has_method("get_seed_cast") and session.get_seed_cast().size() < 5:
		push_error("seed cast missing")
		quit(1)
		return
	if session.has_method("get_relics") and session.get_relics().size() < 5:
		push_error("relics missing")
		quit(1)
		return
	if session.has_method("get_founders") and session.get_founders().size() < 6:
		push_error("founders six missing")
		quit(1)
		return
	session.set_selected_id("amaterasu")
	var party := PackedStringArray(["amaterasu", "athena", "anubis"])
	session.set_party(party)
	var chains: Dictionary = session.evaluate_party()
	var fusion: Dictionary = session.evaluate_fusion() if session.has_method("evaluate_fusion") else {}
	print("AETERNA_SMOKE_OK roster=", roster.size(), " playable=", playable.size(), " civilizations=", regions.size(), " seed=", session.get_seed_cast() if session.has_method("get_seed_cast") else [], " fusion=", fusion.get("id", ""), " fragments=", session.get_fragments(), " chains=", chains.get("names", []))
	quit(0)
