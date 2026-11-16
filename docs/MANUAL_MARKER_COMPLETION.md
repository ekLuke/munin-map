# Manual completion for Munin Map web markers

This branch adds a **manual "Segna completato" / "Segna da completare"** action to the
popup of each ordinary map marker (locations, dungeons, camps, ruins, portals,
traders, etc.). Completed markers receive a checked/crossed icon and a green
highlight. The **"Nascondi completati"** Leaflet control can hide them.

## Persistence and permissions

- Completion state is saved by using Munin Map's existing `api/pin` and
  `api/unpin` endpoints. Enable `web_pins = true` in
  `BepInEx/config/com.cocopuff2u.muninmap.cfg`.
- State is visible across browsers, assuming they connect to the same server.
- The hide filter is local to each browser (localStorage).
- A completion can be removed by the browser that created it, or with the
  administrator token recognized by the normal Munin Map pin interface.
- These completion pins count toward the configured `max_pins_per_user`.
  Adjust that limit if you expect many finished locations.
- Markers are linked by map coordinates (rounded to 0.1 m); if two map
  markers overlap at the same coordinates, they share one completion state.
- This changes **only the web map**. It does not affect the Valheim world,
  dungeon loot, or PS5/PC clients.

## Deploy without rebuilding the DLL

Munin Map's advanced guide supports overriding the embedded web assets:
place a complete `web/` directory next to `MuninMap.dll`. The custom
`web/js/layers/markers.js` from this branch replaces the default JavaScript.

You must supply the **rest of the original web directory** from the same
Munin Map release (including `index.html`, `css/`, `js/`, `icons/`
and `vendor/`). Do not deploy only this JavaScript without checking your
current web bundle version.

After deployment restart the server (or use the documented authenticated
`POST /api/reload`) and hard-refresh the browser.

## Known limitations

- This is an untested custom fork: loading in a live Munin Map 3.3.1
  browser and checking server-side pin persistence are still required.
- You can manually mark any standard point of interest, including
  traders or portals; use the controls only where meaningful.
- Completion remains a manual status and does not mean the dungeon was
  actually looted.

## Exhausted mineral deposits (manual)

Right-click (long-press on mobile) **near** a visible ore deposit, then click
**"Nascondi giacimento scavato / Ripristina"**.

- The web UI finds the closest ore vegetation point within **8 meters** and
  asks for confirmation. Categories include copper, tin, silver, obsidian,
  muddy scrap and other ore.
- A dedicated `ORE` pin is saved using Munin Map's **existing** pin API.
  The pin itself is hidden from the normal marker layer; its coordinate
  hides the actual vegetation item on the 2D map (WebGL or zoomed-in canvas).
- Right-click near the same coordinate again to restore it. Restoring a pin
  created by another browser requires the usual Munin Map admin token.
- The normal world sweep already runs every **120 seconds** and should remove
  fully destroyed world objects from future map data where the game no longer
  reports them. Manual exclusions are an override for stale or partial cases.
- To see the UI on Pelican, deploy these changed assets together:
  `web/js/layers/markers.js`, `web/js/layers/markercanvas.js`,
  `web/js/layers/shapes.js`, `web/js/layers/veg.js`,
  **and new** `web/js/orehide.js`, alongside the unmodified original web
  assets and `MuninMap.dll`.

### Limitations

- The manually hidden ore is filtered out of the 2D WebGL vegetation
  renderer and high-zoom canvas shapes. **Low-zoom pregenerated raster
  vegetation tiles** in browsers without WebGL2 may continue showing it
  until the server re-renders the map tile; this web-only patch does not
  erase baked pixels.
- The 3D model view is unchanged.
- Server scans do not prove a partially mined node is depleted. The
  manual action is intentionally a visual-only override.
- Ore changes are untested on the real TheLair deployment. Back up
  the original `web/` directory and test with one copper node first.

## Sunken crypt muddy scrap piles

Munin Map classifies `mudpile` objects as vegetation kind **38 (MuddyScrap)**,
including the piles physically inside sunken crypts. The dots can therefore
appear on the surface map at the crypt's X/Z coordinates. Their count may
match `Still inside: Muddy Scrap Pile` in the dungeon popup.

**When a Sunken crypt is manually marked complete**, the custom web map
hides the muddy-scrap points attributed to that crypt. It determines the
nearest known dungeon entrance within 160 metres, matching the search
logic used by `src/World/Dungeons.cs`. Unmarking completion restores them.

- This works on the **2D WebGL** and zoomed-in **canvas vegetation** renderers.
- It does **not** delete iron, loot or rocks from the game.
- Detection depends on discovered dungeon markers; an undiscovered
  entrance may not be in the browser's marker data.
- Raster vegetation tiles and the 3D view remain subject to the limitations
  documented above.
