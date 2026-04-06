# UI/UX Review

Apply professional UI/UX standards to the current task. Review the code or component referenced in $ARGUMENTS (or the most recently discussed code if no argument is given) against the rules below. Flag violations, suggest fixes, and apply them if it is safe to do so.

---

## When to apply

Use these rules whenever a task affects how something **looks, feels, moves, or is interacted with**. Skip for pure backend, API, database, infrastructure, or non-visual scripting work.

---

## Priority order

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Accessibility | CRITICAL |
| 2 | Touch & Interaction | CRITICAL |
| 3 | Performance | HIGH |
| 4 | Style consistency | HIGH |
| 5 | Layout & Responsive | HIGH |
| 6 | Typography & Color | MEDIUM |
| 7 | Animation | MEDIUM |
| 8 | Forms & Feedback | MEDIUM |
| 9 | Navigation patterns | HIGH |
| 10 | Charts & Data | LOW |

---

## 1. Accessibility (CRITICAL)

- Contrast: primary text ≥4.5:1, large text ≥3:1; verify light and dark modes separately
- Visible focus rings on all interactive elements (2–4px outline)
- Descriptive alt text on meaningful images; empty alt="" on decorative images
- aria-label on icon-only buttons; accessibilityLabel in native
- Tab order matches visual order; full keyboard support
- `<label for>` on every form input; never placeholder-only
- Skip-to-main-content link for keyboard users
- Sequential heading hierarchy (h1→h6, no skipping)
- Never convey information by color alone — add icon or text
- Support system text scaling (Dynamic Type / Material type roles); avoid truncation as text grows
- Respect `prefers-reduced-motion`; reduce or disable animations when requested
- Meaningful reading order for VoiceOver/screen readers
- Provide cancel/back in modals and multi-step flows
- Preserve system and a11y keyboard shortcuts

## 2. Touch & Interaction (CRITICAL)

- Minimum touch target: 44×44pt (Apple) / 48×48dp (Material); extend hit area beyond visual bounds if needed
- Minimum 8px gap between touch targets
- Primary interactions on click/tap; never rely on hover alone
- Disable button during async operations; show spinner or progress indicator
- Clear error messages near the problem field
- Add `cursor-pointer` to clickable non-button elements
- Avoid horizontal swipe conflicts with main scroll
- Use `touch-action: manipulation` to eliminate 300ms tap delay (web)
- Use platform-standard gestures; do not redefine swipe-back or pinch-zoom
- Never block system gestures (Control Center, back swipe, gesture bar)
- Visual press feedback within 100ms (ripple / highlight / scale)
- Haptic feedback for confirmations; avoid overuse
- Never require gesture-only for critical actions — provide visible controls
- Keep primary targets away from notch, Dynamic Island, and screen edges
- Swipe actions must show a clear affordance or hint
- Use a movement threshold before starting drag to prevent accidental drags

## 3. Performance (HIGH)

- Images: WebP/AVIF, responsive srcset/sizes, lazy-load non-hero assets
- Declare width/height or aspect-ratio on images to prevent CLS
- `font-display: swap` or `optional`; preload only critical font variants
- Inline or early-load critical above-the-fold CSS
- Code-split by route/feature (React Suspense / Next.js dynamic import)
- Load third-party scripts async/defer; audit and remove unnecessary ones
- Avoid frequent layout reads/writes; batch DOM reads then writes
- Reserve space for async content to prevent layout jumps (CLS < 0.1)
- `loading="lazy"` on below-the-fold images and heavy media
- Virtualize lists with 50+ items
- Keep per-frame work under ~16ms for 60fps; move heavy tasks off main thread
- Skeleton or progress indicator when loading exceeds 300ms
- Keep input latency under ~100ms; provide visual tap feedback within 100ms
- Debounce/throttle high-frequency events (scroll, resize, input)
- Provide offline state messaging and graceful network degradation

## 4. Style consistency (HIGH)

- Match visual style to product type; maintain that style across all pages
- Use SVG icon libraries (Heroicons, Lucide, Phosphor) — never emojis for structural UI elements
- Choose color palette from product/industry context
- Shadows, blur, and border-radius must align with the chosen style (glassmorphism / flat / clay etc.)
- Respect platform idioms (iOS HIG vs Material): navigation, controls, typography, motion
- Hover/pressed/disabled states visually distinct but on-style
- Consistent elevation/shadow scale for cards, sheets, modals — no random shadow values
- Design light and dark variants together to keep brand and contrast consistent
- Use one icon family (consistent stroke width and corner radius) throughout
- Prefer native/system controls; customize only when branding requires it
- Blur conveys background dismissal (modals, sheets) — not decoration
- Each screen has one primary CTA; secondary actions visually subordinate

