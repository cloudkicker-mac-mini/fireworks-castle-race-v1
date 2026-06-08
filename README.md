# Castle Race Spin-to-Win V1

Static prototype for a fireworks stand customer game.

## Run Locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit:

```text
http://localhost:4173/projects/fireworks-castle-race-v1/
```

## GitHub Pages

This version has no backend and no build step. It can be deployed from this folder as static files.

## V1 Scope

- Customer picks Red, White, or Blue.
- Customer taps GO.
- Three castle-themed knight horses race for about 19-24 seconds.
- Horses trade leads during the race.
- Final winner is selected before animation starts.
- Prize reveal appears at the end.
- Fullscreen button supports kiosk-style operation.
- Reset button prepares the next customer.

## V1.1 Visual Pass

- Replaced straight lanes with an oval dirt horse-racing track.
- Added rails, infield, grandstand, starting gate, and finish arch.
- Reworked racers into larger horses with knights, saddles, lances, and pennants.
- Racers now move around the oval with lane depth, rotation, and lead-change announcements.
