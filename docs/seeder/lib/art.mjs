// Generated artwork (SVG) so the demo has faces, medicine packs and equipment pictures without any
// downloaded stock photos. Everything is deterministic from the name.
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pick = (arr, h, salt = 0) => arr[(h >>> salt) % arr.length];

const SKIN = ["#f6d5b8", "#eebc94", "#d9a074", "#b9795a", "#8d5a3c", "#6b4430"];
const HAIR = ["#1d1a17", "#3b2a20", "#5b3a25", "#8a6a43", "#b7b7b7", "#2a2f45"];
const BG = [["#dbeafe", "#bfdbfe"], ["#dcfce7", "#bbf7d0"], ["#fde68a", "#fcd34d"], ["#fbcfe8", "#f9a8d4"], ["#ddd6fe", "#c4b5fd"], ["#cffafe", "#a5f3fc"], ["#fed7aa", "#fdba74"]];

export function avatar(name, { role = "PATIENT", gender = "Male" } = {}) {
  const h = hash(name), skin = pick(SKIN, h), hair = pick(HAIR, h, 3), [b1, b2] = pick(BG, h, 5);
  const female = /^f/i.test(gender);
  const doctor = role === "DOCTOR";
  const shirt = doctor ? "#ffffff" : pick(["#3d6fe0", "#2dba9a", "#e8795a", "#7b61c9", "#4b5d7a"], h, 7);
  const hairShape = female
    ? `<path d="M62 100c-4-44 20-62 38-62s42 18 38 62c-2 20 4 34 10 52H52c6-18 12-32 10-52z" fill="${hair}"/>`
    : `<path d="M66 96c-6-40 14-58 34-58s40 18 34 58c-6-14-14-24-34-24s-28 10-34 24z" fill="${hair}"/>`;
  const coat = doctor
    ? `<path d="M100 150l-18 10 18 40 18-40z" fill="#e6eefc"/><path d="M82 160c-6 2-14 6-16 16M118 160c6 2 14 6 16 16" stroke="#9db4d8" stroke-width="3" fill="none"/><path d="M92 168c0 14 16 14 16 0" stroke="#2f6fed" stroke-width="3" fill="none"/><circle cx="100" cy="184" r="4" fill="#2f6fed"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="400" height="400"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b1}"/><stop offset="1" stop-color="${b2}"/></linearGradient></defs>
<rect width="200" height="200" fill="url(#b)"/>
<path d="M30 200c4-30 30-48 70-48s66 18 70 48z" fill="${shirt}"/>${coat}
<rect x="88" y="124" width="24" height="30" rx="10" fill="${skin}"/>
${female ? hairShape : ""}
<ellipse cx="100" cy="98" rx="30" ry="36" fill="${skin}"/>
${female ? "" : hairShape}
<ellipse cx="88" cy="98" rx="3.4" ry="4" fill="#2b2b2b"/><ellipse cx="112" cy="98" rx="3.4" ry="4" fill="#2b2b2b"/>
<path d="M90 114c6 6 14 6 20 0" stroke="#7a3b2e" stroke-width="3" stroke-linecap="round" fill="none"/>
${!female && h % 3 === 0 ? `<path d="M82 118c8 12 28 12 36 0-4 14-14 20-18 20s-14-6-18-20z" fill="${hair}" opacity=".9"/>` : ""}
</svg>`;
}

