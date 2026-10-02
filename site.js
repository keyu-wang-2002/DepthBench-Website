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
  const H = 210, TOP = 22, PITCH = H / 70, BAR = PITCH * 0.7, CX = 198;
  const bars = [];
  for (let i = 0; i < 70; i++) bars.push(el("rect", { rx: 1, fill: "#3063ca", stroke: "none" }, stack));
  const label = el("text", { "text-anchor": "middle", "font-size": 12, fill: "#50565f", stroke: "none", "font-family": "-apple-system, sans-serif" }, stack);
  // vertical double arrow for depth L
  const defs = el("defs", {}, stack);
  const mk = el("marker", { id: "depth-ah", viewBox: "0 0 8 8", refX: 6, refY: 4, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
  el("path", { d: "M1,1 L6,4 L1,7", fill: "none", stroke: "#50565f", "stroke-width": 1.3 }, mk);
  const vline = el("line", { stroke: "#50565f", "stroke-width": 1.2, "marker-start": "url(#depth-ah)", "marker-end": "url(#depth-ah)" }, stack);
  const vlabel = el("text", { "text-anchor": "middle", "font-size": 12, fill: "#50565f", stroke: "none", "font-family": "-apple-system, sans-serif" }, stack);
  let cur = { L: 24, d: 1024 }, raf = null;
  function draw(L, d) {
    const W = (d / 1216) * 300, n = Math.ceil(L - 1e-6), fr = L - Math.floor(L);
    bars.forEach((r, j) => {
      if (j < n) {
        r.setAttribute("x", CX - W / 2); r.setAttribute("width", W);
        r.setAttribute("y", TOP + H - (j + 1) * PITCH + (PITCH - BAR)); r.setAttribute("height", BAR);
        r.style.opacity = (0.65 + 0.35 * (j / 69)) * (j === n - 1 && fr > 1e-6 ? fr : 1);
      } else r.style.opacity = 0;
    });
    label.setAttribute("x", CX); label.setAttribute("y", TOP + H - L * PITCH - 8);
    label.textContent = `← d = ${Math.round(d)} →`;
    const top = TOP + H - n * PITCH + (PITCH - BAR), bottom = TOP + H, vx = CX - W / 2 - 12, vy = (top + bottom) / 2;
    vline.setAttribute("x1", vx); vline.setAttribute("x2", vx); vline.setAttribute("y1", top); vline.setAttribute("y2", bottom);
    vlabel.setAttribute("x", vx - 8); vlabel.setAttribute("y", vy);
    vlabel.setAttribute("transform", `rotate(-90 ${vx - 8} ${vy})`);
    vlabel.textContent = `L = ${Math.round(L)}`;
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

// ---------- Interactive chart (values read from Figures 2 and 4 of the paper) ----------
const COLORS = {
  "Pre-LN": "#2b2f36", "Full AttnRes": "#e3394a", "HC": "#7540c8", "Sandwich-LN": "#d58a00", "LNS": "#388b52",
  "DeepNorm": "#697586", "KEEL": "#b5653c", "MoDA": "#258daa", "Block AttnRes": "#578bcb", "mHC": "#c95fae",
};
const ORDER = Object.keys(COLORS);
const on = { "Pre-LN": true, "Full AttnRes": true, "HC": true };

// 400M shapes, ordered shallow -> deep
const AR5 = [76.0, 56.0, 42.7, 34.3, 28.0];
const LD5 = ["L16 · d1216", "L20 · d1120", "L24 · d1024", "L28 · d960", "L32 · d896"];
const zip = (xs, vs) => vs.map((v, i) => [xs[i], v]);
const VAL400 = {
  "Pre-LN": [2.759, 2.759, 2.765, 2.774, 2.782],
  "Full AttnRes": [2.751, 2.728, 2.726, 2.722, 2.718],
  "HC": [2.729, 2.716, 2.702, 2.714, 2.700],
  "Sandwich-LN": [2.765, 2.754, 2.757, 2.757, 2.766],
  "LNS": [2.749, 2.737, 2.740, 2.740, 2.739],
  "DeepNorm": [2.790, 2.779, 2.796, 2.792, 2.798],
  "KEEL": [2.781, 2.768, 2.767, 2.771, 2.775],
  "MoDA": [2.753, 2.746, 2.764, 2.761, 2.780],
  "Block AttnRes": [2.734, 2.716, 2.719, 2.726, 2.730],
  "mHC": [2.720, 2.720, 2.710, 2.727, 2.721],
};
const NLL = {
  coding: {
    "Pre-LN": [3.891, 3.698, 3.793, 3.737, 3.797], "Sandwich-LN": [3.748, 3.729, 3.768, 3.775, 3.785],
    "LNS": [3.835, 3.861, 3.873, 3.868, 3.944], "DeepNorm": [3.585, 3.537, 3.677, 3.753, 3.775],
    "KEEL": [3.782, 3.821, 3.839, 3.736, 3.628], "Full AttnRes": [3.616, 3.615, 3.580, 3.507, 3.542],
    "Block AttnRes": [3.523, 3.494, 3.474, 3.594, 3.512], "HC": [3.676, 3.700, 3.538, 3.534, 3.527],
    "mHC": [3.756, 3.737, 3.542, 3.649, 3.534], "MoDA": [3.917, 3.776, 3.604, 3.581, 3.672],
  },
  stem: {
    "Pre-LN": [2.448, 2.441, 2.440, 2.471, 2.472], "Sandwich-LN": [2.432, 2.426, 2.448, 2.458, 2.444],
    "LNS": [2.440, 2.429, 2.435, 2.436, 2.448], "DeepNorm": [2.454, 2.435, 2.466, 2.461, 2.471],
    "KEEL": [2.465, 2.469, 2.466, 2.477, 2.442], "Full AttnRes": [2.411, 2.384, 2.383, 2.374, 2.370],
    "Block AttnRes": [2.405, 2.366, 2.366, 2.379, 2.382], "HC": [2.401, 2.387, 2.354, 2.376, 2.362],
    "mHC": [2.396, 2.390, 2.360, 2.386, 2.377], "MoDA": [2.444, 2.434, 2.439, 2.429, 2.441],
  },
  math: {
    "Pre-LN": [3.095, 3.099, 3.040, 3.145, 3.094], "Sandwich-LN": [3.016, 3.028, 3.085, 3.052, 3.030],
    "LNS": [3.065, 3.059, 3.117, 3.028, 3.099], "DeepNorm": [3.024, 3.029, 3.094, 3.116, 3.105],
    "KEEL": [3.141, 3.147, 3.194, 3.196, 3.079], "Full AttnRes": [3.018, 2.882, 2.915, 2.883, 2.844],
    "Block AttnRes": [3.009, 2.911, 2.878, 2.909, 2.889], "HC": [2.927, 2.931, 2.887, 2.869, 2.858],
    "mHC": [2.941, 2.889, 2.885, 2.887, 2.921], "MoDA": [3.077, 3.029, 3.017, 2.972, 3.033],
  },
};
const mapObj = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v, k)]));
const NLL_NOTE = "Deeper HC and Full AttnRes models generally achieve lower NLL across coding, STEM, and math evaluations. The trend is particularly clear for STEM and math, where both architectures consistently improve as capacity is shifted toward depth. In contrast, Pre-LN and most other variants show weaker or non-monotonic trends. These results suggest that the favorable width-depth scaling translates to domain-specific predictive capability rather than only lower held-out pre-training loss.";
const VIEWS = {
  main: {
    title: "Interactive · validation loss at ≈400M", y: "Validation loss ↓",
    x: zip(AR5, LD5), series: mapObj(VAL400, v => zip(AR5, v)),
    note: "<strong>The favorable width-depth scaling behavior of HC and Full AttnRes is less evident in their derived variants, Block AttnRes and mHC.</strong> Block AttnRes remains competitive but performs best at an intermediate shape, reaching 2.715 at L = 20 before degrading to 2.730 at L = 32. Similarly, mHC achieves strong overall performance and its best performance at L = 24 but shows no consistent gain with increasing depth.",
  },
  ext: {
    title: "Interactive · validation loss at ≈400M, up to 70 layers", y: "Validation loss ↓",
    x: zip([76.0, 56.0, 42.7, 34.3, 28.0, 19.1, 9.1], ["L16 · d1216", "", "", "", "L32 · d896", "L42 · d800", "L70 · d640"]),
    series: {
      "Pre-LN": zip(AR5, VAL400["Pre-LN"]),
      "Full AttnRes": zip([76.0, 56.0, 42.7, 34.3, 28.0, 19.1, 9.1], [2.751, 2.728, 2.726, 2.722, 2.718, 2.708, 2.702]),
      "HC": zip([76.0, 56.0, 42.7, 34.3, 28.0, 19.1, 9.1], [2.729, 2.716, 2.702, 2.714, 2.700, 2.691, 2.682]),
    },
    note: "We further extend the scaling range, up to 70 layers. The favorable trend persists, and HC and Full AttnRes are exceptionally well suited to depth scaling, with performance continuing to improve as models are pushed toward increasingly deep–narrow, even extreme, shapes. (Pre-LN was trained up to L = 32 in this setting.)",
  },
  backbone: {
    title: "Interactive · validation loss at a fixed ≈300M backbone", y: "Validation loss ↓",
    x: [[78, "L16 · 425M"], [42.7, "L24 · 405M"], [28, "L32 · 399M"], [18.3, "L42 · 375M"], [8.7, "L70 · 373M"], [6.48, "L84 · 354M"]],
    series: {
      "Pre-LN": [[78, 2.753], [42.7, 2.765], [28, 2.763], [18.3, 2.817]],
      "Full AttnRes": [[78, 2.746], [42.7, 2.726], [28, 2.718], [18.3, 2.740], [8.7, 2.739]],
      "HC": [[78, 2.721], [42.7, 2.702], [28, 2.700], [18.3, 2.697], [8.7, 2.694], [6.48, 2.719]],
    },
    note: "Notably, with the backbone size fixed, deep–narrow models improve even as the total size decreases. This suggests that their depth-scaling gains arise from the width–depth allocation itself rather than simply from increased backbone size. Tick labels show depth and total size.",
  },
  coding: { title: "Interactive · coding NLL at ≈400M (MBPP, HumanEval)", y: "NLL loss ↓", x: zip(AR5, LD5), series: mapObj(NLL.coding, v => zip(AR5, v)), note: NLL_NOTE },
  stem:   { title: "Interactive · STEM NLL at ≈400M (SciQ, GPQA)",      y: "NLL loss ↓", x: zip(AR5, LD5), series: mapObj(NLL.stem,   v => zip(AR5, v)), note: NLL_NOTE },
  math:   { title: "Interactive · math NLL at ≈400M (GSM8K, MATH-500)", y: "NLL loss ↓", x: zip(AR5, LD5), series: mapObj(NLL.math,   v => zip(AR5, v)), note: NLL_NOTE },
};

