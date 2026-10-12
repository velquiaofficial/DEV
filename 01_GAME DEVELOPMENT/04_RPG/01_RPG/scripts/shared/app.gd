class_name AeternaApp
extends Object

const CATALOG := "res://data/relicsia.json"
const TITLE_SCENE := "res://scenes/title.tscn"
const OPENING_SCENE := "res://scenes/opening.tscn"
const HUB_SCENE := "res://scenes/hub.tscn"
const MATCH_SCENE := "res://scenes/match.tscn"
const RESULT_SCENE := "res://scenes/result.tscn"

static var trailer_mode := false
static var open_tab := "home"
static var stage := {}


static func session():
	return Engine.get_singleton("AeternaSession") if Engine.has_singleton("AeternaSession") else null


static func ensure_catalog():
	var s = session()
	if s and not s.is_catalog_loaded():
		s.load_catalog(CATALOG)
	return s
