# Restro Rasoi — Frontend Design Specification
### Liquid-Glass UI System · Next.js · Mobile-First

---

## 0. Design Philosophy

The aesthetic is **warm liquid glass** — Apple's visionOS/iOS 26 glassmorphism applied to a
home kitchen context. Every surface appears to float slightly above the blurred background
photograph of a warm, minimal kitchen. Glass panels are not cold and clinical; they carry the
warmth of the background's cream, oak, and amber tones through their tint. The result feels
domestic and premium at the same time — like looking at an elegant recipe card held up to
sunlight.

The background image (the minimal cream kitchen photograph provided) is always present,
full-screen, fixed, and slightly blurred. All UI panels live *on top of* this layer. Nothing
is rendered on a flat white or dark background.

---

## 1. Token System

### 1.1 Color Palette

```
--bg-photo         : The kitchen photograph (always full-screen, fixed, z-index: 0)
--bg-blur-overlay  : rgba(255, 250, 242, 0.18)   /* very light warm tint over photo */

/* Glass surfaces */
--glass-base       : rgba(255, 252, 245, 0.55)   /* main panel glass */
--glass-sidebar    : rgba(255, 250, 240, 0.62)   /* sidebar — slightly more opaque */
--glass-card       : rgba(255, 253, 248, 0.60)   /* summary cards */
--glass-input      : rgba(255, 252, 246, 0.70)   /* form inputs — most opaque */
--glass-modal      : rgba(255, 251, 244, 0.72)   /* drawers and modals */
--glass-border     : rgba(255, 255, 255, 0.45)   /* border on all glass surfaces */
--glass-shadow     : rgba(180, 150, 100, 0.12)   /* warm drop shadow */

/* Accent — warm saffron-amber, derived from the kitchen's lighting */
--accent           : #C8873A   /* primary CTA, active nav, highlights */
--accent-light     : rgba(200, 135, 58, 0.15)    /* hover backgrounds, badge fills */
--accent-dark      : #A06828   /* pressed states */

/* Semantic */
--success          : #4C9A6E   /* Paid badge, active status */
--success-bg       : rgba(76, 154, 110, 0.14)
--danger           : #C0524A   /* Unpaid badge, delete */
--danger-bg        : rgba(192, 82, 74, 0.14)
--warning          : #B8862E   /* pending / outstanding */
--warning-bg       : rgba(184, 134, 46, 0.14)

/* Text */
--text-primary     : #1C1410   /* near-black with warm undertone */
--text-secondary   : #6B5D50   /* muted labels */
--text-tertiary    : #9E8E80   /* placeholders, captions */
--text-on-accent   : #FFFFFF
```

### 1.2 Typography

```
Display / Headings : "Playfair Display" (Google Fonts) — warm serif, used for page titles
                     and dashboard hero numbers only. Weight 600.
Body / UI          : "Inter" (Google Fonts) — clean, readable at small sizes for tables,
                     labels, and form fields. Weight 400 / 500 / 600.
Monospace / Amounts: "JetBrains Mono" (Google Fonts) — used exclusively for rupee amounts
                     (₹8,450) so numerals align perfectly in tables.
```

**Type Scale:**
```
--text-xs    : 11px / Inter 400  → table captions, timestamps
--text-sm    : 13px / Inter 400  → table rows, filter labels
--text-base  : 15px / Inter 400  → body, form fields
--text-md    : 17px / Inter 500  → card labels, nav items
--text-lg    : 20px / Inter 600  → section headings, modal titles
--text-xl    : 28px / Playfair 600 → page title ("Dashboard", "Sales")
--text-hero  : 36px / JetBrains Mono 600 → dashboard stat numbers (₹24,680)
```

### 1.3 Spacing & Radius

```
--space-1    : 4px
--space-2    : 8px
--space-3    : 12px
--space-4    : 16px
--space-5    : 20px
--space-6    : 24px
--space-8    : 32px
--space-10   : 40px

--radius-sm  : 10px   → badges, tags, small chips
--radius-md  : 16px   → inputs, buttons, table rows on hover
--radius-lg  : 20px   → cards, panels
--radius-xl  : 28px   → sidebar, modals, main content panels
--radius-full: 9999px → pill buttons, toggle switches
```

