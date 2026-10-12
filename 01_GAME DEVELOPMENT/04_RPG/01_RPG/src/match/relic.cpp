#include "match/relic.hpp"

#include <godot_cpp/core/class_db.hpp>

using namespace godot;

void RelicShard::_bind_methods() {
	ClassDB::bind_method(D_METHOD("setup", "zone", "civ", "origin"), &RelicShard::setup);
	ClassDB::bind_method(D_METHOD("apply_presence", "team", "delta", "contested"), &RelicShard::apply_presence);
	ClassDB::bind_method(D_METHOD("force_capture", "team"), &RelicShard::force_capture);
	ClassDB::bind_method(D_METHOD("get_owner_team"), &RelicShard::get_owner_team);
	ClassDB::bind_method(D_METHOD("get_contest_team"), &RelicShard::get_contest_team);
	ClassDB::bind_method(D_METHOD("get_progress"), &RelicShard::get_progress);
	ClassDB::bind_method(D_METHOD("get_radius"), &RelicShard::get_radius);
	ClassDB::bind_method(D_METHOD("get_zone_index"), &RelicShard::get_zone_index);
	ClassDB::bind_method(D_METHOD("get_civilization"), &RelicShard::get_civilization);
}

void RelicShard::_ready() { queue_redraw(); }

void RelicShard::_process(double delta) {
	spin_t += (float)delta;
}

void RelicShard::_draw() {
}

void RelicShard::setup(int p_zone, const String &p_civ, const Vector2 &p_origin) {
	zone_index = p_zone;
	civilization = p_civ;
	set_position(p_origin);
}

void RelicShard::apply_presence(int team, double delta, bool contested) {
	if (team < 0) {
		if (owner_team < 0) {
			capture_progress = Math::max(0.0f, capture_progress - (float)delta * 0.35f);
			if (capture_progress <= 0.0f) {
				contest_team = -1;
			}
		}
		return;
	}
	if (owner_team == team) {
		return;
	}
	float rate = contested ? 0.35f : 1.0f;
	if (contest_team != team && contest_team >= 0 && owner_team < 0) {
		capture_progress = Math::max(0.0f, capture_progress - (float)delta * 0.8f);
		if (capture_progress <= 0.02f) {
			contest_team = team;
		}
		return;
	}
	contest_team = team;
	capture_progress += (float)delta * rate / capture_time;
	if (capture_progress >= 1.0f) {
		force_capture(team);
	}
}

void RelicShard::force_capture(int team) {
	owner_team = team;
	contest_team = -1;
	capture_progress = 1.0f;
}

int RelicShard::get_owner_team() const { return owner_team; }
int RelicShard::get_contest_team() const { return contest_team; }
float RelicShard::get_progress() const { return capture_progress; }
float RelicShard::get_radius() const { return radius; }
int RelicShard::get_zone_index() const { return zone_index; }
String RelicShard::get_civilization() const { return civilization; }
