#pragma once

#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/packed_string_array.hpp>
#include <godot_cpp/variant/variant.hpp>

namespace aeterna {

class Catalog;

godot::Dictionary evaluate_chains(const Catalog &catalog, const godot::PackedStringArray &party);

} // namespace aeterna