### 1.4 Glass Blur Values

```
--blur-bg    : blur(40px)    → the fixed background photo overlay
--blur-panel : blur(20px)    → main content panels, sidebar
--blur-card  : blur(16px)    → summary cards
--blur-modal : blur(24px)    → drawers and modals (higher = more focus)
--blur-input : blur(8px)     → form inputs (subtle glass look without muddying legibility)
```

### 1.5 Shadows

```
--shadow-card  : 0 4px 24px rgba(180, 150, 100, 0.10), 0 1px 4px rgba(180,150,100,0.08)
--shadow-panel : 0 8px 40px rgba(160, 130, 80, 0.12), 0 2px 8px rgba(160,130,80,0.08)
--shadow-modal : 0 16px 64px rgba(140, 110, 60, 0.18), 0 4px 16px rgba(140,110,60,0.10)
--shadow-btn   : 0 2px 12px rgba(200, 135, 58, 0.22)  → accent buttons only
```

---

## 2. Background Layer

The fixed kitchen photograph is the foundation of the entire design.

```css
body {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('/bg-kitchen.jpg');
  background-size: cover;
  background-position: center;
  filter: blur(2px) brightness(0.96) saturate(0.92);
  transform: scale(1.04); /* avoids white edge on blur */
}

.bg-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: rgba(255, 250, 242, 0.18); /* subtle warm veil */
}
```

All UI components sit at `z-index: 2+` above these two fixed layers.

---

## 3. Glass Surface Mixin

Every panel, card, sidebar, and modal uses a variation of this glass recipe:

```css
.glass {
  background: var(--glass-base);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-panel);
}
```

**Variations:**

| Class | `background` | `backdrop-filter` | `border-radius` | Use |
|---|---|---|---|---|
| `.glass` | `--glass-base` | `blur(20px)` | `--radius-xl` | Main content panel |
| `.glass-sidebar` | `--glass-sidebar` | `blur(20px)` | `--radius-xl` | Left sidebar |
| `.glass-card` | `--glass-card` | `blur(16px)` | `--radius-lg` | Stat summary cards |
| `.glass-input` | `--glass-input` | `blur(8px)` | `--radius-md` | Form inputs, selects |
| `.glass-modal` | `--glass-modal` | `blur(24px)` | `--radius-xl` | Modals, drawers |

---

## 4. Layout Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Fixed BG Photo                     │  z: 0
│              + Warm Overlay Veil                    │  z: 1
└─────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────┐
│          │                                          │
│ Sidebar  │         Main Content Panel               │  z: 2
│ glass    │         glass                            │
│ 220px    │         fills remaining width            │
│  fixed   │         scrollable                       │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Outer shell:** `display: flex; height: 100vh; padding: 16px; gap: 12px;`
  The padding ensures the glass panels never touch the screen edges — the blurred kitchen
  photo peeks through at all four sides.
- **Sidebar:** `width: 220px; flex-shrink: 0; position: sticky; top: 16px; height: calc(100vh - 32px)`
- **Main panel:** `flex: 1; overflow-y: auto; padding: 28px 32px;`
- **Mobile (< 768px):** Sidebar collapses to a bottom navigation bar (5 icons with labels).
  Main panel takes full width. Padding reduces to `16px 16px`.

---

## 5. Component Specifications

### 5.1 Sidebar

```
Width        : 220px desktop / bottom bar mobile
Background   : --glass-sidebar with blur(20px)
Border-right : none (rely on shadow + gap from main panel)
Border-radius: --radius-xl on all four corners
Padding      : 20px 14px

Structure:
  ┌─────────────────────┐
  │  [Logo] Restro Rasoi│  ← logo icon + brand name (Inter 600, 15px)
  │  Cloud Kitchen      │  ← subtitle (Inter 400, 11px, --text-tertiary)
  ├─────────────────────┤
  │  [icon] Dashboard   │  ← nav item
  │  [icon] Sales       │
  │  [icon] Expenditures│
  │  [icon] Customers   │
  │  [icon] Menu Items  │
  │  [icon] Reports     │  ← Admin only
  │  [icon] Settings    │
  ├─────────────────────┤  ← spacer pushes user block to bottom
  │  [avatar] Name      │  ← role badge below name
  │           Owner     │
  └─────────────────────┘
```

