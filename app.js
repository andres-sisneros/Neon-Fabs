// Rendering, browser event handling, and UI orchestration. Content lives in game-content.js; rules live in game-systems.js.
var state = loadState();

const mainPanel = document.querySelector("#mainPanel");
const rightPanel = document.querySelector("#rightPanel");
const playerSummary = document.querySelector("#playerSummary");
const walletSummary = document.querySelector("#walletSummary");
const quickStats = document.querySelector("#quickStats");
const screenTitle = document.querySelector("#screenTitle");
const backButton = document.querySelector("#backButton");
let searchRenderTimer = null;

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function viewTitle() {
  return {
    admin: "Admin",
    contracts: "Contracts",
    cities: "Cities & Routes",
    fabs: "Fabs",
    "fab-detail": fabById(state.selectedFabId) ? fabDefinition(fabById(state.selectedFabId).type).label : "Fab",
    findings: "Fabs",
    home: "Profile",
    inventory: "Inventory",
    item: state.selectedItem,
    "fab-shop": "Fab Shop",
    melds: "Melds",
    mines: "Fabs",
    profession: "Roles",
    profile: "Profile",
    shipments: "Dispatch",
    shop: "Market",
    things: "Inventory",
    wiki: "Wiki",
  }[state.activeView] || state.activeView.toUpperCase();
}

function renderHeader() {
  if (walletSummary) walletSummary.textContent = `${formatCredits(state.credits)} | ${state.chips} chip${state.chips === 1 ? "" : "s"}`;
  playerSummary.textContent = `${state.player} (${level()}) | Home: ${homeDistrict().name} | Power: ${formatPower(state.power)}`;
  screenTitle.textContent = viewTitle();
  if (backButton) backButton.hidden = !state.viewHistory?.length;
  quickStats.innerHTML = `
    <article class="stat-card wallet-stat"><span>Credits</span><strong>${formatCredits(state.credits)}</strong></article>
    <article class="stat-card"><span>Chips</span><strong>${state.chips}</strong></article>
    <article class="stat-card"><span>Home City</span><strong>${homeDistrict().name}</strong></article>
    <article class="stat-card"><span>Viewing</span><strong>${currentDistrict().name}</strong></article>
    <article class="stat-card"><span>Role</span><strong>${currentRole().label}</strong></article>
    <article class="stat-card"><span>Meld Level</span><strong>${level()}</strong></article>
    <article class="stat-card"><span>Battery Cap</span><strong>${formatPower(batteryCapacity())}</strong></article>
    <article class="stat-card"><span>Contracts</span><strong>${claimableContracts().length} ready</strong></article>`;
}

function renderRightPanel() {
  const filament = activeFilament();
  const scannerActive = hasActiveScanner();
  rightPanel.innerHTML = `
    <h2>Account</h2>
    <div class="side-metric"><span>Credits</span><strong>${formatCredits(state.credits)}</strong></div>
    <div class="side-metric"><span>Chips</span><strong>${state.chips}</strong></div>
    <div class="side-metric"><span>Home City</span><strong>${homeDistrict().name}</strong></div>
    <div class="side-metric"><span>Viewing</span><strong>${currentDistrict().name}</strong></div>
    <div class="side-metric"><span>Battery</span><strong>${formatPower(state.power)}</strong></div>
    <div class="side-metric"><span>Capacity</span><strong>${formatPower(batteryCapacity())}</strong></div>
    <div class="side-metric"><span>Home Storage</span><strong>${inventoryLabel(state.homeCity)}</strong></div>
    <div class="side-metric"><span>Viewed Storage</span><strong>${inventoryLabel(state.district)}</strong></div>
    <div class="side-metric"><span>Home Fab Boost</span><strong>+${Math.round(HOME_CITY_RATE_BONUS * 100)}%</strong></div>
    <div class="side-metric"><span>Fab Slots</span><strong>${state.fabs.length}/${MAX_ACTIVE_FABS}</strong></div>
    <div class="side-metric"><span>Contracts</span><strong>${completedContracts().length}/${contractCatalog.length}</strong></div>
    <div class="side-metric"><span>Filament</span><strong>${filament ? `${rarityMeta[filament.rarity].label} +${Math.round(filament.amount * 100)}% ${formatPower((filament.expiresAt - Date.now()) / 1000)}` : "Inactive"}</strong></div>
    <div class="side-metric"><span>Scanner</span><strong>${scannerActive ? `${rarityMeta[state.routeScanQuality]?.label || "Active"} ${formatPower((state.routeScanUntil - Date.now()) / 1000)}` : "Inactive"}</strong></div>`;
}

function renderContracts() {
  const ready = claimableContracts();
  const claimed = completedContracts();
  const visible = visibleContracts();
  const active = visible.filter((contract) => !state.claimedContracts.includes(contract.id));
  const upcoming = nextLockedContract();
  const rows = visible
    .map((contract) => {
      const raw = contractRawProgress(contract);
      const progress = contractProgress(contract);
      const percent = Math.min(100, (progress / contract.target) * 100);
      const isClaimed = state.claimedContracts.includes(contract.id);
      const isReady = contractReady(contract) && contractUnlocked(contract);
      const status = isClaimed ? "Claimed" : isReady ? "Ready" : `${progress}/${contract.target}`;
      return `<article class="contract-card ${isClaimed ? "claimed" : isReady ? "ready" : ""}">
        <div class="card-row">
          <div>
            <p class="eyebrow">${contract.group}</p>
            <h3>${contract.title}</h3>
          </div>
          <span class="pill">${status}</span>
        </div>
        <p class="muted">${contract.description}</p>
        <div class="capacity-bar" aria-label="${contract.title} progress"><span style="width:${percent}%"></span></div>
        <div class="contract-footer">
          <span>${Math.min(raw, contract.target)}/${contract.target}</span>
          <strong>${rewardLabel(contract.reward)}</strong>
        </div>
        <div class="button-row">
          <button type="button" data-contract-view="${contract.view}">Go</button>
          <button type="button" data-contract="${contract.id}" ${isReady && !isClaimed ? "" : "disabled"}>${isClaimed ? "Claimed" : "Claim Reward"}</button>
        </div>
      </article>`;
    })
    .join("");
  const upcomingCard = upcoming
    ? `<article class="contract-card locked">
        <div class="card-row">
          <div>
            <p class="eyebrow">${upcoming.chain}</p>
            <h3>Next Contract Locked</h3>
          </div>
          <span class="pill">Upcoming</span>
        </div>
        <p class="muted">Claim the current contract reward to unlock the next operator job.</p>
      </article>`
    : "";
  mainPanel.innerHTML = `
    <section class="panel">
      <div class="blueprint-head">
        <div>
          <h2>Contracts Board</h2>
          <p class="muted">The New Operator chain reveals one job at a time. Claim each reward to unlock the next contract.</p>
        </div>
        <span class="pill">${ready.length} ready</span>
      </div>
      <div class="fab-metrics">
        <div class="side-metric"><span>Active</span><strong>${active.length}</strong></div>
        <div class="side-metric"><span>Ready</span><strong>${ready.length}</strong></div>
        <div class="side-metric"><span>Claimed</span><strong>${claimed.length}</strong></div>
        <div class="side-metric"><span>Revealed</span><strong>${visible.length}/${contractCatalog.length}</strong></div>
      </div>
    </section>
    <div class="contract-grid">${rows}${upcomingCard}</div>`;
}

function readyMelds() {
  return melds.filter((meld) => !state.completed.includes(meld.name) && canMeld(meld));
}

function profileActionButton(action, className = "") {
  if (!action) return "";
  const dataAttr = action.action ? `data-action="${action.action}"` : `data-view="${action.view || "profile"}"`;
  return `<button type="button" class="${className}" ${dataAttr} ${action.disabled ? "disabled" : ""}>${action.label}</button>`;
}

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

function renderFirstRunWelcome() {
  const starterFab = state.fabs.find((fab) => fab.type === "starter") || state.fabs[0];
  const homeCards = STARTER_HOME_CITIES.map((cityId) => {
    const district = districtById(cityId);
    return `<article class="item-card start-city-card">
      <div class="card-row"><h3>${district.name}</h3><span class="pill">${fabTypeList(district)}</span></div>
      <p class="muted">${district.description}</p>
      ${renderCityPixelScene(district, { compact: true })}
      <button type="button" data-home-city="${district.id}">Start In ${district.name}</button>
    </article>`;
  }).join("");

  return `<section class="first-run-panel">
    <div class="first-run-copy">
      <p class="eyebrow">New operator license</p>
      <h2>The city prints what it can. You decide what it becomes.</h2>
      <p class="muted">You begin with one free Starter Fab, one day of battery, and no credits. Relics print in your home city, markets move at city speed, and routes turn inventory into risk.</p>
      <div class="motivation-grid">
        <article><strong>Fuse</strong><span>Collect components and build melds that extend your daily battery.</span></article>
        <article><strong>Trade</strong><span>Buy where supply is cheap, move goods, and sell where demand is hungry.</span></article>
        <article><strong>Dispatch</strong><span>Send vehicles across roads and water once you are ready to take route risk.</span></article>
      </div>
    </div>
    ${renderFabPixelScene(starterFab, { label: "Free Starter Fab" })}
    <div class="start-city-chooser">
      <div class="blueprint-head">
        <div>
          <h2>Choose Starting Home</h2>
          <p class="muted">Your free starter fab installs here. Meld ingredients must come home before they can fuse.</p>
        </div>
        <span class="pill">One-time setup</span>
      </div>
      <div class="item-grid">${homeCards}</div>
    </div>
  </section>`;
}

function renderProfileCommandDeck() {
  const cityName = currentDistrict().name;
  const cityQueue = queuedOutputFor(state.district).length;
  const remoteQueue = queuedOutputOutside(state.district).length;
  const inTransit = state.shipments.filter((shipment) => shipment.status === "in-transit").length;
  const readyContractCount = claimableContracts().length;
  const cityFabs = fabsForCity(state.district);
  const printBayAction = cityQueue
    ? { label: "Print Bay", view: "fabs" }
    : { label: "Fabs", view: "fabs" };
  const secondary = [
    printBayAction,
    { label: "Contracts", view: "contracts" },
    { label: "Inventory", view: "inventory" },
    { label: "Market", view: "shop" },
    { label: "Melds", view: "melds" },
    { label: "Dispatch", view: "shipments" },
  ];

  return `<section class="command-deck operator-console">
    <div class="command-main">
      <p class="eyebrow">Operator Console</p>
      <h2>${cityName}</h2>
      <div class="console-lines">
        <span>Power <strong>${formatPower(state.power)}</strong></span>
        <span>Local fabs <strong>${cityFabs.length}</strong></span>
        <span>Storage <strong>${inventoryLabel(state.district)}</strong></span>
      </div>
    </div>
    <div class="command-status">
      <div class="side-metric"><span>Print Bay</span><strong>${cityQueue} sealed</strong></div>
      <div class="side-metric"><span>Elsewhere</span><strong>${remoteQueue} sealed</strong></div>
      <div class="side-metric"><span>Storage</span><strong>${inventoryLabel(state.district)}</strong></div>
      <div class="side-metric"><span>Routes</span><strong>${inTransit} active</strong></div>
      <div class="side-metric"><span>Contracts</span><strong>${readyContractCount} ready</strong></div>
      <div class="side-metric"><span>Ready Melds</span><strong>${readyMelds().length}</strong></div>
    </div>
    <div class="quick-command-row">
      ${secondary.map((action) => profileActionButton(action)).join("")}
    </div>
  </section>`;
}

function renderProfile() {
  const activeFab = state.fabs[0];
  const activeFabRate = effectiveFabRate(activeFab);
  const filament = activeFilament();
  if (!state.homeChosen) {
    mainPanel.innerHTML = renderFirstRunWelcome();
    return;
  }
  mainPanel.innerHTML = `
    <section class="profile-hero">
      <div class="avatar-card">
        <div class="avatar-core"></div>
      </div>
      <div>
        <p class="eyebrow">Local operator</p>
        <h2>${state.player}</h2>
        <div class="profile-tags">
          <span class="pill">Home: ${homeDistrict().name}</span>
          <span class="pill">Viewing: ${currentDistrict().name}</span>
        </div>
      </div>
    </section>
    ${renderProfileCommandDeck()}
    <div class="grid three profile-grid">
      <section class="panel">
        <h2>Battery</h2>
        <div class="big-number">${formatPower(state.power)}</div>
        <p class="muted">Cap ${formatPower(batteryCapacity())}</p>
      </section>
      <section class="panel">
        <h2>Melds</h2>
        <div class="big-number">${state.completed.length}/${melds.length}</div>
        <p class="muted">${readyMelds().length} ready</p>
      </section>
      <section class="panel">
        <h2>Active Fabs</h2>
        <div class="big-number">${state.fabs.length}/${MAX_ACTIVE_FABS}</div>
        <p class="muted">${activeFabRate.toFixed(2)} g/hr starter</p>
      </section>
      <section class="panel">
        <h2>Profession</h2>
        <div class="big-number">${currentRole().label}</div>
        <p class="muted">${professionLockReason() ? "Locked by route job" : "Neutral"}</p>
      </section>
      <section class="panel">
        <h2>Dispatch</h2>
        <div class="big-number">${state.shipments.filter((shipment) => shipment.status === "in-transit").length}</div>
        <p class="muted">Active route jobs</p>
      </section>
      <section class="panel">
        <h2>Contracts</h2>
        <div class="big-number">${claimableContracts().length}</div>
        <p class="muted">${claimableContracts().length ? "Rewards are ready to claim." : `${completedContracts().length}/${contractCatalog.length} completed.`}</p>
        <button type="button" data-view="contracts">Open Contracts</button>
      </section>
      <section class="panel">
        <h2>Boosts</h2>
        <div class="big-number">${filament || hasActiveScanner() ? "Active" : "Idle"}</div>
        <p class="muted">${filament ? `${rarityMeta[filament.rarity].label} filament` : "No filament"}${hasActiveScanner() ? " + scanner" : ""}</p>
      </section>
    </div>`;
}

function collectionResult(entry) {
  return entry.result || { action: "kept", label: "Kept", detail: districtById(outputCity(entry)).name };
}

function collectedOutputGroups(cityId = state.district) {
  const groups = new Map();
  state.lastCollected
    .filter((entry) => outputCity(entry) === cityId)
    .forEach((entry) => {
      const name = outputName(entry);
      const result = collectionResult(entry);
      const key = `${name}:${result.action}:${result.detail || ""}`;
      if (!groups.has(key)) {
        groups.set(key, {
          name,
          item: itemByName(name),
          cityId: outputCity(entry),
          action: result.action,
          label: result.label,
          detail: result.detail || "",
          payout: 0,
          count: 0,
        });
      }
      const group = groups.get(key);
      group.count += 1;
      group.payout += Number(result.payout || 0);
    });
  const actionOrder = { kept: 0, sold: 1, recycled: 2, queued: 3 };
  return [...groups.values()].sort((a, b) => (
    rarityOrder.indexOf(b.item.rarity) - rarityOrder.indexOf(a.item.rarity)
    || (actionOrder[a.action] ?? 9) - (actionOrder[b.action] ?? 9)
    || a.name.localeCompare(b.name)
  ));
}

function renderCollectedOutput(cityId = state.district) {
  const groups = collectedOutputGroups(cityId);
  const cityName = districtById(cityId).name;
  if (!groups.length) return "";
  const totalRevealed = groups.reduce((sum, group) => sum + group.count, 0);
  const raritySummary = rarityOrder
    .map((rarity) => {
      const count = groups.filter((group) => group.item.rarity === rarity).reduce((sum, group) => sum + group.count, 0);
      return count ? `<span class="reveal-rarity-chip rarity-border-${rarity}">${rarityMeta[rarity].label} x${count}</span>` : "";
    })
    .join("");
  const rows = groups.map((group) => {
    const available = inventoryFor(cityId)[group.name] || 0;
    const canAct = group.action === "kept" && available > 0;
    return `<article class="collection-result rarity-border-${group.item.rarity}">
      <div class="card-row">
        <strong class="item-name">${icon(group.item.iconName, group.item.rarity)} ${group.name}</strong>
        <span class="pill">x${group.count}</span>
      </div>
      <div class="collection-meta">
        ${rarityPill(group.item.rarity)}
        <span class="collection-status ${group.action}">${group.label}${group.payout ? ` ${formatCredits(group.payout)}` : group.detail ? ` - ${group.detail}` : ""}</span>
      </div>
      <button type="button" data-open-collection-actions="${group.name}" data-city-id="${cityId}" ${canAct || group.action !== "kept" ? "" : "disabled"}>${group.action === "kept" ? "Manage" : "View"}</button>
    </article>`;
  }).join("");
  return `<section class="panel collected-panel reveal-panel" style="margin-top:14px">
    <div class="blueprint-head">
      <div>
        <h2>${totalRevealed} Print${totalRevealed === 1 ? "" : "s"} Revealed</h2>
        <p class="muted">${cityName} Print Bay opened.</p>
      </div>
      <span class="pill">Battery recharged</span>
    </div>
    <div class="reveal-summary">${raritySummary || `<span class="reveal-rarity-chip">No stored items</span>`}</div>
    <div class="collection-grid">${rows}</div>
    <div class="button-row reveal-actions">
      <button type="button" data-view="inventory">Review Inventory</button>
      <button type="button" data-view="shop">Open Market</button>
    </div>
  </section>`;
}

function renderFabCityCommand(cityFabs, cityQueuedOutput, otherQueuedOutput, pressure) {
  const cityName = currentDistrict().name;
  const cityHasStorage = pressure.available > 0;
  const collectBlocked = cityQueuedOutput.length && !cityHasStorage;
  const notice = state.printBayNotice?.cityId === state.district && state.printBayNotice?.expiresAt > Date.now()
    ? state.printBayNotice
    : null;
  const bayState = collectBlocked
    ? "blocked"
    : cityQueuedOutput.length
      ? "ready"
      : cityFabs.length
        ? "printing"
        : "idle";
  const buttonLabel = cityQueuedOutput.length ? "Collect Prints" : cityFabs.length ? "Printing..." : "Open Fab Shop";
  const buttonAttr = cityFabs.length ? 'data-action="claim-output"' : 'data-view="fab-shop"';
  const buttonDisabled = cityFabs.length && !cityQueuedOutput.length;
  const hudStats = [
    `${cityFabs.length} fab${cityFabs.length === 1 ? "" : "s"}`,
    cityQueuedOutput.length ? `${cityQueuedOutput.length} ready` : "no prints",
    otherQueuedOutput.length ? `${otherQueuedOutput.length} elsewhere` : "",
  ].filter(Boolean);

  return `<section class="command-deck fab-command-deck print-bay-card state-${bayState} ${notice ? "notice-active" : ""}">
    <div class="command-main">
      ${cityFabs.length ? renderFabPixelScene(cityFabs[0], {
        fabs: cityFabs,
        label: `${cityName} Print Bay`,
        compact: true,
        readyCount: cityQueuedOutput.length,
        state: bayState,
        hudStats,
      }) : renderCityPixelScene(currentDistrict(), { compact: true })}
      ${notice ? `<div class="print-bay-toast">${notice.text}</div>` : ""}
      <button type="button" class="primary-command print-bay-action" ${buttonAttr} ${buttonDisabled ? "disabled" : ""}>${buttonLabel}</button>
    </div>
  </section>`;
}

function renderFindings() {
  const cityFabs = fabsForCity();
  const cityQueuedOutput = queuedOutputFor(state.district);
  const otherQueuedOutput = queuedOutputOutside(state.district);
  const pressure = cityQueuePressure(state.district);
  const cityLastCollected = state.lastCollected.filter((entry) => outputCity(entry) === state.district);
  if (!cityFabs.length) {
    mainPanel.innerHTML = `
      ${renderFabCityCommand(cityFabs, cityQueuedOutput, otherQueuedOutput, pressure)}
      ${cityLastCollected.length ? renderCollectedOutput(state.district) : ""}
      <section class="empty-state">
        <h2>No Fabs In ${currentDistrict().name}</h2>
        <p class="muted">Your local fab slots are elsewhere.</p>
        <div class="button-row">
          <button type="button" data-view="cities">Open Map</button>
          <button type="button" data-view="fab-shop">Open Fab Shop</button>
          <button type="button" data-view="cities">Cities & Routes</button>
        </div>
      </section>`;
    return;
  }
  const fabCards = cityFabs.map((fab) => {
    const index = state.fabs.indexOf(fab);
    const definition = fabDefinition(fab.type);
    const pattern = printPatternForFab(fab);
    const equipmentBonus = equipmentRateBonus(fab);
    const queuedForFab = state.output.filter((entry) => outputFabId(entry) === fab.id).length;
    const cardState = queuedForFab ? "ready" : state.power <= 0 ? "blocked" : "printing";
    return `<section class="fab-detail fab-summary-card state-${cardState}" style="--accent:${definition.accent}">
      ${renderFabStaticTile(fab, queuedForFab, cardState)}
      <div>
        <div class="blueprint-head">
          <div>
            <h2>${definition.label}</h2>
            <p class="muted">${pattern.label}</p>
          </div>
          <span class="pill">${queuedForFab ? `${queuedForFab} sealed` : cardState === "blocked" ? "Battery empty" : "Printing"}</span>
        </div>
        <div class="fab-summary-line">
          <span>${definition.group}</span>
          <span>${fab.mode === "credits" ? "Credit output" : "Item output"}</span>
          <span>${equipmentBonus ? `Equipment +${Math.round(equipmentBonus * 100)}%` : "No equipment bonus"}</span>
        </div>
        ${
          fab.type === "starter"
            ? `<div class="mode-row">
                <label><input type="radio" name="fab-${index}" data-mode="${index}:credits" ${fab.mode === "credits" ? "checked" : ""}> mine gold</label>
                <label><input type="radio" name="fab-${index}" data-mode="${index}:parts" ${fab.mode === "parts" ? "checked" : ""}> find relics</label>
              </div>`
            : ""
        }
        <div class="button-row"><button type="button" data-fab="${fab.id}">Fab Details</button></div>
      </div>
    </section>`;
  }).join("");
  const ownedRows = state.fabs.map(renderOwnedFabCard).join("");
  mainPanel.innerHTML = `
    ${renderFabCityCommand(cityFabs, cityQueuedOutput, otherQueuedOutput, pressure)}
    ${cityLastCollected.length ? renderCollectedOutput(state.district) : ""}
    <div class="grid">${fabCards}</div>
    <section class="panel" style="margin-bottom:14px">
        <div class="blueprint-head">
          <div>
            <h2>Owned Fabs</h2>
          <p class="muted">Active slots.</p>
        </div>
        <div class="button-row">
          <span class="pill">${state.fabs.length}/${MAX_ACTIVE_FABS} slots</span>
          <button type="button" data-view="fab-shop">Buy or Rent</button>
        </div>
      </div>
      <div class="item-grid">${ownedRows}</div>
    </section>
    ${
      state.power <= 0
        ? `<p class="battery-empty">Battery empty. Open the Print Bay in this city to recharge; if this city has no sealed prints, switch to a city with waiting prints or use Admin Fill Power while we tune the recharge rule.</p>`
        : ""
    }`;
}

