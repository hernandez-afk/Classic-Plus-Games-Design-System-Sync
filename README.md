# Classic Plus Games

Five Atari Classics+ games ported onto the [Classic Plus design system](https://github.com/hernandez-afk/Classics-Plus-Design-System): its Shell (boot card, title, how to play, pause, settings, sound, results), its tokens and its accessibility rules ("Built to be played by everyone").

Open `index.html` (the Test Arcade) to play every game in one page with a play-test checklist. Each game is also a standalone page in `games/`.

| Game | File | Layout |
|---|---|---|
| Asteroids | `games/asteroids.html` | wide |
| Breakout | `games/breakout.html` | portrait |
| Pong | `games/pong.html` | portrait |
| Celestipede | `games/celestipede.html` | column |
| Moon Miner | `games/moonminer.html` | column |

`originals/` holds the games as they were before the port, for comparison.

## The design system is read-only here

This repo **uses** the design system and never changes it. `kit/` is a copy:

- `kit/bundle.js`, `kit/bundle.css` and `kit/logo.svg` are copied unchanged from the design system repo.
- `kit/tokens.css` is generated from its `tokens.json` (every color, spacing, radius, shadow and size token as a CSS custom property, plus `--font-mono`).
- `kit/VERSION` is the design system commit the copy came from.

Never edit `kit/` by hand. Where the kit has a bug, the game works around it in its own file (listed below), and the fix belongs in the design system repo.

### Updating the kit

1. Copy `components/bundle.js`, `components/bundle.css` and `assets/Logos/classics-plus-logo.svg` (as `kit/logo.svg`) from the design system.
2. Regenerate `kit/tokens.css` from `tokens.json`.
3. Write the new commit SHA to `kit/VERSION`.
4. Play every game through the Test Arcade checklist. When a kit bug below is fixed upstream, remove the game's workaround.

## Running locally

The games load `../kit/` with relative paths, so serve the folder rather than opening files directly:

```
python3 -m http.server 8000
```

Then open http://localhost:8000/. The folder also works as-is on GitHub Pages.

## Accessibility, per game

Every game gets the Shell's shared settings: rebindable single-key controls, held keys as tap on/off, game speed 100/75/50%, steering, volume, messages that wait, reduced motion, pause on P/Esc and when the tab hides, and HOW TO PLAY on first play. Beyond that:

- **Asteroids:** hyperspace moved from Shift to Down. Colours follow allegiance (hostile saucer, signal drones and shield, coin pickups, its own dust token), checked against all 360 sky hues. Shop text raised to the 0.75 floor. Blinks slowed to 167ms. Reduced motion drops the warp streaks.
- **Breakout:** bricks carry notches for their point value (1 to 4), hard bricks a frame, steel a hatch, so the ladder is no longer colour-only. Poem narrator restored and read to screen readers.
- **Pong:** the purple peg (2.6:1) became the hard-brick colour. Smash beam is stepped bars, at most about 3 a second. All timers are on game time.
- **Celestipede:** autofire (no mashing). Pickups carry letters. Explosions no longer cycle colours 24 times a second. Messages STAY holds the wave banner.
- **Moon Miner:** a crash ends the run on the result screen, and PLAY AGAIN retries the mission (the campaign is kept). Timer off makes the drill clock stop for practice. Gems, pads and decks have non-colour marks. Full-screen flashes are under 9% and off under reduced motion. S is settings, so use Down instead of S.

### Known gaps

- Celestipede: the blue saucer is an enemy drawn in the player's signal blue.
- Moon Miner: alert and hostile red can share a screen on moons with saucers or lava. The bloom pass is not counted in contrast.
- Breakout: filled catch-meter slots use the kit's decorative faint ink (under 3:1), though filled and empty slots also differ by shape.
- Pong: drag places the paddle directly, so STEERING only affects keyboard speed.

### Kit bugs worked around in the games

To be fixed in the design system repo, not here:

- `.cp-layer` has no width or height, so the HUD layer renders at double size on high-DPI phones (Breakout, Pong).
- `.cp-stage-portrait` squashes the 420:640 canvas on short windows (Pong).
- The Shell's settings, pause and sound hit boxes overlap on small screens, so a tap on pause can mute (Asteroids).
- `drawFireButton` idle stroke is 1.7:1 and `drawShopCard` locked text is about 2.5:1, both under the contrast rules (Asteroids).
- The PixelBurst `debris` preset fades dust under 3:1.
- With TIMER OFF the Shell still saves a best score (Moon Miner).
- The intro fade follows only the device's reduced-motion setting, not SETTINGS > MOTION.
- The Shell's live region isn't exposed, so each game adds its own for its events.
