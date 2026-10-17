/*
 * rumo landing: the only file you need to edit to go live.
 * Everything is optional. With all values empty the page runs in demo mode:
 * the waitlist form still works visually and stores submissions in this browser only.
 */
window.RUMO_CONFIG = {
  // Where waitlist + contact submissions are POSTed as JSON (Content-Type: text/plain, so no CORS preflight).
  // Works with a Google Apps Script web app (see README.md), a Cloudflare Worker, or your own API route.
  WAITLIST_ENDPOINT: "",

  // Shows a mailto link in the contact section when set (leave empty until the domain/inbox exists).
  CONTACT_EMAIL: "",

  // Promotional demo video. Leave provider empty to keep the "coming soon" slot.
  //   provider: "youtube" | "vimeo" | "mp4"
  //   src:      YouTube/Vimeo video id, or a direct .mp4 URL
  //   poster:   optional image shown before play (mp4 only)
  DEMO_VIDEO: { provider: "", src: "", poster: "" },

  // When the app is live, set this and the waitlist CTAs turn into a download button.
  APP_STORE_URL: "",

  // Canonical URL used in share links (defaults to the current page).
  SITE_URL: ""
};
