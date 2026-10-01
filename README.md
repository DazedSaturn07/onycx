# Prashant Yadav — portfolio

A responsive portfolio for data analytics, applied machine learning, product and web work, public GitHub activity, credentials, and contact links. The site is built with Next.js App Router, Lenis, GSAP ScrollTrigger, and content in `src/data/portfolio.ts` and `src/data/project-catalog.ts`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3005`.

## Analytics dashboards

The four data project dashboards and their read-only data preparation steps are documented in [`analytics/README.md`](analytics/README.md). To rebuild their local aggregate data, install the pinned Python dependencies with `python -m pip install -r analytics/requirements.txt`, then run `python scripts/build_dashboard_data.py`. The source projects remain input-only; work from the staged copies in `dashboard_datasets/`.

## Update portfolio content

- Update projects, skills, credentials, résumé path, and profile links in `src/data/portfolio.ts`.
- Update repository case studies in `src/data/project-catalog.ts` and their presentation in `src/components/ProjectShowcase.tsx`. The full project index lives at `/projects`; the home page shows all six repository projects.
- The GitHub activity panel currently uses `DazedSaturn07`. Set `profile.githubUsername` to the desired public GitHub username and keep `profile.github` pointed at that same account.
- No GitHub token is required. The server route caches the public contribution calendar for one hour through the GitHub Contributions API. The panel degrades to a clear message if that third-party service is unavailable.
- The day cells show GitHub profile contribution totals. Those totals can include more than commits; hovering, focusing, or selecting a day updates its date and credited total.
- The site's canonical origin is `https://www.onycx.dev`, matching the repository `CNAME`. Update `src/lib/site-config.ts` if the production domain changes.

## Production hosting

This site uses a Next.js server route for contribution data, the Next.js image optimizer, and production response headers. Deploy it to a Next.js-capable Node host; a static-only host needs those server features replaced or moved to a compatible service. Configure the production domain and DNS at the host before expecting the canonical URL and sitemap to resolve publicly.

## Motion and accessibility

- The project index uses `src/components/ProjectShowcase.tsx` and the shared `src/components/ui/story-scroll.tsx` presentation. The homepage carousel derives its content from the repository catalog. Motion respects reduced-motion preferences.
- Lenis runs from GSAP's ticker and forwards scroll updates to ScrollTrigger. Same-page links remain native anchors.
- On the first visit in each tab session, a Rustic Roadway signature is written letter by letter, with Prashant followed by Yadav, then the landing page fades in. A versioned session flag skips the animation on reload. Direct section links and reduced motion also skip it. Storage being disabled does not prevent access.
- The intro prepares local fonts and starts the contribution request in the background. It leaves below-the-fold images lazy instead of eagerly decoding the whole page, then refreshes section positions after the opening fade. A 6.5-second preparation limit, Escape, and the Skip intro button prevent slow fonts from blocking access.
- Scroll reveals, word highlights, layered section transitions, and parallax honor `prefers-reduced-motion`. The hero uses a small CSS 3D orbital sculpture with pointer tilt; it does not start a full-screen WebGL scene. The About name is a separate oversized editorial signature with scroll-based word highlighting. The tilted certificate carousel stays pinned while the page scrolls through all nine cards. Its arrows, keyboard navigation, and horizontal swipes use the same scroll sequence. Reduced motion and short landscape viewports use a native horizontal gallery.
- Images use local assets and Next.js image optimization. Fonts are self-hosted with `next/font/local`; visitors make no requests to a font provider.
- The mobile navigation uses a grainy glass disclosure button and dropdown with a darker backing for readability over photographs. It closes on selection, outside press or Escape, and resets when switching to the desktop layout. The static grain tile is reused across accents and mobile glass; it does not run a noise animation while scrolling.
- Certificate transforms use cached setters, skip hidden cards, and only update selection attributes when the active card changes. The footer's decorative animations pause outside the viewport. Word highlights animate opacity rather than repainting each word's color.

## Typography

- **Chillax Variable**: interface, body copy, and main section headings. Downloaded unchanged from the official [Fontshare API](https://api.fontshare.com/v2/css?f[]=chillax@1&display=swap), governed by the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl).
- **Boska Black**: the hero name, warm section accents, and title-case footer wordmark. Downloaded unchanged from [Fontshare](https://www.fontshare.com/fonts/boska), under its [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl). Only its 27 KB WOFF2 is served. Accent text uses a static yellow-to-coral sunset gradient with subtle grain.
- **Gavency**: editorial numerals and section accents. Uses the supplied Condensed and Italic WOFF2 demo files. `fonts/gavency/description.txt` marks these files for personal use.
- **Rustic Roadway**: the first-visit intro signature. The intro uses matching glyph outlines with animated stroke masks. Uses the supplied OTF, with its personal-use terms retained in the same folder.
- **A Auto Signature**: the About signature, using the supplied TTF. Its bundled notice requires a donation for commercial use.
- The footer reads **Prashant**, with natural font proportions, three shallow depth layers, and a downward fade. Its type is never stretched to fill the container.
- **Dirtyline 36Daysoftype 2022 is still pending**: no file was supplied. Its official product page delivers download links by email and lists a separate web license. Add the authorized font file and web-use terms to `fonts/` before integrating it; do not copy the website's preview font.

For commercial use, obtain the appropriate licenses for the Gavency and Rustic Roadway demo files from their designers. Source packages and license notices remain in `fonts/`; their preview images are not served to visitors.

## SEO and security

- `src/app/layout.tsx` provides site metadata and Person JSON-LD. Dashboard routes add their own titles, descriptions, canonical URLs, and social metadata. `robots.ts` and `sitemap.ts` live beside the root route; the sitemap lists all four dashboard routes.
- Production HTML uses a fresh per-response script nonce, strict-dynamic CSP, and private/no-store caching. HTML pages render dynamically so Next.js hydration scripts and JSON-LD receive the nonce. Arbitrary inline scripts and event attributes are blocked. Inline styles remain allowed for charts and motion. Responses also carry framing, MIME, referrer, permissions, and HTTPS transport headers.
- GitHub contribution data is the only third-party server fetch. It contains no credentials and is not exposed as an open proxy.
- The API rejects foreign browser origins and has a bounded per-process rate guard. Configure the hosting firewall for distributed enforcement. The data Worker has its own CORS policy and native rate limiter.
- Vercel production builds require `NEXT_PUBLIC_ANALYTICS_DATA_BASE_URL`; dashboard requests verify release hashes and show a retry state on errors. No mock data or silent remote-to-local fallback is used.
- Git tracks the application, useful methodology documentation, a generic Worker template, required assets, and current aggregate dashboard JSON. Local environment files, deployment receipts, personal setup/audit notes, generated reports, AI-tool settings, raw datasets, Python caches, screenshots, and superseded dashboard payloads are ignored. The linked résumé, portrait, certificates, and contact details are intended public portfolio content; unused résumé copies are excluded.

## Local checks

```bash
npm run lint
npx tsc --noEmit
npm run build
node --test --test-isolation=none scripts/security-checks.test.mjs
```

Keep project claims, dates, metrics, and links evidence-based. Before shipping a design change, check a large desktop, tablet, and narrow mobile viewport, and confirm that reduced-motion preferences still expose all content.