function renderParts() {
  const cityInventory = inventoryFor(state.district);
  const allInventoryItems = Object.entries(cityInventory).map(([name, count]) => ({ item: itemByName(name), count })).filter(({ item, count }) => item && count > 0);
  const inventoryItems = filteredInventoryEntries(state.district);
  const categoryOptions = Object.entries(marketCategories)
    .filter(([id]) => id === "all" || allInventoryItems.some(({ item }) => item.category === id || item.type === id))
    .map(([id, label]) => `<button type="button" class="${state.inventoryCategory === id ? "active" : ""}" data-inventory-category="${id}">${label}</button>`)
    .join("");
  const rarityOptions = [`<option value="all" ${state.inventoryRarity === "all" ? "selected" : ""}>All Rarities</option>`]
    .concat(rarityOrder.map((rarity) => `<option value="${rarity}" ${state.inventoryRarity === rarity ? "selected" : ""}>${rarityMeta[rarity].label}</option>`))
    .join("");
  const bulkRarityOptions = [`<option value="all" ${state.inventoryBulkRarity === "all" ? "selected" : ""}>All Rarities</option>`]
    .concat(rarityOrder.map((rarity) => `<option value="${rarity}" ${state.inventoryBulkRarity === rarity ? "selected" : ""}>${rarityMeta[rarity].label} and below</option>`))
    .join("");
  const visibleUnits = inventoryItems.reduce((sum, { count }) => sum + count, 0);
  const protectedVisible = inventoryItems.filter(({ item }) => shouldProtectInventoryItem(item.name)).reduce((sum, { count }) => sum + count, 0);
  const bulkSellTargets = bulkInventoryTargets(state.district, { requireBid: true });
  const bulkRecycleTargets = bulkInventoryTargets(state.district, { requireNoBid: true, rarityCap: true });
  const bulkListTargets = bulkRecycleTargets.filter(({ item }) => item.value > 1);
  const cityName = currentDistrict().name;
  const isHomeView = state.district === state.homeCity;
  const pressure = cityQueuePressure(state.district);
  const keptPreview = pressure.kept.slice(0, 6).map((entry) => {
    const item = itemByName(outputName(entry));
    const fab = outputFabId(entry) ? fabById(outputFabId(entry)) : null;
    return `<div class="market-line"><span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span><strong>${fab ? fabDefinition(fab.type).label : "Print Bay"}</strong></div>`;
  }).join("");
  mainPanel.innerHTML = `
    <div class="grid">
      <section class="panel">
        <div class="blueprint-head">
          <div>
            <h2>${cityName} Inventory</h2>
            <p class="muted">${isHomeView ? "Home storage." : `Away from ${homeDistrict().name}.`}</p>
          </div>
          <span class="pill">${inventoryLabel(state.district)} slots</span>
        </div>
        <div class="capacity-bar" aria-label="Inventory capacity"><span style="width:${Math.min(100, (inventoryCount(state.district) / inventoryLimit(state.district)) * 100)}%"></span></div>
        ${isHomeView ? "" : `<button type="button" data-view="cities">Open Map</button>`}
        <div class="market-toolbar">
          <div class="segmented">${categoryOptions}</div>
          <label class="search-field"><span>Search</span><input id="inventorySearch" type="search" value="${state.inventorySearch}" placeholder="Item, rarity, fab"></label>
          <label class="select-field"><span>Rarity</span><select id="inventoryRarity">${rarityOptions}</select></label>
        </div>
        ${
          inventoryItems.length
            ? `<div class="backpack-grid">${inventoryItems
          .map(({ item, count }) => {
            const name = item.name;
            const protectedItem = shouldProtectInventoryItem(name) ? `<span class="mini-tag">Meld</span>` : "";
            return `<article class="item-card backpack-item">
              <button type="button" data-open-inventory-actions="${name}" aria-label="Manage ${name}">
                <span class="backpack-icon">${icon(item.iconName, item.rarity)}</span>
                <strong class="item-name">${name}</strong>
                <span class="backpack-meta">${rarityMeta[item.rarity].label} x${count}</span>
                ${protectedItem}
              </button>
            </article>`;
          })
          .join("")}</div>`
            : `<div class="empty-guidance">
                <h3>${allInventoryItems.length ? "No Items Match These Filters" : `${cityName} Inventory Is Empty`}</h3>
                <p class="muted">${allInventoryItems.length ? "Adjust filters." : "No local items."}</p>
                <div class="button-row">
                  <button type="button" data-action="inventory-clear-filters" ${allInventoryItems.length ? "" : "disabled"}>Clear Filters</button>
                  <button type="button" data-view="fabs">Open Fabs</button>
                  <button type="button" data-view="shop">Open Market</button>
                </div>
              </div>`
        }
        <div class="fab-metrics inventory-totals">
          <div class="side-metric"><span>Types</span><strong>${inventoryItems.length}/${allInventoryItems.length}</strong></div>
          <div class="side-metric"><span>Units</span><strong>${visibleUnits}</strong></div>
          <div class="side-metric"><span>Meld Lock</span><strong>${protectedVisible}</strong></div>
          <div class="side-metric"><span>Free</span><strong>${inventoryAvailable(state.district)}</strong></div>
        </div>
        <details class="advanced-panel">
          <summary>Advanced Inventory</summary>
          <div class="bulk-action-panel">
            <div>
              <h3>Bulk Actions</h3>
              <p class="muted">Uses current filters.</p>
            </div>
            <label class="select-field"><span>Rarity Cap</span><select id="inventoryBulkRarity">${bulkRarityOptions}</select></label>
            <label class="toggle-field"><input id="inventoryProtectMelds" type="checkbox" ${state.inventoryProtectMelds ? "checked" : ""}> Protect meld ingredients</label>
            <div class="button-row">
              <button type="button" data-action="inventory-bulk-sell" ${bulkSellTargets.length ? "" : "disabled"}>Sell Visible to Bids</button>
              <button type="button" data-action="inventory-bulk-recycle" ${bulkRecycleTargets.length ? "" : "disabled"}>Recycle No-Bid Items</button>
              <button type="button" data-action="inventory-bulk-list" ${bulkListTargets.length ? "" : "disabled"}>List No-Bid at Value</button>
            </div>
          </div>
        </details>
      </section>
      <section class="panel">
        <div class="blueprint-head">
          <div>
            <h2>Print Bay</h2>
            <p class="muted">${pressure.queued.length} sealed.</p>
          </div>
          <button type="button" data-view="fabs">Open Fabs</button>
        </div>
        <div class="fab-metrics">
          <div class="side-metric"><span>Storage Free</span><strong>${pressure.available}/${pressure.limit}</strong></div>
          <div class="side-metric"><span>Sealed Prints</span><strong>${pressure.queued.length}</strong></div>
          <div class="side-metric"><span>Fits Now</span><strong>${pressure.collectable}</strong></div>
          <div class="side-metric"><span>Stays Sealed</span><strong>${pressure.remainingSealed}</strong></div>
        </div>
        ${
          pressure.queued.length && pressure.available <= 0
            ? `<p class="battery-empty">Collection blocked: storage full.</p>`
            : pressure.remainingSealed
              ? `<p class="battery-empty">${pressure.collectable} fit now. ${pressure.remainingSealed} stay sealed.</p>`
              : `<p class="muted">${pressure.queued.length ? "All prints fit." : "No local prints."}</p>`
        }
        ${keptPreview ? `<h3>Sealed Prints</h3>${keptPreview}${pressure.kept.length > 6 ? `<p class="muted">+${pressure.kept.length - 6} more.</p>` : ""}` : ""}
      </section>
      <section class="panel">
        <div class="blueprint-head">
          <div>
            <h2>Dispatch</h2>
            <p class="muted">Cargo launches from Dispatch.</p>
          </div>
          <button type="button" data-view="shipments">Open Dispatch</button>
        </div>
        <p class="muted">Use this city inventory to inspect what you own. Go to Dispatch when you are ready to load a vehicle.</p>
      </section>
    </div>`;
}

function renderFabs() {
  renderFindings();
}

function dispatchChoiceCard({ active = false, disabled = false, attr = "", title = "", meta = "", detail = "", iconName = "data", rarity = "green" }) {
  return `<button type="button" class="dispatch-choice-card ${active ? "active" : ""}" ${attr} ${disabled ? "disabled" : ""}>
    <span class="item-name">${icon(iconName, rarity)} ${title}</span>
    ${meta ? `<strong>${meta}</strong>` : ""}
    ${detail ? `<em>${detail}</em>` : ""}
  </button>`;
}

function routePreviewShipment(route, selectedVehicle = null) {
  const fallbackVehicle = selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, route)
    ? selectedVehicle
    : allVehicleItems().find((vehicle) => vehicleCanUseRoute(vehicle, route));
  if (!fallbackVehicle) return null;
  if (state.role === "routejack") {
    return {
      kind: "intercept",
      from: state.district,
      to: route.to,
      vehicle: fallbackVehicle.name,
      support1: state.pvpSupport1 || "none",
      support2: state.pvpSupport2 || "none",
      loot: [],
      lootPolicy: state.pvpLootPolicy || "upgrade",
      capacity: Math.max(1, Number(fallbackVehicle.capacity || 1)),
    };
  }
  return {
    from: state.district,
    to: route.to,
    vehicle: fallbackVehicle.name,
    cargo: "Common Starter Component A",
    cargos: [{ name: "Common Starter Component A", qty: 1 }],
    cargoUnits: 1,
    capacity: Math.max(1, Number(fallbackVehicle.capacity || 1)),
    escortVehicle: null,
    profession: "merchant",
  };
}

function routeEncounterRouteDetail(route, selectedVehicle = null) {
  const parts = [];
  const sample = routePreviewShipment(route, selectedVehicle);
  if (sample) {
    const label = state.role === "routejack" ? "targets" : "risk";
    parts.push(`${routeEncounterHourlyChance(sample, route)}%/hr ${label}`);
  }
  const clearance = routeClearanceSummary(state.district, route.to);
  if (clearance) parts.push(clearance);
  return parts.join(" - ");
}

function dispatchRouteCards(routes, selectedTo, dataAttr, selectedVehicle = null) {
  if (!routes.length) return `<div class="dispatch-empty-strip"><strong>No connected routes</strong><span>This city has no available exits yet.</span></div>`;
  return `<div class="dispatch-choice-grid route-choice-grid">${routes.map((route) => {
    const travel = selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, route)
      ? ` - ${formatRouteTime(routeTravelHours(route, selectedVehicle, currentRole().shipmentSpeedBonus || 0))}`
      : "";
    return dispatchChoiceCard({
      active: selectedTo === route.to,
      attr: `${dataAttr}="${route.to}"`,
      title: route.district.name,
      meta: `${routeDistance(route)}mi ${routeKind(route)}`,
      detail: `${districtById(state.district).name} route${travel}${routeEncounterRouteDetail(route, selectedVehicle) ? ` - ${routeEncounterRouteDetail(route, selectedVehicle)}` : ""}`,
      iconName: routeKind(route) === "water" ? "cell" : "data",
      rarity: routeKind(route) === "water" ? "blue" : "green",
    });
  }).join("")}</div>`;
}

function dispatchVehicleCards(entries, selectedName, dataAttr, emptyText, options = {}) {
  if (!entries.length) return `<div class="dispatch-empty-strip"><strong>${emptyText}</strong><span>Print, buy, or move a compatible vehicle into ${currentDistrict().name}.</span></div>`;
  return `<div class="dispatch-choice-grid vehicle-choice-grid">${entries.map(({ item, count }) => {
    const roleText = item.vehicleClass ? vehicleClassLabels[item.vehicleClass] || item.vehicleClass : "Vehicle";
    const disabled = options.disabledNames?.includes(item.name) || false;
    return dispatchChoiceCard({
      active: selectedName === item.name,
      disabled,
      attr: `${dataAttr}="${item.name}"`,
      title: `${item.name} x${count}`,
      meta: `${vehicleMph(item)} mph - ${Math.max(1, Number(item.capacity || 1))} slots`,
      detail: `${roleText} - ${vehicleModeLabel(item)}`,
      iconName: item.iconName,
      rarity: item.rarity,
    });
  }).join("")}</div>`;
}

function dispatchNoneCard(active, dataAttr, label = "No Support") {
  return dispatchChoiceCard({
    active,
    attr: `${dataAttr}="none"`,
    title: label,
    meta: "Empty slot",
    detail: "Keep the convoy lighter",
    iconName: "data",
    rarity: "green",
  });
}

function renderCargoDispatchForm() {
  const canShipByRole = state.role === "merchant";
  const cityName = currentDistrict().name;
  const shippableCargo = shippableItemsIn(state.district);
  const routes = routeOptions(state.district);
  if (routes.length && !routeTo(state.district, state.shipmentDestination)) state.shipmentDestination = routes[0].to;
  if (shippableCargo.length && !shippableCargo.some(({ item }) => item.name === state.shipmentCargo)) state.shipmentCargo = shippableCargo[0].item.name;
  const cargoQuery = (state.dispatchCargoSearch || "").trim().toLowerCase();
  const destinationOptions = routes
    .map((route) => `<option value="${route.to}" ${state.shipmentDestination === route.to ? "selected" : ""}>${route.district.name} - ${routeDistance(route)}mi ${routeKind(route) === "water" ? "(water)" : "(land)"}</option>`)
    .join("");
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
  const selectedCargoEntry = shippableCargo.find(({ item }) => item.name === state.shipmentCargo);
  const selectedCargo = selectedCargoEntry?.item || null;
  const selectedCargoCount = selectedCargoEntry?.count || 0;
  const maxCargoQty = Math.min(selectedCargoCount, Math.max(1, selectedVehicleCapacity));
  const cargoQty = Math.min(maxCargoQty || 1, Math.max(1, Math.floor(Number(state.shipmentCargoQty || 1))));
  state.shipmentCargoQty = cargoQty || 1;
  const cargoPickerRows = visibleCargo
    .map(({ item, count }) => {
      const localBid = highestBid(state.district, item.name);
      return `<button type="button" class="cargo-pick ${state.shipmentCargo === item.name ? "active" : ""}" data-cargo-pick="${item.name}">
        <span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span>
        <em>x${count}${localBid ? ` · bid ${formatCredits(localBid.price)}` : ""}</em>
      </button>`;
    })
    .join("");
  const selectedTravelHours = selectedRoute && selectedVehicle?.category === "vehicle"
    ? routeTravelHours(selectedRoute, selectedVehicle, currentRole().shipmentSpeedBonus || 0)
    : null;
  const freightEstimate = selectedRoute && selectedVehicle?.category === "vehicle" && selectedCargo
    ? merchantFreightPayout({
      from: state.district,
      to: selectedRoute.to,
      cargos: [{ name: selectedCargo.name, qty: Math.max(1, cargoQty || 1) }],
      cargoUnits: Math.max(1, cargoQty || 1),
      capacity: selectedVehicleCapacity,
      routeMiles: routeDistance(selectedRoute),
      profession: "merchant",
    })
    : null;
  const likelyRaider = selectedRoute
    ? allVehicleItems().find((item) => item.vehicleClass === "interceptor" && vehicleCanUseRoute(item, selectedRoute)) || allVehicleItems().find((item) => vehicleCanUseRoute(item, selectedRoute))
    : null;
  const battleSettings = likelyRaider && selectedVehicle && selectedCargo
    ? routeBattleSettings({
      from: state.district,
      to: selectedRoute.to,
      attackerVehicle: likelyRaider.name,
      defenderVehicle: selectedVehicle.name,
      defenderEscort1: selectedEscort?.name || "none",
      cargo: selectedCargo.name,
      cargoUnits: Math.max(1, cargoQty || 1),
      attackerRole: "routejack",
      defenderRole: "merchant",
      attackerTactic: "snatch",
      defenderTactic: selectedEscort ? "protect" : "evade",
    })
    : null;
  const defenders = battleSettings ? makeBattleTeams(battleSettings, selectedRoute).defenders : [];
  const defenderSummary = defenders.length
    ? defenders.map((unit) => `${unit.role}: ${unit.name}`).join(" + ")
    : "Select cargo and vehicle";
  const previewShipment = selectedRoute && selectedVehicle && selectedCargo ? {
    from: state.district,
    to: selectedRoute.to,
    vehicle: selectedVehicle.name,
    cargo: selectedCargo.name,
    cargos: [{ name: selectedCargo.name, qty: Math.max(1, cargoQty || 1) }],
    cargoUnits: Math.max(1, cargoQty || 1),
    capacity: selectedVehicleCapacity || 1,
    escortVehicle: selectedEscort?.name || null,
    profession: "merchant",
  } : null;
  const encounterPreview = previewShipment ? routeEncounterHourlyChance(previewShipment, selectedRoute) : null;
  const canShipSelected = canShipByRole && selectedCargo && cargoQty > 0 && routeVehicles.length && destinationOptions && selectedVehicle?.category === "vehicle" && vehicleCanUseRoute(selectedVehicle, selectedRoute);
  return `<div class="shipment-form cargo-dispatch-form dispatch-builder">
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Choose Route</h3><span class="pill">${cityName}</span></div>
      ${dispatchRouteCards(routes, state.shipmentDestination, "data-ship-destination", selectedVehicle)}
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Choose Vehicle</h3><span class="pill">${selectedVehicleCapacity || 0} cargo slots</span></div>
      ${dispatchVehicleCards(routeVehicles, state.shipmentVehicle, "data-ship-vehicle", "No compatible vehicles")}
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Escort</h3><span class="pill">${selectedEscort ? "guarded" : "optional"}</span></div>
      <div class="dispatch-choice-grid vehicle-choice-grid">
        ${dispatchNoneCard(state.shipmentEscort === "none", "data-ship-escort", "No Escort")}
        ${escortVehicles.length ? dispatchVehicleCards(escortVehicles, state.shipmentEscort, "data-ship-escort", "No escort vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "") : ""}
      </div>
    </section>
    <section class="cargo-load-panel">
      <div class="card-row"><strong>Cargo Bay</strong><span class="pill">${selectedVehicleCapacity || 0} slots</span></div>
      <label class="search-field cargo-search"><span>Find Cargo</span><input id="dispatchCargoSearch" type="search" value="${state.dispatchCargoSearch}" placeholder="Search local inventory"></label>
      <div class="cargo-picker-grid">${cargoPickerRows || `<p class="muted">No cargo matches.</p>`}</div>
      <label class="cargo-load-row selected-cargo-row">
        <span class="item-name">${selectedCargo ? `${icon(selectedCargo.iconName, selectedCargo.rarity)} ${selectedCargo.name}` : "No cargo selected"}</span>
        <em>owned ${selectedCargoCount}</em>
        <span class="cargo-qty-stepper">
          <button type="button" data-cargo-qty="-1" ${cargoQty <= 1 ? "disabled" : ""}>-</button>
          <input type="number" min="1" max="${maxCargoQty}" step="1" value="${cargoQty || 1}" data-ship-cargo="${selectedCargo?.name || ""}" id="shipmentCargoQty" readonly ${selectedCargo ? "" : "disabled"}>
          <button type="button" data-cargo-qty="1" ${cargoQty >= maxCargoQty ? "disabled" : ""}>+</button>
        </span>
      </label>
      <p class="muted">${cargoMatches.length > visibleCargo.length ? `${visibleCargo.length}/${cargoMatches.length} shown. Refine search to narrow the bay.` : `${visibleCargo.length} matching cargo stack${visibleCargo.length === 1 ? "" : "s"}.`}</p>
    </section>
    <div class="dispatch-summary-strip">
      <div class="side-metric"><span>Travel</span><strong>${selectedTravelHours ? formatRouteTime(selectedTravelHours) : "No route"}</strong></div>
      <div class="side-metric"><span>Freight Pay</span><strong>${freightEstimate ? formatCredits(freightEstimate) : "No cargo"}</strong></div>
      <div class="side-metric"><span>Profile</span><strong>${selectedVehicle?.category === "vehicle" ? `${profileBand(vehicleProfileScore(selectedVehicle))} (${vehicleProfileScore(selectedVehicle)})` : "No vehicle"}</strong></div>
      <div class="side-metric"><span>Encounter</span><strong>${encounterPreview !== null ? `${encounterPreview}%/hr` : "Unknown"}</strong></div>
    </div>
    <div class="battle-convoy-preview compact">
      <div class="card-row"><strong>Convoy Readiness</strong><span class="pill">${selectedRoute ? `${routeDistance(selectedRoute)}mi ${routeKind(selectedRoute)}` : "No route"}</span></div>
      <p class="muted">${defenderSummary}. Hidden NPC encounters only become certain through scanner intel.</p>
    </div>
    <button type="button" data-action="create-shipment" ${canShipSelected ? "" : "disabled"}>Send Shipment</button>
  </div>
  <p class="muted">${canShipByRole ? "Merchant convoys earn freight when cargo arrives safely." : "Merchant role required."}</p>`;
}

