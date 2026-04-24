# Style Audit — Nursing Scheduler

## 1. Purpose

This document catalogs the current state of the Nursing Scheduler UI, identifies the gap between the current implementation and the target editorial design language defined in DESIGN_LANGUAGE.md, and serves as the working punch list for Phase 1 redesign work. Every finding references specific files, class names, and current values. Later prompts will reference this audit by section number.

## 2. Audit Findings

### 2.1 Typography Scale Usage

**Current state:**
- The largest font size in the application is **2.8rem** (44.8px), used on the Login page hero (`Login.tsx`, class `.left-hero h2`).
- Dashboard page title (`Dashboard.tsx`, class `.dash-header-text h1`) uses **1.85rem** (29.6px). Login card header (`Login.tsx`, class `.login-card-header h1`) also uses 1.85rem.
- Most other headings (modal titles, card titles, page subtitles) land between **1.05rem and 1.25rem**.
- Montserrat is referenced 35 times across 19 component files but never exceeds 2.8rem. It is used primarily for card titles at 1.05rem and page titles at 1.5–1.85rem.
- JetBrains Mono is not used anywhere in the current codebase — it was only just loaded in this prompt.
- No component references any `--display-*` token. All font sizes are hardcoded rem values.

**Why it feels timid:**
The display scale (32px–128px) exists in the tokens but nothing uses it. The Login hero at 2.8rem is the only moment that attempts editorial scale, and at 44.8px it is well below the target of display-lg (80px) or display-xl (104px). Every other page treats 1.85rem as "big." The result is a uniform small-text UI with no typographic hierarchy.

**Target state:**
- Login hero: display-xl (6.5rem / 104px) with tracking-tightest and italic accent word
- Dashboard welcome: display-md (3.75rem / 60px) minimum
- SemesterHub page title: display-sm (2.75rem / 44px) with a JetBrains Mono semester count marker
- Every page hero should use Montserrat at display-sm or above
- JetBrains Mono used for dates, W-numbers, section IDs, capacity counts, and editorial labels

### 2.2 Color Surface Usage

