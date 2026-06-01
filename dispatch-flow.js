(function installDispatchFlow() {
  if (typeof window.dispatchWizardControls === "function") {
    render();
    return;
  }

  function routeRoleActive(role = state.role) {
    return role === "merchant" || role === "routejack";
  }

  function dispatchStepsForRole(role = state.role) {
    if (role === "merchant") {
      return [
        { id: "route", label: "Route" },
        { id: "vehicle", label: "Convoy" },
        { id: "cargo", label: "Cargo" },
        { id: "confirm", label: "Launch" },
      ];
    }
    if (role === "routejack") {
      return [
        { id: "route", label: "Route" },
        { id: "vehicle", label: "Convoy" },
        { id: "tactic", label: "Tactic" },
        { id: "confirm", label: "Launch" },
      ];
    }
    return [];
  }

  function currentDispatchStep() {
    const steps = dispatchStepsForRole();
    if (!steps.length) return "route";
    if (!steps.some((step) => step.id === state.dispatchStep)) state.dispatchStep = steps[0].id;
    return state.dispatchStep;
  }

  function dispatchWizardStepper(canAdvance = true) {
    const steps = dispatchStepsForRole();
    const current = currentDispatchStep();
    const currentIndex = steps.findIndex((step) => step.id === current);
    return `<div class="dispatch-stepper" aria-label="Dispatch steps">
      ${steps.map((step, index) => `<button type="button" data-dispatch-step="${step.id}" class="${step.id === current ? "active" : index < currentIndex ? "complete" : ""}" ${index > currentIndex + 1 || (index > currentIndex && !canAdvance) ? "disabled" : ""}>
        <span>${index + 1}</span>
        <strong>${step.label}</strong>
      </button>`).join("")}
    </div>`;
  }

  function dispatchWizardControls({ canAdvance = true, canLaunch = false, launchAction = "" } = {}) {
    const steps = dispatchStepsForRole();
    const step = currentDispatchStep();
    const index = steps.findIndex((entry) => entry.id === step);
    const isLast = index === steps.length - 1;
    return `<div class="dispatch-wizard-controls">
      <button type="button" data-dispatch-step-back ${index <= 0 ? "disabled" : ""}>Back</button>
      <button type="button" data-dispatch-step-next ${isLast ? "hidden" : ""} ${canAdvance ? "" : "disabled"}>Next</button>
      <button type="button" data-action="${launchAction}" ${isLast ? "" : "hidden"} ${canLaunch ? "" : "disabled"}>${state.role === "routejack" ? "Launch Raid" : "Send Shipment"}</button>
    </div>`;
  }

  window.routeRoleActive = routeRoleActive;
  window.dispatchStepsForRole = dispatchStepsForRole;
  window.currentDispatchStep = currentDispatchStep;
  window.dispatchWizardStepper = dispatchWizardStepper;
  window.dispatchWizardControls = dispatchWizardControls;

  const baseRenderProfileCommandDeck = renderProfileCommandDeck;
  renderProfileCommandDeck = function renderProfileCommandDeckOverride() {
    const html = baseRenderProfileCommandDeck();
    if (routeRoleActive()) return html;
    return html.replace(
      '<button type="button" data-view="shipments">Dispatch</button>',
      '<button type="button" data-view="profession">Roles</button>',
    );
  };

  renderCargoDispatchForm = function renderCargoDispatchFormWizard() {
    const canShipByRole = state.role === "merchant";
    const cityName = currentDistrict().name;
    const shippableCargo = shippableItemsIn(state.district);
    const routes = routeOptions(state.district);
    if (routes.length && !routeTo(state.district, state.shipmentDestination)) state.shipmentDestination = routes[0].to;
    if (shippableCargo.length && !shippableCargo.some(({ item }) => item.name === state.shipmentCargo)) state.shipmentCargo = shippableCargo[0].item.name;
    const cargoQuery = (state.dispatchCargoSearch || "").trim().toLowerCase();
    const destinationOptions = routes.map((route) => `<option value="${route.to}">${route.district.name}</option>`).join("");
    const selectedRoute = routeTo(state.district, state.shipmentDestination) || routes[0];
    const routeVehicles = vehicleItemsIn(state.district).filter(({ item }) => vehicleCanUseRoute(item, selectedRoute));
    if (routeVehicles.length && !routeVehicles.some(({ item }) => item.name === state.shipmentVehicle)) state.shipmentVehicle = routeVehicles[0].item.name;
    const selectedVehicle = itemByName(state.shipmentVehicle);
    const selectedVehicleCapacity = selectedVehicle?.category === "vehicle" ? Math.max(1, Number(selectedVehicle.capacity || 1)) : 0;
    const escortVehicles = routeVehicles.filter(({ item, count }) => item.name !== selectedVehicle?.name || count > 1);
    if (state.shipmentEscort !== "none" && !escortVehicles.some(({ item }) => item.name === state.shipmentEscort)) state.shipmentEscort = "none";
    const selectedEscort = state.shipmentEscort !== "none" ? itemByName(state.shipmentEscort) : null;
    const cargoMatches = shippableCargo
      .filter(({ item }) => !cargoQuery
        || item.name.toLowerCase().includes(cargoQuery)
        || (rarityMeta[item.rarity]?.label || "").toLowerCase().includes(cargoQuery)
        || (item.category || "").toLowerCase().includes(cargoQuery)
        || (item.type || "").toLowerCase().includes(cargoQuery))
      .sort((a, b) => {
        if (a.item.name === state.shipmentCargo) return -1;
        if (b.item.name === state.shipmentCargo) return 1;
        return rarityRank(b.item) - rarityRank(a.item) || a.item.name.localeCompare(b.item.name);
      });
    const visibleCargo = cargoMatches.slice(0, 12);
    const loadedCargo = shipmentCargoLoadEntries(state.district, selectedVehicleCapacity || Infinity);
    const loadedCargoMap = new Map(loadedCargo.map((entry) => [entry.name, entry.qty]));
    const loadedUnits = shipmentCargoLoadUnits(loadedCargo);
    const primaryCargo = loadedCargo[0] ? itemByName(loadedCargo[0].name) : null;
    const hiddenCargoInputs = loadedCargo
      .map((entry) => `<input type="hidden" data-ship-cargo="${entry.name}" value="${entry.qty}">`)
      .join("");
    const cargoManifest = loadedCargo.length
      ? loadedCargo.map((entry) => `${entry.qty}x ${entry.name}`).join(", ")
      : "No cargo loaded";
    const cargoPickerRows = visibleCargo.map(({ item, count }) => {
      const localBid = highestBid(state.district, item.name);
      const loadedQty = loadedCargoMap.get(item.name) || 0;
      const canAdd = loadedUnits < selectedVehicleCapacity && loadedQty < count;
      return `<div class="cargo-pick ${loadedQty ? "active" : ""}">
        <button type="button" class="cargo-pick-main" data-cargo-pick="${item.name}">
          <span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span>
          <em>x${count}${localBid ? ` - bid ${formatCredits(localBid.price)}` : ""}</em>
        </button>
        <span class="cargo-load-controls">
          <button type="button" data-cargo-load="${item.name}" data-cargo-load-delta="-1" ${loadedQty <= 0 ? "disabled" : ""}>-</button>
          <strong>${loadedQty}</strong>
          <button type="button" data-cargo-load="${item.name}" data-cargo-load-delta="1" ${canAdd ? "" : "disabled"}>+</button>
        </span>
      </div>`;
    }).join("");
    const selectedTravelHours = selectedRoute && selectedVehicle?.category === "vehicle"
      ? routeTravelHours(selectedRoute, selectedVehicle, currentRole().shipmentSpeedBonus || 0)
      : null;
    const freightEstimate = selectedRoute && selectedVehicle?.category === "vehicle" && loadedCargo.length
      ? merchantFreightPayout({
        from: state.district,
        to: selectedRoute.to,
        cargos: loadedCargo,
        cargoUnits: loadedUnits,
        capacity: selectedVehicleCapacity,
        routeMiles: routeDistance(selectedRoute),
        profession: "merchant",
      })
      : null;
    const likelyRaider = selectedRoute
      ? allVehicleItems().find((item) => item.vehicleClass === "interceptor" && vehicleCanUseRoute(item, selectedRoute)) || allVehicleItems().find((item) => vehicleCanUseRoute(item, selectedRoute))
      : null;
    const battleSettings = likelyRaider && selectedVehicle && primaryCargo
      ? routeBattleSettings({
        from: state.district,
        to: selectedRoute.to,
        attackerVehicle: likelyRaider.name,
        defenderVehicle: selectedVehicle.name,
        defenderEscort1: selectedEscort?.name || "none",
        cargo: primaryCargo.name,
        cargoUnits: Math.max(1, loadedUnits || 1),
        attackerRole: "routejack",
        defenderRole: "merchant",
        attackerTactic: "snatch",
        defenderTactic: selectedEscort ? "protect" : "evade",
      })
      : null;
    const defenders = battleSettings ? makeBattleTeams(battleSettings, selectedRoute).defenders : [];
    const defenderSummary = defenders.length ? defenders.map((unit) => `${unit.role}: ${unit.name}`).join(" + ") : "Load cargo and choose a vehicle";
    const previewShipment = selectedRoute && selectedVehicle ? {
      from: state.district,
      to: selectedRoute.to,
      vehicle: selectedVehicle.name,
      cargos: loadedCargo.length ? loadedCargo : [{ name: "Common Starter Component A", qty: 1 }],
      cargoUnits: loadedUnits || 1,
      capacity: selectedVehicleCapacity || 1,
      escortVehicle: selectedEscort?.name || null,
      profession: "merchant",
    } : null;
    const encounterPreview = previewShipment ? routeEncounterHourlyChance(previewShipment, selectedRoute) : null;
    const canShipSelected = canShipByRole && loadedUnits > 0 && loadedUnits <= selectedVehicleCapacity && routeVehicles.length && destinationOptions && selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, selectedRoute);
    const step = currentDispatchStep();
    const stepComplete = {
      route: Boolean(selectedRoute),
      vehicle: Boolean(selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, selectedRoute)),
      cargo: Boolean(loadedUnits > 0 && loadedUnits <= selectedVehicleCapacity),
      confirm: canShipSelected,
    };
    const stepBody = {
      route: `<section class="dispatch-wizard-step">${renderRoutePixelScene(selectedRoute, { compact: false })}
        <div class="card-row"><h3>Choose Route</h3><span class="pill">${cityName}</span></div>
        ${dispatchRouteCards(routes, state.shipmentDestination, "data-ship-destination", selectedVehicle)}
      </section>`,
      vehicle: `<section class="dispatch-wizard-step">
        <div class="card-row"><h3>Choose Vehicle</h3><span class="pill">${selectedVehicleCapacity || 0} cargo slots</span></div>
        ${dispatchVehicleCards(routeVehicles, state.shipmentVehicle, "data-ship-vehicle", "No compatible vehicles")}
        <div class="dispatch-builder-section subtle">
          <div class="card-row"><h3>Escort</h3><span class="pill">${selectedEscort ? "guarded" : "optional"}</span></div>
          <div class="dispatch-choice-grid vehicle-choice-grid">
            ${dispatchNoneCard(state.shipmentEscort === "none", "data-ship-escort", "No Escort")}
            ${escortVehicles.length ? dispatchVehicleCards(escortVehicles, state.shipmentEscort, "data-ship-escort", "No escort vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "") : ""}
          </div>
        </div>
      </section>`,
      cargo: `<section class="dispatch-wizard-step cargo-load-panel">
        <div class="card-row"><h3>Load Cargo</h3><span class="pill">${loadedUnits}/${selectedVehicleCapacity || 0} slots</span></div>
        <label class="search-field cargo-search"><span>Find Cargo</span><input id="dispatchCargoSearch" type="search" value="${state.dispatchCargoSearch}" placeholder="Search local inventory"></label>
        ${hiddenCargoInputs}
        <div class="cargo-picker-grid">${cargoPickerRows || `<p class="muted">No cargo matches.</p>`}</div>
        <div class="cargo-load-row selected-cargo-row"><span>${cargoManifest}</span><em>${selectedVehicleCapacity ? `${Math.max(0, selectedVehicleCapacity - loadedUnits)} slots open` : "Choose vehicle"}</em></div>
      </section>`,
      confirm: `<section class="dispatch-wizard-step">
        <div class="card-row"><h3>Ready To Launch</h3><span class="pill">${selectedRoute ? `${routeDistance(selectedRoute)}mi ${routeKind(selectedRoute)}` : "No route"}</span></div>
        <div class="dispatch-summary-strip">
          <div class="side-metric"><span>Route</span><strong>${selectedRoute ? `${currentDistrict().name} -> ${districtById(selectedRoute.to).name}` : "No route"}</strong></div>
          <div class="side-metric"><span>Travel</span><strong>${selectedTravelHours ? formatRouteTime(selectedTravelHours) : "No route"}</strong></div>
          <div class="side-metric"><span>Cargo</span><strong>${loadedUnits ? `${loadedUnits}/${selectedVehicleCapacity} slots` : "None"}</strong></div>
          <div class="side-metric"><span>Freight Pay</span><strong>${freightEstimate ? formatCredits(freightEstimate) : "No cargo"}</strong></div>
          <div class="side-metric"><span>Profile</span><strong>${selectedVehicle?.category === "vehicle" ? `${profileBand(vehicleProfileScore(selectedVehicle))} (${vehicleProfileScore(selectedVehicle)})` : "No vehicle"}</strong></div>
          <div class="side-metric"><span>Encounter</span><strong>${encounterPreview !== null ? `${encounterPreview}%/hr` : "Unknown"}</strong></div>
        </div>
        <div class="battle-convoy-preview compact">
          <div class="card-row"><strong>Convoy Readiness</strong><span class="pill">${selectedVehicle?.name || "No vehicle"}</span></div>
          <p class="muted">${cargoManifest}. ${defenderSummary}.</p>
        </div>
      </section>`,
    }[step];
    return `<div class="shipment-form dispatch-wizard cargo-dispatch-form">
      ${dispatchWizardStepper(stepComplete[step])}
      ${stepBody}
      ${dispatchWizardControls({ canAdvance: stepComplete[step], canLaunch: canShipSelected, launchAction: "create-shipment" })}
    </div>`;
  };

  renderRoutejackDispatchForm = function renderRoutejackDispatchFormWizard() {
    const routes = routeOptions(state.district);
    const selectedPvpRoute = routeTo(state.district, state.pvpRoute)?.to || routes[0]?.to;
    if (selectedPvpRoute && state.pvpRoute !== selectedPvpRoute) state.pvpRoute = selectedPvpRoute;
    const selectedRoute = routeTo(state.district, state.pvpRoute) || routes[0];
    const availableVehicles = vehicleItemsIn(state.district).filter(({ item }) => vehicleCanUseRoute(item, selectedRoute));
    const preferredLead = availableVehicles.find(({ item }) => item.vehicleClass === "interceptor") || availableVehicles[0];
    const selectedPvpVehicle = availableVehicles.some(({ item }) => item.name === state.pvpVehicle) ? state.pvpVehicle : preferredLead?.item.name;
    if (selectedPvpVehicle && state.pvpVehicle !== selectedPvpVehicle) state.pvpVehicle = selectedPvpVehicle;
    const vehicleCountInCity = (name) => availableVehicles.find(({ item }) => item.name === name)?.count || 0;
    const supportIsAvailable = (name, prior = []) => {
      if (!name || name === "none") return true;
      return vehicleCountInCity(name) > prior.filter((priorName) => priorName === name).length;
    };
    if (!supportIsAvailable(state.pvpSupport1, [state.pvpVehicle])) state.pvpSupport1 = "none";
    if (!supportIsAvailable(state.pvpSupport2, [state.pvpVehicle, state.pvpSupport1])) state.pvpSupport2 = "none";
    const supportEntries = (selected, prior = []) => availableVehicles.filter(({ item }) => supportIsAvailable(item.name, prior) || item.name === selected);
    const selectedVehicle = itemByName(state.pvpVehicle);
    const routejackPreviewRun = { vehicle: selectedVehicle?.name, support1: state.pvpSupport1, support2: state.pvpSupport2 };
    const patrolCapacity = selectedVehicle?.category === "vehicle" ? routeRunCapacity(routejackPreviewRun) : 0;
    const patrolHours = selectedRoute && selectedVehicle?.category === "vehicle" ? routeTravelHours(selectedRoute, selectedVehicle) : 0;
    const routejackPreview = selectedRoute && selectedVehicle?.category === "vehicle" ? {
      kind: "intercept",
      from: state.district,
      to: selectedRoute.to,
      vehicle: selectedVehicle.name,
      support1: state.pvpSupport1,
      support2: state.pvpSupport2,
      loot: [],
      lootPolicy: state.pvpLootPolicy,
      capacity: patrolCapacity,
    } : null;
    const encounterEstimate = routejackPreview ? routeEncounterHourlyChance(routejackPreview, selectedRoute) : null;
    const canLaunch = routes.length && availableVehicles.length && selectedVehicle?.category === "vehicle";
    const step = currentDispatchStep();
    const convoySupport = `<div class="dispatch-builder-section subtle">
      <div class="card-row"><h3>Support Vehicles</h3><span class="pill">optional</span></div>
      <div class="dispatch-choice-grid vehicle-choice-grid">${dispatchNoneCard(state.pvpSupport1 === "none", "data-raid-support-1", "No Support 1")}${dispatchVehicleCards(supportEntries(state.pvpSupport1, [state.pvpVehicle]), state.pvpSupport1, "data-raid-support-1", "No support vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "")}</div>
      <div class="dispatch-choice-grid vehicle-choice-grid">${dispatchNoneCard(state.pvpSupport2 === "none", "data-raid-support-2", "No Support 2")}${dispatchVehicleCards(supportEntries(state.pvpSupport2, [state.pvpVehicle, state.pvpSupport1]), state.pvpSupport2, "data-raid-support-2", "No support vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "")}</div>
    </div>`;
    const tacticChoices = `<div class="dispatch-choice-grid tactic-choice-grid">${Object.entries(battleAttackerTactics).map(([id, label]) => dispatchChoiceCard({
      active: state.routejackTactic === id,
      attr: `data-routejack-tactic-choice="${id}"`,
      title: label,
      meta: id === "disable" ? "Safer vs escorts" : id === "scramble" ? "Press speed" : "Fastest steal",
      detail: id === "snatch" ? "Focus cargo first" : id === "disable" ? "Clear protection before cargo" : "Target fast units",
      iconName: id === "snatch" ? "chip" : id === "disable" ? "tool" : "data",
      rarity: id === "disable" ? "gold" : id === "scramble" ? "blue" : "green",
    })).join("")}</div>`;
    const lootChoices = `<div class="dispatch-choice-grid tactic-choice-grid">${dispatchChoiceCard({ active: state.pvpLootPolicy === "upgrade", attr: 'data-loot-policy-choice="upgrade"', title: "Upgrade Loot", meta: "Replace weak finds", detail: "Dump lower rarity cargo for better cargo", iconName: "lens", rarity: "blue" })}${dispatchChoiceCard({ active: state.pvpLootPolicy === "first", attr: 'data-loot-policy-choice="first"', title: "Fill Hold", meta: "Keep first haul", detail: "Stop swapping once cargo is loaded", iconName: "poly", rarity: "green" })}</div>`;
    const stepComplete = {
      route: Boolean(selectedRoute),
      vehicle: Boolean(selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, selectedRoute)),
      tactic: Boolean(state.routejackTactic && state.pvpLootPolicy),
      confirm: canLaunch,
    };
    const stepBody = {
      route: `<section class="dispatch-wizard-step">${renderRoutePixelScene(selectedRoute, { compact: false })}<div class="card-row"><h3>Choose Raid Route</h3><span class="pill">${currentDistrict().name}</span></div>${dispatchRouteCards(routes, state.pvpRoute, "data-raid-route", selectedVehicle)}</section>`,
      vehicle: `<section class="dispatch-wizard-step"><div class="card-row"><h3>Choose Convoy</h3><span class="pill">${patrolCapacity} loot slots</span></div>${dispatchVehicleCards(availableVehicles, state.pvpVehicle, "data-raid-vehicle", "No compatible raid vehicles")}${convoySupport}</section>`,
      tactic: `<section class="dispatch-wizard-step"><div class="card-row"><h3>Set Raid Plan</h3><span class="pill">${battleAttackerTactics[state.routejackTactic] || "Hit Cargo First"}</span></div>${tacticChoices}<div class="dispatch-builder-section subtle"><div class="card-row"><h3>Loot Hold</h3><span class="pill">${patrolCapacity} slots</span></div>${lootChoices}</div></section>`,
      confirm: `<section class="dispatch-wizard-step"><div class="card-row"><h3>Ready To Launch</h3><span class="pill">${selectedRoute ? `${routeDistance(selectedRoute)}mi ${routeKind(selectedRoute)}` : "No route"}</span></div><div class="dispatch-summary-strip"><div class="side-metric"><span>Route</span><strong>${selectedRoute ? `${currentDistrict().name} -> ${districtById(selectedRoute.to).name}` : "No route"}</strong></div><div class="side-metric"><span>Raid Time</span><strong>${patrolHours ? formatRouteTime(patrolHours) : "No route"}</strong></div><div class="side-metric"><span>Convoy</span><strong>${[selectedVehicle?.name, state.pvpSupport1, state.pvpSupport2].filter((name) => name && name !== "none").join(" + ") || "No vehicles"}</strong></div><div class="side-metric"><span>Capacity</span><strong>${patrolCapacity || "Need vehicle"}</strong></div><div class="side-metric"><span>Targets</span><strong>${encounterEstimate !== null ? `${encounterEstimate}%/hr` : "Need route"}</strong></div><div class="side-metric"><span>Sensor</span><strong>${selectedVehicle?.category === "vehicle" ? vehicleSensorScore(selectedVehicle) : "No vehicle"}</strong></div></div></section>`,
    }[step];
    return `<div class="shipment-form dispatch-wizard routejack-builder">${dispatchWizardStepper(stepComplete[step])}${stepBody}${dispatchWizardControls({ canAdvance: stepComplete[step], canLaunch, launchAction: "attempt-intercept" })}</div>`;
  };

  routeCommandPanel = function routeCommandPanelWizard() {
    const rolePanel = {
      merchant: renderCargoDispatchForm(),
      routejack: renderRoutejackDispatchForm(),
    }[state.role] || `<div class="empty-guidance">
        <h3>No Route Role Active</h3>
        <p class="muted">Dispatch is available to Merchants and Routejacks. Drifters and Fabricators can still print, trade, and fuse without route jobs.</p>
        <div class="button-row"><button type="button" data-view="profession">Choose Role</button></div>
      </div>`;
    const activeForRole = state.shipments.filter((shipment) => (shipment.status === "in-transit" || shipment.status === "blocked") && dispatchJobMatchesRole(shipment)).length;
    const scannerActive = hasActiveScanner();
    const scannerSection = scannerActive ? `<div class="card-row"><h3>Route Intel</h3><span class="pill">Scanner</span></div>${renderScannerIntelPanel(scannerActive)}` : "";
    const roleCopy = state.role === "merchant"
      ? "Load cargo, choose a vehicle, and earn freight when it arrives."
      : state.role === "routejack"
        ? "Build a raid convoy against NPC merchant targets."
        : "Choose a route role to unlock dispatch work.";
    return `<section class="panel dispatch-command-panel role-${state.role}">
      <div class="blueprint-head"><div><h2>${state.role === "routejack" ? "Raid Dispatch" : state.role === "merchant" ? "Cargo Dispatch" : "Dispatch Board"}</h2><p class="muted">${currentDistrict().name}. ${roleCopy}</p></div><span class="pill">${currentRole().label}</span></div>
      ${renderDispatchNotice()}
      <div class="dispatch-summary-strip compact-dispatch-stats">
        <div class="side-metric"><span>Active Jobs</span><strong>${activeForRole}</strong></div>
        <div class="side-metric"><span>Storage</span><strong>${inventoryLabel(state.district)}</strong></div>
        ${scannerActive ? `<div class="side-metric"><span>Scanner</span><strong>${rarityMeta[state.routeScanQuality]?.label || "Active"} ${formatPower((state.routeScanUntil - Date.now()) / 1000)}</strong></div>` : ""}
      </div>
      <div class="dispatch-role-layout">
        <section class="dispatch-primary-panel">${rolePanel}</section>
        <aside class="dispatch-side-panel">
          <div class="card-row"><h3>Active ${state.role === "routejack" ? "Raids" : "Convoys"}</h3><span class="pill">${activeForRole}</span></div>
          ${renderActiveDispatchSummary(state.role)}
          ${scannerSection}
          <div class="button-row"><button type="button" data-view="inventory">Inventory</button><button type="button" data-view="cities">Map</button></div>
        </aside>
      </div>
    </section>`;
  };

  syncActiveButtons = function syncActiveButtonsWithDispatchGate() {
    document.querySelectorAll("[data-view]").forEach((button) => {
      const aliases = { item: "inventory", things: "inventory", findings: "fabs", mines: "fabs", "fab-detail": "fabs", home: "profile" };
      const view = aliases[state.activeView] || state.activeView;
      if (button.dataset.view === "shipments") button.hidden = !routeRoleActive();
      button.classList.toggle("active", button.dataset.view === view);
    });
  };

  const baseCreateShipment = createShipment;
  createShipment = function createShipmentWithStepReset(...args) {
    state.dispatchStep = "route";
    return baseCreateShipment(...args);
  };

  const baseAttemptIntercept = attemptIntercept;
  attemptIntercept = function attemptInterceptWithStepReset(...args) {
    state.dispatchStep = "route";
    return baseAttemptIntercept(...args);
  };

  document.body.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.dispatchStep) {
      const steps = dispatchStepsForRole().map((step) => step.id);
      if (steps.includes(button.dataset.dispatchStep)) state.dispatchStep = button.dataset.dispatchStep;
      renderAndResetScroll();
      return;
    }
    if (button.hasAttribute("data-dispatch-step-next")) {
      const steps = dispatchStepsForRole().map((step) => step.id);
      const index = Math.max(0, steps.indexOf(currentDispatchStep()));
      state.dispatchStep = steps[Math.min(steps.length - 1, index + 1)] || "route";
      renderAndResetScroll();
      return;
    }
    if (button.hasAttribute("data-dispatch-step-back")) {
      const steps = dispatchStepsForRole().map((step) => step.id);
      const index = Math.max(0, steps.indexOf(currentDispatchStep()));
      state.dispatchStep = steps[Math.max(0, index - 1)] || "route";
      renderAndResetScroll();
    }
  });

  render();
}());
