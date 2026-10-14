# Showcase: mongelt.com

The landing page at **mongelt.com**, a front door to Andrey Beregovskiy's public web projects. Today it links to:

- **[26.mongelt.com](https://26.mongelt.com):** Electing the 120th Congress, a 2026 midterm election forecast and dashboard.
- **[beregovskiy.com](https://beregovskiy.com):** personal portfolio.

It is a single static page: plain HTML and CSS, no framework, no build step, no JavaScript, no analytics, and nothing loaded from other servers.

## Preview locally

Fonts don't load when the file is opened directly, so serve the folder with any local web server. With Python 3:

```
python -m http.server 8765 --directory public
```

Then open http://127.0.0.1:8765/.

## Check

```
node --test tests/check-site.mjs
```

The checks confirm that the page links only to its two sites, loads nothing from elsewhere, and refers only to files that exist.

## Deploy

Hosted on Vercel. Every push to `main` goes live at https://mongelt.com, and other branches get preview links. Only the `public/` folder is served (see `vercel.json`).

## Credits

Fonts: [Libre Caslon Text](https://github.com/impallari/Libre-Caslon-Text) and [Public Sans](https://github.com/uswds/public-sans), both under the SIL Open Font License 1.1 (license texts in `public/fonts/`).