const PACK = {
  Tablet: (c) => `<rect x="70" y="90" width="260" height="120" rx="14" fill="#f5f7fa" stroke="#cfd8e3" stroke-width="3"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${105 + (i % 4) * 62}" cy="${125 + Math.floor(i / 4) * 50}" r="17" fill="${c}"/><circle cx="${105 + (i % 4) * 62}" cy="${125 + Math.floor(i / 4) * 50}" r="17" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`).join("")}`,
  Capsule: (c) => `<g transform="rotate(-28 200 150)"><rect x="95" y="115" width="210" height="72" rx="36" fill="#fff" stroke="${c}" stroke-width="5"/><path d="M200 115h69a36 36 0 0 1 0 72h-69z" fill="${c}"/></g>`,
  Syrup: (c) => `<rect x="150" y="60" width="100" height="26" rx="6" fill="#4b5d7a"/><path d="M160 86h80l12 30v108a16 16 0 0 1-16 16h-72a16 16 0 0 1-16-16V116z" fill="#fff" stroke="#cfd8e3" stroke-width="3"/><rect x="150" y="150" width="100" height="56" fill="${c}" opacity=".85"/><rect x="164" y="166" width="72" height="8" rx="4" fill="#fff"/><rect x="164" y="182" width="48" height="8" rx="4" fill="#fff" opacity=".8"/>`,
  Injection: (c) => `<g transform="rotate(-35 200 150)"><rect x="110" y="132" width="150" height="36" rx="6" fill="#fff" stroke="#9db4d8" stroke-width="4"/><rect x="118" y="140" width="80" height="20" fill="${c}" opacity=".8"/><rect x="260" y="144" width="40" height="12" fill="#9db4d8"/><rect x="82" y="124" width="30" height="52" rx="4" fill="#4b5d7a"/></g>`,
  Cream: (c) => `<path d="M120 90h160l-14 110a14 14 0 0 1-14 12h-104a14 14 0 0 1-14-12z" fill="#fff" stroke="#cfd8e3" stroke-width="3"/><rect x="140" y="60" width="120" height="30" rx="6" fill="${c}"/><rect x="156" y="130" width="88" height="10" rx="5" fill="${c}"/><rect x="156" y="152" width="60" height="10" rx="5" fill="${c}" opacity=".6"/>`,
  Inhaler: (c) => `<path d="M150 70h70v120a14 14 0 0 1-14 14h-42a14 14 0 0 1-14-14z" fill="#fff" stroke="#cfd8e3" stroke-width="3"/><path d="M168 190h92a14 14 0 0 1 14 14v10h-106z" fill="${c}"/><rect x="164" y="90" width="38" height="50" rx="6" fill="${c}" opacity=".85"/>`,
};
export function medicinePack(name, form, color) {
  const body = (PACK[form] || PACK.Tablet)(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset="1" stop-color="#e2ecfb"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>${body}<text x="200" y="272" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="#3c4a63">${name}</text></svg>`;
}