## 5. Layout & Responsive (HIGH)

- `<meta name="viewport" content="width=device-width, initial-scale=1">` — never disable user zoom
- Design mobile-first; scale up to tablet and desktop
- Systematic breakpoints: 375 / 768 / 1024 / 1440
- Body text minimum 16px on mobile (prevents iOS auto-zoom)
- Body line length: 35–60 chars mobile, 60–75 chars desktop
- No horizontal scroll on mobile
- 4pt/8dp incremental spacing system
- Consistent `max-w-6xl` / `max-w-7xl` on desktop
- Defined z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- Fixed navbar/bottom bar must add padding offset to underlying content
- Avoid nested scroll regions that conflict with the main scroll
- Use `min-h-dvh` instead of `100vh` on mobile
- Keep layout usable in landscape mode
- Show core content first on mobile; fold or hide secondary content
- Establish visual hierarchy via size, spacing, and contrast — not color alone

## 6. Typography & Color (MEDIUM)

- Body line-height 1.5–1.75
- Body line length 65–75 characters
- Pair heading and body fonts with matching personalities
- Consistent type scale: 12 / 14 / 16 / 18 / 24 / 32
- Dark text on light backgrounds; meet 4.5:1 (AA) or 7:1 (AAA)
- Use platform type roles: iOS Dynamic Type / Material 5 (display, headline, title, body, label)
- Font weight hierarchy: headings 600–700, body 400, labels 500
- Define semantic color tokens (primary, secondary, error, surface, on-surface); no raw hex in components
- Dark mode: desaturated/lighter tonal variants, not color inversion; verify contrast separately
- Functional colors (error red, success green) must include icon or text — not color meaning alone
- Prefer text wrapping over truncation; when truncating use ellipsis + tooltip/expand
- Respect platform default letter-spacing; avoid tight tracking on body text
- Use tabular/monospaced figures for prices, data columns, and timers
- Use whitespace intentionally to group related items and separate sections

## 7. Animation (MEDIUM)

- Duration: 150–300ms for micro-interactions; complex transitions ≤400ms; never >500ms
- Animate only `transform` and `opacity`; never animate width/height/top/left
- Skeleton or progress indicator when loading exceeds 300ms
- Animate 1–2 key elements per view maximum
- Easing: ease-out for entering, ease-in for exiting; no linear easing on UI transitions
- Every animation must express cause-and-effect; remove purely decorative motion
- State changes (hover, active, expanded, modal) animate smoothly — no snapping
- Page transitions maintain spatial continuity (directional slide, shared element)
- Use parallax sparingly; must respect reduced-motion
- Prefer spring/physics-based curves for natural feel
- Exit animations ~60–70% of enter duration to feel responsive
- Stagger list/grid item entrances by 30–50ms per item
- Use shared-element / hero transitions for visual continuity between screens
- Animations must be interruptible by user tap or gesture
- Never block user input during an animation
- Use crossfade for content replacement within the same container
- Subtle press scale (0.95–1.05) on tappable cards and buttons
- Drag/swipe/pinch must provide real-time visual response tracking the finger
- Unify duration/easing tokens globally so all animations share the same rhythm
- Fading elements: never linger below opacity 0.2 — fade fully or remain visible
- Modals/sheets animate from their trigger source for spatial context
- Forward navigation: animate left/up; back: animate right/down
- Animations must not cause layout reflow or CLS; use transform for position changes

## 8. Forms & Feedback (MEDIUM)