function renderDispatchNotice() {
  const notice = state.dispatchNotice;
  if (!notice?.text) return "";
  return `<div class="dispatch-notice ${notice.type || "info"}">
    <div>
      <strong>${notice.text}</strong>
      <span>${notice.detail || ""}</span>
    </div>
    <button type="button" data-action="clear-dispatch-notice">Dismiss</button>
  </div>`;
}

function dispatchJobMatchesRole(shipment, role = state.role) {
  if (role === "routejack") return shipment.kind === "intercept";
  if (role === "merchant") return shipment.kind !== "intercept";
  return false;
}

function renderActiveDispatchSummary(role = state.role) {
  const active = state.shipments
    .filter((shipment) => shipment.status === "in-transit" || shipment.status === "blocked")
    .filter((shipment) => dispatchJobMatchesRole(shipment, role))
    .slice(0, 4);
  if (!active.length) {
    const verb = role === "routejack" ? "Launch a raid convoy" : role === "merchant" ? "Send a cargo convoy" : "Choose a route role";
    return `<div class="dispatch-empty-strip">
      <strong>No active jobs</strong>
      <span>${verb} from this city when you are ready.</span>
    </div>`;
  }
  const rows = active.map((shipment) => {
    const total = Math.max(1, shipment.arrivesAt - shipment.startedAt);
    const progress = shipment.status === "blocked" ? 100 : Math.min(100, Math.max(0, ((Date.now() - shipment.startedAt) / total) * 100));
    const route = `${districtById(shipment.from).name} -> ${districtById(shipment.to).name}`;
    const label = shipment.kind === "intercept"
      ? "Routejack Raid"
      : "Merchant Convoy";
    return `<div class="dispatch-mini-card">
      <div class="card-row"><strong>${label}</strong><span class="pill">${shipmentStatus(shipment)}</span></div>
      <span>${route}</span>
      <em>${shipment.kind ? routeJobDetail(shipment) : `${shipmentCargoShortLabel(shipment)} aboard ${shipment.vehicle}${shipment.escortVehicle ? ` + ${shipment.escortVehicle}` : ""}`}</em>
      <div class="capacity-bar"><span data-live-shipment-progress="${shipment.id}" style="width:${progress}%"></span></div>
    </div>`;
  }).join("");
  return `<div class="dispatch-mini-grid">${rows}</div>`;
}

function renderNpcRouteTraffic() {
  const traffic = npcRouteTrafficForCity(state.district).slice(0, 6);
  if (!traffic.length) return `<div class="dispatch-empty-strip"><strong>No NPC traffic visible</strong><span>More route traffic will drift in shortly.</span></div>`;
  const rows = traffic.map((entry) => {
    const vehicle = itemByName(entry.vehicle);
    const total = Math.max(1, entry.endsAt - entry.startedAt);
    const progress = Math.min(100, Math.max(0, ((Date.now() - entry.startedAt) / total) * 100));
    return `<div class="npc-traffic-row ${entry.kind}">
      <span class="item-name">${icon(vehicle.iconName, vehicle.rarity)} ${entry.name}</span>
      <strong>${npcTrafficKindLabel(entry.kind)}</strong>
      <em>${districtById(entry.from).name} -> ${districtById(entry.to).name}</em>
      <div class="capacity-bar"><span style="width:${progress}%"></span></div>
    </div>`;
  }).join("");
  return `<div class="npc-traffic-list">${rows}</div>`;
}

function renderAdminRouteTrafficPanel() {
  const now = Date.now();
  const activeJobs = (state.shipments || [])
    .filter((entry) => entry.status === "in-transit")
    .sort((a, b) => a.arrivesAt - b.arrivesAt);
  const counts = ["merchant", "routejack"].map((role) => {
    const count = activeJobs.filter((entry) => entry.profession === role || (role === "routejack" && entry.kind === "intercept")).length;
    return `<div class="side-metric"><span>${roles[role].label}</span><strong>${count}</strong></div>`;
  }).join("");
  const rows = activeJobs.length
    ? activeJobs.map((entry) => {
      const total = Math.max(1, entry.arrivesAt - entry.startedAt);
      const progress = Math.min(100, Math.max(0, ((now - entry.startedAt) / total) * 100));
      const role = entry.kind === "intercept" ? "routejack" : entry.profession || "merchant";
      return `<div class="admin-traffic-row ${role}">
        <span>${roles[role]?.label || "Route Job"}</span>
        <strong>${state.player}</strong>
        <em>${districtById(entry.from).name} -> ${districtById(entry.to).name}</em>
        <span>${entry.vehicle}${entry.escortVehicle ? ` + ${entry.escortVehicle}` : ""}</span>
        <span>${formatPower(Math.max(0, entry.arrivesAt - now) / 1000)}</span>
        <span>${entry.kind === "intercept" ? `${(entry.loot || []).length}/${entry.capacity || routeRunCapacity(entry)} loot` : shipmentCargoShortLabel(entry)}</span>
        <div class="capacity-bar"><span style="width:${progress}%"></span></div>
      </div>`;
    }).join("")
    : `<p class="muted">No player route jobs are currently in motion.</p>`;
  return `<article class="admin-card admin-wide">
    <div class="blueprint-head">
      <div>
        <h3>Admin Route Activity</h3>
        <p class="muted">Current player dispatches only. NPC encounters are random route events and are not represented as live traffic.</p>
      </div>
      <span class="pill">${activeJobs.length} active</span>
    </div>
    <div class="fab-metrics">${counts}</div>
    <div class="admin-traffic-list">${rows}</div>
  </article>`;
}

function renderAdminEncounterDesigner() {
  const catalog = routeEncounterCatalog();
  const unitCatalog = npcCombatUnitCatalog();
  const summaryRows = catalog.map((entry) => `<div class="market-line">
    <span>${entry.role === "routejack" ? "Routejack target" : "Merchant threat"}: ${entry.label}</span>
    <strong>${Math.round(entry.ratePerHour * 100)}%/hr - ${entry.routeKinds.join("/")} - ${(entry.waves || []).length} wave${(entry.waves || []).length === 1 ? "" : "s"}</strong>
  </div>`).join("");
  const unitRows = unitCatalog.map((unit) => `<div class="market-line">
    <span>${unit.label}</span>
    <strong>${unit.role} - HP ${unit.maxHp} / SPD ${unit.speed} / IMP ${unit.impact}</strong>
  </div>`).join("");
  const clearanceRows = allRoutePairs()
    .map(({ from, route }) => {
      const summary = routeClearanceSummary(from, route.to);
      return summary ? `<div class="market-line"><span>${routeLabel(from, route.to)}</span><strong>${summary}</strong></div>` : "";
    })
    .filter(Boolean)
    .join("") || `<p class="muted">No stabilized routes right now.</p>`;
  return `<article class="admin-card admin-wide">
    <div class="blueprint-head">
      <div>
        <h3>Encounter Designer</h3>
        <p class="muted">Edit the route encounter catalog as JSON. Each entry controls role, route type, hourly rate, difficulty, waves, and stabilization rewards.</p>
      </div>
      <span class="pill">${catalog.length} encounters</span>
    </div>
    <div class="encounter-admin-layout">
      <div>
        <h4>Encounters & Waves</h4>
        <textarea id="adminEncounterJson" class="encounter-json" spellcheck="false">${escapeHtml(JSON.stringify(catalog, null, 2))}</textarea>
        <div class="button-row">
          <button type="button" data-admin="save-encounters">Save Encounters</button>
          <button type="button" data-admin="reset-encounters">Reset Encounters</button>
        </div>
      </div>
      <div>
        <h4>Custom NPC Units</h4>
        <textarea id="adminNpcUnitJson" class="encounter-json compact" spellcheck="false">${escapeHtml(JSON.stringify(unitCatalog, null, 2))}</textarea>
        <div class="button-row">
          <button type="button" data-admin="save-npc-units">Save NPC Units</button>
          <button type="button" data-admin="reset-npc-units">Reset NPC Units</button>
        </div>
      </div>
      <div class="encounter-admin-summary">
        <h4>Catalog Summary</h4>
        ${summaryRows}
        <h4>NPC Units</h4>
        ${unitRows}
        <h4>Route Stabilization</h4>
        ${clearanceRows}
        <h4>Creator Notes</h4>
        <p class="muted">Use <code>attackerUnits</code> for threats against Merchant convoys and <code>defenderUnits</code> for Routejack targets. A wave can set <code>failureMode: "destroy"</code> for hazards that disable vehicles instead of stealing cargo.</p>
      </div>
    </div>
  </article>`;
}

function renderFabDetail() {
  const fab = fabById(state.selectedFabId);
  if (!fab) {
    renderFindings();
    return;
  }
  const index = state.fabs.indexOf(fab);
  const definition = fabDefinition(fab.type);
  const city = districtById(fab.city);
  const queuedForFab = state.output.filter((entry) => outputFabId(entry) === fab.id);
  const cityQueued = queuedOutputFor(fab.city).length;
  const equipmentBonus = equipmentRateBonus(fab);
  const removalBlock = fabRemovalBlock(fab);
  const removalLabel = fab.rentedUntil ? "End Lease" : `Sell Fab ${formatCredits(fabSellValue(fab))}`;
  const printPatterns = printPatternsForFabType(fab.type);
  const activePattern = printPatternForFab(fab);
  const patternOptions = printPatterns
    .map((pattern) => `<option value="${pattern.id}" ${activePattern.id === pattern.id ? "selected" : ""}>${pattern.label}</option>`)
    .join("");
  const previewItems = activePattern.items.slice(0, 12);
  const patternPreview = previewItems
    .map((item) => `<span class="preview-chip">${icon(item.iconName, item.rarity)} ${rarityMeta[item.rarity].label}: ${item.name}</span>`)
    .join("") + (activePattern.items.length > previewItems.length ? `<span class="preview-chip">+${activePattern.items.length - previewItems.length} more</span>` : "");
  const recentOutput = (state.fabOutputHistory[fab.id] || [])
    .map((entry) => {
      const item = itemByName(entry.name);
      return `<div class="market-line"><span class="item-name">${icon(item.iconName, item.rarity)} ${entry.name}</span><strong>${entry.result} ${entry.at}</strong></div>`;
    })
    .join("");
  const equipmentRows = equipmentSlots.map((slot) => {
    const equipped = fab.equipment?.[slot.id];
    const equippedItem = equipped ? itemByName(equipped) : null;
    const isOpen = state.activeEquipmentSlot === slot.id;
    const options = equipmentInSlot(fab.city, slot.id);
    const optionRows = options.length
      ? options.map(({ item, count }) => `<div class="equipment-option">
          <span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span>
          <strong>+${Math.round(item.rateBonus * 100)}%</strong>
          <em>x${count}</em>
          <button type="button" data-equip-fab-item="${item.name}">Equip</button>
        </div>`).join("")
      : `<p class="muted">No ${slot.label.toLowerCase()} parts stored in ${city.name}.</p>`;
    return `<div class="equipment-slot ${isOpen ? "open" : ""}">
      <button type="button" class="equipment-slot-toggle" data-equipment-slot="${slot.id}">
        <span>${slot.label}</span>
        <strong>${equippedItem ? `${icon(equippedItem.iconName, equippedItem.rarity)} ${equippedItem.name}` : "Empty"}</strong>
        <em>${equippedItem ? `+${Math.round(equippedItem.rateBonus * 100)}%` : "+0%"}</em>
      </button>
      ${isOpen ? `<div class="equipment-tray">${optionRows}</div>` : ""}
    </div>`;
  }).join("");
  mainPanel.innerHTML = `
    <section class="fab-detail" style="--accent:${definition.accent}">
      ${renderFabStaticTile(fab, queuedForFab.length, queuedForFab.length ? "ready" : state.power <= 0 ? "blocked" : "printing")}
      <div>
        <div class="blueprint-head">
          <div>
            <h2>${definition.label}</h2>
            <p class="muted">Fab ID ${fab.id} - ${city.name} - ${fab.ownedStatus || "owned"}</p>
          </div>
          <span class="pill">${definition.group}</span>
        </div>
        <div class="fab-metrics">
          <div class="side-metric"><span>Output Rate</span><strong>${effectiveFabRate(fab).toFixed(2)} grams/hour</strong></div>
          <div class="side-metric"><span>Base Rate</span><strong>${fab.rate.toFixed(2)} grams/hour</strong></div>
          <div class="side-metric"><span>Equipment Bonus</span><strong>+${Math.round(equipmentBonus * 100)}%</strong></div>
          <div class="side-metric"><span>Stored Mass</span><strong>${(fab.grams || 0).toFixed(2)}g</strong></div>
          <div class="side-metric"><span>Print Bay</span><strong>${queuedForFab.length || cityQueued} sealed</strong></div>
          <div class="side-metric"><span>Print Pattern</span><strong>${activePattern.label}</strong></div>
          <div class="side-metric"><span>Collection</span><strong>Manual</strong></div>
          <div class="side-metric"><span>Lease</span><strong>${fab.rentedUntil ? formatPower((fab.rentedUntil - Date.now()) / 1000) : "Owned"}</strong></div>
        </div>
        <div class="equipment-grid">${equipmentRows}</div>
        ${
          printPatterns.length
            ? `<div class="shipment-form fab-policy-form print-pattern-panel">
                <label><span>Print Pattern</span><select id="fabPrintPattern">${patternOptions}</select></label>
                <div class="pattern-copy">
                  <strong>${activePattern.label}</strong>
                  <p class="muted">${activePattern.description}</p>
                  ${fab.type === "starter" && fab.mode === "credits" ? `<p class="muted">This pattern applies when the starter fab is set to find relics. Gold mode prints credits instead.</p>` : ""}
                </div>
                <div class="fab-preview-list pattern-preview">${patternPreview}</div>
              </div>`
            : ""
        }
        <div class="button-row">
          <button type="button" data-view="fabs">All Fabs</button>
          <button type="button" data-view="cities">Open Map</button>
          <button type="button" data-retire-fab="${fab.id}" ${removalBlock ? "disabled" : ""}>${removalLabel}</button>
        </div>
        ${removalBlock ? `<p class="muted">${removalBlock}</p>` : `<p class="muted">${fab.rentedUntil ? "Ending the lease" : "Selling this fab"} returns installed equipment to ${city.name} inventory. Stored mass is lost.</p>`}
        ${
          fab.type === "starter"
            ? `<div class="mode-row" style="margin-top:12px">
                <label><input type="radio" name="fab-detail-${index}" data-mode="${index}:credits" ${fab.mode === "credits" ? "checked" : ""}> mine gold</label>
                <label><input type="radio" name="fab-detail-${index}" data-mode="${index}:parts" ${fab.mode === "parts" ? "checked" : ""}> find relics</label>
              </div>`
            : ""
        }
      </div>
    </section>
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>Equipment Inventory</h2>
          <p class="muted">Click a slot above to show compatible parts stored in ${city.name}. Replaced parts return to local inventory.</p>
        </div>
        <span class="pill">${inventoryLabel(fab.city)} slots</span>
      </div>
    </section>
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>Recent Output</h2>
          <p class="muted">This history updates when this fab's Print Bay is opened in ${city.name}.</p>
        </div>
        <span class="pill">${(state.fabOutputHistory[fab.id] || []).length} logged</span>
      </div>
      ${recentOutput || `<p class="muted">No collected output logged for this fab yet.</p>`}
    </section>`;
}

function renderMeldIngredientRow(part) {
  const item = itemByName(part.name);
  const missing = Math.max(0, part.count - part.owned);
  const homeAsk = lowestListing(state.homeCity, part.name);
  const bestAsk = bestAskEverywhere(part.name);
  const ownedPositions = itemCityPositions(part.name);
  const ownedText = ownedPositions.length
    ? ownedPositions.map(({ district, count }) => `${district.name} x${count}`).join(", ")
    : "none";
  const moveSource = ownedPositions.find(({ district }) => district.id !== state.homeCity && routePath(district.id, state.homeCity).length > 1);
  const movePath = moveSource ? routePath(moveSource.district.id, state.homeCity) : [];
  const actionLabel = missing ? "Get" : "Manage";
  const routeHint = moveSource ? `${moveSource.district.name}${movePath.length > 2 ? ` via ${districtById(movePath[1]).name}` : ""}` : "none";
  return `<div class="meld-source-row ${part.owned >= part.count ? "ready" : ""}">
    <div>
      <span class="item-name">${icon(item.iconName, item.rarity)} ${part.name}</span>
      <p class="muted">Need ${part.count}. Home has ${part.owned}. ${missing ? `Missing ${missing}.` : "Ready."}</p>
    </div>
    <div class="meld-source-metrics">
      <span>Home Ask <strong>${homeAsk ? formatCredits(homeAsk.price) : "none"}</strong></span>
      <span>Best Ask <strong>${bestAsk ? `${formatCredits(bestAsk.listing.price)} @ ${bestAsk.district.name}` : "none"}</strong></span>
      <span>Owned <strong>${ownedText}</strong></span>
      <span>Move Path <strong>${routeHint}</strong></span>
    </div>
    <button type="button" data-open-meld-actions="${part.name}">${actionLabel}</button>
  </div>`;
}

function renderMelds() {
  const isHomeView = state.district === state.homeCity;
  const meldTypes = [
    { id: "starter", label: "Starter Melds" },
    { id: "food", label: "Food Melds" },
  ];
  const visibleMelds = melds.filter((meld) => (meld.type || "starter") === state.selectedMeldType);
  const readyMelds = visibleMelds.filter((meld) => !state.completed.includes(meld.name) && canMeld(meld));
  const categoryButtons = `<div class="segmented">
    ${meldTypes.map((type) => `<button type="button" class="${state.selectedMeldType === type.id ? "active" : ""}" data-meld-type="${type.id}">${type.label}</button>`).join("")}
  </div>`;
  const animation = state.fuseAnimation
    ? `<div class="fuse-overlay">
        <div class="fuse-burst rarity-bg-${state.fuseAnimation.rarity}">
          <div class="tower"></div>
          <strong>${state.fuseAnimation.name}</strong>
          <span>meld fused</span>
        </div>
      </div>`
    : "";
  const remoteNotice = isHomeView
    ? ""
    : `<section class="panel">
        <h2>Melds Live In ${homeDistrict().name}</h2>
        <p class="muted">You are viewing ${currentDistrict().name}. Switch to your home city to inspect recipes and fuse melds.</p>
        <button type="button" data-view="cities">Open Map</button>
      </section>`;
  const meldCards = visibleMelds
    .map((meld) => {
      const done = state.completed.includes(meld.name);
      const ready = canMeld(meld);
      const progress = recipeProgress(meld)
        .map((part) => renderMeldIngredientRow(part))
        .join("");
      return `<article class="meld-card rarity-border-${meld.rarity} ${done ? "complete" : ""}">
        <div class="blueprint-head">
          <h3 class="item-name">${icon("data", meld.rarity)} ${meld.name}</h3>
          ${rarityPill(meld.rarity)}
        </div>
        <div class="recipe-list">${progress}</div>
        <p class="muted">${meld.bonus}</p>
        <button type="button" data-meld="${meld.name}" ${done || !ready ? "disabled" : ""}>${done ? "Fused" : "Fuse Meld"}</button>
      </article>`;
    })
    .join("");
  mainPanel.innerHTML = `${animation}
    <section class="panel">
      <div class="blueprint-head">
        <div>
          <h2>Meld Type</h2>
          <p class="muted">Melds use relics stored in your home city: ${homeDistrict().name}.</p>
        </div>
        <span class="pill">${visibleMelds.filter((meld) => state.completed.includes(meld.name)).length}/${visibleMelds.length} fused here</span>
      </div>
      ${categoryButtons}
    </section>
    ${
      isHomeView
        ? `<section class="panel" style="margin-top:14px">
            ${
              readyMelds.length
                ? ""
                : `<div class="empty-guidance">
                    <h3>No Fuse-Ready Melds Yet</h3>
                    <p class="muted">Meld recipes need their components in ${homeDistrict().name}. Collect from meld fabs, buy missing parts from the market, or move components home through Dispatch.</p>
                    <div class="button-row">
                      <button type="button" data-view="inventory">View Home Inventory</button>
                      <button type="button" data-view="shop">Buy Components</button>
                      <button type="button" data-view="fabs">Open Print Bay</button>
                    </div>
                  </div>`
            }
            <div class="meld-grid">${meldCards}</div>
          </section>`
        : remoteNotice
    }`;
}

