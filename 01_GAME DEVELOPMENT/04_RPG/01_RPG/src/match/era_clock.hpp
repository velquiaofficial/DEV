#pragma once

#include <godot_cpp/variant/string.hpp>

namespace aeterna {

class EraClock {
	int index = 0;
	float timer = 0.0f;

public:
	void reset();
	bool tick(double delta, bool fast_ult);
	int get_index() const;
	godot::String name() const;
	static const char *name_at(int i);
};

} // namespace aeterna
