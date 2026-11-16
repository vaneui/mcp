# CLAUDE.md

## Project Overview

VaneUI (`@vaneui/ui`, v1.5.0) is a React component library with 40+ customizable React components (50+ named exports including sub-components). Built with TypeScript, React 19, Tailwind CSS v4, and Rollup. Uses a boolean props API (`<Button primary lg filled>`) and CSS variable-based theming via `ThemeProvider`.

## Component Inventory

| Category | Components | `data-vane-type` |
|----------|-----------|-----------------|
| **Interactive** | Button, IconButton, Badge, Chip, Code, Kbd, Mark, Icon, Spinner, Progress | `ui` |
| **Form** | Input, Textarea, Select, Checkbox, Radio (+ RadioGroup), Switch, Label, Field | `ui` (Field is `layout`) |
| **Overlay / Floating** | Overlay, Modal (+ Header/Body/Footer), Popup, Tooltip | `layout` |
| **Menu / Nav** | Menu (+ Item/Label), NavLink, ModalCloseButton, PopupTrigger | `ui` |
| **Layout** | Card (+ Header/Body/Footer), Section, Container, Row, Col, Stack, Grid2–6, Divider, Img, Alert, Table (+ Thead/Tbody/Tfoot/Tr/Th/Td/Caption) | `layout` |
| **Typography** | Text, Title, SectionTitle, PageTitle, Link, List, ListItem, Blockquote | `ui` |

## Prop System (Boolean Flags)

Props are grouped into **mutually exclusive categories** — only one value per category is active:

| Category | Values |
|----------|--------|
| **size** | `xs`, `sm` (default for Button, IconButton, NavLink, MenuItem, MenuLabel, Tooltip, Label), `md` (default for others), `lg`, `xl` |
| **appearance** | `primary`, `accent`, `secondary`, `tertiary`, `success`, `danger`, `warning`, `info` |
| **variant** | `filled`, `outline` (default), `ghost` |
| **shape** | `pill`, `rounded` (default), `sharp` |
| **display** | `flex`, `inlineFlex`, `block`, `inline`, `grid`, etc. |
| **flexDirection** | `row`, `column`, `rowReverse`, `columnReverse` |
| **fontWeight** | `fontThin` through `fontBlack` |
| **textAlign** | `textLeft`, `textCenter`, `textRight`, `textJustify` |

Additional toggle props: `gap`/`noGap`, `padding`/`noPadding`, `shadow`/`noShadow` (`shadowXs`–`shadowXl` fix the size), `insetRing`/`noInsetRing`, `border`/`noBorder`, `underline`, `uppercase`, `italic`, `fontBold`, `fontSemibold`, `fontMono`, `transparent`, `responsiveSizing`, `sticky`, `flexWrap`, `itemsCenter`, `justifyBetween`, etc.

Layout extras: `divided` (Grid2–6: 1px lines instead of the gap), `strongBorder` (border in the appearance's strong color), `pointerEvents*` and `whitespace*` on layout components. NavLink takes `indicatorStart` (rail, accent mark when active or `aria-selected`) or `indicatorBottom` (tab bar).

**Breakpoints** (layout components): `mobileStack`, `tabletStack`, `desktopStack`
**Hide**: `mobileHide`, `tabletHide`, `desktopHide`; **Show** (only below the width): `mobileShow`, `tabletShow`, `desktopShow`
**Responsive width** (full width below the width): `mobileWFull`, `tabletWFull`, `desktopWFull`

## Key Defaults (Do NOT Redundantly Specify)

> **Source of truth:** each component's `src/components/ui/{component}/{component}Defaults.ts` (typography components mirror under `ui/typography/{component}/{component}Defaults.ts`). The table below is curated for the defaults that are most commonly forgotten — it drifts faster than the source. When in doubt, read the defaults file.

| Component | Defaults |
|-----------|----------|
| **Button** | sm, primary, outline, fontSemibold, rounded, padding, gap, insetRing, focusVisible, cursorPointer, transition (no `shadow`) |
| **Card** | md, primary, outline, rounded, border, padding, gap, flex, column |
| **Row** | md, row, flex, itemsCenter, gap, noPadding, noBorder, noInsetRing, outline, sharp |
| **Col** | md, column, flex, gap, noPadding, noBorder, noInsetRing, outline, sharp |
| **Stack** | md, flex, column, flexWrap, gap, padding, noBorder, noInsetRing, outline, sharp |
| **Badge** | md, secondary (neutral default; color via success/danger/…), outline, pill, fontSemibold |
| **Chip** | md, secondary (not primary!), outline, rounded, fontSans |
| **NavLink** | sm, primary, outline, rounded, noBorder, noShadow, noInsetRing, wFull, textLeft, focusVisible |
| **Progress** | md, primary, pill, transition, overflowHidden, wFull, noMargin (`value` required, `max` 100). Fill sub-theme `progress.fill`: filled, wFull, hFull |
| **Link** | md, underline, fontSans, cursorPointer, inheritSize, wFit, focusVisible (link color by default; no appearance or variant default) |
| **Input** | md, primary, outline, rounded, wFull, insetRing, focusVisible |
| **Icon** | md, inlineFlex, itemsCenter, justifyCenter, outline, rounded, noPadding, noBorder, noInsetRing, noShadow, noShrink, noTransition, wFit |
| **Checkbox** | md, primary, border, rounded, filled, focusVisible, cursorPointer |
| **Label** | sm, flex, column, itemsStart, gap, inheritAppearance, fontMedium (use `row` for inline controls like Checkbox) |
| **Modal** | md, wFull, flex, column, overflowAuto, relative, noPadding, gap, rounded, shadow, primary, outline |
| **Container** | md, wFull, flex, column, itemsCenter, gap, noPadding, outline, sharp |
| **Section** | md, wFull, flex, column, itemsStart, gap, padding, noBorder, noInsetRing, noShadow, outline, sharp, responsiveSizing |
| **Typography** (Text, Title, etc.) | md, inheritAppearance (not primary!), outline |
| **Layout** (Row, Col, Stack, Card, Grid*) | gap, md, outline |

## Exports

- `@vaneui/ui` — All components + ThemeProvider + useTheme + defaultTheme + types
- `@vaneui/ui/vars` — CSS variables (`vars.css`)
- `@vaneui/ui/css` — Pre-built component styles (`ui.css`)
