/* =========================================================================
   AWS Serverless Visitor Analytics Dashboard — Behaviour
   Vanilla JS only. Organized into small, independent modules that each
   set themselves up on DOMContentLoaded.
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initNav();
  initReveal();
  initHeroCanvas();
  initTimeline();
  initVisitorCounter();
  initFooterYear();
});

/* -------------------------------------------------------------------------
   1. Preloader — hides once the page has finished loading, with a small
      minimum-display time so it never just flashes on a fast connection.
   ------------------------------------------------------------------------- */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  const label = document.getElementById("preloader-text");
  if (!preloader) return;

  const messages = ["INITIALIZING STACK", "PROVISIONING EDGE", "READY"];
  let step = 0;
  const swap = setInterval(() => {
    step = (step + 1) % messages.length;
    if (label) label.textContent = messages[step];
  }, 450);

  const minDisplay = new Promise((resolve) => setTimeout(resolve, 700));
  const pageLoad = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });

  Promise.all([minDisplay, pageLoad]).then(() => {
    clearInterval(swap);
    preloader.classList.add("hidden");
    setTimeout(() => preloader.remove(), 700);
  });
}

/* -------------------------------------------------------------------------
   2. Nav — scrolled state, mobile menu toggle, and closing the mobile menu
      whenever a link is tapped.
   ------------------------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("nav-toggle");
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("menu-open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("menu-open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
}

/* -------------------------------------------------------------------------
   3. Scroll reveal — fades/rises cards and section content into view using
      IntersectionObserver instead of a scroll listener, so it stays cheap.
   ------------------------------------------------------------------------- */
function initReveal() {
  const targets = document.querySelectorAll(
    ".service-card, .feature-card, .demo-card, .flow-steps li, .architecture-frame, .section-eyebrow, .section-title, .section-lead"
  );
  if (!targets.length) return;

  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${Math.min(i % 6, 6) * 60}ms`;
  });

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
}

/* -------------------------------------------------------------------------
   4. Hero canvas — an ambient network of drifting nodes that connect when
      close together, echoing the request-flow motif used elsewhere on the
      page. Skipped entirely if the user prefers reduced motion.
   ------------------------------------------------------------------------- */
function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext("2d");
  let width, height, nodes;
  const NODE_COUNT_BASE = 42; // scales with area below

  const colors = {
    node: "rgba(232, 236, 241, 0.55)",
    lineOrange: "rgba(255, 153, 0, 0.22)",
    lineBlue: "rgba(46, 155, 240, 0.18)",
  };

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width * window.devicePixelRatio;
    height = canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const area = rect.width * rect.height;
    const count = Math.max(18, Math.min(60, Math.round((area / (1280 * 720)) * NODE_COUNT_BASE)));
    nodes = Array.from({ length: count }, () => spawnNode());
  }

  function spawnNode() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25 * window.devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * window.devicePixelRatio,
      r: (Math.random() * 1.4 + 1) * window.devicePixelRatio,
    };
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    const linkDist = 150 * window.devicePixelRatio;

    // update + draw nodes
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = colors.node;
      ctx.fill();
    });

    // draw connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          const alpha = 1 - dist / linkDist;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = (i + j) % 2 === 0
            ? colors.lineOrange.replace("0.22", (0.22 * alpha).toFixed(2))
            : colors.lineBlue.replace("0.18", (0.18 * alpha).toFixed(2));
          ctx.lineWidth = window.devicePixelRatio;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  resize();
  window.addEventListener("resize", debounce(resize, 200));
  requestAnimationFrame(step);
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* -------------------------------------------------------------------------
   5. Request flow timeline — highlights each node in sequence, timed to
      match the CSS pulse animation traveling along the connecting line.
   ------------------------------------------------------------------------- */
function initTimeline() {
  const track = document.getElementById("timeline-track");
  if (!track) return;

  const nodeEls = Array.from(track.querySelectorAll(".timeline-node"));
  if (!nodeEls.length) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    nodeEls[0].classList.add("is-active");
    return;
  }

  const CYCLE_MS = 4500; // matches the `travel` keyframe duration in style.css
  const step = CYCLE_MS / nodeEls.length;
  let current = -1;

  function activate() {
    current = (current + 1) % nodeEls.length;
    nodeEls.forEach((el) => el.classList.remove("is-active"));
    nodeEls[current].classList.add("is-active");
  }

  activate();
  setInterval(activate, step);
}

/* -------------------------------------------------------------------------
   6. Live visitor counter — calls the serverless API Gateway endpoint and
      renders whatever DynamoDB returns. No number is ever hardcoded here.

   To go live: replace API_ENDPOINT below with your own API Gateway
   invoke URL, e.g. https://abc123.execute-api.ap-south-1.amazonaws.com/visit
   ------------------------------------------------------------------------- */
function initVisitorCounter() {
  const API_ENDPOINT = "https://YOUR_API_GATEWAY_URL/visit";

  const countEl = document.getElementById("visitor-count");
  const statusDot = document.getElementById("demo-status-dot");
  const statusText = document.getElementById("demo-status-text");
  const latencyEl = document.getElementById("demo-latency");
  const noteEl = document.getElementById("demo-note");
  const refreshBtn = document.getElementById("refresh-btn");
  const heroStatusDot = document.getElementById("hero-status-dot");

  if (!countEl) return;

  async function fetchCount() {
    refreshBtn && refreshBtn.classList.add("is-spinning");
    statusText.textContent = "Connecting to API…";
    const started = performance.now();

    try {
      const res = await fetch(API_ENDPOINT, { method: "GET" });
      if (!res.ok) throw new Error(`API responded ${res.status}`);
      const data = await res.json();

      // Expecting a JSON body shaped like { count: number }. Adjust the
      // key below if your Lambda returns a different field name.
      const count = Number(data.count ?? data.visitorCount ?? data.visits);
      if (Number.isNaN(count)) throw new Error("Unexpected response shape");

      renderCount(count.toLocaleString());
      setStatus(true, "Live — connected to API Gateway");
      latencyEl.textContent = `${Math.round(performance.now() - started)} ms`;
      noteEl.textContent = "This number is fetched live from your deployed API on every page load.";
    } catch (err) {
      // Expected until API_ENDPOINT above is pointed at a real deployment.
      // Falls back to an honest, clearly-labeled local demo count rather
      // than ever hardcoding a fixed visitor number.
      runDemoFallback();
      setStatus(false, "Demo mode — API endpoint not connected");
      latencyEl.textContent = "demo";
      noteEl.textContent = `Couldn't reach ${API_ENDPOINT}. Showing a local demo count until it's wired up.`;
    } finally {
      refreshBtn && refreshBtn.classList.remove("is-spinning");
    }
  }

  function runDemoFallback() {
    // A transparent, non-hardcoded stand-in: increments per visit in this
    // browser only, using localStorage, and is clearly labeled as a demo.
    const key = "serverless-dashboard-demo-count";
    const current = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(current));
    renderCount(current.toLocaleString());
  }

  function renderCount(value) {
    countEl.textContent = value;
    countEl.parentElement.classList.remove("is-error");
  }

  function setStatus(isLive, message) {
    statusText.textContent = message;
    [statusDot, heroStatusDot].forEach((dot) => {
      if (!dot) return;
      dot.classList.toggle("is-error", !isLive);
    });
  }

  refreshBtn && refreshBtn.addEventListener("click", fetchCount);
  fetchCount();
}

/* -------------------------------------------------------------------------
   7. Footer year
   ------------------------------------------------------------------------- */
function initFooterYear() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = new Date().getFullYear();
}
