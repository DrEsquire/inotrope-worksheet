# Methods &amp; Validation

This document describes the calculation logic, rounding rules, and clinical
reference values used by the **Inotrope Compounding Worksheet**
(`index.html`). It is intended to let a pharmacist independently verify every
output the tool produces.

All computation happens client-side in the browser. There is no server, no
stored state, and no external data source — the formulas below are the complete
specification of the tool's behavior.

---

## Clinical context: when to compound

Commercially prepared, premixed inotrope products (dobutamine, milrinone,
dopamine) are available and are appropriate for many patients. This worksheet is
not intended to replace those products where they meet the clinical need.

Compounding a patient-specific or facility-standardized preparation may still be
considered when:

- **Standardizing dose-change schedules** — aligning bag-change intervals and
  concentrations across a facility to reduce variation and error at transitions
  of care.
- **CHF fluid restriction** — increasing the drug concentration to reduce the
  infused volume for patients with heart failure or other fluid-restricted
  states, where the volume of a standard premix would be undesirable.

The decision to compound rather than use a commercial product rests with the
prescriber and pharmacist and should follow institutional policy and USP &lt;797&gt;.

---

## 1. Inputs

| Input | Units | Notes |
|-------|-------|-------|
| Drug | — | Dobutamine or Milrinone |
| Dose | mcg/kg/min | Ordered infusion rate |
| Weight | kg | Patient dosing weight (forward mode) |
| Bag change schedule | hours | Interval between bag changes |
| Standard concentration | mg/mL | Final bag concentration (drug-specific list) |

### Drug-specific standard concentrations

| Drug | Selectable bag concentrations | Stock vial |
|------|-------------------------------|------------|
| Dobutamine | 4 mg/mL, 5 mg/mL | 12.5 mg/mL |
| Milrinone | 0.2 mg/mL, 0.4 mg/mL, 0.8 mg/mL | 1 mg/mL |
| Dopamine* | 0.8 mg/mL, 1.6 mg/mL, 3.2 mg/mL | 40 mg/mL or 80 mg/mL |

\* **Dopamine is reserved for the acute care setting.** Selecting dopamine
displays a prominent warning banner in the tool.

### Usual adult dose ranges (advisory dose check)

| Drug | Usual range (mcg/kg/min) |
|------|--------------------------|
| Dobutamine | 2 – 5 |
| Milrinone | 0.125 – 0.5 |
| Dopamine | 2 – 20 |

Doses outside these ranges are flagged as a caution; they are **not** blocked.

---

## 2. Core dosing formulas

Let:

- `dose` = ordered dose (mcg/kg/min)
- `weight` = patient weight (kg)
- `conc` = selected standard concentration (mg/mL)
- `bagHours` = bag change schedule (hours)

```
Dose (mcg/min)     = dose × weight
Dose (mg/hr)       = Dose (mcg/min) × 0.06
Dose (mg/BAG)      = Dose (mg/hr) × bagHours
Daily Order (mg)   = Dose (mg/hr) × 24
Calculated BAG (mL)= Daily Order (mg) ÷ conc
```

The factor **0.06** converts mcg/min to mg/hr
(`60 min/hr ÷ 1000 mcg/mg = 0.06`).

**Calculated BAG (mL)** is the theoretical 24-hour order volume at the selected
concentration, *before* overfill and *before* practical compounding rounding. It
is a reference value, not the volume actually compounded.

---

## 3. Overfill

A fixed **15% overfill** is applied to the per-bag drug amount to account for
tubing priming and residual volume.

```
BAG with Overfill (mg) = Dose (mg/BAG) × 1.15
BAG with Overfill (mL) = BAG with Overfill (mg) ÷ conc
```

---

## 4. Infusion rate

```
Rate (mL/hr), exact   = Dose (mg/hr) ÷ conc
Rate (mL/hr), display = round(exact rate to nearest 0.1)
```

The **exact** (unrounded) rate is retained internally for all downstream volume
calculations; only the displayed rate is rounded to a tenth. This avoids
compounding rounding error through the volume math.

---

## 5. Minimum pump order

The minimum pump order covers the full bag interval plus a 4-hour buffer
(to bridge bag changes without interruption):

```
Minimum Pump Order (mL) = exact rate × (bagHours + 4)
Minimum Pump Order (mg) = Minimum Pump Order (mL) × conc
```

---

## 6. Final compounded dose (practical rounding)

The minimum pump order volume is rounded **up** to a practical compounding
increment so the compounded product is easy to prepare and check. The final mg
is then rounded up on the same increment scale.

### Increment scale

| Value (mL or mg) | Round-up increment |
|------------------|--------------------|
| < 50 | 5 |
| 50 – < 250 | 10 |
| ≥ 250 | 25 |

```
Final Compounded Dose (mL) = roundUp(Minimum Pump Order mL, increment(mL))
Final Compounded Dose (mg) = roundUp(Final mL × conc, increment(mg))
```

`roundUp(value, inc)` returns `value` unchanged if it is already an exact
multiple of `inc`; otherwise it returns the next multiple of `inc`.

---

## 7. Maximum infusion time

