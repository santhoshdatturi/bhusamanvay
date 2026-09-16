# Component Rules

- Use shadcn/ui components wherever appropriate.
- **Never modify primitive shadcn UI components** in `components/ui/`. These are managed by the shadcn CLI and must stay in sync with upstream. Build wrapper components instead if customization is needed.

# UI & Design Guidelines

- **Aesthetic**: The design must feel like a premium, modern platform. Capture high polish, clear hierarchy, whitespace, subtle motion, and visual quality.
- **Vibe**: Modern, Technical, Minimal, Elegant, Fast.
- **What to Avoid**: 
  - No large text paragraphs.
  - No generic feature cards.
  - No emojis.
  - No gradients everywhere (use them very sparingly for accents).
  - No loud or harsh colors.
  - No excessive borders.
  - No overused glassmorphism.
- **Icons**: Use ONLY `hugeicons` (`@hugeicons/react` or `@hugeicons/core-free-icons`). Do NOT use Lucide or other icon libraries.
- **Typography Strategy**: Use a strict 2-font system (Geist Sans as default, Geist Mono for accents). 
  - **Sans-Serif (Geist Sans)**: Use `font-sans` for 90% of the site (paragraphs, UI elements). For large headings (H1/H2/H3), use `font-sans font-bold tracking-tighter`.
  - **Monospace (Geist Mono)**: Use `font-mono` STRICTLY for:
    - Code blocks and terminals.
    - "Eyebrow" subheadings.
    - Small badges/tags.
    - Numbers, stats, and data (use `font-mono tabular-nums`).
- **Punctuation**: Never use em-dashes (`—`). Use commas, periods, or layout spacing instead.
- **Form Controls for Small Sets**: When presenting binary or very small sets of options (e.g., Status, Modes, Types), prefer `RadioGroup` over `Select`. It reduces clicks and makes options immediately visible.
- **Visual Alignment & Theming**:
  - Use **CSS Grid** to perfectly align sequential labels and values rather than relying on flex margins or padding.
  - Rely exclusively on theme variables for colored highlights rather than hardcoding generic tailwind colors.
  - **Theme Adaptability**: Always use shadcn primitive components and tailwind theme variables (e.g., bg-background, text-foreground, border-border) instead of hardcoding hex colors. The UI must seamlessly support both light and dark modes natively without overriding globals.css variables.

# UI testing

A green test suite tells you nothing about whether the screen looks right.

- Screenshot every screen you touch, at least once, and look at it before you say it's done.
- Check dark mode.
- Look specifically for: clipped or truncated text, overlapping views, content under the safe area, missing empty state, missing loading state.

# Loading States

- **No ellipsis**. Never use `...` or `…` to indicate loading anywhere in the UI. Not in buttons, not in labels, not in placeholders. This is a hard rule.
- **No text changes**. A button's label must not change between idle and loading (no "Save" → "Saving...").
- **Spinner only**. Show a `Loading03Icon` with `animate-spin` in place of the button's icon. If the button is icon-only, swap the icon. If it has text + icon, swap only the icon.
- **Preserve size**. Use `min-w-[…]` or equivalent so the button does not resize during loading.
- **Disable while loading**. Always set `disabled` to prevent double-clicks.

# Destructive Actions

- **No confirmation dialogs**. Do not show "Are you sure?" modals for revoke/delete. Trigger the action immediately.
- **Toast feedback only**. Wrap the server action in `toast.promise` with short loading/success/error messages using the entity name (e.g., `Revoking {name}…` / `{name} revoked`).
