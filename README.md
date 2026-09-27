# Prashant Yadav — portfolio

A responsive portfolio for data analytics, applied machine learning, product and web work, public GitHub activity, credentials, and contact links. The site is built with Next.js App Router, Lenis, GSAP ScrollTrigger, and content in `src/data/portfolio.ts` and `src/data/project-catalog.ts`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3005`.

## Update portfolio content

- Update projects, skills, credentials, résumé path, and profile links in `src/data/portfolio.ts`.
- Update repository case studies and their project visuals in `src/data/project-catalog.ts` and `src/components/ProjectArtwork.tsx`. The full project index lives at `/projects`; the home page shows a smaller analytics-led selection.
- The GitHub activity panel currently uses `DazedSaturn07`. Set `profile.githubUsername` to the desired public GitHub username and keep `profile.github` pointed at that same account.
- No GitHub token is required. The server route caches the public contribution calendar for one hour through the GitHub Contributions API. The panel degrades to a clear message if that third-party service is unavailable.
- The day cells show GitHub profile contribution totals. Those totals can include more than commits; hovering, focusing, or selecting a day updates its date and credited total.
- The site's canonical origin is `https://www.onycx.dev`, matching the repository `CNAME`. Update `src/lib/site-config.ts` if the production domain changes.

## Production hosting

This site uses a Next.js server route for contribution data, the Next.js image optimizer, and production response headers. Deploy it to a Next.js-capable Node host; a static-only host needs those server features replaced or moved to a compatible service. Configure the production domain and DNS at the host before expecting the canonical URL and sitemap to resolve publicly.

## Motion and accessibility

- Lenis runs from GSAP's ticker and forwards scroll updates to ScrollTrigger. Same-page links remain native anchors.
- On the first visit in each tab session, a Rustic Roadway signature is written letter by letter, with Prashant followed by Yadav, then the landing page fades in. A versioned session flag skips the animation on reload. Direct section links and reduced motion also skip it. Storage being disabled does not prevent access.
- The intro prepares local fonts and starts the contribution request in the background. It leaves below-the-fold images lazy instead of eagerly decoding the whole page, then refreshes section positions after the opening fade. A 6.5-second preparation limit, Escape, and the Skip intro button prevent slow fonts from blocking access.
- Scroll reveals, word highlights, and parallax honor `prefers-reduced-motion`. The tilted certificate carousel stays pinned while the page scrolls through all nine cards. Its arrows, keyboard navigation, and horizontal swipes use the same scroll sequence. Reduced motion and short landscape viewports use a native horizontal gallery.
- Images use local assets and Next.js image optimization. Fonts are self-hosted with `next/font/local`; visitors make no requests to a font provider.
- The mobile navigation uses a grainy glass disclosure button and dropdown with a darker backing for readability over photographs. It closes on selection, outside press or Escape, and resets when switching to the desktop layout. The static grain tile is reused across accents and mobile glass; it does not run a noise animation while scrolling.
- Certificate transforms use cached setters, skip hidden cards, and only update selection attributes when the active card changes. The footer's decorative animations pause outside the viewport. Word highlights animate opacity rather than repainting each word's color.

## Typography

- **Chillax Variable**: interface, body copy, and main section headings. Downloaded unchanged from the official [Fontshare API](https://api.fontshare.com/v2/css?f[]=chillax@1&display=swap), governed by the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl).
- **Boska Black**: the hero name, warm section accents, and title-case footer wordmark. Downloaded unchanged from [Fontshare](https://www.fontshare.com/fonts/boska), under its [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl). Only its 27 KB WOFF2 is served. Accent text uses a static yellow-to-coral sunset gradient with subtle grain.
- **Gavency**: the sculptural monogram and editorial numerals. Uses the supplied Condensed and Italic WOFF2 demo files. `fonts/gavency/description.txt` marks these files for personal use.
- **Rustic Roadway**: the signature at the end of About and the first-visit intro. The intro uses matching glyph outlines with animated stroke masks. Uses the supplied OTF, with its personal-use terms retained in the same folder.
- The footer reads **Prashant**, with natural font proportions, three shallow depth layers, and a downward fade. Its type is never stretched to fill the container.
- **Dirtyline 36Daysoftype 2022 is still pending**: no file was supplied. Its official product page delivers download links by email and lists a separate web license. Add the authorized font file and web-use terms to `fonts/` before integrating it; do not copy the website's preview font.

For commercial use, obtain the appropriate licenses for the Gavency and Rustic Roadway demo files from their designers. Source packages and license notices remain in `fonts/`; their preview images are not served to visitors.

## SEO and security

- `src/app/layout.tsx` provides the canonical metadata and Person JSON-LD. `robots.ts`, `sitemap.ts`, and the generated social images live beside the root route.
- Production responses add a restrictive Content Security Policy and standard framing, MIME, referrer, permissions, and HTTPS transport headers. The CSP allows inline scripts and styles required by Next.js and font variables; review it if new external services or embeds are added.
- GitHub contribution data is the only third-party server fetch. It contains no credentials and is not exposed as an open proxy.

## Local checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Keep project claims, dates, metrics, and links evidence-based. Before shipping a design change, check a large desktop, tablet, and narrow mobile viewport, and confirm that reduced-motion preferences still expose all content.
