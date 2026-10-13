"use strict";

/**
 * EN / JA toggle for VELQUIA apps.
 * Usage: mark nodes with data-i18n="key" and optional data-i18n-placeholder / data-i18n-title
 * Define window.VQ_STRINGS = { en: { key: "..." }, ja: { key: "..." } }
 */

(function () {
  const KEY = "vq_app_lang";

  function current() {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "ja") return saved;
    return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  function dict() {
    return (window.VQ_STRINGS && window.VQ_STRINGS[current()]) || {};
  }

  function apply() {
    const lang = current();
    document.documentElement.lang = lang === "ja" ? "ja" : "en";
    const d = dict();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (d[key] != null) el.textContent = d[key];
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (d[key] != null) el.innerHTML = d[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (d[key] != null) el.setAttribute("placeholder", d[key]);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      if (d[key] != null) el.setAttribute("title", d[key]);
    });
    document.querySelectorAll(".lang-switch button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
    document.dispatchEvent(new CustomEvent("vq:lang", { detail: { lang } }));
  }

  function setLang(lang) {
    localStorage.setItem(KEY, lang);
    apply();
  }

  function mountSwitch() {
    if (document.querySelector(".lang-switch")) return;
    const host = document.querySelector(".side");
    if (!host) return;
    const box = document.createElement("div");
    box.className = "lang-switch";
    box.innerHTML =
      '<button type="button" data-lang="en">EN</button>' +
      '<button type="button" data-lang="ja">日本語</button>';
    box.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
    const brand = host.querySelector(".brand");
    if (brand && brand.nextSibling) host.insertBefore(box, brand.nextSibling);
    else host.prepend(box);
  }

  window.VQ_I18N = { current, apply, setLang, mountSwitch };

  document.addEventListener("DOMContentLoaded", () => {
    mountSwitch();
    apply();
  });
})();
