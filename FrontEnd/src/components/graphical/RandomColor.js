export function randomColorArray(size, type) {
  // Hues are spread evenly (with a random offset) so neighbouring slices never look alike.
  const offset = Math.random() * 360;
  let ar = [];
  for (let i = 0; i < size; i++) {
    ar[i] = hslToHex((offset + (i * 360) / Math.max(size, 1) + (i % 2) * 17) % 360, 68, lightness(type));
  }
  return ar;
}

export function randomColor(type) {
  return hslToHex(Math.random() * 360, 68, lightness(type));
}

function lightness(type) {
  return { darker: 30, dark: 40, medium: 52, light: 64, lighter: 78 }[type] || 55;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return "#" + hex(f(0)) + hex(f(8)) + hex(f(4));
}
