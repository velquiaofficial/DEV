extends RefCounted

const DEFAULT_LANE := Color(0.42, 0.1, 0.18)

const LANES := {
	"greece": Color(0.16, 0.24, 0.52),
	"hellas": Color(0.16, 0.24, 0.52),
	"egypt": Color(0.48, 0.32, 0.1),
	"kemet": Color(0.48, 0.32, 0.1),
	"rome": Color(0.42, 0.14, 0.16),
	"roma": Color(0.42, 0.14, 0.16),
	"china": Color(0.12, 0.32, 0.24),
	"huaxia": Color(0.12, 0.32, 0.24),
	"norse": Color(0.12, 0.28, 0.36),
	"celtic": Color(0.12, 0.28, 0.36),
	"mesopotamia": Color(0.4, 0.22, 0.1),
}


static func lane_tint(domain: String) -> Color:
	var key := domain.to_lower()
	if key == "none":
		key = ""
	for token in LANES.keys():
		if key.contains(String(token)):
			return LANES[token]
	return DEFAULT_LANE
