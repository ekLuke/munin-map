// Hides ore objects in the web map, not in the Valheim world.
// Manual individual exclusions and completed crypts are persisted through
// Munin Map's existing server-side web pins.
export const ORE_PIN_NAME = 'MuninOreHide';
export const ORE_PIN_TEXT = 'ORE';
export const ORE_KINDS = new Set([8, 34, 35, 36, 37, 38]);
export const ORE_NAMES = new Map([
  [8, 'Altro minerale'], [34, 'Rame'], [35, 'Stagno'], [36, 'Argento'],
  [37, 'Ossidiana'], [38, 'Rottami fangosi'],
]);

const COMPLETION_PIN_NAME = 'MuninDone';
const COMPLETION_PIN_TEXT = 'DONE';
const DUNGEON_REACH = 160; // Same search radius as World/Dungeons.cs
const listeners = new Set();
let excludedPoints = [];
let completedPoints = [];
let dungeonEntrances = [];
let dungeonGrid = new Map();
const GRID_SIZE = 256;
let revision = '';

function identity(list) {
  return list.map(p => p.map(n => Number(n).toFixed(1)).join(',')).sort().join('|');
}

function refresh() {
  // Keep the signature stable if live events arrive in a different order.
  const next = identity(excludedPoints) + '#' + identity(completedPoints) +
    '#' + dungeonEntrances.map(d => `${d.x.toFixed(1)},${d.z.toFixed(1)},${d.crypt ? 1 : 0}`).sort().join('|');
  if (next === revision) return;
  revision = next;
  for (const fn of listeners) fn();
}

export const oreExclusions = {
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  isPin(p) { return p && p.name === ORE_PIN_NAME && p.text === ORE_PIN_TEXT; },
  setPins(pins) {
    const all = [...pins];
    excludedPoints = all.filter(p => this.isPin(p)).map(p => [Number(p.x), Number(p.z)])
      .filter(([x,z]) => Number.isFinite(x) && Number.isFinite(z));
    completedPoints = all.filter(p => p.name === COMPLETION_PIN_NAME && p.text === COMPLETION_PIN_TEXT)
      .map(p => [Number(p.x), Number(p.z)])
      .filter(([x,z]) => Number.isFinite(x) && Number.isFinite(z));
    refresh();
  },
  setDungeons(sets) {
    dungeonEntrances = sets.flatMap(set => set.markers || []).filter(m =>
      m.cat === 'dungeon' && Number.isFinite(Number(m.x)) && Number.isFinite(Number(m.z)))
      .map(m => ({
        x: Number(m.x), z: Number(m.z),
        crypt: /sunken.?crypt/i.test(String(m.label || '') + ' ' + String(m.prefab || '')),
      }));
    dungeonGrid = new Map();
    for (const d of dungeonEntrances) {
      const cell = `${Math.floor(d.x/GRID_SIZE)},${Math.floor(d.z/GRID_SIZE)}`;
      if (!dungeonGrid.has(cell)) dungeonGrid.set(cell, []);
      dungeonGrid.get(cell).push(d);
    }
    refresh();
  },
  isCompletedCrypt(x,z) {
    // World/Dungeons.cs assigns an inside object to the nearest dungeon entrance
    // within 160 m. Check only nearby 256m cells to avoid scanning the entire world.
    let nearest = null, best = DUNGEON_REACH ** 2;
    const cx = Math.floor(x / GRID_SIZE), cz = Math.floor(z / GRID_SIZE);
    for (let dz=-1; dz<=1; dz++) for (let dx=-1; dx<=1; dx++) {
      for (const d of dungeonGrid.get(`${cx+dx},${cz+dz}`) || []) {
        const dist = (x-d.x)**2 + (z-d.z)**2;
        if (dist < best) { best = dist; nearest = d; }
      }
    }
    return !!nearest?.crypt && completedPoints.some(([px,pz]) =>
      Math.abs(nearest.x-px) < 0.15 && Math.abs(nearest.z-pz) < 0.15);
  },
  matches(x,z,kind) {
    // Quarter-metre vegetation coordinates vs 0.1m manual-pin coordinates.
    if (excludedPoints.some(([px,pz]) => (x-px)**2 + (z-pz)**2 < 0.36)) return true;
    // Only muddy scrap piles (38) belonging to a manually completed crypt.
    return kind === 38 && this.isCompletedCrypt(x,z);
  },
  pinAt(x,z) {
    return excludedPoints.some(([px,pz]) => (x-px)**2 + (z-pz)**2 < 0.36);
  },
};
