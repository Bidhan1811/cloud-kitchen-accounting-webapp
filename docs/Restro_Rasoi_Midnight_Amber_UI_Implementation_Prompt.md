# Restro Rasoi — "Midnight Amber" Theme

### Design-only implementation prompt (no data/logic changes)

## Scope & ground rules

Add a second theme, selectable from the existing Settings page alongside the
current light "glass" theme. This is a **pure visual/layout layer**:

- Do NOT touch data fetching, hooks, API calls, routing, or any existing component's props/business logic.
- The current app already threads CSS custom properties through every component (`var(--glass-input)`, `var(--glass-border)`, `var(--text-primary)`, `var(--accent)`, `.glass-card`, `.btn-icon`, etc.). This theme should be a **second value-set for those same tokens**, switched via a `data-theme` attribute (or equivalent) on the root element — so existing components restyle automatically without their JSX changing.
- Everything below marked **[NEW COMPONENT]** does not exist in the current UI yet. Build these as new, self-contained, purely presentational components (accept props for the data they display; do not fetch or compute anything). Wiring them to real data is a separate, later task.

---

## 1. Color tokens

| Token Value Used for  |                             |                                                  |
| --------------------- | --------------------------- | ------------------------------------------------ |
| `--bg`                | `#16110D`                   | Page background                                  |
| `--bg-sidebar`        | `#120D0A`                   | Sidebar (slightly darker than page)              |
| `--surface`           | `#221A14`                   | Card/panel background                            |
| `--surface-raised`    | `#2A2119`                   | Hover/raised surface (table row hover, dropdown) |
| `--border`            | `rgba(232, 194, 138, 0.10)` | Card borders, dividers                           |
| `--border-strong`     | `rgba(232, 194, 138, 0.18)` | Active/focused borders                           |
| `--accent`            | `#D9964A`                   | Primary amber/gold accent                        |
| `--accent-strong`     | `#E8B366`                   | Accent hover / gradient top                      |
| `--accent-tint`       | `rgba(217, 150, 74, 0.14)`  | Active nav pill, badge backgrounds               |
| `--text-primary`      | `#F3E9DC`                   | Headings, primary values                         |
| `--text-secondary`    | `#A99783`                   | Labels, muted text                               |
| `--text-tertiary`     | `#726255`                   | Placeholder, disabled                            |
| `--success`           | `#5FBE84`                   | Positive delta, Paid/Completed, credit           |
| `--success-tint`      | `rgba(95, 190, 132, 0.14)`  | Success badge background                         |
| `--danger`            | `#E2776C`                   | Negative delta, debit, Cancelled                 |
| `--danger-tint`       | `rgba(226, 119, 108, 0.14)` | Danger badge background                          |
| `--warning`           | `#E0A050`                   | Pending/Partial state                            |
| `--warning-tint`      | `rgba(224, 160, 80, 0.14)`  | Warning badge background                         |

Card corner radius: `18px`. Buttons/inputs: `12px`. Avatars/icon circles: full.

---

## 2. Shell layout

### Sidebar (fixed left, \~232px)

- Background `--bg-sidebar`, no border (page background handles the seam via a 1px `--border` line on its right edge).
- Top: small rounded-square icon mark (chef-hat/plate glyph) in a `--accent`-tinted circle, next to the "Restro Rasoi" wordmark in `--text-primary`, semibold.
- Nav list below, \~16px gap from header: icon + label per item (Dashboard, Sales, Expenses, Customers, Ledgers, Products, Reports, Menu). 
  - **Active item**: full-width rounded pill (`--accent-tint` background), icon and label both in `--accent`.
  - **Inactive item**: icon+label in `--text-secondary`, no background; hover → `--surface-raised` background.
- Settings pinned to the bottom, separated by a `--border` divider above it.

### Topbar

Two patterns, used depending on page depth:

