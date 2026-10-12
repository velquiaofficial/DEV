#include "match/match_ai.hpp"

#include "combat/pawn.hpp"
#include "match/world.hpp"

using namespace godot;

namespace aeterna {

static AeternaPawn *across(MatchWorld &world, int slot, bool from_enemy) {
	auto same = [&](AeternaPawn *pawn) {
		return pawn && pawn->is_alive() && pawn->has_meta("form_slot") && int(pawn->get_meta("form_slot")) == slot;
	};
	if (from_enemy) {
		if (same(world.player)) {
			return world.player;
		}
		for (int i = 0; i < world.allies.size(); i++) {
			AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[i]);
			if (same(ally)) {
				return ally;
			}
		}
		return nullptr;
	}
	if (same(world.antagonist)) {
		return world.antagonist;
	}
	for (int i = 0; i < world.foes.size(); i++) {
		AeternaPawn *foe = Object::cast_to<AeternaPawn>(world.foes[i]);
		if (same(foe)) {
			return foe;
		}
	}
	return nullptr;
}

void drive_ai(MatchWorld &world, AeternaPawn *pawn, bool is_void, int kit) {
	if (!pawn || !pawn->is_alive()) {
		return;
	}
	if (pawn->has_meta("home")) {
		Vector2 home = pawn->get_meta("home");
		Vector2 back = home - pawn->get_global_position();
		if (back.length_squared() > 20.0f * 20.0f) {
			pawn->command_move(back);
		} else {
			pawn->command_move(Vector2());
		}
	} else {
		pawn->command_move(Vector2());
	}
	int slot = pawn->has_meta("form_slot") ? int(pawn->get_meta("form_slot")) : 0;
	AeternaPawn *foe = across(world, slot, is_void);
	if (!foe || !foe->is_alive()) {
		foe = world.nearest_foe(pawn);
	}
	if (!foe || !foe->is_alive()) {
		return;
	}
	pawn->look_at_x(foe->get_global_position().x);
	float dist = pawn->get_global_position().distance_to(foe->get_global_position());
	if (dist <= 1320.0f) {
		pawn->try_attack(foe);
	}
	if (kit >= 1) {
		pawn->try_skill1();
	}
	if (kit >= 2) {
		pawn->try_skill2();
		pawn->try_ultimate();
		pawn->try_awaken();
	}
}

} // namespace aeterna
