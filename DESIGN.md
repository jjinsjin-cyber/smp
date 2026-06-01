# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-06-01
- Primary product surfaces: `index.html`, `qr.html`
- Evidence reviewed: `index.html`, `style.css`, `script.js`, `qr.html`, `README.md`
- External reference: [VoltAgent NVIDIA inspired DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/nvidia/DESIGN.md)

## Brand
- Personality: Engineering-grade, precise, factual, and confident.
- Trust signals: Clear calculation inputs, visible result breakdowns, restrained color use, and dense but readable information hierarchy.
- Avoid: Neon gradients, glass effects, atmospheric backgrounds, soft shadows, pill-shaped chrome, and multiple competing accent colors.

## Product goals
- Goals: Let users calculate distributed-generation compensation, understand each contributing index, compare price components, and run a capital-region sensitivity scenario.
- Non-goals: Marketing-heavy storytelling, decorative data visualization, or complex navigation.
- Success signals: Users can complete the simulation quickly and identify the final price, total compensation, and optimization delta without explanation.

## Personas and jobs
- Primary personas: Energy engineering students, researchers, and grid-planning reviewers.
- User jobs: Enter grid conditions, calculate compensation, inspect contributing values, and share the deployed simulator with a QR code.
- Key contexts of use: Desktop presentation, classroom demonstration, and mobile QR access.

## Information architecture
- Primary navigation: Single-page simulator with a footer link to `qr.html`.
- Core routes/screens: `/index.html`, `/qr.html`.
- Content hierarchy: Black hero chapter, white simulation workspace, sensitivity analysis panel, black footer.

## Design principles
- Principle 1: Use a single accent token, `#76b900`, for actions, active values, focus rings, and the card corner square.
- Principle 2: Build depth with black/white surface contrast and 1px rules, never with gradients or card shadows.
- Tradeoffs: The interface favors technical clarity and angular density over the softer neon dashboard style previously used.

## Visual language
- Color: `#000000` frame, `#ffffff` canvas, `#f7f7f7` soft surface, `#cccccc` rules, `#76b900` primary accent, `#5a8d00` pressed accent, `#e52020` errors.
- Typography: Inter-like system sans stack with Arial fallback; weight and size carry hierarchy.
- Spacing/layout rhythm: 8px base unit, 24px card padding, 64px desktop section rhythm.
- Shape/radius/elevation: 2px radius on cards and controls; no card shadows.
- Motion: Short opacity and translate transitions only for calculated results.
- Imagery/iconography: No required imagery. A 12px green corner square is the signature ornament.

## Components
- Existing components to reuse: Form fieldsets, metric cards, grade card, total card, bar chart, comparison cards, QR form.
- New/changed components: NVIDIA-inspired surface tokens, angular buttons, card corner squares, green bar fills, dark footer frame.
- Variants and states: Primary button, outline secondary button, focus border, error text, result flash.
- Token/component ownership: `style.css` owns the design tokens and visual component rules.

## Accessibility
- Target standard: WCAG AA-oriented contrast and keyboard usability.
- Keyboard/focus behavior: Inputs and buttons retain visible green focus rings.
- Contrast/readability: Black text on white surfaces and white text on black surfaces; green is not the sole carrier of numeric meaning.
- Screen-reader semantics: Preserve existing headings, fieldsets, labels, alert regions, and aria labels.
- Reduced motion and sensory considerations: Disable result animation when `prefers-reduced-motion: reduce`.

## Responsive behavior
- Supported breakpoints/devices: Desktop, tablet below `960px`, and mobile below `620px`.
- Layout adaptations: Two-column simulator collapses to one column; input grids collapse to one column on mobile; metrics remain two-up where space allows.
- Touch/hover differences: Buttons and inputs maintain at least 44px practical target height; hover is additive and not required.

## Interaction states
- Loading: Not required; calculation is synchronous.
- Empty: Default example values render an initial result.
- Error: Inline red validation message below the action row.
- Success: Updated result values and a restrained result-panel flash.
- Disabled: Not currently required.
- Offline/slow network, if applicable: Main simulator works offline after load; QR generation page needs the QRCode.js CDN.

## Content voice
- Tone: Technical, concise, and explanatory.
- Terminology: Use SMP, GCS, IAS, MAPE, final price, and total compensation consistently.
- Microcopy rules: Prefer direct action labels and visible engineering units.

## Implementation constraints
- Framework/styling system: Static HTML, CSS, and vanilla JavaScript only.
- Design-token constraints: Keep one chrome accent, `#76b900`; reserve blue for prose links only if added later.
- Performance constraints: No heavy visual libraries; preserve the pure CSS bar chart.
- Compatibility constraints: GitHub Pages relative paths only.
- Test/screenshot expectations: Verify desktop and mobile layouts, simulator calculation, sensitivity analysis, QR creation, and console errors after visual changes.

## Open questions
- [ ] Decide whether a future presentation version needs a grid or hardware-inspired hero illustration.
- [ ] Decide whether the generated QR PNG should be committed to the repository.
