# Inotrope Compounding Worksheet

A free, browser-based IV inotrope (dobutamine & milrinone) dosing and compounding
calculator for pharmacists. It runs **entirely in your browser** — no server, no
account, and no patient data is ever stored or transmitted.

**Live tool:** https://dresquire.github.io/inotrope-worksheet/

## Features

- Dobutamine and milrinone dosing with usual-adult-range dose checking
- Forward calculation (dose + weight) and reverse calculation (dose + rate → weight)
- Bag/overfill, minimum pump order, and practical final compounded dose rounding
- Smart-pump settings output (VOL, ATBI, RATE, Max Time, KVO)
- USP <797> 2024 beyond-use dating reference
- Print-friendly worksheet with pharmacist signature lines
- Patient-identifying fields are print-only and auto-cleared — never saved or uploaded

## Privacy

All computation happens client-side. The page uses no analytics, no cookies, and no
local storage. Patient, DOB, and MRN fields are read-only until focused and are cleared
when the page is closed or reset.

## Disclaimer

For use by qualified healthcare professionals. This tool is a calculation aid and does
**not** replace the clinical judgment of a licensed prescriber or pharmacist. Verify all
results independently before use.

## Author

Eric Holmes, PharmD — Samford University

## License

MIT — see [LICENSE](LICENSE).
