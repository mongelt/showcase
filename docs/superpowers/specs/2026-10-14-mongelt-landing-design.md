# mongelt.com landing page: design

**Date:** 2026-10-14
**Status:** approved by the owner in chat on 2026-10-14 (the owner approved the design and asked for the build without a separate spec review, unless this spec contradicts the owner's instructions or the dashboard handoff).

**Changed after approval (2026-10-14, during the build and its review):**
- the check command became `node --test tests/check-site.mjs`;
- the font facts in §3.2 item 3 were corrected after inspecting the files;
- the list of automatic checks in §5 grew after the review;
- §3.2 change 5 (phones held sideways) was added;
- two lines that hinted at a page belonging to the dashboard were made generic;
- the owner removed the dashboard handoff from this repository (it belongs to the dashboard project), and references to it were updated.
**Inputs:** `docs/visual-design.html` (the owner's design, made in Claude Design) and a handoff from the dashboard project. The handoff is not kept in this repository; the rules it set for this site are in §4 and in `AGENTS.md`.

---

## 1. Purpose

mongelt.com is the owner's public front door for web projects that are ready to be seen. Today it links to two sites:

| Tile | Links to | Served from |
|---|---|---|
| Election forecast | `https://26.mongelt.com` | the `election-2026` repository |
| Personal portfolio | `https://beregovskiy.com` | the `Mongelt-File` repository (`mongelt/file` on GitHub) |

The page is expected to stay as it is for at least a few months. New project tiles will be rare (every few months at most).

## 2. Decisions (owner, 2026-10-14)

| Topic | Decision |
|---|---|
| How it is built | Plain HTML and CSS files. No framework, no build step, no JavaScript. |
| Design | `docs/visual-design.html` is final. It is built as drawn, including its softer party colors and Libre Caslon Text headings, which differ from the dashboard's own. |
| Tile wording | "Electing **the** 120th Congress" (the design file says "Electing 120th Congress"; the owner confirmed the dashboard's wording). |
| One-tile layout, no "Mongelt" on the page | Intended. The word "Mongelt" appears only in the browser tab. |
| Analytics | None. The portfolio already uses Umami Cloud's single free website. |
| Fonts | Served from the site itself, not from Google's servers. |
| Favicon, page description, share preview | Not now. The owner will follow up after the build. |
| Main address | `mongelt.com`. `www.mongelt.com` forwards to it. |
| Repository | `Mongelt-Showcase` locally, `mongelt/showcase` on GitHub, **public**. |
| AI instructions | `AGENTS.md` holds the rules; `CLAUDE.md` is one line that points to it. |
| Hosting | A new Vercel project named `showcase`, in the owner's existing Vercel account. |
| Pages that belong to the dashboard | Not this repository's job. |

**Repository name note (checked 2026-10-14):** `mongelt/showcase` is the old name of `mongelt/file`, and GitHub still forwards the old name to it. Creating the new repository ends that forwarding. Nothing was found that relies on it: no local clone points at the old name, no file in the related repositories mentions it, the live portfolio has no GitHub links, and Vercel's portfolio project is linked to `mongelt/file` by an ID number, not by name.

## 3. What is built

### 3.1 Files

```
public/                    the website: the only folder Vercel serves
  index.html               the page
  styles.css               all styling
  fonts/
    LibreCaslonText-Bold.woff2
    PublicSans.woff2       one file covering every weight
    OFL-LibreCaslonText.txt, OFL-PublicSans.txt   the fonts' licenses
tests/
  check-site.mjs           an automatic check of the page's links and outside requests (§5)
vercel.json                tells Vercel to serve only public/
AGENTS.md                  rules for AI agents working here
CLAUDE.md                  one line pointing to AGENTS.md
README.md                  what this is and how to preview it
.gitignore
docs/                      the design and this spec (not served on the website)
```

Keeping the website in `public/` means `docs/`, `AGENTS.md` and the rest live in the public GitHub repository but are **not** served at mongelt.com.

### 3.2 The page

Built from the static, filled-in version of the design (the `data-dc-static` copy inside `docs/visual-design.html`):

- **Dark full-screen page.** Background `#151514`, text `#E7E3DC`, secondary `#A29D95`, labels `#8C877F`, burgundy `#9C3B36`, light `#F1ECE4`.
- **Top two-thirds: "Projects".** One tile, linking to `https://26.mongelt.com`.
  - The Capitol drawing, with blue `#4A7DC4` and red `#C24B43` stripes sliding through it (a 26-second loop).
  - Title "Electing the 120th Congress", line "2026 Midterm Election Forecast and Dashboard", label "26.mongelt.com" with an arrow.
- **Bottom third: the portfolio banner**, linking to `https://beregovskiy.com`. "Andrey Beregovskiy" (the page's only heading), "Personal portfolio", label "beregovskiy.com" with an arrow, and the stack of folder tabs with "FILE" on the front tab.
- **Hover:** the arrows nudge up and right; the two front folder tabs lift.
- **Keyboard:** a visible outline around the focused link.
- **Reduced motion:** for visitors whose device asks for less motion, the stripes stop and hover movements are instant.
- **Phone layout:** everything stacks in one column, as drawn. It applies at 820 pixels wide or less (the design's own rule), and also at 1000 wide or less when the window is 540 or less tall (see change 5 below).
- **Browser tab title:** "Mongelt" (a placeholder until the owner's metadata follow-up).

Changes from the design file, all small and required:

1. The tile wording, per §2.
2. A `viewport` line in the page header. The design file lacks it because it was a design canvas. Without it, phones show a shrunken desktop page and never switch to the phone layout.
3. Fonts load from `public/fonts/` instead of Google.
   - Only the fonts the page uses are included: Libre Caslon Text bold, and Public Sans. Public Sans is one file that covers every weight (it is a "variable" font).
   - The font files are the same ones embedded in the design file (Latin characters only, which covers all of the page's text; checked).
   - Both fonts are under the SIL Open Font License, which allows this. The license texts ship next to the files.
   - The Libre Caslon license file carries the copyright line from the font file itself (2012). Google's current copy of the license names a later edition of the font (2018).
4. The design tool's "motion on/off" switch is not carried over; it was a setting for the design canvas only. Motion is on, except for visitors who ask for reduced motion.
5. **Phones held sideways use the phone layout** (added after review).
   - **The problem:** the desktop layout fills exactly one screen and hides anything that doesn't fit. On short, narrow screens it cut off the portfolio text with no way to scroll. Measured examples:
     - phones held sideways: 844×390, 932×430, 915×412;
     - small windows: 910×440, 823×470.
   - **Why the condition is limited to 1000 pixels wide:** between 821 and 1000 pixels wide, the desktop layout needs at least about 525 pixels of height. Widths of 1024 and up fit at every common height. Applying the phone layout to wide, short screens would instead blow the drawing up to full width.
   - **Result:** every desktop size the design covers is unchanged. 1440×900 still matches the design file pixel for pixel, apart from the tile wording.

Mistyped addresses on mongelt.com show Vercel's standard "not found" page.

## 4. Rules carried over from the dashboard project's handoff

- Link the dashboard only as `https://26.mongelt.com`. Never link or name its admin address, its `vercel.app` address, or private paths.
- Don't show forecast numbers on the page, and make no claims about live results, a statistical model, or AI-made predictions.
- Don't link Port publicly.
- No secrets in this repository.
- No privacy claims on the page (none are needed: the page loads nothing from outside servers and sets no cookies).
- Nothing in the dashboard's or the portfolio's repositories changes from this repository's sessions.

## 5. Checks before the owner sees it

1. **Automatic check:** `node --test tests/check-site.mjs`. It needs nothing installed beyond Node.js. It fails if:
   - any outside address the page could load or follow, in any quoting style, is anything other than the two allowed sites;
   - any domain name other than mongelt.com and the two linked sites appears in the page's code or text, or an allowed site is named with a path after it;
   - the page's two links are not exactly `https://26.mongelt.com` and `https://beregovskiy.com`;
   - the page contains a script of any kind, including inline ones (no JavaScript, no analytics);
   - a drawing refers to a part (`url(#…)`) that doesn't exist;
   - the tile wording "Electing the 120th Congress" is missing;
   - the phone `viewport` line is missing;
   - a file the page refers to (stylesheet, fonts) doesn't exist.

   It is an allow-list on purpose: listing forbidden addresses in a public repository would publish them.
2. **In a real browser,** served from a local test server:
   - screenshots at 1440×900 next to the design file;
   - other common desktop sizes, and a phone size;
   - the network log, to confirm nothing loads from outside servers;
   - reduced motion turned on;
   - keyboard focus;
   - both links' destinations respond.
3. **An independent review** of the build against the design and the handoff.

## 6. Going live: each step waits for the owner's explicit OK

1. Create `mongelt/showcase` on GitHub (public) and upload the code.
2. Create the Vercel project `showcase`, connected to that repository. Every branch gets a preview link; `main` is the live site. Check on the preview that `docs/` is not served.
3. Add `mongelt.com` (main) and `www.mongelt.com` (forwarding to it) to that project, never with `--force`. Never add `26.mongelt.com` or any other name to it.
4. The owner adds two records at Namecheap by hand: one for `@` and one for `www`, with the exact values Vercel shows. No existing record is edited or deleted.
5. Check:
   - `https://26.mongelt.com` still loads;
   - `https://mongelt.com` shows the landing, and `https://www.mongelt.com` forwards to it;
   - the secure (HTTPS) certificate works;
   - the five email (MX) records and the SPF record are still there.

## 7. Not in scope

- Favicon, page description, share-preview image (the owner's follow-up).
- Analytics.
- Live numbers from the dashboard (that would need new work in the dashboard's repository).
- Pages that belong to the dashboard.
- A second project tile: the drawn tile is wider than its column, so a second one needs a design change first.
