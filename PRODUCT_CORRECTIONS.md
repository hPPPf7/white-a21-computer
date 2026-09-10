# Cooler and LCD fan corrections

## WHITE A21 — Apexgaming NANCOOL PRO 240 WHITE

References:
- [Apexgaming official product](https://www.apexgaming.info/products/apexgaming-nancool-240-pro-white-argb-cpu-liquid-cooler)
- [Taiwan distributor listing](https://www.fmf.com.tw/?func=ProductsDetail&module=mall&parent_id=0&prod_id=876)
- User-supplied product close-up and actual installation photograph (not included in the public repository).

The product name is NANCOOL. The previous circular pump face and CPU text on the cooler have been removed. The replacement has a clipped-square white housing, dark recessed mirror well, nested illuminated square frames, a modeled central emblem, side triangular lighting, bezel and glass surface. Mirror depth is approximated with layered geometry, without an extra reflection render pass.

The two braided hoses now leave the left side of the pump and loop beneath its face toward fittings under the right radiator end tank. Both fitting endpoints are included in connection seating verification.

## ROG HYPERION — Lian Li UNI FAN TL LCD Wireless

Reference: [Lian Li official TL Wireless product page](https://lian-li.com/product/uni-fan-tl-wireless/).

The LCD is a 1.6-inch circular display. All four modeled LCD fans (the three-fan pack and rear single fan) now use circular display geometry, solid cylindrical hub housings, recessed bezel backing, a machined perimeter and circular protective glass. The temperature remains a labeled display demonstration, not a sensor reading. Component inspection cameras face the display side of each installation.

## Validation

- Production build and routing unit tests.
- Browser checks for all three builds, all 32 component selections, restore, orbit and zoom.
- Connection seating, major tube clearances and case panel crossing checks across three builds.
- Visual inspection of the installed cooler, isolated mirror head, and LCD fans from front and oblique angles.

The clearance checks sample modeled geometry; they are regression checks rather than an exhaustive physical assembly simulation.

## Case roof closure

All three cases previously had a floating dust-filter plane without a complete surrounding roof. Each now has a continuous, thick steel deck with real ventilation apertures, a fine mesh filter, perimeter binding and a lift tab. The Hyperion filter footprint stops before its I/O strip. The rectangular perforation pattern is a procedural approximation, not manufacturer CAD.

References: [ASUS A21 service manual](https://dlcdnets.asus.com/pub/ASUS/ODD/DC/A21/A21_R2R_Manual.pdf?model=A21), [Hyperion upper filter assembly](https://www.asus.com/uk/support/faq/1051497/), [COUGAR TURRET RGB](https://cougargaming.com/products/cases/turret_rgb/).

Verified assembled and isolated case views from above, all 32 component selections, 117 seated connections and zero reported major tube or panel crossings. The roof adds two draw calls per build; fine filter strands share a texture rather than individual geometry.

## TURRET rear motherboard I/O

Replaced the four generic recessed connector blocks with the X470 GAMING PRO CARBON non-AC rear I/O layout: two USB 2.0, four USB 3.1 Gen1, Gen2 Type-A and Type-C, PS/2, DisplayPort, HDMI, LAN, Clear CMOS, five audio jacks and optical S/PDIF. Added a fitted shield with individual through-apertures, a rolled rim, metal socket walls, recessed contacts and connector tongues. Optional AC-model antenna sockets are omitted. Small connector profiles are simplified procedural geometry.

The case I/O opening now matches the shield dimensions and the adjacent rear exhaust opening is separated from it. Source: [MSI manual, rear I/O panel, page 25](https://download-2.msi.com/archive/mnu_exe/mb/X470GAMINGPROCARBON_X470GAMINGPROCARBONAC.pdf).

Validated close-up and assembled rear views, all 19 port/button centerlines against the shield and case opening (zero obstructions), motherboard isolation/restore, and the existing three-build connection and clearance regression checks.

## WHITE A21 and ROG HYPERION complete rear panels

Replaced generic or missing motherboard I/O with model-specific shields and recessed sockets. B760M-PLUS WIFI has eight rear USB ports, HDMI/DisplayPort, 2.5Gb LAN, antenna connectors, five audio jacks and optical S/PDIF. X870E GODLIKE has eight USB-A plus seven USB-C ports, 10Gb/5Gb LAN, antenna connectors, Flash BIOS/Clear CMOS/Smart buttons, two audio jacks and optical S/PDIF. Port types and counts follow the manufacturer documentation; small shapes, spacing and internal enclosure depth are procedural approximations fitted to this scene.

Both GPUs now have four individually opened video sockets and a vented bracket fitted to the occupied expansion slots. Blank covers in occupied slots were removed. Both PSUs have vented rear panels, recessed mains inlets with three metal blades and rocker switches. Removed the old solid PSU rear faces, and corrected the case openings so they do not cover the motherboard, graphics or PSU ports.

Sources: [ASUS B760M-PLUS WIFI specifications](https://www.asus.com/us/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b760m-plus-wifi/techspec/), [MSI X870E GODLIKE manual, pages 25–26](https://download.msi.com/archive/mnu_exe/mb/MEGX870EGODLIKE_English.pdf), [GIGABYTE AERO specifications](https://www.gigabyte.com/uk/Graphics-Card/GV-N407SAERO-OC-12GD/sp).

Verification covers all 75 modeled rear motherboard/GPU/PSU port and button centerlines across the three builds (zero shield or case obstructions), assembled rear views, component isolation/restore and existing routing regression checks. The third build's existing rear I/O was retained. These visual models do not simulate electrical operation.