const chart = document.querySelector("#loss-chart");
if (chart) {
  const X0 = 70, X1 = 620, Y0 = 18, Y1 = 330;
  let view = "main";
  const gGrid = el("g", {}, chart), gLines = el("g", {}, chart), gTop = el("g", {}, chart);
  const yl = el("text", { x: 18, y: (Y0 + Y1) / 2, class: "axis-label", transform: `rotate(-90 18 ${(Y0 + Y1) / 2})`, "text-anchor": "middle", stroke: "none" }, chart);
  el("text", { x: (X0 + X1) / 2, y: 408, class: "axis-label", "text-anchor": "middle", stroke: "none" }, chart).textContent = "Aspect ratio d / L";
  el("text", { x: X0, y: 408, class: "tick", stroke: "none" }, chart).textContent = "◀ deeper – narrower";
  el("text", { x: X1, y: 408, class: "tick", "text-anchor": "end", stroke: "none" }, chart).textContent = "shallower – wider ▶";

  const lines = {};
  ORDER.forEach(k => {
    lines[k] = {
      path: el("path", { class: "line", stroke: COLORS[k] }, gLines),
      dots: Array.from({ length: 7 }, () => el("circle", { class: "dot", r: 4, fill: "#fff", stroke: COLORS[k], "stroke-width": 2 }, gLines)),
      label: el("text", { "font-size": 12.5, "font-weight": 600, fill: COLORS[k], stroke: "none" }, gTop),
    };
  });

  const legend = document.querySelector("#legend");
  const chips = {};
  ORDER.forEach(k => {
    const b = document.createElement("button");
    b.type = "button"; b.style.setProperty("--c", COLORS[k]);
    b.innerHTML = `<i></i>${k}`;
    b.addEventListener("click", () => { on[k] = !on[k]; render(); });
    legend.appendChild(b); chips[k] = b;
  });
  document.querySelectorAll(".view-switch button").forEach(b => b.addEventListener("click", () => {
    view = b.dataset.view;
    document.querySelectorAll(".view-switch button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    render();
  }));

  function niceStep(range) {
    for (const s of [0.01, 0.02, 0.025, 0.05, 0.1, 0.2]) if (range / s <= 7) return s;
    return 0.5;
  }
  function render() {
    const V = VIEWS[view];
    document.querySelector("#chart-title").textContent = V.title;
    document.querySelector("#chart-note").innerHTML = V.note;
    yl.textContent = V.y;
    const xs = V.x.map(p => p[0]);
    const arMin = Math.min(...xs), arMax = Math.max(...xs);
    const all = Object.values(V.series).flat().map(p => p[1]);
    const lo = Math.min(...all), hi = Math.max(...all), step = niceStep(hi - lo);
    const yMin = Math.floor(lo / step + 1e-6) * step, yMax = Math.ceil(hi / step - 1e-6) * step;
    const lx = v => X0 + (Math.log(v) - Math.log(arMin)) / (Math.log(arMax) - Math.log(arMin)) * (X1 - X0);
    const ly = v => Y1 - (v - yMin) / (yMax - yMin) * (Y1 - Y0);

    gGrid.innerHTML = "";
    for (let v = yMin; v <= yMax + 1e-9; v += step) {
      el("line", { class: "grid", x1: X0 - 8, x2: X1 + 8, y1: ly(v), y2: ly(v) }, gGrid);
      el("text", { class: "tick", x: X0 - 16, y: ly(v) + 4, "text-anchor": "end", stroke: "none" }, gGrid).textContent = v.toFixed(step < 0.01 || step === 0.025 ? 3 : 2);
    }
    V.x.forEach(([ar, sub]) => {
      el("text", { class: "tick", x: lx(ar), y: Y1 + 26, "text-anchor": "middle", stroke: "none" }, gGrid).textContent = view === "backbone" ? String(ar) : ar.toFixed(1);
      if (sub) el("text", { class: "tick2", x: lx(ar), y: Y1 + 43, "text-anchor": "middle", stroke: "none" }, gGrid).textContent = sub;
    });

    const present = ORDER.filter(k => V.series[k]);
    const anyOn = present.some(k => on[k]);
    const labels = [];
    ORDER.forEach(k => {
      const L = lines[k], s = V.series[k];
      chips[k].hidden = !s;
      chips[k].setAttribute("aria-pressed", on[k] ? "true" : "false");
      if (!s) { L.path.style.opacity = 0; L.dots.forEach(d => d.style.opacity = 0); L.label.style.opacity = 0; return; }
      const pts = s.map(([ar, v]) => [lx(ar), ly(v)]);
      L.path.setAttribute("d", pts.map((p, j) => (j ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(""));
      L.path.style.opacity = on[k] || !anyOn ? 1 : 0.16;
      L.path.classList.toggle("on", !!on[k]);
      L.dots.forEach((d, j) => {
        if (j < pts.length) { d.setAttribute("cx", pts[j][0]); d.setAttribute("cy", pts[j][1]); d.style.opacity = on[k] ? 1 : 0; }
        else d.style.opacity = 0;
      });
      L.label.textContent = k;
      L.label.style.opacity = on[k] ? 1 : 0;
      if (on[k]) { const r = pts.reduce((a, b) => (b[0] > a[0] ? b : a)); labels.push({ L, x: r[0] + 12, y: r[1] + 4 }); }
    });
    gLines.append(...ORDER.filter(k => V.series[k] && on[k]).flatMap(k => [lines[k].path, ...lines[k].dots]));
    labels.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 15) labels[i].y = labels[i - 1].y + 15;
    labels.forEach(l => { l.L.label.setAttribute("x", l.x); l.L.label.setAttribute("y", l.y); });
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