**Nav item states:**
```css
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font: 500 14px Inter; color: var(--text-secondary);
  transition: background 180ms ease, color 180ms ease;
  cursor: pointer;
}
.nav-item:hover {
  background: var(--accent-light);
  color: var(--accent);
}
.nav-item.active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}
/* Active item gets a 3px left accent bar */
.nav-item.active::before {
  content: '';
  position: absolute; left: 0;
  width: 3px; height: 22px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}
```

### 5.2 Summary / Stat Cards

Four cards on the Dashboard: Today's Sales, Today's Orders, Monthly Profit, Pending Payments.

```
┌──────────────────────────────┐
│  Today's Sales    [icon]     │
│  ₹8,450                      │  ← JetBrains Mono 600, 32px, --text-primary
│  +12.5% vs yesterday ↑       │  ← Inter 12px, --success for positive
└──────────────────────────────┘
```

```css
.stat-card {
  @apply glass-card;
  padding: 20px 22px;
  display: flex; flex-direction: column; gap: 8px;
  min-width: 0; flex: 1;
}
.stat-card__icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--accent-light);
  display: grid; place-items: center;
  /* each card gets a unique icon color tint, not all accent */
}
.stat-card__value { font: 600 32px 'JetBrains Mono'; color: var(--text-primary); }
.stat-card__label { font: 500 12px Inter; color: var(--text-secondary); }
.stat-card__delta { font: 400 12px Inter; }
.stat-card__delta.up   { color: var(--success); }
.stat-card__delta.down { color: var(--danger); }
```

Cards arrange as a 4-column flex row on desktop, 2×2 grid on tablet, 1-column on mobile.

### 5.3 Buttons

Three variants. All use Inter 500, 14px. Minimum height: 44px (accessibility tap target).

**Primary (accent filled):**
```css
.btn-primary {
  background: var(--accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  box-shadow: var(--shadow-btn);
  transition: background 150ms ease, transform 100ms ease, box-shadow 150ms ease;
}
.btn-primary:hover  { background: var(--accent-dark); box-shadow: 0 4px 18px rgba(200,135,58,0.30); }
.btn-primary:active { transform: scale(0.97); box-shadow: none; }
```

**Secondary (ghost glass):**
```css
.btn-secondary {
  background: rgba(255,255,255,0.30);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  padding: 10px 20px;
  transition: background 150ms ease;
}
.btn-secondary:hover  { background: rgba(255,255,255,0.48); }
.btn-secondary:active { transform: scale(0.97); }
```

**Danger (delete / destructive):**
```css
.btn-danger {
  background: var(--danger-bg);
  color: var(--danger);
  border: 1px solid rgba(192, 82, 74, 0.25);
  border-radius: var(--radius-md);
  padding: 10px 20px;
  transition: background 150ms ease;
}
.btn-danger:hover { background: rgba(192, 82, 74, 0.22); }
```

**Icon button (inline table actions):**
```css
.btn-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  display: grid; place-items: center;
  color: var(--text-tertiary);
  transition: background 150ms, color 150ms, border-color 150ms;
}
.btn-icon:hover { background: var(--accent-light); color: var(--accent); border-color: rgba(200,135,58,0.20); }
```

### 5.4 Form Inputs

```css
.input {
  width: 100%;
  background: var(--glass-input);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: 11px 14px;
  font: 400 15px Inter; color: var(--text-primary);
  outline: none;
  transition: border-color 180ms, box-shadow 180ms;
}
.input::placeholder { color: var(--text-tertiary); }
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(200, 135, 58, 0.14);
}
```

**Select / Dropdown:** Same glass styling as `.input`. The native `<select>` is hidden; use a custom dropdown built with a glass panel (`--glass-modal`) that slides down with a 150ms ease-out transition.

