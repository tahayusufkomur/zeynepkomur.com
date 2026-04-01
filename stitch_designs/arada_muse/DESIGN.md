# Design System Document: The Curated Canvas

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system is built to transform the digital experience of ARADA from a standard gallery website into a high-end editorial masterpiece. The philosophy is defined by the Turkish phrase *'Sade ama Vurucu'*—Simple yet Striking. 

We move beyond the "template" look by embracing **Modern Brutalism** mixed with **Editorial Sophistication**. This is achieved through:
*   **Hard-Edge Geometry:** A strict 0px radius policy across all components to mimic the edges of a physical canvas or a structural gallery wall.
*   **Intentional Asymmetry:** Utilizing the spacing scale to create unconventional layouts where whitespace is as "heavy" as the content.
*   **Vibrant Block Theory:** Using the high-impact Blue, Yellow, and Pink tokens not as accents, but as structural anchors that define the page flow.

The branding, `arada by zeynep kömür`, must always remain lowercase and elegant, serving as a quiet signature in the corner of a loud, vibrant exhibition.

---

## 2. Colors & Visual Soul
The color strategy utilizes a sophisticated Material 3 palette, reimagined for high-impact art curation.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries must be established through color blocking.
*   Use `surface-container-low` (#f2efff) against `surface` (#f8f5ff) to create invisible divisions.
*   Use the `primary_container` (#819bff) or `secondary_container` (#ffd709) for full-width horizontal bands to separate major content shifts.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of museum board. 
*   **Base:** `background` (#f8f5ff).
*   **Nesting:** Place `surface_container_lowest` (#ffffff) cards on top of `surface_container` (#e8e6ff) sections to create depth without lines.

### Glass & Gradient (The "Atmospheric" Layer)
To prevent the design from feeling flat, use Glassmorphism for floating navigation or artistic overlays:
*   **Glass Effect:** Apply `surface` color at 70% opacity with a `backdrop-blur` of 20px.
*   **Signature Textures:** Use subtle linear gradients from `primary` (#004be3) to `primary_dim` (#0041c8) for hero CTAs to add "soul" and dimension.

---

## 3. Typography: The Editorial Voice
We utilize **Public Sans** for headlines and **Plus Jakarta Sans** for body and labels. The hierarchy is designed to feel like an exhibition catalog—bold, oversized, and authoritative.

*   **Display (The Statement):** Use `display-lg` (3.5rem) for hero statements. Tighten the letter-spacing (-0.02em) to create a "striking" impact.
*   **The Signature:** The branding `arada by zeynep kömür` should use `title-md` weight but remain lowercase.
*   **Body & Labels:** `body-lg` (1rem) is the workhorse. For artist descriptions, use `body-md` on `on_surface_variant` (#575881) to create a tonal hierarchy that recedes, allowing the art (or headers) to lead.

---

## 4. Elevation & Depth
In this system, elevation is achieved through **Tonal Layering**, not structural shadows.

*   **The Layering Principle:** Depth is "stacked." A `surface_container_high` (#e1e0ff) element sitting on a `surface` background creates an immediate perception of height.
*   **Ambient Shadows:** If a floating element (like a modal or a primary action) requires a shadow, it must be an "Ambient Shadow": Blur 40px, Spread 0, Opacity 6% using the `on_surface` (#2a2b51) tint. It should feel like a soft glow, not a drop shadow.
*   **The "Ghost Border" Fallback:** For accessibility in forms, use the `outline_variant` (#a9a9d7) at **20% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons (Geometric Blocks)
*   **Primary:** Background: `primary` (#004be3); Text: `on_primary` (#f2f1ff). **Shape: 0px radius.** Padding: `spacing-4` (1.4rem) horizontal.
*   **Secondary:** Background: `secondary_container` (#ffd709); Text: `on_secondary_container` (#5b4b00). This provides the "Yellow" high-impact pop.
*   **Tertiary:** No background. Text: `tertiary` (#b30065). Underline with a 2px offset using `tertiary_container`.

### Cards & Exhibition Lists
*   **Rule:** Forbid divider lines.
*   **Structure:** Use `surface_container_low` for the card background. Separate cards using `spacing-6` (2rem) or `spacing-8` (2.75rem).
*   **Image Handling:** Artworks should always be flush to the edges of the card (full-bleed) to emphasize the 0px radius.

### Input Fields
*   **Style:** Minimalist underline. Use `surface_container_highest` (#dbd9ff) as a subtle background fill with a 2px bottom stroke in `primary` only when focused.
*   **Error State:** Use `error` (#b41340) for text and `error_container` (#f74b6d) for the background hint.

### Signature Artistic Elements
*   **The "Brush Stroke" Overlay:** Occasionally place a `tertiary_fixed` (#ff8db7) geometric shape or SVG brush stroke behind images or text, offset by `spacing-4` to break the rigid grid.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use the `20` (7rem) and `24` (8.5rem) spacing tokens for top/bottom section padding to give the art "room to breathe."
*   **Do** mix vibrant color blocks. A `primary` block sitting adjacent to a `secondary_container` block is encouraged for high-impact visual rhythm.
*   **Do** use lowercase for all branding and navigation labels to maintain the "elegant" Zeynep Kömür aesthetic.

### Don’t:
*   **Don’t** use rounded corners. Every element must have a 90-degree angle.
*   **Don’t** use black (#000000) for text. Use `on_surface` (#2a2b51) for a sophisticated, deep-ink feel.
*   **Don’t** use standard "Grey" shadows. If a shadow is needed, tint it with the primary blue or surface purple.
*   **Don’t** use 1px dividers to separate list items. Use whitespace (`spacing-3`) or subtle color shifts between `surface_container_low` and `surface_container_high`.