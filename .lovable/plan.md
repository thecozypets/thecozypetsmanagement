# Phase 3 — Pets & Customers 360°

Expand pet and owner profiles into rich, tabbed dashboards showing everything about them in one place. All changes additive; no existing data touched.

---

## 1. Database (additive migration)

**`dogs` table — new columns (all optional):**
- `microchip_id` text
- `color` text
- `vaccines` jsonb — `[{name, date, expiry, certUrl}]` (Rabies, DHPP, Kennel Cough, custom)
- `deworming_date` date, `tick_flea_date` date
- `allergies` text, `medical_conditions` text
- `current_medications` jsonb — `[{name, dosage, frequency, notes}]`
- `behaviour_tags` text[] — chips (friendly, anxious, aggressive-to-dogs, kid-safe, cat-safe, escapes, barks, etc.)
- `feeding_food` text, `feeding_times` text, `feeding_portions` text
- `vet_name` text, `vet_phone` text, `vet_clinic` text
- `emergency_contact_name` text, `emergency_contact_phone` text

Same set added to `foster_dogs`.

**`owners` table — new columns:**
- `alt_phone` text, `notes` text, `city` text, `pincode` text
- Duplicate-owner guard: unique partial index on `lower(phone)` (soft — surfaced as warning in UI, not hard DB constraint, to avoid breaking legacy rows).

## 2. Types (`src/types/boarding.ts`)
Extend `Dog`, `Owner` with the new optional fields. Add `VaccineRecord`, `MedicationRecord` types.

## 3. New component: `PetProfile360.tsx`
Tabbed dialog/panel with tabs:
- **Basic** — name, breed, age, weight, gender, color, microchip, photo
- **Medical** — vaccines list (add/edit/expiry warnings), deworming, tick/flea, allergies, conditions, current meds
- **Behaviour** — tag chips (multi-select from preset + custom)
- **Feeding** — food, times, portions, special instructions
- **Emergency & Vet** — vet + emergency contacts
- **History** — all past & upcoming boardings/fosters, lifetime nights, lifetime spend, last visit, avg stay

## 4. New component: `OwnerProfile360.tsx`
Tabs / sections:
- **Overview** — contact, address, alt phone, notes, lifetime spend, pending balance, total bookings
- **Pets** — list of owned pets with quick-open
- **Upcoming** stays, **Past** stays
- **Pending Payments** — outstanding across all bookings with quick pay button

## 5. Integrate
- `DogManager` & `FosterManager` cards → click opens `PetProfile360` (replaces current DetailPanel dog view).
- `OwnerManager` cards → click opens `OwnerProfile360`.
- Keep the existing `DetailPanel` as fallback; new profiles used from Phase 3 forward.

## 6. Duplicate-owner guard
In `OwnerManager` add-form: on phone blur, query owners by normalized phone; if match, show inline warning "An owner with this phone already exists: {name} — open profile" instead of blocking.

## 7. UX polish
- Vaccine expiry badges: green (>60d), amber (<60d), red (expired).
- Behaviour tags color-coded (positive/neutral/warning).
- History tab uses existing billing utility to aggregate spend.

---

## Out of scope (later phases)
- Documents upload UI beyond vaccine cert (Phase 6).
- Calendar view of stays (Phase 4).
- Reports/exports (Phase 5).

Reply "go" (or with tweaks) and I'll ship it.