function renderRoutejackDispatchForm() {
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
  const encounterEstimate = selectedRoute ? Math.max(1, Math.min(4, Math.max(patrolCapacity, Math.round(patrolHours * 1.35)))) : 0;
  return `<div class="shipment-form dispatch-builder routejack-builder">
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Raid Route</h3><span class="pill">${currentDistrict().name}</span></div>
      ${dispatchRouteCards(routes, state.pvpRoute, "data-raid-route", selectedVehicle)}
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Lead Vehicle</h3><span class="pill">attack lead</span></div>
      ${dispatchVehicleCards(availableVehicles, state.pvpVehicle, "data-raid-vehicle", "No compatible raid vehicles")}
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Support 1</h3><span class="pill">optional</span></div>
      <div class="dispatch-choice-grid vehicle-choice-grid">
        ${dispatchNoneCard(state.pvpSupport1 === "none", "data-raid-support-1", "No Support")}
        ${dispatchVehicleCards(supportEntries(state.pvpSupport1, [state.pvpVehicle]), state.pvpSupport1, "data-raid-support-1", "No support vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "")}
      </div>
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Support 2</h3><span class="pill">optional</span></div>
      <div class="dispatch-choice-grid vehicle-choice-grid">
        ${dispatchNoneCard(state.pvpSupport2 === "none", "data-raid-support-2", "No Support")}
        ${dispatchVehicleCards(supportEntries(state.pvpSupport2, [state.pvpVehicle, state.pvpSupport1]), state.pvpSupport2, "data-raid-support-2", "No support vehicles").replace(/^<div class="dispatch-choice-grid vehicle-choice-grid">|<\/div>$/g, "")}
      </div>
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Tactic</h3><span class="pill">${battleAttackerTactics[state.routejackTactic] || "Hit Cargo First"}</span></div>
      <div class="dispatch-choice-grid tactic-choice-grid">
        ${Object.entries(battleAttackerTactics).map(([id, label]) => dispatchChoiceCard({
          active: state.routejackTactic === id,
          attr: `data-routejack-tactic-choice="${id}"`,
          title: label,
          meta: id === "disable" ? "Safer vs escorts" : id === "scramble" ? "Press speed" : "Fastest steal",
          detail: id === "snatch" ? "Focus cargo first" : id === "disable" ? "Clear protection before cargo" : "Target fast units",
          iconName: id === "snatch" ? "chip" : id === "disable" ? "tool" : "data",
          rarity: id === "disable" ? "gold" : id === "scramble" ? "blue" : "green",
        })).join("")}
      </div>
    </section>
    <section class="dispatch-builder-section">
      <div class="card-row"><h3>Loot Hold</h3><span class="pill">${patrolCapacity} slots</span></div>
      <div class="dispatch-choice-grid tactic-choice-grid">
        ${dispatchChoiceCard({
          active: state.pvpLootPolicy === "upgrade",
          attr: `data-loot-policy-choice="upgrade"`,
          title: "Upgrade Loot",
          meta: "Replace weak finds",
          detail: "Dump lower rarity cargo for better cargo",
          iconName: "lens",
          rarity: "blue",
        })}
        ${dispatchChoiceCard({
          active: state.pvpLootPolicy === "first",
          attr: `data-loot-policy-choice="first"`,
          title: "Fill Hold",
          meta: "Keep first haul",
          detail: "Stop swapping once cargo is loaded",
          iconName: "poly",
          rarity: "green",
        })}
      </div>
    </section>
    <div class="dispatch-summary-strip">
      <div class="side-metric"><span>Raid Time</span><strong>${patrolHours ? formatRouteTime(patrolHours) : "No route"}</strong></div>
      <div class="side-metric"><span>Capacity</span><strong>${patrolCapacity || "Need vehicle"}</strong></div>
      <div class="side-metric"><span>Targets</span><strong>${encounterEstimate || "Need route"}</strong></div>
      <div class="side-metric"><span>Sensor</span><strong>${selectedVehicle?.category === "vehicle" ? vehicleSensorScore(selectedVehicle) : "No vehicle"}</strong></div>
    </div>
    <button type="button" data-action="attempt-intercept" ${routes.length && availableVehicles.length ? "" : "disabled"}>Launch Raid</button>
  </div>
  <p class="muted">Routejack raids fight designed NPC merchant targets. Capacity decides how much loot you can keep; support decides how likely you are to break harder targets.</p>`;
}

function renderScannerIntelPanel(scannerActive) {
  if (!scannerActive) {
    return `<div class="dispatch-empty-strip"><strong>Intel hidden</strong><span>Scanner boosts reveal hidden NPC route pressure from this city.</span></div>`;
  }
  const scannedRoutes = routeOptions(state.district)
    .map((route) => {
      const playerJobs = state.shipments.filter((shipment) => shipment.status === "in-transit" && sameRoute(shipment.from, shipment.to, state.district, route.to)).length;
      const sampleVehicle = itemByName(state.shipmentVehicle);
      const sample = routePreviewShipment(route, sampleVehicle);
      const encounter = sample
        ? `${routeEncounterHourlyChance(sample, route)}%/hr ${state.role === "routejack" ? "targets" : "risk"}`
        : "route dependent";
      const clearance = routeClearanceSummary(state.district, route.to);
      return `<div class="dispatch-mini-card">
        <div class="card-row"><strong>${currentDistrict().name} to ${route.district.name}</strong><span class="pill">${routeDistance(route)}mi</span></div>
        <span>${routeTargetRichness(route)} - ${encounter}</span>
        ${clearance ? `<em>${clearance}</em>` : ""}
        <em>${playerJobs} player job${playerJobs === 1 ? "" : "s"} currently out</em>
        <em>Scanner ${rarityMeta[state.routeScanQuality]?.label || "Active"}</em>
      </div>`;
    })
    .join("");
  return `<div class="dispatch-mini-grid">${scannedRoutes}</div>`;
}

function routeCommandPanel() {
  const selectedRouteId = state.role === "routejack" ? state.pvpRoute : state.shipmentDestination;
  const selectedRoute = routeTo(state.district, selectedRouteId) || routeOptions(state.district)[0];
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
  const roleCopy = state.role === "merchant"
    ? "Load cargo, choose a vehicle, and earn freight when it arrives."
    : state.role === "routejack"
      ? "Build a raid convoy against NPC merchant targets."
      : "Choose a route role to unlock dispatch work.";
  return `<section class="panel dispatch-command-panel role-${state.role}">
      <div class="blueprint-head">
        <div>
          <h2>${state.role === "routejack" ? "Raid Dispatch" : state.role === "merchant" ? "Cargo Dispatch" : "Dispatch Board"}</h2>
          <p class="muted">${currentDistrict().name}. ${roleCopy}</p>
        </div>
        <span class="pill">${currentRole().label}</span>
      </div>
      ${renderDispatchNotice()}
      <div class="dispatch-summary-strip">
        <div class="side-metric"><span>Active Jobs</span><strong>${activeForRole}</strong></div>
        <div class="side-metric"><span>Storage</span><strong>${inventoryLabel(state.district)}</strong></div>
        <div class="side-metric"><span>Scanner</span><strong>${scannerActive ? `${rarityMeta[state.routeScanQuality]?.label || "Active"} ${formatPower((state.routeScanUntil - Date.now()) / 1000)}` : "No intel"}</strong></div>
      </div>
      ${renderRoutePixelScene(selectedRoute, { compact: true })}
      <div class="dispatch-role-layout">
        <section class="dispatch-primary-panel">
          ${rolePanel}
        </section>
        <aside class="dispatch-side-panel">
          <div class="card-row"><h3>Active ${state.role === "routejack" ? "Raids" : "Convoys"}</h3><span class="pill">${activeForRole}</span></div>
          ${renderActiveDispatchSummary(state.role)}
          <div class="card-row"><h3>Route Intel</h3><span class="pill">${scannerActive ? "Scanner" : "Hidden"}</span></div>
          ${renderScannerIntelPanel(scannerActive)}
          <div class="button-row">
            <button type="button" data-view="inventory">Inventory</button>
            <button type="button" data-view="cities">Map</button>
          </div>
        </aside>
      </div>
    </section>`;
}

function routeBattleButton(battleId) {
  return battleId ? `<button type="button" data-route-battle="${battleId}">View Battle</button>` : "";
}

function renderShipments() {
  processShipments();
  const isMerchantView = state.role === "merchant";
  const isRoutejackView = state.role === "routejack";
  const active = state.shipments.filter((shipment) => shipment.status === "in-transit" && dispatchJobMatchesRole(shipment));
  const blocked = isMerchantView ? state.shipments.filter((shipment) => shipment.status === "blocked" && dispatchJobMatchesRole(shipment)).slice(0, 12) : [];
  const arrived = isMerchantView ? state.shipments.filter((shipment) => shipment.status === "arrived" && dispatchJobMatchesRole(shipment)).slice(0, 12) : [];
  const raided = isMerchantView ? state.shipments.filter((shipment) => shipment.status === "raided" && dispatchJobMatchesRole(shipment)).slice(0, 12) : [];
  const stolenRows = state.stolenGoods.length
    ? state.stolenGoods.slice(0, 12).map((entry) => `<div class="market-line"><span>${entry.raider} stole ${entry.qty}x ${entry.itemName}</span><strong>${entry.status === "recovered" ? "recovered" : `${districtById(entry.from).name} to ${districtById(entry.to).name}`}</strong></div>`).join("")
    : `<p class="muted">No stolen cargo recorded.</p>`;
  const shipmentRows = active.length
    ? active.map((shipment) => `<article class="shipment-card">
        <div class="card-row"><h3 class="item-name">${icon(itemByName(shipment.vehicle).iconName, itemByName(shipment.vehicle).rarity)} ${routeJobTitle(shipment)}</h3><span class="pill">${shipmentStatus(shipment)}</span></div>
        <p class="muted">${districtById(shipment.from).name} to ${districtById(shipment.to).name} aboard ${shipment.vehicle}${shipment.escortVehicle ? ` with ${shipment.escortVehicle} escort` : ""}. ${shipment.routeMiles ? `${shipment.routeMiles} miles at ${vehicleMph(itemByName(shipment.vehicle))} mph. ` : ""}${routeJobDetail(shipment)} Role: ${roles[shipment.profession]?.label || "Drifter"}.</p>
        <div class="capacity-bar"><span data-live-shipment-progress="${shipment.id}" style="width:${Math.min(100, ((Date.now() - shipment.startedAt) / (shipment.arrivesAt - shipment.startedAt)) * 100)}%"></span></div>
        ${(shipment.events || []).map((event) => `<p class="muted">${event}</p>`).join("")}
      </article>`).join("")
    : `<article class="empty-guidance">
        <h3>No ${isRoutejackView ? "Raids" : "Vehicles"} In Motion</h3>
        <p class="muted">${isRoutejackView ? "Routejack raids start from the controls above after you choose a route and vehicle convoy." : isMerchantView ? "Merchant cargo runs start from the controls above after you have cargo and a compatible vehicle in the same city." : "Choose Merchant or Routejack to unlock route dispatch work."}</p>
        <div class="button-row">
          <button type="button" data-view="inventory">Open Inventory</button>
          <button type="button" data-view="profession">Choose Role</button>
          <button type="button" data-view="cities">View Routes</button>
        </div>
      </article>`;
  const blockedRows = blocked.length
    ? blocked.map((shipment) => `<div class="market-line"><span>${shipmentCargoLabel(shipment)} is waiting for storage in ${districtById(shipment.to).name}</span><strong>${shipment.vehicle}</strong></div>`).join("")
    : `<p class="muted">No shipments are blocked.</p>`;
  const arrivedRows = arrived.length
    ? arrived.map((shipment) => `<div class="market-line"><span>${shipmentCargoLabel(shipment)} and ${shipment.vehicle}${shipment.escortVehicle ? ` + ${shipment.escortVehicle}` : ""}</span><strong>${districtById(shipment.to).name} at ${new Date(shipment.resolvedAt || shipment.arrivesAt).toLocaleTimeString()}${shipment.routeMiles ? ` - ${shipment.routeMiles}mi` : ""} ${routeBattleButton(shipment.battleId)}</strong></div>`).join("")
    : `<p class="muted">Nothing has arrived yet.</p>`;
  const raidedRows = raided.length
    ? raided.map((shipment) => `<div class="market-line"><span>${shipmentCargoLabel(shipment)} was raided between ${districtById(shipment.from).name} and ${districtById(shipment.to).name}</span><strong>${shipment.vehicle} returned ${routeBattleButton(shipment.battleId)}</strong></div>`).join("")
    : `<p class="muted">No raids recorded.</p>`;
  const intercepts = isRoutejackView ? state.shipments.filter((shipment) => shipment.kind === "intercept" && ["intercepted", "failed"].includes(shipment.status)).slice(0, 12) : [];
  const interceptRows = intercepts.length
    ? intercepts.map((run) => `<div class="market-line"><span>${run.status === "intercepted" ? `Returned with ${(run.loot || []).length} stolen item${(run.loot || []).length === 1 ? "" : "s"}` : "Returned empty"}</span><strong>${districtById(run.from).name} to ${districtById(run.to).name} ${routeBattleButton(run.battleId)}</strong></div>`).join("")
    : `<p class="muted">No Routejack NPC raids resolved yet.</p>`;
  const visibleBattles = state.routeBattles
    .filter((battle) => (isRoutejackView ? battle.kind === "routejack-npc" : isMerchantView ? battle.kind === "npc-raider-merchant" : false) || battle.id === state.selectedRouteBattleId)
    .slice(0, 12);
  const battleRows = visibleBattles.length
    ? visibleBattles.map((battle) => `<article class="shipment-card">
        <div class="card-row"><h3>${battle.title}</h3><span class="pill">${battleOutcomeLabel(battle.outcome)}</span></div>
        <p class="muted">${battle.route} - ${battle.routeMiles}mi ${battle.routeKind}. ${battle.cargo}. ${battle.at}</p>
        <button type="button" data-route-battle="${battle.id}">${state.selectedRouteBattleId === battle.id ? "Replay Selected" : "View Battle"}</button>
      </article>`).join("")
    : `<p class="muted">Route encounters will appear here after shipments or raids resolve.</p>`;
  const replayPanel = state.battleReplay?.source === "route-battle" && visibleBattles.some((battle) => battle.id === state.battleReplay.battleId)
    ? `<section class="panel" style="margin-top:14px">${renderLiveBattleReplay(state.battleReplay)}</section>`
    : "";
  const pvpRows = state.pvpLog.length
    ? state.pvpLog.slice(0, 8).map((entry) => `<div class="market-line"><span>${entry.text}</span><strong>${entry.at}</strong></div>`).join("")
    : `<p class="muted">No route encounter actions logged yet.</p>`;
  const merchantHistory = isMerchantView ? `
    <section class="panel" style="margin-top:14px">
      <h2>Blocked Arrivals</h2>
      ${blockedRows}
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Arrivals</h2>
      ${arrivedRows}
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Raided Convoys</h2>
      ${raidedRows}
    </section>` : "";
  const routejackHistory = isRoutejackView ? `
    <section class="panel" style="margin-top:14px">
      <h2>Raid Returns</h2>
      ${interceptRows}
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Stolen Goods Ledger</h2>
      ${stolenRows}
    </section>` : "";
  mainPanel.innerHTML = `
    ${routeCommandPanel()}
    ${replayPanel}
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>${isRoutejackView ? "Raids In Motion" : "Convoys In Motion"}</h2>
          <p class="muted">${isRoutejackView ? "Routejack jobs travel in real time and roll for NPC cargo targets while moving." : "Merchant convoys travel in real time and roll for NPC threats while moving."}</p>
        </div>
        <button type="button" data-view="inventory">Open Inventory</button>
      </div>
      <div class="shipment-grid">${shipmentRows}</div>
    </section>
    ${merchantHistory}
    ${routejackHistory}
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>Route Battles</h2>
          <p class="muted">Live and completed ${isRoutejackView ? "raid" : "convoy"} encounters keep their turn-by-turn battle replay here.</p>
        </div>
        <span class="pill">${visibleBattles.length}</span>
      </div>
      <div class="shipment-grid">${battleRows}</div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Route Log</h2>
      ${pvpRows}
    </section>`;
}

function renderItemDetail() {
  const item = itemByName(state.selectedItem);
  const owned = inventoryFor(state.district)[item.name] || 0;
  const ownedEverywhere = totalOwnedEverywhere(item.name);
  const asks = listingsFor(state.district, item.name).slice(0, 8);
  const bids = bidsFor(state.district, item.name).slice(0, 8);
  const bestAsk = asks[0];
  const bestBid = bids[0];
  const globalAsk = bestAskEverywhere(item.name);
  const globalBid = bestBidEverywhere(item.name);
  const localSales = recentSaleStats(item.name, state.district);
  const globalSales = recentSaleStats(item.name);
  const cityRows = cityMarketRows(item.name)
    .map((row) => {
      const bestListing = row.ask;
      const isCurrent = row.district.id === state.district;
      return `<div class="city-market-row ${row.district.id === state.district ? "current" : ""}">
        <span>${row.district.name}</span>
        <strong>${row.ask ? formatCredits(row.ask.price) : "no ask"}</strong>
        <strong>${row.bid ? formatCredits(row.bid.price) : "no bid"}</strong>
        <em>${row.owned}</em>
        ${isCurrent ? `<button type="button" data-buy-listing="${bestListing?.id || ""}" ${bestListing && state.credits >= bestListing.price && inventoryAvailable(row.district.id) > 0 ? "" : "disabled"}>Buy</button>` : `<span class="mini-tag">Map</span>`}
      </div>`;
    })
    .join("");
  const holdings = itemCityPositions(item.name)
    .map(({ district, count }) => `<span>${district.name} x${count}</span>`)
    .join("") || "<span>None stored in any city.</span>";
  const suggestedAsk = bestAsk?.price || item.value;
  const suggestedBid = bestBid?.price || Math.max(1, Math.round(item.value * 0.75));
  const equipTargets = item.equipmentSlot
    ? state.fabs
      .map((fab, index) => ({ fab, index }))
      .filter(({ fab }) => fab.city === state.district)
      .map(({ fab, index }) => {
        const current = fab.equipment?.[item.equipmentSlot];
        return `<option value="${index}">${fabDefinition(fab.type).label}${current ? ` - replaces ${current}` : " - empty slot"}</option>`;
      })
      .join("")
    : "";
  mainPanel.innerHTML = `
    <section class="detail-card">
      <div class="detail-layout">
        <div>
          <h2 class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</h2>
          <p class="muted">${item.fab} - ${rarityMeta[item.rarity].label}</p>
          <p>${item.description}</p>
          <p>${item.use}</p>
          <p class="muted">Owned in ${currentDistrict().name}: ${owned}. Owned everywhere: ${ownedEverywhere}. Storage ${inventoryLabel(state.district)}.</p>
          <div class="watch-chip-row">${holdings}</div>
          <div class="button-row">
            ${renderWatchButton(item.name)}
            <button type="button" data-action="use-selected" ${owned && item.effect ? "" : "disabled"}>Use</button>
            <button type="button" data-action="recycle-selected" ${owned ? "" : "disabled"}>Recycle 1cr</button>
            <button type="button" data-action="trash-selected" ${owned ? "" : "disabled"}>Trash</button>
          </div>
        </div>
        <div class="item-picture rarity-bg-${item.rarity}"><div class="tower"></div></div>
      </div>
    </section>`;
  mainPanel.innerHTML += `
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>Price Snapshot</h2>
          <p class="muted">Local orders only. Use the map to shop another city.</p>
        </div>
        <span class="pill">${isWatched(item.name) ? "Watched" : "Not watched"}</span>
      </div>
      <div class="fab-metrics">
        <div class="side-metric"><span>Local Ask</span><strong>${bestAsk ? formatCredits(bestAsk.price) : "none"}</strong></div>
        <div class="side-metric"><span>Local Bid</span><strong>${bestBid ? formatCredits(bestBid.price) : "none"}</strong></div>
        <div class="side-metric"><span>Best Ask</span><strong>${globalAsk ? `${formatCredits(globalAsk.listing.price)} @ ${globalAsk.district.name}` : "none"}</strong></div>
        <div class="side-metric"><span>Best Bid</span><strong>${globalBid ? `${formatCredits(globalBid.bidOrder.price)} @ ${globalBid.district.name}` : "none"}</strong></div>
        <div class="side-metric"><span>Local Sales</span><strong>${localSales ? `${formatCredits(localSales.low)}-${formatCredits(localSales.high)}` : "none"}</strong></div>
        <div class="side-metric"><span>All Sales Avg</span><strong>${globalSales ? formatCredits(globalSales.average) : "none"}</strong></div>
      </div>
      <div class="city-market-table">
        <div class="city-market-row head"><span>City</span><strong>Ask</strong><strong>Bid</strong><em>Owned</em><span></span></div>
        ${cityRows}
      </div>
    </section>`;
  if (item.category === "vehicle") {
    mainPanel.innerHTML += `
      <section class="panel" style="margin-top:14px">
        <h2>Route Stats</h2>
        <div class="fab-metrics">
          <div class="side-metric"><span>Speed</span><strong>${vehicleMph(item)} mph</strong></div>
          <div class="side-metric"><span>Route Type</span><strong>${vehicleModeLabel(item)}</strong></div>
          <div class="side-metric"><span>Cargo Capacity</span><strong>${Math.max(1, Number(item.capacity || 1))}</strong></div>
          <div class="side-metric"><span>Detection Profile</span><strong>${profileBand(vehicleProfileScore(item))} (${vehicleProfileScore(item)})</strong></div>
          <div class="side-metric"><span>Sensor Rating</span><strong>${vehicleSensorScore(item)}</strong></div>
          <div class="side-metric"><span>Durability</span><strong>${Number(item.durability || 0)}</strong></div>
          <div class="side-metric"><span>Attack / Defense</span><strong>${vehicleAttackScore(item)} / ${vehicleDefenseScore(item)}</strong></div>
        </div>
      </section>`;
  }
  if (item.effect === "filament") {
    const previewRows = rarityOrder
      .map((rarity, index) => {
        const base = Math.max(0, Number(state.dropRates[rarity] ?? rarityMeta[rarity].weight));
        const boosted = Math.round(base * (1 + item.amount * index));
        const total = Math.max(0, Number(state.noItemWeight || 0)) + rarityOrder.reduce((sum, nextRarity, nextIndex) => {
          const nextBase = Math.max(0, Number(state.dropRates[nextRarity] ?? rarityMeta[nextRarity].weight));
          return sum + Math.round(nextBase * (1 + item.amount * nextIndex));
        }, 0);
        return `<div class="market-line"><span>${rarityMeta[rarity].label}</span><strong>${tierOdds(rarity)} -> ${formatOdds((boosted / total) * 100)}</strong></div>`;
      })
      .join("");
    mainPanel.innerHTML += `
      <section class="panel" style="margin-top:14px">
        <h2>Filament Preview</h2>
        <p class="muted">Filament does not guarantee better output; it shifts the roll weights while active. It affects every fab that creates item output.</p>
        ${previewRows}
      </section>`;
  }
  if (item.effect === "scanner") {
    mainPanel.innerHTML += `
      <section class="panel" style="margin-top:14px">
        <h2>Scanner Preview</h2>
        <p class="muted">Using this sends you to Dispatch and reveals hidden NPC route pressure and cargo runs on routes connected to ${currentDistrict().name}.</p>
      </section>`;
  }
  if (item.effect === "fabBurst") {
    const fabTargets = state.fabs
      .map((fab) => `<option value="${fab.id}" ${state.selectedFabId === fab.id ? "selected" : ""}>${fabDefinition(fab.type).label} - ${districtById(fab.city).name}</option>`)
      .join("");
    mainPanel.innerHTML += `
      <section class="panel" style="margin-top:14px">
        <h2>Nethack Burst Target</h2>
        <p class="muted">This one-use script instantly runs ${item.amount.toLocaleString()}g of output rolls on the selected fab. Prints go to that fab city's Print Bay.</p>
        <div class="shipment-form">
          <label><span>Target Fab</span><select id="boostFabTarget">${fabTargets}</select></label>
        </div>
      </section>`;
  }
  if (item.equipmentSlot) {
    const slot = equipmentSlots.find((candidate) => candidate.id === item.equipmentSlot);
    mainPanel.innerHTML += `
      <section class="panel" style="margin-top:14px">
        <h2>Equip Upgrade</h2>
        <p class="muted">${slot.label} part. Equipping it boosts one fab by +${Math.round(item.rateBonus * 100)}% grams/hour. The old part, if any, returns to ${currentDistrict().name} inventory.</p>
        <div class="shipment-form">
          <label><span>Target Fab</span><select id="equipFabTarget">${equipTargets || `<option value="">No fabs in ${currentDistrict().name}</option>`}</select></label>
          <button type="button" data-action="equip-selected" ${owned && equipTargets ? "" : "disabled"}>Equip To Fab</button>
        </div>
      </section>`;
  }
  mainPanel.innerHTML += `
    <section class="panel market-book" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>${currentDistrict().name} Order Book</h2>
          <p class="muted">Listings and bids are city-local. Purchases land in this city's inventory.</p>
        </div>
        <span class="pill">${formatCredits(state.credits)}</span>
      </div>
      <div class="market-columns">
        <div>
          <h3>Listings</h3>
          ${asks.length ? asks.map((listing) => `<div class="order-row">
            <span>${listing.seller}</span>
            <strong>${formatCredits(listing.price)}</strong>
            <span>x${listing.qty}</span>
            ${
              listing.owner === "player"
                ? `<button type="button" data-cancel-listing="${listing.id}">Cancel</button>`
                : `<button type="button" data-buy-listing="${listing.id}" ${state.credits >= listing.price && inventoryAvailable(listing.cityId) > 0 ? "" : "disabled"}>Buy</button>`
            }
          </div>`).join("") : `<p class="muted">No listings yet. Post a bid to attract sellers.</p>`}
        </div>
        <div>
          <h3>Buy Orders</h3>
          ${bids.length ? bids.map((bid) => `<div class="order-row">
            <span>${bid.buyer}</span>
            <strong>${formatCredits(bid.price)}</strong>
            <span>x${bid.qty}</span>
            ${
              bid.owner === "player"
                ? `<button type="button" data-cancel-bid="${bid.id}">Cancel</button>`
                : `<button type="button" data-sell-bid="${bid.id}" ${owned ? "" : "disabled"}>Sell</button>`
            }
          </div>`).join("") : `<p class="muted">No buy orders yet.</p>`}
        </div>
      </div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Place Orders</h2>
      <div class="market-actions">
        <label><span>List Qty</span><input id="marketListQty" type="number" value="1" min="1" max="${Math.max(1, owned)}" step="1"></label>
        <label><span>Ask Price</span><input id="marketListPrice" type="number" value="${suggestedAsk}" min="1" step="1"></label>
        <button type="button" data-action="list-selected" ${owned ? "" : "disabled"}>List For Sale</button>
        <label><span>Bid Qty</span><input id="marketBidQty" type="number" value="1" min="1" step="1"></label>
        <label><span>Bid Price</span><input id="marketBidPrice" type="number" value="${suggestedBid}" min="1" step="1"></label>
        <button type="button" data-action="bid-selected" ${state.credits >= suggestedBid ? "" : "disabled"}>Post Buy Order</button>
      </div>
      <div class="market-actions">
        <label><span>Buy Qty</span><input id="marketBuyQty" type="number" value="1" min="1" step="1"></label>
        <label><span>Sell Qty</span><input id="marketSellQty" type="number" value="1" min="1" max="${Math.max(1, owned)}" step="1"></label>
        <span class="muted">Use these quantities when clicking Buy or Sell in the order book.</span>
      </div>
    </section>`;
}

