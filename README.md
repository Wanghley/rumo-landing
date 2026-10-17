# rumo landing

Waitlist landing page for rumo: **your personal AI CFO** (expense analysis + the iPhone widget).
Static site, no build step, no dependencies. PT-BR first, EN toggle (full peer, not a translation pass).

```bash
cd rumo-landing
python3 -m http.server 8080      # then open http://localhost:8080  (or just open index.html)
```

## What is on the page

| Section | Job |
|---|---|
| Hero | The hook ("Seu CFO pessoal, com IA."), the email field, and a live phone + widget that keep receiving expenses |
| Demo slot | 16:9 stage for the promo video (shows "coming soon" until you set a video, see below) |
| How it works | Pinned phone, 3 chapters: spending sorted automatically, AI analysis, ask the CFO |
| Widget | The star: widget stage that updates live (banner drops, totals roll, bars grow) |
| Promise | Brand promise band: never holds, moves or converts money |
| FAQ, final CTA, contact | Objections, second signup form, contact form |

Conversion mechanics: signup form is email-only (lowest friction); success state asks 3 optional questions
(country, what weighs most, iPhone/Android), then offers WhatsApp share and copy-link with a referral code.
Every join CTA lands on a form and focuses the field. A returning visitor sees the success state again.

## Go live: the only file you must edit is `assets/js/config.js`

```js
WAITLIST_ENDPOINT: "",   // where signups + contact messages are POSTed
CONTACT_EMAIL: "",       // shows a mailto link in the contact section
DEMO_VIDEO: { provider: "", src: "", poster: "" },   // "youtube" | "vimeo" | "mp4"
APP_STORE_URL: "",       // when set, every join CTA becomes a download button
SITE_URL: "",            // canonical URL used in share links
```

With everything empty the page runs in **demo mode**: forms work visually and submissions are kept in this
browser only (`localStorage.rumo_demo_leads`). **Nothing is collected until `WAITLIST_ENDPOINT` is set.**

### Fastest receiver: a Google Sheet (no server)

1. Create a Sheet. Extensions > Apps Script. Paste:

```js
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('leads') || ss.insertSheet('leads');
  if (sh.getLastRow() === 0) sh.appendRow(['ts','type','email','name','message','country','device','concerns','lang','ref','myRef','utm','page']);
  sh.appendRow([d.ts, d.type, d.email || '', d.name || '', d.message || '', d.country || '', d.device || '',
                (d.concerns || []).join('|'), d.lang, d.ref || '', d.myRef || '', JSON.stringify(d.utm || {}), d.page]);
  return ContentService.createTextOutput('{"ok":true}').setMimeType(ContentService.MimeType.JSON);
}
```

2. Deploy > New deployment > Web app. Execute as: me. Who has access: anyone. Copy the `/exec` URL into `WAITLIST_ENDPOINT`.

### Payload contract (JSON body, `Content-Type: text/plain`, so there is no CORS preflight)

```jsonc
{ "type": "waitlist" | "waitlist_profile" | "contact",
  "email": "...", "name": "...", "message": "...",          // contact only: name, message
  "country": "BR|US|other", "concerns": ["where","subs"], "device": "iphone|android",   // waitlist_profile only
  "lang": "pt|en", "ts": "ISO-8601", "page": "...", "referrer": "...",
  "utm": { "utm_source": "..." }, "ref": "<code of whoever shared the link>", "myRef": "<this visitor's own code>" }
```

`waitlist_profile` rows arrive after `waitlist` rows for the same email: join them by email. `ref` -> `myRef`
gives you the referral graph without any backend logic. If you later want this in `rumo-api`, it is one
unauthenticated, rate-limited `POST /v1/waitlist` route that accepts this body.

### Analytics

The page calls `posthog.capture`, `plausible` or `gtag` if one is present, otherwise it only keeps events in
`window.__rumoEvents`. Paste your analytics snippet into `index.html` `<head>`. Events: `lp_view`, `cta_click`,
`wl_focus`, `wl_submit`, `wl_success`, `wl_error`, `wl_invalid`, `wl_profile`, `share_whatsapp`, `share_copy`,
`demo_play`, `chapter_seen`, `contact_submit`, `lang_change`.

### Deploy

Any static host works: Firebase Hosting, Cloudflare Pages, Netlify, Vercel, S3. Before publishing:
set an **absolute** `og:image` URL in `index.html` (social cards need it), and add a privacy policy page
(see below).

## Before launch: things only you can decide or verify

- **Privacy policy.** The form states its purpose in one line, but a collected email needs a real policy (LGPD/GDPR). Not written here on purpose.
- **Trademark.** The brand book says clearance against Rumo S.A. (Class 36/42) blocks finalizing brand assets. The logo here is a working draft.
- **Domain + contact inbox.** None is confirmed in the repo, so `CONTACT_EMAIL` is empty.
- **Claims to verify against the real iOS scope:** Apple Wallet capture ("Pagou com o Apple Wallet? Entra sozinho"), the widget's "Novo gasto" tap, the weekly summary, "Pergunte ao rumo" being Pro, and "extratos criptografados". All come from the approved iOS v1 scope and the playbook, but the page promises them.
- **Tax/legal copy.** There is none on the page: the FBAR and dual-country lines were removed in the pivot to expenses. Keep it that way until a professional has reviewed any tax wording.
- **Demo data.** Every number on the phone and widgets is synthetic ("Mariana"), labeled as sample data. Replace the HTML phone mocks with real screenshots once the iOS app exists.
- **Apple badge.** `APP_STORE_URL` mode uses a plain styled button. Apple requires its official badge for the App Store link: swap it in at launch.

## Brand notes

- Palette, type, radii and the "never alarm" rule come from `RUMO-BRAND-GUIDELINES.md` and `rumo-design-system/tokens/*.json`.
  `rumo-design-system/README.md` and its `components/*.html` still describe the older cool-blue "Horizon Atlas" palette; the brand book (July 2026) supersedes it and this page follows the brand book.
- **Logged deviation:** O Farol (the solar glow) is much stronger here than the in-app 15% token, because a landing page has to attract. It stays a background glow only, never a fill on interactive UI, and is static under `prefers-reduced-motion`.
- The money demo uses the visitor's language currency (PT: R$, EN: $) with locale-correct formatting, tabular numerals, small symbol and soft cents.
- Logo: wordmark "rumo" in Epilogue 800 with the final "o" cut by a fine slot at 2 o'clock (a bearing). The symbol/app icon is that "o" on parchment with the Farol glow showing through its counter. SVGs and PNG icon sizes are in `assets/brand/`. `tools/build_brand.py` regenerates them from the font outlines (needs `fonttools`, `brotli`, `skia-pathops`; adjust the paths at the top).

## Files

```
index.html                 single page; templates for every phone screen and widget at the bottom
assets/css/styles.css      tokens, layout, phone + widget components, motion, reduced-motion
assets/js/config.js        the one file to edit (see above)
assets/js/app.js           i18n, spending engine (shared state for all phones/widgets), forms, observers
assets/fonts/              Epilogue + Plus Jakarta Sans, Latin subset, self-hosted (OFL)
assets/brand/              wordmark (3 colors), symbol, app icon, favicons, og-image.png
tools/build_brand.py       logo generator
```