- **Top-level pages** (Dashboard, Sales, Expenses...): page title (`--text-primary`, large) + a contextual subtitle/greeting (`--text-secondary`, e.g. "Good evening, Bidhan 👋" or "Track and manage your daily orders") on the left. Right side: a date pill, notification bell (with a small accent dot if unread), and avatar+chevron.
- **Nested detail pages** (e.g. a customer's ledger): a breadcrumb row above the title (`Ledgers  >  Customer Ledger`, `--text-tertiary` with `--text- secondary` on the current crumb), then the page's real heading below it (e.g. the customer's name), with page-specific actions top-right.

---

## 3. Dashboard page

### Stat card row (4 cards, equal width)

Each card: label (`--text-secondary`, small, uppercase-ish tracking), big
value (`--text-primary`, bold, large), and a delta line below in `--success`
or `--danger` with an up/down arrow glyph (e.g. "↑ 12.5% from yesterday").
Optional small chevron top-right suggesting the card is tappable.
Cards: **Total Sales**, **Total Expenses**, **Net Profit**, **Outstanding**.

### Sales Overview card

Line/area chart, `--accent` line with a soft gradient fill fading to
transparent toward the bottom. A small pill toggle top-right: **Daily /
Weekly / Monthly**, active state styled like the accent-tint pill pattern
above. A floating callout bubble on the most recent/peak data point showing
its value (dark rounded tooltip, `--accent` border). Y-axis in currency,
X-axis in dates, both `--text-tertiary`.

### Top Selling Items card

Ranked list (1–5): rank number, item name (`--text-primary`), revenue amount
right-aligned (`--text-primary`, mono/tabular). "View All Items →" link at
the bottom in `--accent`.

### **[NEW COMPONENT] Recent Transactions card**

Compact list of the most recent orders: order identifier, relative
date+time (`--text-tertiary`), amount (`--text-primary`, bold), and a small
payment-mode tag (UPI/Cash/etc., `--text-secondary`). "View All →" link at
the bottom in `--accent`. Props: `transactions: { id, date, amount, paymentMode }[]`.

### **[NEW COMPONENT] Pending Payments card**

List of customers with outstanding balances: small avatar/initials circle,
customer name (`--text-primary`), amount due (`--danger`, bold,
right-aligned), and "X days ago" (`--text-tertiary`) beneath the name.
"View All →" link at the bottom. Props: `pending: { customerId, name, amountDue, daysAgo }[]`.

### **[NEW COMPONENT] Payment Methods card**

A donut/ring chart centered in the card: total amount in the middle
(`--text-primary`, bold) with a small "Total" label beneath it
(`--text-tertiary`). Below the chart, a legend row per payment method: a
colored dot, the method name, and its percentage — right-aligned.
Suggested per-method colors: UPI → `--accent`, Cash → `--success`, Card →
`--warning` (or any 3 visually distinct tones drawn from the palette above).
Props: `breakdown: { method, amount, percentage }[]`.

---

## 4. Sales page

- Stat row (4 cards, same visual pattern as Dashboard's): **Total Sales**, **Total Orders**, **Average Order Value**, **Total Items Sold** — each with its own delta line.
- Filter row: tab pills (**All Orders / Completed / Pending / Cancelled**, same active-pill styling as sidebar nav) on the left, search input on the right (dark input, `--surface`, `--accent`-colored focus ring).
- Table columns: Order ID, Time, Customer, Items, Amount, Payment, Status. Status rendered as a small rounded pill: Completed → `--success-tint`/ `--success` text, Pending → `--warning-tint`/`--warning`, Cancelled → `--danger-tint`/`--danger`.

## 5. Expenses page

Same structural pattern as Sales, adapted:

- Stat row: **Total Expenses**, **Today's Expenses**, **This Week**, **This Month**.
- Filter row: tab pills (**All Expenses / Today / This Week / This Month**) 
  - search.
- Table columns: Date, Category, Description, Amount, Payment Method.

### **[NEW COMPONENT] Add Expense side panel**

A right-side slide-in panel (not a bottom sheet — this is the desktop/wide
pattern). Header: back-arrow, "Add Expense" title, close (×) top-right.
Fields, each dark-styled (label above, `--surface` input, `--border` outline,
`--accent-strong` focus ring): Date (date picker), Category (dropdown),
Description (text), Amount (numeric, `₹` prefix), Payment Method (dropdown),
Notes (optional textarea). Full-width primary button pinned to the bottom:
**Save Expense**, solid `--accent` background, `--bg` (dark) text for
contrast.

---

## 6. Customer Ledger detail page

Breadcrumb: `Ledgers > Customer Ledger`. Below it, a header row: customer
name (large, `--text-primary`) with phone number beneath in `--text- secondary`; top-right, two actions — **Statement** (secondary/outlined
button) and **Add Payment** (primary, solid `--accent`).

### **[NEW COMPONENT] Ledger stat card row**

Four cards, same visual language as the Dashboard stat row but without
delta lines: **Total Due** (visually emphasized — `--danger` value color, or
a subtle `--accent` card border to distinguish it as the headline number),
**Total Sales**, **Total Payments**, **Last Payment** (amount + relative
date beneath, e.g. "10 May 2025"). Props: `dueAmount, totalSales, totalPayments, lastPayment: { amount, date }`.

### Tab toggle

**Ledger Entries / Summary** — simple two-tab underline or pill toggle above
the table, plus a period filter control top-right (e.g. "All Transactions"
dropdown + a date-range pill).

### Transaction table

Columns: Date, Type, Description, Debit (₹), Credit (₹), Balance (₹).

- Type column rendered as colored text/pill: **Sale** → `--accent`, **Payment** → `--success`.
- A bold **Total** row pinned at the bottom of the table (not scrolling with the rest), summing Debit/Credit/closing Balance.

---

## 7. Shared component restyle notes

- **Buttons**: primary = solid `--accent` background, `--bg` text, `12px` radius, subtle darker-on-press state. Secondary = transparent with `--border` outline, `--text-secondary` text, hover → `--surface-raised`.
- **Inputs/selects**: `--surface` background, `--border` outline at rest, `--accent-strong` outline + faint `--accent-tint` glow on focus.
- **Badges/status pills**: rounded-full, tinted background + matching saturated text color, per the success/warning/danger tokens above.
- **Tables**: header row in `--text-tertiary` uppercase small text, no heavy borders — rely on `--border` hairlines between rows, `--surface- raised` on row hover.
- **Charts**: line/area charts use `--accent` with a fading gradient fill; donut charts use the palette's success/accent/warning trio for segments; axis labels/gridlines in `--text-tertiary` at low opacity.

---


## 7. Mobile UI / Responsive Reference

The dark theme must have a **purpose-built mobile layout**, matching the mobile references shown in the supplied UI reference image. Do not simply shrink the desktop dashboard or make the desktop sidebar disappear — restructure the interface for touch, narrow screens, and vertical scrolling while preserving the same Midnight Amber visual language.

### 7.1 Mobile shell

- On mobile, replace the fixed desktop sidebar with a compact top header and a fixed bottom navigation.
- The mobile header should contain:
  - compact Restro Rasoi branding/logo,
  - notification icon where appropriate,
  - page-specific back arrow on nested pages,
  - optional date/filter control when relevant.
- Use the same `--bg`, `--surface`, `--border`, `--accent`, `--text-primary`, `--text-secondary`, and semantic tokens from the desktop theme.
- Keep the background dark and warm; do not introduce a separate mobile color palette.
- Main content should have comfortable horizontal padding, approximately `16px`, and enough bottom padding so the fixed navigation never covers content.
- Bottom navigation should be a dark glass/elevated surface with a subtle top border and soft shadow.
- The reference uses four primary destinations: **Dashboard, Sales, Expenses, More**. Put secondary destinations such as Customers, Ledgers, Products, Reports, and Settings inside **More** rather than overcrowding the bottom bar.
- Active bottom-navigation item uses `--accent` icon/text and a very subtle `--accent-tint` treatment; inactive items use `--text-secondary`.

### 7.2 Mobile Dashboard reference

The mobile Dashboard should follow the reference composition:

1. Compact greeting/header:
   - "Good evening, Bidhan 👋"
   - date selector below/near the greeting.
2. Two-column KPI grid:
   - Total Sales
   - Total Expenses
   - Net Profit
   - Outstanding
3. Sales Overview card:
   - full available width,
   - compact line/area chart,
   - Daily / Weekly / Monthly selector adapted to mobile,
   - latest-value callout.
4. Recent/pending information should be presented as compact lists rather than forcing the desktop multi-card layout.
5. Payment Methods should remain available below the primary dashboard information, using a compact donut/ring visualization.
6. Keep the visual hierarchy strong: KPIs → sales trend → operational lists.
7. Avoid placing four desktop-sized cards side-by-side on a phone.

KPI cards on mobile may use a 2-column grid. Each card should have enough internal padding for the value and delta to remain readable without wrapping awkwardly.

### 7.3 Mobile Sales reference

The Sales mobile screen should follow the reference pattern:

- Page title: **Sales**
- Compact date/filter control in the header.
- KPI cards arranged in a 2-column grid:
  - Total Sales
  - Total Orders
  - Average Order Value
  - Total Items Sold
- Filter tabs should become horizontally scrollable if they cannot fit:
  - All
  - Completed
  - Pending
  - Cancelled
- Search/filter controls should remain compact.
- Replace the wide desktop table with vertically stacked order rows/cards.
- Each order row should expose the most important information first:
  - Order ID
  - Customer
  - Time
  - Amount
  - Payment method
  - Status
- Status remains a subtle semantic badge using the existing success/warning/danger tokens.
- Preserve the same dark glass card surfaces and thin warm borders.

### 7.4 Mobile Customer Ledger reference

The mobile Ledger screen should prioritize the customer's identity and financial summary.

Header:

- back navigation,
- customer name,
- phone number,
- optional overflow/actions menu.

Summary:

- Total Due
- Total Sales
- Total Payments

Use a compact 2-column card arrangement where appropriate rather than the four-card desktop row.

Then show:

- Ledger Entries / Summary tabs
- compact transaction/date filter
- transaction list

On narrow screens, convert the desktop ledger table into readable transaction cards/list rows. Each transaction should clearly expose:

```text
Sale / Payment
Order #1256 or payment description
Date / time

Debit / Credit
Balance
```

Do not force six desktop columns into a narrow viewport.

The **Total Due** value should remain the strongest visual number, using `--danger` or the existing emphasized-accent treatment.

### 7.5 Mobile Expenses reference

The Expenses mobile screen should follow the same responsive pattern as Sales:

- Page title and compact action/filter controls.
- 2-column KPI grid:
  - Total Expenses
  - Today's Expenses
  - This Week
  - This Month
- Horizontally scrollable filter tabs:
  - All Expenses
  - Today
  - This Week
  - This Month
- Search/filter control.
- Replace the wide desktop expense table with vertically stacked expense rows/cards.

Each expense row should prioritize:

- Date
- Category
- Description
- Amount
- Payment method

Keep the amount visually prominent while secondary metadata uses `--text-secondary` / `--text-tertiary`.

### 7.6 Mobile Add Expense reference

The Add Expense screen/panel should become a **full-screen mobile form**, rather than using the desktop right-side slide-in panel.

Reference structure:

- top-left back arrow,
- centered/left-aligned **Add Expense** title,
- close/action icon where appropriate,
- vertically stacked fields:
  - Date
  - Category
  - Description
  - Amount
  - Payment Method
  - Notes
- full-width **Save Expense** button near the bottom.

Inputs should use the same dark `--surface` treatment, subtle `--border`, and warm `--accent-strong` focus state.

The form should be comfortably scrollable on smaller phones. Do not pin the submit button in a way that hides fields behind the keyboard; use a safe-area-aware bottom action area where appropriate.

### 7.7 Mobile spacing and touch behavior

- Minimum practical touch target: approximately `44px`.
- Use approximately `12–16px` spacing between interactive controls.
- Keep cards at approximately `14–18px` radius.
- Avoid dense desktop-style tables and tiny text.
- Primary actions should remain easy to reach with one hand.
- Use safe-area padding for devices with gesture/navigation areas.
- Respect keyboard viewport changes when forms are open.
- Horizontal scrolling is acceptable for filter tabs, but avoid horizontal scrolling for the main page content.
- Never allow text, buttons, or important financial values to be clipped.

### 7.8 Mobile animations

Use the same restrained animation language as desktop:

- page entry: subtle fade + `translateY(6px)` over `200–300ms`;
- card interaction: slight surface/border change;
- bottom-navigation selection: subtle color/background transition;
- mobile panels/forms: gentle fade/slide transition;
- button press: approximately `scale(0.98)`.

Avoid large slide animations, bouncing elements, persistent glow effects, or animated decorative backgrounds.

Respect `prefers-reduced-motion`.

### 7.9 Responsive breakpoint behavior

The exact breakpoints should follow the project's existing responsive system, but the intended behavior is:

**Desktop**
- fixed sidebar,
- multi-column dashboard,
- wide tables,
- right-side Add Expense panel.

**Tablet**
- adaptive grid,
- reduced content density,
- tables may become horizontally scrollable where necessary,
- preserve desktop navigation where space permits.

**Mobile**
- no desktop sidebar,
- compact top header,
- fixed bottom navigation,
- 1–2 column cards,
- stacked lists/cards instead of wide tables,
- full-screen Add Expense form.

The mobile reference should be treated as a **layout and interaction reference**, not as a reason to change application data, routes, hooks, API calls, or business logic.

### 7.10 Theme-selection requirement on mobile

The mobile layouts must use the Midnight Amber styling **only when the user has selected the dark theme**.

When the light/current theme is selected:

- retain the existing light glass styling,
- retain the existing light-theme colors,
- retain existing component behavior.

Do not create separate DarkDashboardMobile / LightDashboardMobile implementations. Use the same responsive components and switch only the underlying theme tokens.


## 8. Deliverable

A second theme (e.g. `data-theme="midnight-amber"`) applying the token table
in §1, restyling the existing shell/sidebar/topbar per §2, and the five new
presentational components marked **[NEW COMPONENT]** above (Recent
Transactions, Pending Payments, Payment Methods donut, Add Expense panel,
Ledger stat card row) built as standalone, prop-driven components ready to
be dropped into their respective pages and wired to real data in a
follow-up pass.