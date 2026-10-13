"use strict";

/**
 * Auto-load app-kit for pages that include this script.
 * Optionally auto-loads sibling features.js when data-vq-features is set.
 */
(function () {
  if (window.__VQ_INJECTED__) return;
  window.__VQ_INJECTED__ = true;

  const script = document.currentScript;
  const base = script
    ? script.src.replace(/inject\.js(?:\?.*)?$/, "")
    : "../_APP_SHARED/";

  function load(src) {
    return new Promise((resolve, reject) => {
      if ([...document.scripts].some((s) => s.src && s.src.indexOf(src) !== -1)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  window.VQLoadKit = async function () {
    if (!window.VQKit) await load(base + "app-kit.js");
    return window.VQKit;
  };

  window.VQLoadFeatures = async function (path) {
    await window.VQLoadKit();
    const src = path || "features.js";
    await load(src);
  };

  // Convenience: <script src=".../inject.js" data-vq-features></script>
  if (script && script.hasAttribute("data-vq-features")) {
    const run = () => window.VQLoadFeatures(script.getAttribute("data-vq-features") || "features.js");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(run, 0);
      });
    } else {
      setTimeout(run, 0);
    }
  }
})();
