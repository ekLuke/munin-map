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
