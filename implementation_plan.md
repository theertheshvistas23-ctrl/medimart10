# Implementation Plan: MediMart Dashboard Usability & Experience Upgrades

We will implement a series of high-value, non-breaking frontend usability improvements to make buying and managing operations on MediMart faster, more intuitive, and frictionless for the customer, cashier, and admin.

---

## Proposed Changes

### 1. Customer Store Dashboard (`public/customer.html`)
* **Category Quick-Filter Badges**:
  * Extract all unique medicine categories dynamically from the medicine list.
  * Render a horizontal row of clickable glass filter badges (e.g., "All", "Antibiotics", "Painkillers") above the medicine grid.
  * Clicking a category filters the catalog grid instantly in JavaScript without hitting the database.
* **Filter Clear & Empty State Reset**:
  * Add a clear button (×) to the search input field to allow clearing search terms in a single click.
  * Update the empty state grid markup: if filters yield no results, display a descriptive "No results found matching your filters" message with a "Clear Filters" button to reset instantly.
* **Live Stock Limit Indicator**:
  * Display a `Stock: X` label next to items inside the slide-out shopping cart drawer to show customer available limit explicitly.

### 2. Cashier POS Dashboard (`public/cashier.html`)
* **Autofocus Search & Clear Action**:
  * Set `autofocus` on the medicine search input so cashiers can start billing immediately upon loading.
  * Add a clear button (×) to the search input field.
* **Keyboard Shortcut for Checkout**:
  * Bind `Ctrl+Enter` keydown listener to finalize invoice creation (`saveInvoice()`) without requiring mouse navigation.
* **Toast Notification UI System**:
  * Replace default intrusive browser `alert()` popups with a beautiful, non-disruptive Toast notification system styled to match the obsidian glass aesthetic.
* **Dynamic Queue Badge, Auto-Refresh & Audio Synths**:
  * Display a count badge in the queue header indicating the number of waiting customer submissions.
  * Run a background interval checking for new submissions every 30 seconds.
  * Play a pleasant dual-tone beep synthesizer sound using the Web Audio API when a new customer order is received, alerting the cashier instantly.

### 3. Admin Dashboard (`public/admin.html`)
* **Smart Inventory Auditing Toggles**:
  * Introduce an audit filter row above the Inventory Management table:
    * **Low Stock Only**: Displays only medicines with quantity < 5.
    * **Expiring Soon**: Displays medicines whose expiration date has passed or expires within 60 days.
    * **Inline Inventory Search**: Search box to filter inventory rows instantly by ID, Name, or Category.
* **Billing History Search Filter**:
  * Add a search input above the Billing & Sales History table to search and filter finished invoices instantly by Bill ID, Customer Username, Email, or Payment Method.

---

## File Modifications

### [MODIFY] [customer.html](file:///e:/medimart%202/MediMart/MediMart10/public/customer.html)
* Define global `activeCategory = 'All'`.
* Implement `buildCategoryBadges()` to extract categories, render glass buttons, and filter.
* Implement `applyActiveFilters()` to merge search queries and category filters.
* Update `renderMeds()` empty state to display dynamic help text and a "Clear Filters" button.
* Display stock limit next to each item in `renderCart()`.

### [MODIFY] [cashier.html](file:///e:/medimart%202/MediMart/MediMart10/public/cashier.html)
* Add `autofocus` and clear button markup to search input.
* Implement `#toastContainer` div and `showToast(msg, type)` helper function.
* Replace `alert()` messages with non-intrusive `showToast()` alerts.
* Implement keydown listener mapping `Ctrl+Enter` to check out.
* Update `loadPendingOrders()` to count queue size, update heading, and compare counts.
* Implement Web Audio synthesizer beep function `playNotificationSound()`.
* Add background polling `setInterval(loadPendingOrders, 30000)`.

### [MODIFY] [admin.html](file:///e:/medimart%202/MediMart/MediMart10/public/admin.html)
* Add checkboxes for "Low Stock Only" and "Expiring Soon", and text input for inventory search.
* Add search input for billing history table.
* Map stats loading and fetching to local arrays `allMeds` and `allOrders`.
* Implement `renderInventoryTable()` and `filterInventoryTable()` using date checking helper `isDateWithinDays()`.
* Implement `renderBillingHistory()` and `filterBillingHistory()`.

---

## Verification Plan

### Manual Verification
1. **Customer Store**:
   - Verify category badges render above the products grid. Click on a category to filter.
   - Type in the search input, check that clear button (×) appears. Click it to clear.
   - Filter search to match zero items; verify "No medicines found matching filters" message appears with a reset button.
2. **Cashier POS**:
   - Verify focus is in the search box on page load.
   - Verify that adding a medicine and clicking save triggers a toast notification instead of browser popup.
   - Submit an order from customer panel, wait for POS to poll, and verify a dual-tone beep chime plays and the queue count badge increments.
   - Press `Ctrl+Enter` to verify it triggers checkout.
3. **Admin Panel**:
   - Toggle **Low Stock Only** and verify rows filter instantly.
   - Toggle **Expiring Soon** and verify rows filter to items with expiry within 60 days.
   - Type a username in the Billing search input and verify rows filter.