function renderMarket() {
  const visibleItems = filteredMarketItems();
  const categoryOptions = Object.entries(marketCategories)
    .filter(([id]) => id === "all" || allItems().some((item) => item.category === id || item.type === id))
    .map(([id, label]) => `<button type="button" class="${state.marketCategory === id ? "active" : ""}" data-market-category="${id}">${label}</button>`)
    .join("");
  const rarityOptions = [`<option value="all" ${state.marketRarity === "all" ? "selected" : ""}>All Rarities</option>`]
    .concat(rarityOrder.map((rarity) => `<option value="${rarity}" ${state.marketRarity === rarity ? "selected" : ""}>${rarityMeta[rarity].label}</option>`))
    .join("");
  const rows = visibleItems.map(({ item, stats }) => {
    const { ask, bid, owned, listed, wanted, spread } = stats;
    const globalAsk = bestAskEverywhere(item.name);
    const globalBid = bestBidEverywhere(item.name);
    return `<article class="item-card market-summary">
      <div class="card-row"><h3 class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</h3>${rarityPill(item.rarity)}</div>
      <p class="muted">${item.source} - ${marketCategories[item.category] || item.category}</p>
      <div class="market-stats">
        <span>Local Ask <strong>${ask ? formatCredits(ask.price) : "none"}</strong></span>
        <span>Local Bid <strong>${bid ? formatCredits(bid.price) : "none"}</strong></span>
        <span>Best Ask <strong>${globalAsk ? `${formatCredits(globalAsk.listing.price)} @ ${globalAsk.district.name}` : "none"}</strong></span>
        <span>Best Bid <strong>${globalBid ? `${formatCredits(globalBid.bidOrder.price)} @ ${globalBid.district.name}` : "none"}</strong></span>
        <span>Spread <strong>${spread === null ? "none" : formatCredits(spread)}</strong></span>
        <span>Listed <strong>${listed}</strong></span>
        <span>Wanted <strong>${wanted}</strong></span>
        <span>Owned Here <strong>${owned}</strong></span>
      </div>
      <div class="button-row">
        <button type="button" data-item="${item.name}">Open Book</button>
        ${renderWatchButton(item.name)}
      </div>
    </article>`;
  }).join("");
  const history = state.marketHistory.length
    ? state.marketHistory.map((entry) => `<div class="market-line"><span>${entry.type} ${entry.qty}x ${entry.itemName}</span><strong>${formatCredits(entry.price)} @ ${districtById(entry.cityId).name}</strong></div>`).join("")
    : `<p class="muted">No transactions yet.</p>`;
  mainPanel.innerHTML = `
    <section class="panel">
      <h2>${currentDistrict().name} Market</h2>
      <div class="capacity-bar" aria-label="Inventory capacity"><span style="width:${Math.min(100, (inventoryCount(state.district) / inventoryLimit(state.district)) * 100)}%"></span></div>
      <div class="market-intel-grid">
        ${renderMeldShoppingList()}
        ${renderMarketWatchlist()}
      </div>
      <div class="market-toolbar">
        <div class="segmented">${categoryOptions}</div>
        <label class="search-field"><span>Search</span><input id="marketSearch" type="search" value="${state.marketSearch}" placeholder="Item, rarity, source"></label>
        <label class="select-field"><span>Rarity</span><select id="marketRarity">${rarityOptions}</select></label>
        <label class="select-field"><span>Sort</span><select id="marketSort">
          <option value="ask" ${state.marketSort === "ask" ? "selected" : ""}>Lowest Ask</option>
          <option value="bid" ${state.marketSort === "bid" ? "selected" : ""}>Highest Bid</option>
          <option value="spread" ${state.marketSort === "spread" ? "selected" : ""}>Tightest Spread</option>
          <option value="owned" ${state.marketSort === "owned" ? "selected" : ""}>Owned Here</option>
          <option value="rarity" ${state.marketSort === "rarity" ? "selected" : ""}>Rarity</option>
          <option value="volume" ${state.marketSort === "volume" ? "selected" : ""}>Volume</option>
          <option value="name" ${state.marketSort === "name" ? "selected" : ""}>Name</option>
        </select></label>
        <label class="toggle-field"><input id="marketShowEmpty" type="checkbox" ${state.marketShowEmpty ? "checked" : ""}> Show empty</label>
        <label class="toggle-field"><input id="marketWatchOnly" type="checkbox" ${state.marketWatchOnly ? "checked" : ""}> Watched only</label>
      </div>
      <div class="market-count">${visibleItems.length} markets shown${state.marketWatchOnly ? ` from ${state.marketWatchlist.length} watched item${state.marketWatchlist.length === 1 ? "" : "s"}` : ""}</div>
      <div class="item-grid">${rows || `<div class="empty-guidance">
        <h3>No Markets Match These Filters</h3>
        <p class="muted">Adjust filters.</p>
        <div class="button-row">
          <button type="button" data-action="market-clear-filters">Clear Filters</button>
          <button type="button" data-view="inventory">View Inventory</button>
        </div>
      </div>`}</div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Transaction History</h2>
      ${history}
    </section>`;
}

