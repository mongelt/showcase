// Checks the website in public/ against the rules in docs/superpowers/specs/2026-10-14-mongelt-landing-design.md.
// Run: node --test tests/check-site.mjs
// Needs only Node.js (18 or newer). Nothing to install.
//
// The address checks are allow-lists on purpose: a list of forbidden addresses
// in a public repository would publish the very addresses it is meant to protect.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'public');

// The only two sites the page may link to.
const ALLOWED_LINKS = ['https://26.mongelt.com', 'https://beregovskiy.com'];
// The only domain names that may appear anywhere in the page's code or text:
// this site's own name, plus the two linked sites.
const ALLOWED_HOSTS = ['mongelt.com', '26.mongelt.com', 'beregovskiy.com'];
// Addresses that are labels, not requests: the standard SVG namespace, in case an SVG is pasted with it.
const NAMESPACES = ['http://www.w3.org/2000/svg'];
// Endings of local file names that would otherwise look like domain endings ("styles.css").
const FILE_TYPES = ['html', 'css', 'woff2', 'woff', 'ttf', 'otf', 'txt', 'svg', 'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'ico', 'js', 'mjs', 'json', 'md', 'xml', 'webmanifest'];

// The easter-egg page, and the addresses that show it (set as rewrites in vercel.json).
// ":path*" means "and anything below it".
const EGG_PAGE = '/easter-egg.html';
const EGG_ADDRESSES = [
  '/admin', '/admin/:path*', '/wp-admin', '/wp-admin/:path*',
  '/login', '/wp-login.php', '/administrator', '/admin.php', '/user/login',
  '/signin', '/sign-in', '/cpanel', '/phpmyadmin',
];
// What the easter-egg page types, line by line, and the CSS animation that types each line.
const EGG_LINES = [
  { text: 'Not this time.', animation: 'type-1' },
  { text: 'Just a plain HTML/CSS', animation: 'type-2' },
];

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

// Files the browser reads as code: HTML and CSS. (The font license .txt files
// contain the license's own web address and are not loaded by the page.)
function codeFiles() {
  return filesIn(site).filter((f) => ['.html', '.css'].includes(extname(f)));
}

function htmlFiles() {
  return codeFiles().filter((f) => extname(f) === '.html');
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function readPage() {
  return read(join(site, 'index.html'));
}

// Every value of the given attributes, however it is quoted: name="x", name='x' or name=x.
function attributeValues(html, names) {
  const pattern = new RegExp(`\\s(?:${names.join('|')})\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'gi');
  return [...html.matchAll(pattern)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// Every url(...) value, in CSS files or in HTML.
function cssUrls(text) {
  return [...text.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// Every address a file tells the browser to load or follow.
function references(file) {
  const text = read(file);
  const fromAttributes = extname(file) === '.html'
    ? attributeValues(text, ['href', 'src', 'srcset', 'xlink:href', 'action', 'formaction', 'poster', 'data'])
    : [];
  return [...fromAttributes, ...cssUrls(text)];
}

// True for "https://...", "https:...", "mailto:...", "//host/..." and the like.
function isOutside(ref) {
  return /^[a-z][a-z0-9+.-]*:/i.test(ref) || ref.startsWith('//');
}

test('the page exists at public/index.html', () => {
  assert.ok(existsSync(join(site, 'index.html')), 'public/index.html is missing');
});

test('the page links to exactly the two allowed sites, once each', () => {
  const links = [...readPage().matchAll(/<a\b[^>]*>/gi)].flatMap((m) => attributeValues(m[0], ['href']));
  assert.deepEqual([...links].sort(), [...ALLOWED_LINKS].sort());
});

test('every outside address the page could load or follow is one of the two allowed sites', () => {
  for (const file of codeFiles()) {
    for (const ref of references(file).filter(isOutside)) {
      assert.ok(ALLOWED_LINKS.includes(ref), `${relative(root, file)} points outside the site: ${ref}`);
    }
    let text = read(file);
    for (const ns of NAMESPACES) text = text.split(ns).join('');
    for (const [url] of text.matchAll(/(?:https?:)?\/\/[^\s"'()<>]+/gi)) {
      assert.ok(ALLOWED_LINKS.includes(url), `${relative(root, file)} contains an address that is not allowed: ${url}`);
    }
  }
});

test('no domain name or path in the page code or text other than this site and the two linked sites', () => {
  const hostPattern = /(?<![\w.-])((?:[a-z0-9-]+\.)+[a-z][a-z0-9-]*[a-z0-9])(\/[^\s"'<>)]*)?/gi;
  for (const file of codeFiles()) {
    let text = read(file);
    for (const ns of NAMESPACES) text = text.split(ns).join('');
    for (const [match, rawHost, path] of text.matchAll(hostPattern)) {
      const host = rawHost.toLowerCase();
      if (FILE_TYPES.includes(host.split('.').pop())) continue;
      assert.ok(ALLOWED_HOSTS.includes(host), `${relative(root, file)} names a domain that is not allowed: ${rawHost}`);
      assert.ok(!path || path === '/', `${relative(root, file)} names a path on an allowed site: ${match}`);
    }
  }
});

test('the page has no scripts (no JavaScript, no analytics)', () => {
  for (const file of htmlFiles()) {
    const html = read(file);
    assert.doesNotMatch(html, /<script\b/i, `${relative(root, file)} has a <script> element`);
    assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${relative(root, file)} has an inline script attribute (on...=)`);
  }
  for (const file of codeFiles()) {
    assert.doesNotMatch(read(file), /javascript:/i, `${relative(root, file)} has a javascript: address`);
  }
});

