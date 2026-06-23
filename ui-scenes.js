// Reusable animated scene components for first-session and status surfaces.

function renderPixelPrinterUnit(index = 1) {
  return `<div class="pixel-printer printer-${index}" aria-hidden="true">
    <span class="pixel-spool"></span>
    <span class="pixel-gantry-rail"></span>
    <span class="pixel-gantry-wire"></span>
    <span class="pixel-printer-frame top"></span>
    <span class="pixel-printer-frame left"></span>
    <span class="pixel-printer-frame right"></span>
    <span class="pixel-printer-bed"></span>
    <span class="pixel-print-head"></span>
    <span class="pixel-nozzle"></span>
    <span class="pixel-filament"></span>
    <span class="pixel-print-object">
      <span></span><span></span><span></span><span></span>
    </span>
    <span class="pixel-ready-crate"></span>
    <span class="pixel-spark spark-a"></span>
    <span class="pixel-spark spark-b"></span>
  </div>`;
}

function renderFabPixelScene(fab = state.fabs[0], options = {}) {
  const sceneFabs = Array.isArray(options.fabs) ? options.fabs.filter(Boolean).slice(0, MAX_ACTIVE_FABS) : [];
  const representativeFab = sceneFabs[0] || fab || { type: "starter", printPattern: defaultPrintPattern("starter") };
  const definition = fabDefinition(representativeFab?.type || "starter");
  const pattern = printPatternForFab(representativeFab);
  const storedMass = Number(sceneFabs.reduce((sum, cityFab) => sum + Number(cityFab.grams || 0), 0) || representativeFab?.grams || 0);
  const bayCount = Math.max(1, Math.min(MAX_ACTIVE_FABS, Number(options.fabCount || sceneFabs.length || 1)));
  const readyCount = Number(options.readyCount || 0);
  const hasFab = sceneFabs.length > 0 || Boolean(fab);
  const sceneState = options.state || (readyCount ? "ready" : hasFab ? "printing" : "idle");
  const label = options.label || definition.label;
  const patternText = options.patternText || (bayCount > 1 ? `${bayCount} active fabs` : pattern.label);
  const statusText = options.statusText
    || (sceneState === "blocked"
      ? "inventory full"
      : readyCount
        ? `${readyCount} sealed print${readyCount === 1 ? "" : "s"} ready`
        : storedMass
          ? `${storedMass.toFixed(1)}g staged`
          : sceneState === "idle"
            ? "idle"
            : "printing");
  const hudStats = Array.isArray(options.hudStats) && options.hudStats.length
    ? `<div class="pixel-scene-hud">${options.hudStats.map((stat) => `<span>${stat}</span>`).join("")}</div>`
    : "";
  const printers = Array.from({ length: bayCount }, (_, index) => renderPixelPrinterUnit(index + 1)).join("");
  return `<div class="pixel-scene fab-pixel-scene bay-count-${bayCount} ${options.compact ? "compact" : ""} state-${sceneState} ${readyCount ? "ready" : ""}" aria-label="${label} printing animation">
    ${hudStats}
    ${printers}
    <div class="pixel-scene-caption">
      <strong>${label}</strong>
      <span>${patternText} - ${statusText}</span>
    </div>
  </div>`;
}

function renderFabStaticTile(fab, queuedCount = 0, cardState = "printing") {
  const definition = fabDefinition(fab.type);
  const pattern = printPatternForFab(fab);
  const dotState = queuedCount ? "ready" : cardState === "blocked" ? "battery" : "printing";
  const statusLabel = queuedCount ? `${queuedCount} sealed` : cardState === "blocked" ? "Battery empty" : "Printing";
  const iconType = ["starter", "food", "vehicle", "aquatic", "boost", "nethack", "equipment"].includes(fab.type) ? fab.type : "generic";
  return `<div class="fab-static-tile state-${cardState}" aria-label="${definition.label} ${statusLabel}">
    <div class="fab-static-status">
      <span class="fab-status-dot ${dotState}"></span>
      <span>${statusLabel}</span>
    </div>
    <div class="fab-type-icon type-${iconType}" aria-hidden="true">
      <span class="fab-icon-core"></span>
      <span class="fab-icon-mark mark-a"></span>
      <span class="fab-icon-mark mark-b"></span>
    </div>
    <strong>${definition.label}</strong>
    <span>${pattern.label}</span>
  </div>`;
}

function renderRoutePixelScene(route = routeOptions(state.district)[0], options = {}) {
  const kind = route ? routeKind(route) : options.kind || "land";
  const fromName = options.fromName || currentDistrict().name;
  const toName = route ? districtById(route.to).name : options.toName || "Route";
  const water = kind === "water";
  return `<div class="pixel-scene route-pixel-scene ${water ? "sea" : "road"} ${options.compact ? "compact" : ""}" aria-label="${fromName} to ${toName} ${water ? "sea" : "road"} route animation">
    <div class="pixel-route-bg" aria-hidden="true">
      <span class="pixel-route-light light-a"></span>
      <span class="pixel-route-light light-b"></span>
      <span class="pixel-route-light light-c"></span>
    </div>
    <div class="pixel-lane" aria-hidden="true">
      <span class="pixel-vehicle vehicle-a"></span>
      <span class="pixel-vehicle vehicle-b"></span>
    </div>
    <div class="pixel-scene-caption">
      <strong>${fromName} -> ${toName}</strong>
      <span>${route ? `${routeDistance(route)} miles ${kind}` : `${kind} route`}</span>
    </div>
  </div>`;
}

function renderCityPixelScene(district, options = {}) {
  const city = district || currentDistrict();
  const sceneClass = `city-${city.id}`;
  return `<div class="pixel-scene city-pixel-scene ${sceneClass} ${options.compact ? "compact" : ""}" aria-label="${city.name} city animation">
    <div class="city-pixel-sky" aria-hidden="true">
      <span class="city-moon"></span>
      <span class="city-signal signal-a"></span>
      <span class="city-signal signal-b"></span>
    </div>
    <div class="city-pixel-buildings" aria-hidden="true">
      <span></span><span></span><span></span><span></span>
    </div>
    <div class="city-pixel-scenelet" aria-hidden="true">
      <span class="city-crane"></span>
      <span class="city-awning"></span>
      <span class="city-container container-a"></span>
      <span class="city-container container-b"></span>
      <span class="city-neon-sign"></span>
      <span class="city-walker walker-a"></span>
      <span class="city-walker walker-b"></span>
      <span class="city-rain rain-a"></span>
      <span class="city-rain rain-b"></span>
    </div>
    <div class="pixel-scene-caption">
      <strong>${city.name}</strong>
      <span>${city.id === "chrome-pier" ? "container bazaars and dockside chop shops" : city.id === "orchid" ? "rain-shield markets and bootleg labels" : city.description}</span>
    </div>
  </div>`;
}
