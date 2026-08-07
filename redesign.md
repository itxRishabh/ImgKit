---
name: Solar Future
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#4d4632'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#7f7660'
  outline-variant: '#d1c6ab'
  surface-tint: '#735c00'
  primary: '#735c00'
  on-primary: '#ffffff'
  primary-container: '#facc15'
  on-primary-container: '#6c5700'
  inverse-primary: '#eec200'
  secondary: '#785a00'
  on-secondary: '#ffffff'
  secondary-container: '#fdc425'
  on-secondary-container: '#6d5200'
  tertiary: '#565e74'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9d0ea'
  on-tertiary-container: '#51596f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe083'
  primary-fixed-dim: '#eec200'
  on-primary-fixed: '#231b00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#ffdf9a'
  secondary-fixed-dim: '#f7be1d'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4300'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  title-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system embodies "Solar Future"—an optimistic, high-clarity aesthetic that prioritizes light, warmth, and structural precision. The brand personality is radiant, high-energy, and sophisticated, moving away from the coldness of traditional high-tech themes toward a more human-centric, solar-powered vision.

The visual style is a hybrid of **Minimalism** and **Clean Glassmorphism**. It utilizes a pure white canvas to emphasize breathing room, paired with high-contrast structural elements in deep charcoal to ground the experience. The emotional response should be one of clarity, progress, and warmth. All legacy neon and deep-space gradients are replaced by "Solar Gradients"—ethereal transitions from vibrant yellows to pure whites, mimicking the diffusion of sunlight through glass.

## Colors
The palette is anchored by **Pure White (#FFFFFF)** to ensure maximum luminosity. The **Primary Accent (#FACC15)** provides a vibrant, energetic pop, while the **Sophisticated Gold (#EAB308)** is used for interactive states and refined detailing.

**Deep Charcoal (#0F172A)** serves as the structural backbone, used for high-contrast typography and thin, architectural lines. Gradients must exclusively use the Solar profile:
- **Solar Flare:** Linear gradient from #FACC15 to #FFFFFF at 135 degrees.
- **Solar Wash:** Radial gradient from #FFFFFF (center) to a soft #F1F5F9 (edges).
- **Golden Edge:** A subtle 1px stroke using #EAB308 at 20% opacity for surface definition.

## Typography
This design system utilizes **Outfit** across all levels to maintain a modern, geometric, and impressive appearance. 

Headlines should be set in deep charcoal (#0F172A) with tight letter-spacing to feel impactful and structural. Body text maintains high legibility with generous line-height. Labels use a slightly heavier weight and increased letter-spacing to act as architectural markers within the UI. Use "Solar Flare" gradients on Display typography for high-impact marketing sections.

## Layout & Spacing
The layout follows a **Fluid Grid** model with an emphasis on "Solar Expansion"—using wide margins and gutters to suggest an airy, unconfined environment. 

A 12-column system is used for desktop, transitioning to a 4-column system for mobile. Vertical rhythm is strictly enforced via an 8px base unit. Components should favor internal padding over external margins to preserve the integrity of the glassmorphic containers. Large sections of white space (64px+) are encouraged between major content blocks to evoke a sense of premium architectural design.

## Elevation & Depth
Depth is achieved through **White Glassmorphism** rather than traditional shadows. Surfaces use a semi-transparent white fill (70-80% opacity) with a high backdrop blur (20px to 40px) to create a layered, light-refracting effect.

Instead of heavy shadows, use **Solar Outlines**: a 1px solid border in a faint gold (#EAB308 at 15-20% opacity). For floating elements like modals or dropdowns, apply a very soft, highly diffused ambient shadow with a slight yellow tint (#EAB308 at 5% alpha) to simulate light passing through gold-tinted glass.

## Shapes
The shape language is "Rounded" (0.5rem base), providing a sophisticated balance between organic warmth and geometric precision. 

Large containers and cards should utilize `rounded-xl` (1.5rem) to feel soft and inviting, while interactive elements like buttons and inputs use the standard `rounded` (0.5rem) for a more focused, "clickable" appearance. Icon containers and small tags may use "Pill-shaped" geometry to contrast against the more structural rectangular grid.

## Components
- **Buttons:** Primary buttons use a solid #FACC15 fill with #0F172A text. Secondary buttons are ghost-style with a 1px #EAB308 border and deep charcoal text. Hover states should trigger a subtle glow effect (box-shadow: 0 0 15px rgba(250, 204, 21, 0.4)).
- **Glass Cards:** High backdrop blur (30px), white background at 70% opacity, and a 1px gold-tinted border.
- **Input Fields:** Pure white background with a 1px #0F172A border (thin). On focus, the border transitions to #EAB308 with a soft solar glow.
- **Chips/Tags:** Small, pill-shaped elements with a faint yellow wash (5% opacity #FACC15) and #EAB308 text.
- **Lists:** Separated by thin, 1px horizontal lines in #F1F5F9 (light grey). Active list items use a left-hand "Solar Accent" bar (4px wide, #FACC15).
- **Progress Bars:** Use the "Solar Flare" gradient (Yellow to White) to show completion, moving from left to right.