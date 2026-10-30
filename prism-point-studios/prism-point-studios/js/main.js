/* ==========================================================================
   Prism Point Studios — interactions
   Vanilla JS, no dependencies. Every effect degrades gracefully:
   without JS the page is fully visible and usable.
   ========================================================================== */

(() => {
  "use strict";

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  root.classList.add("js");

  // True while the page is scrolling itself after a nav click (keeps the nav visible)
  let autoScrolling = false;
  let autoScrollTimer = null;

  /* ---------------------------------------------------------------------
     0. Wire external links from js/config.js
     --------------------------------------------------------------------- */
  const links = window.PPS_LINKS || {};
  const games = window.PPS_GAMES || {};

  // A game's link: explicit URL > its Roblox page from placeId > a Roblox search for its name
  const gameUrl = (key) => {
    const g = games[key];
    if (!g) return "";
    if (g.placeId) return `https://www.roblox.com/games/${encodeURIComponent(g.placeId)}`;
    if (g.name) return `https://www.roblox.com/discover?Keyword=${encodeURIComponent(g.name)}`;
    return "";
  };

  document.querySelectorAll("[data-link]").forEach((el) => {
    const url = links[el.dataset.link] || gameUrl(el.dataset.link);
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noopener noreferrer";
    }
  });

  /* ---------------------------------------------------------------------
     1. Text splitting
        [data-split]          headline: words rise from a mask (hero = on load,
                              data-split="scroll" = when scrolled into view)
        [data-words]          paragraph: words fade + rise one by one on view
        [data-scrub]          paragraph: words light up as you scroll through it
     --------------------------------------------------------------------- */
  const KEEP_WHOLE = ".rainbow-text, [data-nosplit]";

  // Wrap every word in <span class="word"><span>word</span></span>,
  // recursing into inline elements (keeping their classes) and leaving <br> alone.
  const wrapWords = (node, wordClass) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          const inner = document.createElement("span");
          outer.className = wordClass;
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        if (child.matches(KEEP_WHOLE)) {
          const outer = document.createElement("span");
          outer.className = wordClass;
          child.replaceWith(outer);
          outer.appendChild(child);
        } else {
          wrapWords(child, wordClass);
        }
      }
    });
  };

  const staggerWords = (el, selector, start, step, cap) => {
    el.querySelectorAll(selector).forEach((w, i) => {
      w.style.transitionDelay = `${Math.min(start + i * step, cap)}ms`;
    });
  };

  document.querySelectorAll("[data-split]").forEach((el) => {
    wrapWords(el, "word");
    const onLoad = el.dataset.split !== "scroll";
    staggerWords(el, ".word > *", onLoad ? 120 : 0, onLoad ? 70 : 55, 1200);
  });

  document.querySelectorAll("[data-words]").forEach((el) => {
    wrapWords(el, "w");
    staggerWords(el, ".w > span", 80, 22, 1100);
  });

  const scrubEls = [...document.querySelectorAll("[data-scrub]")];
  scrubEls.forEach((el) => wrapWords(el, "s"));

  // Reveal split headlines / word paragraphs when they enter the viewport
  const textTargets = document.querySelectorAll('[data-split="scroll"], [data-words]');
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const textObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35, rootMargin: "0px 0px -6% 0px" });
    textTargets.forEach((el) => textObs.observe(el));
  } else {
    textTargets.forEach((el) => el.classList.add("is-in"));
  }

  // Scroll-scrubbed paragraphs: light words up in reading order
  const updateScrub = () => {
    const vh = window.innerHeight;
    scrubEls.forEach((el) => {
      const words = el._words || (el._words = [...el.querySelectorAll(".s")]);
      const r = el.getBoundingClientRect();
      const start = vh * 0.88;            // begins when the top reaches 88% of the screen
      const end = vh * 0.42;              // done when the bottom reaches 42%
      const total = (r.height + start - end) || 1;
      const p = Math.min(1, Math.max(0, (start - r.top) / total));
      const lit = prefersReducedMotion ? words.length : Math.round(p * words.length);
      if (lit === el._lit) return;        // only touch the DOM when the count changes
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
      el._lit = lit;
    });
  };

  // Apply data-delay as a CSS variable for intro + reveal elements
  document.querySelectorAll("[data-delay]").forEach((el) => {
    el.style.setProperty("--delay", `${el.dataset.delay}ms`);
  });

  const onLoaded = () => requestAnimationFrame(() => root.classList.add("is-loaded"));
  if (document.readyState === "complete") onLoaded();
  else window.addEventListener("load", onLoaded, { once: true });
  // Safety net in case fonts/images hang
  setTimeout(onLoaded, 1800);

  /* ---------------------------------------------------------------------
     1b. Hero: hide the sharp crystal where it sits under the glass card.
         Inside the card a pre-blurred copy is shown instead, which looks like
         frosted glass without the cost of a live blur.
     --------------------------------------------------------------------- */
  const crystal = document.querySelector(".hero-crystal");
  const heroCard = document.querySelector(".hero-card");
  if (crystal && heroCard) {
    const roundedRect = (x, y, w, h, r) =>
      `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
      `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    const clipCrystal = () => {
      // Measure without the card's intro scale animation
      const c = crystal.getBoundingClientRect();
      const k = heroCard.getBoundingClientRect();
      const w = heroCard.offsetWidth, h = heroCard.offsetHeight;
      const x = k.left + (k.width - w) / 2 - c.left;
      const y = k.top + (k.height - h) / 2 - c.top;
      const r = Math.min(parseFloat(getComputedStyle(heroCard).borderTopLeftRadius) || 0, w / 2, h / 2);
      const big = 4000; // generous outer area so rays and glow are never cut
      crystal.style.clipPath =
        `path(evenodd, "M${-big} ${-big}H${big}V${big}H${-big}Z ${roundedRect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1))}")`;
    };
    clipCrystal();
    if ("ResizeObserver" in window) new ResizeObserver(clipCrystal).observe(heroCard);
    else window.addEventListener("resize", clipCrystal);
  }

  /* ---------------------------------------------------------------------
     2. Scroll reveal
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    // Auto-stagger siblings inside [data-stagger] containers
    document.querySelectorAll("[data-stagger]").forEach((group) => {
      const step = Number(group.dataset.stagger) || 100;
      group.querySelectorAll(":scope > [data-reveal]").forEach((child, i) => {
        if (!child.dataset.delay) child.style.setProperty("--delay", `${i * step}ms`);
      });
    });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------------------------------------------------------------------
     3. Header: scrolled state, hide on scroll down, progress bar
     --------------------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle("is-scrolled", y > 24);

    // Hide when scrolling down past the hero, show when scrolling up
    if (!document.body.classList.contains("menu-open") && !autoScrolling) {
      const goingDown = y > lastY;
      header?.classList.toggle("is-hidden", goingDown && y > 600);
    }

    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;


    if (scrubEls.length) updateScrub();

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  onScroll();

  /* ---------------------------------------------------------------------
     3b. In-page links: land with the section's heading just under the nav,
         so the whole section is on screen (instead of the browser's default,
         which leaves the section's top padding and cuts off its content).
     --------------------------------------------------------------------- */
  const scrollTargetY = (el) => {
    if (!el || el.id === "home") return 0;
    const pad = parseFloat(getComputedStyle(el).paddingTop) || 0;
    const navH = header ? header.querySelector(".nav").getBoundingClientRect().height + 28 : 90;
    const y = el.getBoundingClientRect().top + window.scrollY + pad - navH;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(y, max));
  };

  const scrollToSection = (el, smooth = true) => {
    autoScrolling = true;
    header?.classList.remove("is-hidden");
    window.scrollTo({ top: scrollTargetY(el), behavior: smooth && !prefersReducedMotion ? "smooth" : "auto" });
    clearTimeout(autoScrollTimer);
    autoScrollTimer = setTimeout(() => (autoScrolling = false), 1200);
  };
  window.addEventListener("scrollend", () => {
    clearTimeout(autoScrollTimer);
    autoScrollTimer = setTimeout(() => (autoScrolling = false), 80);
  });

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const hash = link.getAttribute("href");
    if (hash.length < 2) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    // Skip-link: let the browser move focus normally
    if (link.classList.contains("skip-link")) return;
    e.preventDefault();
    // Wait a frame so the mobile menu can close and unlock scrolling first
    requestAnimationFrame(() => scrollToSection(target));
    history.replaceState(null, "", hash);
  });

  // Opening the page with a #hash in the URL
  if (location.hash.length > 1) {
    const initial = document.getElementById(location.hash.slice(1));
    if (initial) window.addEventListener("load", () => setTimeout(() => scrollToSection(initial, false), 60), { once: true });
  }

  /* ---------------------------------------------------------------------
     4. Active nav link (scroll spy)
     --------------------------------------------------------------------- */
  const navLinks = document.querySelectorAll(".nav-links .nav-link");
  const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = `#${entry.target.id}`;
          navLinks.forEach((link) => {
            const active = link.getAttribute("href") === id;
            link.classList.toggle("is-active", active);
            if (active) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------------------------------------------------------------------
     5. Mobile menu
     --------------------------------------------------------------------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    header?.classList.remove("is-hidden");
    if (open) menu.querySelector("a")?.focus({ preventScroll: true });
  };

  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  menu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu?.classList.contains("is-open")) {
      setMenu(false);
      toggle?.focus();
    }
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => e.matches && setMenu(false));

  /* ---------------------------------------------------------------------
     6. Pointer effects (desktop only)
     --------------------------------------------------------------------- */
  if (finePointer && !prefersReducedMotion) {
    // 6a. Hero parallax — the crystal layer eases toward the pointer (rAF-throttled)
    const hero = document.querySelector(".hero");
    const layers = document.querySelectorAll("[data-depth]");
    let heroRaf = null, hx = 0, hy = 0;
    hero?.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      hx = (e.clientX - r.left) / r.width - 0.5;
      hy = (e.clientY - r.top) / r.height - 0.5;
      if (heroRaf) return;
      heroRaf = requestAnimationFrame(() => {
        layers.forEach((layer) => {
          const d = Number(layer.dataset.depth) || 10;
          layer.style.transform = `translate3d(${hx * d}px, ${hy * d}px, 0)`;
        });
        heroRaf = null;
      });
    }, { passive: true });
    hero?.addEventListener("pointerleave", () => {
      layers.forEach((layer) => (layer.style.transform = ""));
    });

    // 6b. Light sheen on glass panels — a highlight that follows the cursor (rAF-throttled)
    document.querySelectorAll("[data-sheen]").forEach((panel) => {
      let raf = null, mx = 0, my = 0;
      panel.addEventListener("pointermove", (e) => {
        mx = e.clientX; my = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = panel.getBoundingClientRect();
          panel.style.setProperty("--mx", `${mx - r.left}px`);
          panel.style.setProperty("--my", `${my - r.top}px`);
          raf = null;
        });
      }, { passive: true });
    });

    // 6d. 3D tilt on featured cards
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const max = Number(card.dataset.tilt) || 4;
      card.addEventListener("pointermove", (e) => {
        if (!card.classList.contains("is-visible")) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transition = "transform .25s ease-out";
        card.style.transform =
          `perspective(1400px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform .9s cubic-bezier(.2,.8,.2,1)";
        card.style.transform = "";
      });
    });

    // 6e. Magnetic buttons
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25 - 2}px)`;
      });
      btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
    });
  }

  /* ---------------------------------------------------------------------
     7. Community particles
     --------------------------------------------------------------------- */
  const particleHost = document.querySelector("[data-particles]");
  if (particleHost && !prefersReducedMotion) {
    const colors = ["#ffffff", "#cdd6ff", "#8fa3ff", "#ffffff", "#ffcfb8"];
    const count = window.innerWidth < 600 ? 8 : 16;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.setAttribute("aria-hidden", "true");
      p.style.left = `${Math.random() * 100}%`;
      p.style.bottom = `${-5 + Math.random() * 25}%`;
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = `${8 + Math.random() * 9}s`;
      p.style.animationDelay = `${-Math.random() * 14}s`;
      const s = 2 + Math.random() * 3;
      p.style.width = p.style.height = `${s}px`;
      p.style.boxShadow = `0 0 ${s * 3}px ${colors[i % colors.length]}`;
      particleHost.appendChild(p);
    }
  }

  /* ---------------------------------------------------------------------
     7b. Game loop widget — steps light up in sequence
     --------------------------------------------------------------------- */
  const loop = document.querySelector("[data-loop]");
  if (loop && !prefersReducedMotion) {
    const steps = [...loop.children];
    let current = 0;
    let loopTimer = null;
    const tick = () => {
      steps[current].classList.remove("is-on");
      current = (current + 1) % steps.length;
      steps[current].classList.add("is-on");
    };
    const start = () => { if (!loopTimer) loopTimer = setInterval(tick, 1400); };
    const stop = () => { clearInterval(loopTimer); loopTimer = null; };
    // Only animate while visible
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(loop);
    } else {
      start();
    }
  }

  /* ---------------------------------------------------------------------
     7c. Offline earnings switch
     --------------------------------------------------------------------- */
  const sw = document.querySelector("[data-toggle]");
  const swLabel = document.querySelector("[data-toggle-label]");
  sw?.addEventListener("click", () => {
    const on = sw.getAttribute("aria-checked") !== "true";
    sw.setAttribute("aria-checked", String(on));
    sw.closest(".widget")?.classList.toggle("is-paused", !on);
    if (swLabel) swLabel.textContent = on ? "On — earning while you're away" : "Off — tap to keep earning";
  });

  /* ---------------------------------------------------------------------
     7d. Principles dial
     --------------------------------------------------------------------- */
  const dial = document.querySelector("[data-dial]");
  if (dial) {
    const ARC = 754; // length of the 270° arc (r = 160)
    const arc = dial.querySelector("[data-dial-arc]");
    const knob = dial.querySelector("[data-dial-knob]");
    const value = dial.querySelector("[data-dial-value]");
    const caption = dial.querySelector("[data-dial-caption]");
    const count = dial.querySelector("[data-dial-count]");
    const tabs = [...dial.querySelectorAll(".dial-tab")];
    const ticks = dial.querySelector("[data-dial-ticks]");

    // Tick marks around the dial
    if (ticks) {
      const ns = "http://www.w3.org/2000/svg";
      for (let i = 0; i <= 36; i++) {
        const a = ((135 + (270 / 36) * i) * Math.PI) / 180;
        const r1 = 182, r2 = i % 6 === 0 ? 194 : 188;
        const line = document.createElementNS(ns, "line");
        line.setAttribute("x1", 200 + r1 * Math.cos(a));
        line.setAttribute("y1", 200 + r1 * Math.sin(a));
        line.setAttribute("x2", 200 + r2 * Math.cos(a));
        line.setAttribute("y2", 200 + r2 * Math.sin(a));
        line.setAttribute("stroke", i % 6 === 0 ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.2)");
        line.setAttribute("stroke-width", "1.5");
        line.setAttribute("stroke-linecap", "round");
        ticks.appendChild(line);
      }
    }

    const setDial = (frac) => {
      if (arc) arc.style.strokeDashoffset = String(ARC * (1 - frac));
      if (knob) knob.style.transform = `rotate(${135 + 270 * frac}deg)`;
    };

    const select = (tab, animateText = true) => {
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      setDial(Number(tab.dataset.frac));
      if (count) count.textContent = `${tabs.indexOf(tab) + 1} / ${tabs.length}`;
      const swap = () => {
        if (value) value.textContent = tab.dataset.value;
        if (caption) caption.textContent = tab.dataset.caption;
        value?.classList.remove("is-swapping");
        caption?.classList.remove("is-swapping");
      };
      if (animateText && !prefersReducedMotion) {
        value?.classList.add("is-swapping");
        caption?.classList.add("is-swapping");
        setTimeout(swap, 280);
      } else {
        swap();
      }
    };

    tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));

    // Arrow-key navigation between tabs
    dial.querySelector("[role=tablist]")?.addEventListener("keydown", (e) => {
      const i = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); next.focus(); select(next); }
    });

    // Start empty, sweep to the first value once the dial scrolls into view
    if (knob) knob.style.transform = "rotate(135deg)";
    const first = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      const dialObs = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => select(first, false), 400);
        dialObs.disconnect();
      }, { threshold: 0.4 });
      dialObs.observe(dial);
    } else {
      select(first, false);
    }
  }

  /* ---------------------------------------------------------------------
     9. Game carousel
        Every slide gets a position relative to the active one:
        0 = centre, -1/1 = faded at the sides, anything else = hidden.
        Positions wrap around, so there's always a game peeking on each side.
     --------------------------------------------------------------------- */
  const carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    const slides = [...carousel.querySelectorAll(".slide")];
    const prevBtn = carousel.querySelector("[data-carousel-prev]");
    const nextBtn = carousel.querySelector("[data-carousel-next]");
    const dotsWrap = carousel.querySelector("[data-carousel-dots]");
    const viewport = carousel.querySelector("[data-carousel-viewport]");
    const n = slides.length;
    let active = 0;
    let lastRel = slides.map(() => null);

    // Relative position, wrapped into the range around 0
    const relOf = (i) => {
      let r = (((i - active) % n) + n) % n;
      if (r > Math.floor(n / 2)) r -= n;
      return r;
    };

    const focusables = (slide) => slide.querySelectorAll("a, button, [tabindex]");

    const dots = slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", slide.getAttribute("aria-label") || `Game ${i + 1}`);
      dot.addEventListener("click", () => go(i));
      dotsWrap?.appendChild(dot);
      return dot;
    });

    const render = () => {
      slides.forEach((slide, i) => {
        const rel = relOf(i);
        const prev = lastRel[i];
        // A slide wrapping from one side to the other jumps instead of sliding across
        const jump = prev !== null && Math.abs(rel - prev) > 1;
        slide.classList.toggle("no-anim", jump);
        if (jump) void slide.offsetWidth;

        slide.style.setProperty("--rel", String(rel));
        slide.classList.toggle("is-active", rel === 0);
        slide.classList.toggle("is-side", Math.abs(rel) === 1);
        slide.classList.toggle("is-left", rel === -1);
        slide.classList.toggle("is-right", rel === 1);
        slide.classList.toggle("is-hidden", Math.abs(rel) > 1);

        // Only the centre slide is reachable by keyboard / screen readers
        const isActive = rel === 0;
        slide.setAttribute("aria-hidden", String(!isActive));
        focusables(slide).forEach((el) => (isActive ? el.removeAttribute("tabindex") : el.setAttribute("tabindex", "-1")));

        if (jump) requestAnimationFrame(() => slide.classList.remove("no-anim"));
        lastRel[i] = rel;
      });
      dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === active)));
      if (n < 2) { prevBtn?.setAttribute("hidden", ""); nextBtn?.setAttribute("hidden", ""); }
    };

    const go = (i) => {
      active = ((i % n) + n) % n;
      render();
      // Let freshly centred slides run their text animations
      slides[active].querySelectorAll('[data-split="scroll"], [data-words]').forEach((el) => el.classList.add("is-in"));
    };

    prevBtn?.addEventListener("click", () => go(active - 1));
    nextBtn?.addEventListener("click", () => go(active + 1));

    // Clicking a faded side slide brings it to the centre
    slides.forEach((slide, i) => slide.addEventListener("click", () => { if (i !== active) go(i); }));

    // Arrow keys while the carousel has focus
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    });

    // Swipe on touch screens
    let startX = null, startY = null;
    viewport?.addEventListener("pointerdown", (e) => { startX = e.clientX; startY = e.clientY; }, { passive: true });
    viewport?.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    render();
  }

  /* ---------------------------------------------------------------------
     10. Live Roblox stats
         placeId → universeId → players / visits / favorites / like ratio
     --------------------------------------------------------------------- */
  const statsCfg = Object.assign({ apiDomain: "roproxy.com", refreshSeconds: 60 }, window.PPS_STATS || {});
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  const exact = new Intl.NumberFormat("en");
  const fmt = (n) => (n < 10000 ? exact.format(n) : compact.format(n));

  const getJSON = async (url) => {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  };

  // Animate a number from its current value to the target
  const countTo = (el, target, suffix = "") => {
    const from = Number(el.dataset.n || 0);
    el.dataset.n = target;
    if (prefersReducedMotion || from === target) {
      el.textContent = fmt(target) + suffix;
      return;
    }
    const t0 = performance.now();
    const dur = from === 0 ? 1400 : 700;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(from + (target - from) * eased)) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    if (from !== 0) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  };

  const loadStats = async (slide) => {
    const key = slide.dataset.game;
    const box = slide.querySelector("[data-stats]");
    const cfg = games[key];
    if (!box) return;
    if (!cfg || !(cfg.placeId || cfg.universeId)) {
      box.classList.add("is-unavailable");
      return;
    }
    const api = (sub, path) => `https://${sub}.${statsCfg.apiDomain}${path}`;
    const set = (name, value, suffix) => {
      const el = box.querySelector(`[data-stat="${name}"]`);
      if (el && Number.isFinite(value)) countTo(el, value, suffix);
    };

    const refresh = async (first) => {
      try {
        if (first) box.classList.add("is-loading");
        let universeId = cfg.universeId;
        if (!universeId) {
          universeId = (await getJSON(api("apis", `/universes/v1/places/${cfg.placeId}/universe`))).universeId;
          cfg.universeId = universeId;
        }
        const [info, votes] = await Promise.all([
          getJSON(api("games", `/v1/games?universeIds=${universeId}`)),
          getJSON(api("games", `/v1/games/votes?universeIds=${universeId}`)).catch(() => null),
        ]);
        const g = info.data && info.data[0];
        if (!g) throw new Error("Game not found");
        box.classList.remove("is-loading", "is-unavailable");
        set("playing", g.playing);
        set("visits", g.visits);
        set("favorites", g.favoritedCount);
        const v = votes && votes.data && votes.data[0];
        if (v && v.upVotes + v.downVotes > 0) {
          const pct = Math.round((v.upVotes / (v.upVotes + v.downVotes)) * 100);
          const el = box.querySelector('[data-stat="likes"]');
          if (el) countTo(el, pct, "%");
        }
      } catch (err) {
        box.classList.remove("is-loading");
        box.classList.add("is-unavailable");
        console.warn("[Prism Point] Couldn't load stats:", err);
      }
    };

    await refresh(true);

    // Keep "Playing now" fresh while the tab is visible
    const every = Math.max(20, Number(statsCfg.refreshSeconds) || 60) * 1000;
    setInterval(() => { if (!document.hidden) refresh(false); }, every);
  };

  // Fetch only when the games section gets close to the screen
  const statSlides = document.querySelectorAll(".slide[data-game]");
  if (statSlides.length) {
    const start = () => statSlides.forEach(loadStats);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        start();
      }, { rootMargin: "400px 0px" });
      io.observe(document.querySelector("#games") || statSlides[0]);
    } else {
      start();
    }
  }

  /* ---------------------------------------------------------------------
     8. Footer year
     --------------------------------------------------------------------- */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