function renderFabShop() {
  const categoryButtons = fabShopCategories
    .map((category) => `<button type="button" class="${state.fabShopCategory === category ? "active" : ""}" data-fab-shop-category="${category}">${category === "all" ? "All" : category}</button>`)
    .join("");
  const visibleFabs = fabCatalog
    .filter((fab) => state.fabShopCategory === "all" || fab.category === state.fabShopCategory)
    .filter((fab) => state.fabShopScope === "all" || fab.cities.includes(state.district))
    .sort((a, b) => Number(!a.cities.includes(state.district)) - Number(!b.cities.includes(state.district)) || a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
  const cards = visibleFabs.map((fab) => {
    const availableHere = fab.cities.includes(state.district);
    const ownedCount = state.fabs.filter((ownedFab) => ownedFab.type === fab.type).length;
    const full = state.fabs.length >= MAX_ACTIVE_FABS;
    const soldIn = fab.cities.map((city) => districtById(city).name).join(", ");
    return `<article class="item-card market-summary shop-fab-card ${availableHere ? "available-here" : "remote-only"}">
      <div class="card-row">
        <h3>${fab.label}</h3>
        <span class="pill">${availableHere ? "Available Here" : "Elsewhere"}</span>
      </div>
      <div class="fab-preview-list">${fabPreviewItems(fab.type)}</div>
      <div class="market-stats">
        <span>Buy <strong>${formatCredits(fab.buyPrice)}</strong></span>
        <span>Rent <strong>${formatCredits(fab.rentPrice)} / ${Math.round(fab.rentHours / 24)}d</strong></span>
        <span>Rate <strong>${fab.rate} g/hr</strong></span>
        <span>Sold In <strong>${soldIn}</strong></span>
        <span>Owned <strong>${ownedCount}</strong></span>
        <span>Slots <strong>${state.fabs.length}/${MAX_ACTIVE_FABS}</strong></span>
      </div>
      <div class="button-row">
        <button type="button" data-buy-fab="${fab.type}" ${availableHere && !full && state.credits >= fab.buyPrice ? "" : "disabled"}>Buy</button>
        <button type="button" data-rent-fab="${fab.type}" ${availableHere && !full && state.credits >= fab.rentPrice ? "" : "disabled"}>Rent</button>
      </div>
      ${
        !availableHere
          ? `<p class="muted">Remote only.</p>`
          : full
            ? `<p class="muted">Slots full.</p>`
            : ""
      }
    </article>`;
  }).join("");
  const ownedRows = state.fabs.map(renderOwnedFabCard).join("");
  mainPanel.innerHTML = `
    <section class="panel">
      <div class="blueprint-head">
        <div>
          <h2>Fab Shop</h2>
          <p class="muted">Buy or rent city fabs.</p>
        </div>
        <span class="pill">${state.fabs.length}/${MAX_ACTIVE_FABS} slots</span>
      </div>
      <div class="market-toolbar">
        <div class="segmented">${categoryButtons}</div>
        <label class="select-field"><span>Availability</span><select id="fabShopScope">
          <option value="current" ${state.fabShopScope === "current" ? "selected" : ""}>Available in ${currentDistrict().name}</option>
          <option value="all" ${state.fabShopScope === "all" ? "selected" : ""}>All cities</option>
        </select></label>
      </div>
      <div class="market-count">${visibleFabs.length} fab${visibleFabs.length === 1 ? "" : "s"} shown</div>
      <div class="item-grid">${cards || `<p class="muted">No fabs match these filters.</p>`}</div>
    </section>
    <section class="panel" style="margin-top:14px">
      <div class="blueprint-head">
        <div>
          <h2>Your Fab Slots</h2>
          <p class="muted">Installed machines.</p>
        </div>
        <button type="button" data-view="fabs">Open Fabs</button>
      </div>
      <div class="item-grid">${ownedRows}</div>
    </section>`;
}

function renderRoles() {
  const lockReason = professionLockReason();
  mainPanel.innerHTML = `<section class="panel">
    <div class="blueprint-head">
        <div>
          <h2>Professions</h2>
        <p class="muted">One active role.</p>
      </div>
      <span class="pill">${currentRole().label}</span>
    </div>
    ${lockReason ? `<p class="battery-empty">${lockReason}</p>` : ""}
    <div class="blueprint-list">${Object.entries(roles)
      .map(([id, role]) => {
        const locked = level() < role.unlock;
        const active = id === state.role;
        const committed = Boolean(lockReason) && !active;
        return `<article class="blueprint-row ${active ? "complete" : ""}">
          <strong>${role.label}</strong>
          <button type="button" data-role="${id}" ${active || locked || committed ? "disabled" : ""}>${active ? "Active" : "Choose"}</button>
          <span>${role.text}</span>
          <span>${role.benefit}</span>
          <em>${locked ? `Requires meld level ${role.unlock}` : committed ? "Locked until route work resolves" : "Unlocked"}</em>
        </article>`;
      })
      .join("")}</div>
    </section>
    <section class="panel" style="margin-top:14px">
      <h2>Route Work</h2>
      <div class="button-row"><button type="button" data-view="shipments">Open Dispatch</button></div>
    </section>`;
}

function renderDistricts() {
  const seenRoutes = new Set();
  const uniqueRoutes = districts
    .flatMap((district) => district.routes
      .filter((route) => {
        const key = [district.id, route.to].sort().join(":");
        if (seenRoutes.has(key)) return false;
        seenRoutes.add(key);
        return true;
      })
      .map((route) => ({ from: district, to: districtById(route.to), miles: routeDistance(route), type: routeKind(route) })));
  const routeLines = uniqueRoutes
    .map((route) => `<div class="route-line"><span>${route.from.name}</span><strong>${route.miles}mi ${route.type}</strong><span>${route.to.name}</span></div>`)
    .join("");
  const mapRoutes = uniqueRoutes.map((route) => `<line x1="${route.from.map.x}" y1="${route.from.map.y}" x2="${route.to.map.x}" y2="${route.to.map.y}" class="map-route"></line>
    <text x="${(route.from.map.x + route.to.map.x) / 2}" y="${(route.from.map.y + route.to.map.y) / 2 - 2}" class="map-label">${route.miles}mi${route.type === "water" ? " sea" : ""}</text>`).join("");
  const mapNodes = districts.map((district) => `<button type="button" class="map-node ${district.id === state.district ? "active" : ""} ${district.id === state.homeCity ? "home" : ""}" style="left:${district.map.x}%;top:${district.map.y}%" data-district="${district.id}">
      <span>${district.name}</span>
    </button>`).join("");
  mainPanel.innerHTML = `
    <section class="panel">
      <div class="blueprint-head">
        <div>
          <h2>City Routes</h2>
          <p class="muted">Known connections.</p>
        </div>
        <span class="pill">Risk map</span>
      </div>
      <div class="network-map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${mapRoutes}</svg>
        ${mapNodes}
      </div>
      <div class="route-grid">${routeLines}</div>
    </section>
    <div class="district-grid city-grid">${districts
    .map((district) => {
      const isHome = district.id === state.homeCity;
      const isViewing = district.id === state.district;
      const capacityPercent = Math.min(100, (inventoryCount(district.id) / inventoryLimit(district.id)) * 100);
      return `<article class="item-card city-card">
      <div class="card-row"><h3>${district.name}</h3>${isHome ? `<span class="pill">Home</span>` : ""}</div>
      <p class="muted">${district.description}</p>
      <div class="city-facts">
        <span>Storage <strong>${inventoryLabel(district.id)}</strong></span>
        <span>Listings <strong>${listingsFor(district.id).reduce((sum, listing) => sum + listing.qty, 0)}</strong></span>
        <span>Fabs <strong>${fabTypeList(district)}</strong></span>
        <span>Routes <strong>${routeSummary(district)}</strong></span>
      </div>
      <div class="capacity-bar"><span style="width:${capacityPercent}%"></span></div>
      <div class="button-row">
        <button type="button" data-district="${district.id}" ${isViewing ? "disabled" : ""}>${isViewing ? "Viewing" : "View City"}</button>
        <button type="button" data-home-city="${district.id}" ${state.homeChosen || !STARTER_HOME_CITIES.includes(district.id) ? "disabled" : ""}>${!state.homeChosen && STARTER_HOME_CITIES.includes(district.id) ? "Start Here" : isHome ? "Home" : "Home Locked"}</button>
      </div>
    </article>`;
    })
    .join("")}</div>`;
}

function renderWiki() {
  const fabRows = fabCatalog.map((fab) => `<div class="wiki-row">
    <strong>${fab.label}</strong>
    <span>${fab.category} fab. ${fab.rate} grams/hour base rate. Patterns: ${printPatternsForFabType(fab.type).map((pattern) => pattern.label).join(", ")}. Sold in ${fab.cities.map((city) => districtById(city).name).join(", ")}.</span>
  </div>`).join("");
  const roleRows = Object.values(roles).map((role) => `<div class="wiki-row">
    <strong>${role.label}</strong>
    <span>${role.text} ${role.benefit}</span>
  </div>`).join("");
  const moduleRows = routeModuleCatalog.map((module) => `<div class="wiki-row">
    <strong>${module.label}</strong>
    <span>${module.type === "overdrive" ? "Overdrive" : "Standard"} route module. ${module.summary}</span>
  </div>`).join("");
  mainPanel.innerHTML = `
    <section class="panel wiki-page">
      <div class="blueprint-head">
        <div>
          <h2>Neon Fabs Wiki</h2>
          <p class="muted">A living rules page for the current prototype. This mirrors the Markdown wiki file in the project folder and will keep growing as systems settle.</p>
        </div>
        <span class="pill">draft</span>
      </div>
      <div class="wiki-grid">
        <article class="wiki-card">
          <h3>Core Loop</h3>
          <p>Your battery runs in real time. While it has charge, active fabs accumulate grams. Each full gram rolls the fab's selected print pattern, often producing no item and sometimes producing that pattern's item at a quality tier.</p>
          <p>The Print Bay holds sealed prints for the current city. Opening it moves prints into local inventory when there is room and recharges battery to max capacity.</p>
          <p>This prototype currently uses session state only. Refreshing the browser or pressing New Test starts from a clean profile so design changes never need old-save compatibility.</p>
        </article>
        <article class="wiki-card">
          <h3>Print Patterns</h3>
          <p>Fabs are tuned machines, not mystery boxes. A Boost Fab can be set to Battery Extension, Filament, or Scanner. Equipment fabs can be set to one equipment slot. Vehicle fabs can be set to one route class such as Runner, Freighter, Interceptor, or Guardian.</p>
          <p>Rarity represents print quality. Better quality versions keep the same role but gain stronger stats, more cargo capacity, better speed, or stronger effects.</p>
        </article>
        <article class="wiki-card">
          <h3>Cities And Home</h3>
          <p>Inventory is city-local. Buying in Chrome Pier puts the item in Chrome Pier. Shipping is how items move between connected cities. Your home city is where melds live and where home-city fab bonuses matter.</p>
          <p>Starter home choices are ${STARTER_HOME_CITIES.map((city) => districtById(city).name).join(" and ")}.</p>
        </article>
        <article class="wiki-card">
          <h3>Melds</h3>
          <p>Meld fabs produce components, not usable gear. Components must be in the home city to fuse into melds. Each completed meld currently adds +1 hour to battery capacity.</p>
          <p>Melds are not city inventory items. To move homes later, the design direction is to break melds back into components, ship those components, then rebuild them.</p>
        </article>
        <article class="wiki-card">
          <h3>Market</h3>
          <p>The market is order-driven. Sellers post listings, buyers post bids, and prices come from those orders rather than a global percentage slider. NPC orders currently seed liquidity for testing.</p>
          <p>Items can also be recycled for credits when you need storage space.</p>
        </article>
        <article class="wiki-card">
          <h3>Dispatch</h3>
          <p>Vehicles move items on routes in real time. Route distance is measured in miles, vehicle speed in mph, and route type can restrict which vehicles can travel.</p>
          <p>Route work is role-gated: Merchants ship cargo and Routejacks raid designed NPC cargo targets. Drifters, Fabricators, and other non-route roles do not dispatch route jobs.</p>
          <p>Merchant shipments check hidden NPC route encounters on arrival. An encounter must detect the convoy before battle starts. Detection weighs the NPC vehicle's Sensor, the cargo vehicle's Profile, cargo load, and relative speed.</p>
        </article>
        <article class="wiki-card">
          <h3>Route Auto-Battler</h3>
          <p>The admin simulator is the balance sandbox for designed NPC route encounters. Dispatch route battles use the same core engine, while Admin keeps instant and batch tools for tuning. The current fundamental stats are Integrity, Speed, Impact, Initiative, Escape, Profile, and Sensor.</p>
          <p>Each tick adds Speed to Initiative. At 100 Initiative, a vehicle acts. Cargo vehicles push Escape; other vehicles attack. Routejack jobs target NPC merchant cargo.</p>
          <p>Attacker tactics decide what the attacking party focuses: Hit Cargo First, Disable Escorts, or Target Fastest. Defender tactics decide the response: Protect Cargo, Counter Lead, or Prioritize Escape.</p>
          <p>Admin Build Comparison lets you save two route-party setups, then run them side by side to compare take rate, safe rate, average ticks, cargo integrity, and escape progress.</p>
        </article>
        <article class="wiki-card">
          <h3>Battle Flow</h3>
          <p>Stats come from vehicle rarity, mph, durability, cargo capacity, route compatibility, role slot, and role modifiers. Each tick adds Speed to Initiative; ready vehicles act, spend 100 Initiative, and keep overflow.</p>
          <p>The current action pipeline is intentionally small: choose target, apply Impact damage to Integrity, or if the actor is cargo, add Escape progress.</p>
          <p>Shields, Brave, Corrosion, cooldown specials, modules, and overdrives are planned layers. We add them only after the core layer is readable and tunable.</p>
        </article>
        <article class="wiki-card">
          <h3>Battle Outcomes</h3>
          <p>Attackers take cargo when cargo Integrity reaches 0. Defenders keep cargo by reaching 100 Escape, surviving the tick limit, or disabling every attacker.</p>
          <p>The live route direction still cares about cargo capacity: Routejacks can only keep stolen cargo that fits their vehicle hold. The simulator models cargo load by making loaded cargo vehicles slower and tougher.</p>
        </article>
        <article class="wiki-card">
          <h3>Live Battle Replay</h3>
          <p>Admin can resolve instantly for balance work or watch one battle unfold one turn frame at a time. Dispatch route battle records also open this same replay. The live view reveals a new turn about every two seconds, with a clear turn header, the events that happened, full party HP/status boards, reveal progress, and recent history.</p>
          <p>The route battle ledger keeps recent encounters so completed shipments and Routejack raids can link back to what happened.</p>
        </article>
        <article class="wiki-card">
          <h3>Cargo Capacity</h3>
          <p>Each vehicle has cargo slots. Each item unit uses one slot, so a two-slot vehicle can carry either two of the same item or one each of two different items.</p>
          <p>Routejack NPC raids use the same rule for theft: they can only keep stolen cargo that fits the vehicle hold. Upgrade Loot can replace lower-rarity loot, but it never increases capacity.</p>
          <p>The destination city needs enough free storage for every cargo unit plus the vehicle. If not, the shipment waits as a blocked arrival.</p>
        </article>
        <article class="wiki-card">
          <h3>Mechanic Roadmap</h3>
          <p>Layer 0 is detection plus basic initiative combat. Layer 1 adds shields. Layer 2 adds Brave for escorts. Layer 3 adds passive stat modules. Layer 4 adds triggered modules. Layer 5 adds cooldown specials. Layer 6 adds overdrives.</p>
          <p>The balance spreadsheet in the project folder is the working model for tuning these layers before they are promoted into live Dispatch.</p>
        </article>
      </div>
    </section>
    <section class="panel wiki-page" style="margin-top:14px">
      <h2>Fab Reference</h2>
      <div class="wiki-list">${fabRows}</div>
    </section>
    <section class="panel wiki-page" style="margin-top:14px">
      <h2>Profession Reference</h2>
      <div class="wiki-list">${roleRows}</div>
    </section>
    <section class="panel wiki-page" style="margin-top:14px">
      <h2>Route Module Reference</h2>
      <div class="wiki-list">${moduleRows}</div>
    </section>`;
}

function renderBattleSimResult(result) {
  if (!result) {
    return `<p class="muted">Run one trial or a batch to see cargo take rate, escape rate, unit survival, and a tick-by-tick combat log.</p>`;
  }
  const logEntries = result.sample?.log || [];
  const shownLogEntries = logEntries.length > 90
    ? [
      ...logEntries.slice(0, 10),
      { tick: "...", type: "gap", text: `${logEntries.length - 80} earlier events hidden. The final exchange is shown below.` },
      ...logEntries.slice(-79),
    ]
    : logEntries;
  const outcomeRows = Object.entries(result.outcomeCounts || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([outcome, count]) => `<div class="market-line"><span>${battleOutcomeLabel(outcome)}</span><strong>${count}/${result.runs}</strong></div>`)
    .join("");
  const survivalRows = Object.entries(result.unitSurvival || {})
    .sort((a, b) => b[1].alive / b[1].total - a[1].alive / a[1].total)
    .map(([, stats]) => `<div class="market-line">
      <span class="item-name">${icon(stats.iconName, stats.rarity)} ${stats.label}</span>
      <strong>${formatOdds((stats.alive / stats.total) * 100)} ${stats.side} ${stats.role}</strong>
    </div>`)
    .join("");
  const logRows = shownLogEntries.length
    ? shownLogEntries.map((entry) => `<div class="battle-log-row ${entry.type}">
        <span>${entry.tick}</span>
        <strong>${battleLogTypeLabel(entry.type)}</strong>
        <div class="battle-log-copy">
          <span>${entry.text}</span>
          ${entry.detail ? `<small>${entry.detail}</small>` : ""}
          ${entry.status ? renderBattleStatusSnapshot(entry.status) : ""}
        </div>
      </div>`
    ).join("")
    : `<p class="muted">No combat log recorded.</p>`;
  return `<div class="battle-results">
    <div class="fab-metrics">
      <div class="side-metric"><span>Cargo Taken</span><strong>${formatOdds(result.stealRate * 100)}</strong></div>
      <div class="side-metric"><span>Cargo Safe</span><strong>${formatOdds(result.defendRate * 100)}</strong></div>
      <div class="side-metric"><span>Escaped</span><strong>${formatOdds(result.escapeRate * 100)}</strong></div>
      <div class="side-metric"><span>Average Ticks</span><strong>${result.averageTicks.toFixed(1)}</strong></div>
      <div class="side-metric"><span>Average Cargo HP</span><strong>${result.averageCargoHp.toFixed(1)}</strong></div>
      <div class="side-metric"><span>Escape Progress</span><strong>${result.averageCargoEscape.toFixed(1)}%</strong></div>
      <div class="side-metric"><span>Runs</span><strong>${result.runs}</strong></div>
      <div class="side-metric"><span>Cargo</span><strong>${result.cargo}</strong></div>
    </div>
    <div class="grid two battle-result-grid">
      <article class="tier-card">
        <div class="card-row"><h3>Outcomes</h3><span class="muted">${result.route}</span></div>
        ${outcomeRows || `<p class="muted">No outcomes recorded.</p>`}
      </article>
      <article class="tier-card">
        <div class="card-row"><h3>Unit Survival</h3><span class="muted">${result.maxTicks} tick limit</span></div>
        ${survivalRows || `<p class="muted">No unit survival data.</p>`}
      </article>
    </div>
    <article class="tier-card">
      <div class="card-row"><h3>Sample Battle Narrative</h3><span class="muted">${battleOutcomeLabel(result.sample?.outcome)}, ${result.routeMiles}mi ${result.routeKind}, ${result.at}</span></div>
      <p class="muted">Action turns appear when one or more vehicles reach 100 initiative. Status snapshots show every vehicle after the turn so you can see the fight swing.</p>
      <div class="battle-log">${logRows}</div>
    </article>
  </div>`;
}

function battleLogTypeLabel(type) {
  return {
    attack: "Attack",
    brave: "Brave",
    disabled: "Disabled",
    escape: "Escape",
    fail: "Fail",
    gap: "More",
    outcome: "Outcome",
    special: "Module",
    start: "Start",
    status: "Status",
    success: "Success",
    turn: "Turn",
  }[type] || type;
}

function renderBattleStatusSnapshot(status) {
  return `<div class="battle-status-grid">${status.map((unit) => `<span class="battle-status-pill ${unit.side} ${unit.disabled ? "disabled" : ""}">
    <strong>${icon(unit.iconName, unit.rarity)} ${unit.label}</strong>
    <em>${unit.role} | ${unit.text}</em>
  </span>`).join("")}</div>`;
}

function renderBattleReplayEvent(entry) {
  return `<div class="battle-live-event ${entry.type}">
    <strong>${battleLogTypeLabel(entry.type)}</strong>
    <span>${entry.text}</span>
    ${entry.detail ? `<small>${entry.detail}</small>` : ""}
  </div>`;
}

function renderBattleRoster(status = []) {
  if (!status.length) return `<p class="muted">No vehicle status for this frame.</p>`;
  const sides = [
    ["attacker", "Attacker Party"],
    ["defender", "Defender Party"],
  ];
  return `<div class="battle-roster">${sides.map(([side, label]) => {
    const units = status.filter((unit) => unit.side === side);
    return `<section class="battle-roster-side ${side}">
      <div class="card-row"><h4>${label}</h4><span class="pill">${units.length}</span></div>
      ${units.map((unit) => {
    const parts = unit.text.split("|").map((part) => part.trim());
    const hpPart = parts.find((part) => part.includes("integrity")) || parts[0] || "0/0 integrity";
    const match = hpPart.match(/(-?\d+)\/(\d+)/);
    const hp = match ? Math.max(0, Number(match[1])) : 0;
    const maxHp = match ? Math.max(1, Number(match[2])) : 1;
    const statuses = parts.filter((part) => part !== hpPart);
    return `<div class="battle-roster-unit ${unit.disabled ? "disabled" : ""}">
        <div class="card-row">
          <strong class="item-name">${icon(unit.iconName, unit.rarity)} ${unit.label}</strong>
          <span class="pill">${unit.role}</span>
        </div>
        <div class="card-row"><span>${hp}/${maxHp} HP</span><em>${unit.disabled ? "disabled" : "active"}</em></div>
        <div class="capacity-bar"><span style="width:${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%"></span></div>
        <div class="battle-status-chip-row">${statuses.map((status) => `<span>${status}</span>`).join("")}</div>
      </div>`;
  }).join("") || `<p class="muted">No vehicles on this side.</p>`}
    </section>`;
  }).join("")}</div>`;
}

function renderLiveBattleReplay(replay) {
  const frames = battleReplayFrames(replay);
  if (!frames.length) {
    return `<article class="tier-card battle-live-card">
      <div class="blueprint-head">
        <div>
          <h3>Live Battle View</h3>
          <p class="muted">Run Watch Live Replay to reveal one battle entry every two seconds, closer to the player-facing route result screen.</p>
        </div>
        <span class="pill">BoxBox-style playback</span>
      </div>
    </article>`;
  }
  const current = battleReplayEntry(replay);
  const total = frames.length;
  const revealed = Math.min(total, (replay.index || 0) + 1);
  const progress = total > 1 ? (revealed / total) * 100 : 100;
  const timerProgress = replay.playing
    ? Math.min(100, ((Date.now() - (replay.lastStepAt || Date.now())) / Math.max(1, replay.delayMs || 2000)) * 100)
    : 100;
  const visibleFrames = frames.slice(Math.max(0, revealed - 6), revealed);
  const historyRows = visibleFrames.map((frame, index) => `<div class="battle-live-history-row ${frame === current ? "current" : ""}">
    <span>${frame.turn ? `Turn ${frame.turn}` : "Setup"}</span>
    <strong>${frame.title}</strong>
    <em>${frame.events.map((entry) => entry.text).join(" ").slice(0, 110)}</em>
  </div>`).join("");
  return `<article class="tier-card battle-live-card">
    <div class="blueprint-head">
      <div>
        <h3>Live Battle View</h3>
        <p class="muted">${replay.route} - ${replay.routeMiles}mi ${replay.routeKind}. ${replay.matchup}</p>
      </div>
      <span class="pill">${replay.playing ? "playing" : revealed >= total ? battleOutcomeLabel(replay.outcome) : "paused"}</span>
    </div>
    <div class="battle-live-stage">
      <div class="battle-live-turn-head ${current.type}">
        <span>${current.turn ? `Turn ${current.turn}` : "Setup"}</span>
        <h4>${current.title}</h4>
        <em>Tick ${current.tick}</em>
      </div>
      <div class="battle-live-events">${current.events.map(renderBattleReplayEvent).join("")}</div>
      ${renderBattleRoster(current.status)}
    </div>
    <div class="battle-live-progress">
      <div class="card-row"><span>Revealed ${revealed}/${total}</span><strong>${replay.cargo}</strong></div>
      <div class="capacity-bar"><span style="width:${progress}%"></span></div>
      <div class="capacity-bar live-timer"><span style="width:${timerProgress}%"></span></div>
    </div>
    <div class="button-row">
      <button type="button" data-admin="${replay.playing ? "battle-replay-pause" : "battle-replay-play"}">${replay.playing ? "Pause" : "Play"}</button>
      <button type="button" data-admin="battle-replay-step" ${revealed >= total ? "disabled" : ""}>Next Turn</button>
      <button type="button" data-admin="battle-replay-latest" ${revealed >= total ? "disabled" : ""}>Latest</button>
      <button type="button" data-admin="battle-replay-restart">Restart</button>
      ${replay.source === "route-battle" ? `<button type="button" data-action="close-route-battle">Close</button>` : ""}
    </div>
    <div class="battle-live-history">
      <div class="card-row"><h4>Revealed Turns</h4><span class="muted">last ${visibleFrames.length}</span></div>
      ${historyRows}
    </div>
  </article>`;
}

function renderBattleBuildCard(slot, build) {
  const summary = battleBuildSummary(build);
  return `<article class="battle-build-card">
    <div class="card-row"><h4>${build.name}</h4><span class="pill">${build.savedAt ? `saved ${build.savedAt}` : "default"}</span></div>
    <div class="wiki-list">
      <div class="market-line"><span>Route</span><strong>${summary.route}</strong></div>
      <div class="market-line"><span>Cargo</span><strong>${summary.cargo}</strong></div>
      <div class="market-line"><span>Attacker Party</span><strong>${summary.attackers}</strong></div>
      <div class="market-line"><span>Defender Party</span><strong>${summary.defenders}</strong></div>
      <div class="market-line"><span>Tactics</span><strong>${summary.tactics}</strong></div>
    </div>
    <p class="muted">Core layer only: no modules or overdrives in this comparison pass.</p>
    <button type="button" data-admin="battle-save-${slot}">Save Current As ${build.name}</button>
  </article>`;
}

function renderBattleComparisonResult(result) {
  if (!result) {
    return `<p class="muted">Save two builds, then compare them to see cargo take rate, safe rate, average ticks, and cargo health side by side.</p>`;
  }
  const cards = result.builds.map((build) => {
    const res = build.result;
    return `<article class="battle-compare-card ${build.slot === "a" ? "attacker" : "defender"}">
      <div class="card-row"><h4>${build.name}</h4><span class="pill">${res.route}</span></div>
      <div class="fab-metrics">
        <div class="side-metric"><span>Cargo Taken</span><strong>${formatOdds(res.stealRate * 100)}</strong></div>
        <div class="side-metric"><span>Cargo Safe</span><strong>${formatOdds(res.defendRate * 100)}</strong></div>
        <div class="side-metric"><span>Escaped</span><strong>${formatOdds(res.escapeRate * 100)}</strong></div>
        <div class="side-metric"><span>Average Ticks</span><strong>${res.averageTicks.toFixed(1)}</strong></div>
        <div class="side-metric"><span>Cargo HP</span><strong>${res.averageCargoHp.toFixed(1)}</strong></div>
        <div class="side-metric"><span>Escape</span><strong>${res.averageCargoEscape.toFixed(1)}%</strong></div>
      </div>
    </article>`;
  }).join("");
  const [a, b] = result.builds;
  const stealDelta = (a.result.stealRate - b.result.stealRate) * 100;
  const safeDelta = (a.result.defendRate - b.result.defendRate) * 100;
  const hpDelta = a.result.averageCargoHp - b.result.averageCargoHp;
  return `<div class="battle-comparison-result">
    <div class="card-row"><h3>Build Comparison</h3><span class="muted">${result.runs} runs each, ${result.at}</span></div>
    <div class="battle-compare-grid">${cards}</div>
    <div class="battle-compare-summary">
      <span>Take rate delta <strong>${stealDelta >= 0 ? "+" : ""}${stealDelta.toFixed(1)} pts for ${a.name}</strong></span>
      <span>Safe rate delta <strong>${safeDelta >= 0 ? "+" : ""}${safeDelta.toFixed(1)} pts for ${a.name}</strong></span>
      <span>Average cargo HP delta <strong>${hpDelta >= 0 ? "+" : ""}${hpDelta.toFixed(1)} for ${a.name}</strong></span>
    </div>
  </div>`;
}

function renderBattleSimulator() {
  const battle = normalizeBattleSettings(state.battleSim || defaultBattleSim());
  const battleBuilds = normalizeBattleBuilds(state.battleBuilds);
  const routeInfo = selectedBattleRoute();
  const cargoCapacity = battleCargoCapacity(battle);
  const cargoLoad = battleCargoUnits(battle);
  const routeChoices = allRoutePairs()
    .map((pair) => {
      const route = routeTo(pair.from, pair.to);
      const value = `${pair.from}>${pair.to}`;
      return `<option value="${value}" ${routeInfo.from === pair.from && routeInfo.to === pair.to ? "selected" : ""}>${pair.label} - ${routeDistance(route)}mi ${routeKind(route)}</option>`;
    })
    .join("");
  const vehicleOptions = (selected) => allVehicleItems()
    .map((vehicle) => `<option value="${vehicle.name}" ${selected === vehicle.name ? "selected" : ""}>${vehicle.name} - ${vehicleMph(vehicle)} mph, ${vehicleModeLabel(vehicle)}, cap ${vehicle.capacity}</option>`)
    .join("");
  const optionalVehicleOptions = (selected) => `<option value="none" ${selected === "none" ? "selected" : ""}>None</option>${vehicleOptions(selected)}`;
  const cargoChoices = pvpTargetItems()
    .map((item) => `<option value="${item.name}" ${battle.cargo === item.name ? "selected" : ""}>${item.name} - ${rarityMeta[item.rarity].label}</option>`)
    .join("");
  const cargoItemLabel = battle.defenderRole === "routejack" ? "Carried Cargo" : "Cargo Item";
  const cargoVehicleLabel = battle.defenderRole === "routejack" ? "Loot Vehicle" : "Cargo Vehicle";
  const attackerRoleChoices = (selected) => ["routejack"]
    .map((id) => `<option value="${id}" ${selected === id ? "selected" : ""}>${roles[id].label}</option>`)
    .join("");
  const defenderRoleChoices = (selected, attackerRole) => ["merchant"]
    .map((id) => `<option value="${id}" ${selected === id ? "selected" : ""}>${roles[id].label}</option>`)
    .join("");
  const tacticOptions = (options, selected) => Object.entries(options)
    .map(([id, label]) => `<option value="${id}" ${selected === id ? "selected" : ""}>${label}</option>`)
    .join("");
  const { attackers, defenders } = makeBattleTeams(battle, routeInfo.route);
  const renderUnitCard = (unit) => {
    const compatible = vehicleCanUseRoute(unit.vehicle, routeInfo.route);
    return `<div class="battle-unit-card ${unit.side}">
      <div class="card-row"><strong class="item-name">${icon(unit.iconName, unit.rarity)} ${unit.name}</strong><span class="pill">${unit.role}</span></div>
      <div class="battle-stat-row"><span>Integrity ${unit.hp}</span><span>Speed ${unit.speed}</span><span>Impact ${unit.impact}</span><span>Profile ${profileBand(vehicleProfileScore(unit.vehicle))}</span><span>Sensor ${vehicleSensorScore(unit.vehicle)}</span></div>
      <p class="muted">${compatible ? "Route compatible" : "Route mismatch penalty active"}${unit.role === "cargo" ? ". Cargo turns build escape progress instead of attacking." : ""}</p>
    </div>`;
  };
  const attackerUnitRows = attackers.map(renderUnitCard).join("");
  const defenderUnitRows = defenders.map(renderUnitCard).join("");
  const buildCards = ["a", "b"].map((slot) => renderBattleBuildCard(slot, battleBuilds[slot])).join("");
  return `<article class="admin-card admin-wide battle-sim-card">
    <div class="blueprint-head">
      <div>
        <h3>Route Auto-Battle Simulator</h3>
        <p class="muted">No-consequences route combat using the fundamental layer: detect, engage, gain initiative, attack integrity, or escape with cargo.</p>
      </div>
      <span class="pill">core rules</span>
    </div>
    <div class="battle-sim-layout">
      <div class="battle-control-stack">
        <div class="battle-party-grid">
          <section class="battle-party-card battle-matchup-card">
            <div class="card-row"><h4>Route Matchup</h4><span class="pill">${roles[battle.attackerRole].label} vs ${roles[battle.defenderRole].label}</span></div>
            <label><span>Route</span><select id="battleRoute" data-battle-setting="route">${routeChoices}</select></label>
            <label><span>${cargoItemLabel}</span><select id="battleCargo" data-battle-setting="cargo">${cargoChoices}</select></label>
            <label><span>Cargo Slots Loaded</span><input id="battleCargoUnits" type="number" value="${cargoLoad}" min="1" max="${cargoCapacity}" step="1" data-battle-setting="cargo-units"></label>
            <label><span>Tick Limit</span><input id="battleMaxTicks" type="number" value="${battle.maxTicks}" min="30" max="500" step="10" data-battle-setting="tick-limit"></label>
            <label><span>Batch Runs</span><input id="battleRuns" type="number" value="${battle.runs}" min="1" max="5000" step="1" data-battle-setting="runs"></label>
            <p class="muted">${battleRoleMatchupText(battle)} This sandbox now tunes PvE Routejack raid outcomes.</p>
          </section>
          <section class="battle-party-card attacker">
            <div class="card-row"><h4>Attacker Party</h4><span class="pill">${roles[battle.attackerRole].label}</span></div>
            <label><span>Attacker Role</span><select id="battleAttackerRole" data-battle-setting="attacker-role">${attackerRoleChoices(battle.attackerRole)}</select></label>
            <label><span>Lead Vehicle</span><select id="battleAttackerVehicle" data-battle-setting="attacker">${vehicleOptions(battle.attackerVehicle)}</select></label>
            <label><span>Support 1</span><select id="battleAttackerSupport1" data-battle-setting="attacker-support-1">${optionalVehicleOptions(battle.attackerSupport1)}</select></label>
            <label><span>Support 2</span><select id="battleAttackerSupport2" data-battle-setting="attacker-support-2">${optionalVehicleOptions(battle.attackerSupport2)}</select></label>
            <label><span>Tactic</span><select id="battleAttackerTactic" data-battle-setting="attacker-tactic">${tacticOptions(battleAttackerTactics, battle.attackerTactic)}</select></label>
            <label><span>Attack Modifier</span><input id="battleAttackBonus" type="number" value="${battle.attackBonus}" min="-100" max="100" step="1" data-battle-setting="attack-modifier"></label>
          </section>
          <section class="battle-party-card defender">
            <div class="card-row"><h4>Defender Party</h4><span class="pill">${roles[battle.defenderRole].label}</span></div>
            <label><span>Defender Role</span><select id="battleDefenderRole" data-battle-setting="defender-role">${defenderRoleChoices(battle.defenderRole, battle.attackerRole)}</select></label>
            <label><span>${cargoVehicleLabel}</span><select id="battleDefenderVehicle" data-battle-setting="defender">${vehicleOptions(battle.defenderVehicle)}</select></label>
            <label><span>Escort 1</span><select id="battleDefenderEscort1" data-battle-setting="defender-escort-1">${optionalVehicleOptions(battle.defenderEscort1)}</select></label>
            <label><span>Escort 2</span><select id="battleDefenderEscort2" data-battle-setting="defender-escort-2">${optionalVehicleOptions(battle.defenderEscort2)}</select></label>
            <label><span>Tactic</span><select id="battleDefenderTactic" data-battle-setting="defender-tactic">${tacticOptions(battleDefenderTactics, battle.defenderTactic)}</select></label>
            <label><span>Defense Modifier</span><input id="battleDefenseBonus" type="number" value="${battle.defenseBonus}" min="-100" max="100" step="1" data-battle-setting="defense-modifier"></label>
          </section>
        </div>
        <div class="battle-module-panel">
          <div class="card-row"><h4>Advanced Mechanics</h4><span class="muted">planned later</span></div>
          <p class="muted">Modules, shields, Brave, corrosion, cooldown specials, and overdrives are intentionally disabled in this core balance layer. Add them back one at a time after detection, cargo, speed, integrity, and impact feel understandable.</p>
        </div>
      </div>
      <div class="battle-preview">
        <div class="fab-metrics">
          <div class="side-metric"><span>Attackers</span><strong>${attackers.length}</strong></div>
          <div class="side-metric"><span>Defenders</span><strong>${defenders.length}</strong></div>
          <div class="side-metric"><span>Cargo Load</span><strong>${cargoLoad}/${cargoCapacity} slots</strong></div>
          <div class="side-metric"><span>Route Type</span><strong>${routeKind(routeInfo.route)}</strong></div>
          <div class="side-metric"><span>Route Miles</span><strong>${routeDistance(routeInfo.route)}</strong></div>
        </div>
        <div class="battle-preview-parties">
          <section class="battle-preview-party attacker">
            <div class="card-row"><h4>Attacker Preview</h4><span class="pill">${roles[battle.attackerRole].label}</span></div>
            <div class="battle-unit-grid">${attackerUnitRows || `<p class="muted">No attacker vehicles selected.</p>`}</div>
          </section>
          <section class="battle-preview-party defender">
            <div class="card-row"><h4>Defender Preview</h4><span class="pill">${roles[battle.defenderRole].label}</span></div>
            <div class="battle-unit-grid">${defenderUnitRows || `<p class="muted">No defender vehicles selected.</p>`}</div>
          </section>
        </div>
        <p class="muted">Cargo wins by reaching 100 escape progress, surviving the tick limit, or seeing all attackers disabled. Attackers win by reducing the cargo vehicle to 0 integrity.</p>
        <div class="button-row">
          <button type="button" data-admin="battle-single">Run One Trial</button>
          <button type="button" data-admin="battle-live">Watch Live Replay</button>
          <button type="button" data-admin="battle-batch">Run Batch</button>
        </div>
      </div>
    </div>
    <div class="battle-build-panel">
      <div class="blueprint-head">
        <div>
          <h3>Build Comparison Lab</h3>
          <p class="muted">Save the current route party as Build A or Build B, then run both through the same number of simulations for balance work.</p>
        </div>
        <button type="button" data-admin="battle-compare">Compare Builds</button>
      </div>
      <div class="battle-build-grid">${buildCards}</div>
      ${renderBattleComparisonResult(state.battleComparisonResult)}
    </div>
    ${renderLiveBattleReplay(state.battleReplay)}
    ${renderBattleSimResult(state.battleSimResult)}
  </article>`;
}

function renderAdmin() {
  const itemOptions = allItems().map((item) => `<option value="${item.name}">${item.name}</option>`).join("");
  const meldOptions = melds.map((meld) => `<option value="${meld.name}">${meld.name}</option>`).join("");
  const dropRateInputs = rarityOrder
    .map((rarity) => `<label class="rate-row">
      <span>${rarityMeta[rarity].label}</span>
      <input id="drop-${rarity}" type="number" value="${state.dropRates[rarity]}" min="0" step="1">
      <em>${tierOdds(rarity)}</em>
    </label>`)
    .join("");
  const noItemInput = `<label class="rate-row">
      <span>No Item</span>
      <input id="drop-none" type="number" value="${state.noItemWeight}" min="0" step="1">
      <em>${noItemOdds()}</em>
    </label>`;
  const adminDropTable = Object.keys(rarityMeta)
    .map((rarity) => `<article class="tier-card rarity-border-${rarity}">
      <div class="card-row"><h3>${rarityMeta[rarity].label}</h3><span class="muted">${tierOdds(rarity)}</span></div>
      ${starterItems
        .filter((item) => item.rarity === rarity)
        .map((item) => `<div class="market-line"><span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span><span>${formatCredits(item.value)}</span></div>`)
        .join("")}
    </article>`)
    .join("");
  mainPanel.innerHTML = `
    <div class="admin-grid">
      <article class="admin-card">
        <h3>Wallet</h3>
        <input id="adminCredits" type="number" value="5000" min="0" step="100">
        <div class="button-row">
          <button type="button" data-admin="add-credits">Add Credits</button>
          <button type="button" data-admin="set-credits">Set Credits</button>
        </div>
        <input id="adminChips" type="number" value="25" min="0" step="1">
        <div class="button-row">
          <button type="button" data-admin="add-chips">Add Chips</button>
          <button type="button" data-admin="set-chips">Set Chips</button>
        </div>
      </article>
      <article class="admin-card">
        <h3>${currentDistrict().name} Relics</h3>
        <select id="adminItem">${itemOptions}</select>
        <input id="adminItemQty" type="number" value="10" min="1" step="1">
        <div class="button-row">
          <button type="button" data-admin="add-item">Add Relic</button>
          <button type="button" data-admin="queue-item">Add Print Bay Output</button>
        </div>
      </article>
      <article class="admin-card">
        <h3>Melds</h3>
        <select id="adminMeld">${meldOptions}</select>
        <div class="button-row">
          <button type="button" data-admin="grant-meld">Grant</button>
          <button type="button" data-admin="grant-all-melds">Grant All</button>
          <button type="button" data-admin="clear-melds">Clear</button>
        </div>
      </article>
      <article class="admin-card">
        <h3>Drop Rates</h3>
        <div class="rate-list">${noItemInput}${dropRateInputs}</div>
        <div class="button-row">
          <button type="button" data-admin="set-drop-rates">Set Rates</button>
          <button type="button" data-admin="reset-drop-rates">Reset Rates</button>
        </div>
      </article>
      <article class="admin-card admin-wide">
        <div class="blueprint-head"><h3>Starter Drop Table</h3><span class="pill">1g per roll</span></div>
        <div class="tier-card" style="margin-bottom:12px">
          <div class="card-row"><h3>No Item</h3><span class="muted">${noItemOdds()}</span></div>
          <p class="muted">Most full-gram rolls produce no relic. This keeps the fab active without flooding inventory.</p>
        </div>
        <div class="tier-grid">${adminDropTable}</div>
      </article>
      <article class="admin-card">
        <h3>Starter Mine</h3>
        <input id="adminFabRate" type="number" value="${state.fabs[0].rate}" min="1" step="1">
        <input id="adminFabGrams" type="number" value="${(state.fabs[0].grams || 0).toFixed(2)}" min="0" step="0.01">
        <div class="button-row">
          <button type="button" data-admin="boost-fabs">Set Rate</button>
          <button type="button" data-admin="set-grams">Set Grams</button>
          <button type="button" data-admin="grant-vehicle-fab" ${state.fabs.length >= MAX_ACTIVE_FABS || state.fabs.some((fab) => fab.type === "vehicle") ? "disabled" : ""}>Grant Vehicle Fab</button>
          <button type="button" data-admin="grant-equipment-fab" ${state.fabs.length >= MAX_ACTIVE_FABS || state.fabs.some((fab) => fab.type === "equipment") ? "disabled" : ""}>Grant Equipment Fab</button>
        </div>
      </article>
      <article class="admin-card">
        <h3>Time</h3>
        <input id="adminAdvanceHours" type="number" value="1" min="0" step="0.25">
        <input id="adminPowerSeconds" type="number" value="${Math.round(state.power)}" min="0" step="60">
        <div class="button-row">
          <button type="button" data-admin="advance-time">Advance Time</button>
          <button type="button" data-admin="set-power">Set Battery</button>
          <button type="button" data-admin="fill-power">Fill Power</button>
          <button type="button" data-admin="clear-output">Clear Output</button>
        </div>
      </article>
      ${renderAdminRouteTrafficPanel()}
      ${renderAdminEncounterDesigner()}
      ${renderBattleSimulator()}
      <article class="admin-card">
        <h3>Prototype State</h3>
        <div class="button-row">
          <button type="button" data-admin="seed-market">Seed Market</button>
          <button type="button" data-admin="clear-player-orders">Clear Player Orders</button>
          <button type="button" data-admin="export-save">Export Snapshot</button>
          <button type="button" data-admin="copy-summary">Copy Summary</button>
        </div>
        <p class="muted" id="adminMessage">Admin tools affect the current prototype session only. Refreshing starts from a clean profile.</p>
      </article>
    </div>`;
}

function renderPlaceholder(title) {
  mainPanel.innerHTML = `<section class="panel"><h2>${title}</h2><p class="muted">This section is stubbed in for later systems.</p></section>`;
}

function renderMainPanel() {
  if (state.activeView === "admin") renderAdmin();
  else if (state.activeView === "contracts") renderContracts();
  else if (state.activeView === "home" || state.activeView === "profile") renderProfile();
  else if (state.activeView === "findings" || state.activeView === "fabs") renderFindings();
  else if (state.activeView === "fab-detail") renderFabDetail();
  else if (state.activeView === "fab-shop") renderFabShop();
  else if (state.activeView === "things" || state.activeView === "inventory") renderParts();
  else if (state.activeView === "melds") renderMelds();
  else if (state.activeView === "shipments") renderShipments();
  else if (state.activeView === "mines" || state.activeView === "gadgets") renderFabs();
  else if (state.activeView === "item") renderItemDetail();
  else if (state.activeView === "shop") renderMarket();
  else if (state.activeView === "profession") renderRoles();
  else if (state.activeView === "cities") renderDistricts();
  else if (state.activeView === "wiki") renderWiki();
  else renderPlaceholder(viewTitle());
}

function renderPanels() {
  renderMainPanel();
  renderRightPanel();
  renderConfirmLayer();
  renderActionSheetLayer();
  syncActiveButtons();
}

function refreshLiveViewChrome() {
  renderRightPanel();
  renderConfirmLayer();
  renderActionSheetLayer();
  syncActiveButtons();
  refreshInlineLiveMetrics();
}

function refreshInlineLiveMetrics() {
  const now = Date.now();
  document.querySelectorAll("[data-live-shipment-progress]").forEach((bar) => {
    const shipment = state.shipments.find((candidate) => candidate.id === bar.dataset.liveShipmentProgress);
    if (!shipment) return;
    const total = Math.max(1, shipment.arrivesAt - shipment.startedAt);
    const progress = shipment.status === "blocked" ? 100 : Math.min(100, Math.max(0, ((now - shipment.startedAt) / total) * 100));
    bar.style.width = `${progress}%`;
  });
}

function actionSheetButton(action, label, options = {}) {
  const attrs = [
    `data-sheet-action="${action}"`,
    options.danger ? `class="danger"` : "",
    options.disabled ? "disabled" : "",
  ].filter(Boolean).join(" ");
  const subtext = options.subtext ? `<span>${options.subtext}</span>` : "";
  return `<button type="button" ${attrs}><strong>${label}</strong>${subtext}</button>`;
}

function renderMeldActionSheet(sheet) {
  const itemName = sheet.payload.itemName;
  const item = itemByName(itemName);
  if (!item) return null;
  const homeAsk = lowestListing(state.homeCity, itemName);
  const bestAsk = bestAskEverywhere(itemName);
  const ownedPositions = itemCityPositions(itemName);
  const moveSource = ownedPositions.find(({ district }) => district.id !== state.homeCity && routePath(district.id, state.homeCity).length > 1);
  const movePath = moveSource ? routePath(moveSource.district.id, state.homeCity) : [];
  return {
    title: itemName,
    eyebrow: "Ingredient actions",
    body: `Home city: ${homeDistrict().name}. Owned: ${ownedPositions.map(({ district, count }) => `${district.name} x${count}`).join(", ") || "none"}.`,
    actions: [
      actionSheetButton("open-book", "Open Order Book", { subtext: "Listings, bids, holdings, and price history" }),
      actionSheetButton("buy-home", "Buy In Home City", {
        subtext: homeAsk ? `${formatCredits(homeAsk.price)} in ${homeDistrict().name}` : "No home-city listing",
        disabled: !homeAsk || state.credits < homeAsk.price || inventoryAvailable(state.homeCity) <= 0,
      }),
      actionSheetButton("buy-best", "Buy Cheapest Visible", {
        subtext: bestAsk ? `${formatCredits(bestAsk.listing.price)} in ${bestAsk.district.name}` : "No visible listing",
        disabled: !bestAsk || state.credits < bestAsk.listing.price || inventoryAvailable(bestAsk.district.id) <= 0,
      }),
      actionSheetButton("move-home", "Prepare Move Home", {
        subtext: moveSource ? `${moveSource.district.name} to ${homeDistrict().name}${movePath.length > 2 ? ` via ${districtById(movePath[1]).name}` : ""}` : "No remote stock with a known path",
        disabled: !moveSource,
      }),
    ],
    item,
  };
}

function renderCollectionActionSheet(sheet) {
  const itemName = sheet.payload.itemName;
  const cityId = sheet.payload.cityId || state.district;
  const item = itemByName(itemName);
  if (!item) return null;
  const localBid = highestBid(cityId, itemName);
  const available = inventoryFor(cityId)[itemName] || 0;
  return {
    title: itemName,
    eyebrow: "Collected output",
    body: `${available} kept in ${districtById(cityId).name}.`,
    actions: [
      actionSheetButton("open-book", "Open Details", { subtext: "Order book, stats, and item rules" }),
      actionSheetButton("sell-one", "Sell 1 To Best Bid", {
        subtext: localBid ? `${formatCredits(localBid.price)} in ${districtById(cityId).name}` : "No local bid",
        disabled: !localBid || available <= 0,
      }),
      actionSheetButton("recycle-one", "Recycle 1", {
        subtext: "Clear one slot for 1cr",
        disabled: available <= 0,
      }),
    ],
    item,
  };
}

function renderInventoryActionSheet(sheet) {
  const itemName = sheet.payload.itemName;
  const cityId = sheet.payload.cityId || state.district;
  const item = itemByName(itemName);
  if (!item) return null;
  const localBid = highestBid(cityId, itemName);
  const available = inventoryFor(cityId)[itemName] || 0;
  const protectedItem = shouldProtectInventoryItem(itemName);
  const canShip = state.role === "merchant" && item.category !== "vehicle" && available > 0;
  return {
    title: itemName,
    eyebrow: `${districtById(cityId).name} inventory`,
    body: `${available} owned here. ${protectedItem ? "Protected as a meld ingredient." : "Choose one action for this item."}`,
    actions: [
      actionSheetButton("sell-one", "Sell 1 To Best Bid", {
        subtext: protectedItem ? "Protected in Inventory settings" : localBid ? `${formatCredits(localBid.price)} in ${districtById(cityId).name}` : "No local bid",
        disabled: protectedItem || !localBid || available <= 0,
      }),
      actionSheetButton("recycle-one", "Recycle 1", {
        subtext: protectedItem ? "Protected in Inventory settings" : "Clear one slot for 1cr",
        disabled: protectedItem || available <= 0,
      }),
      actionSheetButton("ship-item", "Send With Vehicle", {
        subtext: state.role !== "merchant"
          ? "Merchant role required"
          : item.category === "vehicle"
            ? "Vehicles cannot be loaded as cargo"
            : "Open Dispatch with this cargo selected",
        disabled: !canShip,
      }),
      actionSheetButton("open-book", "Open Details", { subtext: "Order book, stats, and item rules" }),
    ],
    item,
  };
}

function renderActionSheetLayer() {
  let layer = document.querySelector("#actionSheetLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "actionSheetLayer";
    document.body.appendChild(layer);
  }
  const sheet = state.actionSheet;
  const model = sheet?.type === "meld-ingredient"
    ? renderMeldActionSheet(sheet)
    : sheet?.type === "collection-item"
      ? renderCollectionActionSheet(sheet)
      : sheet?.type === "inventory-item"
        ? renderInventoryActionSheet(sheet)
        : null;
  layer.hidden = !model;
  layer.innerHTML = model
    ? `<div class="action-sheet-backdrop" role="presentation">
        <section class="action-sheet-card" role="dialog" aria-modal="true" aria-labelledby="actionSheetTitle">
          <div class="card-row">
            <div>
              <p class="eyebrow">${model.eyebrow}</p>
              <h2 id="actionSheetTitle" class="item-name">${icon(model.item.iconName, model.item.rarity)} ${model.title}</h2>
            </div>
            ${rarityPill(model.item.rarity)}
          </div>
          <p class="muted">${model.body}</p>
          <div class="action-sheet-options">${model.actions.join("")}</div>
          <button type="button" data-sheet-action="close">Close</button>
        </section>
      </div>`
    : "";
}

function renderConfirmLayer() {
  let layer = document.querySelector("#confirmLayer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "confirmLayer";
    document.body.appendChild(layer);
  }
  const pending = state.pendingConfirm;
  layer.hidden = !pending;
  layer.innerHTML = pending
    ? `<div class="confirm-backdrop" role="presentation">
        <section class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <p class="eyebrow">Confirm action</p>
          <h2 id="confirmTitle">${pending.title}</h2>
          <p class="muted">${pending.body}</p>
          <div class="button-row">
            <button type="button" data-action="confirm-cancel">Cancel</button>
            <button type="button" class="${pending.danger ? "danger" : ""}" data-action="confirm-accept">${pending.confirmLabel}</button>
          </div>
        </section>
      </div>`
    : "";
}

function render() {
  renderHeader();
  renderPanels();
  touchSessionState();
}

function executePendingConfirm() {
  const pending = state.pendingConfirm;
  if (!pending) return;
  state.pendingConfirm = null;
  if (pending.action === "inventory-bulk-sell") bulkSellFilteredInventory();
  else if (pending.action === "inventory-bulk-recycle") bulkRecycleFilteredInventory();
  else if (pending.action === "inventory-bulk-list") bulkListFilteredInventory();
  else if (pending.action === "retire-fab") retireFab(pending.payload.id);
  else if (pending.action === "reset-session") {
    clearPrototypeSaves();
    state = seedState(defaultState());
    render();
  } else {
    render();
  }
}

function executeActionSheet(action) {
  const sheet = state.actionSheet;
  if (!sheet || action === "close") {
    closeActionSheet();
    return;
  }
  state.actionSheet = null;
  const itemName = sheet.payload.itemName;
  const cityId = sheet.payload.cityId || state.district;
  if (action === "open-book") {
    runAction("select-item", { itemName });
    return;
  }
  if (sheet.type === "meld-ingredient") {
    if (action === "buy-home") {
      const listing = lowestListing(state.homeCity, itemName);
      if (listing) runAction("buy-listing", { listingId: listing.id, qty: 1 });
      else render();
      return;
    }
    if (action === "buy-best") {
      const best = bestAskEverywhere(itemName);
      if (best) runAction("buy-listing", { listingId: best.listing.id, qty: 1 });
      else render();
      return;
    }
    if (action === "move-home") {
      const source = itemCityPositions(itemName).find(({ district }) => district.id !== state.homeCity && routePath(district.id, state.homeCity).length > 1);
      if (source) runAction("move-ingredient", { itemName, sourceCityId: source.district.id });
      else render();
      return;
    }
  }
  if (sheet.type === "collection-item" || sheet.type === "inventory-item") {
    if (action === "sell-one") {
      runAction("quick-sell", { itemName, cityId, qty: 1 });
      return;
    }
    if (action === "recycle-one") {
      runAction("quick-recycle", { itemName, cityId, qty: 1 });
      return;
    }
    if (action === "ship-item") {
      state.shipmentCargo = itemName;
      runAction("set-view", { view: "shipments" });
      return;
    }
  }
  render();
}

function syncActiveButtons() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    const aliases = { item: "inventory", things: "inventory", findings: "fabs", mines: "fabs", "fab-detail": "fabs", home: "profile" };
    const view = aliases[state.activeView] || state.activeView;
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function handleAdmin(action) {
  const credits = Number(document.querySelector("#adminCredits")?.value || 0);
  const chips = Number(document.querySelector("#adminChips")?.value || 0);
  const itemName = document.querySelector("#adminItem")?.value || allItems()[0].name;
  const itemQty = Number(document.querySelector("#adminItemQty")?.value || 1);
  const meldName = document.querySelector("#adminMeld")?.value || melds[0].name;
  const fabRate = Number(document.querySelector("#adminFabRate")?.value || 36);
  const fabGrams = Number(document.querySelector("#adminFabGrams")?.value || 0);
  const advanceHours = Number(document.querySelector("#adminAdvanceHours")?.value || 0);
  const powerSeconds = Number(document.querySelector("#adminPowerSeconds")?.value || 0);
  const nextNoItemWeight = Math.max(0, Number(document.querySelector("#drop-none")?.value || 0));
  const nextDropRates = Object.fromEntries(
    rarityOrder.map((rarity) => [rarity, Math.max(0, Number(document.querySelector(`#drop-${rarity}`)?.value || 0))]),
  );

  if (action === "battle-single") runBattleSimulation(1);
  if (action === "battle-live") startLiveBattleReplay();
  if (action === "battle-replay-pause" && state.battleReplay) state.battleReplay.playing = false;
  if (action === "battle-replay-play" && state.battleReplay) {
    const frames = battleReplayFrames(state.battleReplay);
    if (frames.length && state.battleReplay.index >= frames.length - 1) state.battleReplay.index = 0;
    state.battleReplay.playing = true;
    state.battleReplay.lastStepAt = Date.now();
  }
  if (action === "battle-replay-step" && state.battleReplay) {
    state.battleReplay.playing = false;
    stepBattleReplay(1);
  }
  if (action === "battle-replay-latest" && battleReplayFrames(state.battleReplay).length) {
    state.battleReplay.index = battleReplayFrames(state.battleReplay).length - 1;
    state.battleReplay.playing = false;
  }
  if (action === "battle-replay-restart" && state.battleReplay) {
    state.battleReplay.index = 0;
    state.battleReplay.playing = true;
    state.battleReplay.lastStepAt = Date.now();
  }
  if (action === "battle-batch") runBattleSimulation(Number(document.querySelector("#battleRuns")?.value || state.battleSim?.runs || 250));
  if (action === "battle-save-a") saveBattleBuild("a");
  if (action === "battle-save-b") saveBattleBuild("b");
  if (action === "battle-compare") runBattleBuildComparison();
  if (action === "add-credits") state.credits += credits;
  if (action === "set-credits") state.credits = credits;
  if (action === "add-chips") state.chips += chips;
  if (action === "set-chips") state.chips = chips;
  if (action === "add-item") addItem(itemName, itemQty, state.district, true);
  if (action === "queue-item") {
    const cityFab = fabsForCity(state.district)[0];
    state.output.unshift(...Array.from({ length: itemQty }, () => ({ name: itemName, cityId: state.district, fabType: cityFab?.type || "admin", fabId: cityFab?.id || null })));
  }
  if (action === "grant-meld") createMeld(meldName, true);
  if (action === "grant-all-melds") melds.forEach((meld) => {
    if (!state.completed.includes(meld.name)) state.completed.push(meld.name);
  });
  if (action === "clear-melds") state.completed = [];
  if (action === "set-drop-rates") {
    state.dropRates = nextDropRates;
    state.noItemWeight = nextNoItemWeight;
  }
  if (action === "reset-drop-rates") {
    state.dropRates = defaultDropRates();
    state.noItemWeight = defaultNoItemWeight();
  }
  if (action === "boost-fabs") state.fabs.forEach((fab) => { fab.rate = fabRate; });
  if (action === "set-grams") state.fabs.forEach((fab) => { fab.grams = Math.max(0, fabGrams); });
  if (action === "grant-vehicle-fab" && state.fabs.length < MAX_ACTIVE_FABS && !state.fabs.some((fab) => fab.type === "vehicle")) {
    state.fabs.push(createFabRecord("vehicle", state.district, false));
  }
  if (action === "grant-equipment-fab" && state.fabs.length < MAX_ACTIVE_FABS && !state.fabs.some((fab) => fab.type === "equipment")) {
    state.fabs.push(createFabRecord("equipment", state.district, false));
  }
  if (action === "advance-time") advanceGameTime(advanceHours);
  if (action === "set-power") state.power = Math.min(batteryCapacity(), Math.max(0, powerSeconds));
  if (action === "fill-power") state.power = batteryCapacity();
  if (action === "clear-output") {
    state.output = [];
    state.lastCollected = [];
  }
  if (action === "save-encounters") {
    try {
      const raw = document.querySelector("#adminEncounterJson")?.value || "[]";
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : parsed.encounters;
      state.routeEncounterCatalog = normalizeRouteEncounterCatalog(source);
      addFeed("Admin", `${state.routeEncounterCatalog.length} encounters saved`, "data");
    } catch (error) {
      addFeed("Admin", "encounter JSON invalid", "data");
    }
  }
  if (action === "reset-encounters") {
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog(defaultRouteEncounterCatalog);
    addFeed("Admin", "encounters reset", "data");
  }
  if (action === "save-npc-units") {
    try {
      const raw = document.querySelector("#adminNpcUnitJson")?.value || "[]";
      const parsed = JSON.parse(raw);
      const source = Array.isArray(parsed) ? parsed : parsed.units;
      state.npcCombatUnitCatalog = normalizeNpcCombatUnitCatalog(source);
      state.routeEncounterCatalog = normalizeRouteEncounterCatalog(state.routeEncounterCatalog);
      addFeed("Admin", `${state.npcCombatUnitCatalog.length} NPC units saved`, "data");
    } catch (error) {
      addFeed("Admin", "NPC unit JSON invalid", "data");
    }
  }
  if (action === "reset-npc-units") {
    state.npcCombatUnitCatalog = normalizeNpcCombatUnitCatalog(defaultNpcCombatUnitCatalog);
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog(state.routeEncounterCatalog);
    addFeed("Admin", "NPC units reset", "data");
  }
  if (action === "seed-npc-traffic") seedNpcRouteTraffic(state, 12);
  if (action === "clear-npc-traffic") {
    state.npcRouteTraffic = [];
    state.nextNpcTrafficAt = Date.now();
  }
  if (action === "seed-market") {
    state.marketListings = defaultMarketListings();
    state.marketBids = defaultMarketBids();
    state.marketHistory = [];
  }
  if (action === "clear-player-orders") {
    state.marketListings
      .filter((listing) => listing.owner === "player")
      .forEach((listing) => addItem(listing.itemName, listing.qty, listing.cityId, true));
    state.marketBids
      .filter((bid) => bid.owner === "player")
      .forEach((bid) => { state.credits += bid.price * bid.qty; });
    state.marketListings = state.marketListings.filter((listing) => listing.owner !== "player");
    state.marketBids = state.marketBids.filter((bid) => bid.owner !== "player");
  }
  if (action === "export-save") navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
  if (action === "copy-summary") navigator.clipboard?.writeText(`Level ${level()}, ${formatCredits(state.credits)}, ${state.chips} chips, home ${homeDistrict().name}, viewing ${currentDistrict().name}, battery cap ${formatPower(batteryCapacity())}, ${Object.keys(inventoryFor(state.district)).length} relic types here`);

  render();
}

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "confirm-accept") {
    executePendingConfirm();
    return;
  }
  if (button.dataset.action === "confirm-cancel") {
    cancelConfirm();
    return;
  }
  if (button.dataset.action === "go-back") {
    runAction("go-back");
    return;
  }
  if (button.dataset.sheetAction) {
    executeActionSheet(button.dataset.sheetAction);
    return;
  }
  if (button.dataset.openMeldActions) {
    openActionSheet("meld-ingredient", { itemName: button.dataset.openMeldActions });
    return;
  }
  if (button.dataset.openCollectionActions) {
    openActionSheet("collection-item", { itemName: button.dataset.openCollectionActions, cityId: button.dataset.cityId || state.district });
    return;
  }
  if (button.dataset.openInventoryActions) {
    openActionSheet("inventory-item", { itemName: button.dataset.openInventoryActions, cityId: state.district });
    return;
  }
  if (button.dataset.cargoPick) {
    state.shipmentCargo = button.dataset.cargoPick;
    if (!state.shipmentCargoLoad || typeof state.shipmentCargoLoad !== "object") state.shipmentCargoLoad = {};
    if (!state.shipmentCargoLoad[state.shipmentCargo]) {
      const vehicle = itemByName(state.shipmentVehicle);
      const capacity = vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : Infinity;
      updateShipmentCargoLoad(state.shipmentCargo, 1, state.district, capacity);
    }
    render();
    return;
  }
  if (button.dataset.cargoLoad) {
    const vehicle = itemByName(state.shipmentVehicle);
    const capacity = vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : Infinity;
    updateShipmentCargoLoad(button.dataset.cargoLoad, Number(button.dataset.cargoLoadDelta || 1), state.district, capacity);
    render();
    return;
  }
  if (button.dataset.cargoQty) {
    const delta = Number(button.dataset.cargoQty);
    const vehicle = itemByName(state.shipmentVehicle);
    const capacity = vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : 1;
    updateShipmentCargoLoad(state.shipmentCargo, delta, state.district, capacity);
    render();
    return;
  }
  if (button.dataset.shipDestination) {
    state.shipmentDestination = button.dataset.shipDestination;
    state.shipmentEscort = "none";
    render();
    return;
  }
  if (button.dataset.shipVehicle) {
    state.shipmentVehicle = button.dataset.shipVehicle;
    state.shipmentEscort = "none";
    const vehicle = itemByName(state.shipmentVehicle);
    const capacity = vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : Infinity;
    shipmentCargoLoadEntries(state.district, capacity);
    render();
    return;
  }
  if (button.dataset.shipEscort) {
    state.shipmentEscort = button.dataset.shipEscort;
    render();
    return;
  }
  if (button.dataset.raidRoute) {
    state.pvpRoute = button.dataset.raidRoute;
    state.pvpSupport1 = "none";
    state.pvpSupport2 = "none";
    render();
    return;
  }
  if (button.dataset.raidVehicle) {
    state.pvpVehicle = button.dataset.raidVehicle;
    state.pvpSupport1 = "none";
    state.pvpSupport2 = "none";
    render();
    return;
  }
  if (button.dataset.raidSupport1) {
    state.pvpSupport1 = button.dataset.raidSupport1;
    if (state.pvpSupport2 === state.pvpSupport1) state.pvpSupport2 = "none";
    render();
    return;
  }
  if (button.dataset.raidSupport2) {
    state.pvpSupport2 = button.dataset.raidSupport2;
    render();
    return;
  }
  if (button.dataset.routejackTacticChoice) {
    state.routejackTactic = button.dataset.routejackTacticChoice;
    render();
    return;
  }
  if (button.dataset.lootPolicyChoice) {
    state.pvpLootPolicy = button.dataset.lootPolicyChoice;
    render();
    return;
  }
  if (button.dataset.view) {
    runAction("set-view", { view: button.dataset.view });
    return;
  }
  if (button.dataset.contractView) {
    runAction("contract-view", { view: button.dataset.contractView });
    return;
  }
  if (button.dataset.contract) {
    runAction("claim-contract", { id: button.dataset.contract });
    return;
  }
  if (button.dataset.item) {
    runAction("select-item", { itemName: button.dataset.item });
    return;
  }
  if (button.dataset.marketUnwatch) {
    runAction("unwatch-item", { itemName: button.dataset.marketUnwatch });
    return;
  }
  if (button.dataset.watchItem) {
    runAction("toggle-watch", { itemName: button.dataset.watchItem });
    return;
  }
  if (button.dataset.fab) {
    runAction("select-fab", { fabId: button.dataset.fab });
    return;
  }
  if (button.dataset.equipmentSlot) {
    runAction("toggle-equipment-slot", { slotId: button.dataset.equipmentSlot });
    return;
  }
  if (button.dataset.role) {
    runAction("change-role", { roleId: button.dataset.role });
    return;
  }
  if (button.dataset.district) {
    runAction("view-district", { districtId: button.dataset.district });
    return;
  }
  if (button.dataset.homeCity) {
    runAction("set-home-city", { districtId: button.dataset.homeCity });
    return;
  }
  if (button.dataset.moveIngredient) {
    runAction("move-ingredient", { itemName: button.dataset.moveIngredient, sourceCityId: button.dataset.sourceCity });
    return;
  }
  if (button.dataset.buyFab) {
    runAction("buy-fab", { fabType: button.dataset.buyFab });
    return;
  }
  if (button.dataset.rentFab) {
    runAction("rent-fab", { fabType: button.dataset.rentFab });
    return;
  }
  if (button.dataset.retireFab) {
    runAction("retire-fab", { fabId: button.dataset.retireFab });
    return;
  }
  if (button.dataset.fabShopCategory) {
    runAction("set-fab-shop-category", { category: button.dataset.fabShopCategory });
    return;
  }
  if (button.dataset.marketCategory) {
    runAction("set-market-category", { category: button.dataset.marketCategory });
    return;
  }
  if (button.dataset.inventoryCategory) {
    runAction("set-inventory-category", { category: button.dataset.inventoryCategory });
    return;
  }
  if (button.dataset.buyListing) {
    runAction("buy-listing", { listingId: button.dataset.buyListing, qty: Number(document.querySelector("#marketBuyQty")?.value || 1) });
    return;
  }
  if (button.dataset.sellBid) {
    runAction("sell-bid", { bidId: button.dataset.sellBid, qty: Number(document.querySelector("#marketSellQty")?.value || 1) });
    return;
  }
  if (button.dataset.quickSell) {
    runAction("quick-sell", { itemName: button.dataset.quickSell, cityId: state.district, qty: 1 });
    return;
  }
  if (button.dataset.quickRecycle) {
    runAction("quick-recycle", { itemName: button.dataset.quickRecycle, cityId: state.district, qty: 1 });
    return;
  }
  if (button.dataset.cancelListing) {
    runAction("cancel-listing", { id: button.dataset.cancelListing });
    return;
  }
  if (button.dataset.cancelBid) {
    runAction("cancel-bid", { id: button.dataset.cancelBid });
    return;
  }
  if (button.dataset.meldType) {
    runAction("set-meld-type", { type: button.dataset.meldType });
    return;
  }
  if (button.dataset.meld) {
    runAction("create-meld", { meldName: button.dataset.meld });
    return;
  }
  if (button.dataset.routeBattle) {
    runAction("view-route-battle", { id: button.dataset.routeBattle });
    return;
  }
  if (button.dataset.action === "claim-output" || button.dataset.action === "open-print-bay") {
    runAction("open-print-bay");
    return;
  }
  if (button.dataset.action === "inventory-bulk-sell") {
    requestBulkSellFilteredInventory();
    return;
  }
  if (button.dataset.action === "inventory-bulk-recycle") {
    requestBulkRecycleFilteredInventory();
    return;
  }
  if (button.dataset.action === "inventory-bulk-list") {
    requestBulkListFilteredInventory();
    return;
  }
  if (button.dataset.action === "inventory-clear-filters") {
    runAction("clear-inventory-filters");
    return;
  }
  if (button.dataset.action === "market-clear-filters") {
    runAction("clear-market-filters");
    return;
  }
  if (button.dataset.action === "clear-dispatch-notice") {
    state.dispatchNotice = null;
    render();
    return;
  }
  if (button.dataset.action === "close-route-battle") {
    state.battleReplay = null;
    state.selectedRouteBattleId = null;
    render();
    return;
  }
  if (button.dataset.admin) {
    handleAdmin(button.dataset.admin);
    return;
  }
  if (button.dataset.action === "attempt-intercept") {
    attemptIntercept();
    return;
  }
  if (button.dataset.action === "create-shipment") {
    createShipment(
      readShipmentCargoLoad(),
      state.shipmentVehicle,
      state.shipmentDestination,
      state.shipmentEscort || "none",
    );
    return;
  }
  if (button.dataset.action === "list-selected") {
    listItemForSale(
      state.selectedItem,
      Number(document.querySelector("#marketListQty")?.value || 1),
      Number(document.querySelector("#marketListPrice")?.value || 1),
    );
    return;
  }
  if (button.dataset.action === "bid-selected") {
    postBid(
      state.selectedItem,
      Number(document.querySelector("#marketBidQty")?.value || 1),
      Number(document.querySelector("#marketBidPrice")?.value || 1),
    );
    return;
  }
  if (button.dataset.action === "recycle-selected") {
    recycleItem(state.selectedItem, Number(document.querySelector("#marketSellQty")?.value || 1));
    return;
  }
  if (button.dataset.action === "use-selected") {
    useItem(state.selectedItem, Number(document.querySelector("#marketSellQty")?.value || 1), state.district, document.querySelector("#boostFabTarget")?.value || null);
    return;
  }
  if (button.dataset.action === "equip-selected") {
    equipItemToFab(state.selectedItem, Number(document.querySelector("#equipFabTarget")?.value));
    return;
  }
  if (button.dataset.equipFabItem) {
    equipItemToFab(button.dataset.equipFabItem, state.fabs.findIndex((fab) => fab.id === state.selectedFabId), fabById(state.selectedFabId).city);
    return;
  }
  if (button.dataset.action === "trash-selected") {
    if (inventoryFor(state.district)[state.selectedItem]) {
      removeItem(state.selectedItem);
      render();
    }
    return;
  }
  if (button.dataset.action === "buy-power" && state.chips >= 9) {
    state.chips -= 9;
    state.power += 864000;
    render();
    return;
  }
});

