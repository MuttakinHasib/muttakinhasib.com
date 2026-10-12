# muttakinhasib.com

Personal portfolio of Muttakin Islam Hasib, Senior Full Stack Engineer. Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript, and Tailwind CSS 4.

The site is a runnable dependency graph: capabilities feed projects, and selecting any node traces what it was built from and what it feeds. See [DESIGN.md](DESIGN.md) for the concept, tokens, and motion rules.

## Scripts

```bash
bun install
bun dev          # http://localhost:3000
bun run lint
bun run typecheck
bun run test     # graph planner, app planner, execution order
bun run build
```

## Structure

```
app/                     routes: /, /work, /work/[slug], /about, sitemap, robots, OG images
components/graph/        hero graph: planner (pure), geometry, GraphCanvas (client)
components/home/         homepage sections
components/visuals/      SVG reconstructions of each project (wide + narrow compositions)
components/demos/        interactive case-study prototypes, lazy-loaded per page
components/case-study/   case-study section framework
content/                 typed, resume-backed content (projects, impact, experience)
lib/                     site constants, JSON-LD, OG renderer, small hooks
tests/                   node:test suites for the pure graph logic
```

All copy and metrics live in `content/` and are taken from the resume. Change them there; no component hard-codes project facts.

## Adding real screenshots

The project visuals are original reconstructions, labelled as such on case-study pages. To use real product screenshots instead, replace the component in `components/visuals/ProjectVisual.tsx` for that project with a `next/image` and remove the reconstruction note in `app/work/[slug]/page.tsx`.

## Deploy

Deploys to Vercel with no extra configuration. `metadataBase` and canonical URLs use `https://muttakinhasib.com` (`content/profile.ts`).
