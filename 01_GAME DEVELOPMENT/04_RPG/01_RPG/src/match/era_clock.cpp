#include "match/era_clock.hpp"

namespace aeterna {

static const char *ERA_NAMES[] = { "VOID", "MYTH", "ANCIENT", "MEDIEVAL", "EARLY MODERN", "MODERN", "CONTEMPORARY" };

void EraClock::reset() {
	index = 0;
	timer = 0.0f;
}

bool EraClock::tick(double delta, bool fast_ult) {
	timer += (float)delta;
	if (timer >= (fast_ult ? 70.0f : 80.0f)) {
		timer = 0.0f;
		index = (index + 1) % 7;
		return true;
	}
	return false;
}

int EraClock::get_index() const { return index; }

godot::String EraClock::name() const { return godot::String(ERA_NAMES[index]); }

const char *EraClock::name_at(int i) {
	if (i < 0 || i > 6) {
		return ERA_NAMES[0];
	}
	return ERA_NAMES[i];
}

} // namespace aeterna