**Quantity Stepper (used in ItemPicker):**
```
[ − ] [ 2 ] [ + ]   ← glass pill, buttons on sides, number in center read-only
```
```css
.stepper {
  display: flex; align-items: center;
  background: var(--glass-input); backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  overflow: hidden; height: 36px;
}
.stepper__btn { width: 36px; font-size: 16px; color: var(--accent); }
.stepper__value { width: 32px; text-align: center; font: 600 14px 'JetBrains Mono'; }
```

### 5.5 Badges / Status Chips

Used for Paid/Unpaid, Active/Inactive, and role labels.

```css
.badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font: 500 12px Inter;
}
.badge.paid     { background: var(--success-bg); color: var(--success); }
.badge.unpaid   { background: var(--danger-bg);  color: var(--danger);  }
.badge.active   { background: var(--success-bg); color: var(--success); }
.badge.inactive { background: var(--glass-card); color: var(--text-tertiary); }
.badge.owner    { background: var(--accent-light); color: var(--accent); }
.badge.admin    { background: rgba(100,80,200,0.12); color: #6450C8; }
```

### 5.6 Data Table

```
┌──────────────────────────────────────────────────┐
│ [Search...          ] [Filter ▾] [Date ▾] [+ Add]│  ← FilterBar
├──────┬────────┬───────┬──────────┬────────┬──────┤
│ Date │ Cust.  │ Items │ Amount   │ Status │ Acts │  ← header, Inter 12px, --text-tertiary, uppercase
├──────┼────────┼───────┼──────────┼────────┼──────┤
│ row  │        │       │ ₹260     │ [Paid] │ ✏ 🗑 │  ← row, Inter 14px
│ row  │        │       │ ₹450     │[Unpaid]│ ✏ 🗑 │
└──────┴────────┴───────┴──────────┴────────┴──────┘
```

```css
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.data-table thead th {
  font: 500 11px Inter; color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 10px 14px; text-align: left;
  border-bottom: 1px solid var(--glass-border);
}
.data-table tbody tr {
  transition: background 150ms ease;
  border-radius: var(--radius-md);
}
.data-table tbody tr:hover { background: rgba(255,255,255,0.28); }
.data-table tbody td {
  padding: 13px 14px;
  font: 400 13px Inter; color: var(--text-primary);
  border-bottom: 1px solid rgba(255,255,255,0.18);
  vertical-align: middle;
}
/* Rupee amounts in mono */
.data-table td.amount { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 13px; }
```

### 5.7 Modal / Drawer (Add Sale, Add Expense)

On desktop: a **right-side drawer** slides in from the right (same pattern as the reference).
On mobile: a **bottom sheet** slides up from the bottom.

```css
.drawer-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(30, 20, 10, 0.18);
  backdrop-filter: blur(4px);
  animation: fadeIn 200ms ease;
}
.drawer {
  position: fixed; top: 16px; right: 16px; bottom: 16px;
  width: min(480px, calc(100vw - 32px));
  z-index: 51;
  @apply glass-modal;
  padding: 28px 28px;
  overflow-y: auto;
  animation: slideInRight 250ms cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes slideInRight {
  from { transform: translateX(calc(100% + 32px)); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* Mobile override */
@media (max-width: 640px) {
  .drawer {
    top: auto; left: 16px; right: 16px; bottom: 16px;
    width: auto; height: 88dvh;
    border-radius: 28px 28px var(--radius-sm) var(--radius-sm);
    animation: slideInUp 260ms cubic-bezier(0.32, 0.72, 0, 1);
  }
  @keyframes slideInUp {
    from { transform: translateY(calc(100% + 16px)); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
}
```

**Drawer header pattern:**
```
Back ←                    Add New Sale
                          Enter order / sales details
```
Back arrow is `.btn-secondary` (small), aligned top-left. Title right-aligned or centered.

### 5.8 Chart (Sales Overview)

Use **Recharts** `<AreaChart>`. The area fill is a gradient from `rgba(200,135,58,0.30)` at top
to `rgba(200,135,58,0.00)` at bottom. Stroke is `--accent`. Grid lines are `rgba(255,255,255,0.20)`.
Tooltip uses the `.glass-card` glass style.

