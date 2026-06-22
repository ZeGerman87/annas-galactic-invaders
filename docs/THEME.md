---
name: Galactic Confection
colors:
  surface: '#0f0f32'
  surface-dim: '#0f0f32'
  surface-bright: '#35365a'
  surface-container-lowest: '#09092c'
  surface-container-low: '#17183a'
  surface-container: '#1b1c3e'
  surface-container-high: '#262649'
  surface-container-highest: '#313155'
  on-surface: '#e1dfff'
  on-surface-variant: '#dcbed4'
  inverse-surface: '#e1dfff'
  inverse-on-surface: '#2c2d50'
  outline: '#a4899d'
  outline-variant: '#564052'
  surface-tint: '#ffabf3'
  primary: '#ffabf3'
  on-primary: '#5b005b'
  primary-container: '#ff00ff'
  on-primary-container: '#510051'
  inverse-primary: '#a900a9'
  secondary: '#ffffff'
  on-secondary: '#003737'
  secondary-container: '#00fbfb'
  on-secondary-container: '#007070'
  tertiary: '#2ae500'
  on-tertiary: '#053900'
  tertiary-container: '#1da900'
  on-tertiary-container: '#043300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd7f5'
  primary-fixed-dim: '#ffabf3'
  on-primary-fixed: '#380038'
  on-primary-fixed-variant: '#810081'
  secondary-fixed: '#00fbfb'
  secondary-fixed-dim: '#00dddd'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f4f'
  tertiary-fixed: '#79ff5b'
  tertiary-fixed-dim: '#2ae500'
  on-tertiary-fixed: '#022100'
  on-tertiary-fixed-variant: '#095300'
  background: '#0f0f32'
  on-background: '#e1dfff'
  surface-variant: '#313155'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  body-md:
    fontFamily: Syne
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  score-display:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  safe-margin: 20px
  gutter: 12px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 32px
---

## Brand & Style
The design system centers on a "Neo-Retro Cosmic" aesthetic, blending the high-energy pulse of 80s arcade shooters with the polished, clean execution of modern vector-based mobile interfaces. It evokes an emotional response of adrenaline and whimsy—where the cold, mechanical precision of deep space meets the warm, organic delight of confectionery.

The style utilizes **Vibrant Neo-Retro** principles:
- **Neon Glows:** Elements emit soft, high-intensity glows to simulate energy sources.
- **Deep Space Depth:** Layered backgrounds using dark gradients to create infinite scale.
- **Material Contrast:** Rival ships are rendered with sharp, mechanical edges and metallic gradients, while the player's assets (ship and projectiles) use softer, "delicious" curves and matte textures to ensure they are the focal point of the visual hierarchy.

## Colors
The palette is built on a foundation of "Void Neutrals"—deep navies and purples that provide maximum contrast for the gameplay elements. 

- **Primary (Magenta):** Used for high-tier enemy energy signatures and critical HUD warnings.
- **Secondary (Cyan):** Reserved for standard enemy projectiles and shield effects.
- **Tertiary (Lime):** Applied to power-ups and health recovery to signify "utility" and "growth."
- **Player Accent (Chocolate):** A rich, warm brown used exclusively for the player's ship and projectiles. This color is always paired with a high-key cream or gold rim-light to ensure it pops against the dark background.
- **Backgrounds:** Use a radial gradient from `#161640` at the center to `#0B0B2E` at the edges to simulate cosmic depth.

## Typography
Typography is split between technical precision and artistic expression. 
- **Headlines (Space Grotesk):** Geometric and futuristic. Used for mission titles, level-up banners, and "Game Over" screens.
- **Body (Syne):** Used for narrative text and descriptions; its unique letterforms complement the "playful" nature of the confectionery theme.
- **Data (JetBrains Mono):** Used for technical readouts like health percentages, ammo counts, and coordinate systems to provide a "cockpit computer" feel.

## Layout & Spacing
This design system uses a **No Grid** contextual layout optimized for mobile portrait and landscape play. 

- **Safe Zones:** A 20px "Dead Zone" margin is maintained around the edges of the screen to prevent HUD elements from being obscured by hardware notches or fingers.
- **HUD Positioning:** Scores and vitals are pinned to the top corners. Interaction zones (joysticks/buttons) are placed in the bottom 30% of the screen.
- **Rhythm:** Elements scale in increments of 8px (sm: 8, md: 16, lg: 32) to maintain a consistent visual density across different device resolutions.

## Elevation & Depth
Depth is achieved through **Glow-Based Layering** rather than traditional shadows.
- **Layer 0 (Background):** Moving starfields and nebulae with 40% opacity.
- **Layer 1 (Enemies/Hazards):** Sharp vectors with a 5px outer glow in their respective neon colors.
- **Layer 2 (Player/Projectiles):** The player ship features a subtle "drop glow" (0x 0y 15px spread) in a warm gold to differentiate it from the cold neon of the enemies.
- **Layer 3 (UI/HUD):** Glassmorphic panels with a `backdrop-filter: blur(10px)` and a 1px white border at 20% opacity.

## Shapes
The shape language contrasts the **Hostile** and the **Heroic**:
- **Hostile (Enemies):** Sharp 45-degree angles, triangular silhouettes, and zero-radius corners.
- **Heroic (Player/UI):** Rounded-lg (0.5rem) to Rounded-xl (1.5rem) corners. The player ship should follow "Squircular" geometry—feeling soft yet aerodynamic.
- **Projectiles:** Enemy fire consists of hard-edged diamonds or lines. Player "Chocolate" fire consists of perfect circles or pill-shaped rounds to emphasize their non-mechanical nature.

## Components
- **Primary Action Buttons:** Pill-shaped with a gradient fill from Primary to Secondary. On press, they expand slightly with a high-intensity white glow.
- **Health/Energy Bars:** Segmented bars with a 1px border. Filled segments use the Tertiary (Lime) color with a flicker animation when low.
- **Combo Chips:** Small, rounded badges that float near the player ship. They use Glassmorphic backgrounds and Magenta text.
- **Input Fields (High Score):** Underlined style with a JetBrains Mono cursor, mimicking a terminal input.
- **Cards (Ship Select):** Semi-transparent dark navy panels with Rounded-lg corners and a 1px neon stroke that pulses slowly.
- **Chocolate Projectiles:** These feature a "gloss" highlight on the top-left to make them look like rounded candy spheres, contrasting against the flat-glow enemy projectiles.