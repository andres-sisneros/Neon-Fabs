// First-session and Print Bay presentation helpers.

const CITY_SAMPLE_ART_PATH = "assets/vendor/kenney/pico-8-city/source/Sample.png";

function starterHomeProfile(cityId) {
  return {
    "chrome-pier": {
      callout: "Dockside operator",
      angle: "Route gear, vehicle markets, and practical starter trade.",
      stats: ["Starter Fab", "Vehicle Fab", "Boost Fab", "Equipment Fab"],
      artPosition: "48% 48%",
    },
    orchid: {
      callout: "Night-market operator",
      angle: "Starter melds beside food fabs and water route pressure.",
      stats: ["Starter Fab", "Food Fab", "Aquatic Fab"],
      artPosition: "18% 44%",
    },
  }[cityId] || {
    callout: "New operator",
    angle: districtById(cityId).description,
    stats: fabTypeList(districtById(cityId)).split(", "),
    artPosition: "50% 50%",
  };
}

function renderCitySourceArt(district, profile) {
  return `<figure class="city-source-art city-source-art-${district.id}">
    <img src="${CITY_SAMPLE_ART_PATH}" alt="" loading="lazy" style="object-position:${profile.artPosition}">
    <figcaption>${profile.callout}</figcaption>
  </figure>`;
}

function renderFirstRunWelcome() {
  const starterFab = state.fabs.find((fab) => fab.type === "starter") || state.fabs[0];
  const homeCards = STARTER_HOME_CITIES.map((cityId) => {
    const district = districtById(cityId);
    const profile = starterHomeProfile(cityId);
    return `<article class="item-card start-city-card">
      ${renderCitySourceArt(district, profile)}
      <div class="card-row"><h3>${district.name}</h3><span class="pill">${profile.callout}</span></div>
      <p class="muted">${profile.angle}</p>
      <div class="start-city-tags">${profile.stats.map((stat) => `<span>${stat}</span>`).join("")}</div>
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
          <p class="muted">Your free Starter Fab installs here. Meld ingredients must come home before they can fuse.</p>
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
  const featured = groups[0];
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
        <strong class="item-name">${icon(group.item.iconName, group.item.rarity)} ${itemLabel(group.item)}</strong>
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
    <div class="reveal-feature rarity-border-${featured.item.rarity}">
      <span class="reveal-feature-icon">${icon(featured.item.iconName, featured.item.rarity)}</span>
      <div>
        <p class="eyebrow">Best pull</p>
        <h3>${itemLabel(featured.item)}</h3>
        <span>${rarityMeta[featured.item.rarity].label} x${featured.count}</span>
      </div>
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
