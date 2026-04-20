//shared motion presets — easings, spring configs, variants
//enforces the motion design philosophy across the app

import type { Transition, Variants } from "framer-motion";

//ios easing — smooth start, smooth finish, no bounce
export const ease = {
  ios: [0.32, 0.72, 0, 1] as [number, number, number, number],
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

//spring configs for physical interactions
export const spring = {
  modal: { type: "spring" as const, stiffness: 320, damping: 32 },
  panel: { type: "spring" as const, stiffness: 280, damping: 30 },
  card: { type: "spring" as const, stiffness: 260, damping: 26 },
  stat: { type: "spring" as const, stiffness: 260, damping: 26 },
  snappy: { type: "spring" as const, stiffness: 400, damping: 35 },
  drawer: { type: "spring" as const, stiffness: 300, damping: 30 },
};

//page transition
//variants carry their own transitions so enter and exit run on independent timings
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: ease.ios },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.08, ease: ease.ios },
  },
};

export const pageEnterTransition: Transition = {
  duration: 0.2,
  ease: ease.ios,
};

export const pageExitTransition: Transition = {
  duration: 0.08,
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
    transition: spring.card,
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
    transition: spring.stat,
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
    transition: spring.modal,
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
    transition: spring.panel,
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
    transition: spring.panel,
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
    transition: { duration: 0.28, ease: ease.ios },
  },
};

//button micro-interactions
export const buttonHover = { scale: 1.015, y: -1 };
export const buttonTap = { scale: 0.98 };
export const buttonTransition: Transition = { duration: 0.2, ease: ease.ios };

//card hover/tap (interactive cards only)
export const cardHover = {
  y: -4,
  scale: 1.01,
  transition: { duration: 0.2, ease: ease.ios },
};
export const cardTap = { scale: 0.99 };

//conflict badge pop-in
export const badgePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: ease.ios },
  },
};

//section block drop-in
export const dropInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.24, ...spring.card },
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
    transition: spring.card,
  },
};

//child that pops in with overshoot (for newly placed elements)
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 350, damping: 20 },
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
      ...spring.card,
      delayChildren: 0.15,
      staggerChildren: 0.08,
    },
  },
};

//reduced motion overrides
export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.05 } },
};

export const reducedFade: Transition = { duration: 0.15 };