test('the election tile says "Electing the 120th Congress"', () => {
  assert.match(readPage(), />Electing the 120th Congress</);
});

test('every page tells phones to use their real width', () => {
  for (const file of htmlFiles()) {
    assert.match(read(file), /<meta name="viewport" content="width=device-width, initial-scale=1">/, `${relative(root, file)} has no viewport line`);
  }
});

test('every local file the page refers to exists', () => {
  let count = 0;
  for (const file of codeFiles()) {
    for (const ref of references(file)) {
      if (isOutside(ref) || ref.startsWith('#')) continue;
      const path = ref.split(/[?#]/)[0];
      const target = path.startsWith('/') ? join(site, path) : join(dirname(file), path);
      assert.ok(existsSync(target), `${relative(root, file)} refers to a missing file: ${ref}`);
      count++;
    }
  }
  assert.ok(count > 0, 'expected the page to refer to its stylesheet and fonts');
});

test('every in-page reference in the drawings points to an element that exists', () => {
  for (const file of htmlFiles()) {
    const html = read(file);
    const ids = new Set(attributeValues(html, ['id']));
    const refs = [
      ...cssUrls(html).filter((r) => r.startsWith('#')),
      ...attributeValues(html, ['href', 'xlink:href']).filter((r) => r.startsWith('#') && r.length > 1),
    ];
    for (const ref of refs) {
      assert.ok(ids.has(ref.slice(1)), `${relative(root, file)} refers to #${ref.slice(1)}, which doesn't exist`);
    }
  }
});

// ---- The easter-egg page ----

function readEgg() {
  return read(join(site, EGG_PAGE.slice(1)));
}

test('every easter-egg address shows the easter-egg page', () => {
  const rewrites = JSON.parse(read(join(root, 'vercel.json'))).rewrites ?? [];
  const toEgg = rewrites.filter((r) => r.destination === EGG_PAGE).map((r) => r.source);
  assert.deepEqual([...toEgg].sort(), [...EGG_ADDRESSES].sort());
  for (const { destination } of rewrites) {
    assert.ok(existsSync(join(site, destination)), `vercel.json points to a missing file: ${destination}`);
  }
});

test('the easter-egg page types its two lines and gives screen readers the whole text', () => {
  const html = readEgg();
  for (const { text } of EGG_LINES) {
    assert.ok(html.includes(`>${text}</span>`), `the typed line "${text}" is missing`);
  }
  const heading = html.match(/<h1\b[^>]*>([^<]*)<\/h1>/);
  assert.ok(heading, 'the easter-egg page has no heading for screen readers');
  assert.equal(heading[1], EGG_LINES.map((l) => l.text).join(' '));
});

test('each typing animation ends exactly at the end of its line', () => {
  const css = read(join(site, 'easter-egg.css'));
  for (const { text, animation } of EGG_LINES) {
    const block = css.match(new RegExp(String.raw`@keyframes ${animation} \{([\s\S]*?)\n\}`));
    assert.ok(block, `easter-egg.css has no @keyframes ${animation}`);
    const widths = [...block[1].matchAll(/width: ([\d.]+)ch/g)].map((m) => Number(m[1]));
    assert.equal(widths.at(-1), [...text].length, `${animation} should end at ${[...text].length}ch, the length of "${text}"`);
  }
});

test('the easter-egg page asks search engines not to list it', () => {
  assert.match(readEgg(), /<meta name="robots" content="noindex, nofollow">/);
});

test('the easter-egg page has no links', () => {
  assert.doesNotMatch(readEgg(), /<a\b/i);
});
