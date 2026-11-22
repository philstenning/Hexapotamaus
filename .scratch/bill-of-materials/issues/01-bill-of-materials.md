# 01 — Bill of materials for builders

Status: needs-triage
Type: AFK (once the parts list settles; links come from the owner)

## What to build

A bill of materials that lets anyone else build a Hexapotamaus: every bought part, the quantity one robot needs, and a link to where to buy it (Amazon or wherever the owner bought it), plus the printed parts.

- **Bought parts:** item, model, quantity per robot (and per leg, for the single-leg milestone), purchase link, rough price, notes on substitutes.
- **Printed parts:** each file in `hardware/3d-parts/`, how many to print, material (PLA, or TPU for the foot tip), and the screws each needs.
- **Fasteners:** M3 screws by length, T-slot nuts, and so on, counted from the CAD.
- The BOM is separate from `docs/hardware/inventory.md`: the inventory is what the owner has, and the BOM is what one build needs.

## Acceptance criteria

- [ ] A BOM file exists in `docs/hardware/` listing every bought part with its quantity and a purchase link.
- [ ] Printed parts are listed with their counts and materials, matching `hardware/3d-parts/`.
- [ ] Fastener counts come from the CAD.
- [ ] The readme links to the BOM.

## Blocked by

None, but it fills in as parts are confirmed. Add purchase links to the inventory as each part arrives, so the BOM can be built from them.

## Comments

2026-11-22: Owner asked for this. Purchase links for the SH-C31A adapter and the SN65HVD230 boards are now in the inventory.
