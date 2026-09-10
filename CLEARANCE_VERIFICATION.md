# Geometry clearance verification

The three builds use rounded piecewise routes (`src/routing.js`) for wiring and coolant hoses. Unlike interpolating splines, the centerline stays inside the control-point hull. Allow additional room for the tube radius when defining a route.

Run the routing regression checks with:

```sh
node --test tests/routing.test.js
npm run build
```

In the browser, `window.__computer.clearance()` inspects the active build on demand. It never runs in the animation loop. `panelCrossings` raycasts sampled tube segments against the actual extruded case panels, including their holes. `cableContacts` and `bodyContacts` are bounding-box candidates for visual review, not exact solid intersection tests. Connector insertion, fan cable outlets, and PCIe edge contacts are intentional. Instanced details and transparent panels are not comprehensively tested by this diagnostic.

Validated after the clearance changes:

- All three builds: no detected tube centerline crossings through extruded case panels.
- All exposed electrical connector seating checks pass; 61 / 44 / 12 connection records respectively.
- All 9 / 13 / 10 component selections isolate and restore correctly; build switching and orbit/zoom remain functional.
- Third-build mobile selection and hover checks pass; no browser errors.
- Third-build rendering remains at 128 draw calls in the tested desktop view.

Changes include A21 header/VRM separation; Hyperion PSU/base/shroud clearance and rear wiring access; Turret GPU/HDD separation, EPS access, and front/controller cable routing. These checks are regression aids, not a guarantee that every decorative mesh is collision-free at every angle.