```
Max Time (minutes) = round( Final Compounded Dose mL ÷ exact rate × 60 )
Max Time (display) = HH:MM
```

This is how long the final compounded volume will run at the exact infusion
rate.

---

## 8. Smart-pump settings

| Field | Value | Meaning |
|-------|-------|---------|
| VOL | Final Compounded Dose (mL) | Total volume to be infused |
| ATBI | Minimum Pump Order (mL) | Minimum (bag interval + 4 hr buffer) volume |
| RATE | Rate (mL/hr) | Infusion rate |
| Max Time | bag change schedule, HH:MM | Programmed run time |
| KVO | Rate (mL/hr) | Keep-vein-open rate (= infusion rate) |

---

## 9. Reverse mode (dose + rate → weight)

When the dosing weight is not provided, the tool derives it from the running
infusion:

```
weight (kg) = ( hospital rate mL/hr × hospital conc mg/mL ) ÷ 0.06 ÷ dose mcg/kg/min
weight (lb) = weight kg × 2.20462
```

The derived weight then feeds the standard forward formulas in sections 2–8.

---

## 10. Rounding summary

- Displayed clinical values (mcg/min, mg/hr, mg/BAG, daily order, volumes,
  rate, mg amounts) are shown to **one decimal place**.
- The **exact** infusion rate (unrounded) is used internally for all volume and
  time math; rounding is applied only at display.
- Final compounded volume and mg are rounded **up** to practical compounding
  increments (section 6).
- Max Time is computed in whole minutes and displayed as HH:MM.

---

## 11. Privacy &amp; data handling (HIPAA posture)

This tool is designed so that patient-identifying information entered into it
**never leaves the browser tab it is typed into**. The following are enforced by
the application:

- **No storage.** The code contains no `localStorage`, `sessionStorage`,
  `indexedDB`, or cookies. Nothing is written to disk.
- **No transmission — browser-enforced.** A Content-Security-Policy meta tag sets
  `connect-src 'none'; form-action 'none'; default-src 'none'`, so the browser
  itself blocks any network request (fetch, XHR, beacon, WebSocket, form POST),
  even if code attempted one. There is also no `<form>` element.
- **No third parties.** No external scripts, stylesheets, fonts, images,
  analytics, or CDNs are loaded. The page is fully self-contained.
- **No indexing/archiving.** `robots: noindex, noarchive` and
  `referrer: no-referrer` are set.
- **Field hardening.** Patient, DOB, MRN, and Date fields use `autocomplete`,
  `autocorrect`, `autocapitalize`, and `spellcheck` off, plus password-manager
  ignore hints, and are read-only until focused.
- **Auto-clear.** Patient fields are cleared on reset and on the `pagehide` /
  `beforeunload` events (navigating away or closing the tab), and via a
  dedicated "Clear Patient Fields" button.

Patient identifiers therefore exist only transiently in page memory (the DOM)
for on-screen display and printing, and are gone when the page closes.

### What the application cannot control

Full HIPAA compliance is an organizational determination, not solely a property
of this software. Items outside the tool's control include:

- **Printing / Save-as-PDF.** If a user prints or saves to PDF, that output file
  contains the entered data and is the user's responsibility to safeguard.
- **Operating-system behavior.** OS memory paging/swap, clipboard, and browser
  process memory are outside any web page's control.
- **Institutional policy.** Use on a compliant device/network, workforce
  training, and risk assessment are the responsibility of the covered entity.

This section documents technical safeguards to support a privacy/compliance
review; it is not a certification of HIPAA compliance.

---

## 12. Worked example

Inputs: Milrinone, 0.5 mcg/kg/min, 100 kg, 48 hr bag change, 0.4 mg/mL.

| Step | Formula | Result |
|------|---------|--------|
| Dose (mcg/min) | 0.5 × 100 | 50 |
| Dose (mg/hr) | 50 × 0.06 | 3.0 |
| Dose (mg/BAG) | 3.0 × 48 | 144 |
| Daily Order (mg) | 3.0 × 24 | 72 |
| Calculated BAG (mL) | 72 ÷ 0.4 | 180 |
| BAG w/ overfill (mg) | 144 × 1.15 | 165.6 |
| BAG w/ overfill (mL) | 165.6 ÷ 0.4 | 414 |
| Exact rate (mL/hr) | 3.0 ÷ 0.4 | 7.5 |
| Min pump order (mL) | 7.5 × (48 + 4) | 390 |
| Min pump order (mg) | 390 × 0.4 | 156 |
| Final compounded (mL) | roundUp(390, 25) | 400 |
| Final compounded (mg) | roundUp(400 × 0.4, 10) | 160 |
| Max Time | 400 ÷ 7.5 × 60 min | 53:20 |

Pump settings: **VOL** 400 mL, **ATBI** 390 mL, **RATE** 7.5 mL/hr, **KVO** 7.5 mL/hr.

---

## Disclaimer

These methods are provided for transparency and independent verification. The
tool is a calculation aid for qualified healthcare professionals and does not
replace the clinical judgment of a licensed prescriber or pharmacist. Verify all
results before use.

*Author: Eric Holmes, PharmD — Samford University*
