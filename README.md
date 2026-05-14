# Mongelt File

Personal portfolio website built with Next.js. Includes a public-facing site and a private admin panel for managing all content. Vibe coded with Cursor and Claude Code.

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database and auth**: Supabase (PostgreSQL + Row-Level Security)
- **Media storage**: Cloudinary
- **Rich text**: BlockNote

## Features

- **Portfolio tab** — browsable collections and content items with a full reader view
- **Resume tab** — interactive timeline with expandable entries
- **Profile section** — contact info, bio, and social links
- **Dynamic navigation menu** — score-based, context-aware content menu
- **Admin panel** — manage all content, collections, resume entries, profile data, and SEO settings
- **Download support** — files and PDFs available for download from content items
- **SEO** — sitemap, robots.txt, and per-page metadata managed via admin

## Project structure

```
app/                  # Routes and pages
  page.tsx            # Public home page
  layout.tsx          # Root layout
  admin/              # Admin panel pages
  api/                # API routes (Cloudinary, keep-alive, link preview)
components/           # UI components
  HomeClient.tsx      # Main page client logic
  Profile.tsx         # Profile header
  BottomTabBar.tsx    # Tab navigation
  tabs/               # Portfolio and Resume tab components
  admin/              # Admin UI components
lib/                  # Shared utilities
  supabase/           # Supabase client/server setup
  seo/                # SEO helpers
public/               # Static assets
```

## Credits

- Animations: [Motion](https://motion.dev)
- Download button original by vinodjangid07 / [UIVerse](https://uiverse.io)
- Profile hover effects: [Magic Card](https://magicui.design/docs/components/magic-card) and [Dot Pattern](https://magicui.design/docs/components/dot-pattern) by Magic UI
- Bottom nav hover effect original by WhiteNervosa / [UIVerse](https://uiverse.io/WhiteNervosa/popular-ladybug-27)
- Loader original by Nawsome / [UIVerse](https://uiverse.io/Nawsome/kind-mole-87)
- Typewriter effect by akshat-patel28 / [UIVerse](https://uiverse.io/akshat-patel28/cold-impala-14)

Website uses official logos of Johns Hopkins University, Axway Inc., and The LCB.
