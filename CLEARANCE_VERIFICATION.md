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

## Smooth routing and conductor bundles

The route helper now allows a larger, configurable bend radius (0.55 / 0.65 for the two AIO builds). Paired CPU hoses retain separation throughout their arcs rather than converging at intermediate waypoints. The Turret has layered rear cable runs, a shorter paired GPU power loop, and separate controller entry points. Its 24-pin / EPS / GPU wiring uses individual parallel-transported strands merged into one mesh per cable; the desktop draw-call count remains 128 (about 56k triangles).

The on-demand diagnostic additionally reports `tubeContacts` for sampled pairs involving a main hose or power bundle (radius at least 0.03 model units). It excludes luminous overlays/internal GPU heatpipes, near-endpoint samples, and the shared outlet region; it is not a complete collision solver for all thin wires. Bundle checks use the enclosing route radius. All three builds passed this main-route proximity check and the panel-crossing check after rerouting. Intentional cable entries into fan frames/controllers remain in the bounding-box candidate report.