```jsx
<defs>
  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%"  stopColor="#C8873A" stopOpacity={0.30} />
    <stop offset="95%" stopColor="#C8873A" stopOpacity={0}    />
  </linearGradient>
</defs>
<Area type="monotone" dataKey="sales"
  stroke="#C8873A" strokeWidth={2}
  fill="url(#salesGrad)" dot={false}
  activeDot={{ r: 5, fill: '#C8873A', stroke: '#fff', strokeWidth: 2 }} />
```

### 5.9 Top-Selling Items List

Each item row in the dashboard "Top Selling Items" card:
```
[food emoji/icon]  Paneer Butter Masala    42 orders →
```
- Left: 36px circular icon container with `--accent-light` background, holds a Lucide or emoji icon.
- Middle: dish name (Inter 14px, `--text-primary`).
- Right: order count (Inter 12px, `--text-tertiary`) + a thin progress bar in `--accent-light`.

### 5.10 Login Page

Full-screen blurred kitchen background (same fixed layer). A single centered glass card:

```
┌──────────────────────────┐
│     [Restro Rasoi logo]  │
│     Welcome back         │  ← Playfair Display 24px
│     Sign in to continue  │  ← Inter 14px, --text-secondary
│                          │
│  [Username / Name input] │
│  [Password input]        │
│  [Role: Owner | Admin]   │  ← glass pill toggle, not a dropdown
│                          │
│     [  Sign In  ]        │  ← btn-primary, full width
└──────────────────────────┘
```

The card animates in on mount: `translateY(20px) opacity(0)` → rest in 300ms ease-out.

---

## 6. Page-by-Page Layout

### 6.1 Dashboard `/`

```
Greeting bar: "Good morning, Admin ☀️"   [2 July, 2025 ▾]  [🔔]
Subtitle: "Here's what's happening with your cloud kitchen today."
────────────────────────────────────────────────────────
[Stat Card: Today's Sales] [Today's Orders] [Monthly Profit] [Pending Payments]
────────────────────────────────────────────────────────
[Sales Overview Chart — 60% width]    [Top Selling Items — 40% width]
```

- Greeting derives time of day (morning / afternoon / evening) and role name from JWT.
- Stat cards animate in staggered: each card fades+slides up with a 60ms delay between them.
- Chart area fades in after cards settle (300ms delay from page mount).

### 6.2 Sales `/sales`

```
Page title: "Sales"
Sub: "Manage your daily orders"
[+ Add Sale]  ← top-right, btn-primary
────────────────────────────────────────────────────────
FilterBar: [🔍 Search customer...] [Status ▾] [Payment ▾] [Date range]
                                                    [Quick: Today | Week | Month]
────────────────────────────────────────────────────────
DataTable: Date | Customer | Items | Amount | Status | Payment | Actions
```

- "Add Sale" opens the right-side drawer.
- Rows animate in with a 30ms stagger on initial load (fade + slight translateY).
- Clicking a row expands an inline detail preview (accordion) before full edit opens.

### 6.3 Add Sale Drawer `/sales/new`

```
← Back                           Add New Sale
                                 Enter order / sales details
─────────────────────────────────────────────
Date             [2 July, 2025      📅]
Customer         [Select customer   ▾]   [+ New Customer]
─────────────────────────────────────────────
Items
  Item Name            Qty   Price(₹)  Total(₹)  [🗑]
  [Paneer Butter Masala]  1    220       220      [🗑]
  [Tandoori Roti      ]  2     20        40      [🗑]
  [+ Add Item]
─────────────────────────────────────────────
                              Subtotal    ₹260
                              Discount    ₹10
                              Total Amount ₹250  ← green, JetBrains Mono
─────────────────────────────────────────────
Payment Method    [Cash ▾]
Notes (Optional)  [Add any notes…]
─────────────────────────────────────────────
                              [  Save Sale  ]
```

- "Add Item" → the ItemPicker dropdown slides down: searchable list of MenuItems.
  Selecting one adds a row with auto-filled price and quantity stepper.
  "Other" option at bottom reveals name + price text inputs.
