"use strict";

const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

// ---------- Shape explorer (Table 3: 400M configurations) ----------
const SHAPES = [
  { L: 70, d: 640,  ff: 1712, hd: 40, ar: "9.14",  tot: "409M" },
  { L: 42, d: 800,  ff: 2144, hd: 50, ar: "19.05", tot: "404M" },
  { L: 32, d: 896,  ff: 2400, hd: 56, ar: "28.00", tot: "399M" },
  { L: 28, d: 960,  ff: 2560, hd: 60, ar: "34.29", tot: "406M" },
  { L: 24, d: 1024, ff: 2736, hd: 64, ar: "42.67", tot: "405M" },
  { L: 20, d: 1120, ff: 2992, hd: 70, ar: "56.00", tot: "414M" },
  { L: 16, d: 1216, ff: 3248, hd: 76, ar: "76.00", tot: "407M" },
];
const stack = document.querySelector("#shape-stack");
const slider = document.querySelector("#shape-slider");
if (stack && slider) {
  const H = 210, TOP = 22, PITCH = H / 70, BAR = PITCH * 0.7, CX = 180;
  const bars = [];
  for (let i = 0; i < 70; i++) bars.push(el("rect", { rx: 1, fill: "#3063ca", stroke: "none" }, stack));
  const label = el("text", { "text-anchor": "middle", "font-size": 12, fill: "#50565f", stroke: "none", "font-family": "-apple-system, sans-serif" }, stack);
  let cur = { L: 24, d: 1024 }, raf = null;
  function draw(L, d) {
    const W = (d / 1216) * 330, n = Math.ceil(L - 1e-6), fr = L - Math.floor(L);
    bars.forEach((r, j) => {
      if (j < n) {
        r.setAttribute("x", CX - W / 2); r.setAttribute("width", W);
        r.setAttribute("y", TOP + H - (j + 1) * PITCH + (PITCH - BAR)); r.setAttribute("height", BAR);
        r.style.opacity = (0.65 + 0.35 * (j / 69)) * (j === n - 1 && fr > 1e-6 ? fr : 1);
      } else r.style.opacity = 0;
    });
    label.setAttribute("x", CX); label.setAttribute("y", TOP + H - L * PITCH - 8);
    label.textContent = `← d = ${Math.round(d)} →`;
  }
  function update(animate) {
    const s = SHAPES[Number(slider.value)];
    for (const [id, v] of [["#sh-L", s.L], ["#sh-d", s.d], ["#sh-ar", s.ar], ["#sh-ff", s.ff], ["#sh-hd", s.hd], ["#sh-tot", s.tot]])
      document.querySelector(id).textContent = v;
    slider.setAttribute("aria-valuetext", `${s.L} layers, hidden size ${s.d}, aspect ratio ${s.ar}`);
    const from = { ...cur }, to = { L: s.L, d: s.d };
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) { cur = to; draw(to.L, to.d); return; }
    const t0 = performance.now();
    cancelAnimationFrame(raf);
    const step = now => {
      const t = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - t, 3);
      cur = { L: from.L + (to.L - from.L) * e, d: from.d + (to.d - from.d) * e };
      draw(cur.L, cur.d);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  slider.addEventListener("input", () => update(true));
  update(false);
}