- Visible label on every input; never placeholder-only labels
- Error messages appear directly below the related field
- Submit button shows loading state then success/error
- Mark required fields (asterisk + legend)
- Meaningful empty states with a suggested next action
- Auto-dismiss toasts in 3–5 seconds
- Confirm before destructive actions
- Persistent helper text below complex inputs
- Disabled elements: opacity 0.38–0.5 + cursor change + `disabled` attribute
- Progressive disclosure — don't overwhelm users upfront
- Validate on blur (not on every keystroke); show error only after user finishes
- Use semantic input types (`email`, `tel`, `number`) to trigger correct mobile keyboard
- Show/hide toggle on password fields
- `autocomplete` / `textContentType` for system autofill
- Offer undo for destructive or bulk actions ("Undo delete" toast)
- Confirm completed actions with brief visual feedback (checkmark, toast, color flash)
- Error messages state cause + how to fix — never just "Invalid input"
- Multi-step flows show step indicator or progress bar; allow back navigation
- Long forms auto-save drafts to prevent data loss on accidental dismissal
- Confirm before dismissing a sheet/modal with unsaved changes
- Group related fields logically (fieldset/legend or visual grouping)
- After submit error, auto-focus the first invalid field
- For multiple errors, show summary at top with anchor links to each field
- Mobile input height ≥44px
- Destructive actions use danger color (red) and are visually separated from primary actions
- Toasts: `aria-live="polite"` — must not steal focus
- Form errors use `aria-live` region or `role="alert"` for screen reader announcement
- Error and success state colors must meet 4.5:1 contrast
- Request timeout must show clear feedback with retry option

## 9. Navigation patterns (HIGH)

- Bottom navigation: maximum 5 items; icons + text labels always
- Drawer/sidebar for secondary navigation — not primary actions
- Back navigation must be predictable and preserve scroll/state
- All key screens reachable via deep link / URL
- iOS: bottom Tab Bar for top-level navigation
- Android: Top App Bar with navigation icon
- Current location visually highlighted (color, weight, indicator)
- Primary nav (tabs/bottom bar) clearly separated from secondary nav (drawer/settings)
- Modals and sheets offer clear close/dismiss affordance; swipe-down to dismiss on mobile
- Search easily reachable from top bar or tab; show recent/suggested queries
- Web: breadcrumbs for 3+ level deep hierarchies
- Navigating back restores previous scroll position, filter state, and input
- Support system gesture navigation (iOS swipe-back, Android predictive back)
- Nav badges used sparingly; clear after user visits
- Overflow/more menu when actions exceed available space
- Bottom nav is for top-level screens only — never nest sub-navigation inside it
- Large screens (≥1024px): sidebar preferred; small screens: bottom/top nav
- Never silently reset the navigation stack or jump to home unexpectedly
- Navigation placement consistent across all pages
- Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- Modals must not be used for primary navigation flows
- After page transition, move focus to main content region for screen reader users
- Core navigation must remain reachable from deep pages
- Dangerous actions (delete account, logout) visually and spatially separated from normal nav
- When a nav destination is unavailable, explain why instead of silently hiding it

## 10. Charts & Data (LOW)

- Match chart type to data: trend → line, comparison → bar, proportion → pie/donut (≤5 categories)
- Use accessible color palettes; never red/green alone for colorblind users
- Provide a table alternative for screen readers; charts alone are not accessible
- Supplement color with patterns, textures, or shapes
- Always show legend; position it near the chart
- Tooltips/data labels on hover (web) or tap (mobile) with exact values
- Label axes with units; avoid truncated or rotated labels on mobile
- Charts must reflow or simplify on small screens
- Meaningful empty state when no data exists — not a blank chart
- Skeleton or shimmer while chart data loads
- Chart entrance animations respect `prefers-reduced-motion`
- For 1000+ data points, aggregate or sample; offer drill-down for detail
- Locale-aware number, date, and currency formatting on axes and labels
- Interactive chart elements (points, segments) ≥44pt tap area
- Avoid pie/donut for >5 categories; switch to bar chart
- Data lines/bars vs background ≥3:1; data text labels ≥4.5:1
- Legends should be clickable to toggle series visibility
- For small datasets, label values directly on the chart
- Tooltip content must be keyboard-reachable (not hover-only)
- Data tables support sorting with `aria-sort` indicating current sort state
- Axis ticks: readable spacing; auto-skip on small screens
- Limit information density per chart; split into multiple charts if needed
- Emphasize data trends over decoration; avoid heavy gradients/shadows
- Grid lines: low-contrast (e.g. gray-200) so they don't compete with data
- Interactive chart elements must be keyboard-navigable
- Provide a text summary or `aria-label` describing the chart's key insight
- Data load failure: show error message with retry, not a blank/broken chart
- For data-heavy products, offer CSV/image export
- Drill-down interactions maintain a clear back-path and breadcrumb
- Time series charts clearly label granularity (day/week/month) and allow switching
