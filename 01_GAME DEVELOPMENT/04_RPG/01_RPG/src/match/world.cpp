#include "match/world.hpp"

#include "combat/pawn.hpp"
#include "match/relic.hpp"

using namespace godot;

namespace aeterna {

AeternaPawn *MatchWorld::nearest_foe(AeternaPawn *src) const {
	if (!src) {
		return nullptr;
	}
	if (src->get_team() == 0) {
		AeternaPawn *best = nullptr;
		float best_d = 1.0e9f;
		if (antagonist && antagonist->is_alive()) {
			best = antagonist;
			best_d = src->get_global_position().distance_to(antagonist->get_global_position());
		}
		for (int i = 0; i < foes.size(); i++) {
			AeternaPawn *foe = Object::cast_to<AeternaPawn>(foes[i]);
			if (!foe || !foe->is_alive()) {
				continue;
			}
			float d = src->get_global_position().distance_to(foe->get_global_position());
			if (d < best_d) {
				best_d = d;
				best = foe;
			}
		}
		return best;
	}
	AeternaPawn *best = nullptr;
	float best_d = 1.0e9f;
	if (player && player->is_alive()) {
		best = player;
		best_d = src->get_global_position().distance_to(player->get_global_position());
	}
	for (int i = 0; i < allies.size(); i++) {
		AeternaPawn *ally = Object::cast_to<AeternaPawn>(allies[i]);
		if (!ally || !ally->is_alive()) {
			continue;
		}
		float d = src->get_global_position().distance_to(ally->get_global_position());
		if (d < best_d) {
			best_d = d;
			best = ally;
		}
	}
	return best;
}

RelicShard *MatchWorld::nearest_relic(const Vector2 &from, int prefer_owner) const {
	RelicShard *best = nullptr;
	float best_d = 1.0e9f;
	for (int i = 0; i < relics.size(); i++) {
		RelicShard *relic = Object::cast_to<RelicShard>(relics[i]);
		if (!relic) {
			continue;
		}
		if (prefer_owner == -1 && relic->get_owner_team() >= 0) {
			continue;
		}
		if (prefer_owner >= 0 && relic->get_owner_team() != prefer_owner) {
			continue;
		}
		float d = from.distance_to(relic->get_global_position());
		if (d < best_d) {
			best_d = d;
			best = relic;
		}
	}
	return best;
}

int MatchWorld::count_owned(int team) const {
	int n = 0;
	for (int i = 0; i < relics.size(); i++) {
		RelicShard *relic = Object::cast_to<RelicShard>(relics[i]);
		if (relic && relic->get_owner_team() == team) {
			n++;
		}
	}
	return n;
}

bool MatchWorld::any_relicsia_alive() const {
	if (player && player->is_alive()) {
		return true;
	}
	for (int i = 0; i < allies.size(); i++) {
		AeternaPawn *ally = Object::cast_to<AeternaPawn>(allies[i]);
		if (ally && ally->is_alive()) {
			return true;
		}
	}
	return false;
}

} // namespace aeterna