document.body.addEventListener("change", (event) => {
  if (event.target.id === "marketSort") {
    state.marketSort = event.target.value;
    render();
    return;
  }
  if (event.target.id === "marketShowEmpty") {
    state.marketShowEmpty = event.target.checked;
    render();
    return;
  }
  if (event.target.id === "marketWatchOnly") {
    state.marketWatchOnly = event.target.checked;
    render();
    return;
  }
  if (event.target.id === "marketMeldTarget") {
    state.marketMeldTarget = event.target.value;
    render();
    return;
  }
  if (event.target.id === "marketRarity") {
    state.marketRarity = event.target.value;
    render();
    return;
  }
  if (event.target.id === "inventoryRarity") {
    state.inventoryRarity = event.target.value;
    render();
    return;
  }
  if (event.target.id === "inventoryBulkRarity") {
    state.inventoryBulkRarity = event.target.value;
    render();
    return;
  }
  if (event.target.id === "inventoryProtectMelds") {
    state.inventoryProtectMelds = event.target.checked;
    render();
    return;
  }
  if (event.target.id === "fabShopScope") {
    state.fabShopScope = event.target.value;
    render();
    return;
  }
  if (event.target.id === "shipmentCargo") {
    state.shipmentCargo = event.target.value;
    touchSessionState();
    return;
  }
  if (event.target.id === "shipmentCargoQty") {
    state.shipmentCargoQty = Math.max(1, Math.floor(Number(event.target.value || 1)));
    touchSessionState();
    return;
  }
  if (event.target.id === "shipmentVehicle") {
    state.shipmentVehicle = event.target.value;
    render();
    return;
  }
  if (event.target.id === "shipmentEscort") {
    state.shipmentEscort = event.target.value;
    render();
    return;
  }
  if (event.target.id === "shipmentDestination") {
    state.shipmentDestination = event.target.value;
    render();
    return;
  }
  if (event.target.id === "pvpRoute") {
    state.pvpRoute = event.target.value;
    render();
    return;
  }
  if (event.target.id === "pvpVehicle") {
    state.pvpVehicle = event.target.value;
    render();
    return;
  }
  if (event.target.id === "pvpSupport1") {
    state.pvpSupport1 = event.target.value;
    render();
    return;
  }
  if (event.target.id === "pvpSupport2") {
    state.pvpSupport2 = event.target.value;
    render();
    return;
  }
  if (event.target.id === "routejackTactic") {
    state.routejackTactic = event.target.value;
    render();
    return;
  }
  if (event.target.id === "pvpLootPolicy") {
    state.pvpLootPolicy = event.target.value;
    render();
    return;
  }
  if (event.target.dataset.battleSetting) {
    updateBattleSimFromControls();
    render();
    return;
  }
  if (event.target.id === "fabPrintPattern") {
    const fab = fabById(state.selectedFabId);
    if (fab && isValidPrintPattern(fab.type, event.target.value)) {
      fab.printPattern = event.target.value;
      addFeed(state.player, `${fabDefinition(fab.type).label} tuned to ${fabPatternLabel(fab)}`, "data");
    }
    render();
    return;
  }
  if (event.target.dataset.mode) {
    const [index, mode] = event.target.dataset.mode.split(":");
    setFabMode(Number(index), mode);
  }
});

