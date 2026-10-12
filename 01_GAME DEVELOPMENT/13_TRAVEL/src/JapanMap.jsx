import { useMemo, useState } from "react";
import { DESTINATIONS as CURATED } from "./destinations.js";
import { regionAreas, regionPins, withRegions } from "./regions.js";

const PROJECT = { lon0: 127.2, lat0: 46, sx: 13.4, sy: 12.4, pad: 16 };
const VIEW = { w: 280, h: 290 };

const PLACES = withRegions(CURATED);
const PINS = regionPins(PLACES);
const AREAS = regionAreas();

const LAND = {
  hokkaido: [
    [45.42, 141.75], [45.2, 142.15], [44.6, 143.2], [44.05, 145.15], [43.35, 145.55],
    [43.05, 145.1], [42.55, 143.5], [41.95, 143.25], [42.15, 142.2], [42.35, 141.05],
    [41.8, 141.0], [41.78, 140.55], [42.25, 139.85], [43.35, 140.35], [43.85, 141.45],
    [44.7, 141.55], [45.3, 141.55],
  ],
  honshu: [
    [41.52, 140.95], [41.35, 141.45], [40.55, 141.55], [39.65, 141.95], [38.9, 141.65],
    [38.25, 140.95], [37.05, 140.95], [35.72, 140.85], [35.15, 140.35], [34.92, 139.85],
    [35.25, 139.75], [35.15, 139.15], [34.65, 138.85], [34.6, 138.22], [34.6, 137.15],
    [34.25, 136.85], [33.75, 136.05], [33.45, 135.76], [33.85, 135.15], [34.25, 135.05],
    [34.55, 135.0], [34.65, 134.55], [34.45, 133.55], [34.25, 132.55], [34.05, 131.55],
    [33.95, 130.95], [34.25, 131.15], [34.75, 131.85], [35.45, 132.95], [35.55, 134.25],
    [35.65, 134.85], [35.55, 135.35], [35.65, 136.05], [36.55, 136.55], [37.35, 137.05],
    [37.52, 137.3], [37.15, 137.85], [37.95, 139.05], [38.95, 139.75], [39.75, 140.05],
    [40.55, 139.95], [41.15, 140.25], [41.5, 140.45],
  ],
  shikoku: [
    [34.35, 134.05], [34.15, 134.55], [33.55, 134.3], [33.25, 134.18], [32.95, 133.35],
    [32.72, 132.95], [33.05, 132.45], [33.45, 132.35], [33.95, 132.75], [34.25, 133.55],
    [34.38, 133.95],
  ],
  kyushu: [
    [33.95, 130.95], [33.55, 131.65], [33.15, 131.85], [32.45, 131.65], [31.75, 131.45],
    [31.35, 130.85], [31.25, 130.45], [31.7, 130.15], [32.35, 129.85], [32.75, 129.75],
    [33.25, 129.75], [33.65, 130.25], [33.9, 130.55],
  ],
};

function project(lat, lon) {
  return {
    x: PROJECT.pad + (lon - PROJECT.lon0) * PROJECT.sx,
    y: PROJECT.pad + (PROJECT.lat0 - lat) * PROJECT.sy,
  };
}

function landPath(points) {
  const ring = points.map(([lat, lon]) => project(lat, lon));
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const first = mid(ring[ring.length - 1], ring[0]);
  let path = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  for (let index = 0; index < ring.length; index += 1) {
    const point = ring[index];
    const next = ring[(index + 1) % ring.length];
    const middle = mid(point, next);
    path += ` Q ${point.x.toFixed(1)} ${point.y.toFixed(1)} ${middle.x.toFixed(1)} ${middle.y.toFixed(1)}`;
  }
  return `${path} Z`;
}

function spread(pins) {
  const placed = pins.map((pin) => ({ ...pin, ox: pin.x, oy: pin.y }));
  for (let round = 0; round < 24; round += 1) {
    for (let left = 0; left < placed.length; left += 1) {
      for (let right = left + 1; right < placed.length; right += 1) {
        let dx = placed[right].x - placed[left].x;
        let dy = placed[right].y - placed[left].y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const gap = 12 - dist;
        if (gap <= 0) continue;
        dx /= dist;
        dy /= dist;
        placed[left].x -= dx * gap * 0.5;
        placed[left].y -= dy * gap * 0.5;
        placed[right].x += dx * gap * 0.5;
        placed[right].y += dy * gap * 0.5;
      }
    }
    for (const pin of placed) {
      const dx = pin.x - pin.ox;
      const dy = pin.y - pin.oy;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        pin.x = pin.ox + (dx / dist) * 10;
        pin.y = pin.oy + (dy / dist) * 10;
      }
    }
  }
  return placed;
}

const LAND_PATH = Object.values(LAND).map(landPath).join(" ");

export default function JapanMap({ origin, selectedId, onPick }) {
  const [hoverId, setHoverId] = useState(null);
  const byId = useMemo(() => Object.fromEntries(PLACES.map((dest) => [dest.id, dest])), []);
  const pins = useMemo(() => spread(PINS.map((pin) => ({ ...pin, ...project(pin.lat, pin.lon) }))), []);
  const active = byId[hoverId || selectedId];

  return (
    <div className="map-pane">
      <div className="request-head">
        <h2>日本地図</h2>
        <p>{origin ? `${origin}発から、どの県でも行程を作ります。` : "印を押すと、その県の行程を作ります。"}</p>
      </div>
      <svg className="japan-map" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label="日本地図">
        <rect width={VIEW.w} height={VIEW.h} rx="22" fill="#f4fbf8" />
        <path d={LAND_PATH} fill="#c9f0de" stroke="#7dcfb0" strokeWidth="1.2" />
        {[...pins].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)).map((pin) => {
          const dest = byId[pin.id];
          const selected = pin.id === selectedId;
          return (
            <g
              key={pin.id}
              className={selected ? "pin selected" : "pin"}
              transform={`translate(${pin.x.toFixed(1)} ${pin.y.toFixed(1)})`}
              onMouseEnter={() => setHoverId(pin.id)}
              onMouseLeave={() => setHoverId(null)}
              onFocus={() => setHoverId(pin.id)}
              onBlur={() => setHoverId(null)}
            >
              <circle
                r="12"
                className="pin-hit"
                role="button"
                tabIndex={0}
                aria-label={`${dest.name}、${dest.region}`}
                aria-pressed={selected}
                onClick={() => onPick(pin.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onPick(pin.id);
                  }
                }}
              />
              <circle r={selected ? 6.5 : 4.5} className="pin-dot" />
            </g>
          );
        })}
      </svg>
      <p className="map-caption">
        {active ? `${active.name}（${active.region}） ${active.blurb}` : "印に触れると、地名が出ます。"}
      </p>
      {AREAS.map(([label, names]) => (
        <div key={label} className="map-group">
          <p>{label}</p>
          <div className="examples">
            {names.map((name) => {
              const dest = PLACES.find((item) => item.name === name);
              return (
                <button key={name} type="button" aria-pressed={dest?.id === selectedId} onClick={() => onPick(dest.id)}>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="map-group">
        <p>くわしい行き先</p>
        <div className="examples">
          {CURATED.map((dest) => (
            <button key={dest.id} type="button" aria-pressed={dest.id === selectedId} onClick={() => onPick(dest.id)}>
              {dest.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
