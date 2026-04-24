# Design Language — Nursing Scheduler

## 1. Design Philosophy

This application follows an **Editorial Institutional** design direction. The mental model: a world-class independent design studio — the kind that does work for Monocle, Stripe, or the Swiss Federal Railways — was hired to build an internal platform for an elite nursing program. The result is software that has a point of view. It is warm but authoritative, detailed but never cluttered, and unmistakably crafted.

"Tasteful but timid" is the enemy. A previous design pass added smooth hover states, tightened spacing, and rounded some corners. That was refinement, not elevation. Refinement polishes what exists; elevation transforms the experience. A 32px heading with -0.01em tracking is refined. An 80px Montserrat hero with tracked JetBrains Mono section markers, a gold hairline divider, and a paper-grain background is elevated. The difference is having a point of view versus playing it safe.

Every page needs at least one **signature moment** — a single visual element that makes someone pause and think "this feels designed." On the Login page, it is the oversized italic Montserrat hero. On the Dashboard, it is the editorial stat strip with monospace semester counts. On the Schedule Builder, it is the calendar grid itself, treated as a living document rather than a table. Without these moments, pages default to "generic React dashboard template with school colors." That is the failure state.

Depth is achieved through layers, not single drop shadows. A card that sits above the page has: a warm off-white surface (never pure white), a 1px inner top highlight where light catches the top edge, a subtle bottom ambient shadow, a deeper outer shadow, and optionally a gold or green accent on one edge. This layered approach makes surfaces feel physical — like thick cotton paper stock on a well-lit desk.

The design system is not decorative. Every token, every scale step, every motion curve exists to solve a specific problem: making Ashley's scheduling workflow feel confident, considered, and fast. If a visual choice does not serve the user's task or the platform's identity, it does not belong.

## 2. Foundation — What's Preserved

These elements are the bedrock. They are never changed, only built upon:

