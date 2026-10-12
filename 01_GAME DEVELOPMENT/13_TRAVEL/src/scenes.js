const SCENES = {
  sea: "/covers/sea.jpg",
  shrine: "/covers/shrine.jpg",
  town: "/covers/town.jpg",
  mountain: "/covers/mountain.jpg",
  onsen: "/covers/onsen.jpg",
};

const PLACE_SCENE = {
  atami: "sea",
  numazu: "sea",
  onomichi: "sea",
  kamakura: "shrine",
  nikko: "shrine",
  nara: "shrine",
  kyoto: "shrine",
  washinomiya: "shrine",
  chichibu: "shrine",
  kawagoe: "town",
  takayama: "town",
  kanazawa: "town",
  kurashiki: "town",
  matsumoto: "town",
  toyosato: "town",
  hakone: "mountain",
  kawaguchiko: "mountain",
  okutama: "mountain",
  kusatsu: "onsen",
  arima: "onsen",
  kinosaki: "onsen",
};

export function sceneOf(dest) {
  const key = PLACE_SCENE[dest?.id]
    || (dest?.tags?.includes("sea") ? "sea" : null)
    || (dest?.tags?.includes("onsen") ? "onsen" : null)
    || (dest?.tags?.includes("history") ? "shrine" : null)
    || (dest?.tags?.includes("nature") ? "mountain" : null)
    || "town";
  return SCENES[key];
}
