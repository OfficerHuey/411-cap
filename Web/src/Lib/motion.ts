//shared motion presets — easings, physics tokens, variants
//enforces the motion design philosophy across the app

import type { Transition, Variants } from "framer-motion";

//ios easing — smooth start, smooth finish, no bounce
export const ease = {
  ios: [0.32, 0.72, 0, 1] as [number, number, number, number],
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

// ── PHYSICS TOKENS ──
// every spring config represents a physical material
// mass: how heavy the element feels (higher = more momentum)
// stiffness: how snappy the spring is (higher = faster settle)
// damping: how quickly oscillation dies (higher = less bounce)
export const physics = {
  //ui chrome — buttons, badges, tooltips
  //feels: crisp, responsive, no bounce
  instant: { type: "spring" as const, mass: 0.3, stiffness: 500, damping: 30 },

  //cards, tiles — interactive content
  //feels: solid, satisfying settle with tiny overshoot
  standard: { type: "spring" as const, mass: 0.5, stiffness: 300, damping: 25 },

  //modals, panels — large surfaces
  //feels: weighty, deliberate entrance
  heavy: { type: "spring" as const, mass: 0.8, stiffness: 250, damping: 28 },

  //page transitions — full-screen movements
  //feels: smooth, cinematic
  cinematic: { type: "spring" as const, mass: 0.6, stiffness: 200, damping: 26 },

  //magnetic hover — elements attracted to cursor
  //low damping produces the overshoot+snap that reads as "magnetic"
  magnetic: { type: "spring" as const, mass: 0.2, stiffness: 180, damping: 12 },

  //bounce — celebratory moments (success, achievement)
  //feels: energetic pop with visible bounce
  bounce: { type: "spring" as const, mass: 0.4, stiffness: 400, damping: 15 },

  //gentle — background elements, decorative motion
  //feels: dreamy, slow, organic
  gentle: { type: "spring" as const, mass: 1.0, stiffness: 80, damping: 20 },
};

/** @deprecated use `physics` tokens instead */
export const spring = {
  modal: physics.heavy,
  panel: physics.heavy,
  card: physics.standard,
  stat: physics.standard,
  snappy: physics.instant,
  drawer: physics.heavy,
};

//page transition
//variants carry their own transitions so enter and exit run on independent timings
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: ease.ios },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: ease.ios },
  },
};

export const pageEnterTransition: Transition = {
  duration: 0.35,
  ease: ease.ios,
};

export const pageExitTransition: Transition = {
  duration: 0.18,
  ease: ease.ios,
};

//stagger container
export const staggerContainer = (staggerDelay = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerDelay },
  },
});

//card/item variants
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: physics.standard,
  },
};

//stat tile variants (stagger container uses 0.07)
export const statContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export const statVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: physics.standard,
  },
};

//modal variants
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: physics.heavy,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.14, ease: ease.ios },
  },
};

//panel variants (slide-out from right)
export const panelOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const panelVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: physics.heavy,
  },
  exit: {
    x: "100%",
    transition: { duration: 0.2, ease: ease.ios },
  },
};

//toast variants
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 80, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: physics.standard,
  },
  exit: {
    opacity: 0,
    x: 80,
    transition: { duration: 0.2, ease: ease.ios },
  },
};

//hero stagger (badge, rule, h1, subtitle, cta — each delayed 60ms)
export const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const heroChild: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: physics.standard,
  },
};

//button micro-interactions
export const buttonHover = {
  scale: 1.015,
  y: -1,
  transition: physics.instant,
};
export const buttonTap = {
  scale: 0.98,
  transition: physics.instant,
};
export const buttonTransition: Transition = physics.instant;

//card hover/tap (interactive cards only)
export const cardHover = {
  y: -4,
  scale: 1.01,
  transition: physics.standard,
};
export const cardTap = {
  scale: 0.99,
  transition: physics.instant,
};

//conflict badge pop-in
export const badgePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: physics.bounce,
  },
};

//section block drop-in
export const dropInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: physics.standard,
  },
};

//orchestrated page entrance (parent; children stagger in)
export const orchestration = (stagger = 0.1, delayChildren = 0.05): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

//child that enters from the left (for sidebars, palettes)
export const fromLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: physics.standard,
  },
};

//child that pops in with overshoot (for newly placed elements)
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: physics.bounce,
  },
};

//dashboard stat strip — card fades up as a unit, then children stagger
export const statStripVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...physics.standard,
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
};

//generic stagger pair — apply container variants to a flex/grid wrapper and
//item variants to each child. ease: ease-out-editorial. spacing tuned so
//4-tile rows complete in ~350ms total
export const stagger = {
  container: {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as Variants,
  item: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: ease.out,
      },
    },
  } as Variants,
} as const;

//reduced motion overrides
export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const reducedFade: Transition = { duration: 0.15 };