// ---------- Interactive loss chart (values read from Figure 2) ----------
const AR = [76.0, 56.0, 42.7, 34.3, 28.0, 19.1, 9.1];
const LD = ["L16 · d1216", "L20 · d1120", "L24 · d1024", "L28 · d960", "L32 · d896", "L42 · d800", "L70 · d640"];
const ARCHS = [
  { k: "Pre-LN",        c: "#2b2f36", v: [2.759, 2.759, 2.765, 2.774, 2.782], on: true },
  { k: "Full AttnRes",  c: "#e3394a", v: [2.751, 2.728, 2.726, 2.722, 2.718, 2.708, 2.702], on: true },
  { k: "HC",            c: "#7540c8", v: [2.729, 2.716, 2.702, 2.714, 2.700, 2.691, 2.682], on: true },
  { k: "Sandwich-LN",   c: "#d58a00", v: [2.765, 2.754, 2.757, 2.757, 2.766] },
  { k: "LNS",           c: "#388b52", v: [2.749, 2.737, 2.740, 2.740, 2.739] },
  { k: "DeepNorm",      c: "#697586", v: [2.790, 2.779, 2.796, 2.792, 2.798] },
  { k: "KEEL",          c: "#b5653c", v: [2.781, 2.768, 2.767, 2.771, 2.775] },
  { k: "MoDA",          c: "#258daa", v: [2.753, 2.746, 2.764, 2.761, 2.780] },
  { k: "Block AttnRes", c: "#578bcb", v: [2.734, 2.716, 2.719, 2.726, 2.730] },
  { k: "mHC",           c: "#c95fae", v: [2.720, 2.720, 2.710, 2.727, 2.721] },
];
const chart = document.querySelector("#loss-chart");
if (chart) {
  const X0 = 70, X1 = 900, Y0 = 18, Y1 = 330;
  let range = "main";
  const gGrid = el("g", {}, chart), gLines = el("g", {}, chart), gTop = el("g", {}, chart);
  el("text", { x: 18, y: (Y0 + Y1) / 2, class: "axis-label", transform: `rotate(-90 18 ${(Y0 + Y1) / 2})`, "text-anchor": "middle", stroke: "none" }, chart).textContent = "Validation loss ↓";
  const xl = el("text", { x: (X0 + X1) / 2, y: 408, class: "axis-label", "text-anchor": "middle", stroke: "none" }, chart);
  xl.textContent = "Aspect ratio d / L";
  el("text", { x: X0, y: 408, class: "tick", stroke: "none" }, chart).textContent = "◀ deeper – narrower";
  el("text", { x: X1, y: 408, class: "tick", "text-anchor": "end", stroke: "none" }, chart).textContent = "shallower – wider ▶";

  const series = ARCHS.map(a => ({
    a,
    path: el("path", { class: "line", stroke: a.c }, gLines),
    dots: a.v.map(() => el("circle", { class: "dot", r: 4, fill: "#fff", stroke: a.c, "stroke-width": 2 }, gLines)),
    label: el("text", { "font-size": 12.5, "font-weight": 600, fill: a.c, stroke: "none" }, gTop),
  }));

  const legend = document.querySelector("#legend");
  ARCHS.forEach((a, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.style.setProperty("--c", a.c);
    b.innerHTML = `<i></i>${a.k}`;
    b.setAttribute("aria-pressed", a.on ? "true" : "false");
    b.addEventListener("click", () => { a.on = !a.on; b.setAttribute("aria-pressed", a.on ? "true" : "false"); render(); });
    legend.appendChild(b);
  });
  document.querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => {
    range = b.dataset.range;
    document.querySelectorAll(".seg button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    render();
  }));

  function render() {
    const n = range === "main" ? 5 : 7;
    const arMin = range === "main" ? 28 : 9.1, yMin = range === "main" ? 2.69 : 2.675, yMax = 2.80;
    const lx = v => X0 + (Math.log(v) - Math.log(arMin)) / (Math.log(76) - Math.log(arMin)) * (X1 - X0);
    const ly = v => Y1 - (v - yMin) / (yMax - yMin) * (Y1 - Y0);
    gGrid.innerHTML = "";
    for (let v = Math.ceil(yMin * 50) / 50; v <= yMax + 1e-9; v += 0.02) {
      el("line", { class: "grid", x1: X0 - 8, x2: X1 + 8, y1: ly(v), y2: ly(v) }, gGrid);
      el("text", { class: "tick", x: X0 - 16, y: ly(v) + 4, "text-anchor": "end", stroke: "none" }, gGrid).textContent = v.toFixed(2);
    }
    for (let i = 0; i < n; i++) {
      el("text", { class: "tick", x: lx(AR[i]), y: Y1 + 26, "text-anchor": "middle", stroke: "none" }, gGrid).textContent = AR[i].toFixed(1);
      if (range === "main" || i === 0 || i >= 4)
        el("text", { class: "tick2", x: lx(AR[i]), y: Y1 + 43, "text-anchor": "middle", stroke: "none" }, gGrid).textContent = LD[i];
    }
    const anyOn = ARCHS.some(a => a.on);
    const labels = [];
    series.forEach(s => {
      const vals = s.a.v.slice(0, n);
      const pts = vals.map((v, j) => [lx(AR[j]), ly(v)]);
      s.path.setAttribute("d", pts.map((p, j) => (j ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(""));
      const op = s.a.on || !anyOn ? 1 : 0.16;
      s.path.style.opacity = op; s.path.classList.toggle("on", !!s.a.on);
      s.dots.forEach((d, j) => {
        if (j < pts.length) { d.setAttribute("cx", pts[j][0]); d.setAttribute("cy", pts[j][1]); d.style.opacity = s.a.on ? 1 : 0; }
        else d.style.opacity = 0;
      });
      s.label.textContent = s.a.k;
      s.label.style.opacity = s.a.on ? 1 : 0;
      if (s.a.on) labels.push({ s, y: pts[0][1] + 4, x: pts[0][0] + 12 });
    });
    if (anyOn) gLines.append(...series.filter(s => s.a.on).flatMap(s => [s.path, ...s.dots]));
    // de-overlap the right-hand labels
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
    labels.forEach(l => { l.s.label.setAttribute("x", l.x); l.s.label.setAttribute("y", l.y); });
  }
  render();
}

// ---------- Math ----------
window.addEventListener("load", () => {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
    });
  }
});

// ---------- Copy citation ----------
const copyButton = document.querySelector("#copy-citation");
copyButton?.addEventListener("click", async () => {
  const citation = document.querySelector("#bibtex");
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(citation.textContent.trim());
    copyButton.textContent = "Copied!";
    status.textContent = "BibTeX copied to clipboard.";
    setTimeout(() => { copyButton.textContent = "Copy citation"; }, 2500);
  } catch {
    const range = document.createRange();
    range.selectNodeContents(citation);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C / ⌘C to copy.";
  }
});

// ---------- Figure lightbox ----------
const dialog = document.querySelector("#figure-dialog");
const expanded = document.querySelector("#expanded-figure");
let trigger;
document.querySelectorAll(".figure-zoom").forEach(link => {
  link.addEventListener("click", ev => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || typeof dialog.showModal !== "function") return;
    ev.preventDefault();
    trigger = link;
    expanded.src = link.href;
    expanded.alt = link.querySelector("img").alt;
    document.querySelector("#figure-dialog-title").textContent = link.getAttribute("aria-label").replace(/^Enlarge /, "");
    dialog.showModal();
    document.body.classList.add("modal-open");
  });
});
function closeDialog() { dialog.close(); }
document.querySelector("#dialog-close")?.addEventListener("click", closeDialog);
dialog?.addEventListener("click", ev => { if (ev.target === dialog) closeDialog(); });
dialog?.addEventListener("close", () => { document.body.classList.remove("modal-open"); trigger?.focus(); });

// ---------- Active section in nav ----------
const navLinks = [...document.querySelectorAll(".nav-links a")];
const targets = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id));
      navLinks.forEach(a => { if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "location"); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  targets.forEach(t => io.observe(t));
}