- Total section updates live on every qty/price change with a subtle number-roll animation
  (counter increments, not a hard jump).
- "Save Sale" button shows a spinner during POST, then the drawer closes with a reverse
  `slideOutRight` and a success toast appears.

### 6.4 Expenditure `/expenditure`

Same layout pattern as Sales: FilterBar + DataTable.
Add Expense drawer mirrors Add Sale drawer structure but with: Date, Category (dropdown),
Item/Description (text), Amount (₹ input), Payment Method, Notes, Save.

### 6.5 Customers `/customers`

```
Page title: "Customers"
Sub: "Manage your regular customers"
[+ Add Customer]  ← top-right, btn-primary
────────────────────────────────────────────────────────
[🔍 Search customers…]
DataTable: Name | Phone | Total Orders | Total Spent | Outstanding | Actions
```

- Outstanding amounts in `--danger` color if > 0, `--text-tertiary` if ₹0.
- Clicking a customer row navigates to `/customers/[id]` with a full order history timeline.

### 6.6 Menu Items `/menu` (Admin only)

```
Page title: "Menu Items"
Sub: "Manage your menu items and pricing"
[+ Add Item]  ← top-right
────────────────────────────────────────────────────────
DataTable: [icon] Item Name | Category | Price (₹) | Status | Actions
```

- Status is `[Active]` / `[Inactive]` badge with a toggle switch in the Actions column.
- Price editing opens an inline edit mode (row turns into inputs) rather than a separate drawer.

### 6.7 Reports `/reports` (Admin only)

Summary cards for overall period + date-range filter + downloadable export button.
Bar chart comparing monthly Sales vs Expenditure using the same Recharts glass-tooltip theme.

---

## 7. Animation & Motion System

