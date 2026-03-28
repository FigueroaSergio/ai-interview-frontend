```markdown
# Design System Strategy: The Intelligent Interface

## 1. Overview & Creative North Star
**Creative North Star: The Cognitive Sanctuary**
This design system moves beyond the cold, utilitarian nature of typical AI tools to create a "Cognitive Sanctuary." The aesthetic is rooted in **Soft Tech-Minimalism**: an environment that feels intellectually elite yet emotionally supportive. We achieve this by breaking the standard "dashboard" grid in favor of high-end editorial layouts, using expansive breathing room (`spacing-24`), and replacing rigid containment lines with fluid tonal transitions.

The goal is to instill confidence in the candidate. By using sophisticated layering and "Inter" in an editorial capacity, we signal that this platform is not just a tool, but a premiere career partner.

---

## 2. Colors & Surface Architecture
The palette transitions from deep, authoritative professional tones to vibrant, "living" accents that represent AI-driven insights.

*   **Primary (`#613dde`) & Container (`#7a5af8`):** Use these for moments of high cognitive focus and primary actions.
*   **Tertiary/Alert (`#a8362a`):** Use sparingly for critical errors or high-urgency feedback to maintain the calm sanctuary vibe.

### The "No-Line" Rule
Traditional 1px borders are strictly prohibited for sectioning. They create visual noise and feel "templated." 
*   **The Technique:** Define boundaries through background color shifts. For example, a `surface-container-low` (`#f1f3ff`) content block should sit directly on a `surface` (`#f9f9ff`) background. Let the change in hex value define the edge, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials.
*   **Nesting:** Place a `surface-container-lowest` (`#ffffff`) card inside a `surface-container` (`#e9edfc`) wrapper. This creates a natural, soft "lift" that guides the eye without needing heavy ornamentation.

### The "Glass & Gradient" Rule
To elevate the "tech" feel, use **Glassmorphism** for floating elements (like interview coaching overlays). 
*   **Spec:** Apply a semi-transparent `surface` color with a `backdrop-blur` of 12px–20px. 
*   **Signature Textures:** Apply a linear gradient (Top-Left to Bottom-Right) from `primary` to `primary-container` on hero CTAs. This adds a "spectral" depth that flat colors cannot replicate.

---

## 3. Typography: Editorial Authority
We utilize **Inter** not as a system font, but as a high-fashion editorial typeface.

*   **Display & Headlines:** Use `display-lg` (3.5rem) with tight tracking (-0.02em) for hero moments. The dramatic scale contrast between `display-lg` and `body-md` is what creates the "premium" feel.
*   **Titles & Labels:** Use `title-sm` (1rem) in medium weight for section headers. 
*   **Hierarchy as Identity:** Use `on-surface-variant` (`#484555`) for secondary descriptions to create a sophisticated grey-scale hierarchy, ensuring the `on-surface` (`#171c26`) headlines command total attention.

---

## 4. Elevation & Depth
Depth in this system is organic, not artificial.

*   **The Layering Principle:** Always stack from dark to light or vice versa. Never place two identical surface tokens adjacent to each other.
*   **Ambient Shadows:** For "floating" modals or dropdowns, use an ultra-diffused shadow: `box-shadow: 0 20px 50px rgba(23, 28, 38, 0.05)`. Notice the shadow color is a tint of our `on-surface` (dark blue-grey), not pure black.
*   **The Ghost Border Fallback:** If a border is required for accessibility (e.g., in high-contrast needs), use `outline-variant` (`#cac4d7`) at **15% opacity**. It should be felt, not seen.
*   **Edge Smoothing:** Always use the `xl` (1.5rem) or `lg` (1rem) roundedness for large containers to maintain the "friendly" AI persona.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), `xl` roundedness, and `title-sm` typography. 
*   **Secondary:** `surface-container-highest` background with `on-surface` text. No border.
*   **Tertiary:** Ghost style. No background, no border; only `primary` colored text with a subtle hover state shift to `surface-container-low`.

### Cards & Lists
*   **The Anti-Divider Rule:** Forbid 1px horizontal dividers. To separate list items, use `spacing-4` of vertical whitespace or an alternating subtle background shift between `surface-container-low` and `surface-container-lowest`.
*   **Interaction:** On hover, a card should not grow; it should shift from `surface-container` to `surface-container-lowest` to simulate "lighting up."

### Input Fields
*   **Styling:** Use `surface-container-low` for the fill. 
*   **State:** On focus, the background shifts to `surface-container-lowest` and a "Ghost Border" of `primary` at 20% opacity appears.

### AI Feedback Chips
*   **Visuals:** Use `secondary-container` backgrounds with `on-secondary-container` text. These should use `full` roundedness (pills) to distinguish them from structural UI elements.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. For example, a `headline-lg` left-aligned with a `body-lg` paragraph offset to the right.
*   **Do** embrace white space. If a section feels "tight," jump two levels up the Spacing Scale (e.g., from `10` to `16`).
*   **Do** use the `primary-fixed` token for subtle "soft-glow" backgrounds behind AI icons.

### Don't
*   **Don't** use pure black (#000000) for anything. Use `on-surface` (`#171c26`) for maximum professional depth.
*   **Don't** use `none` or `sm` roundedness. This system is built on "friendly" tech; sharp corners break the sanctuary feel.
*   **Don't** use standard shadows. If it looks like a default Material Design shadow, it’s too heavy. Lighten the opacity and double the blur.

---
**Director's Final Note:** 
Remember, we are designing a conversation between a human and an intelligence. The interface should feel like it is breathing. Every click should feel soft, every transition should feel intentional, and the lack of "lines" should make the content feel limitless.```