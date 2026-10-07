// Tiny SVG diagram toolkit: icon nodes, edges and SMIL-animated "packets" that travel along edges.
// No dependencies; output renders in browsers, GitHub READMEs, and frame-by-frame for GIF export.
export const C = {
  bg: "#0e1a2b", card: "#16263d", line: "#2b4468", text: "#e8f0ff", muted: "#8ea6c9",
  blue: "#3d8bff", teal: "#22c7a9", amber: "#ffb84d", pink: "#ff6f91", violet: "#9a7bff", green: "#4cd964", red: "#ff5c5c",
};

// 24x24 icon paths (stroke style)
export const ICON = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  browser: '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 9h19"/><circle cx="5.5" cy="6.5" r=".6"/><circle cx="8" cy="6.5" r=".6"/>',
  server: '<rect x="3" y="4" width="18" height="6.5" rx="2"/><rect x="3" y="13.5" width="18" height="6.5" rx="2"/><circle cx="7" cy="7.2" r=".8"/><circle cx="7" cy="16.8" r=".8"/>',
  db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  spark: '<path d="M12 3l2 5.5L19.5 10 14 12l-2 5.5L10 12 4.5 10 10 8.5z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  video: '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  gateway: '<path d="M3 12h7M14 12h7"/><path d="M7 8l-4 4 4 4M17 8l4 4-4 4"/><circle cx="12" cy="12" r="2.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-9-9.2C2 7.4 4.2 5 7 5c1.9 0 3.4 1 5 3 1.6-2 3.1-3 5-3 2.8 0 5 2.4 4 5.8C19.500 15.400 12 20 12 20z"/>',
  stetho: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="12" r="2"/>',
  pill: '<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.200 14.800l5.600-5.600" transform="rotate(0 12 12)"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.500"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  cloudoff: '<path d="M7 18h10a4 4 0 0 0 .6-7.950A6 6 0 0 0 6.200 9.500 4.300 4.300 0 0 0 7 18z"/><path d="M3 3l18 18"/>',
  docker: '<rect x="3" y="11" width="3.500" height="3"/><rect x="7" y="11" width="3.500" height="3"/><rect x="11" y="11" width="3.500" height="3"/><rect x="7" y="7.500" width="3.500" height="3"/><rect x="11" y="7.500" width="3.500" height="3"/><path d="M2 15.500c.5 3 3 5 7 5 5.500 0 9-3 10-7 1.500.2 2.500-.4 3-1.500-1-.7-2-.8-3-.5-.4-1-1.200-1.500-2-1.700"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2.500"/><path d="M7 9l3 3-3 3M12.500 15H17"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
};

export const icon = (name, x, y, size, color, sw = 1.7) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${sw * 24 / size}" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ICON.server}</g>`;