All motion follows a single easing: `cubic-bezier(0.32, 0.72, 0, 1)` (Apple's spring-like ease).
Duration is always short — never more than 350ms for a transition.

### 7.1 Page Entry (every page)

```css
/* Applied to the main content panel on route change */
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter { animation: pageEnter 280ms cubic-bezier(0.32, 0.72, 0, 1) both; }
```

### 7.2 Staggered List Reveal

Used whenever a DataTable loads or filters change. Each `<tr>` gets:
```css
@keyframes rowEnter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
tbody tr:nth-child(n) { animation: rowEnter 200ms ease both; animation-delay: calc(n * 30ms); }
```
(Cap at 8 rows for performance — rows 9+ appear instantly.)

### 7.3 Stat Card Counter Roll

Dashboard hero numbers animate from 0 to their value on mount using a JS requestAnimationFrame
counter. Duration: 600ms, ease-out cubic. Makes ₹8,450 feel "loaded" rather than "appeared".

### 7.4 Button Feedback

```css
/* All buttons */
button { transition: transform 100ms ease, box-shadow 150ms ease, background 150ms ease; }
button:active { transform: scale(0.96); }
```

### 7.5 Drawer Open / Close

- Open: `slideInRight` 250ms (desktop), `slideInUp` 260ms (mobile).
- Close: reverse (translateX to off-screen), 200ms. Overlay fades out simultaneously.
- The main content behind the overlay does **not** shift — the drawer overlays it.

### 7.6 Toast Notifications

Success / error toasts appear in the top-right corner:
```css
@keyframes toastIn {
  from { opacity: 0; transform: translateX(16px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}
```
Glass style (`.glass-card`). Auto-dismiss after 3 seconds with a reverse animation.
- Success: left border 3px `--success`.
- Error: left border 3px `--danger`.

### 7.7 Hover Micro-interactions

- Nav items: background tint fades in 180ms.
- Table rows: background tint fades in 150ms.
- Cards: `box-shadow` deepens on hover (200ms) — no transform to avoid layout shift.
- Icon buttons: background and icon color transition 150ms.
- Input focus: border glows amber with a 3px offset ring, 180ms.

### 7.8 Loading States

- Tables: skeleton rows with `background: linear-gradient(90deg, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite;`
- Buttons during async: replace label with a 16px spinner (CSS border-based, `--accent` color).
- Dashboard on first load: stat cards show "—" with a shimmer pulse.

### 7.9 Confirmation Dialog

Destructive actions (delete sale, delete expense, deactivate menu item) show a centered modal:

```
┌─────────────────────────────┐
│   Remove this order?        │  ← Playfair 18px
│   This can't be undone.     │  ← Inter 14px, --text-secondary
│                             │
│  [Cancel]    [Yes, Remove]  │
└─────────────────────────────┘
```

Animates in with `scale(0.94) opacity(0)` → `scale(1) opacity(1)` in 200ms. Backdrop blurs
everything behind it.

---

## 8. Responsive Breakpoints

```
--bp-sm  : 640px   (phone landscape / small tablet)
--bp-md  : 768px   (tablet)
--bp-lg  : 1024px  (desktop)
--bp-xl  : 1280px  (wide desktop)
```

| Element | Mobile (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Sidebar | Hidden → Bottom nav bar | Visible, 220px fixed |
| Stat cards | 2×2 grid | 4-column flex row |
| Drawers | Bottom sheet (88dvh) | Right sidebar (480px) |
| Table | Horizontal scroll | Full-width |
| Outer padding | 8px | 16px |
| Main panel padding | 16px | 28px 32px |

---

## 9. Accessibility Baseline

- All interactive elements ≥ 44px tap/click target.
- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px;` on all focusable elements.
- `prefers-reduced-motion` media query: disable all animations and transitions except opacity fades.
- Color is never the only indicator of state (badges always include text label alongside color).
- All form inputs have visible `<label>` elements (not placeholder-only).
- Error messages are `role="alert"` so screen readers announce them.
- Confirmation dialogs trap focus while open.

---

## 10. Implementation Notes for Next.js

### CSS Variables
Define all tokens in `globals.css` under `:root {}`. Never hardcode hex values in component CSS.

### Backdrop Filter Browser Support
Always pair `backdrop-filter` with `-webkit-backdrop-filter` for Safari (critical for iOS).

### Background Image
Store the kitchen photo as `public/bg-kitchen.jpg` (optimize to ~200–300KB WebP). The `.bg-layer`
div is rendered in the root `layout.tsx` outside of any scrollable container.

### Font Loading
```js
// app/layout.tsx
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600'] })
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600'] })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','600'] })
```

### Animation Library
Use **Framer Motion** for page transitions, drawer animations, and staggered list reveals.
Use plain CSS transitions for hover states and micro-interactions (faster, no JS overhead).

```jsx
// Page wrapper in every page.jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
>
  {children}
</motion.div>
```

### Rupee Formatting
```js
const formatINR = (n) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
}).format(n)
// → ₹8,450
```

### Role-Gated Nav Items
```jsx
const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/', adminOnly: true },
  { label: 'Sales',     icon: ShoppingBag,    href: '/sales' },
  { label: 'Expenditures', icon: Receipt,     href: '/expenditure' },
  { label: 'Customers', icon: Users,          href: '/customers', adminOnly: true },
  { label: 'Menu Items',icon: UtensilsCrossed,href: '/menu', adminOnly: true },
  { label: 'Reports',   icon: BarChart2,      href: '/reports', adminOnly: true },
  { label: 'Settings',  icon: Settings,       href: '/settings', adminOnly: true },
]
// Filter by role from JWT before rendering
```

---

## 11. Signature Element

The single element that makes this design unmistakably *Restro Rasoi* and not a generic dashboard:

> **The kitchen photograph breathes through every surface.**

Unlike typical glassmorphism that places glass on a gradient or solid color, here the glass panels
are genuinely translucent windows onto a real, warm kitchen photograph. The amber light of the
kitchen's under-cabinet lighting tints every glass surface differently depending on what part of
the photo is behind it. No two panels look exactly the same shade of cream — the UI literally
changes depending on what's behind it. This is not just an aesthetic choice; it reinforces the
product's identity: this is software built *inside* a kitchen, not a generic SaaS tool dressed in
food colors.

---

*End of Design Specification — Restro Rasoi v1.0*
