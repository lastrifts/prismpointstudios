# Prism Point Studios — Website

The official one-page website for Prism Point Studios. It uses plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Structure

```
prism-point-studios/
├── index.html                  Page markup (all sections)
├── css/
│   └── style.css               Design tokens, layout, components, animations
├── js/
│   ├── config.js               ← Your Roblox group / Discord / game links
│   └── main.js                 Interactions and animations
└── assets/
    └── images/
        ├── logo.svg            Brand mark
        ├── favicon.svg         Browser tab icon
        ├── games/
        │   ├── mine-an-egg.jpg  Mine an Egg thumbnail
        │   └── coming-soon-1.svg / coming-soon-2.svg  Art for the upcoming slides
        └── bg/
            ├── light-field.webp / light-field-mobile.webp  Pre-rendered background
            └── crystal-frost.webp  Pre-blurred crystal shown through the hero glass
```

## Run it

Open `index.html` in a browser. You can also serve the folder locally:

```bash
npx serve .
# or
python3 -m http.server 8000
```

To host it, upload the whole folder as-is to any static host, such as Netlify, Vercel, GitHub Pages or Cloudflare Pages.

## Things to update

1. **Links:** open `js/config.js` and fill in `robloxGroup` and `discord`. Every button tagged `data-link="..."` picks up its link from this file. While a link is empty, its button scrolls to the Community section.
2. **Live stats:** in `js/config.js`, set `PPS_GAMES.mineAnEgg.placeId` to the number from the game's Roblox URL (`roblox.com/games/<placeId>/...`). The game card then shows players online, total visits, favorites and like ratio. "Playing now" refreshes every 60 seconds. The Play button links straight to the game. Until the ID is set, the stats show "—".
3. **Game artwork:** thumbnails live in `assets/images/games/`. To update Mine an Egg's art, replace `mine-an-egg.jpg` and keep the same name. A 16:9 image around 1024px wide works best.
4. **Adding a game:** in `index.html`, copy the Mine an Egg `<article class="slide ...">` block inside the carousel. Change its `data-game`, art, text and `data-link`, and either put it before the "coming soon" slides or replace one of them. Then add the same key to `PPS_GAMES` in `js/config.js` with its `placeId`. Arrows, dots, swipe and the faded side previews pick it up automatically.

**About the stats source:** Roblox's API blocks requests from other websites, so stats are fetched through the public mirror `roproxy.com` (configurable via `PPS_STATS.apiDomain`). If it's ever down, the stats show "—" and the rest of the page is unaffected.

## Look & animations

The site uses a frosted-glass ("glassmorphism") design. Panels are translucent and blur a near-black background lit by chrome-blue and lilac light ribbons, with thin iridescent glints in place of a full rainbow. Edges are thin and bright, controls are pill-shaped, and headings are set in Inter Tight with Inter for body text.

| Effect | Where | How |
|---|---|---|
| Soft light-ribbon background (pre-rendered) | Page background | `.light-field` |
| Crystal seen through the glass, with mouse parallax | Hero | `.hero-crystal`, `data-depth="N"` |
| Glass card materialises, headline rises word by word | Hero | `.hero-card`, `data-split` |
| Cursor-following light sheen on glass | All panels | `data-sheen` |
| Headlines rise word by word on scroll | Section titles | `data-split="scroll"` |
| Paragraph words fade in one by one | Intros, descriptions | `data-words` |
| Words light up as you scroll through | About text | `data-scrub` |
| Tags and buttons pop in one by one | Pill rows, CTAs | `.pop-in` |
| Panel scroll reveals (rise + fade) | All sections | `data-reveal` (`up` / `scale` / `fade` / `left` / `right`), `data-delay="ms"` |
| Game carousel: arrows, dots, swipe, arrow keys; neighbours fade at the sides | Our Games | `data-carousel` |
| Live player / visit / favorite / like counters with count-up | Game slides | `data-stats`, `js/config.js` |
| Interactive dial (tabs + arrow keys) | About | `data-dial` |
| Magnetic buttons, light sweep on hover | CTAs | `data-magnetic` |
| Floating light particles | Community | `data-particles` |
| Segmented nav with scroll-spy, hide-on-scroll, progress bar, mobile menu | Global | `main.js` |

Every animation is switched off for visitors who have **reduced motion** enabled. If JavaScript doesn't load, all content stays visible. 

### Performance

Live frosted-glass blur (`backdrop-filter`) re-blurs everything behind a panel on every frame you scroll, which is what made the page stutter. It's been replaced with pre-rendered images that look the same:

- **Background:** `assets/images/bg/light-field.webp` is a single pre-rendered image. Phones get a smaller copy. There are no live SVG filters.
- **Panels:** a translucent tint over that already-soft background. It reads as frosted glass without any live blur.
- **Hero card:** shows `crystal-frost.webp`, a pre-blurred copy of the crystal. The sharp crystal behind the card is clipped so it only shows around the card's edges.
- **Nav bar:** the only remaining live blur, on desktop only.
- **Animations:** looping animations use only transform and opacity, so they never repaint. Reveal animations do the same.
- **Pointer effects:** throttled to one update per frame and switched off on touch screens.

If you change the hero crystal's SVG, re-export `crystal-frost.webp` to match. It is the same SVG blurred by 22px, covering viewBox −300…1100 × −200…800.

## Customising the look

All colours, fonts, radii and timings live as CSS variables at the top of `css/style.css` (`:root`). Edit `--purple` (periwinkle), `--lilac` (icy silver), `--magenta` (soft lilac), `--gold` (pearl glint) and `--spectrum` to recolour the palette. Change `--glass-blur` and `--glass-fill` to adjust how frosted the panels look.
