(function () {
  "use strict";

  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(48, Math.round((width * height) / 18000));
    particles = Array.from({ length: count }, () => {
      const onRight = Math.random() < 0.64;
      return {
        x: onRight ? width * (0.42 + Math.random() * 0.58) : Math.random() * width,
        y: Math.random() * height,
        r: Math.random() < 0.12 ? 2.2 : Math.random() * 1.25 + 0.35,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        a: Math.random() * 0.5 + 0.28,
        z: 10 + Math.random() * 28
      };
    });
  }

  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener("pointermove", function (event) {
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  function placed(p) {
    return {
      x: p.x + pointerX * p.z,
      y: p.y + pointerY * p.z
    };
  }

  function draw() {
    frame = requestAnimationFrame(draw);
    if (document.hidden || width === 0) return;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = placed(particles[i]);
        const b = placed(particles[j]);
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          ctx.strokeStyle = "rgba(198, 206, 255," + ((1 - dist / 140) * 0.22) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const at = placed(p);
      if (p.r > 1.7) {
        const glow = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, p.r * 7);
        glow.addColorStop(0, "rgba(210, 206, 255," + (p.a * 0.55) + ")");
        glow.addColorStop(1, "rgba(210, 206, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(at.x, at.y, p.r * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(236, 240, 255," + p.a + ")";
      ctx.beginPath();
      ctx.arc(at.x, at.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  draw();
  window.addEventListener("resize", resize);

  const sky = document.getElementById("meteors");
  const skyCtx = sky.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let skyW = 0;
  let skyH = 0;
  let specks = [];
  let shots = [];
  let nextShot = 0;

  function resizeSky() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    skyW = sky.clientWidth;
    skyH = sky.clientHeight;
    sky.width = Math.max(1, Math.floor(skyW * dpr));
    sky.height = Math.max(1, Math.floor(skyH * dpr));
    skyCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(28, Math.round((skyW * skyH) / 28000));
    specks = Array.from({ length: count }, function () {
      return {
        x: Math.random() * skyW,
        y: Math.random() * skyH,
        r: Math.random() * 1.15 + 0.3,
        a: Math.random() * 0.45 + 0.15,
        tw: Math.random() * Math.PI * 2
      };
    });
  }

  function spawnShot() {
    const fromLeft = Math.random() < 0.72;
    shots.push({
      x: fromLeft ? Math.random() * skyW * 0.72 : skyW * (0.15 + Math.random() * 0.7),
      y: Math.random() * skyH * 0.55,
      vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 5),
      vy: 2.4 + Math.random() * 2.6,
      life: 0,
      max: 42 + Math.random() * 28,
      len: 90 + Math.random() * 140,
      bold: Math.random() < 0.35
    });
  }

  function drawSky(now) {
    requestAnimationFrame(drawSky);
    if (document.hidden || skyW === 0 || reduceMotion) return;
    skyCtx.clearRect(0, 0, skyW, skyH);

    for (let i = 0; i < specks.length; i++) {
      const s = specks[i];
      const flicker = 0.55 + Math.sin(now / 700 + s.tw) * 0.45;
      skyCtx.fillStyle = "rgba(230, 226, 255," + (s.a * flicker) + ")";
      skyCtx.beginPath();
      skyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      skyCtx.fill();
    }

    if (now > nextShot && shots.length < 3) {
      spawnShot();
      nextShot = now + 900 + Math.random() * 1600;
    }

    for (let i = shots.length - 1; i >= 0; i--) {
      const m = shots[i];
      m.life += 1;
      m.x += m.vx;
      m.y += m.vy;
      const speed = Math.hypot(m.vx, m.vy) || 1;
      const tailX = m.x - (m.vx / speed) * m.len;
      const tailY = m.y - (m.vy / speed) * m.len;
      const fade = Math.min(1, m.life / 8) * (1 - m.life / m.max);
      const grad = skyCtx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, "rgba(180, 170, 255, 0)");
      grad.addColorStop(0.7, "rgba(214, 206, 255," + (0.35 * fade) + ")");
      grad.addColorStop(1, "rgba(255, 255, 255," + (0.9 * fade) + ")");
      skyCtx.strokeStyle = grad;
      skyCtx.lineWidth = m.bold ? 2.2 : 1.5;
      skyCtx.lineCap = "round";
      skyCtx.beginPath();
      skyCtx.moveTo(tailX, tailY);
      skyCtx.lineTo(m.x, m.y);
      skyCtx.stroke();
      const halo = skyCtx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 16);
      halo.addColorStop(0, "rgba(255, 255, 255," + (0.75 * fade) + ")");
      halo.addColorStop(0.35, "rgba(196, 186, 255," + (0.28 * fade) + ")");
      halo.addColorStop(1, "rgba(196, 186, 255, 0)");
      skyCtx.fillStyle = halo;
      skyCtx.beginPath();
      skyCtx.arc(m.x, m.y, 16, 0, Math.PI * 2);
      skyCtx.fill();
      if (m.life > m.max || m.x < -140 || m.x > skyW + 140 || m.y > skyH + 40) {
        shots.splice(i, 1);
      }
    }
  }

  resizeSky();
  window.addEventListener("resize", resizeSky);
  if (!reduceMotion) requestAnimationFrame(drawSky);

  const emblem = document.querySelector(".hero-emblem");
  if (!reduceMotion && emblem) {
    window.addEventListener("pointermove", function () {
      emblem.style.transform = "rotateY(" + (pointerX * 14) + "deg) rotateX(" + (-pointerY * 10) + "deg)";
    }, { passive: true });
  }

  const progress = document.getElementById("scroll-progress");
  const header = document.querySelector(".site-header");
  let lastScroll = 0;
  window.addEventListener("scroll", function () {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    header.classList.toggle("is-scrolled", y > 12);
    if (!reduceMotion && Math.abs(y - lastScroll) > 90 && shots.length < 4) spawnShot();
    lastScroll = y;
  }, { passive: true });

  if (!reduceMotion) document.documentElement.classList.add("has-motion");
  document.querySelectorAll(".hero-copy, .section-inner").forEach(function (node) {
    node.classList.add("reveal");
  });
  const revealWatch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealWatch.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach(function (node) {
    if (reduceMotion) node.classList.add("is-in");
    else revealWatch.observe(node);
  });

  document.querySelectorAll(".biz, .panel, .principle, .slot, .card").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--sx", ((event.clientX - box.left) / box.width) * 100 + "%");
      card.style.setProperty("--sy", ((event.clientY - box.top) / box.height) * 100 + "%");
    });
  });

  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("site-nav");

  menuBtn.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open menu");
    });
  });

  const navLinks = new Map(
    Array.from(nav.querySelectorAll("a")).map(function (link) {
      return [link.getAttribute("href").slice(1), link];
    })
  );

  const spy = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.remove("active");
        });
        const current = navLinks.get(entry.target.id);
        if (current) current.classList.add("active");
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 }
  );

  ["home", "games", "play", "about", "services", "contact"].forEach(function (id) {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });

  const inbox = "velquia.official@gmail.com";

  function bindMailForm(formId, successId, subjectFor, bodyFor) {
    const form = document.getElementById(formId);
    const success = document.getElementById(successId);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const href = "mailto:" + inbox
        + "?subject=" + encodeURIComponent(subjectFor(data))
        + "&body=" + encodeURIComponent(bodyFor(data));
      window.location.href = href;
      form.hidden = true;
      success.hidden = false;
    });
  }

  bindMailForm(
    "update-form",
    "update-success",
    function () { return "VELQUIA updates"; },
    function (data) { return "Please send updates to " + data.get("email") + "."; }
  );
  bindMailForm(
    "contact-form",
    "contact-success",
    function () { return "Message for VELQUIA"; },
    function (data) {
      return "Name: " + data.get("name") + "\nEmail: " + data.get("email") + "\n\n" + data.get("message");
    }
  );
})();
