/* ==========================================================================
   Site settings — edit these in one place.
   ========================================================================== */

/* Links. Every element with data-link="<key>" gets its href from here.
   Leave a value as "" and the button falls back to scrolling to #community. */
window.PPS_LINKS = {
  // e.g. "https://www.roblox.com/communities/1234567/Prism-Point-Studios"
  robloxGroup: "",

  // e.g. "https://discord.gg/your-invite"
  discord: "",

  // Leave "" to build it automatically from the place ID below.
  mineAnEgg: "",
};

/* Games with live stats (players online, visits, favorites, likes).
   The key matches data-game="..." on the game's slide in index.html.
   placeId is the number in the game's Roblox URL:
   https://www.roblox.com/games/<placeId>/Mine-an-Egg
   Until a placeId is set, "Play" opens a Roblox search for the name and the
   stats show "—".                                                          */
window.PPS_GAMES = {
  mineAnEgg: { placeId: "80194619733436", name: "Mine an Egg" },
};

/* Roblox's own API doesn't allow requests from other websites (CORS), so
   stats go through a public mirror of it. Change if you host your own proxy. */
window.PPS_STATS = {
  apiDomain: "roproxy.com",   // → https://games.roproxy.com/..., https://apis.roproxy.com/...
  refreshSeconds: 60,          // how often "Playing now" updates
};
