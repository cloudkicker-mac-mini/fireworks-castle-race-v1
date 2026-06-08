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

## V1.2 Sound Pass

- Added Web Audio sound effects with no external audio files.
- GO triggers a tournament horn and unlocks browser audio.
- Hoofbeats play throughout the race.
- Crowd swells play during the race and on lead changes.
- Finish fanfare plays when the winner is revealed.
- Sound On/Off toggle is available in the control panel.

## V1.3 Realism Pass

- Added generated cinematic racetrack background art.
- Replaced CSS-built horses with rendered knight/horse PNG sprites.
- Added transparent racer assets for red, white, and blue knights.
- Changed racer motion from overhead oval rotation to broadcast-style side-view racing down the track.
- Added dust and motion focus effects to reduce the flat arcade feel.
