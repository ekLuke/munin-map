// Manual ore exclusions shared by the web map's markers and vegetation renderers.
// Storage lives in Munin Map's existing web-pin API, not in the Valheim save.
// This module intentionally has no network access or UI of its own.
export const ORE_PIN_NAME = 'MuninOreHide';
export const ORE_PIN_TEXT = 'ORE';
export const ORE_KINDS = new Set([8, 34, 35, 36, 37, 38]);
export const ORE_NAMES = new Map([
  [8, 'Altro minerale'], [34, 'Rame'], [35, 'Stagno'], [36, 'Argento'],
  [37, 'Ossidiana'], [38, 'Rottami fangosi'],
]);
const listeners = new Set();
let points = [];
export const oreExclusions = {
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  isPin(p) { return p && p.name === ORE_PIN_NAME && p.text === ORE_PIN_TEXT; },
  setPins(pins) {
    const next = [...pins].filter(this.isPin).map(p => [Number(p.x), Number(p.z)])
      .filter(([x,z]) => Number.isFinite(x) && Number.isFinite(z));
    const key = next.map(([x,z]) => x.toFixed(1)+','+z.toFixed(1)).sort().join('|');
    if (key === this.key) return;
    this.key = key; points = next;
    for (const fn of listeners) fn();
  },
  matches(x,z) {
    // World vegetation positions are quantized to 1/4m; web pins to 1/10m.
    return points.some(([px,pz]) => (x-px)**2 + (z-pz)**2 < 0.36);
  },
  pinAt(x,z) {
    return points.some(([px,pz]) => (x-px)**2 + (z-pz)**2 < 0.36);
  },
};
