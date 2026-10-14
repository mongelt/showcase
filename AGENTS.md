# Instructions for AI agents working in this repository

This repository is **mongelt.com**: the owner's public landing page for finished web projects. It is plain HTML and CSS with no framework, no build step and no JavaScript. This repository is public on GitHub, so everything written here is public.

Read before changing anything:
- `docs/superpowers/specs/2026-10-14-mongelt-landing-design.md`: what was built and why, the owner's decisions, and the rules for linking and describing the election dashboard (26.mongelt.com).
- `docs/visual-design.html`: the owner's design (a self-unpacking file; open it in a browser).

## Who you're working with

- The owner reviews decisions, not code: explain what a change does and why, in plain words, so it can be judged without reading the code. The owner's architecture and product judgment is strong, and the owner catches hand-waving and overstated completion. Treat the owner as the decision-maker, never as a rubber stamp.
- **Plain language.** Explain jargon instead of using it. Ask the question in detail first; keep your recommendation short and after it.
- **No people-pleasing.** If something is wrong, say so plainly, with evidence. A problem that has been disclosed is still a problem.
- **No assumptions.** Ask. Flag every assumption explicitly in the chat.
- **Don't invent** sources, titles or web addresses. If you're not sure of a fact, say so.
- **Never claim work you didn't verify.**
- **Document decisions** in `docs/` as you go.
- **Outward-facing actions need the owner's explicit OK each time:** creating or changing the GitHub repository, deploying, Vercel settings, and DNS. An OK for one action doesn't carry over to the next.
- **Stay vendor-neutral.** Keep this repository free of anything that only works with one AI vendor's tools, and tell the owner if a change would add such a tie.

## Never do these

- Link or name any address of the election dashboard other than `https://26.mongelt.com`: not its admin address, not its `vercel.app` address, not its private paths.
- Link the owner's Port product publicly.
- Put secrets, keys or tokens in this repository.
- Show forecast numbers, or claim live results, a statistical model, or AI-made predictions. The forecast is one person's ratings; the dashboard's own AI assistant only reads research data.
- Edit or delete any existing DNS record for `mongelt.com`. Only the records for `mongelt.com` itself (`@`) and `www` belong to this site; the `26` record and the email records belong to others.
- Move `mongelt.com`'s DNS away from Namecheap (to Vercel, Cloudflare or anywhere else) without the owner's explicit request. If it ever happens, every existing record must be re-created at the new provider *before* the switch, or the dashboard goes offline and email forwarding stops.
- Skip the checks after a DNS change. After every DNS change, confirm:
  - `https://26.mongelt.com` still loads;
  - `https://mongelt.com` shows this site, and `https://www.mongelt.com` forwards to it;
  - the five email (MX) records and the SPF record are still there.
- Add any name other than `mongelt.com` and `www.mongelt.com` to this site's Vercel project, or use `--force` on any `mongelt.com` name.
- Change anything in another repository from a session in this one.
- Commit the folders that Vercel's command-line tool drops into repositories (`.agents/`, `.claude/skills/`, `skills-lock.json`) or any `.env*` file. They are in `.gitignore`; delete them if they appear.

## Layout

| Path | What it is |
|---|---|
| `public/` | The website. **Only this folder is served** at mongelt.com (set in `vercel.json`). |
| `public/index.html` | The page. |
| `public/styles.css` | All styling. |
| `public/fonts/` | The two fonts and their licenses. Fonts are served from here, never from Google. |
| `tests/check-site.mjs` | Automatic checks of links, addresses, wording and files. |
| `docs/` | Design and spec. Public on GitHub, not served on the website. |

## Checks: run after every change to `public/`

1. `node --test tests/check-site.mjs` must pass. It needs only Node.js.
   - It uses **allow-lists** of addresses on purpose. Never add a list of forbidden addresses to it: in a public repository, that would publish them.
   - If a change legitimately needs a new link (for example a new project tile), add that address to the allow-lists, with the owner's OK.
2. Look at the page in a real browser, served by a local web server (fonts don't load from a plain file). Any local web server works. With Python 3 installed: `python -m http.server 8765 --directory public`, then open `http://127.0.0.1:8765/`. Check:
   - desktop sizes, a phone width, and a phone held sideways (the one-column layout applies at 820 pixels wide or less, and at 1000 wide or less when the window is 540 or less tall);
   - the browser's network log shows nothing loaded from outside servers;
   - nothing is cut off.

## Adding a project tile later

The drawn tile is deliberately wider than its column (`.tile { width: 112.5% }`), so a second tile placed next to it would overlap the first. A new tile needs a design change first; ask the owner.

## How the site goes live

The intended setup (spec §6): `main` is the live site. Vercel deploys every push to `main` automatically and gives every other branch its own preview link. Make changes on a branch, show the owner the preview, and merge only with the owner's OK.

**Status on 2026-10-14:** not connected yet. There is no GitHub repository, Vercel project or DNS record for this site yet. Each of those steps waits for the owner's OK. Update this line when they are done.
