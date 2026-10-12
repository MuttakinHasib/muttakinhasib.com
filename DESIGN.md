# Design system: Systems in Motion

## Concept

"I turn complex systems into intuitive experiences." The site behaves like the node editors Hasib builds. Capabilities feed projects; projects produce outcomes. Selecting a node runs a reachability planner (a small cousin of ImagineArt's "Build App" planning) that traces what the node is built from and what it feeds, then wires the result into an output inspector. The headline itself ends in a port that is wired into the graph.

The signature interaction lives in the hero. Everything else borrows its vocabulary (ports, wires, node cards) without repeating the interaction.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| paper | `#F4F1E8` | Canvas |
| surface | `#E9E6DC` | Node bodies, alternate bands |
| ink | `#171815` | Type, wires, dark sections |
| graphite | `#5C5B54` | Secondary text (5.7:1 on paper) |
| muted | `#9B9A90` | Hairlines and the dot lattice only, never text |
| signal | `#C7F36B` | Live state only: active path, running pulse, availability. Never text on paper. |

Each project borrows one accent from its own domain and keeps it inside its composition: signal (App Builder), mask rose `#EF5B8C` (Generative Fill), stream blue `#8AB4FF` (cocoding.ai), ledger amber `#E6A03A` (Hashmato), agent violet `#B4A2FF` (iGOT.ai).

## Type

- **Archivo** (variable, width axis) for everything. Display is set wide (`font-stretch` 106–116%), reading text at 100%. One family; width does the work.
- **Martian Mono** only where the content really is code or an identifier: node kinds, ports, file names, terminal output.
- Scale utilities: `type-hero`, `type-display`, `type-title`, `type-heading`, `type-lead`, `type-small`, `type-mono`, `type-figure` (tabular numerals).
- Sentence case throughout. No tracked all-caps eyebrows.

## Layout

- `shell`: content width `min(100% - 2 × gutter, 90rem)`; gutter 16–48px.
- `grid-12`: 4 columns on mobile, 12 from 48rem. Left-aligned, ragged right.
- Structure comes from the node-editor dot lattice (`canvas-dots`), node cards (6px radius), and ports. Hairline rules are reserved for data rows.
- Every project visual ships a wide and a narrow SVG composition; mobile is re-composed, not scaled.

## Motion

- One orchestrated moment: the first-load intro. Headline lines rise, the headline wire draws, nodes appear column by column, then a signal pulse runs the default plan. CSS-driven so it starts before hydration; skipped after first run and under reduced motion.
- Motion that answers an action: a pulse along the traced path on selection, inspector content swap, demo state changes, directional page transitions via React `<ViewTransition>` with shared project title/visual morphs.
- No perpetual loops, no scroll-jacking, no cursor followers.
- `prefers-reduced-motion`: every element renders in its final state; only movement is removed.

## Interaction rules

- Every pointer interaction has a keyboard path: graph nodes are buttons (arrow keys follow wires, Enter selects), demos have checklists or buttons alongside canvas gestures.
- Touch targets are at least 44px.
- Dragging graph nodes is optional exploration (fine pointers only) with a reset control.

## Honesty rules

- Content comes from the resume in `content/`. Product scale (ImagineArt's 100M+ users, RBS's 4,800+ properties) is always labelled as context, not as personal results.
- Visuals are original reconstructions and say so. Demos are labelled as simplified reconstructions, not production code.