function scheduleSearchRender(input) {
  const id = input.id;
  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  window.clearTimeout(searchRenderTimer);
  searchRenderTimer = window.setTimeout(() => {
    render();
    window.requestAnimationFrame(() => {
      const nextInput = document.querySelector(`#${id}`);
      if (!nextInput) return;
      const length = nextInput.value.length;
      nextInput.focus({ preventScroll: true });
      nextInput.setSelectionRange(Math.min(selectionStart ?? length, length), Math.min(selectionEnd ?? length, length));
    });
  }, 140);
}

document.body.addEventListener("input", (event) => {
  if (event.target.id === "marketSearch") {
    state.marketSearch = event.target.value;
    scheduleSearchRender(event.target);
    return;
  }
  if (event.target.id === "inventorySearch") {
    state.inventorySearch = event.target.value;
    scheduleSearchRender(event.target);
    return;
  }
  if (event.target.id === "dispatchCargoSearch") {
    state.dispatchCargoSearch = event.target.value;
    scheduleSearchRender(event.target);
    return;
  }
});

document.querySelector("#resetButton").addEventListener("click", () => {
  openConfirm(
    "reset-session",
    "Start Fresh Prototype?",
    "This clears the current local prototype session and starts a clean test profile.",
    "New Test",
    { danger: true },
  );
});

render();
initializeBrowserNavigation();
window.addEventListener("popstate", handleBrowserNavigation);
setInterval(tick, 1000);
