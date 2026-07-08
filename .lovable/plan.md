
# The Cozy Pets — SaaS Upgrade Plan

This is a very large scope (essentially a second version of the app). To keep quality high and avoid breaking existing data/workflows, I'll deliver it in **phases**. Please confirm the plan and pick where you'd like to start — I'd recommend Phase 1 first, then we iterate.

All existing tables, records, auth, and workflows stay intact. New columns are additive with safe defaults. No destructive migrations.

---

## Phase 1 — Foundation & Dashboard (start here)
- Global polish: rounded cards, blue/white palette refinement, skeleton loaders, toasts on every action, confirmation dialogs before delete, mobile responsiveness pass.
- Reusable primitives: `StatCard`, `SectionCard`, `ConfirmDialog`, `EmptyState`, `LoadingSkeleton`, `PageHeader`.
- Global search (owner, pet, phone, booking id, breed, kennel, invoice) via a `⌘K` command palette.
- Dashboard rebuild:
  - KPIs: Currently Boarding, Check-ins Today, Check-outs Today, Upcoming Arrivals, Occupancy Rate, Revenue Today, Revenue This Month, Pending Payments, Active Daycare, Vaccinations Expiring Soon.
  - Charts (recharts): Monthly Revenue, Occupancy Trend, Boarding vs Daycare, New Customers/Month.
  - Quick actions: New Booking, New Customer, New Pet, Create Invoice, Calendar, Reports.

## Phase 2 — Bookings & Pricing
- Add booking `status` (inquiry/confirmed/checked-in/checked-out/cancelled/no-show), `source`, `tags[]`, `notes`, `internal_notes`.
- Smart stay calc: overnight + half/full daycare from check-in/out datetime, with manual override.
- Discounts: %, fixed, coupon code, promo — with clear breakdown (Subtotal → Discount → Extras → GST optional → Grand Total).
- Extra charges catalog: Bath, Grooming, Pickup, Drop, Training, Medicine, Special Food, Vet Visit, Custom — each optional line item.

## Phase 3 — Pets & Customers 360°
- Expanded pet profile tabs: Basic / Medical (vaccines, deworming, tick, allergies, conditions, meds) / Behaviour (chips) / Feeding / Emergency + Vet / History (visits, lifetime stay, spend, last visit).
- Customer profile: pets, upcoming, past, lifetime spend, pending payments, emergency, address, notes.
- Duplicate-owner guard by phone number.

## Phase 4 — Rooms, Calendar & Daily Care
- Room/Hut management with type, capacity, status (available/occupied/cleaning/maintenance) and visual grid.
- Drag-and-drop booking calendar (react-big-calendar or dnd-kit) with color-coded events; click to open booking.
- Daily care checklist (morning/afternoon/evening/night) + medicine tracker (schedule, doses, staff, timestamps).
- Overlap prevention on room bookings; validation messages.

## Phase 5 — Billing, Reports, Notifications, Vaccines
- Payments: cash, UPI, card, bank transfer, split payments, advance + pending balance.
- Professional invoice with logo, invoice #, booking id, payment history, remaining, QR code.
- Reports (Revenue, Bookings, Occupancy, Repeat customers, Popular breed, Avg stay, Pending payments, Cancelled) with PDF + Excel export.
- Vaccine expiry detection with dashboard alerts (Rabies, DHPP, Kennel Cough, other).
- In-app reminders: upcoming check-in/out, vaccine due, pending payment, birthday, booking confirmation.

## Phase 6 — Documents, Audit, Staff Roles
- Document uploads (vaccine cert, medical, ID, consent, photos, PDFs) via existing storage bucket.
- Audit log table for all create/update/delete + logins.
- Staff roles: admin, manager, reception, caretaker, cleaner using the existing `user_roles` + `has_role()` pattern; route/section guards.

## Technical notes
- New tables (additive): `rooms`, `booking_extras`, `care_logs`, `medications_schedule`, `documents`, `audit_logs`, `coupons`. New columns on `boardings`: `status_v2`, `source`, `tags`, `internal_notes`, `discount_code`, `gst`. All with defaults so old rows keep working.
- New enums added via migrations; legacy values mapped in code (as we've done for `last_day_charge`).
- Charts: `recharts` (already used elsewhere). Calendar: `@dnd-kit` + custom grid to stay lightweight. PDF: existing print-to-PDF flow + `xlsx` for Excel export.
- All new queries paginated; heavy tables lazy-loaded via `react-window` where needed.

---

## Questions before I start
1. **Where should I start?** I recommend **Phase 1 (Foundation + Dashboard)** this turn — it's the most visible upgrade and unblocks the rest. Confirm or pick a different phase.
2. **GST**: enable by default in invoices, or keep it optional per booking?
3. **Rooms/Kennels**: do you want me to seed a starter set of rooms, or leave the list empty for you to create?
4. **Staff roles**: OK to keep only the current signed-in user as `admin` initially, and add role management UI in Phase 6?

Reply with your choice and I'll ship Phase 1 immediately.