export class Diagram {
  constructor({ w, h, title, subtitle, dur = 12 }) {
    Object.assign(this, { w, h, title, subtitle, dur });
    this.defs = []; this.layers = { bg: [], edges: [], nodes: [], anim: [], text: [] };
    this.nodes = new Map();
  }
  group(label, x, y, w, h, color = C.line) {
    this.layers.bg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${color}" fill-opacity=".07" stroke="${color}" stroke-opacity=".55" stroke-dasharray="5 5"/>`,
      `<text x="${x + 16}" y="${y + 22}" fill="${C.muted}" font-size="12" font-weight="700" letter-spacing="1.6">${label.toUpperCase()}</text>`);
  }
  node(id, x, y, w, h, label, sub, ic, color = C.blue, opts = {}) {
    this.nodes.set(id, { x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
    const dashed = opts.dashed ? ' stroke-dasharray="6 4"' : "";
    this.layers.nodes.push(`<g id="n-${id}">
      <rect id="halo-${id}" x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="17" fill="${color}" opacity="0"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="${C.card}" stroke="${color}" stroke-width="1.6"${dashed}/>
      <circle cx="${x + 26}" cy="${y + h / 2}" r="17" fill="${color}" fill-opacity=".16"/>
      ${icon(ic, x + 14, y + h / 2 - 12, 24, color)}
      <text x="${x + 52}" y="${y + h / 2 - (sub ? 3 : -5)}" fill="${C.text}" font-size="${opts.fs || 14}" font-weight="700">${label}</text>
      ${sub ? `<text x="${x + 52}" y="${y + h / 2 + 14}" fill="${C.muted}" font-size="11">${sub}</text>` : ""}
    </g>`);
  }
  pt(id, side = "c") {
    const n = this.nodes.get(id);
    return { t: [n.cx, n.y], b: [n.cx, n.y + n.h], l: [n.x, n.cy], r: [n.x + n.w, n.cy], c: [n.cx, n.cy] }[side];
  }
  // Orthogonal-ish path between two points with an optional bend list.
  path(a, b, via = []) { return "M" + [a, ...via, b].map((p) => p.join(" ")).join(" L"); }
  edge(id, from, fromSide, to, toSide, { via = [], color = C.line, dashed = false, width = 2, label } = {}) {
    const a = this.pt(from, fromSide), b = this.pt(to, toSide), d = this.path(a, b, via);
    this.layers.edges.push(`<path id="e-${id}" d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6 5"' : ""} stroke-linecap="round" stroke-linejoin="round"/>`);
    this.edgePaths = this.edgePaths || {}; this.edgePaths[id] = d;
    if (label) { const m = via.length ? via[Math.floor(via.length / 2)] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; this.layers.text.push(`<text x="${m[0] + 6}" y="${m[1] - 6}" fill="${C.muted}" font-size="11">${label}</text>`); }
  }
  rawEdge(id, d, { color = C.line, dashed = false, width = 2 } = {}) {
    this.layers.edges.push(`<path id="e-${id}" d="${d}" fill="none" stroke="${color}" stroke-width="${width}"${dashed ? ' stroke-dasharray="6 5"' : ""} stroke-linecap="round" stroke-linejoin="round"/>`);
    this.edgePaths = this.edgePaths || {}; this.edgePaths[id] = d;
  }
  badge(id, text, color = C.teal) { const n = this.nodes.get(id); this.layers.nodes.push(`<g><rect x="${n.x + n.w - 52}" y="${n.y - 9}" width="46" height="18" rx="9" fill="${color}"/><text x="${n.x + n.w - 29}" y="${n.y + 3.500}" text-anchor="middle" font-size="10" font-weight="800" fill="#06101f">${text}</text></g>`); }
  // A dot that loops along an edge: continuous ambient traffic.
  flow(edgeId, { color = C.blue, dur = 3, begin = 0, reverse = false, r = 4.5 } = {}) {
    const d = this.edgePaths[edgeId];
    this.layers.anim.push(`<circle r="${r}" fill="${color}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${d}" ${reverse ? 'keyPoints="1;0" keyTimes="0;1"' : ""} calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.1;.9;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`);
  }
  // Sequenced story: steps[i] = {edge, from, to, caption, color, reverse}. Plays one step at a time, then loops.
  story(steps, { stepDur = 2.2, hold = 1.6 } = {}) {
    const T = steps.length * stepDur + hold; this.dur = T;
    const frac = (t) => +(t / T).toFixed(5);
    steps.forEach((s, i) => {
      const t0 = i * stepDur, t1 = t0 + stepDur, col = s.color || C.blue, d = this.edgePaths[s.edge];
      const kt = (arr) => arr.map(frac).join(";");
      const on = (vals, extra = "") => `<animate attributeName="opacity" values="${vals}" keyTimes="${kt([0, t0, t0 + 0.12, t1 - 0.12, t1, T])}" dur="${T}s" repeatCount="indefinite" ${extra}/>`;
      // highlighted edge
      this.layers.anim.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0">${on("0;0;1;1;0;0")}</path>`);
      // travelling packet
      const kp = s.reverse ? "1;0" : "0;1";
      this.layers.anim.push(`<circle r="7" fill="${col}" opacity="0"><animateMotion dur="${T}s" repeatCount="indefinite" path="${d}" calcMode="linear" keyPoints="${s.reverse ? "1;1;0;0" : "0;0;1;1"}" keyTimes="${kt([0, t0 + 0.1, t1 - 0.2, T])}"/>${on("0;0;1;1;0;0")}</circle>`);
      // step badge at the middle of the path + target halo
      const pts = d.match(/-?\d+\.?\d*/g).map(Number); const poly = []; for (let k = 0; k < pts.length; k += 2) poly.push([pts[k], pts[k + 1]]);
      const segLen = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]); let total = 0; for (let k = 1; k < poly.length; k++) total += segLen(poly[k - 1], poly[k]);
      let acc = 0, mid = poly[0]; for (let k = 1; k < poly.length; k++) { const L = segLen(poly[k - 1], poly[k]); if (acc + L >= total / 2) { const f = (total / 2 - acc) / L; mid = [poly[k - 1][0] + (poly[k][0] - poly[k - 1][0]) * f, poly[k - 1][1] + (poly[k][1] - poly[k - 1][1]) * f]; break; } acc += L; }
      this.layers.anim.push(`<g opacity="0"><circle cx="${mid[0]}" cy="${mid[1]}" r="11" fill="${col}"/><text x="${mid[0]}" y="${mid[1] + 4.5}" text-anchor="middle" font-size="12" font-weight="800" fill="#06101f">${i + 1}</text>${on("0;0;1;1;0;0")}</g>`);
      const tgt = s.to; if (tgt) this.layers.anim.push(`<use href="#halo-${tgt}" opacity="0" style="fill:${col}">${on("0;0;.32;.32;0;0")}</use>`);
      // caption
      this.layers.text.push(`<g opacity="0"><rect x="30" y="${this.h - 62}" width="${this.w - 60}" height="40" rx="12" fill="${C.card}" stroke="${col}" stroke-opacity=".7"/><circle cx="58" cy="${this.h - 42}" r="12" fill="${col}"/><text x="58" y="${this.h - 37.500}" text-anchor="middle" font-size="13" font-weight="800" fill="#06101f">${i + 1}</text><text x="82" y="${this.h - 37}" font-size="14" fill="${C.text}">${s.caption}</text>${on("0;0;1;1;0;0")}</g>`);
    });
  }
  svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b1626"/><stop offset="1" stop-color="#14263f"/></linearGradient>
<radialGradient id="glow" cx=".15" cy=".1" r=".9"><stop offset="0" stop-color="#3d8bff" stop-opacity=".22"/><stop offset="1" stop-color="#3d8bff" stop-opacity="0"/></radialGradient></defs>
<rect width="${this.w}" height="${this.h}" rx="22" fill="url(#bg)"/><rect width="${this.w}" height="${this.h}" rx="22" fill="url(#glow)"/>
<text x="30" y="40" fill="${C.text}" font-size="21" font-weight="800">${this.title}</text>
<text x="30" y="62" fill="${C.muted}" font-size="13">${this.subtitle || ""}</text>
${this.layers.bg.join("\n")}
${this.layers.edges.join("\n")}
${this.layers.nodes.join("\n")}
${this.layers.anim.join("\n")}
${this.layers.text.join("\n")}
</svg>`;
  }
}
