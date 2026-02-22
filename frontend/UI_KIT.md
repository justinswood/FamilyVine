# FamilyVine UI Kit & Brand Style Guide

This Brand Style Guide acts as the definitive rulebook for the FamilyVine visual identity. It ensures that every new feature, from the "Kinship Bridge" to the "Generational Map," feels like it belongs to the same prestigious heritage collection.

---

## Part I: Brand Identity

### 1. The Color Palette

The palette is grounded in the organic colors of the Deep South—forest greens, aged paper, and royal accents.

| Element | Hex Code | Purpose |
|---------|----------|---------|
| **Vine Green** | `#2E5A2E` | Primary Action: Headers, buttons, and the "living" tree lines. |
| **Gold Leaf** | `#D4AF37` | The Prestige: Borders, icons, and "Ancestral Glow" highlights. |
| **Alabaster Parchment** | `#F9F8F3` | The Canvas: Main backgrounds and "Vellum" cards. |
| **Amethyst Purple** | `#800080` | The Mystery: Map clusters and "Secret Recipe" tags. |
| **Charcoal Ink** | `#2C2C2C` | Legibility: Primary body text (replaces pure black). |

---

### 2. Typography (The Voice)

We use a "Dual-Tone" typography system to balance the elegance of history with the clarity of modern technology.

#### The Header: Playfair Display (Serif)

- **Usage:** Member Names, Anthology Titles, and Hero Statements.
- **Personality:** Sophisticated, timeless, and evocative of 19th-century print.
- **CSS:** `font-family: 'Playfair Display', serif; font-weight: 700;`

#### The Body: Inter (Sans-Serif)

- **Usage:** Statistics, captions, navigation, and input fields.
- **Personality:** Clean, highly legible on screens, and unobtrusive.
- **CSS:** `font-family: 'Inter', sans-serif; font-weight: 400;`

---

### 3. Visual Elements & UI Patterns

#### The "Gilded Vellum" Card

All informational pop-ups and modals should follow this pattern:

- **Background:** `#FFFFFF` (White) or `#F9F8F3` (Parchment).
- **Border:** `1px solid rgba(212, 175, 55, 0.4)` (Light Gold).
- **Shadow:** `0 10px 30px rgba(0, 0, 0, 0.05)` (Soft, deep lift).
- **Corner:** `8px` radius (Subtle roundness).

#### The "Ancestral Glow" (Active States)

When a family member is selected or highlighted:

- **Effect:** `box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);`
- **Border:** Change from the standard border to a Vine Green or Gold Leaf solid `2px` line.

---

### 4. Iconography & Imagery

- **Style:** Monoline or "Hand-Drawn" style icons. Avoid "Flat" or "3D" cartoonish icons.
- **Treatment:** All icons should be tinted with `--vine-green` or `--bronze`.
- **Photo Framing:** Historic photos should never have "hard" corners. Use a `border-radius: 4px` and a subtle inner shadow to make them look like they are set into a frame.

---

### 5. Developer "Cheat Sheet" (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #2E5A2E;   /* Vine Green */
  --color-accent: #D4AF37;    /* Gold Leaf */
  --color-bg: #F9F8F3;        /* Parchment */
  --color-purple: #800080;    /* Amethyst */
  --color-text: #2C2C2C;      /* Charcoal Ink */

  /* Typography */
  --font-header: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;

  /* Spacing & Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 12px;
  --shadow-soft: 0 4px 15px rgba(0, 0, 0, 0.05);
  --shadow-gold: 0 0 15px rgba(212, 175, 55, 0.3);
}
```

---

## Part II: Component Library

This section acts as the construction manual for building UI components. By standardizing these elements, the FamilyVine app will maintain a premium, consistent feel across every page, from the "Heritage Almanac" to the "Member Profiles."

---

### 1. The "Heritage" Button Set

Buttons should feel like tactile objects. Use your Vine Green for primary actions and Alabaster for secondary ones.

| Type | Visual Style | Usage |
|------|-------------|-------|
| **Primary** | Solid #2E5A2E, white text, 8px radius, subtle gold shadow on hover. | "Save Story," "Calculate Connection," "Add Member." |
| **Secondary** | Ghost style—1px gold border, #2C2C2C text, parchment background. | "Cancel," "Edit Profile," "View Later." |
| **Tertiary** | No border, Vine Green text with a bottom-border hover. | "Read More," "See Full Bio." |

### Developer Guidance:
> "All buttons should have a `transition: all 0.3s ease` to ensure the hover states feel smooth and professional."

---

### 2. The "Gilded Vellum" Inputs

Input fields should look like lines on an elegant ledger.

- **Style:** No full box; only a bottom border of `1px solid rgba(0,0,0,0.1)`.
- **Focus State:** The bottom border transforms into a `2px solid Vine Green`, and the label floats upward in Amethyst Purple.
- **Placeholder Text:** Use a light grey italicized serif font (e.g., *"Enter a memory..."*).

---

### 3. The "Archival Assistant" Tabs

When switching between sections (e.g., "Overview," "Photos," "Stories"), use tabs that mimic a physical filing system.

- **Active Tab:** Features a Gold Leaf top border and a slightly lighter parchment background.
- **Inactive Tab:** Flat, desaturated, and blends into the Seeded Vellum background.
- **The Animation:** When switching tabs, the content area below should use a "Slide and Fade" transition from the right.

---

### 4. Developer Implementation: The CSS Component Library

```css
/* --- BUTTONS --- */
.btn-primary {
  background-color: var(--color-primary);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-body);
  border: none;
  box-shadow: 0 4px 0px #1e3d1e; /* Deep green 'pressed' effect */
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #3d753d;
  box-shadow: var(--shadow-gold);
}

/* --- FORM INPUTS --- */
.input-ledger {
  background: transparent;
  border: none;
  border-bottom: 1px solid #CCC;
  font-family: var(--font-body);
  padding: 10px 0;
  width: 100%;
  transition: border-color 0.4s;
}

.input-ledger:focus {
  outline: none;
  border-bottom: 2px solid var(--color-primary);
}

/* --- CARDS --- */
.card-heirloom {
  background: var(--color-bg);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--border-radius-md);
  padding: 20px;
  box-shadow: var(--shadow-soft);
}
```

---

### 5. Specialized Components

### The "Story Bubble"

For quotes or oral history snippets:

- **Style:** A quote box with a large, translucent Vine Green quotation mark in the background.
- **Border:** A dashed Gold Leaf border to signify it's a "clipping" from the past.

### The "Milestone Badge"

For birthdays or anniversaries:

- **Style:** A small circular badge with a Gold Leaf border.
- **Content:** An icon (e.g., a candle or a ring) with the date in a small, capitalized Inter font.

---

### 6. Component Audit Checklist for the Dev

- [ ] **Focus States:** Every interactive element must have a clear "focus" state for users navigating via keyboard (vital for accessibility).
- [ ] **Loading States:** Use a "Skeleton Screen" (gray-washed boxes that mimic the layout) instead of a spinning wheel to keep the archival feel during load times.
- [ ] **Micro-interactions:** Add a slight "click" scale-down effect (`transform: scale(0.98)`) to buttons to give them a physical, tactile feel.

---

*See "Part I, Section 5: Developer Cheat Sheet" for the complete CSS variables reference.*
