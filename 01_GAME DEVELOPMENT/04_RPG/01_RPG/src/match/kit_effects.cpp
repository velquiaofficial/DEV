#include "match/kit_effects.hpp"

#include "combat/pawn.hpp"
#include "match/relic.hpp"
#include "match/world.hpp"

using namespace godot;

namespace aeterna {

void resolve_kit(MatchWorld &world, AeternaPawn *src, int action) {
	if (!src || action <= 0) {
		return;
	}
	AeternaPawn *foe = world.nearest_foe(src);
	String id = src->get_character_id();
	float dist = foe ? src->get_global_position().distance_to(foe->get_global_position()) : 9999.0f;

	float reach = Math::max(1320.0f, src->get_attack_range() + 36.0f);
	float skill_reach = Math::max(1360.0f, reach);
	float power = src->outgoing_mul();
	if (src->get_team() == 0) {
		if (action == 1) {
			src->reward_xp(2);
			src->gain_awaken(5.0f);
		} else if (action == 2 || action == 3) {
			src->reward_xp(4);
			src->gain_awaken(12.0f);
		} else if (action == 4) {
			src->reward_xp(8);
			src->gain_awaken(20.0f);
		}
	}
	if (action == 1 && foe) {
		src->look_at_x(foe->get_global_position().x);
	}
	if (action == 1 && foe && dist <= reach) {
		float dmg = src->get_attack_damage();
		if (src->get_team() == 0) {
			dmg *= 1.0f + float(world.domain_shift.get("power", 0)) / 100.0f;
		}
		if (id == "anubis" && foe->get_hp() / foe->get_max_hp() < 0.4f) {
			dmg *= 1.35f;
		}
		foe->apply_damage(dmg * power);
		src->add_ult(6.0f);
		if (src->has_counter()) {
			foe->apply_damage(dmg * power * 0.45f);
		}
		return;
	}
	if (action == 2) {
		bool did = false;
		if ((id == "amaterasu" || id == "newyork" || id == "oblivion") && foe && dist <= skill_reach) {
			foe->apply_damage((id == "oblivion" ? 22.0f : src->get_attack_damage() * 1.4f) * power);
			did = true;
		} else if (id == "edo" && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.5f * power);
			did = true;
		} else if (id == "tokyo" || id == "london" || id == "roma") {
			src->set_capture_boost(1.5f);
			did = true;
		} else if (id == "isis" || id == "freya") {
			src->heal(16.0f);
			if (world.player && src != world.player) {
				world.player->heal(10.0f);
			}
			did = true;
		} else if (id == "athena") {
			src->add_shield(3.0f, 0.5f);
			did = true;
		} else if (id == "scathach" && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.45f * power);
			did = true;
		} else if (id == "ishtar" && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.35f * power);
			src->add_ult(10.0f);
			did = true;
		} else if (id == "anubis" && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.4f * power);
			did = true;
		}
		if (!did && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.35f * power);
			src->add_ult(8.0f);
		} else if (!did) {
			src->set_capture_boost(1.3f);
		}
	}
	if (action == 3) {
		if (id == "isis") {
			if (world.player && !world.player->is_alive()) {
				world.player->revive(0.4f);
			}
			for (int a = 0; a < world.allies.size(); a++) {
				AeternaPawn *ally = Object::cast_to<AeternaPawn>(world.allies[a]);
				if (ally && !ally->is_alive()) {
					ally->revive(0.4f);
					break;
				}
			}
		} else if (id == "athena") {
			src->add_counter(4.0f);
			src->add_shield(4.0f, 0.5f);
		} else if (id == "edo" && foe && dist <= skill_reach) {
			foe->apply_damage(src->get_attack_damage() * 1.6f * power);
		} else if (id == "oblivion") {
			RelicShard *relic = world.nearest_relic(src->get_global_position(), 0);
			if (relic) {
				relic->apply_presence(1, 1.4, false);
			}
		} else {
			src->heal(src->get_attack_damage() * 0.45f);
			src->add_shield(3.0f, 0.55f);
		}
	}
	if (action == 4) {
		float boom = (id == "oblivion" ? 40.0f : src->get_attack_damage() * 3.2f) * power;
		int src_slot = src->has_meta("form_slot") ? int(src->get_meta("form_slot")) : 0;
		auto burst = [&](AeternaPawn *target) {
			if (!target || !target->is_alive() || target->get_team() == src->get_team()) {
				return;
			}
			float gap = src->get_global_position().distance_to(target->get_global_position());
			if (gap > 1400.0f) {
				return;
			}
			int slot = target->has_meta("form_slot") ? int(target->get_meta("form_slot")) : 0;
			int delta = src_slot - slot;
			if (delta < 0) {
				delta = -delta;
			}
			float mul = delta == 0 ? 1.0f : (delta == 1 ? 0.55f : 0.28f);
			target->apply_damage(boom * mul);
		};
		if (src->get_team() == 0) {
			burst(world.antagonist);
			for (int i = 0; i < world.foes.size(); i++) {
				burst(Object::cast_to<AeternaPawn>(world.foes[i]));
			}
		} else {
			burst(world.player);
			for (int i = 0; i < world.allies.size(); i++) {
				burst(Object::cast_to<AeternaPawn>(world.allies[i]));
			}
		}
		(void)dist;
		(void)foe;
		RelicShard *relic = world.nearest_relic(src->get_global_position(), -2);
		if (relic && src->get_global_position().distance_to(relic->get_global_position()) <= 420.0f) {
			relic->force_capture(src->get_team());
		}
		if (id == "amaterasu" || id == "isis" || id == "freya") {
			src->heal(24.0f);
		}
		if (id == "amaterasu") {
			world.pending_civ = "japan";
		} else if (id == "athena") {
			world.pending_civ = "greece";
		} else if (id == "anubis") {
			world.pending_civ = "egypt";
		}
	}
}

} // namespace aeterna
