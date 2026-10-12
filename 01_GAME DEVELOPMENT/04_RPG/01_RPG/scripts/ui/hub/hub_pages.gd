extends RefCounted

const PAGES := {
	"home": preload("res://scripts/ui/hub/screens/home_screen.gd"),
	"book": preload("res://scripts/ui/hub/screens/book_screen.gd"),
	"detail": preload("res://scripts/ui/hub/screens/detail_screen.gd"),
	"form": preload("res://scripts/ui/hub/screens/form_screen.gd"),
	"map": preload("res://scripts/ui/hub/screens/map_screen.gd"),
	"story": preload("res://scripts/ui/hub/screens/story_screen.gd"),
	"shop": preload("res://scripts/ui/hub/screens/shop_screen.gd"),
	"event": preload("res://scripts/ui/hub/screens/event_screen.gd"),
	"sortie": preload("res://scripts/ui/hub/screens/sortie_screen.gd"),
	"brief": preload("res://scripts/ui/hub/screens/brief_screen.gd"),
}

const NAV := [
	["home", "ホーム"],
	["sortie", "出撃"],
	["book", "キャラクター"],
	["form", "編成"],
	["map", "神域"],
	["story", "アーカイブ"],
	["shop", "ショップ"],
]

const FULL_BLEED := ["story"]
