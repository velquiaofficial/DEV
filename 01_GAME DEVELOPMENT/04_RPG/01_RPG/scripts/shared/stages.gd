extends RefCounted

const HELLAS := ["athena", "poseidon", "apollo", "artemis", "minos", "sparta"]

const TOKYO := [
	{"code": "1-1", "place": "渋谷・桜の廃駅", "count": 3, "brief": "廃駅に、ヘラスの先遣が立っている。"},
	{"code": "1-2", "place": "原宿・記憶の通り", "count": 3, "brief": "色を失った通りを、槍が横切る。"},
	{"code": "1-3", "place": "新宿・常世の門", "count": 4, "brief": "門の前で、文明がぶつかる。"},
	{"code": "1-4", "place": "上野・不忍の残照", "count": 4, "brief": "池の記憶の上に、異国の足がつく。"},
	{"code": "1-5", "place": "浅草・雷門", "count": 5, "brief": "提灯の残光を、ヘラスが踏みにじる。"},
	{"code": "1-6", "place": "東京駅・丸の内", "count": 5, "brief": "煉瓦の層に、海の向こうの軍勢。"},
	{"code": "1-7", "place": "皇居・残された杜", "count": 6, "brief": "杜の奥で、六つの名が揃う。"},
	{"code": "1-8", "place": "お台場・沈んだ岸", "count": 6, "brief": "沈んだ岸から、ヘラスが上がってくる。"},
	{"code": "1-9", "place": "横浜・開港の層", "count": 6, "brief": "開港の記憶が、戦場に変わる。"},
	{"code": "1-10", "place": "東京・記憶核", "count": 6, "brief": "東京の核を、ヘラスが奪いに来る。"},
]


static func list() -> Array:
	var out: Array = []
	for raw in TOKYO:
		var row: Dictionary = raw
		var count := int(row.get("count", 3))
		var foes := PackedStringArray()
		for i in range(mini(count, HELLAS.size())):
			foes.append(HELLAS[i])
		out.append({
			"code": String(row.get("code", "")),
			"area": "東京",
			"place": String(row.get("place", "")),
			"brief": String(row.get("brief", "")),
			"enemy": "ヘラス",
			"foes": foes,
		})
	return out


static func by_code(code: String) -> Dictionary:
	for raw in list():
		var row: Dictionary = raw
		if String(row.get("code", "")) == code:
			return row
	var all := list()
	return all[0] if all.size() > 0 else {}