**Current state:**
- Pure white (`#ffffff`) appears **134 times** across 19 component files. Used for: card backgrounds, modal backgrounds (`csm-box`, `delete-box`), form inputs, login panel right, buttons, quick-start box, and more.
- CSS variable usage in inline `<style>` tags: **1 occurrence** total (in `Layout.tsx`, `background: var(--bg, #fafaf9)`). Every other color is a hardcoded hex value.
- Gold (#FFC629) is used in exactly 5 contexts: the 3px schedule-card-accent gradient, the Login brand dot, the Login hero italic text color, the Login gold radial gradient, and the user avatar badge. It is absent from dividers, section markers, and surface accents.

**Why it feels timid:**
Pure white cards on a near-white background create zero depth contrast. The warm editorial feel of the paper-base background is negated by clinical white surfaces floating above it. Gold is barely present — it should be a signature element visible on every page.

**Target state:**
- All card/modal surfaces use `var(--paper-raised)` (#fefdfa) instead of #ffffff
- All recessed surfaces (input backgrounds, insets) use `var(--paper-sunk)` (#f3f0e8)
- Zero hardcoded hex values in new components — all reference design tokens
- Gold hairlines (1px solid with opacity) replace gray dividers as section separators
- Gold-200 used for subtle badge backgrounds and highlight tints

### 2.3 Shadow and Depth

**Current state:**
- Dashboard cards (`Dashboard.tsx`, `.semester-card:hover`): `box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 12px 36px rgba(0,0,0,0.08)` on hover only. No resting shadow.
- Modals (`CreateScheduleModal.tsx`, `.csm-box`): `box-shadow: 0 24px 60px rgba(0,0,0,0.2)`. Single layer, no inner highlight.
- The delete confirmation box (`Dashboard.tsx`, `.delete-box`): `box-shadow: 0 20px 50px -12px rgba(0,0,0,0.2)`. Single layer.
- No component uses `inset` shadows or inner top highlights anywhere.
- Cards at rest have no shadow — they rely entirely on a 1px border for separation from the background.

**Why it feels timid:**
Without resting shadows, cards look flat and printed onto the page rather than floating above it. The absence of inner top highlights means no surface ever looks like it has light catching its edge. The modal shadows are functional but unremarkable — they don't feel layered or physical.

**Target state:**
- Resting cards: `var(--elevation-1)` for base state, `var(--elevation-2)` on hover
- Modals: `var(--elevation-modal)` with the inner highlight included
- Dropdowns/popovers: `var(--elevation-3)`
- Every elevated surface has the inner top highlight (inset 0 1px 0 rgba(255,255,255,0.9+))

### 2.4 Button Sizing and Styling

**Current state:**
- Primary green button pattern is duplicated across files with slight variations:
  - `Dashboard.tsx` `.btn-create`: padding 0.65rem 1.35rem, font-size 0.85rem
  - `Login.tsx` `.btn-submit`: padding 0.85rem, font-size 0.92rem
  - `SemesterHub.tsx` `.btn-add`: padding 0.6rem 1.2rem, font-size 0.82rem
  - `CreateScheduleModal.tsx` `.csm-btn-submit`: padding 0.6rem 1.5rem, font-size 0.85rem
- Secondary button (white with border) is also duplicated with inconsistent paddings.
- No shared button component. Each file defines its own button CSS from scratch.
- Button border-radius varies: 8px, 10px across files.

**Why it feels timid:**
The buttons are functional but undersized and inconsistent. The green gradient is the same everywhere but the padding/size/radius varies per file. There is no button size scale (sm, md, lg). There is no icon-only variant. There are no ghost or link-style button variants.

**Target state:**
- Shared Button component with size variants (sm, md, lg), style variants (primary, secondary, ghost, danger), and consistent token-based styling
- Primary buttons use elevation-1 at rest with a visible lift; elevation-2 on hover
- Consistent border-radius from --radius-lg (10px)
- All new button instances reference the shared component

### 2.5 Page Layouts

**Current state:**
- **Dashboard** (`Dashboard.tsx`): header (title + button) → even card grid. No stat strip, no hero block.
- **SemesterHub** (`SemesterHub.tsx`): header → tab strip → even card grid. Same flat layout.
- **ScheduleBuilder** (`ScheduleBuilder.tsx`): header → view toggle → 2-column grid (palette + canvas). The most structured layout, but the palette is a plain sidebar list with no editorial treatment.
- **Login** (`Login.tsx`): split panel (branding left, form right). This is the only page with an asymmetric layout.
- **Archive** (`Archive.tsx`): header → card grid. Identical structure to Dashboard.
- No page has a stat strip, editorial section markers, staggered grid, or full-bleed hero block.

**Why it feels timid:**
Every authenticated page follows the same pattern: narrow header, then an even auto-fill grid. There is no visual rhythm. No page makes deliberate use of asymmetry, whitespace, or typographic scale to create a signature moment. The layouts are functional but indistinguishable from each other.

**Target state:**
- Dashboard: editorial hero with oversized welcome text + stat strip showing semester/schedule counts in JetBrains Mono, followed by the card grid
- SemesterHub: page hero with semester name at display-sm, gold accent divider, then tabbed content
- ScheduleBuilder: the canvas itself becomes the hero — full-width with elevated depth
- Archive: muted hero treatment with "Archive" in display scale

### 2.6 Modal Design

**Current state:**
- All modals share a pattern: dark green header (`background: #1A5632`) with Montserrat title and close button, white body, bottom actions.
- Files: `CreateScheduleModal.tsx`, `CreateSemesterModal.tsx`, `CloneSemesterModal.tsx`, `CourseDetailsModal.tsx`, `StudentImportModal.tsx`.
- Modal backgrounds are `#ffffff`. Modal overlays are `rgba(0,0,0,0.5)` with `backdrop-filter: blur(2px)`.
- Each modal re-declares the entire CSS pattern from scratch (overlay, box, header, body, footer, inputs, buttons). Massive duplication.

**Why it feels timid:**
The green header pattern is decent but repetitive. No modal stands out. The white body with no inner highlights or paper texture feels flat. The overlay blur is minimal (2px). The enter/exit animations are basic CSS fadeIn.

**Target state:**
- Shared Modal component with green header, paper-raised body, elevation-modal shadow
- Overlay uses backdrop-filter: blur(8px) for stronger separation
- Enter/exit via Framer Motion with scale + opacity
- Body uses var(--paper-raised), inputs use var(--paper-sunk)
- One modal definition, all instances compose from it

### 2.7 Empty States

**Current state:**
- Dashboard (`Dashboard.tsx`, `.dash-empty`): icon in green circle + "No Semesters Yet" + "Create your first semester" + CTA button.
- SemesterHub (`SemesterHub.tsx`, `.hub-empty`): "No Schedule Groups Yet" + CTA.
- Archive (`Archive.tsx`, `.archive-empty`): "No Archived Semesters" + description.
- All follow the same template: centered icon, title, description, optional button. No illustrations, no personality.

**Why it feels timid:**
The empty states are structurally correct but visually generic. They could belong to any React app. There is no brand personality, no editorial voice, no warmth. A user's first impression of an empty page should still feel designed.

**Target state:**
- Empty states use Montserrat at display-xs or display-sm for the title
- Include a subtle gold accent element (a decorative rule, a small icon treatment)
- Description text has editorial voice ("Your scheduling canvas is ready" vs "No schedules yet")
- Background uses paper-sunk to create a recessed area that feels intentional

### 2.8 Navigation

**Current state:**
- Top nav bar (`Layout.tsx`, `.layout-nav`): green gradient background, logo (Calendar icon + "Nursing Scheduler" in Montserrat), three nav links (Rooms, Instructors, Archive), user pill (avatar + name + role badge), logout button.
- Navigation links use 0.8rem font size with rgba white text.
- No breadcrumbs on any page. Back buttons are simple `<ArrowLeft>` icon buttons on SemesterHub and ScheduleBuilder.
- Active link state: `background: rgba(255,255,255,0.15)`.
- No responsive navigation (mobile nav links just wrap).

**Why it feels timid:**
The navigation is functional and brand-colored but flat. The links are small and the active state is barely visible. There is no navigation hierarchy beyond the single top bar. The logo area uses a generic Calendar icon rather than a distinctive brand mark. On narrow screens, the navigation becomes unusable.

**Target state:**
- Navigation retains the green gradient but with more presence — slightly taller, with the paper-grain texture visible through transparent areas
- Breadcrumb trail on SemesterHub and ScheduleBuilder pages
- Active link state uses a gold-400 bottom indicator or stronger background
- Logo area uses a more distinctive treatment (e.g., gold brand dot + tracked uppercase "SELU" + Montserrat "Scheduler")
- Mobile: collapsible navigation with smooth Framer Motion reveal

### 2.9 Loading States

**Current state:**
- Global loading spinner (`index.css`, `.loading-spinner`): green border-top circle animation, gray text "Loading..."
- No skeleton screens anywhere.
- No progress bars.
- No page-level loading indicators on the navigation bar.

**Why it feels timid:**
A spinning circle is the minimum viable loading indicator. It communicates "something is happening" but not "we designed this experience." Users see the spinner on every page load (semester list, schedule list, schedule data) and it always looks the same.

**Target state:**
- Skeleton screens for card grids (Dashboard, SemesterHub) that match the card layout shape
- Subtle top-of-page progress bar on the navigation bar during API calls
- Loading spinner retained as fallback but styled with the gold accent and editorial typography

### 2.10 CSS Architecture

**Current state:**
- Every component defines its own CSS inside an inline `<style>` tag at the top of the JSX return.
- There are **19 component files** each with their own style block.
- Common patterns duplicated across files:
  - Overlay backdrop: `.delete-overlay` / `.csm-overlay` / etc. — defined separately in Dashboard, SemesterHub, CreateScheduleModal, and others
  - Button styles: green primary and white secondary buttons redefined in every file
  - Card styles: card body, card accent, card actions — duplicated in Dashboard, SemesterHub, Archive
  - Form styles: input, label, error — duplicated in every modal
- Almost zero CSS variable usage in component styles (1 occurrence of `var(--` in all component inline styles).
- 70 box-shadow declarations across 18 files, most with hardcoded values.

**Why it feels timid:**
This is not a design issue — it is a maintainability issue that makes design improvement expensive. Changing a button style requires editing 10+ files. Changing the card shadow pattern requires finding every hardcoded shadow string. The inline `<style>` pattern was necessary for Phase 0 velocity but is now the primary blocker for consistent visual quality.

**Target state:**
- Shared component library: Button, Card, Modal, Input, Badge, Stat — each defined once
- All new components import from the library; existing components migrated incrementally
- Component styles reference design tokens exclusively
- The inline `<style>` tag pattern is not used in any new code

## 3. Prioritized Remediation List

1. **Create shared component library** — Button, Card, Modal, Input, Badge. This unblocks consistent styling across all pages. (Prompt 2)
2. **Replace #ffffff with paper-raised on all card/modal surfaces** — Cumulative warmth across the entire app. (Prompt 2)
3. **Upgrade Login page hero** — Scale to display-xl, add italic accent, JetBrains Mono editorial markers. The Login is the first impression. (Prompt 3)
4. **Upgrade Dashboard page** — Editorial hero, stat strip with JetBrains Mono counts, cards using the new Card component with elevation tokens. (Prompt 3)
5. **Add elevation system to all cards** — Replace flat 1px-border cards with elevation-1 resting / elevation-2 hover. (Prompt 2)
6. **Replace gray dividers with gold hairlines** — Small change, big brand signal. (Prompt 2)
7. **Introduce JetBrains Mono** — Dates on semester cards, W-numbers in student lists, section IDs on schedule blocks, editorial labels. (Prompt 2–3)
8. **Upgrade modal pattern** — Shared Modal component with paper-raised body, elevation-modal shadow, Framer Motion enter/exit. (Prompt 2)
9. **Upgrade SemesterHub page** — Display-scale page title, gold accent, tabbed content with editorial treatment. (Prompt 4)
10. **Upgrade ScheduleBuilder** — Canvas as hero, elevated palette sidebar, refined block typography. (Prompt 4)
11. **Add skeleton loading screens** — Dashboard card grid, SemesterHub card grid, Schedule Builder canvas. (Prompt 3)
12. **Upgrade navigation** — Taller bar, breadcrumbs, gold active indicator, mobile collapse. (Prompt 3)
13. **Upgrade empty states** — Editorial voice, Montserrat titles, gold accents, personality. (Prompt 3)
14. **Add Framer Motion page transitions** — fadeInUp entrance for each route, staggered card reveal on grids. (Prompt 3–4)
15. **Upgrade Archive page** — Muted editorial hero, refined card treatment. (Prompt 4)
16. **Upgrade form inputs** — paper-sunk backgrounds, refined focus states, consistent sizing. (Prompt 2)
17. **Migrate existing inline styles to token references** — Incremental, done alongside each page upgrade.
18. **Add top-of-page progress bar** — Thin gold bar on navigation during API calls. (Prompt 3)
19. **Refine course block typography** — JetBrains Mono for times and section IDs, tighter layout. (Prompt 4)
20. **Mobile navigation** — Collapsible nav with Framer Motion. (Prompt 4)

## 4. Success Criteria

Phase 1 is complete when all of the following are true:

- **Every page has at least one signature editorial moment.** The Login hero, the Dashboard stat strip, the SemesterHub page title, the ScheduleBuilder canvas — each is visually distinctive and could be screenshotted as a showcase piece.
- **No hardcoded hex values in component style blocks.** All colors, shadows, spacing, and typography reference design tokens from index.css.
- **Every interactive element uses Framer Motion motion tokens.** Button hovers, modal entrances, card reveals, page transitions — all use the motion-fast/base/slow/editorial timing with editorial easing curves.
- **Every button, input, modal, and card uses the shared component library.** Zero inline `<style>` tag duplication for these patterns.
- **A new team member could read DESIGN_LANGUAGE.md and produce an on-brand component on day one.** The token system, anti-pattern list, and cheat sheet are comprehensive enough to guide work without oral tradition.
- **Pure white (#ffffff) does not appear as a surface color.** All surfaces use paper-raised, paper-sunk, or the appropriate paper token.
- **JetBrains Mono appears on every page** in at least one context: dates, counts, IDs, or editorial labels.