const GLYPH = {
  mri: `<circle cx="200" cy="140" r="88" fill="#fff" stroke="#9db4d8" stroke-width="10"/><circle cx="200" cy="140" r="46" fill="#dbe8fb"/><rect x="120" y="210" width="160" height="22" rx="8" fill="#9db4d8"/><rect x="150" y="196" width="100" height="16" rx="8" fill="#2f6fed"/>`,
  ct: `<rect x="110" y="60" width="180" height="160" rx="26" fill="#fff" stroke="#9db4d8" stroke-width="8"/><circle cx="200" cy="140" r="52" fill="#dbe8fb" stroke="#2f6fed" stroke-width="6"/><rect x="130" y="228" width="140" height="18" rx="8" fill="#9db4d8"/>`,
  xray: `<rect x="120" y="50" width="160" height="200" rx="14" fill="#16253d"/><path d="M200 90c-22 0-34 14-34 30 0 12 6 20 6 34v50h56v-50c0-14 6-22 6-34 0-16-12-30-34-30z" fill="#9fc4ff" opacity=".85"/><path d="M200 150v70M178 170h44M180 190h40" stroke="#16253d" stroke-width="5"/>`,
  ultrasound: `<rect x="90" y="70" width="220" height="150" rx="14" fill="#fff" stroke="#9db4d8" stroke-width="7"/><path d="M110 195c40-100 140-100 180 0z" fill="#16253d"/><path d="M200 120l-40 70M200 120l40 70" stroke="#6fb3ff" stroke-width="4"/><circle cx="200" cy="120" r="10" fill="#6fb3ff"/>`,
  ecg: `<rect x="80" y="80" width="240" height="140" rx="14" fill="#fff" stroke="#9db4d8" stroke-width="7"/><path d="M100 150h34l14-38 24 80 22-60 14 18h58" fill="none" stroke="#e2563b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  vent: `<rect x="110" y="70" width="180" height="120" rx="16" fill="#fff" stroke="#9db4d8" stroke-width="7"/><path d="M130 130h28l12-24 18 50 14-34 12 8h46" fill="none" stroke="#2dba9a" stroke-width="6" stroke-linecap="round"/><path d="M290 150c40 0 50 30 50 70" stroke="#9db4d8" stroke-width="10" fill="none"/><rect x="130" y="190" width="140" height="40" rx="10" fill="#cfd8e3"/>`,
  defib: `<rect x="100" y="80" width="200" height="140" rx="18" fill="#e2563b"/><rect x="120" y="100" width="100" height="56" rx="8" fill="#fff"/><path d="M128 130h18l8-18 12 36 10-22 8 4h22" stroke="#e2563b" stroke-width="5" fill="none"/><circle cx="262" cy="130" r="22" fill="#fff"/><path d="M262 116v28M248 130h28" stroke="#e2563b" stroke-width="7"/>`,
  dialysis: `<rect x="120" y="60" width="160" height="160" rx="18" fill="#fff" stroke="#9db4d8" stroke-width="7"/><circle cx="200" cy="130" r="42" fill="#dbe8fb" stroke="#2f6fed" stroke-width="6"/><path d="M180 130h40M200 110v40" stroke="#2f6fed" stroke-width="6"/><path d="M280 120c30 0 40 30 40 70" stroke="#e2563b" stroke-width="8" fill="none"/><path d="M120 120c-30 0-40 30-40 70" stroke="#2f6fed" stroke-width="8" fill="none"/>`,
  pump: `<rect x="150" y="50" width="100" height="170" rx="14" fill="#fff" stroke="#9db4d8" stroke-width="7"/><rect x="166" y="72" width="68" height="40" rx="6" fill="#16253d"/><text x="200" y="100" text-anchor="middle" font-size="22" font-family="monospace" fill="#6fe3a8">12.5</text><circle cx="200" cy="150" r="16" fill="#2f6fed"/><rect x="176" y="184" width="48" height="14" rx="7" fill="#cfd8e3"/><path d="M200 220v50" stroke="#9db4d8" stroke-width="6"/>`,
  scope: `<path d="M120 70c60 0 80 30 80 70s20 70 80 70" fill="none" stroke="#4b5d7a" stroke-width="14" stroke-linecap="round"/><circle cx="120" cy="70" r="26" fill="#fff" stroke="#9db4d8" stroke-width="7"/><circle cx="120" cy="70" r="10" fill="#2f6fed"/><rect x="270" y="190" width="70" height="40" rx="10" fill="#fff" stroke="#9db4d8" stroke-width="6"/>`,
  monitor: `<rect x="80" y="70" width="240" height="150" rx="14" fill="#16253d"/><path d="M96 150h40l12-40 22 78 20-52 12 14h108" fill="none" stroke="#6fe3a8" stroke-width="5" stroke-linecap="round"/><path d="M96 190h80" stroke="#6fb3ff" stroke-width="5"/><text x="300" y="104" text-anchor="end" font-family="monospace" font-size="20" fill="#ffd166">72</text>`,
  oxygen: `<rect x="160" y="50" width="80" height="190" rx="36" fill="#2dba9a"/><rect x="180" y="34" width="40" height="26" rx="6" fill="#4b5d7a"/><circle cx="200" cy="140" r="24" fill="#fff" opacity=".9"/><text x="200" y="148" text-anchor="middle" font-family="Helvetica" font-weight="700" font-size="20" fill="#2dba9a">O2</text>`,
};
export function equipmentArt(kind, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset="1" stop-color="#d9e6fa"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/>${GLYPH[kind] || GLYPH.monitor}<text x="200" y="282" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="700" fill="#3c4a63">${label}</text></svg>`;
}

export function postArt(title, seed) {
  // Illustration only: the app overlays the post title itself.
  const h = hash(seed + title), [a, b] = pick(BG, h);
  const marks = ["M300 120h-40v-40h-20v40h-40v20h40v40h20v-40h40z", "M240 90c-30-50-90-10-60 40 20 30 60 50 60 50s40-20 60-50c30-50-30-90-60-40z", "M200 70l70 30v50c0 40-30 62-70 80-40-18-70-40-70-80v-50z"];
  const x = 120 + (h % 5) * 60;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="1200" height="680"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="600" height="340" fill="url(#g)"/><circle cx="500" cy="60" r="120" fill="#fff" opacity=".25"/><circle cx="80" cy="320" r="150" fill="#fff" opacity=".2"/><circle cx="${x}" cy="250" r="46" fill="#fff" opacity=".18"/><g transform="translate(150 20) scale(1.25)" fill="#fff" opacity=".92"><path d="${pick(marks, h, 2)}"/></g></svg>`;
}
