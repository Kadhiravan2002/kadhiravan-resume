/* ============================================================
   ANIMATIONS v2 — load with `defer`, after script.js
   No HTML changes needed: elements are tagged and split from here.
   Effects: split-text titles, scroll-linked word fill, scroll-filled
   timeline, count-up numbers, living contact backdrop, image parallax,
   scroll-speed marquee, custom cursor, card spotlight/tilt,
   magnetic buttons.
============================================================ */
(() => {
  // Respect visitors who ask for less motion: leave the site static.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  root.classList.add("js");

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ============================================================
     TEXT HELPERS
     Split with <i> tags (style.css targets "span" inside titles).
     The original text is kept in aria-label for screen readers.
  ============================================================ */
  function textNodes(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  const plainText = (el) => el.textContent.replace(/\s+/g, " ").trim();

  // Every letter in its own box (hero + projects titles)
  function splitChars(el) {
    el.setAttribute("aria-label", plainText(el));
    let ci = 0;
    textNodes(el).forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(" ");
          return;
        }
        const word = document.createElement("i");
        word.className = "sw";
        word.setAttribute("aria-hidden", "true");
        [...part].forEach((ch) => {
          const c = document.createElement("i");
          c.className = "sc";
          c.textContent = ch;
          c.style.setProperty("--ci", ci++);
          word.append(c);
        });
        frag.append(word);
      });
      node.replaceWith(frag);
    });
  }

  // Every word inside an overflow mask (about title)
  function splitWords(el) {
    el.setAttribute("aria-label", plainText(el));
    let wi = 0;
    textNodes(el).forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(" ");
          return;
        }
        const mask = document.createElement("i");
        mask.className = "mk";
        mask.setAttribute("aria-hidden", "true");
        const inner = document.createElement("i");
        inner.className = "mk-i";
        inner.textContent = part;
        inner.style.setProperty("--wi", wi++);
        mask.append(inner);
        frag.append(mask);
      });
      node.replaceWith(frag);
    });
  }

  // Each line of a title becomes its own block (skills title)
  function splitLines(el) {
    let li = 0;
    const mark = (node) => {
      node.classList.add(li % 2 ? "sl-r" : "sl-l");
      node.style.setProperty("--li", li++);
    };
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (!n.textContent.trim()) return;
        const line = document.createElement("i");
        line.className = "sl";
        line.textContent = n.textContent.trim();
        n.replaceWith(line);
        mark(line);
      } else if (n.nodeType === 1) {
        n.classList.add("sl");
        mark(n);
      }
    });
  }

  // Numbers count up from zero
  function countUp(el) {
    const to = Number(el.dataset.to);
    const comma = el.dataset.comma === "1";
    const suffix = el.dataset.suf || "";
    const format = (v) =>
      (comma ? Math.round(v).toLocaleString("en-US") : Math.round(v)) + suffix;
    const start = performance.now();
    const duration = 1700;
    const run = (el._run = {});          // token: leaving the screen cancels it

    (function step(now) {
      if (el._run !== run) return;
      const p = clamp((now - start) / duration, 0, 1);
      el.textContent = format(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ============================================================
     1. SPLIT THE TITLES  (each section gets its own style)
  ============================================================ */
  const watched = [];           // elements that receive .in-view
  const observe = (el) => watched.push(el);

  const heroTitle = $(".hero-title");
  if (heroTitle) {
    splitChars(heroTitle);
    heroTitle.classList.add("t-hero");
  }

  const aboutTitle = $(".about-title");
  if (aboutTitle) {
    splitWords(aboutTitle);
    aboutTitle.classList.add("t-words");
    observe(aboutTitle);
  }

  const skillsTitle = $(".skills-title");
  if (skillsTitle) {
    splitLines(skillsTitle);
    skillsTitle.classList.add("t-lines");
    observe(skillsTitle);
  }

  const projectsTitle = $(".projects-title");
  if (projectsTitle) {
    splitChars(projectsTitle);
    projectsTitle.classList.add("t-flip");
    observe(projectsTitle);
  }

  // Hero letters start rising right after first paint
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.add("hero-in"))
  );

  /* ---------- About lead: words light up with scroll ---------- */
  const lead = $(".about-lead");
  const leadWords = [];
  if (lead) {
    textNodes(lead).forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.append(" ");
          return;
        }
        const w = document.createElement("i");
        w.className = "lw";
        w.textContent = part;
        leadWords.push(w);
        frag.append(w);
      });
      node.replaceWith(frag);
    });
  }

  /* ---------- Numbers in experience descriptions ---------- */
  $$(".timeline-description").forEach((p) => {
    if (!/\d/.test(p.textContent)) return;
    p.innerHTML = p.innerHTML.replace(/(\d[\d,]*)(\+|%)?/g, (m, num, suf) =>
      `<strong class="count" data-to="${num.replace(/,/g, "")}" ` +
      `data-comma="${num.includes(",") ? 1 : 0}" data-suf="${suf || ""}">${m}</strong>`
    );
  });

  $$(".count").forEach((el) => {
    const comma = el.dataset.comma === "1";
    el.textContent = (comma ? "0" : "0") + (el.dataset.suf || "");
    observe(el);
  });

  /* ---------- SVG icons: let strokes draw themselves ---------- */
  $$(".about-icon svg *, .skill-icon svg *, .service-icon svg *").forEach((n) =>
    n.setAttribute("pathLength", "1")
  );

  /* ---------- Tag stagger index ---------- */
  $$(".skill-tags, .project-tags, .experience-tags").forEach((group) =>
    [...group.children].forEach((tag, i) => tag.style.setProperty("--ti", i))
  );

  /* ============================================================
     2. SCROLL REVEAL PLAN
     [selector, effect, stagger]
     stagger: "col" = by column (2-col grids), "list" = by position,
              "img" = fixed 300ms (image follows its card), "none"
  ============================================================ */
  const plan = [
    [".section-eyebrow", "up", "none"],
    [".skills-intro, .projects-intro, .services-intro, .experience-intro, .contact-description", "up", "none"],

    // About
    [".approach-title", "up", "none"],
    [".approach-item", "left", "list"],
    [".about-divider", "line", "none"],
    [".about-card", "flip", "col"],

    // Skills

    // Projects

    // Services
    [".services-title", "track", "none"],
    [".service-card", "flipx", "col"],
    [".services-cta", "up", "none"],

    // Experience
    [".experience-title", "wipet", "none"],
    [".timeline-item", "left", "list"],
    [".learning-note", "up", "none"],
    [".credentials-column .experience-column-title", "right", "none"],
    [".credentials-column > .credential-card", "right", "none"],
    [".credentials-grid .credential-card", "right", "col"],

    // Contact + footer
    [".contact-email, .contact-phone", "up", "list"],
    [".contact-option", "right", "list"],
    [".footer-layout", "fade", "none"],
  ];

  plan.forEach(([selector, effect, stagger]) => {
    $$(selector).forEach((el) => {
      if (el.dataset.reveal) return; // already tagged by an earlier rule

      const siblings = el.parentElement
        ? [...el.parentElement.children].filter((c) => c.matches(selector))
        : [el];
      const index = Math.max(0, siblings.indexOf(el));

      let type = effect;
      if (effect === "pside") type = index % 2 === 0 ? "pleft" : "pright";

      let delay = 0;
      if (stagger === "col") delay = (index % 2) * 120;
      if (stagger === "list") delay = Math.min(index, 4) * 110;
      if (stagger === "img") delay = 300;

      el.dataset.reveal = type;
      el.style.setProperty("--d", `${delay}ms`);
      observe(el);
    });
  });

  /* ---------- Scroll-scrubbed entrances (Apple-style) ----------
     Skills slide in from both sides, projects rise and grow.
     They are still observed once so tag pops and icon drawing fire. */
  const scrubs = [];
  const addScrub = (el, type) => {
    el.dataset.scrub = type;
    el.style.setProperty("--sp", "0");
    scrubs.push({ el, cur: 0, last: -1 });
    observe(el);
  };
  $$(".skill-card").forEach((el, i) => addScrub(el, i % 2 ? "right" : "left"));
  $$(".project-card").forEach((el) => addScrub(el, "grow"));
  // Project screenshots: no curtain (it exposed the dark frame behind it);
  // they are visible with the card and just settle from a soft zoom.
  $$(".project-image").forEach((el) => observe(el));

  // offsetTop ignores transforms, so the animation never feeds back into
  // the position it is measured from.
  const layoutTop = (el) => {
    let y = 0;
    for (; el; el = el.offsetParent) y += el.offsetTop;
    return y;
  };

  let scrubTime = performance.now();
  let scrubFirst = true;

  function scrubWork(now) {
    const dt = Math.min(now - scrubTime, 64);
    scrubTime = now;
    const k = 1 - Math.exp(-dt / 150);          // glide: ~150ms time constant
    const vh = window.innerHeight;
    const y = window.scrollY;

    scrubs.forEach((s) => {
      const top = layoutTop(s.el) - y;
      const raw = clamp((vh - top) / (vh * 0.38), 0, 1);
      const target = raw * raw * (3 - 2 * raw);  // smoothstep
      s.cur = scrubFirst ? target : s.cur + (target - s.cur) * k;
      if (Math.abs(target - s.cur) < 0.001) s.cur = target;
      if (Math.abs(s.cur - s.last) > 0.0004) {
        s.el.style.setProperty("--sp", s.cur.toFixed(4));
        s.last = s.cur;
      }
    });
    scrubFirst = false;
  }

  /* Contact title: words rise out of masks, the same calm effect as About */
  const contactTitle = $(".contact-title");
  if (contactTitle) {
    splitWords(contactTitle);
    contactTitle.classList.add("t-words");
    observe(contactTitle);
  }

  /* ---------- One observer for everything ---------- */
  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;
          const isCount = el.classList.contains("count");

          // Scrolled into view -> play the animation (every time)
          if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
            if (isCount) {
              if (!el._run) countUp(el);
            } else if (!el.classList.contains("in-view")) {
              el.classList.add("in-view");
            }
            return;
          }

          // Fully scrolled out -> reset, so it can play again next time
          if (!entry.isIntersecting) {
            if (isCount) {
              el._run = null;
              el.textContent = "0" + (el.dataset.suf || "");
            } else {
              el.classList.remove("in-view");
            }
          }
        });
      },
      { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" }
    );
    watched.forEach((el) => io.observe(el));
  } else {
    // Very old browsers: show everything immediately
    watched.forEach((el) => {
      if (el.classList.contains("count")) {
        el.textContent = el.dataset.to + (el.dataset.suf || "");
      } else {
        el.classList.add("in-view");
      }
    });
  }

  /* ============================================================
     3. SCROLL-DRIVEN WORK  (one requestAnimationFrame loop)
  ============================================================ */
  const progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  const header = $(".site-header");
  const hero = $(".hero");
  const timeline = $$(".timeline-item");
  const projectImages = $$(".project-image");
  const marqueeTrack = $(".marquee-track");

  let marquee = null;
  let marqueeRate = 1;
  let leadCount = -1;
  let lastY = -1;

  // The marquee keeps its CSS animation; we only change its speed.
  function getMarquee() {
    if (marquee) return marquee;
    if (!marqueeTrack || !marqueeTrack.getAnimations) return null;
    marquee =
      marqueeTrack.getAnimations().find((a) => a.animationName === "marquee-scroll") || null;
    return marquee;
  }

  function scrollWork(y) {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    // Progress bar, header shadow, back-to-top
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    if (header) header.classList.toggle("is-scrolled", y > 20);

    // Hero parallax amount (0 → 1 while the hero scrolls away)
    if (hero) {
      const hs = clamp(y / (hero.offsetHeight * 0.9), 0, 1);
      hero.style.setProperty("--hs", hs.toFixed(3));
    }

    // About lead: reveal words with scroll position
    if (lead && leadWords.length) {
      const r = lead.getBoundingClientRect();
      const p = clamp((vh * 0.9 - r.top) / (vh * 0.5), 0, 1);
      const n = Math.round(p * leadWords.length);
      if (n !== leadCount) {
        leadWords.forEach((w, i) => w.classList.toggle("on", i < n));
        leadCount = n;
      }
    }

    // Experience timeline: line fills, markers light up
    const trigger = vh * 0.62;
    timeline.forEach((item) => {
      const r = item.getBoundingClientRect();
      const f = clamp((trigger - r.top - 6) / r.height, 0, 1);
      item.style.setProperty("--fill", f.toFixed(3));
      item.classList.toggle("is-lit", f > 0);
    });

    // Project screenshots drift inside their frames
    projectImages.forEach((frame) => {
      const r = frame.getBoundingClientRect();
      if (r.bottom < -60 || r.top > vh + 60) return;
      const p = clamp((r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2), -1, 1);
      frame.style.setProperty("--ip", p.toFixed(3));
    });
  }

  // Cursor state (filled in by initPointer on desktop)
  const cursor = { on: false, x: 0, y: 0, rx: 0, ry: 0, dot: null, ring: null };

  function loop(now = performance.now()) {
    scrubWork(now);
    const y = window.scrollY;
    const dy = lastY < 0 ? 0 : y - lastY;
    if (y !== lastY) scrollWork(y);
    lastY = y;

    // Marquee speeds up while you scroll fast, eases back when you stop
    const anim = getMarquee();
    if (anim) {
      const target = 1 + clamp(Math.abs(dy) * 0.16, 0, 6);
      marqueeRate = lerp(marqueeRate, target, 0.1);
      if (Math.abs(anim.playbackRate - marqueeRate) > 0.01) {
        anim.playbackRate = marqueeRate;
      }
    }

    // Custom cursor follows with a little lag on the ring
    // Custom cursor follows with a little lag on the ring
    if (cursor.on) {
      cursor.rx = lerp(cursor.rx, cursor.x, 0.15); // Slower lerp for premium elastic feel
      cursor.ry = lerp(cursor.ry, cursor.y, 0.15);
      cursor.dot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`;
      cursor.ring.style.transform = `translate3d(${cursor.rx}px, ${cursor.ry}px, 0) translate(-50%, -50%)`;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);

  /* ============================================================
     4. ACTIVE NAV LINK + MOBILE MENU STAGGER INDEX
  ============================================================ */
  const navAnchors = $$(".nav-links a[href^='#']");
  navAnchors.forEach((a, i) => a.style.setProperty("--i", i));

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((a) =>
            a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    navAnchors.forEach((a) => {
      const section = $(a.getAttribute("href"));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ============================================================
     5. DESKTOP-ONLY POINTER EFFECTS
  ============================================================ */
  function initPointer() {
    // Custom cursor: dot + trailing ring
    // Custom cursor: dot + trailing ring
    cursor.dot = document.createElement("div");
    cursor.dot.className = "cursor-dot";
    cursor.ring = document.createElement("div");
    cursor.ring.className = "cursor-ring";

    [cursor.dot, cursor.ring].forEach((n) => n.setAttribute("aria-hidden", "true"));
    document.body.append(cursor.dot, cursor.ring);

    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        cursor.x = e.clientX;
        cursor.y = e.clientY;
        if (!cursor.on) {
          cursor.on = true;
          cursor.rx = cursor.x;
          cursor.ry = cursor.y;
        }
        root.classList.add("has-cursor");
      },
      { passive: true }
    );

    root.addEventListener("mouseleave", () => root.classList.remove("has-cursor"));
    root.addEventListener("mouseenter", () => {
      if (cursor.on) root.classList.add("has-cursor");
    });

    document.addEventListener("pointerover", (e) => {
      if (!(e.target instanceof Element)) return; 
      const link = e.target.closest("a, button");

      // Ring grows only over real links and buttons; project cards
      // are not clickable, so they keep the normal cursor.
      cursor.ring.classList.toggle("is-link", Boolean(link));
    });
    document.addEventListener("pointerdown", () => cursor.ring.classList.add("is-down"));
    document.addEventListener("pointerup", () => cursor.ring.classList.remove("is-down"));

    // Hero mouse parallax (glow, orbit, abstract shape)
    if (hero) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        hero.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5) * 2);
        hero.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5) * 2);
      });
      hero.addEventListener("pointerleave", () => {
        hero.style.setProperty("--px", 0);
        hero.style.setProperty("--py", 0);
      });
    }

    // Card spotlight follows the cursor; project cards also tilt in 3D
    $$(".skill-card, .about-card, .service-card, .project-card").forEach((card) => {
      const isProject = card.classList.contains("project-card");

      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);

        if (isProject) {
          card.style.setProperty("--ry", `${(x / r.width - 0.5) * 7}deg`);
          card.style.setProperty("--rx", `${(y / r.height - 0.5) * -7}deg`);
        }
      });

      // Services: remember where the pointer enters and leaves, so the image
      // reveal opens from (and closes towards) that exact point.
      if (card.classList.contains("service-card")) {
        const mark = (e) => {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--ex", `${e.clientX - r.left}px`);
          card.style.setProperty("--ey", `${e.clientY - r.top}px`);
        };
        card.addEventListener("pointerenter", mark);
        card.addEventListener("pointerleave", mark);
      }

      card.addEventListener("pointerleave", () => {
        if (isProject) {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        }
      });
    });

    // Magnetic buttons
    $$(".button, .nav-cta, .contact-email, .contact-phone").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        // Capped so a button can never drift into its neighbour
        const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -8, 8);
        const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.28, -6, 6);
        btn.style.translate = `${dx}px ${dy}px`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.translate = "";
      });
    });
  }


  if (canHover) initPointer();
})();
