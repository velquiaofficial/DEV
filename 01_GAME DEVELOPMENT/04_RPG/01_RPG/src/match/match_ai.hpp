#pragma once

namespace godot {
class AeternaPawn;
}

namespace aeterna {

struct MatchWorld;

void drive_ai(MatchWorld &world, godot::AeternaPawn *pawn, bool is_void, int kit);

} // namespace aeterna
