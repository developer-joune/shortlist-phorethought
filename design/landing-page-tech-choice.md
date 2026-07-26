# Marketing landing page — animation/tech choice

Scope: implementing the scroll-driven reveals called for in `design/landing-page-wireframe-v1.md`
(approved). This doc picks the library, states why, and names the tradeoffs — per the original
ask, before writing the actual page.

## Choice: GSAP + ScrollTrigger, plus Lenis for smooth-scroll

- **GSAP** (GreenSock Animation Platform) — the timeline/tweening engine. **ScrollTrigger** (a
  GSAP plugin) — ties animation progress to scroll position: reveals, staggered entrances,
  scrub-linked effects, and pinning a section in place while its content animates. As of GSAP's
  2025 licensing change (Webflow's acquisition of GreenSock), the whole plugin set including
  ScrollTrigger is free for this kind of use — worth a quick re-check against GreenSock's current
  terms at actual build/ship time rather than treating this doc as the last word on licensing.
- **Lenis** — a small smooth-scroll library. Not strictly required for reveals to work, but it's
  what turns "elements fade in on scroll" into the specific *premium, buttery* feel the operator
  asked for — most of what reads as "high-end" on award-winning sites is the scroll physics
  itself (momentum, easing), not just that things animate at all. Pairing Lenis + ScrollTrigger is
  a well-established combination (GSAP's own docs document the integration directly), not a novel
  pairing being invented here.
- Both load via CDN `<script>` tags — no bundler, no build step, no framework. This matches how
  every other real deliverable in this repo works (the feed prototype, the site shell, the
  operator review screens) and the operator's own stated preference for a plain file-based
  workflow. A React/Next.js + Framer Motion stack would give more component-level power but adds
  a build pipeline this 3-day-scoped project has no other use for — disproportionate for one
  static page.

## Why not Three.js

The brief explicitly said 3D only if it genuinely earns its place in *this* hero — it doesn't.
There's no spatial data, product demo, or literal 3D object this brand has any reason to render;
reaching for WebGL here would be adding real complexity (perf cost, accessibility risk, a
noticeably heavier page) to manufacture "impressive," which is exactly the failure mode the ask
warned against. It would also cut against the brand's own established tone — warm, personal,
card-based — which reads closer to a considered editorial/product site than a WebGL showcase.
Three.js sites lean toward a technical/futuristic register that doesn't match "you're a person,
not a system" positioning (see subcon_brand's tone guide).

## Why not a lighter option (AOS or plain CSS `@scroll-timeline`)

Considered and rejected for the opposite reason: AOS-style libraries do simple fade/slide-in on
scroll, which is fine but not what "high-end, premium, real hero" was asking for — no pinning, no
scrubbing, no staggered multi-element choreography. The wireframe's standout moment (the
qualification-gate comparison section) needs more control than a basic reveal library gives —
that section is the actual differentiator/moat and is worth the extra engineering weight GSAP
brings. Native CSS scroll-driven animations (`animation-timeline: scroll()`) are real and
improving, but browser support isn't reliably even yet across what a public marketing page needs
to support — not the safe default for a page whose whole job is first impressions.

## Constraints this choice carries into the build

- **`prefers-reduced-motion` must be respected** — scroll/parallax effects get disabled or
  reduced to simple opacity fades for users with that OS-level preference set. This isn't
  optional polish; it's the same category of issue subcon_a11y caught on the feed prototype
  (motion-triggered vestibular issues are a real WCAG 2.3.3 concern), and it's being built in from
  the start this time rather than retrofitted.
- **The library is an animation engine, not a visual style** — adopting GSAP doesn't mean
  adopting the dark/neon/glassmorphism look common on GSAP showcase sites. Visual execution stays
  governed by the already-established system (warm neutral canvas, one accent, the same tokens as
  the feed prototype) — same IP-originality discipline as the step-tracker-not-ring call.
- Page weight: GSAP core + ScrollTrigger + Lenis is a modest addition (well under 100KB combined,
  minified/gzipped) — reasonable for a marketing page whose whole purpose is a strong first
  impression, not a concern at this page's scope.