- **SELU Green (#1A5632)** — Primary brand color (Pantone 357). Used for navigation, primary buttons, focus rings, and interactive accents. The full scale runs from green-50 (#f0f9f4) to green-975 (#030a06).
- **SELU Gold (#FFC629)** — Accent color (Pantone 123). Used for editorial highlights, section dividers, badge accents, and moments that need warmth. The full scale runs from gold-200 (#fff0b3) to gold-700 (#755508).
- **Montserrat** — Display typeface. Used for all headings, hero text, page titles, and moments that carry weight. Loaded in weights 300 through 900 with italic variants; italic is used for accent words in hero text. As a geometric sans-serif, Montserrat carries one weight step heavier than a serif for equivalent visual impact — hero titles use 700 where Playfair would have used 500.
- **Inter** — Body typeface. Used for all body text, labels, form inputs, buttons, and UI chrome. Loaded in weights 300 through 700.
- **Warm cream background** — The application background is warm off-white (paper-base: #faf8f3), never cool gray or pure white. This warmth is the foundation of the editorial feel.
- **Course type colors** — Lecture (blue #3b82f6), Lab (green #10b981), Clinical (purple #8b5cf6), SimLab (amber #f59e0b). These are functional colors tied to the scheduling domain and are not changed.

## 3. Elevation Moves — What's Added

Every addition below serves a specific purpose in moving from "clean dashboard" to "editorial platform":

- **Extended green scale (950, 975)** — Deep near-black greens for hero backgrounds, giving the Login and empty states a dramatic, immersive feel without leaving the brand palette.
- **Extended gold range (200, 300, 600, 700)** — Gold becomes a real design tool, not just a 3px accent bar. Gold-200 for subtle background tints, gold-600/700 for text on gold surfaces.
- **Paper surface tokens (paper-base, paper-raised, paper-sunk, paper-ink)** — Warm off-white palette replacing pure white (#ffffff) across every card, modal, and surface. The difference between #ffffff and #fefdfa is subtle on its own but cumulative across a full page.
- **Layered elevation system (elevation-1 through elevation-modal)** — Four-tier shadow system where every level includes an inner top highlight (inset 0 1px 0 rgba(255,255,255,0.9)). This highlight is non-negotiable — it is what makes cards feel like physical paper with light catching the top edge.
- **Display typography scale (display-xs through display-2xl)** — Editorial hero sizes from 32px to 128px. The existing text scale maxes out at 2rem (32px); the display scale picks up where body text ends. Used for page heroes, login splash, and signature moments.
- **JetBrains Mono** — Technical yet editorial monospace typeface. Used for dates, W-numbers, section IDs, semester counts, and editorial section markers (e.g., "01" next to a page title). It signals precision without feeling cold.
- **Paper grain texture overlay** — A subtle SVG noise pattern (3.5% opacity) applied to the body background via ::before pseudo-element. It gives the warm cream background a physical, printed feel — like looking at a well-made editorial publication.
- **Tracking and leading tokens** — Precise typographic control. Tight tracking (-0.025em) for oversized display text in Montserrat, wide tracking (0.14em) for uppercase editorial labels. Geometric sans-serif needs less negative tracking than serif — Playfair's -0.04em display tracking is relaxed to -0.025em for Montserrat to prevent collision of round letterforms. These are the details that separate designed typography from default typography.
- **Motion tokens** — Foundation for Framer Motion animations. Four speed tiers (fast 150ms, base 250ms, slow 400ms, editorial 600ms) and two editorial easing curves. Motion must serve a purpose — entrance, emphasis, or feedback — never decoration.
- **Space scale (space-0 through space-13)** — Consistent spacing from 0 to 128px. Eliminates magic numbers in padding and margin declarations.

## 4. Anti-Patterns — Things to Avoid

These are explicit failure modes. If you catch yourself doing any of the following, stop and correct course:

- **Do not use pure white (#ffffff) for card surfaces.** Use var(--paper-raised) (#fefdfa). Pure white feels clinical; warm white feels editorial.
- **Do not use subtle single-layer shadows.** Use the elevation tokens (--elevation-1 through --elevation-modal). A single `box-shadow: 0 1px 3px rgba(0,0,0,0.04)` is invisible. The layered system with inner highlights creates actual depth.
- **Do not size hero text at 32px.** That is the ceiling of the body scale, not the starting point of the display scale. Page heroes use display-lg (80px) or display-xl (104px).
- **Do not use gray hairlines as section dividers.** Use gold hairlines (1px solid var(--gold-400) at reduced opacity) or generous whitespace. Gray dividers are generic; gold dividers are branded.
- **Do not leave pages without at least one signature moment.** Every page needs one element that would make someone screenshot it. If you cannot identify that element, the page is not done.
- **Do not use the inline `<style>` tag pattern for new components.** Existing components use this pattern as technical debt from Phase 0. New components from Prompt 2 onward use the component library pattern.
- **Do not add motion that loops forever.** Motion must serve a purpose: entrance, emphasis, state change, or user feedback. Pulsing borders, bouncing icons, and infinite animations are banned.
- **Do not use emojis as icons.** Use Lucide React icons exclusively.
- **Do not introduce font families beyond Montserrat, Inter, and JetBrains Mono.** Three families is the maximum. More dilutes the typographic identity.
- **Do not add colors outside the green/gold/cream/semantic-status palette.** No purples (except course-clinical), teals, pinks, or other brand-foreign colors. If a new shade is needed, derive it from the existing scales.

## 5. Token Cheat Sheet

### Color Tokens

| Token | Value | Use |
|---|---|---|
| `--green-950` | #06150c | Deep hero backgrounds |
| `--green-975` | #030a06 | Deepest hero backgrounds, near-black green |
| `--gold-200` | #fff0b3 | Subtle gold background tints |
| `--gold-600` | #a87c14 | Text on gold surfaces |
| `--gold-700` | #755508 | Dark text on gold surfaces |
| `--paper-base` | #faf8f3 | Main application background |
| `--paper-raised` | #fefdfa | Card and modal surfaces |
| `--paper-sunk` | #f3f0e8 | Recessed surfaces, insets, code blocks |
| `--paper-ink` | #2a2620 | Deep warm near-black for text on paper |
| `--text-on-paper` | #2a2620 | Primary text on paper surfaces |
| `--text-on-paper-muted` | #6b6558 | Secondary text on paper surfaces |
| `--text-on-dark` | #faf8f3 | Primary text on dark backgrounds |
| `--text-on-dark-muted` | rgba(250,248,243,0.72) | Secondary text on dark backgrounds |
| `--text-on-dark-faint` | rgba(250,248,243,0.48) | Tertiary text on dark backgrounds |

### Elevation Tokens

| Token | Typical Use |
|---|---|
| `--elevation-1` | Resting cards, list items |
| `--elevation-2` | Hovered cards, active panels (includes inner highlight) |
| `--elevation-3` | Popovers, dropdowns, floating panels (includes inner highlight) |
| `--elevation-modal` | Modal dialogs, overlaid content (includes inner highlight) |

### Display Typography

| Token | Value | Use |
|---|---|---|
| `--display-xs` | 2rem (32px) | Minor headings, tab labels |
| `--display-sm` | 2.75rem (44px) | Page subtitles, modal titles |
| `--display-md` | 3.75rem (60px) | Page hero titles |
| `--display-lg` | 5rem (80px) | Signature page heroes |
| `--display-xl` | 6.5rem (104px) | Login hero, marketing moments |
| `--display-2xl` | 8rem (128px) | Extreme editorial moments |

### Typography Control

| Token | Value | Use |
|---|---|---|
| `--tracking-tightest` | -0.025em | display-lg and display-xl text (Montserrat — relaxed from serif -0.04em) |
| `--tracking-tighter` | -0.02em | display-sm and display-md text |
| `--tracking-tight` | -0.01em | Standard heading text |
| `--tracking-normal` | 0 | Body text |
| `--tracking-wide` | 0.02em | Slightly spaced labels |
| `--tracking-wider` | 0.08em | Uppercase labels |
| `--tracking-widest` | 0.14em | Uppercase editorial section markers |
| `--leading-none` | 1 | Display text, tightly set |
| `--leading-tight` | 1.15 | Large headings |
| `--leading-snug` | 1.3 | Subheadings |
| `--leading-normal` | 1.5 | Body text |
| `--leading-relaxed` | 1.7 | Long-form content |

### Font Families

| Token | Value | Use |
|---|---|---|
| `--font-display` | Montserrat, sans-serif | Headings, heroes, page titles |
| `--font-body` | Inter, system stack | Body text, labels, UI chrome |
| `--font-mono` | JetBrains Mono, monospace | Dates, IDs, counts, section markers |

### Spacing

| Token | Value | Token | Value |
|---|---|---|---|
| `--space-0` | 0 | `--space-7` | 2rem (32px) |
| `--space-1` | 0.25rem (4px) | `--space-8` | 2.5rem (40px) |
| `--space-2` | 0.5rem (8px) | `--space-9` | 3rem (48px) |
| `--space-3` | 0.75rem (12px) | `--space-10` | 4rem (64px) |
| `--space-4` | 1rem (16px) | `--space-11` | 5rem (80px) |
| `--space-5` | 1.25rem (20px) | `--space-12` | 6rem (96px) |
| `--space-6` | 1.5rem (24px) | `--space-13` | 8rem (128px) |

### Motion

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 150ms | Hover states, micro-interactions |
| `--motion-base` | 250ms | Standard transitions |
| `--motion-slow` | 400ms | Panel reveals, page transitions |
| `--motion-editorial` | 600ms | Hero entrances, signature moments |
| `--ease-out-editorial` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances, elements appearing |
| `--ease-in-out-editorial` | cubic-bezier(0.65, 0, 0.35, 1) | Morphing, state changes |

## 6. Reference Mental Model

When Ashley opens this app, she should feel like she is stepping into a well-curated editorial space — confident, considered, with visible craft. Not a SaaS tool. Not a school project. A platform that an elite nursing program would be proud to have their administrative team use every day. The typography should feel like a well-set magazine spread. The surfaces should feel like thick paper stock on a clean desk. The interactions should feel deliberate, not decorative. Every detail — from the paper-grain background to the gold hairline dividers to the monospace section markers — exists to communicate one thing: someone cared deeply about building this.
