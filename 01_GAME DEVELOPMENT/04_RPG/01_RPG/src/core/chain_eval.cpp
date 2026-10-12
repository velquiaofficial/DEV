#include "core/chain_eval.hpp"

#include "core/catalog.hpp"

#include <godot_cpp/variant/array.hpp>
#include <godot_cpp/variant/dictionary.hpp>
#include <godot_cpp/variant/string.hpp>
#include <godot_cpp/variant/variant.hpp>

using namespace godot;

namespace aeterna {

Dictionary evaluate_chains(const Catalog &catalog, const PackedStringArray &party) {
	Dictionary out;
	out[String("hp")] = false;
	out[String("capture")] = false;
	out[String("heal")] = false;
	out[String("guard")] = false;
	out[String("ult")] = false;
	Array names;
	Array chains = catalog.get_chains();
	for (int c = 0; c < chains.size(); c++) {
		Dictionary chain = Dictionary(chains[c]);
		String type = chain.get(String("type"), String());
		if (type == "era") {
			Dictionary eras;
			for (int i = 0; i < party.size(); i++) {
				Dictionary ch = catalog.character(party[i]);
				eras[String(ch.get(String("era"), String()))] = true;
			}
			if (eras.size() >= int(chain.get(String("need"), 3))) {
				out[String("hp")] = true;
				names.append(chain.get(String("name"), String("era")));
			}
			continue;
		}
		Array members = Array(chain.get(String("members"), Array()));
		int hit = 0;
		for (int i = 0; i < party.size(); i++) {
			for (int m = 0; m < members.size(); m++) {
				if (String(members[m]) == party[i]) {
					hit++;
				}
			}
		}
		if (hit >= int(chain.get(String("need"), 2))) {
			String bonus = chain.get(String("bonus"), String());
			out[bonus] = true;
			names.append(chain.get(String("name"), bonus));
		}
	}
	out[String("names")] = names;
	return out;
}

} // namespace aeterna
