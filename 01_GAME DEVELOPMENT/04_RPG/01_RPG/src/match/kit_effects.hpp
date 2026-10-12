#pragma once

namespace godot {
class AeternaPawn;
}

namespace aeterna {

struct MatchWorld;

void resolve_kit(MatchWorld &world, godot::AeternaPawn *src, int action);

} // namespace aeterna
