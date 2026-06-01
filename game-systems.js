// Game systems, state normalization, simulation rules, and player actions. Loaded after game-content.js and before app.js.
let browserHistoryRestoring = false;

function loadState() {
  clearPrototypeSaves();
  return seedState(defaultState());
}

function clearPrototypeSaves() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(LEGACY_SAVE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
}

function seedState(nextState) {
  const isExistingSave = Boolean(nextState._existingSave);
  const savedFabs = Array.isArray(nextState.fabs) ? nextState.fabs : [];
  const hasExistingProgress = isExistingSave && (
    Boolean(nextState.homeChosen)
    || savedFabs.length > 1
    || savedFabs.some((fab) => fab.type && fab.type !== "starter")
    || (nextState.completed || []).length
    || (nextState.shipments || []).length
    || (nextState.marketHistory || []).length
    || Number(nextState.credits || 0) > 0
    || Number(nextState.batteryExtensions || 0) > 0
    || Object.values(nextState.fabOutputHistory || {}).some((entries) => Array.isArray(entries) && entries.length)
  );
  nextState.nextFabId = Math.max(1, Number(nextState.nextFabId || 1));
  const assignFabId = () => {
    const id = `fab-${nextState.nextFabId}`;
    nextState.nextFabId += 1;
    return id;
  };
  const savedStarter = savedFabs[0] || {};
  const cleanEquipment = (equipment = {}) => Object.fromEntries(
    equipmentSlots
      .map((slot) => [slot.id, itemByName(equipment[slot.id])?.equipmentSlot === slot.id ? equipment[slot.id] : null])
      .filter(([, name]) => Boolean(name)),
  );
  const normalizeFab = (fab, fallback = {}) => {
    const type = fab.type || fallback.type || "starter";
    return {
      id: fab.id || assignFabId(),
      type,
      city: fab.city || fallback.city || "lowline",
      rate: Number(fab.rate || fallback.rate || 12),
      mode: fab.mode || fallback.mode || "parts",
      printPattern: isValidPrintPattern(type, fab.printPattern) ? fab.printPattern : defaultPrintPattern(type),
      grams: Number(fab.grams || 0),
      equipment: cleanEquipment(fab.equipment),
      ownedStatus: fab.ownedStatus || (fab.rentedUntil ? "rented" : "owned"),
      installedAt: fab.installedAt || Date.now(),
      rentedUntil: fab.rentedUntil || null,
    };
  };
  const extraFabs = savedFabs
    .slice(1)
    .filter((fab) => fab.type)
    .slice(0, MAX_ACTIVE_FABS - 1)
    .map((fab) => normalizeFab(fab, { rate: fabCatalog.find((entry) => entry.type === fab.type)?.rate || 12 }));
  nextState.fabs = [
    normalizeFab(savedStarter, { type: "starter", city: "chrome-pier", rate: 12 }),
    ...extraFabs,
  ].slice(0, MAX_ACTIVE_FABS);
  if (!nextState.fabs.some((fab) => fab.id === nextState.selectedFabId)) nextState.selectedFabId = nextState.fabs[0]?.id || "fab-1";
  nextState.activeEquipmentSlot = equipmentSlots.some((slot) => slot.id === nextState.activeEquipmentSlot) ? nextState.activeEquipmentSlot : equipmentSlots[0].id;
  nextState.selectedItem = itemByName(nextState.selectedItem)?.name || "Common Starter Component A";
  nextState.shipmentCargo = itemByName(nextState.shipmentCargo)?.name || "Common Starter Component A";
  nextState.shipmentCargoQty = Math.max(1, Math.floor(Number(nextState.shipmentCargoQty || 1)));
  nextState.shipmentCargoLoad = nextState.shipmentCargoLoad && typeof nextState.shipmentCargoLoad === "object" && !Array.isArray(nextState.shipmentCargoLoad)
    ? Object.fromEntries(Object.entries(nextState.shipmentCargoLoad)
      .filter(([name]) => knownItemName(name) && itemByName(name).category !== "vehicle")
      .map(([name, qty]) => [name, Math.max(0, Math.floor(Number(qty || 0)))])
      .filter(([, qty]) => qty > 0))
    : {};
  nextState.shipmentCargoLoadTouched = Boolean(nextState.shipmentCargoLoadTouched);
  nextState.dispatchCargoSearch = nextState.dispatchCargoSearch || "";
  nextState.shipmentVehicle = itemByName(nextState.shipmentVehicle)?.category === "vehicle" ? nextState.shipmentVehicle : "Common Runner";
  nextState.shipmentEscort = itemByName(nextState.shipmentEscort)?.category === "vehicle" ? nextState.shipmentEscort : "none";
  nextState.shipmentDestination = districts.some((district) => district.id === nextState.shipmentDestination) ? nextState.shipmentDestination : "chrome-pier";
  nextState.pvpRoute = districts.some((district) => district.id === nextState.pvpRoute) ? nextState.pvpRoute : "chrome-pier";
  nextState.pvpVehicle = itemByName(nextState.pvpVehicle)?.category === "vehicle" ? nextState.pvpVehicle : "Common Runner";
  nextState.pvpSupport1 = itemByName(nextState.pvpSupport1)?.category === "vehicle" ? nextState.pvpSupport1 : "none";
  nextState.pvpSupport2 = itemByName(nextState.pvpSupport2)?.category === "vehicle" ? nextState.pvpSupport2 : "none";
  nextState.pvpLootPolicy = ["first", "upgrade"].includes(nextState.pvpLootPolicy) ? nextState.pvpLootPolicy : "upgrade";
  nextState.routejackTactic = Object.keys(battleAttackerTactics).includes(nextState.routejackTactic) ? nextState.routejackTactic : "snatch";
  nextState.role = roles[nextState.role] ? nextState.role : "drifter";
  nextState.battleSim = normalizeBattleSettings(nextState.battleSim);
  nextState.battleSimResult = nextState.battleSimResult?.engine === "auto-battler" ? nextState.battleSimResult : null;
  nextState.battleReplay = nextState.battleReplay?.engine === "live-battle-replay" ? nextState.battleReplay : null;
  nextState.battleBuilds = normalizeBattleBuilds(nextState.battleBuilds);
  nextState.battleComparisonResult = nextState.battleComparisonResult?.engine === "auto-battler-comparison" ? nextState.battleComparisonResult : null;
  nextState.batteryExtensions = Math.max(0, Number(nextState.batteryExtensions || 0));
  nextState.filamentBoost = nextState.filamentBoost?.expiresAt > Date.now() ? nextState.filamentBoost : null;
  nextState.routeScanUntil = Math.max(0, Number(nextState.routeScanUntil || 0));
  nextState.routeScanQuality = rarityOrder.includes(nextState.routeScanQuality) ? nextState.routeScanQuality : null;
  nextState.completed = (nextState.completed || []).filter((name) => melds.some((meld) => meld.name === name));
  nextState.dropRates = { ...defaultDropRates(), ...(nextState.dropRates || {}) };
  nextState.noItemWeight = Number.isFinite(Number(nextState.noItemWeight)) ? Number(nextState.noItemWeight) : defaultNoItemWeight();
  nextState.selectedMeldType = ["starter", "food"].includes(nextState.selectedMeldType) ? nextState.selectedMeldType : "starter";
  nextState.marketCategory = Object.keys(marketCategories).includes(nextState.marketCategory) ? nextState.marketCategory : "all";
  nextState.marketSearch = nextState.marketSearch || "";
  nextState.marketRarity = ["all", ...rarityOrder].includes(nextState.marketRarity) ? nextState.marketRarity : "all";
  nextState.marketSort = ["ask", "bid", "spread", "owned", "rarity", "volume", "name"].includes(nextState.marketSort) ? nextState.marketSort : "ask";
  nextState.marketShowEmpty = Boolean(nextState.marketShowEmpty);
  nextState.marketWatchOnly = Boolean(nextState.marketWatchOnly);
  nextState.marketWatchlist = Array.isArray(nextState.marketWatchlist)
    ? [...new Set(nextState.marketWatchlist.filter(knownItemName))]
    : [];
  nextState.marketMeldTarget = melds.some((meld) => meld.name === nextState.marketMeldTarget) ? nextState.marketMeldTarget : "";
  nextState.inventorySearch = nextState.inventorySearch || "";
  nextState.inventoryCategory = Object.keys(marketCategories).includes(nextState.inventoryCategory) ? nextState.inventoryCategory : "all";
  nextState.inventoryRarity = ["all", ...rarityOrder].includes(nextState.inventoryRarity) ? nextState.inventoryRarity : "all";
  nextState.inventoryBulkRarity = ["all", ...rarityOrder].includes(nextState.inventoryBulkRarity) ? nextState.inventoryBulkRarity : "green";
  nextState.inventoryProtectMelds = nextState.inventoryProtectMelds !== false;
  nextState.pendingConfirm = null;
  nextState.actionSheet = null;
  nextState.dispatchNotice = nextState.dispatchNotice?.text ? nextState.dispatchNotice : null;
  nextState.printBayNotice = nextState.printBayNotice?.expiresAt > Date.now() ? nextState.printBayNotice : null;
  nextState.viewHistory = Array.isArray(nextState.viewHistory) ? nextState.viewHistory.slice(-25) : [];
  nextState.fabShopCategory = fabShopCategories.includes(nextState.fabShopCategory) ? nextState.fabShopCategory : "all";
  nextState.fabShopScope = ["current", "all"].includes(nextState.fabShopScope) ? nextState.fabShopScope : "current";
  nextState.fabOutputHistory = nextState.fabOutputHistory || {};
  nextState.contractStats = { ...defaultContractStats(), ...(nextState.contractStats || {}) };
  nextState.claimedContracts = Array.isArray(nextState.claimedContracts)
    ? nextState.claimedContracts.filter((id) => contractCatalog.some((contract) => contract.id === id))
    : [];
  nextState.fuseAnimation = null;
  nextState.lastCollected = nextState.lastCollected || [];
  nextState.homeChosen = Boolean(nextState.homeChosen);
  if (hasExistingProgress) nextState.homeChosen = true;
  if (nextState.completed?.length) nextState.homeChosen = true;
  delete nextState._existingSave;
  nextState.homeCity = districts.some((district) => district.id === nextState.homeCity) ? nextState.homeCity : "chrome-pier";
  nextState.district = districts.some((district) => district.id === nextState.district) ? nextState.district : nextState.homeCity;
  nextState.cityInventories = { ...emptyCityInventories(), ...(nextState.cityInventories || {}) };
  Object.keys(nextState.cityInventories).forEach((cityId) => {
    nextState.cityInventories[cityId] = Object.fromEntries(
      Object.entries(nextState.cityInventories[cityId] || {}).filter(([name, count]) => knownItemName(name) && count > 0),
    );
  });
  nextState.output = (nextState.output || []).filter((entry) => knownItemName(outputName(entry)));
  nextState.marketListings = Array.isArray(nextState.marketListings) && nextState.marketListings.length ? nextState.marketListings : defaultMarketListings();
  nextState.marketBids = Array.isArray(nextState.marketBids) && nextState.marketBids.length ? nextState.marketBids : defaultMarketBids();
  nextState.marketListings = nextState.marketListings.filter((listing) => knownItemName(listing.itemName));
  nextState.marketBids = nextState.marketBids.filter((bid) => knownItemName(bid.itemName));
  const seenListingIds = new Set();
  nextState.marketListings = nextState.marketListings.filter((listing) => {
    if (seenListingIds.has(listing.id)) return false;
    seenListingIds.add(listing.id);
    return true;
  });
  const seenBidIds = new Set();
  nextState.marketBids = nextState.marketBids.filter((bid) => {
    if (seenBidIds.has(bid.id)) return false;
    seenBidIds.add(bid.id);
    return true;
  });
  defaultMarketListings().forEach((listing) => {
    if (!nextState.marketListings.some((candidate) => candidate.cityId === listing.cityId && candidate.itemName === listing.itemName && candidate.owner === "npc")) {
      nextState.marketListings.push(listing);
    }
  });
  defaultMarketBids().forEach((bid) => {
    if (!nextState.marketBids.some((candidate) => candidate.cityId === bid.cityId && candidate.itemName === bid.itemName && candidate.owner === "npc")) {
      nextState.marketBids.push(bid);
    }
  });
  nextState.marketHistory = Array.isArray(nextState.marketHistory) ? nextState.marketHistory.slice(0, 20) : [];
  nextState.shipments = Array.isArray(nextState.shipments) ? nextState.shipments : [];
  nextState.stolenGoods = Array.isArray(nextState.stolenGoods) ? nextState.stolenGoods : [];
  nextState.pvpLog = Array.isArray(nextState.pvpLog) ? nextState.pvpLog.slice(0, 20) : [];
  nextState.routeBattles = Array.isArray(nextState.routeBattles)
    ? nextState.routeBattles
      .filter((battle) => battle && Array.isArray(battle.entries))
      .slice(0, 30)
    : [];
  nextState.selectedRouteBattleId = nextState.routeBattles.some((battle) => battle.id === nextState.selectedRouteBattleId)
    ? nextState.selectedRouteBattleId
    : null;
  nextState.cityStorageBonus = nextState.cityStorageBonus || {};
  nextState.nextShipmentRiskReduction = Math.max(0, Number(nextState.nextShipmentRiskReduction || 0));
  nextState.nextMarketId = Number.isFinite(Number(nextState.nextMarketId)) ? Number(nextState.nextMarketId) : 1;
  nextState.npcRouteTraffic = [];
  nextState.nextNpcTrafficAt = Number.isFinite(Number(nextState.nextNpcTrafficAt)) ? Number(nextState.nextNpcTrafficAt) : Date.now();
  nextState.npcCombatUnitCatalog = normalizeNpcCombatUnitCatalog(nextState.npcCombatUnitCatalog || defaultNpcCombatUnitCatalog);
  nextState.routeEncounterCatalog = normalizeRouteEncounterCatalog(nextState.routeEncounterCatalog || defaultRouteEncounterCatalog);
  nextState.routeClearances = normalizeRouteClearances(nextState.routeClearances);
  if (nextState.inventory) {
    nextState.cityInventories[nextState.homeCity] = { ...nextState.cityInventories[nextState.homeCity], ...nextState.inventory };
    delete nextState.inventory;
  }
  if (nextState.feed.length) return nextState;
  nextState.feed = [
    ["VectorMoth", "Epic Starter Component A", "data", "2 hours ago"],
    ["Rook-7", "Rare Starter Component C", "cell", "3 hours ago"],
    ["yelloj", "Rare Starter Component B", "lens", "6 hours ago"],
    ["HarryHood", "Epic Starter Component C", "tool", "12 hours ago"],
    ["cappissco", "Uncommon Starter Component B", "tool", "19 hours ago"],
    ["chuddayo", "Common Starter Component A", "poly", "20 hours ago"],
  ];
  return nextState;
}

function touchSessionState() {
  state.lastTick = Date.now();
}

function allItems() {
  return [
    ...starterItems.map((item) => ({ ...item, type: "starter", source: starterFab.group, category: "meld", fab: starterFab.label })),
    ...foodItems.map((item) => ({ ...item, type: "food", source: foodFab.group, category: "meld", fab: foodFab.label })),
    ...vehicleItems.map((item) => ({ ...item, type: "vehicle", source: vehicleFab.group, category: "vehicle", fab: vehicleFab.label })),
    ...aquaticVehicleItems.map((item) => ({ ...item, type: "aquatic", source: aquaticFab.group, category: "vehicle", fab: aquaticFab.label })),
    ...boostItems.map((item) => ({ ...item, type: "boost", source: boostFab.group, category: "boost", fab: boostFab.label })),
    ...nethackItems.map((item) => ({ ...item, type: "nethack", source: nethackFab.group, category: "boost", fab: nethackFab.label })),
    ...equipmentItems.map((item) => ({ ...item, type: "equipment", source: equipmentFab.group, category: "gear", fab: equipmentFab.label })),
  ];
}

function knownItemName(name) {
  return allItems().some((item) => item.name === name);
}

function itemByName(name) {
  return allItems().find((item) => item.name === name) || allItems()[0];
}

function allVehicleItems() {
  return allItems().filter((item) => item.category === "vehicle");
}

function emptyCityInventories() {
  return Object.fromEntries(districts.map((district) => [district.id, {}]));
}

function defaultDropRates() {
  return Object.fromEntries(Object.entries(rarityMeta).map(([rarity, meta]) => [rarity, meta.weight]));
}

function marketPriceSeed(item, districtIndex, offset = 0) {
  const rarityIndex = rarityOrder.indexOf(item.rarity);
  const wave = ((districtIndex + 2) * (rarityIndex + 3) * (offset + 5)) % 7;
  return Math.max(1, Math.round(item.value * (0.86 + wave * 0.07 + offset * 0.05)));
}

function marketSeedItems() {
  return [...starterItems, ...foodItems, ...vehicleItems, ...aquaticVehicleItems, ...boostItems, ...nethackItems, ...equipmentItems];
}

function defaultMarketListings() {
  return districts.flatMap((district, districtIndex) => marketSeedItems().flatMap((item, itemIndex) => {
    const firstQty = item.rarity === "green" ? 8 : item.rarity === "blue" ? 5 : item.rarity === "gold" ? 3 : 1;
    const secondQty = item.rarity === "green" ? 4 : item.rarity === "blue" ? 2 : 1;
    return [
      {
        id: `npc-list-v3-${district.id}-${itemIndex}-a`,
        cityId: district.id,
        itemName: item.name,
        seller: MARKET_SELLER_NAMES[(districtIndex + itemIndex) % MARKET_SELLER_NAMES.length],
        owner: "npc",
        price: marketPriceSeed(item, districtIndex, 0),
        qty: firstQty,
      },
      {
        id: `npc-list-v3-${district.id}-${itemIndex}-b`,
        cityId: district.id,
        itemName: item.name,
        seller: MARKET_SELLER_NAMES[(districtIndex + itemIndex + 2) % MARKET_SELLER_NAMES.length],
        owner: "npc",
        price: marketPriceSeed(item, districtIndex, 2),
        qty: secondQty,
      },
    ];
  }));
}

function defaultMarketBids() {
  return districts.flatMap((district, districtIndex) => marketSeedItems().map((item, itemIndex) => ({
    id: `npc-bid-v3-${district.id}-${itemIndex}`,
    cityId: district.id,
    itemName: item.name,
    buyer: MARKET_BUYER_NAMES[(districtIndex + itemIndex) % MARKET_BUYER_NAMES.length],
    owner: "npc",
    price: Math.max(1, Math.round(marketPriceSeed(item, districtIndex, 1) * 0.76)),
    qty: item.rarity === "green" ? 6 : item.rarity === "blue" ? 3 : 1,
  })));
}

function totalDropWeight() {
  return Math.max(0, Number(state.noItemWeight || 0)) + rarityOrder.reduce((sum, tier) => sum + Math.max(0, Number(state.dropRates[tier] || 0)), 0);
}

function nextMarketId(kind) {
  state.nextMarketId += 1;
  return `${kind}-${Date.now()}-${state.nextMarketId}`;
}

function entryByName(name) {
  return allItems().find((item) => item.name === name) || melds.find((meld) => meld.name === name) || allItems()[0];
}

function outputName(entry) {
  return typeof entry === "string" ? entry : entry.name;
}

function outputCity(entry) {
  if (typeof entry === "string") return state.homeCity;
  return entry.cityId || state.homeCity;
}

function outputFabId(entry) {
  return typeof entry === "string" ? null : entry.fabId || null;
}

function queuedOutputFor(cityId = state.district) {
  return state.output.filter((entry) => outputCity(entry) === cityId);
}

function queuedOutputOutside(cityId = state.district) {
  return state.output.filter((entry) => outputCity(entry) !== cityId);
}

function level() {
  return state.completed.length;
}

function completedContracts() {
  return contractCatalog.filter((contract) => state.claimedContracts.includes(contract.id));
}

function contractUnlocked(contract) {
  return (contract.requires || []).every((id) => state.claimedContracts.includes(id));
}

function unlockedContracts() {
  return contractCatalog.filter((contract) => contractUnlocked(contract));
}

function visibleContracts() {
  return contractCatalog.filter((contract) => state.claimedContracts.includes(contract.id) || contractUnlocked(contract));
}

function nextLockedContract() {
  return contractCatalog.find((contract) => !state.claimedContracts.includes(contract.id) && !contractUnlocked(contract)) || null;
}

function claimableContracts() {
  return unlockedContracts().filter((contract) => contractReady(contract) && !state.claimedContracts.includes(contract.id));
}

function contractRawProgress(contract) {
  if (contract.progress) return Math.max(0, Number(contract.progress() || 0));
  return Math.max(0, Number(state.contractStats[contract.metric] || 0));
}

function contractProgress(contract) {
  return Math.min(contract.target, contractRawProgress(contract));
}

function contractReady(contract) {
  return contractRawProgress(contract) >= contract.target;
}

function rewardLabel(reward) {
  const parts = [];
  if (reward.credits) parts.push(formatCredits(reward.credits));
  if (reward.chips) parts.push(`${reward.chips} chip${reward.chips === 1 ? "" : "s"}`);
  return parts.join(" + ") || "No reward";
}

function trackContract(metric, amount = 1) {
  if (!state.contractStats) state.contractStats = defaultContractStats();
  state.contractStats[metric] = Math.max(0, Number(state.contractStats[metric] || 0)) + Math.max(0, Number(amount || 0));
}

function claimContract(id) {
  const contract = contractCatalog.find((candidate) => candidate.id === id);
  if (!contract || state.claimedContracts.includes(id) || !contractUnlocked(contract) || !contractReady(contract)) return;
  state.claimedContracts.push(id);
  state.credits += contract.reward.credits || 0;
  state.chips += contract.reward.chips || 0;
  addFeed("Contracts", `${contract.title}: ${rewardLabel(contract.reward)}`, "chip");
  render();
}

function currentRole() {
  return roles[state.role] || roles.drifter;
}

function batteryCapacity() {
  return BASE_BATTERY_CAPACITY + level() * MELD_BATTERY_BONUS + Math.max(0, Number(state.batteryExtensions || 0));
}

function formatCredits(value) {
  return `${Math.round(value).toLocaleString()}cr`;
}

function creditFabGain(amount = GOLD_PER_GRAM * ROLL_GRAMS) {
  return Math.max(1, Math.round(amount * (1 + (currentRole().fabCreditBonus || 0))));
}

function formatPower(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function openConfirm(action, title, body, confirmLabel = "Confirm", options = {}) {
  state.pendingConfirm = {
    action,
    title,
    body,
    confirmLabel,
    danger: Boolean(options.danger),
    payload: options.payload || {},
  };
  render();
}

function openActionSheet(type, payload = {}) {
  state.actionSheet = { type, payload };
  render();
}

function closeActionSheet() {
  state.actionSheet = null;
  render();
}

function cancelConfirm() {
  state.pendingConfirm = null;
  render();
}

function icon(name, rarity = "green") {
  return `<span class="icon ${name} rarity-${rarity}"></span>`;
}

function rarityPill(rarity) {
  return `<span class="rarity-chip rarity-${rarity}">${rarityMeta[rarity].label}</span>`;
}

function currentDistrict() {
  return districts.find((district) => district.id === state.district) || districts[0];
}

function homeDistrict() {
  return districts.find((district) => district.id === state.homeCity) || districts[0];
}

function districtById(cityId) {
  return districts.find((district) => district.id === cityId) || districts[0];
}

function inventoryFor(cityId = state.district) {
  if (!state.cityInventories[cityId]) state.cityInventories[cityId] = {};
  return state.cityInventories[cityId];
}

function homeInventory() {
  return inventoryFor(state.homeCity);
}

function fabsForCity(cityId = state.district) {
  return state.fabs.filter((fab) => (fab.city || "lowline") === cityId);
}

function inventoryCount(cityId = state.district) {
  return Object.values(inventoryFor(cityId)).reduce((sum, count) => sum + count, 0);
}

function inventoryLimit(cityId = state.district) {
  return (districtById(cityId).inventoryLimit || 30) + Math.max(0, Number(state.cityStorageBonus[cityId] || 0));
}

function inventoryAvailable(cityId = state.district) {
  return Math.max(0, inventoryLimit(cityId) - inventoryCount(cityId));
}

function inventoryLabel(cityId = state.district) {
  return `${inventoryCount(cityId)}/${inventoryLimit(cityId)}`;
}

function nextFabId() {
  state.nextFabId = Math.max(1, Number(state.nextFabId || 1));
  const id = `fab-${state.nextFabId}`;
  state.nextFabId += 1;
  return id;
}

function createFabRecord(type, cityId, rental = false) {
  const catalog = fabCatalog.find((fab) => fab.type === type);
  const fallbackRate = 12;
  return {
    id: nextFabId(),
    type,
    city: cityId,
    rate: catalog?.rate || fallbackRate,
    mode: "parts",
    printPattern: defaultPrintPattern(type),
    grams: 0,
    equipment: {},
    ownedStatus: rental ? "rented" : "owned",
    installedAt: Date.now(),
    rentedUntil: rental && catalog ? Date.now() + catalog.rentHours * 3600000 : null,
  };
}

function fabById(id) {
  return state.fabs.find((fab) => fab.id === id) || state.fabs[0];
}

function equipmentInSlot(cityId, slotId) {
  return Object.entries(inventoryFor(cityId))
    .map(([name, count]) => ({ item: itemByName(name), count }))
    .filter(({ item, count }) => item.equipmentSlot === slotId && count > 0)
    .sort((a, b) => rarityOrder.indexOf(b.item.rarity) - rarityOrder.indexOf(a.item.rarity) || b.item.rateBonus - a.item.rateBonus || a.item.name.localeCompare(b.item.name));
}

function equipmentRateBonus(fab) {
  return Object.values(fab.equipment || {}).reduce((sum, itemName) => {
    const item = itemByName(itemName);
    return sum + Math.max(0, Number(item.rateBonus || 0));
  }, 0);
}

function effectiveFabRate(fab) {
  const baseRate = Number(fab.rate || 0);
  const homeBoost = fab.city === state.homeCity ? HOME_CITY_RATE_BONUS : 0;
  const roleBoost = fab.type !== "starter" ? (currentRole().fabRateBonus || 0) : 0;
  return baseRate * (1 + homeBoost + roleBoost + equipmentRateBonus(fab));
}

function routeSummary(district) {
  if (!district.routes.length) return "No outgoing routes.";
  return district.routes.map((route) => `${districtById(route.to).name} ${routeDistance(route)}mi`).join(", ");
}

function fabTypeList(district) {
  return district.fabs.map((type) => fabTypeLabels[type] || type).join(", ");
}

function fabDefinition(type) {
  if (type === "food") return foodFab;
  if (type === "vehicle") return vehicleFab;
  if (type === "aquatic") return aquaticFab;
  if (type === "boost") return boostFab;
  if (type === "nethack") return nethackFab;
  if (type === "equipment") return equipmentFab;
  return starterFab;
}

function fabCatalogEntry(type) {
  return fabCatalog.find((fab) => fab.type === type) || null;
}

function fabQueuedCount(fab) {
  if (!fab) return 0;
  return state.output.filter((entry) => outputFabId(entry) === fab.id).length;
}

function fabSellValue(fab) {
  if (!fab || fab.rentedUntil) return 0;
  const catalog = fabCatalogEntry(fab.type);
  return Math.max(1, Math.round((catalog?.buyPrice || 0) * 0.5));
}

function fabRemovalBlock(fab) {
  if (!fab) return "Fab not found.";
  if (state.fabs.length <= 1) return "Keep at least one fab active.";
  if (fabQueuedCount(fab)) return "Open this fab's Print Bay before removing it.";
  return "";
}

function fabLeaseLabel(fab) {
  return fab.rentedUntil ? formatPower(Math.max(0, (fab.rentedUntil - Date.now()) / 1000)) : "Permanent";
}

function returnFabEquipment(fab) {
  Object.values(fab.equipment || {})
    .filter(Boolean)
    .forEach((itemName) => addItem(itemName, 1, fab.city, true));
  fab.equipment = {};
}

function fabPreviewItems(type) {
  const pattern = printPatternsForFabType(type).find((candidate) => candidate.id === defaultPrintPattern(type));
  const items = pattern?.items || fabDefinition(type).items || [];
  return rarityOrder
    .map((rarity) => items.find((item) => item.rarity === rarity))
    .filter(Boolean)
    .map((item) => `<span class="preview-chip">${icon(item.iconName, item.rarity)} ${item.name}</span>`)
    .join("");
}

function renderOwnedFabCard(fab) {
  const definition = fabDefinition(fab.type);
  const city = districtById(fab.city);
  const pattern = printPatternForFab(fab);
  const queued = fabQueuedCount(fab);
  const removalBlock = fabRemovalBlock(fab);
  const rented = Boolean(fab.rentedUntil);
  const actionLabel = rented ? "End Lease" : `Sell ${formatCredits(fabSellValue(fab))}`;
  return `<article class="item-card owned-fab-card ${rented ? "rented" : "owned"}">
    <div class="card-row">
      <h3>${definition.label}</h3>
      <span class="pill">${rented ? "Rented" : "Owned"}</span>
    </div>
    <p class="muted">${city.name} - ${definition.group}. Pattern: ${pattern.label}. ${rented ? `Lease ${fabLeaseLabel(fab)} remaining.` : "Permanent slot."}</p>
    <div class="market-stats">
      <span>Rate <strong>${effectiveFabRate(fab).toFixed(2)}g/h</strong></span>
      <span>Stored <strong>${(fab.grams || 0).toFixed(2)}g</strong></span>
      <span>Print Bay <strong>${queued}</strong></span>
      <span>Pattern <strong>${pattern.label}</strong></span>
      <span>Lease <strong>${fabLeaseLabel(fab)}</strong></span>
    </div>
    <div class="button-row">
      <button type="button" data-view="cities">Open Map</button>
      <button type="button" data-fab="${fab.id}">Details</button>
      <button type="button" data-retire-fab="${fab.id}" ${removalBlock ? "disabled" : ""}>${actionLabel}</button>
    </div>
    ${removalBlock ? `<p class="muted">${removalBlock}</p>` : ""}
  </article>`;
}

function activeFilament() {
  if (!state.filamentBoost || state.filamentBoost.expiresAt <= Date.now()) {
    state.filamentBoost = null;
    return null;
  }
  return state.filamentBoost;
}

function hasActiveScanner() {
  return state.routeScanUntil > Date.now();
}

function dropWeightsWithBoost() {
  const filament = activeFilament();
  const tierWeights = rarityOrder.map((rarity, index) => {
    const base = Math.max(0, Number(state.dropRates[rarity] ?? rarityMeta[rarity].weight));
    if (!filament) return base;
    return Math.round(base * (1 + filament.amount * index));
  });
  return {
    noItemWeight: Math.max(0, Number(state.noItemWeight || 0)),
    tierWeights,
    filament,
  };
}

function boostedTierOdds(rarity) {
  const { noItemWeight, tierWeights } = dropWeightsWithBoost();
  const total = noItemWeight + tierWeights.reduce((sum, weight) => sum + weight, 0);
  if (!total) return "0%";
  return formatOdds((tierWeights[rarityOrder.indexOf(rarity)] / total) * 100);
}

function weightedFind(items = starterItems) {
  const pool = items.filter(Boolean);
  if (!pool.length) return null;
  const { noItemWeight, tierWeights } = dropWeightsWithBoost();
  const totalWeight = noItemWeight + tierWeights.reduce((sum, weight) => sum + weight, 0);
  if (!totalWeight) return pool[0].name;
  let roll = Math.random() * totalWeight;
  roll -= noItemWeight;
  if (roll <= 0) return null;
  for (let index = 0; index < rarityOrder.length; index += 1) {
    roll -= tierWeights[index];
    if (roll <= 0) {
      const tierItems = pool.filter((item) => item.rarity === rarityOrder[index]);
      if (!tierItems.length) return null;
      return tierItems[Math.floor(Math.random() * tierItems.length)].name;
    }
  }
  return pool[0].name;
}

function formatOdds(value) {
  if (value > 0 && value < 0.1) return `${value.toFixed(2)}%`;
  return `${value.toFixed(1)}%`;
}

function tierOdds(rarity) {
  const total = totalDropWeight();
  if (!total) return "0%";
  return formatOdds((Math.max(0, Number(state.dropRates[rarity] || 0)) / total) * 100);
}

function noItemOdds() {
  const total = totalDropWeight();
  if (!total) return "0%";
  return formatOdds((Math.max(0, Number(state.noItemWeight || 0)) / total) * 100);
}

function remotePrice(item, districtId = state.district) {
  const listing = lowestListing(districtId, item.name);
  const bid = highestBid(districtId, item.name);
  if (listing) return listing.price;
  if (bid) return bid.price;
  return item.value;
}

function listingsFor(cityId = state.district, itemName = null) {
  return state.marketListings
    .filter((listing) => listing.cityId === cityId && listing.qty > 0 && (!itemName || listing.itemName === itemName))
    .sort((a, b) => a.price - b.price || a.seller.localeCompare(b.seller));
}

function bidsFor(cityId = state.district, itemName = null) {
  return state.marketBids
    .filter((bid) => bid.cityId === cityId && bid.qty > 0 && (!itemName || bid.itemName === itemName))
    .sort((a, b) => b.price - a.price || a.buyer.localeCompare(b.buyer));
}

function lowestListing(cityId, itemName) {
  return listingsFor(cityId, itemName)[0] || null;
}

function highestBid(cityId, itemName) {
  return bidsFor(cityId, itemName)[0] || null;
}

function recordMarket(type, itemName, qty, price, cityId = state.district, actor = state.player) {
  state.marketHistory.unshift({ type, itemName, qty, price, cityId, actor, at: new Date().toLocaleTimeString() });
  state.marketHistory = state.marketHistory.slice(0, 20);
}

function recycleItem(itemName, qty = 1, cityId = state.district) {
  const amount = Math.min(Math.max(1, Math.floor(qty)), inventoryFor(cityId)[itemName] || 0);
  if (!amount) return;
  removeItem(itemName, amount, cityId);
  state.credits += amount;
  trackContract("itemsRecycled", amount);
  addFeed(state.player, `recycled ${amount}x ${itemName}`, itemByName(itemName).iconName);
  render();
}

function cityQueuePressure(cityId = state.district) {
  const queued = queuedOutputFor(cityId);
  const available = inventoryAvailable(cityId);
  return {
    queued,
    kept: queued,
    available,
    used: inventoryCount(cityId),
    limit: inventoryLimit(cityId),
    collectable: Math.min(queued.length, available),
    remainingSealed: Math.max(0, queued.length - available),
  };
}

function processCollectedItem(itemName, cityId) {
  const added = addItem(itemName, 1, cityId);
  return added ? { ok: true, action: "kept", label: "Stored", detail: districtById(cityId).name } : { ok: false, action: "queued", label: "Still Sealed", detail: "No storage" };
}

function recordFabOutput(entry, result) {
  const fabId = outputFabId(entry);
  if (!fabId) return;
  if (!state.fabOutputHistory[fabId]) state.fabOutputHistory[fabId] = [];
  state.fabOutputHistory[fabId].unshift({
    name: outputName(entry),
    cityId: outputCity(entry),
    result,
    at: new Date().toLocaleTimeString(),
  });
  state.fabOutputHistory[fabId] = state.fabOutputHistory[fabId].slice(0, 12);
}

function runFabBurst(fab, grams) {
  if (!fab || grams <= 0) return 0;
  let rolls = Math.floor(grams / ROLL_GRAMS);
  let produced = 0;
  while (rolls > 0) {
    rolls -= 1;
    if (fab.mode === "credits") {
      state.credits += creditFabGain();
      produced += 1;
    } else {
      const found = weightedFind(fabOutputItems(fab));
      if (found) {
        state.output.unshift({ name: found, cityId: fab.city, fabType: fab.type, fabId: fab.id, printPattern: fab.printPattern });
        produced += 1;
      }
    }
  }
  if (produced) addFeed(fabDefinition(fab.type).label, `${produced} burst outputs`, "data");
  return produced;
}

function useItem(itemName, qty = 1, cityId = state.district, targetFabId = null) {
  const item = itemByName(itemName);
  const amount = Math.min(Math.max(1, Math.floor(qty)), inventoryFor(cityId)[itemName] || 0);
  if (!amount || !item.effect) return;
  removeItem(itemName, amount, cityId);
  let resultText = `used ${itemName}`;
  if (item.effect === "grams") state.fabs[0].grams = (state.fabs[0].grams || 0) + item.amount * amount;
  if (item.effect === "battery") state.power = Math.min(batteryCapacity(), state.power + item.amount * amount);
  if (item.effect === "batteryCap") {
    state.batteryExtensions += item.amount * amount;
    state.power = Math.min(batteryCapacity(), state.power + item.amount * amount);
    resultText = `+${formatPower(item.amount * amount)} battery cap`;
  }
  if (item.effect === "filament") {
    const existing = activeFilament();
    const nextRank = rarityOrder.indexOf(item.rarity);
    const existingRank = existing ? rarityOrder.indexOf(existing.rarity) : -1;
    if (!existing || nextRank >= existingRank) {
      state.filamentBoost = {
        rarity: item.rarity,
        amount: item.amount,
        expiresAt: Date.now() + item.duration * 1000,
      };
      resultText = `${rarityMeta[item.rarity].label} filament active`;
    } else {
      resultText = "stronger filament already active";
    }
  }
  if (item.effect === "scanner") {
    state.routeScanUntil = Math.max(state.routeScanUntil || 0, Date.now() + item.amount * amount * 1000);
    if (!state.routeScanQuality || rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf(state.routeScanQuality)) state.routeScanQuality = item.rarity;
    state.activeView = "shipments";
    resultText = `${rarityMeta[item.rarity].label} scanner active`;
  }
  if (item.effect === "fabBurst") {
    const targetFab = fabById(targetFabId) || state.fabs[0];
    const produced = runFabBurst(targetFab, item.amount * amount);
    state.activeView = "fabs";
    resultText = `${item.amount * amount}g burst on ${fabDefinition(targetFab.type).label} (${produced} outputs)`;
  }
  if (item.effect === "storage") state.cityStorageBonus[cityId] = (state.cityStorageBonus[cityId] || 0) + item.amount * amount;
  if (item.effect === "risk") state.nextShipmentRiskReduction += item.amount * amount;
  if (item.effect === "writ") {
    state.power = batteryCapacity();
    state.fabs.forEach((fab) => { fab.grams = (fab.grams || 0) + item.amount * amount; });
  }
  if (item.category === "boost") trackContract("boostsUsed", amount);
  addFeed(state.player, resultText, item.iconName);
  render();
}

function equipItemToFab(itemName, fabIndex, cityId = state.district) {
  const item = itemByName(itemName);
  const fab = state.fabs[fabIndex];
  if (!item.equipmentSlot || !fab || fab.city !== cityId || (inventoryFor(cityId)[itemName] || 0) < 1) return;
  if (!fab.equipment) fab.equipment = {};
  const replaced = fab.equipment[item.equipmentSlot];
  removeItem(itemName, 1, cityId);
  if (replaced) addItem(replaced, 1, cityId, true);
  fab.equipment[item.equipmentSlot] = itemName;
  trackContract("equipmentEquipped", 1);
  addFeed(state.player, `equipped ${itemName}`, item.iconName);
  render();
}

function routeTo(fromCityId, toCityId) {
  return districtById(fromCityId).routes.find((route) => route.to === toCityId) || null;
}

function routeOptions(cityId = state.district) {
  return districtById(cityId).routes.map((route) => ({ ...route, district: districtById(route.to) }));
}

function routePath(fromCityId, toCityId) {
  if (fromCityId === toCityId) return [fromCityId];
  const queue = [[fromCityId]];
  const seen = new Set([fromCityId]);
  while (queue.length) {
    const path = queue.shift();
    const cityId = path[path.length - 1];
    for (const route of routeOptions(cityId)) {
      if (seen.has(route.to)) continue;
      const nextPath = [...path, route.to];
      if (route.to === toCityId) return nextPath;
      seen.add(route.to);
      queue.push(nextPath);
    }
  }
  return [];
}

function prepareIngredientMove(itemName, sourceCityId) {
  if (!knownItemName(itemName) || !districtById(sourceCityId) || !inventoryFor(sourceCityId)[itemName]) return;
  const path = routePath(sourceCityId, state.homeCity);
  state.district = sourceCityId;
  state.shipmentCargo = itemName;
  state.shipmentDestination = path.length > 1 ? path[1] : state.homeCity;
  state.activeView = "inventory";
  addFeed("Melds", `prepared ${itemName} move`, itemByName(itemName).iconName);
  render();
}

function allRoutePairs() {
  return districts.flatMap((district) => district.routes.map((route) => ({
    from: district.id,
    to: route.to,
    route,
    label: `${district.name} to ${districtById(route.to).name}`,
  })));
}

function rarityIndex(rarity) {
  return Math.max(0, rarityOrder.indexOf(rarity));
}

function normalizeNpcCombatUnitCatalog(catalog = defaultNpcCombatUnitCatalog) {
  const source = Array.isArray(catalog) && catalog.length ? catalog : defaultNpcCombatUnitCatalog;
  return source
    .map((entry, index) => {
      const role = ["raider", "support", "cargo", "escort"].includes(entry.role) ? entry.role : "support";
      const rarity = rarityOrder.includes(entry.rarity) ? entry.rarity : "green";
      const id = String(entry.id || `npc-unit-${index + 1}`).replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
      return {
        id,
        label: String(entry.label || id),
        role,
        rarity,
        iconName: String(entry.iconName || "data"),
        maxHp: Math.max(1, Math.min(999, Math.round(Number(entry.maxHp || 50)))),
        speed: Math.max(1, Math.min(160, Math.round(Number(entry.speed || 16)))),
        impact: Math.max(0, Math.min(220, Math.round(Number(entry.impact || 8)))),
        braveChance: Math.max(0, Math.min(95, Math.round(Number(entry.braveChance || 0)))),
        escapeDrag: Math.max(0, Math.min(80, Math.round(Number(entry.escapeDrag || 0)))),
        targetMode: ["cargo", "highest-impact", "weakest"].includes(entry.targetMode) ? entry.targetMode : "cargo",
        triggers: normalizeNpcUnitTriggers(entry.triggers),
        summary: String(entry.summary || ""),
      };
    })
    .filter((entry, index, list) => entry.id && list.findIndex((candidate) => candidate.id === entry.id) === index);
}

function normalizeNpcUnitTriggers(triggers = []) {
  const phases = new Set(["PreAttack", "OnAttack", "PostAttack", "OnDefend", "OnTakeDamage", "OnDeath", "OnAllyDeath", "OnKill"]);
  const normalizeTrigger = (trigger) => {
    if (!trigger || typeof trigger !== "object") return null;
    return {
      phase: phases.has(trigger.phase) ? trigger.phase : "OnAttack",
      chance: Math.max(0, Math.min(100, Number(trigger.chance ?? 100))),
      cooldown: Math.max(0, Math.min(99, Math.floor(Number(trigger.cooldown || 0)))),
      action: trigger.action || "None",
      text: String(trigger.text || ""),
      then: Array.isArray(trigger.then) ? trigger.then.map(normalizeTrigger).filter(Boolean) : [],
    };
  };
  return Array.isArray(triggers) ? triggers.map(normalizeTrigger).filter(Boolean) : [];
}

function npcCombatUnitCatalog() {
  if (!Array.isArray(state.npcCombatUnitCatalog) || !state.npcCombatUnitCatalog.length) {
    state.npcCombatUnitCatalog = normalizeNpcCombatUnitCatalog(defaultNpcCombatUnitCatalog);
  }
  return state.npcCombatUnitCatalog;
}

function npcCombatUnitById(id) {
  return npcCombatUnitCatalog().find((unit) => unit.id === id) || defaultNpcCombatUnitCatalog.find((unit) => unit.id === id) || null;
}

function normalizeNpcUnitRefs(units = []) {
  return Array.isArray(units)
    ? units
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (!entry || typeof entry !== "object") return null;
        return { ...entry };
      })
      .filter(Boolean)
    : [];
}

function normalizeRouteEncounterWave(base, wave = {}, index = 0) {
  return {
    id: String(wave.id || `${base.id}-wave-${index + 1}`).replace(/[^a-z0-9-_]/gi, "-").toLowerCase(),
    label: String(wave.label || (index ? `${base.label} Wave ${index + 1}` : base.label)),
    weight: Math.max(1, Number(wave.weight || 1)),
    difficulty: Math.max(0, Math.min(4, Math.floor(Number(wave.difficulty ?? base.difficulty ?? 0)))),
    rarityCeiling: rarityOrder.includes(wave.rarityCeiling) ? wave.rarityCeiling : base.rarityCeiling,
    attackerClasses: Array.isArray(wave.attackerClasses) && wave.attackerClasses.length ? wave.attackerClasses : base.attackerClasses,
    attackerSupportClasses: Array.isArray(wave.attackerSupportClasses) ? wave.attackerSupportClasses : base.attackerSupportClasses,
    vehicleClasses: Array.isArray(wave.vehicleClasses) && wave.vehicleClasses.length ? wave.vehicleClasses : base.vehicleClasses,
    supportChance: Math.max(0, Math.min(1, Number(wave.supportChance ?? base.supportChance ?? 0))),
    escortChance: Math.max(0, Math.min(1, Number(wave.escortChance ?? base.escortChance ?? 0))),
    cargoUnits: Math.max(1, Math.min(8, Math.floor(Number(wave.cargoUnits ?? base.cargoUnits ?? 1)))),
    failureMode: ["steal", "destroy"].includes(wave.failureMode || base.failureMode) ? (wave.failureMode || base.failureMode) : "steal",
    attackerUnits: normalizeNpcUnitRefs(wave.attackerUnits ?? base.attackerUnits),
    defenderUnits: normalizeNpcUnitRefs(wave.defenderUnits ?? base.defenderUnits),
  };
}

function normalizeRouteEncounterWaves(entry, base) {
  const source = Array.isArray(entry.waves) && entry.waves.length ? entry.waves : [entry];
  return source.map((wave, index) => normalizeRouteEncounterWave(base, wave, index));
}

function normalizeRouteEncounterCatalog(catalog = defaultRouteEncounterCatalog) {
  const source = Array.isArray(catalog) && catalog.length ? catalog : defaultRouteEncounterCatalog;
  return source
    .map((entry, index) => {
      const role = entry.role === "routejack" ? "routejack" : "merchant";
      const rarityCeiling = rarityOrder.includes(entry.rarityCeiling) ? entry.rarityCeiling : "green";
      const routeKinds = Array.isArray(entry.routeKinds) && entry.routeKinds.length
        ? entry.routeKinds.filter((kind) => ["land", "water"].includes(kind))
        : ["land", "water"];
      const base = {
        id: String(entry.id || `encounter-${index + 1}`).replace(/[^a-z0-9-_]/gi, "-").toLowerCase(),
        role,
        label: String(entry.label || (role === "routejack" ? "NPC Cargo Target" : "NPC Raider")),
        weight: Math.max(1, Number(entry.weight || 1)),
        ratePerHour: Math.max(0, Math.min(2, Number(entry.ratePerHour || 0))),
        routeKinds: routeKinds.length ? routeKinds : ["land", "water"],
        minMiles: Math.max(0, Number(entry.minMiles || 0)),
        maxMiles: Math.max(1, Number(entry.maxMiles || 9999)),
        difficulty: Math.max(0, Math.min(4, Math.floor(Number(entry.difficulty || 0)))),
        rarityCeiling,
        attackerClasses: Array.isArray(entry.attackerClasses) && entry.attackerClasses.length ? entry.attackerClasses : ["interceptor", "runner"],
        attackerSupportClasses: Array.isArray(entry.attackerSupportClasses) ? entry.attackerSupportClasses : [],
        vehicleClasses: Array.isArray(entry.vehicleClasses) && entry.vehicleClasses.length ? entry.vehicleClasses : ["runner", "freighter"],
        supportChance: Math.max(0, Math.min(1, Number(entry.supportChance || 0))),
        escortChance: Math.max(0, Math.min(1, Number(entry.escortChance || 0))),
        cargoUnits: Math.max(1, Math.min(6, Math.floor(Number(entry.cargoUnits || 1)))),
        failureMode: ["steal", "destroy"].includes(entry.failureMode) ? entry.failureMode : "steal",
        attackerUnits: normalizeNpcUnitRefs(entry.attackerUnits),
        defenderUnits: normalizeNpcUnitRefs(entry.defenderUnits),
        clearHours: Math.max(0, Math.min(24, Number(entry.clearHours || 0))),
        clearReduction: Math.max(0, Math.min(0.85, Number(entry.clearReduction || 0))),
        summary: String(entry.summary || ""),
      };
      base.waves = normalizeRouteEncounterWaves(entry, base);
      return base;
    })
    .filter((entry) => entry.ratePerHour > 0 && entry.minMiles <= entry.maxMiles);
}

function routeEncounterCatalog() {
  if (!Array.isArray(state.routeEncounterCatalog) || !state.routeEncounterCatalog.length) {
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog(defaultRouteEncounterCatalog);
  }
  return state.routeEncounterCatalog;
}

function routeKey(fromCityId, toCityId) {
  return [fromCityId, toCityId].sort().join(">");
}

function normalizeRouteClearances(clearances = {}) {
  const now = Date.now();
  return Object.fromEntries(Object.entries(clearances || {})
    .map(([key, value]) => [key, {
      clearedUntil: Number(value?.clearedUntil || 0),
      reduction: Math.max(0, Math.min(0.85, Number(value?.reduction || 0))),
      label: value?.label || "Route stabilized",
      clearedBy: value?.clearedBy || "Route crews",
    }])
    .filter(([, value]) => value.clearedUntil > now && value.reduction > 0));
}

function routeClearance(fromCityId, toCityId, now = Date.now()) {
  state.routeClearances = normalizeRouteClearances(state.routeClearances);
  const clearance = state.routeClearances[routeKey(fromCityId, toCityId)];
  return clearance?.clearedUntil > now ? clearance : null;
}

function routeRiskMultiplier(fromCityId, toCityId, now = Date.now()) {
  const clearance = routeClearance(fromCityId, toCityId, now);
  return clearance ? Math.max(0.15, 1 - clearance.reduction) : 1;
}

function applyRouteClearance(fromCityId, toCityId, encounter, source = state.player) {
  const hours = Math.max(0, Number(encounter?.clearHours || 0));
  const reduction = Math.max(0, Number(encounter?.clearReduction || 0));
  if (!hours || !reduction) return null;
  const key = routeKey(fromCityId, toCityId);
  const existing = routeClearance(fromCityId, toCityId);
  const clearedUntil = Math.max(existing?.clearedUntil || 0, Date.now() + hours * 3600000);
  const next = {
    clearedUntil,
    reduction: Math.max(existing?.reduction || 0, reduction),
    label: encounter.label || "Route stabilized",
    clearedBy: source,
  };
  state.routeClearances[key] = next;
  return next;
}

function routeClearanceSummary(fromCityId, toCityId) {
  const clearance = routeClearance(fromCityId, toCityId);
  if (!clearance) return "";
  return `Stabilized ${Math.round(clearance.reduction * 100)}% for ${formatPower((clearance.clearedUntil - Date.now()) / 1000)}`;
}

const npcRouteNames = {
  merchant: ["Glass Finch Logistics", "Ramen Mule Co.", "Sleeper Dock Union", "Saffron Ledger"],
  routejack: ["Static Knives", "Null Toll Crew", "Redline Ghosts", "Signal Rats"],
};

function npcTrafficKindLabel(kind) {
  return {
    merchant: "NPC Merchant",
    routejack: "NPC Raider",
  }[kind] || "NPC Traffic";
}

function seedNpcRouteTraffic(targetState, count = 8) {
  const now = Date.now();
  Array.from({ length: count }).forEach((_, index) => addNpcRouteTraffic(targetState, now - index * 45000));
}

function addNpcRouteTraffic(targetState = state, now = Date.now()) {
  const pairs = allRoutePairs();
  const pair = pairs[Math.floor(Math.random() * pairs.length)];
  const route = routeTo(pair.from, pair.to) || pair.route;
  const roll = Math.random();
  const kind = roll < 0.62 ? "merchant" : "routejack";
  const preferred = kind === "merchant" ? ["freighter", "runner"] : ["interceptor", "runner"];
  const vehicle = simulatedRouteVehicle(route, preferred);
  const routeHours = routeTravelHours(route, vehicle);
  const travelMs = Math.max(180000, routeHours * 3600000);
  const names = npcRouteNames[kind];
  const nextId = Number(targetState.nextMarketId || 1);
  targetState.nextMarketId = nextId + 1;
  targetState.npcRouteTraffic.unshift({
    id: `npc-${nextId}`,
    kind,
    name: names[Math.floor(Math.random() * names.length)],
    from: pair.from,
    to: pair.to,
    vehicle: vehicle.name,
    routeMiles: routeDistance(route),
    routeKind: routeKind(route),
    startedAt: now,
    endsAt: now + travelMs,
    status: "active",
  });
  targetState.npcRouteTraffic = targetState.npcRouteTraffic.slice(0, 24);
}

function processNpcRouteTraffic(now = Date.now()) {
  state.npcRouteTraffic = [];
  state.nextNpcTrafficAt = now;
}

function npcRouteTrafficForCity(cityId = state.district) {
  return (state.npcRouteTraffic || [])
    .filter((traffic) => traffic.status === "active" && (traffic.from === cityId || traffic.to === cityId))
    .sort((a, b) => a.endsAt - b.endsAt);
}

function npcRouteTrafficOnRoute(fromCityId, toCityId, kind = null) {
  return (state.npcRouteTraffic || [])
    .filter((traffic) => traffic.status === "active"
      && (!kind || traffic.kind === kind)
      && sameRoute(traffic.from, traffic.to, fromCityId, toCityId));
}

function npcRoutejackPatrolOnRoute(fromCityId, toCityId) {
  const traffic = npcRouteTrafficOnRoute(fromCityId, toCityId, "routejack")[0];
  if (!traffic) return null;
  return {
    id: traffic.id,
    kind: "intercept",
    owner: "npc",
    ownerName: traffic.name,
    from: traffic.from,
    to: traffic.to,
    vehicle: traffic.vehicle,
    loot: [],
    lootPolicy: "upgrade",
    capacity: Math.max(1, Number(itemByName(traffic.vehicle).capacity || 1)),
    status: "in-transit",
    events: [],
  };
}

function selectedBattleRoute() {
  if (!state.battleSim) state.battleSim = defaultBattleSim();
  const routeInfo = battleRouteFor(state.battleSim);
  state.battleSim.from = routeInfo.from;
  state.battleSim.to = routeInfo.to;
  return routeInfo;
}

function routeKind(route) {
  return route?.type || "land";
}

function routeDistance(route) {
  return Math.max(1, Number(route?.miles || (route?.hours || 1) * 36));
}

function vehicleMph(vehicle) {
  return Math.max(1, Number(vehicle?.mph || (vehicle?.speed || 1) * 36));
}

function vehicleProfileScore(vehicle) {
  return Math.max(1, Math.min(100, Number(vehicle?.profile || 40)));
}

function vehicleSensorScore(vehicle) {
  return Math.max(0, Math.min(100, Number(vehicle?.sensor || 20)));
}

function routeTravelHours(route, vehicle, speedBonus = 0) {
  return routeDistance(route) / (vehicleMph(vehicle) * (1 + speedBonus));
}

function vehicleCanUseRoute(vehicle, route) {
  if (!vehicle || vehicle.category !== "vehicle" || !route) return false;
  return (vehicle.routeMode || "land") === routeKind(route) || vehicle.routeMode === "all";
}

function vehicleModeLabel(vehicle) {
  return (vehicle.routeMode || "land") === "water" ? "water" : "land";
}

function formatRouteTime(hours) {
  if (!Number.isFinite(hours)) return "unknown";
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!wholeHours) return `${minutes}m`;
  return minutes ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
}

function pvpTargetItems() {
  return allItems().filter((item) => item.category !== "vehicle");
}

function addPvpLog(text) {
  state.pvpLog.unshift({ text, at: new Date().toLocaleTimeString() });
  state.pvpLog = state.pvpLog.slice(0, 20);
}

function shipmentStateSignature() {
  return state.shipments
    .map((shipment) => `${shipment.id}:${shipment.status}:${shipment.resolvedAt || 0}:${(shipment.events || []).length}:${shipment.battleId || ""}`)
    .join("|");
}

function sameRoute(aFrom, aTo, bFrom, bTo) {
  return [aFrom, aTo].sort().join(":") === [bFrom, bTo].sort().join(":");
}

function activeInterceptorsOnRoute(fromCityId, toCityId) {
  return state.shipments.filter((shipment) => shipment.kind === "intercept" && shipment.status === "in-transit" && sameRoute(shipment.from, shipment.to, fromCityId, toCityId));
}

function routeBetween(fromCityId, toCityId) {
  return routeTo(fromCityId, toCityId) || routeTo(toCityId, fromCityId);
}

function routeLabel(fromCityId, toCityId) {
  return `${districtById(fromCityId).name} to ${districtById(toCityId).name}`;
}

function routeRunVehicles(run) {
  return [run.vehicle, run.support1, run.support2]
    .filter((name) => name && name !== "none");
}

function routeRunCapacity(run) {
  const vehicles = routeRunVehicles(run)
    .map((name) => itemByName(name))
    .filter((vehicle) => vehicle?.category === "vehicle");
  const capacity = vehicles.reduce((sum, vehicle) => sum + Math.max(1, Number(vehicle.capacity || 1)), 0);
  return Math.max(1, capacity || 1);
}

function routeRunHasLootRoom(run) {
  const loot = run.loot || [];
  return loot.length < routeRunCapacity(run) || run.lootPolicy === "upgrade";
}

function routeJobTitle(shipment) {
  if (shipment.kind === "intercept") return "Routejack Raid";
  return shipmentCargoShortLabel(shipment);
}

function routeJobDetail(shipment) {
  const vehicle = itemByName(shipment.vehicle);
  const speed = vehicle?.category === "vehicle" ? `${vehicleMph(vehicle)} mph` : "unknown speed";
  const capacity = shipment.capacity || routeRunCapacity(shipment);
  const profile = vehicle?.category === "vehicle" ? `${profileBand(vehicleProfileScore(vehicle))} profile` : "unknown profile";
  const sensor = vehicle?.category === "vehicle" ? `${vehicleSensorScore(vehicle)} sensor` : "unknown sensor";
  const route = routeBetween(shipment.from, shipment.to);
  const encounter = route ? `Encounter ${routeEncounterHourlyChance(shipment, route)}%/hr` : "Encounter unknown";
  const clearance = route ? routeClearanceSummary(shipment.from, shipment.to) : "";
  const routeState = clearance ? `${encounter}; ${clearance}` : encounter;
  if (shipment.kind === "intercept") {
    const convoy = routeRunVehicles(shipment).join(" + ");
    return `Raiding designed NPC cargo targets at ${speed}. Convoy: ${convoy}. Hold policy: ${shipment.lootPolicy === "upgrade" ? "upgrade loot" : "fill hold"}. Capacity ${capacity}; ${sensor}; ${routeState}.`;
  }
  return `Manifest: ${shipmentCargoLabel(shipment)}. ${profile}; ${routeState}.`;
}

function routeDetectionChance(hunterVehicle, targetVehicle, cargoUnits = 1, options = {}) {
  const sensor = vehicleSensorScore(hunterVehicle);
  const profile = vehicleProfileScore(targetVehicle);
  const loadedCargo = Math.max(0, Number(cargoUnits || 1) - 1) * 5;
  const speedPressure = (vehicleMph(hunterVehicle) - vehicleMph(targetVehicle)) * 0.2;
  const qualityEvasion = Math.max(0, rarityRank(targetVehicle)) * 3;
  const chance = 8 + sensor * 0.45 + profile * 0.65 + loadedCargo + speedPressure - qualityEvasion + Number(options.bonus || 0);
  return Math.round(Math.max(5, Math.min(95, chance)));
}

function routeDetectionRoll(hunterVehicle, targetVehicle, cargoUnits = 1, options = {}) {
  const chance = routeDetectionChance(hunterVehicle, targetVehicle, cargoUnits, options);
  const roll = Math.random() * 100;
  return { chance, roll, detected: roll < chance };
}

function routeEncounterChance(route, vehicle, cargoUnits = 1, options = {}) {
  const miles = routeDistance(route);
  const profile = vehicleProfileScore(vehicle);
  const cargoPressure = Math.max(0, Number(cargoUnits || 1) - 1) * 5;
  const routePressure = Math.min(28, miles / 7);
  const speedReduction = Math.min(14, vehicleMph(vehicle) * 0.08);
  const escortReduction = options.escort ? 10 : 0;
  const roleReduction = Number.isFinite(Number(options.roleReduction)) ? Number(options.roleReduction) : (currentRole().riskReduction || 0);
  const chance = 8 + routePressure + profile * 0.34 + cargoPressure - speedReduction - escortReduction - roleReduction;
  return Math.round(Math.max(5, Math.min(70, chance)));
}

function eligibleRouteEncounters(shipment, route) {
  const role = shipment.kind === "intercept" ? "routejack" : "merchant";
  const miles = routeDistance(route);
  const kind = routeKind(route);
  return routeEncounterCatalog().filter((entry) => entry.role === role
    && entry.routeKinds.includes(kind)
    && miles >= entry.minMiles
    && miles <= entry.maxMiles);
}

function routeEncounterRatePerHour(shipment, route) {
  const entries = eligibleRouteEncounters(shipment, route);
  const baseRate = entries.reduce((sum, entry) => sum + Number(entry.ratePerHour || 0), 0);
  const loadPressure = shipment.kind === "intercept" ? 1 : 1 + Math.max(0, shipmentCargoUnits(shipment) - 1) * 0.08;
  const clearance = routeRiskMultiplier(shipment.from, shipment.to);
  return Math.max(0, Math.min(1.8, baseRate * loadPressure * clearance));
}

function routeEncounterHourlyChance(shipment, route) {
  return Math.round(Math.max(0, Math.min(95, routeEncounterRatePerHour(shipment, route) * 100)));
}

function pickRouteEncounter(shipment, route) {
  const entries = eligibleRouteEncounters(shipment, route);
  const total = entries.reduce((sum, entry) => sum + (entry.weight * Math.max(0.01, entry.ratePerHour)), 0);
  if (!total) return null;
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight * Math.max(0.01, entry.ratePerHour);
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1] || null;
}

function pickEncounterWave(encounter) {
  if (!encounter) return null;
  const waves = Array.isArray(encounter?.waves) && encounter.waves.length
    ? encounter.waves
    : normalizeRouteEncounterWaves(encounter || {}, encounter || {});
  const total = waves.reduce((sum, wave) => sum + Math.max(1, Number(wave.weight || 1)), 0);
  let roll = Math.random() * total;
  for (const wave of waves) {
    roll -= Math.max(1, Number(wave.weight || 1));
    if (roll <= 0) return wave;
  }
  return waves[0] || null;
}

function rollRouteEncounter(shipment, route, elapsedMs) {
  const elapsedHours = Math.max(0, elapsedMs / 3600000);
  if (!elapsedHours) return null;
  const hourlyRate = routeEncounterRatePerHour(shipment, route);
  if (!hourlyRate) return null;
  const chance = 1 - Math.pow(Math.max(0, 1 - Math.min(0.95, hourlyRate)), elapsedHours);
  const roll = Math.random();
  if (roll >= chance) return null;
  const encounter = pickRouteEncounter(shipment, route);
  return encounter ? { encounter, wave: pickEncounterWave(encounter), chance, roll, elapsedHours } : null;
}

function routejackTargetRichness(route) {
  const miles = routeDistance(route);
  if (miles >= 180) return "High-value convoys";
  if (miles >= 110) return "Mixed cargo";
  return "Local cargo";
}

function shipmentRiskChance(route, vehicle, fromCityId = state.district) {
  return routeEncounterChance(route, vehicle, 1, { escort: false, fromCityId });
}

function vehicleItemsIn(cityId = state.district) {
  return Object.entries(inventoryFor(cityId))
    .map(([name, count]) => ({ item: itemByName(name), count }))
    .filter(({ item, count }) => item.category === "vehicle" && count > 0);
}

function shippableItemsIn(cityId = state.district) {
  return Object.entries(inventoryFor(cityId))
    .map(([name, count]) => ({ item: itemByName(name), count }))
    .filter(({ item, count }) => item.category !== "vehicle" && count > 0);
}

function shipmentCargoLoadEntries(cityId = state.district, capacity = Infinity) {
  const inventory = inventoryFor(cityId);
  const rawLoad = state.shipmentCargoLoad && typeof state.shipmentCargoLoad === "object" && !Array.isArray(state.shipmentCargoLoad)
    ? { ...state.shipmentCargoLoad }
    : {};
  if (!Object.keys(rawLoad).length && !state.shipmentCargoLoadTouched && knownItemName(state.shipmentCargo) && itemByName(state.shipmentCargo).category !== "vehicle") {
    rawLoad[state.shipmentCargo] = Math.max(1, Math.floor(Number(state.shipmentCargoQty || 1)));
  }
  const cleanLoad = {};
  let remaining = Math.max(0, Number.isFinite(capacity) ? Math.floor(capacity) : Infinity);
  Object.entries(rawLoad).forEach(([name, qty]) => {
    if (!knownItemName(name) || itemByName(name).category === "vehicle" || remaining <= 0) return;
    const owned = Math.max(0, Math.floor(Number(inventory[name] || 0)));
    const requested = Math.max(0, Math.floor(Number(qty || 0)));
    const kept = Math.min(owned, requested, remaining);
    if (kept > 0) {
      cleanLoad[name] = kept;
      remaining -= kept;
    }
  });
  state.shipmentCargoLoad = cleanLoad;
  const entries = Object.entries(cleanLoad).map(([name, qty]) => ({ name, qty }));
  const first = entries[0];
  if (first) {
    state.shipmentCargo = first.name;
    state.shipmentCargoQty = first.qty;
  }
  return entries;
}

function shipmentCargoLoadUnits(load = shipmentCargoLoadEntries()) {
  return load.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.qty || 0))), 0);
}

function updateShipmentCargoLoad(itemName, delta, cityId = state.district, capacity = Infinity) {
  if (!knownItemName(itemName) || itemByName(itemName).category === "vehicle") return [];
  state.shipmentCargoLoadTouched = true;
  const current = shipmentCargoLoadEntries(cityId, capacity);
  const currentQty = current.find((entry) => entry.name === itemName)?.qty || 0;
  const currentUnits = shipmentCargoLoadUnits(current);
  const owned = Math.max(0, Math.floor(Number(inventoryFor(cityId)[itemName] || 0)));
  const roomForItem = Math.max(0, (Number.isFinite(capacity) ? Math.floor(capacity) : currentUnits + owned) - currentUnits + currentQty);
  const nextQty = Math.max(0, Math.min(owned, roomForItem, currentQty + Math.floor(Number(delta || 0))));
  if (nextQty > 0) state.shipmentCargoLoad[itemName] = nextQty;
  else delete state.shipmentCargoLoad[itemName];
  state.shipmentCargo = itemName;
  state.shipmentCargoQty = Math.max(1, nextQty || 1);
  return shipmentCargoLoadEntries(cityId, capacity);
}

function shipmentStatus(shipment) {
  if (shipment.status === "blocked") return "storage full";
  if (shipment.status === "raided") return "raided";
  if (shipment.status === "arrived") return "arrived";
  if (shipment.status === "failed") return "failed";
  if (shipment.status === "intercepted") return "intercepted";
  const remaining = Math.max(0, shipment.arrivesAt - Date.now());
  return remaining ? formatPower(remaining / 1000) : "arrived";
}

function addShipmentEvent(shipment, text) {
  shipment.events = shipment.events || [];
  shipment.events.unshift(`${new Date().toLocaleTimeString()} ${text}`);
  shipment.events = shipment.events.slice(0, 4);
}

function shipmentCargos(shipment) {
  if (Array.isArray(shipment.cargos) && shipment.cargos.length) {
    return shipment.cargos
      .map((entry) => ({ name: entry.name, qty: Math.max(1, Math.floor(Number(entry.qty || 1))) }))
      .filter((entry) => itemByName(entry.name));
  }
  return shipment.cargo ? [{ name: shipment.cargo, qty: 1 }] : [];
}

function shipmentCargoUnits(shipment) {
  return shipmentCargos(shipment).reduce((sum, entry) => sum + entry.qty, 0);
}

function shipmentCargoLabel(shipment) {
  const cargos = shipmentCargos(shipment);
  if (!cargos.length) return "No cargo";
  if (cargos.length === 1) return `${cargos[0].qty}x ${cargos[0].name}`;
  return `${shipmentCargoUnits(shipment)} items: ${cargos.map((entry) => `${entry.qty}x ${entry.name}`).join(", ")}`;
}

function shipmentCargoShortLabel(shipment) {
  const cargos = shipmentCargos(shipment);
  if (!cargos.length) return "No cargo";
  if (cargos.length === 1) return cargos[0].qty === 1 ? cargos[0].name : `${cargos[0].qty}x ${cargos[0].name}`;
  return `${shipmentCargoUnits(shipment)} cargo items`;
}

function shipmentPrimaryCargo(shipment) {
  return shipmentCargos(shipment)[0]?.name || shipment.cargo || "Common Starter Component A";
}

function readShipmentCargoLoad() {
  const controls = [...document.querySelectorAll("[data-ship-cargo]")];
  if (!controls.length) {
    const vehicle = itemByName(state.shipmentVehicle);
    const capacity = vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : Infinity;
    const stateLoad = shipmentCargoLoadEntries(state.district, capacity);
    if (stateLoad.length) return stateLoad;
    const fallback = document.querySelector("#shipmentCargo")?.value || state.shipmentCargo;
    return fallback && knownItemName(fallback) ? [{ name: fallback, qty: Math.max(1, Math.floor(Number(state.shipmentCargoQty || 1))) }] : [];
  }
  return controls
    .map((input) => ({ name: input.dataset.shipCargo, qty: Math.max(0, Math.floor(Number(input.value || 0))) }))
    .filter((entry) => entry.qty > 0);
}

function shipmentCargoValue(shipment) {
  return shipmentCargos(shipment).reduce((sum, entry) => sum + itemByName(entry.name).value * entry.qty, 0);
}

function merchantFreightPayout(shipment) {
  const cargoUnits = Math.max(1, shipmentCargoUnits(shipment));
  const routeMiles = Math.max(1, Number(shipment.routeMiles || routeDistance(routeBetween(shipment.from, shipment.to))));
  const capacity = Math.max(cargoUnits, Number(shipment.capacity || cargoUnits));
  const distancePay = routeMiles * 0.45 * cargoUnits;
  const handlingPay = 8 * cargoUnits;
  const valuePay = shipmentCargoValue(shipment) * 0.08;
  const fillBonus = cargoUnits >= capacity ? 1.2 : 1;
  const roleBonus = 1 + (roles.merchant.freightBonus || 0);
  return Math.max(1, Math.round((distancePay + handlingPay + valuePay) * fillBonus * roleBonus));
}

function deliverShipment(shipment) {
  const cargos = shipmentCargos(shipment);
  const cargoUnits = shipmentCargoUnits(shipment);
  const vehicleUnits = 1 + (shipment.escortVehicle ? 1 : 0);
  const roomForBoth = inventoryAvailable(shipment.to) >= cargoUnits + vehicleUnits;
  if (!roomForBoth) {
    shipment.status = "blocked";
    if (!shipment.blockedNotified) {
      shipment.blockedNotified = true;
      addShipmentEvent(shipment, `Arrival blocked by full destination storage. Needs ${cargoUnits + vehicleUnits} free slot${cargoUnits + vehicleUnits === 1 ? "" : "s"}.`);
    }
    return false;
  }
  cargos.forEach((entry) => addItem(entry.name, entry.qty, shipment.to));
  addItem(shipment.vehicle, 1, shipment.to);
  if (shipment.escortVehicle) addItem(shipment.escortVehicle, 1, shipment.to);
  shipment.status = "arrived";
  shipment.resolvedAt = Date.now();
  let payout = 0;
  if (shipment.profession === "merchant" && !shipment.freightPaid) {
    payout = merchantFreightPayout(shipment);
    state.credits += payout;
    shipment.freightPaid = payout;
  }
  addShipmentEvent(shipment, `Shipment arrived intact with ${shipmentCargoLabel(shipment)}${payout ? ` and earned ${formatCredits(payout)} freight pay` : ""}.`);
  addPvpLog(`Merchant convoy arrived in ${districtById(shipment.to).name}${payout ? ` and earned ${formatCredits(payout)}` : ""}.`);
  addFeed(state.player, payout ? `freight ${formatCredits(payout)}` : `${shipmentCargoShortLabel(shipment)} arrived`, itemByName(shipmentPrimaryCargo(shipment)).iconName);
  return true;
}

function recordStolenGood(itemName, qty, from, to, raider, battleId = null, extra = {}) {
  state.stolenGoods.unshift({
    itemName,
    qty,
    from,
    to,
    raider,
    at: Date.now(),
    status: "stolen",
    battleId,
    ...extra,
  });
  state.stolenGoods = state.stolenGoods.slice(0, 60);
}

function resolveMerchantRoutejackBattle(shipment, patrol, options = {}) {
  const route = routeBetween(shipment.from, shipment.to);
  const encounter = options.encounter || null;
  const wave = options.wave || pickEncounterWave(encounter) || encounter;
  const attackerSupport1 = wave && Math.random() < wave.supportChance
    ? simulatedRouteVehicle(route, wave.attackerSupportClasses || ["runner"], { maxRarityRank: rarityIndex(wave.rarityCeiling) }).name
    : "none";
  const settings = routeBattleSettings({
    from: patrol.from,
    to: patrol.to,
    attackerVehicle: patrol.vehicle,
    attackerSupport1,
    attackerUnits: wave?.attackerUnits || [],
    replaceAttackers: Boolean(wave?.attackerUnits?.length),
    defenderVehicle: shipment.vehicle,
    defenderEscort1: shipment.escortVehicle || "none",
    cargo: shipmentPrimaryCargo(shipment),
    cargoUnits: shipmentCargoUnits(shipment),
    attackerRole: "routejack",
    defenderRole: "merchant",
    attackerTactic: "snatch",
    defenderTactic: "protect",
    lootPolicy: patrol.lootPolicy || "upgrade",
    failureMode: wave?.failureMode || encounter?.failureMode || "steal",
  });
  const battleRun = simulateAutoBattleRun(settings, route);
  if (settings.failureMode === "destroy" && battleRun.outcome === "stolen") {
    battleRun.outcome = "destroyed";
    const final = battleRun.log.findLast?.((entry) => entry.type === "outcome");
    if (final) final.text = `${wave?.label || encounter?.label || "Route threat"} disabled the convoy instead of stealing cargo.`;
  }
  const record = recordRouteBattle({
    kind: "npc-raider-merchant",
    title: `${encounter?.label || "NPC encounter"}${wave?.label && wave.label !== encounter?.label ? ` / ${wave.label}` : ""}: ${shipmentCargoShortLabel(shipment)}`,
    from: shipment.from,
    to: shipment.to,
    settings,
    route,
    run: battleRun,
    relatedShipments: [shipment, patrol],
  });
  if (!["stolen", "destroyed"].includes(battleRun.outcome)) {
    addShipmentEvent(shipment, `NPC raider encounter engaged and failed. Battle replay ${record.id} recorded.`);
    addShipmentEvent(patrol, `Engaged ${shipment.vehicle}; cargo escaped. Battle replay ${record.id} recorded.`);
    addPvpLog(`${shipmentCargoShortLabel(shipment)} survived an NPC encounter on ${routeLabel(shipment.from, shipment.to)}.`);
    const clearance = applyRouteClearance(shipment.from, shipment.to, encounter, state.player);
    if (clearance) {
      addShipmentEvent(shipment, `${routeLabel(shipment.from, shipment.to)} stabilized by ${Math.round(clearance.reduction * 100)}% for ${formatPower((clearance.clearedUntil - Date.now()) / 1000)}.`);
    }
    if (options.continueOnSurvive) {
      state.dispatchNotice = {
        type: "success",
        shipmentId: shipment.id,
        text: `${shipmentCargoShortLabel(shipment)} survived a route encounter`,
        detail: `${wave?.label || encounter?.label || "NPC raider"} failed on ${routeLabel(shipment.from, shipment.to)}. Convoy is still en route.`,
        at: Date.now(),
      };
      return true;
    }
    return deliverShipment(shipment);
  }

  if (battleRun.outcome === "destroyed") {
    shipmentCargos(shipment).forEach((entry) => addItem(entry.name, entry.qty, shipment.from, true));
    shipment.status = "raided";
    shipment.resolvedAt = Date.now();
    addItem(shipment.vehicle, 1, shipment.from, true);
    if (shipment.escortVehicle) addItem(shipment.escortVehicle, 1, shipment.from, true);
    addShipmentEvent(shipment, `${wave?.label || encounter?.label || "Route anomaly"} disabled the convoy. Cargo and vehicles were recovered at ${districtById(shipment.from).name}; no cargo was stolen.`);
    addPvpLog(`${shipmentCargoShortLabel(shipment)} was forced back by ${wave?.label || encounter?.label || "a route anomaly"} on ${routeLabel(shipment.from, shipment.to)}.`);
    state.dispatchNotice = {
      type: "warning",
      shipmentId: shipment.id,
      text: `${shipmentCargoShortLabel(shipment)} was forced back`,
      detail: `${wave?.label || encounter?.label || "Route anomaly"} disabled the convoy. Battle replay ${record.id} recorded.`,
      at: Date.now(),
    };
    return false;
  }

  let kept = 0;
  const returned = [];
  shipmentCargos(shipment).forEach((entry) => {
    Array.from({ length: entry.qty }).forEach(() => {
      const result = addLootToRun(patrol, entry.name);
      if (result.kept) {
        kept += 1;
        if (result.replaced) {
          addShipmentEvent(patrol, `Jettisoned ${result.replaced} to keep ${entry.name}.`);
        }
        recordStolenGood(entry.name, 1, shipment.from, shipment.to, patrol.ownerName || state.player, record.id, { interceptedVehicle: shipment.vehicle });
      } else {
        returned.push(entry.name);
      }
    });
  });

  if (!kept) {
    addShipmentEvent(shipment, `NPC raider disabled the convoy but had no cargo room. Cargo continued. Battle replay ${record.id} recorded.`);
    addShipmentEvent(patrol, `Won the encounter but had no room for ${shipmentCargoShortLabel(shipment)}.`);
    return deliverShipment(shipment);
  }

  returned.forEach((itemName) => addItem(itemName, 1, shipment.from, true));
  shipment.status = "raided";
  shipment.resolvedAt = Date.now();
  addItem(shipment.vehicle, 1, shipment.from, true);
  if (shipment.escortVehicle) addItem(shipment.escortVehicle, 1, shipment.from, true);
  addShipmentEvent(shipment, `NPC raider stole ${kept}/${shipmentCargoUnits(shipment)} cargo unit${kept === 1 ? "" : "s"}. Vehicle returned to ${districtById(shipment.from).name}.`);
  addShipmentEvent(patrol, `Stole ${kept} cargo unit${kept === 1 ? "" : "s"} from ${shipment.vehicle}. Battle replay ${record.id} recorded.`);
  addPvpLog(`${patrol.ownerName || "NPC raider"} stole ${kept} item${kept === 1 ? "" : "s"} on ${routeLabel(shipment.from, shipment.to)}.`);
  addFeed(patrol.owner === "npc" ? "Route Watch" : state.player, patrol.owner === "npc" ? `lost ${kept} cargo` : `stole ${kept} cargo`, itemByName(shipmentPrimaryCargo(shipment)).iconName);
  state.dispatchNotice = {
    type: "warning",
    shipmentId: shipment.id,
    text: `${shipmentCargoShortLabel(shipment)} was hit on route`,
    detail: `${patrol.ownerName || "NPC raider"} stole ${kept} cargo unit${kept === 1 ? "" : "s"}. Battle replay ${record.id} recorded.`,
    at: Date.now(),
  };
  return false;
}

function resolveShipmentRisk(shipment) {
  return deliverShipment(shipment);
}

function resolveMerchantTimedEncounter(shipment, encounterRoll) {
  const route = routeBetween(shipment.from, shipment.to);
  const encounter = encounterRoll.encounter;
  const wave = encounterRoll.wave || pickEncounterWave(encounter) || encounter;
  const raiderVehicle = simulatedRouteVehicle(route, wave.attackerClasses || ["interceptor", "runner"], { maxRarityRank: rarityIndex(wave.rarityCeiling) });
  const patrol = {
    id: nextMarketId("npc-encounter"),
    kind: "intercept",
    owner: "npc",
    ownerName: randomFrom(npcRouteNames.routejack),
    from: shipment.from,
    to: shipment.to,
    vehicle: raiderVehicle.name,
    loot: [],
    lootPolicy: "upgrade",
    capacity: Math.max(1, Number(raiderVehicle.capacity || 1)),
    status: "in-transit",
    events: [],
  };
  addShipmentEvent(shipment, `${patrol.ownerName} found the convoy: ${encounter.label}${wave?.label && wave.label !== encounter.label ? ` / ${wave.label}` : ""}. Hourly route chance ${Math.round(encounterRoll.chance * 100)}%.`);
  addShipmentEvent(patrol, `Found ${shipment.vehicle} carrying ${shipmentCargoShortLabel(shipment)}.`);
  state.dispatchNotice = {
    type: "warning",
    shipmentId: shipment.id,
    text: `${shipmentCargoShortLabel(shipment)} is under attack`,
    detail: `${wave?.label || encounter.label} intercepted ${shipment.vehicle} on ${routeLabel(shipment.from, shipment.to)}.`,
    at: Date.now(),
  };
  return resolveMerchantRoutejackBattle(shipment, patrol, { encounter, wave, continueOnSurvive: true });
}

function vehicleAttackScore(vehicle) {
  return Math.round(vehicleMph(vehicle) * 0.5 + (vehicle.durability || 0) * 1.6 + rarityOrder.indexOf(vehicle.rarity) * 6);
}

function vehicleDefenseScore(vehicle) {
  return Math.round((vehicle.durability || 0) * 2.2 + vehicleMph(vehicle) * 0.22 + rarityOrder.indexOf(vehicle.rarity) * 6);
}

function rarityRank(itemOrName) {
  const item = typeof itemOrName === "string" ? itemByName(itemOrName) : itemOrName;
  return rarityOrder.indexOf(item.rarity);
}

function boundedNumber(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function routeCombatStats(attackerVehicle, defenderVehicle, cargoItem, options = {}) {
  const attackerRole = roles[options.attackerRole] || roles.routejack;
  const defenderRole = roles[options.defenderRole] || roles.merchant;
  const attack = vehicleAttackScore(attackerVehicle)
    + (attackerRole.interceptBonus || 0)
    + Number(options.attackBonus || 0);
  const defense = vehicleDefenseScore(defenderVehicle)
    + rarityRank(cargoItem) * 5
    + (defenderRole.riskReduction || 0)
    + Number(options.defenseBonus || 0);
  const chance = Math.round(boundedNumber(45 + attack - defense, 8, 80));
  return {
    attack,
    defense,
    chance,
    spread: attack - defense,
    attackerRole: attackerRole.label,
    defenderRole: defenderRole.label,
  };
}

function routeCombatRoll(attackerVehicle, defenderVehicle, cargoItem, options = {}) {
  const stats = routeCombatStats(attackerVehicle, defenderVehicle, cargoItem, options);
  const roll = Math.random() * 100;
  const success = roll < stats.chance;
  const counterAttack = vehicleAttackScore(defenderVehicle);
  return {
    ...stats,
    roll,
    success,
    attackerDamage: success ? Math.max(0, Math.round(counterAttack * 0.025)) : Math.max(1, Math.round(counterAttack * 0.08)),
    defenderDamage: success ? Math.max(1, Math.round(stats.attack * 0.06 + rarityRank(cargoItem))) : 0,
  };
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function designedNpcTargetProfile(route, options = {}) {
  const miles = routeDistance(route);
  const routeBand = miles >= 180 ? 2 : miles >= 110 ? 1 : 0;
  const pressure = Math.max(0, Number(options.pressure || 0));
  const roll = Math.random();
  const rarityCeiling = Math.max(0, Math.min(4, routeBand + (roll > 0.52 ? 1 : 0) + (roll > 0.84 ? 1 : 0) + (roll > 0.97 ? 1 : 0)));
  const difficulty = Math.max(0, Math.min(4, routeBand + (roll > 0.64 ? 1 : 0) + (pressure > 1 ? 1 : 0)));
  return {
    difficulty,
    rarityCeiling,
    escortChance: Math.min(0.72, 0.14 + difficulty * 0.13),
    cargoUnits: Math.max(1, Math.min(5, 1 + Math.floor(difficulty / 2) + (roll > 0.76 ? 1 : 0))),
  };
}

function simulatedRouteTarget(route, options = {}) {
  const encounter = options.encounter || null;
  const wave = options.wave || pickEncounterWave(encounter) || encounter;
  const cargoPool = pvpTargetItems();
  const vehiclePool = allVehicleItems().filter((vehicle) => vehicleCanUseRoute(vehicle, route));
  const profile = designedNpcTargetProfile(route, options);
  const maxRank = wave ? rarityIndex(wave.rarityCeiling) : profile.rarityCeiling;
  const difficulty = wave ? wave.difficulty : profile.difficulty;
  const filteredCargo = cargoPool.filter((item) => rarityRank(item) <= maxRank);
  const preferredClasses = wave?.vehicleClasses?.length
    ? wave.vehicleClasses
    : (difficulty >= 2 ? ["freighter"] : ["freighter", "runner"]);
  const filteredVehicles = vehiclePool
    .filter((vehicle) => preferredClasses.includes(vehicle.vehicleClass) && rarityRank(vehicle) <= maxRank);
  const escortPool = vehiclePool
    .filter((vehicle) => vehicle.vehicleClass === "guardian" && rarityRank(vehicle) <= maxRank);
  const cargo = randomFrom(filteredCargo) || starterItems[0];
  const vehicle = randomFrom(filteredVehicles) || randomFrom(vehiclePool) || allVehicleItems()[0];
  const escortChance = wave ? wave.escortChance : profile.escortChance;
  const escort = Math.random() < escortChance ? (randomFrom(escortPool) || null) : null;
  const capacity = Math.max(1, Number(vehicle.capacity || 1));
  const cargoUnits = Math.max(1, Math.min(capacity, wave?.cargoUnits || profile.cargoUnits));
  return {
    cargo,
    vehicle,
    escort,
    cargoUnits,
    route,
    difficulty,
    label: wave?.label || encounter?.label || ["Local Courier", "Market Convoy", "Armored Haul", "Arcology Transfer", "Black Ledger Run"][difficulty] || "NPC Convoy",
    encounterId: encounter?.id || null,
  };
}

function simulatedRouteVehicle(route, preferredClasses = [], options = {}) {
  const vehiclePool = allVehicleItems().filter((vehicle) => vehicleCanUseRoute(vehicle, route));
  const preferred = preferredClasses.length
    ? vehiclePool.filter((vehicle) => preferredClasses.includes(vehicle.vehicleClass))
    : vehiclePool;
  const source = preferred.length ? preferred : vehiclePool;
  const rarityRoll = Math.random();
  const maxRarity = Number.isFinite(Number(options.maxRarityRank))
    ? Number(options.maxRarityRank)
    : rarityRoll > 0.97 ? 4 : rarityRoll > 0.88 ? 3 : rarityRoll > 0.68 ? 2 : rarityRoll > 0.38 ? 1 : 0;
  const filtered = source.filter((vehicle) => rarityRank(vehicle) <= maxRarity);
  return randomFrom(filtered) || source[0] || allVehicleItems()[0];
}

function addLootToRun(run, itemName) {
  run.loot = run.loot || [];
  const capacity = routeRunCapacity(run);
  if (run.loot.length < capacity) {
    run.loot.push(itemName);
    return { kept: true, replaced: null };
  }
  if (run.lootPolicy !== "upgrade") return { kept: false, replaced: null };
  const weakest = run.loot.reduce((lowest, name, index) => {
    const rank = rarityRank(name);
    if (rank < lowest.rank) return { name, index, rank };
    return lowest;
  }, { name: run.loot[0], index: 0, rank: rarityRank(run.loot[0]) });
  if (rarityRank(itemName) > weakest.rank) {
    run.loot[weakest.index] = itemName;
    return { kept: true, replaced: weakest.name };
  }
  return { kept: false, replaced: null };
}

function addLootToHold(loot, itemName, policy, capacity) {
  if (loot.length < capacity) {
    loot.push(itemName);
    return { kept: true, replaced: null };
  }
  if (policy !== "upgrade") return { kept: false, replaced: null };
  const weakest = loot.reduce((lowest, name, index) => {
    const rank = rarityRank(name);
    if (rank < lowest.rank) return { name, index, rank };
    return lowest;
  }, { name: loot[0], index: 0, rank: rarityRank(loot[0]) });
  if (rarityRank(itemName) > weakest.rank) {
    loot[weakest.index] = itemName;
    return { kept: true, replaced: weakest.name };
  }
  return { kept: false, replaced: null };
}

function routeModuleById(id) {
  return routeModuleCatalog.find((module) => module.id === id) || null;
}

function routeModulesByType(type) {
  return routeModuleCatalog.filter((module) => module.type === type);
}

function validBattleModuleId(id, type) {
  return id === "none" || routeModuleById(id)?.type === type;
}

function normalizeBattleModules(modules = {}) {
  const defaults = defaultBattleModules();
  return Object.fromEntries(battleUnitModuleSlots.map(({ key }) => {
    const saved = modules[key] || {};
    const fallback = defaults[key] || { standard1: "none", standard2: "none", overdrive: "none" };
    return [key, {
      standard1: validBattleModuleId(saved.standard1, "standard") ? saved.standard1 : fallback.standard1,
      standard2: validBattleModuleId(saved.standard2, "standard") ? saved.standard2 : fallback.standard2,
      overdrive: validBattleModuleId(saved.overdrive, "overdrive") ? saved.overdrive : fallback.overdrive,
    }];
  }));
}

function readBattleModulesFromControls(fallback = {}) {
  const modules = normalizeBattleModules(fallback);
  battleUnitModuleSlots.forEach(({ key }) => {
    modules[key] = {
      standard1: document.querySelector(`#battleModule-${key}-standard1`)?.value || modules[key].standard1,
      standard2: document.querySelector(`#battleModule-${key}-standard2`)?.value || modules[key].standard2,
      overdrive: document.querySelector(`#battleModule-${key}-overdrive`)?.value || modules[key].overdrive,
    };
  });
  return normalizeBattleModules(modules);
}

function battleModuleIdsFor(settings, unitKey) {
  const modules = normalizeBattleModules(settings?.modules || {});
  const loadout = modules[unitKey] || { standard1: "none", standard2: "none", overdrive: "none" };
  return [loadout.standard1, loadout.standard2, loadout.overdrive].filter((id) => id && id !== "none");
}

function battleModulesFor(settings, unitKey) {
  return battleModuleIdsFor(settings, unitKey).map(routeModuleById).filter(Boolean);
}

function battleModuleTotal(unit, key) {
  return (unit.modules || []).reduce((sum, module) => sum + Number(module[key] || 0), 0);
}

function battleModuleMax(unit, key) {
  return (unit.modules || []).reduce((max, module) => Math.max(max, Number(module[key] || 0)), 0);
}

function battleModuleFlag(unit, key) {
  return (unit.modules || []).some((module) => Boolean(module[key]));
}

function cloneBattleSettings(settings = {}) {
  const merged = { ...defaultBattleSim(), ...(settings || {}) };
  merged.modules = normalizeBattleModules(merged.modules);
  return JSON.parse(JSON.stringify(merged));
}

function battleRouteFor(settings = state.battleSim) {
  const fallback = allRoutePairs()[0];
  const from = settings?.from || fallback.from;
  const to = settings?.to || fallback.to;
  const route = routeTo(from, to);
  if (route) {
    return { from, to, route, label: `${districtById(from).name} to ${districtById(to).name}` };
  }
  return {
    from: fallback.from,
    to: fallback.to,
    route: fallback.route,
    label: `${districtById(fallback.from).name} to ${districtById(fallback.to).name}`,
  };
}

function normalizeBattleSettings(settings = {}) {
  const normalized = cloneBattleSettings(settings);
  const routeInfo = battleRouteFor(normalized);
  normalized.from = routeInfo.from;
  normalized.to = routeInfo.to;
  if (!allVehicleItems().some((item) => item.name === normalized.attackerVehicle)) normalized.attackerVehicle = defaultBattleSim().attackerVehicle;
  ["attackerSupport1", "attackerSupport2", "defenderEscort1", "defenderEscort2"].forEach((key) => {
    if (normalized[key] !== "none" && !allVehicleItems().some((item) => item.name === normalized[key])) normalized[key] = defaultBattleSim()[key] || "none";
  });
  if (!allVehicleItems().some((item) => item.name === normalized.defenderVehicle)) normalized.defenderVehicle = defaultBattleSim().defenderVehicle;
  if (!pvpTargetItems().some((item) => item.name === normalized.cargo)) normalized.cargo = defaultBattleSim().cargo;
  normalized.cargoUnits = Math.max(1, Math.min(battleCargoCapacity(normalized), Math.floor(Number(normalized.cargoUnits || 1))));
  normalized.attackerRole = "routejack";
  normalized.defenderRole = "merchant";
  normalized.lootPolicy = ["first", "upgrade"].includes(normalized.lootPolicy) ? normalized.lootPolicy : "upgrade";
  normalized.attackerTactic = Object.keys(battleAttackerTactics).includes(normalized.attackerTactic) ? normalized.attackerTactic : "snatch";
  normalized.defenderTactic = Object.keys(battleDefenderTactics).includes(normalized.defenderTactic) ? normalized.defenderTactic : "protect";
  normalized.failureMode = ["steal", "destroy"].includes(normalized.failureMode) ? normalized.failureMode : "steal";
  normalized.maxTicks = Math.max(30, Math.min(500, Math.floor(Number(normalized.maxTicks || 120))));
  normalized.runs = Math.max(1, Math.min(5000, Math.floor(Number(normalized.runs || 250))));
  normalized.attackBonus = Math.max(-100, Math.min(100, Number(normalized.attackBonus || 0)));
  normalized.defenseBonus = Math.max(-100, Math.min(100, Number(normalized.defenseBonus || 0)));
  normalized.attackerUnits = normalizeNpcUnitRefs(normalized.attackerUnits);
  normalized.defenderUnits = normalizeNpcUnitRefs(normalized.defenderUnits);
  normalized.replaceAttackers = Boolean(normalized.replaceAttackers && normalized.attackerUnits.length);
  normalized.replaceDefenders = Boolean(normalized.replaceDefenders && normalized.defenderUnits.length);
  normalized.modules = normalizeBattleModules(normalized.modules);
  return normalized;
}

function normalizeBattleBuilds(builds = {}) {
  const defaults = defaultBattleBuilds();
  return {
    a: {
      name: builds.a?.name || defaults.a.name,
      settings: normalizeBattleSettings(builds.a?.settings || defaults.a.settings),
      savedAt: builds.a?.savedAt || defaults.a.savedAt,
    },
    b: {
      name: builds.b?.name || defaults.b.name,
      settings: normalizeBattleSettings(builds.b?.settings || defaults.b.settings),
      savedAt: builds.b?.savedAt || defaults.b.savedAt,
    },
  };
}

function emptyBattleModules() {
  return {
    attackerVehicle: { standard1: "none", standard2: "none", overdrive: "none" },
    attackerSupport1: { standard1: "none", standard2: "none", overdrive: "none" },
    attackerSupport2: { standard1: "none", standard2: "none", overdrive: "none" },
    defenderVehicle: { standard1: "none", standard2: "none", overdrive: "none" },
    defenderEscort1: { standard1: "none", standard2: "none", overdrive: "none" },
    defenderEscort2: { standard1: "none", standard2: "none", overdrive: "none" },
  };
}

function battleCargoCapacity(settings = state.battleSim) {
  const vehicle = itemByName(settings?.defenderVehicle);
  return vehicle?.category === "vehicle" ? Math.max(1, Number(vehicle.capacity || 1)) : 1;
}

function battleCargoUnits(settings = state.battleSim) {
  return Math.max(1, Math.min(battleCargoCapacity(settings), Math.floor(Number(settings?.cargoUnits || 1))));
}

function battleCargoLabel(settings = state.battleSim) {
  return `${battleCargoUnits(settings)}x ${settings?.cargo || defaultBattleSim().cargo}`;
}

function battleRoleMatchupText(settings = state.battleSim) {
  if (settings.failureMode === "destroy") return "Route threat vs convoy: the threat tries to disable the cargo vehicle before it escapes.";
  return "Routejack vs NPC Merchant: the Routejack side tries to disable the cargo vehicle before it escapes.";
}

function routeBattleSettings({
  from,
  to,
  attackerVehicle,
  attackerSupport1 = "none",
  attackerSupport2 = "none",
  attackerUnits = [],
  replaceAttackers = false,
  defenderVehicle,
  defenderEscort1 = "none",
  defenderEscort2 = "none",
  defenderUnits = [],
  replaceDefenders = false,
  cargo,
  cargoUnits = 1,
  attackerRole = "routejack",
  defenderRole = "merchant",
  attackerTactic = "snatch",
  defenderTactic = "protect",
  lootPolicy = "upgrade",
  failureMode = "steal",
  maxTicks = 120,
} = {}) {
  return normalizeBattleSettings({
    ...defaultBattleSim(),
    from,
    to,
    attackerVehicle,
    attackerSupport1,
    attackerSupport2,
    attackerUnits,
    replaceAttackers,
    defenderVehicle,
    defenderEscort1,
    defenderEscort2,
    defenderUnits,
    replaceDefenders,
    cargo,
    cargoUnits,
    attackerRole,
    defenderRole,
    attackerTactic,
    defenderTactic,
    lootPolicy,
    failureMode,
    maxTicks,
    runs: 1,
    attackBonus: 0,
    defenseBonus: 0,
    modules: emptyBattleModules(),
  });
}

function updateBattleSimFromControls() {
  if (!state.battleSim) state.battleSim = defaultBattleSim();
  const routeValue = document.querySelector("#battleRoute")?.value || `${state.battleSim.from}>${state.battleSim.to}`;
  const [from, to] = routeValue.split(">");
  state.battleSim = {
    ...state.battleSim,
    from: routeTo(from, to) ? from : state.battleSim.from,
    to: routeTo(from, to) ? to : state.battleSim.to,
    attackerVehicle: document.querySelector("#battleAttackerVehicle")?.value || state.battleSim.attackerVehicle,
    attackerSupport1: document.querySelector("#battleAttackerSupport1")?.value || state.battleSim.attackerSupport1 || "none",
    attackerSupport2: document.querySelector("#battleAttackerSupport2")?.value || state.battleSim.attackerSupport2 || "none",
    defenderVehicle: document.querySelector("#battleDefenderVehicle")?.value || state.battleSim.defenderVehicle,
    defenderEscort1: document.querySelector("#battleDefenderEscort1")?.value || state.battleSim.defenderEscort1 || "none",
    defenderEscort2: document.querySelector("#battleDefenderEscort2")?.value || state.battleSim.defenderEscort2 || "none",
    cargo: document.querySelector("#battleCargo")?.value || state.battleSim.cargo,
    cargoUnits: Math.max(1, Math.floor(Number(document.querySelector("#battleCargoUnits")?.value || state.battleSim.cargoUnits || 1))),
    attackerRole: document.querySelector("#battleAttackerRole")?.value || state.battleSim.attackerRole,
    defenderRole: document.querySelector("#battleDefenderRole")?.value || state.battleSim.defenderRole,
    lootPolicy: document.querySelector("#battleLootPolicy")?.value || state.battleSim.lootPolicy,
    attackerTactic: document.querySelector("#battleAttackerTactic")?.value || state.battleSim.attackerTactic || "snatch",
    defenderTactic: document.querySelector("#battleDefenderTactic")?.value || state.battleSim.defenderTactic || "protect",
    maxTicks: Math.max(30, Math.min(500, Math.floor(Number(document.querySelector("#battleMaxTicks")?.value || state.battleSim.maxTicks || 120)))),
    runs: Math.max(1, Math.min(5000, Math.floor(Number(document.querySelector("#battleRuns")?.value || state.battleSim.runs)))),
    attackBonus: Math.max(-100, Math.min(100, Number(document.querySelector("#battleAttackBonus")?.value || 0))),
    defenseBonus: Math.max(-100, Math.min(100, Number(document.querySelector("#battleDefenseBonus")?.value || 0))),
    modules: readBattleModulesFromControls(state.battleSim.modules),
  };
}

function vehicleBattleStats(vehicle, role, settings = {}) {
  const rank = rarityRank(vehicle);
  const sideBonus = role === "raider" || role === "support" ? Number(settings.attackBonus || 0) : Number(settings.defenseBonus || 0);
  const roleIntegrity = role === "cargo" ? 36 : role === "escort" ? 18 : 0;
  const roleImpact = role === "raider" ? 5 : role === "support" ? -1 : role === "escort" ? -2 : role === "cargo" ? -5 : 0;
  const roleSpeed = role === "raider" ? 8 : role === "support" ? 3 : role === "cargo" ? -8 : 0;
  const stats = {
    maxHp: Math.max(24, Math.round(48 + Number(vehicle.durability || 0) * 8 + Number(vehicle.capacity || 1) * 9 + rank * 16 + roleIntegrity + Math.max(0, sideBonus) * 0.45)),
    speed: Math.max(8, Math.round(vehicleMph(vehicle) * 0.52 + 8 + rank * 2 + roleSpeed)),
    impact: Math.max(4, Math.round(vehicleAttackScore(vehicle) * 0.38 + 4 + roleImpact + sideBonus * 0.22)),
  };
  if (role === "cargo") {
    const load = battleCargoUnits(settings);
    stats.maxHp += load * 5;
    stats.speed = Math.max(6, stats.speed - Math.max(0, load - 1) * 3);
  }
  return stats;
}

function npcUnitFromRef(ref) {
  if (!ref) return null;
  if (typeof ref === "string") return npcCombatUnitById(ref);
  if (typeof ref === "object") {
    const base = npcCombatUnitById(ref.id) || {};
    return normalizeNpcCombatUnitCatalog([{ ...base, ...ref }])[0] || null;
  }
  return null;
}

function makeNpcBattleUnit(ref, side, fallbackRole = "support") {
  const unit = npcUnitFromRef(ref);
  if (!unit) return null;
  const role = ["raider", "support", "cargo", "escort"].includes(unit.role) ? unit.role : fallbackRole;
  return {
    id: `${side}-${role}-${unit.id}-${Math.random().toString(36).slice(2, 7)}`,
    side,
    role,
    name: unit.label,
    unitId: unit.id,
    rarity: unit.rarity,
    iconName: unit.iconName,
    maxHp: unit.maxHp,
    hp: unit.maxHp,
    speed: unit.speed,
    impact: unit.impact,
    initiative: 0,
    escape: 0,
    shield: 0,
    poison: 0,
    braveChance: role === "escort" ? unit.braveChance : 0,
    escapeDrag: unit.escapeDrag || 0,
    targetMode: unit.targetMode || "cargo",
    modules: [],
    npcUnit: unit,
  };
}

function makeNpcBattleUnits(refs = [], side, defaultRoles = []) {
  return normalizeNpcUnitRefs(refs)
    .map((ref, index) => makeNpcBattleUnit(ref, side, defaultRoles[index] || defaultRoles[defaultRoles.length - 1] || "support"))
    .filter(Boolean);
}

function makeBattleUnit(vehicleName, side, role, settings = {}, route = null, unitKey = "") {
  if (!vehicleName || vehicleName === "none") return null;
  const vehicle = itemByName(vehicleName);
  if (!vehicle || vehicle.category !== "vehicle") return null;
  const rank = rarityRank(vehicle);
  const stats = vehicleBattleStats(vehicle, role, settings);
  stats.maxHp = Math.max(1, Math.round(stats.maxHp));
  stats.speed = Math.max(1, Math.round(stats.speed));
  stats.impact = Math.max(1, Math.round(stats.impact));
  if (route && !vehicleCanUseRoute(vehicle, route)) {
    stats.maxHp = Math.round(stats.maxHp * 0.82);
    stats.speed = Math.round(stats.speed * 0.72);
    stats.impact = Math.round(stats.impact * 0.72);
  }
  return {
    id: `${side}-${role}-${vehicle.name}-${Math.random().toString(36).slice(2, 7)}`,
    side,
    role,
    name: vehicle.name,
    rarity: vehicle.rarity,
    iconName: vehicle.iconName,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    speed: stats.speed,
    impact: stats.impact,
    initiative: 0,
    escape: 0,
    shield: 0,
    poison: 0,
    braveChance: role === "escort" ? Math.min(65, Math.round(22 + rank * 7 + Number(vehicle.durability || 0))) : 0,
    escapeDrag: 0,
    targetMode: "cargo",
    modules: [],
    vehicle,
  };
}

function makeBattleTeams(settings, route = null) {
  const vehicleAttackers = [
    makeBattleUnit(settings.attackerVehicle, "attacker", "raider", settings, route, "attackerVehicle"),
    makeBattleUnit(settings.attackerSupport1, "attacker", "support", settings, route, "attackerSupport1"),
    makeBattleUnit(settings.attackerSupport2, "attacker", "support", settings, route, "attackerSupport2"),
  ].filter(Boolean);
  const customAttackers = makeNpcBattleUnits(settings.attackerUnits, "attacker", ["raider", "support", "support"]);
  const attackers = settings.replaceAttackers && customAttackers.length ? customAttackers : [...vehicleAttackers, ...customAttackers];
  const vehicleDefenders = [
    makeBattleUnit(settings.defenderVehicle, "defender", "cargo", settings, route, "defenderVehicle"),
    makeBattleUnit(settings.defenderEscort1, "defender", "escort", settings, route, "defenderEscort1"),
    makeBattleUnit(settings.defenderEscort2, "defender", "escort", settings, route, "defenderEscort2"),
  ].filter(Boolean);
  const customDefenders = makeNpcBattleUnits(settings.defenderUnits, "defender", ["cargo", "escort", "escort"]);
  const defenders = settings.replaceDefenders && customDefenders.length ? customDefenders : [...vehicleDefenders, ...customDefenders];
  if (defenders.length && !defenders.some((unit) => unit.role === "cargo")) defenders[0].role = "cargo";
  if (attackers.length && !attackers.some((unit) => unit.role === "raider")) attackers[0].role = "raider";
  if (settings.defenderTactic === "evade") {
    defenders.filter((unit) => unit.role === "cargo").forEach((unit) => {
      unit.speed += 10;
      unit.impact = Math.max(1, Math.round(unit.impact * 0.82));
    });
  }
  if (settings.attackerTactic === "scramble") attackers.forEach((unit) => { unit.speed += 6; });
  return { attackers, defenders };
}

function liveUnits(units, side = null) {
  return units.filter((unit) => unit.hp > 0 && (!side || unit.side === side));
}

function battleUnitLabel(unit) {
  if (unit.role === "cargo") return `${unit.name} cargo`;
  if (unit.role === "raider") return `${unit.name} lead`;
  if (unit.role === "support") return `${unit.name} support`;
  if (unit.role === "escort") return `${unit.name} escort`;
  return unit.name;
}

function battleUnitStatus(unit) {
  const parts = [
    `${Math.max(0, Math.round(unit.hp))}/${unit.maxHp} integrity`,
    `${Math.round(unit.initiative)}/100 initiative`,
  ];
  if (unit.escape > 0) parts.push(`${Math.min(100, Math.round(unit.escape))}% escape`);
  return parts.join(" | ");
}

function battleStatusSnapshot(units) {
  return units.map((unit) => ({
    label: battleUnitLabel(unit),
    side: unit.side,
    role: unit.role,
    rarity: unit.rarity,
    iconName: unit.iconName,
    disabled: unit.hp <= 0,
    text: battleUnitStatus(unit),
  }));
}

function battleReadyText(ready) {
  return ready.length
    ? ready.map((unit) => `${battleUnitLabel(unit)} (${Math.round(unit.initiative)} initiative)`).join(", ")
    : "No vehicles are ready yet.";
}

function selectBattleTarget(actor, units, settings) {
  const enemies = liveUnits(units, actor.side === "attacker" ? "defender" : "attacker");
  if (!enemies.length) return null;
  if (actor.targetMode === "highest-impact") return enemies.sort((a, b) => b.impact - a.impact || a.hp - b.hp)[0];
  if (actor.targetMode === "weakest") return enemies.sort((a, b) => a.hp - b.hp || b.impact - a.impact)[0];
  if (actor.side === "attacker") {
    const cargo = enemies.find((unit) => unit.role === "cargo");
    const escorts = enemies.filter((unit) => unit.role === "escort");
    if (settings.attackerTactic === "disable" && escorts.length) return escorts.sort((a, b) => a.hp - b.hp || b.impact - a.impact)[0];
    if (settings.attackerTactic === "scramble") return enemies.sort((a, b) => b.speed - a.speed || a.hp - b.hp)[0];
    return cargo || enemies[0];
  }
  if (settings.defenderTactic === "counter") {
    const raider = enemies.find((unit) => unit.role === "raider");
    if (raider) return raider;
  }
  return enemies.sort((a, b) => b.impact - a.impact || a.hp - b.hp)[0];
}

function tryBraveInterception(target, units, amount, log, tick) {
  if (!target || target.role !== "cargo") return target;
  const escorts = liveUnits(units, "defender").filter((unit) => unit.role === "escort" && unit.hp > target.hp);
  for (const escort of escorts) {
    const roll = Math.random() * 100;
    if (roll < escort.braveChance) {
      log.push({
        tick,
        type: "brave",
        text: `${battleUnitLabel(escort)} intercepted the hit meant for ${battleUnitLabel(target)}.`,
        detail: `Brave check succeeded: rolled ${Math.round(roll)} against ${escort.braveChance}%. The escort takes the attack so the cargo can keep building escape progress.`,
      });
      return escort;
    }
  }
  return target;
}

function applyBattleDamage(target, amount, source = null, units = [], log = [], tick = 0, options = {}) {
  const finalDamage = Math.max(0, Math.round(amount));
  target.hp = Math.max(0, target.hp - finalDamage);
  return { finalDamage, shieldBlocked: 0 };
}

function applyBattleAttackModules(actor, target, units, log, tick) {
  if (actor.hp <= 0 || target.hp <= 0) return;
  const initiativeDrain = battleModuleTotal(actor, "exhaustInitiative");
  const exhaustPenalty = battleModuleTotal(actor, "exhaustImpactDown");
  if (initiativeDrain || exhaustPenalty) {
    target.initiative = Math.max(0, target.initiative - initiativeDrain);
    target.exhaustPenalty = Math.max(target.exhaustPenalty || 0, exhaustPenalty);
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} exhausted ${battleUnitLabel(target)}${initiativeDrain ? ` (-${initiativeDrain} initiative)` : ""}${exhaustPenalty ? ` and weakened its next hit by ${exhaustPenalty}` : ""}.`,
      detail: "Exhaust slows the target's next action and can reduce its next attack.",
    });
  }
  const poisonStacks = battleModuleTotal(actor, "poisonStacks");
  if (poisonStacks) {
    target.poison = (target.poison || 0) + poisonStacks;
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} loaded ${battleUnitLabel(target)} with ${poisonStacks} corrosion stack${poisonStacks === 1 ? "" : "s"}.`,
      detail: "Corrosion ticks after the affected vehicle acts, then fades by one stack.",
    });
  }
  const repair = battleModuleTotal(actor, "healAllyOnAttack");
  if (repair) {
    const repairModule = (actor.modules || []).find((module) => module.healAllyOnAttack);
    const ally = liveUnits(units, actor.side)
      .filter((unit) => unit.hp < unit.maxHp)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    if (ally) {
      const healed = Math.min(repair, ally.maxHp - ally.hp);
      ally.hp += healed;
      log.push({
        tick,
        type: "special",
        text: `${battleUnitLabel(actor)}'s ${repairModule?.label || "repair module"} repaired ${battleUnitLabel(ally)} for ${healed}.`,
        detail: "Repair modules look for the most damaged ally after this vehicle attacks.",
      });
    }
  }
}

function battleTargetReason(actor, target, actualTarget, settings) {
  if (actor.side === "attacker" && settings.attackerTactic === "disable") return "Disable Escorts is selected, so attackers try to remove escorts before going after cargo.";
  if (actor.side === "attacker" && settings.attackerTactic === "scramble") return "Target Fastest is selected, so attackers pressure the fastest opposing unit.";
  if (actor.side === "attacker") return "Hit Cargo First is selected, so attackers focus the cargo vehicle when they can.";
  if (settings.defenderTactic === "counter") return "Counter Lead is selected, so the defending party tries to disable the attacker lead.";
  return "The defending party targets the highest-impact route threat.";
}

function battleBasicAttack(actor, units, settings, log, tick) {
  const target = selectBattleTarget(actor, units, settings);
  if (!target) return;
  const actualTarget = actor.side === "attacker" ? tryBraveInterception(target, units, actor.impact, log, tick) : target;
  let damage = actor.side === "defender" && settings.defenderTactic === "evade" ? Math.round(actor.impact * 0.9) : actor.impact;
  const result = applyBattleDamage(actualTarget, damage, actor, units, log, tick);
  log.push({
    tick,
    type: "attack",
    text: `${battleUnitLabel(actor)} attacked ${battleUnitLabel(actualTarget)} for ${result.finalDamage} integrity damage.`,
    detail: `${battleTargetReason(actor, target, actualTarget, settings)} ${battleUnitLabel(actualTarget)} is now at ${Math.max(0, Math.round(actualTarget.hp))}/${actualTarget.maxHp} integrity.`,
  });
  if (actualTarget.hp <= 0) log.push({ tick, type: "disabled", text: `${battleUnitLabel(actualTarget)} was disabled.` });
}

function battleModuleSpecial(actor, units, settings, log, tick) {
  const module = (actor.modules || []).find((entry) => entry.type === "overdrive");
  if (!module) return false;
  if (module.teamImpactBuff || module.teamShield) {
    const allies = liveUnits(units, actor.side);
    allies.forEach((ally) => {
      ally.impact += Number(module.teamImpactBuff || 0);
      ally.shield += Number(module.teamShield || 0);
    });
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} fired ${module.label}: allies gained +${module.teamImpactBuff || 0} impact and +${module.teamShield || 0} shield.`,
      detail: "This overdrive is a party-wide rally: it makes the next exchanges more dangerous for enemies and safer for allies.",
    });
    return true;
  }
  if (module.breach) {
    const cargo = actor.side === "attacker"
      ? liveUnits(units, "defender").find((unit) => unit.role === "cargo") || selectBattleTarget(actor, units, settings)
      : selectBattleTarget(actor, units, settings);
    if (!cargo) return false;
    const damage = Math.round(actor.impact * 2.15);
    const result = applyBattleDamage(cargo, damage, actor, units, log, tick);
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} pierced straight into ${battleUnitLabel(cargo)} with ${module.label} for ${result.finalDamage}.`,
      detail: "Cargo Strike Overdrive ignores normal targeting pressure and goes straight for cargo when used by an attacker lead.",
    });
    if (cargo.hp <= 0) log.push({ tick, type: "disabled", text: `${battleUnitLabel(cargo)} was disabled.` });
    return true;
  }
  if (module.escapeBonus || module.shieldBonus) {
    const gain = Math.round(22 + actor.speed * 0.28 + (settings.defenderTactic === "evade" ? 14 : 0) + Number(module.escapeBonus || 0));
    const shield = Math.round(actor.impact * 0.55 + Number(module.shieldBonus || 0));
    actor.escape += gain;
    actor.shield += shield;
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} used ${module.label}: +${gain} escape, +${shield} shield.`,
      detail: "Cargo escapes at 100%. Shield protects it while the route timer keeps moving.",
    });
    return true;
  }
  if (module.slowAll || module.initiativeDownAll) {
    const enemies = liveUnits(units, actor.side === "attacker" ? "defender" : "attacker");
    enemies.forEach((target) => {
      target.speed = Math.max(4, target.speed - Number(module.slowAll || 0));
      target.initiative = Math.max(0, target.initiative - Number(module.initiativeDownAll || 0));
    });
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} cast ${module.label}: enemies lost ${module.slowAll || 0} speed and ${module.initiativeDownAll || 0} initiative.`,
      detail: "Lockdown effects delay enemy turns, buying time for cargo to escape or for attackers to finish a steal.",
    });
    return true;
  }
  return false;
}

function battleSpecial(actor, units, settings, log, tick) {
  if (battleModuleSpecial(actor, units, settings, log, tick)) return;
  if (actor.role === "raider") {
    const cargo = liveUnits(units, "defender").find((unit) => unit.role === "cargo") || selectBattleTarget(actor, units, settings);
    const actualTarget = tryBraveInterception(cargo, units, actor.impact, log, tick);
    const damage = Math.round(actor.impact * (settings.attackerTactic === "snatch" ? 1.8 : 1.45));
    const result = applyBattleDamage(actualTarget, damage, actor, units, log, tick);
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} fired Breach Spike into ${battleUnitLabel(actualTarget)} for ${result.finalDamage}.`,
      detail: "Attacker lead specials are burst damage. If cargo integrity hits 0, the cargo is stolen or recovered, depending on the matchup.",
    });
    if (actualTarget.hp <= 0) log.push({ tick, type: "disabled", text: `${battleUnitLabel(actualTarget)} was disabled.` });
    return;
  }
  if (actor.role === "support") {
    const enemies = liveUnits(units, "defender");
    enemies.forEach((target) => {
      const result = applyBattleDamage(target, Math.max(1, Math.round(actor.impact * 0.62)), actor, units, log, tick);
      target.initiative = Math.max(0, target.initiative - 18);
      log.push({
        tick,
        type: "special",
        text: `${battleUnitLabel(actor)} pulsed ${battleUnitLabel(target)} for ${result.finalDamage} and shaved initiative.`,
        detail: "Support specials are control moves: lower damage, but they delay the defending side.",
      });
      if (target.hp <= 0) log.push({ tick, type: "disabled", text: `${battleUnitLabel(target)} was disabled.` });
    });
    return;
  }
  if (actor.role === "cargo") {
    const gain = Math.round(22 + actor.speed * 0.28 + (settings.defenderTactic === "evade" ? 14 : 0));
    actor.escape += gain;
    actor.shield += Math.round(actor.impact * 0.55);
    log.push({
      tick,
      type: "special",
      text: `${battleUnitLabel(actor)} used Evasive Burn: +${gain} escape, +${Math.round(actor.impact * 0.55)} shield.`,
      detail: "Cargo is not trying to win a duel. It wins by reaching 100% escape or surviving the route timer.",
    });
    return;
  }
  const allies = liveUnits(units, "defender").sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
  const target = allies[0] || actor;
  const shield = Math.round(actor.impact * 1.45);
  target.shield += shield;
  log.push({
    tick,
    type: "special",
    text: `${battleUnitLabel(actor)} raised Brave Wall on ${battleUnitLabel(target)} for ${shield} shield.`,
    detail: "Escort specials reinforce the weakest defending unit so it can survive another exchange.",
  });
}

function applyBattlePoison(actor, log, tick) {
  if (actor.hp <= 0 || !actor.poison) return;
  const damage = Math.min(actor.hp, actor.poison);
  actor.hp = Math.max(0, actor.hp - damage);
  actor.poison = Math.max(0, actor.poison - 1);
  log.push({
    tick,
    type: "special",
    text: `${battleUnitLabel(actor)} took ${damage} corrosion damage.`,
    detail: `Corrosion remains at ${actor.poison} stack${actor.poison === 1 ? "" : "s"} after this tick.`,
  });
  if (actor.hp <= 0) log.push({ tick, type: "disabled", text: `${battleUnitLabel(actor)} was disabled.` });
}

function battleCargoEscapeAction(actor, units, settings, log, tick) {
  const loadPenalty = Math.max(0, battleCargoUnits(settings) - 1) * 2;
  const tacticBonus = settings.defenderTactic === "evade" ? 8 : 0;
  const dragPenalty = liveUnits(units, "attacker").reduce((sum, unit) => sum + Number(unit.escapeDrag || 0), 0);
  const gain = Math.max(3, Math.round(8 + actor.speed * 0.3 + tacticBonus - loadPenalty - dragPenalty));
  actor.escape += gain;
  log.push({
    tick,
    type: "escape",
    text: `${battleUnitLabel(actor)} pushed for the exit and gained ${gain}% escape progress.`,
    detail: `Cargo escape is the defender's timer. At 100%, the shipment gets away with ${battleCargoLabel(settings)}.${dragPenalty ? ` Route pressure reduced this escape push by ${dragPenalty}.` : ""}`,
  });
}

function battleAct(actor, units, settings, log, tick) {
  if (actor.hp <= 0) return;
  if (actor.role === "cargo") battleCargoEscapeAction(actor, units, settings, log, tick);
  else battleBasicAttack(actor, units, settings, log, tick);
}

function applyBattleStartModules(units, settings, log) {
  liveUnits(units).forEach((unit) => {
    if (battleModuleFlag(unit, "forge")) {
      const forgeModule = (unit.modules || []).find((module) => module.forge);
      const target = liveUnits(units, unit.side).sort((a, b) => a.impact - b.impact || a.hp - b.hp)[0] || unit;
      target.maxHp += 10;
      target.hp += 10;
      target.speed += 2;
      target.impact += 2;
      log.push({
        tick: 0,
        type: "special",
        text: `${battleUnitLabel(unit)}'s ${forgeModule?.label || "Stat Buff Overdrive"} tuned ${battleUnitLabel(target)}: +10 integrity, +2 speed, +2 impact.`,
        detail: "Stat Buff Overdrive upgrades one ally for this run.",
      });
    }
    if (battleModuleFlag(unit, "blackBox")) {
      const blackBoxModule = (unit.modules || []).find((module) => module.blackBox);
      const allies = liveUnits(units, unit.side);
      const enemies = liveUnits(units, unit.side === "attacker" ? "defender" : "attacker");
      const roll = Math.floor(Math.random() * 4);
      if (roll === 0) {
        allies.forEach((ally) => { ally.shield += 14; });
        log.push({ tick: 0, type: "special", text: `${battleUnitLabel(unit)}'s ${blackBoxModule?.label || "Random Effect Overdrive"} rolled shield: allies gained +14 shield.`, detail: "Random Effect Overdrive rolls one start-of-battle effect." });
      } else if (roll === 1) {
        allies.forEach((ally) => { ally.speed += 4; });
        log.push({ tick: 0, type: "special", text: `${battleUnitLabel(unit)}'s ${blackBoxModule?.label || "Random Effect Overdrive"} rolled speed: allies gained +4 speed.`, detail: "Random Effect Overdrive rolls one start-of-battle effect." });
      } else if (roll === 2) {
        allies.forEach((ally) => { ally.impact += 3; });
        log.push({ tick: 0, type: "special", text: `${battleUnitLabel(unit)}'s ${blackBoxModule?.label || "Random Effect Overdrive"} rolled impact: allies gained +3 impact.`, detail: "Random Effect Overdrive rolls one start-of-battle effect." });
      } else {
        enemies.forEach((enemy) => {
          enemy.poison += 3;
          enemy.initiative = Math.max(0, enemy.initiative - 10);
        });
        log.push({ tick: 0, type: "special", text: `${battleUnitLabel(unit)}'s ${blackBoxModule?.label || "Random Effect Overdrive"} rolled corrosion: enemies gained 3 corrosion stacks.`, detail: "Random Effect Overdrive rolls one start-of-battle effect." });
      }
    }
  });
}

function simulateAutoBattleRun(settings, route) {
  const { attackers, defenders } = makeBattleTeams(settings, route);
  const units = [...attackers, ...defenders];
  const cargo = defenders.find((unit) => unit.role === "cargo");
  const log = [{
    tick: 0,
    type: "start",
    text: `${roles[settings.attackerRole]?.label || "Attacker"} party engaged ${roles[settings.defenderRole]?.label || "Defender"} party: ${battleRoleMatchupText(settings)}`,
    detail: "Fundamental combat layer: each tick adds Speed to initiative. A vehicle acts at 100 initiative, then spends 100. Cargo vehicles use their turn to build escape progress; other vehicles attack.",
    status: battleStatusSnapshot(units),
  }];
  let outcome = "timeout";
  let tick = 0;
  while (tick < settings.maxTicks) {
    tick += 1;
    liveUnits(units).forEach((unit) => { unit.initiative += unit.speed; });
    const ready = liveUnits(units).filter((unit) => unit.initiative >= 100).sort((a, b) => b.initiative - a.initiative || b.speed - a.speed);
    if (ready.length) {
      log.push({
        tick,
        type: "turn",
        text: `Action turn: ${battleReadyText(ready)} reached 100 initiative.`,
        detail: "Vehicles act from highest initiative to lowest. Overflow initiative carries into future turns.",
        status: battleStatusSnapshot(units),
      });
    }
    for (const actor of ready) {
      if (actor.hp <= 0 || actor.initiative < 100) continue;
      actor.initiative -= 100;
      battleAct(actor, units, settings, log, tick);
      log.push({
        tick,
        type: "status",
        text: `Status after ${battleUnitLabel(actor)} acted.`,
        detail: "Integrity 0 disables a vehicle. Cargo wins at 100% escape; attackers win if cargo integrity reaches 0.",
        status: battleStatusSnapshot(units),
      });
      if (!cargo || cargo.hp <= 0) {
        outcome = "stolen";
        log.push({ tick, type: "outcome", text: `${battleCargoLabel(settings)} was taken after the cargo vehicle was disabled.`, status: battleStatusSnapshot(units) });
        return { outcome, tick, units, log, cargoHp: 0, cargoEscape: cargo?.escape || 0 };
      }
      if (cargo.escape >= 100) {
        outcome = "escaped";
        log.push({ tick, type: "outcome", text: `${battleUnitLabel(cargo)} escaped the route with ${battleCargoLabel(settings)}.`, status: battleStatusSnapshot(units) });
        return { outcome, tick, units, log, cargoHp: cargo.hp, cargoEscape: cargo.escape };
      }
      if (!liveUnits(units, "attacker").length) {
        outcome = "defended";
        log.push({ tick, type: "outcome", text: `The defending party disabled every attacker and kept ${battleCargoLabel(settings)}.`, status: battleStatusSnapshot(units) });
        return { outcome, tick, units, log, cargoHp: cargo.hp, cargoEscape: cargo.escape };
      }
    }
  }
  const finalCargo = cargo || { hp: 0, escape: 0 };
  outcome = finalCargo.hp > 0 ? "defended" : "stolen";
  log.push({
    tick,
    type: "outcome",
    text: outcome === "stolen" ? `${battleCargoLabel(settings)} was taken at the route limit.` : `The defending party survived the route timer with ${battleCargoLabel(settings)}.`,
    status: battleStatusSnapshot(units),
  });
  return { outcome, tick, units, log, cargoHp: finalCargo.hp, cargoEscape: finalCargo.escape };
}

function battleOutcomeLabel(outcome) {
  return {
    stolen: "Cargo Taken",
    destroyed: "Convoy Disabled",
    defended: "Cargo Defended",
    escaped: "Cargo Escaped",
    timeout: "Timed Out",
  }[outcome] || outcome;
}

function summarizeBattleRuns(settings, routeInfo, route, runResults) {
  const outcomeCounts = { stolen: 0, destroyed: 0, defended: 0, escaped: 0, timeout: 0 };
  const unitSurvival = {};
  let totalTicks = 0;
  let totalCargoHp = 0;
  let totalCargoEscape = 0;
  runResults.forEach((run) => {
    outcomeCounts[run.outcome] = (outcomeCounts[run.outcome] || 0) + 1;
    totalTicks += run.tick;
    totalCargoHp += Math.max(0, run.cargoHp || 0);
    totalCargoEscape += Math.min(100, Math.max(0, run.cargoEscape || 0));
    run.units.forEach((unit) => {
      const key = `${unit.side}-${unit.role}-${unit.name}`;
      if (!unitSurvival[key]) unitSurvival[key] = { label: unit.name, alive: 0, total: 0, side: unit.side, role: unit.role, rarity: unit.rarity, iconName: unit.iconName };
      unitSurvival[key].total += 1;
      if (unit.hp > 0) unitSurvival[key].alive += 1;
    });
  });
  const sample = runResults[runResults.length - 1];
  return {
    at: new Date().toLocaleTimeString(),
    engine: "auto-battler",
    route: routeInfo.label,
    routeKind: routeKind(route),
    routeMiles: routeDistance(route),
    cargo: battleCargoLabel(settings),
    cargoUnits: battleCargoUnits(settings),
    runs: settings.runs,
    maxTicks: settings.maxTicks,
    outcomeCounts,
    stealRate: (outcomeCounts.stolen + outcomeCounts.destroyed) / settings.runs,
    defendRate: (outcomeCounts.defended + outcomeCounts.escaped) / settings.runs,
    escapeRate: outcomeCounts.escaped / settings.runs,
    averageTicks: totalTicks / settings.runs,
    averageCargoHp: totalCargoHp / settings.runs,
    averageCargoEscape: totalCargoEscape / settings.runs,
    unitSurvival,
    sample,
    settings,
  };
}

function runBattleSimulation(runs) {
  updateBattleSimFromControls();
  const settings = normalizeBattleSettings({ ...state.battleSim, runs });
  settings.runs = Math.max(1, Math.min(5000, Math.floor(Number(settings.runs || 1))));
  state.battleSim = cloneBattleSettings(settings);
  const routeInfo = selectedBattleRoute();
  const route = routeInfo.route;
  const runResults = Array.from({ length: settings.runs }, () => simulateAutoBattleRun(settings, route));
  state.battleSimResult = summarizeBattleRuns(settings, routeInfo, route, runResults);
}

function startLiveBattleReplay() {
  updateBattleSimFromControls();
  const settings = normalizeBattleSettings({ ...state.battleSim, runs: 1 });
  settings.runs = 1;
  state.battleSim = cloneBattleSettings(settings);
  const routeInfo = selectedBattleRoute();
  const run = simulateAutoBattleRun(settings, routeInfo.route);
  state.battleSimResult = summarizeBattleRuns(settings, routeInfo, routeInfo.route, [run]);
  state.battleReplay = {
    engine: "live-battle-replay",
    at: new Date().toLocaleTimeString(),
    route: routeInfo.label,
    routeKind: routeKind(routeInfo.route),
    routeMiles: routeDistance(routeInfo.route),
    cargo: battleCargoLabel(settings),
    matchup: battleRoleMatchupText(settings),
    outcome: run.outcome,
    entries: run.log,
    frames: buildBattleReplayFrames(run.log),
    index: 0,
    playing: true,
    delayMs: 2000,
    lastStepAt: Date.now(),
    settings: cloneBattleSettings(settings),
  };
}

function buildBattleReplayFrames(entries = []) {
  const frames = [];
  let pending = [];
  let latestStatus = null;
  let turn = 0;
  const flushSetup = () => {
    if (!pending.length || frames.length) return;
    frames.push({
      tick: pending[0].tick,
      turn: 0,
      title: "Route Battle - Setup",
      events: pending,
      status: latestStatus || pending.find((entry) => entry.status)?.status || [],
      type: "start",
    });
    pending = [];
  };
  entries.forEach((entry) => {
    if (entry.status) latestStatus = entry.status;
    if (entry.type === "turn") flushSetup();
    if (entry.type === "status") {
      turn += 1;
      const actor = entry.text.match(/^Status after (.*?) acted\./)?.[1] || `Action ${turn}`;
      frames.push({
        tick: entry.tick,
        turn,
        title: `Route Battle - Turn ${turn} - ${actor}`,
        events: pending.length ? pending : [entry],
        status: entry.status || latestStatus || [],
        type: "turn",
      });
      pending = [];
      return;
    }
    if (entry.type === "outcome") {
      frames.push({
        tick: entry.tick,
        turn: turn + 1,
        title: `Route Battle - ${battleOutcomeLabel(entry.outcome || "Outcome")}`,
        events: [entry],
        status: entry.status || latestStatus || [],
        type: "outcome",
      });
      pending = [];
      return;
    }
    pending.push(entry);
  });
  if (pending.length) {
    frames.push({
      tick: pending[0].tick,
      turn: turn || 0,
      title: turn ? `Route Battle - Tick ${pending[0].tick}` : "Route Battle - Setup",
      events: pending,
      status: latestStatus || pending.find((entry) => entry.status)?.status || [],
      type: pending.some((entry) => entry.type === "start") ? "start" : "turn",
    });
  }
  return frames;
}

function battleReplayFrames(replay = state.battleReplay) {
  if (!replay) return [];
  if (!Array.isArray(replay.frames) || !replay.frames.length) replay.frames = buildBattleReplayFrames(replay.entries || []);
  return replay.frames;
}

function battleReplayEntry(replay = state.battleReplay) {
  const frames = battleReplayFrames(replay);
  if (!frames.length) return null;
  return frames[Math.max(0, Math.min(replay.index || 0, frames.length - 1))];
}

function stepBattleReplay(amount = 1) {
  const replay = state.battleReplay;
  const frames = battleReplayFrames(replay);
  if (!frames.length) return false;
  const nextIndex = Math.max(0, Math.min(frames.length - 1, (replay.index || 0) + amount));
  const changed = nextIndex !== replay.index;
  replay.index = nextIndex;
  replay.lastStepAt = Date.now();
  if (replay.index >= frames.length - 1) replay.playing = false;
  return changed;
}

function processBattleReplay(now = Date.now()) {
  const replay = state.battleReplay;
  const frames = battleReplayFrames(replay);
  if (!replay?.playing || !frames.length) return false;
  if (replay.index >= frames.length - 1) {
    replay.playing = false;
    return true;
  }
  if (now - replay.lastStepAt < replay.delayMs) return false;
  return stepBattleReplay(1);
}

function recordRouteBattle({ kind, title, from, to, settings, route, run, relatedShipments = [] }) {
  const record = {
    id: nextMarketId("battle"),
    kind,
    title,
    from,
    to,
    route: routeLabel(from, to),
    routeKind: routeKind(route),
    routeMiles: routeDistance(route),
    cargo: battleCargoLabel(settings),
    matchup: battleRoleMatchupText(settings),
    outcome: run.outcome,
    entries: run.log,
    frames: buildBattleReplayFrames(run.log),
    settings: cloneBattleSettings(settings),
    relatedShipments: relatedShipments.map((shipment) => shipment.id),
    createdAt: Date.now(),
    at: new Date().toLocaleTimeString(),
  };
  state.routeBattles.unshift(record);
  state.routeBattles = state.routeBattles.slice(0, 30);
  relatedShipments.forEach((shipment) => {
    shipment.battleId = record.id;
  });
  if (state.activeView === "shipments") {
    state.selectedRouteBattleId = record.id;
    state.battleReplay = replayFromRouteBattle(record);
  }
  return record;
}

function routeBattleById(id) {
  return state.routeBattles.find((battle) => battle.id === id) || null;
}

function replayFromRouteBattle(record) {
  return {
    engine: "live-battle-replay",
    source: "route-battle",
    battleId: record.id,
    at: record.at,
    route: record.route,
    routeKind: record.routeKind,
    routeMiles: record.routeMiles,
    cargo: record.cargo,
    matchup: record.matchup,
    outcome: record.outcome,
    entries: record.entries,
    frames: record.frames || buildBattleReplayFrames(record.entries),
    index: 0,
    playing: true,
    delayMs: 2000,
    lastStepAt: Date.now(),
    settings: cloneBattleSettings(record.settings),
  };
}

function viewRouteBattle(id) {
  const record = routeBattleById(id);
  if (!record) return;
  state.selectedRouteBattleId = id;
  state.battleReplay = replayFromRouteBattle(record);
  state.activeView = "shipments";
  render();
}

function battleBuildSummary(build) {
  const settings = normalizeBattleSettings(build?.settings || defaultBattleSim());
  const routeInfo = battleRouteFor(settings);
  const attackerUnits = [settings.attackerVehicle, settings.attackerSupport1, settings.attackerSupport2].filter((name) => name && name !== "none");
  const defenderUnits = [settings.defenderVehicle, settings.defenderEscort1, settings.defenderEscort2].filter((name) => name && name !== "none");
  return {
    route: routeInfo.label,
    cargo: battleCargoLabel(settings),
    attackers: attackerUnits.join(", "),
    defenders: defenderUnits.join(", "),
    tactics: `${battleAttackerTactics[settings.attackerTactic]} vs ${battleDefenderTactics[settings.defenderTactic]}`,
  };
}

function saveBattleBuild(slot) {
  updateBattleSimFromControls();
  if (!state.battleBuilds) state.battleBuilds = normalizeBattleBuilds();
  const key = slot === "b" ? "b" : "a";
  state.battleBuilds[key] = {
    name: key === "a" ? "Build A" : "Build B",
    settings: cloneBattleSettings(state.battleSim),
    savedAt: new Date().toLocaleTimeString(),
  };
  addFeed("Admin", `${state.battleBuilds[key].name} saved`, "data");
}

function runBattleBuildComparison() {
  updateBattleSimFromControls();
  state.battleBuilds = normalizeBattleBuilds(state.battleBuilds);
  const runs = Math.max(1, Math.min(5000, Math.floor(Number(document.querySelector("#battleRuns")?.value || state.battleSim?.runs || 250))));
  const results = ["a", "b"].map((slot) => {
    const build = state.battleBuilds[slot];
    const settings = normalizeBattleSettings({ ...build.settings, runs });
    const routeInfo = battleRouteFor(settings);
    const runResults = Array.from({ length: runs }, () => simulateAutoBattleRun(settings, routeInfo.route));
    return {
      slot,
      name: build.name,
      savedAt: build.savedAt,
      summary: battleBuildSummary(build),
      result: summarizeBattleRuns(settings, routeInfo, routeInfo.route, runResults),
    };
  });
  state.battleComparisonResult = {
    engine: "auto-battler-comparison",
    at: new Date().toLocaleTimeString(),
    runs,
    builds: results,
  };
}

function resolveRoutejackNpcEncounter(run, encounterRoll) {
  const route = routeBetween(run.from, run.to) || { to: run.to, miles: run.routeMiles, hours: run.routeHours || 1 };
  run.loot = run.loot || [];
  run.encounters = run.encounters || [];
  const encounter = encounterRoll.encounter;
  const wave = encounterRoll.wave || pickEncounterWave(encounter) || encounter;
  const target = simulatedRouteTarget(route, { pressure: run.encounters.length + run.loot.length, encounter, wave });
  const settings = routeBattleSettings({
    from: run.from,
    to: run.to,
    attackerVehicle: run.vehicle,
    attackerSupport1: run.support1 || "none",
    attackerSupport2: run.support2 || "none",
    defenderVehicle: target.vehicle.name,
    defenderEscort1: target.escort?.name || "none",
    defenderUnits: wave?.defenderUnits || [],
    replaceDefenders: Boolean(wave?.defenderUnits?.length),
    cargo: target.cargo.name,
    cargoUnits: target.cargoUnits || 1,
    attackerRole: "routejack",
    defenderRole: "merchant",
    attackerTactic: run.tactic || "snatch",
    defenderTactic: target.escort ? "protect" : "evade",
    lootPolicy: run.lootPolicy || "upgrade",
  });
  const battleRun = simulateAutoBattleRun(settings, route);
  const record = recordRouteBattle({
    kind: "routejack-npc",
    title: `Routejack raid: ${target.label} carrying ${target.cargo.name}`,
    from: run.from,
    to: run.to,
    settings,
    route,
    run: battleRun,
    relatedShipments: [run],
  });
  run.encounters.push({
    cargo: target.cargo.name,
    vehicle: target.vehicle.name,
    escort: target.escort?.name || null,
    target: target.label,
    cargoUnits: target.cargoUnits || 1,
    success: battleRun.outcome === "stolen",
    battleId: record.id,
  });
  if (battleRun.outcome === "stolen") {
    let keptFromTarget = 0;
    Array.from({ length: target.cargoUnits || 1 }).forEach(() => {
      const result = addLootToRun(run, target.cargo.name);
      if (result.kept && result.replaced) addShipmentEvent(run, `Jettisoned ${result.replaced} to keep ${target.cargo.name}.`);
      if (result.kept) {
        keptFromTarget += 1;
        recordStolenGood(target.cargo.name, 1, run.from, run.to, state.player, record.id, { interceptedVehicle: target.vehicle.name, owner: "NPC Merchant" });
      }
    });
    addShipmentEvent(run, `Found ${target.label} and kept ${keptFromTarget}/${target.cargoUnits || 1} cargo unit${(target.cargoUnits || 1) === 1 ? "" : "s"}. Battle replay ${record.id} recorded.`);
    state.dispatchNotice = {
      type: "success",
      shipmentId: run.id,
      text: `Routejack convoy hit ${target.label}`,
      detail: `${keptFromTarget ? `Kept ${keptFromTarget} cargo` : "No cargo kept"} on ${routeLabel(run.from, run.to)}.`,
      at: Date.now(),
    };
    if (!routeRunHasLootRoom(run) || run.encounters.length >= Number(run.encounterLimit || 1)) {
      run.arrivesAt = Date.now();
    }
    return true;
  }
  run.forcedOffRoute = true;
  run.arrivesAt = Date.now();
  addShipmentEvent(run, `${target.label} repelled the raid. Battle replay ${record.id} recorded.`);
  state.dispatchNotice = {
    type: "warning",
    shipmentId: run.id,
    text: `Routejack convoy was forced off route`,
    detail: `${target.label} repelled the raid on ${routeLabel(run.from, run.to)}.`,
    at: Date.now(),
  };
  return true;
}

function resolveInterceptRun(run) {
  run.loot = run.loot || [];
  run.encounters = run.encounters || [];
  const capacity = routeRunCapacity(run);
  routeRunVehicles(run).forEach((vehicleName) => addItem(vehicleName, 1, run.from, true));
  run.resolvedAt = Date.now();
  run.encounteredCargo = run.encounters[0]?.cargo || "none";
  if (run.loot.length) {
    run.status = "intercepted";
    run.loot.forEach((itemName) => {
      addItem(itemName, 1, run.from, true);
    });
    addShipmentEvent(run, `Returned with ${run.loot.length}/${capacity} stolen item${run.loot.length === 1 ? "" : "s"} from ${run.encounters.length} encounter${run.encounters.length === 1 ? "" : "s"}${run.forcedOffRoute ? " before being forced off route" : ""}.`);
    addPvpLog(`Routejack raid returned from ${districtById(run.from).name} to ${districtById(run.to).name} with ${run.loot.length} stolen item${run.loot.length === 1 ? "" : "s"}.`);
    addFeed(state.player, `loot x${run.loot.length}`, itemByName(run.loot[0]).iconName);
    return true;
  }
  run.status = "failed";
  const fine = Math.max(1, Math.round((run.routeHours || 1) * 18 + capacity * 4));
  state.credits = Math.max(0, state.credits - fine);
  addShipmentEvent(run, `Returned empty after ${run.encounters.length || 1} raid attempt${run.encounters.length === 1 ? "" : "s"}. Heat cost ${formatCredits(fine)}.`);
  addPvpLog(`Routejack raid returned empty from ${districtById(run.from).name} to ${districtById(run.to).name}. Heat cost ${formatCredits(fine)}.`);
  addFeed("Route Watch", "raid empty", "data");
  return false;
}

function markRecoveredStolenGood(itemName, hunter, battleId = null) {
  const entry = state.stolenGoods.find((candidate) => candidate.status !== "recovered" && candidate.itemName === itemName);
  if (!entry) return null;
  entry.status = "recovered";
  entry.recoveredBy = hunter;
  entry.recoveredAt = Date.now();
  entry.recoveryBattleId = battleId;
  return entry;
}

function processRouteEncounterTick(shipment, now = Date.now()) {
  if (shipment.status !== "in-transit") return false;
  const route = routeBetween(shipment.from, shipment.to);
  if (!route) return false;
  if (!shipment.lastEncounterCheckAt) shipment.lastEncounterCheckAt = shipment.startedAt || now;
  const endAt = Math.min(now, shipment.arrivesAt);
  let cursor = Math.min(shipment.lastEncounterCheckAt, endAt);
  let changed = false;

  while (cursor < endAt && shipment.status === "in-transit") {
    const nextCursor = Math.min(endAt, cursor + 3600000);
    const elapsedMs = Math.max(0, nextCursor - cursor);
    shipment.lastEncounterCheckAt = nextCursor;
    cursor = nextCursor;
    if (elapsedMs <= 0) continue;
    if (shipment.kind === "intercept" && (!routeRunHasLootRoom(shipment) || (shipment.encounters || []).length >= Number(shipment.encounterLimit || 1))) {
      shipment.arrivesAt = Math.min(shipment.arrivesAt, now);
      changed = true;
      break;
    }
    const encounterRoll = rollRouteEncounter(shipment, route, elapsedMs);
    if (!encounterRoll) continue;
    changed = true;
    if (shipment.kind === "intercept") resolveRoutejackNpcEncounter(shipment, encounterRoll);
    else resolveMerchantTimedEncounter(shipment, encounterRoll);
    if (shipment.kind === "intercept" && (!routeRunHasLootRoom(shipment) || (shipment.encounters || []).length >= Number(shipment.encounterLimit || 1))) {
      shipment.arrivesAt = Math.min(shipment.arrivesAt, now);
    }
  }
  return changed;
}

function processShipments() {
  const before = shipmentStateSignature();
  const now = Date.now();
  state.shipments
    .filter((shipment) => shipment.status === "in-transit")
    .forEach((shipment) => processRouteEncounterTick(shipment, now));
  state.shipments
    .filter((shipment) => (shipment.status === "in-transit" && shipment.arrivesAt <= now) || shipment.status === "blocked")
    .forEach((shipment) => {
      if (shipment.kind === "intercept") resolveInterceptRun(shipment);
      else if (shipment.status === "blocked") deliverShipment(shipment);
      else resolveShipmentRisk(shipment);
    });
  return shipmentStateSignature() !== before;
}

function createShipment(cargoLoad, vehicleName, destinationId, escortName = "none") {
  if (state.role !== "merchant") {
    addFeed("Dispatch", "merchant role required", "data");
    render();
    return;
  }
  const cityId = state.district;
  const route = routeTo(cityId, destinationId);
  const vehicle = itemByName(vehicleName);
  const escort = escortName && escortName !== "none" ? itemByName(escortName) : null;
  const capacity = Math.max(1, Number(vehicle?.capacity || 1));
  const inventory = inventoryFor(cityId);
  const requested = Array.isArray(cargoLoad) ? cargoLoad : [{ name: cargoLoad, qty: 1 }];
  const cargoMap = new Map();
  requested.forEach((entry) => {
    const item = itemByName(entry.name);
    const qty = Math.max(0, Math.floor(Number(entry.qty || 0)));
    if (!item || item.category === "vehicle" || qty <= 0) return;
    const available = inventory[item.name] || 0;
    const nextQty = Math.min(qty, available);
    if (nextQty > 0) cargoMap.set(item.name, (cargoMap.get(item.name) || 0) + nextQty);
  });
  const cargos = [...cargoMap.entries()].map(([name, qty]) => ({ name, qty }));
  const cargoUnits = cargos.reduce((sum, entry) => sum + entry.qty, 0);
  const vehicleAvailable = vehicle?.category === "vehicle" && (inventory[vehicle.name] || 0) > 0;
  const escortAvailable = !escort
    || (escort.category === "vehicle"
      && vehicleCanUseRoute(escort, route)
      && (inventory[escort.name] || 0) > (escort.name === vehicle?.name ? 1 : 0));
  if (!route || !vehicle || vehicle.category !== "vehicle" || !vehicleAvailable || !vehicleCanUseRoute(vehicle, route) || !escortAvailable || cargoUnits < 1 || cargoUnits > capacity) {
    addFeed("Dispatch", cargoUnits > capacity ? "cargo over capacity" : "shipment blocked", vehicle?.iconName || "data");
    render();
    return;
  }
  cargos.forEach((entry) => removeItem(entry.name, entry.qty, cityId));
  removeItem(vehicle.name, 1, cityId);
  if (escort) removeItem(escort.name, 1, cityId);
  const travelHours = routeTravelHours(route, vehicle, currentRole().shipmentSpeedBonus || 0);
  const travelMs = Math.max(60000, travelHours * 3600000);
  const now = Date.now();
  state.nextShipmentRiskReduction = 0;
  const shipment = {
    id: nextMarketId("ship"),
    from: cityId,
    to: destinationId,
    cargo: cargos[0].name,
    cargos,
    cargoUnits,
    capacity,
    vehicle: vehicle.name,
    escortVehicle: escort?.name || null,
    routeHours: travelHours,
    routeMiles: routeDistance(route),
    encounterChance: null,
    encounterRatePerHour: null,
    riskChance: null,
    profession: state.role,
    riskChecked: false,
    events: [`${new Date().toLocaleTimeString()} Dispatched ${cargoUnits}/${capacity} cargo slot${capacity === 1 ? "" : "s"}${escort ? ` with ${escort.name} escort` : ""} through the ${routeKind(route)} route. Route encounters roll while traveling. ETA ${new Date(now + travelMs).toLocaleTimeString()}.`],
    startedAt: now,
    lastEncounterCheckAt: now,
    arrivesAt: now + travelMs,
    status: "in-transit",
  };
  shipment.encounterRatePerHour = routeEncounterRatePerHour(shipment, route);
  shipment.encounterChance = routeEncounterHourlyChance(shipment, route);
  state.shipments.unshift(shipment);
  state.shipmentCargoLoad = {};
  state.shipmentCargoLoadTouched = false;
  state.shipmentCargoQty = 1;
  state.dispatchNotice = {
    type: "success",
    shipmentId: shipment.id,
    text: `${shipmentCargoShortLabel(shipment)} launched toward ${districtById(destinationId).name}`,
    detail: `${vehicle.name}${escort ? ` + ${escort.name}` : ""} - arrives about ${new Date(shipment.arrivesAt).toLocaleTimeString()} (${formatRouteTime(travelHours)}). Encounter ${shipment.encounterChance}%/hr.`,
    at: Date.now(),
  };
  trackContract("shipmentsSent", 1);
  addPvpLog(`Merchant convoy launched to ${districtById(destinationId).name}; ETA ${new Date(shipment.arrivesAt).toLocaleTimeString()}.`);
  addFeed(state.player, `shipping ${cargoUnits}/${capacity}`, vehicle.iconName);
  state.activeView = "shipments";
  renderAndResetScroll();
}

function attemptIntercept() {
  if (state.role !== "routejack") return;
  const route = routeTo(state.district, state.pvpRoute) || routeOptions(state.district)[0];
  if (route && state.pvpRoute !== route.to) state.pvpRoute = route.to;
  const availableVehicles = vehicleItemsIn(state.district).filter(({ item }) => vehicleCanUseRoute(item, route));
  const vehicleName = availableVehicles.some(({ item }) => item.name === state.pvpVehicle) ? state.pvpVehicle : availableVehicles[0]?.item.name;
  const vehicle = itemByName(vehicleName);
  const support1Name = availableVehicles.some(({ item }) => item.name === state.pvpSupport1) ? state.pvpSupport1 : "none";
  const support2Name = availableVehicles.some(({ item }) => item.name === state.pvpSupport2) ? state.pvpSupport2 : "none";
  const convoyNames = [vehicle?.name, support1Name, support2Name].filter((name) => name && name !== "none");
  const needed = convoyNames.reduce((map, name) => map.set(name, (map.get(name) || 0) + 1), new Map());
  const inventory = inventoryFor(state.district);
  const hasVehicles = [...needed.entries()].every(([name, qty]) => (inventory[name] || 0) >= qty);
  if (!route || !vehicleCanUseRoute(vehicle, route) || !hasVehicles) return;
  state.pvpVehicle = vehicle.name;
  state.pvpSupport1 = support1Name;
  state.pvpSupport2 = support2Name;
  convoyNames.forEach((name) => removeItem(name, 1, state.district));
  const travelHours = routeTravelHours(route, vehicle);
  const travelMs = Math.max(60000, travelHours * 3600000);
  const capacity = convoyNames.reduce((sum, name) => sum + Math.max(1, Number(itemByName(name).capacity || 1)), 0);
  const encounterLimit = Math.max(1, Math.min(4, Math.max(capacity, Math.round(travelHours * 1.35))));
  const now = Date.now();
  const run = {
    id: nextMarketId("intercept"),
    kind: "intercept",
    from: state.district,
    to: route.to,
    vehicle: vehicle.name,
    support1: support1Name,
    support2: support2Name,
    loot: [],
    lootPolicy: state.pvpLootPolicy,
    tactic: state.routejackTactic || "snatch",
    capacity,
    encounterLimit,
    routeHours: travelHours,
    routeMiles: routeDistance(route),
    profession: state.role,
    events: [`${new Date().toLocaleTimeString()} Routejack raid launched with ${convoyNames.join(" + ")} to hunt ${routeKind(route)} route encounters while traveling.`],
    startedAt: now,
    lastEncounterCheckAt: now,
    arrivesAt: now + travelMs,
    status: "in-transit",
  };
  run.encounterRatePerHour = routeEncounterRatePerHour(run, route);
  run.encounterChance = routeEncounterHourlyChance(run, route);
  state.shipments.unshift(run);
  addPvpLog(`Launched ${convoyNames.join(" + ")} to raid ${districtById(state.district).name} to ${districtById(route.to).name}.`);
  addFeed(state.player, `routejack raid`, vehicle.iconName);
  state.activeView = "shipments";
  render();
}

function completeShipmentsNow() {
  state.shipments.filter((shipment) => shipment.status === "in-transit").forEach((shipment) => {
    shipment.arrivesAt = Date.now();
  });
  processShipments();
  render();
}

function advanceGameTime(hours) {
  const safeHours = Math.max(0, Number(hours) || 0);
  const elapsed = safeHours * 3600000;
  if (!elapsed) return;
  processTime(elapsed);
  state.shipments
    .filter((shipment) => shipment.status === "in-transit")
    .forEach((shipment) => {
      shipment.startedAt -= elapsed;
      shipment.arrivesAt -= elapsed;
      if (shipment.lastEncounterCheckAt) shipment.lastEncounterCheckAt -= elapsed;
    });
  if (state.routeScanUntil) state.routeScanUntil -= elapsed;
  Object.values(state.routeClearances || {}).forEach((clearance) => {
    clearance.clearedUntil -= elapsed;
  });
  state.routeClearances = normalizeRouteClearances(state.routeClearances);
  processShipments();
}

function buyOrRentFab(type, rental = false) {
  const catalog = fabCatalog.find((fab) => fab.type === type);
  if (!catalog || state.fabs.length >= MAX_ACTIVE_FABS || !catalog.cities.includes(state.district)) return;
  const price = rental ? catalog.rentPrice : catalog.buyPrice;
  if (state.credits < price) return;
  state.credits -= price;
  state.fabs.push({
    ...createFabRecord(type, state.district, rental),
  });
  addFeed(state.player, `${rental ? "rented" : "bought"} ${catalog.label}`, "chip");
  render();
}

function requestRetireFab(id) {
  const fab = state.fabs.find((candidate) => candidate.id === id);
  const block = fabRemovalBlock(fab);
  if (block) {
    addFeed("Lease Office", block, "chip");
    render();
    return;
  }
  const definition = fabDefinition(fab.type);
  const city = districtById(fab.city);
  const saleValue = fabSellValue(fab);
  const prompt = fab.rentedUntil
    ? `End the ${definition.label} lease in ${city.name}? Installed equipment returns to city inventory. Stored mass is lost.`
    : `Sell the ${definition.label} in ${city.name} for ${formatCredits(saleValue)}? Installed equipment returns to city inventory. Stored mass is lost.`;
  openConfirm(
    "retire-fab",
    fab.rentedUntil ? "End Fab Lease" : "Sell Fab",
    prompt,
    fab.rentedUntil ? "End Lease" : "Sell Fab",
    { danger: true, payload: { id } },
  );
}

function retireFab(id) {
  const fab = state.fabs.find((candidate) => candidate.id === id);
  const block = fabRemovalBlock(fab);
  if (block) {
    addFeed("Lease Office", block, "chip");
    render();
    return;
  }
  const definition = fabDefinition(fab.type);
  const saleValue = fabSellValue(fab);
  returnFabEquipment(fab);
  if (!fab.rentedUntil) state.credits += saleValue;
  state.fabs = state.fabs.filter((candidate) => candidate.id !== id);
  if (state.selectedFabId === id) state.selectedFabId = state.fabs[0]?.id || "fab-1";
  state.activeView = "fabs";
  addFeed("Lease Office", fab.rentedUntil ? `ended ${definition.label} lease` : `sold ${definition.label}`, "chip");
  render();
}

function expireRentedFabs() {
  const expired = state.fabs.filter((fab) => fab.rentedUntil && fab.rentedUntil <= Date.now());
  if (!expired.length) return;
  expired.forEach(returnFabEquipment);
  const expiredIds = new Set(expired.map((fab) => fab.id));
  state.fabs = state.fabs.filter((fab) => !expiredIds.has(fab.id));
  if (!state.fabs.some((fab) => fab.id === state.selectedFabId)) state.selectedFabId = state.fabs[0]?.id || "fab-1";
  addFeed("Lease Office", "fab lease expired", "chip");
}

function buyListing(id, qty = 1) {
  const listing = state.marketListings.find((candidate) => candidate.id === id);
  if (listing && !knownItemName(listing.itemName)) {
    state.marketListings = state.marketListings.filter((candidate) => candidate.id !== id);
    render();
    return;
  }
  const amount = Math.min(Math.max(1, Math.floor(qty)), listing?.qty || 0, Math.floor(state.credits / Math.max(1, listing?.price || 1)), inventoryAvailable(listing?.cityId || state.district));
  if (!listing || amount <= 0) return;
  state.credits -= listing.price * amount;
  listing.qty -= amount;
  addItem(listing.itemName, amount, listing.cityId);
  trackContract("itemsBought", amount);
  recordMarket("Bought", listing.itemName, amount, listing.price, listing.cityId, listing.seller);
  if (listing.qty <= 0) state.marketListings = state.marketListings.filter((candidate) => candidate.id !== id);
  addFeed(state.player, `bought ${amount}x ${listing.itemName}`, itemByName(listing.itemName).iconName);
  render();
}

function listItemForSale(itemName, qty, price) {
  const amount = Math.max(1, Math.floor(qty));
  const ask = Math.max(1, Math.floor(price));
  if ((inventoryFor(state.district)[itemName] || 0) < amount) return;
  removeItem(itemName, amount, state.district);
  state.marketListings.push({
    id: nextMarketId("list"),
    cityId: state.district,
    itemName,
    seller: state.player,
    owner: "player",
    price: ask,
    qty: amount,
  });
  recordMarket("Listed", itemName, amount, ask, state.district);
  render();
}

function postBid(itemName, qty, price) {
  const amount = Math.max(1, Math.floor(qty));
  const bidPrice = Math.max(1, Math.floor(price));
  const total = amount * bidPrice;
  if (state.credits < total) return;
  state.credits -= total;
  state.marketBids.push({
    id: nextMarketId("bid"),
    cityId: state.district,
    itemName,
    buyer: state.player,
    owner: "player",
    price: bidPrice,
    qty: amount,
  });
  recordMarket("Bid Posted", itemName, amount, bidPrice, state.district);
  render();
}

function sellToBid(id, qty = 1) {
  const bid = state.marketBids.find((candidate) => candidate.id === id);
  const amount = Math.min(Math.max(1, Math.floor(qty)), bid?.qty || 0, inventoryFor(bid?.cityId || state.district)[bid?.itemName] || 0);
  if (!bid || amount <= 0) return;
  removeItem(bid.itemName, amount, bid.cityId);
  bid.qty -= amount;
  const payout = Math.round(bid.price * amount * (1 + (currentRole().marketSellBonus || 0)));
  state.credits += payout;
  trackContract("itemsSold", amount);
  recordMarket("Sold", bid.itemName, amount, Math.round(payout / amount), bid.cityId, bid.buyer);
  if (bid.qty <= 0) state.marketBids = state.marketBids.filter((candidate) => candidate.id !== id);
  addFeed(state.player, `sold ${amount}x ${bid.itemName}`, itemByName(bid.itemName).iconName);
  render();
}

function sellItemToHighestBid(itemName, cityId = state.district, qty = 1) {
  const bid = highestBid(cityId, itemName);
  if (!bid) return;
  sellToBid(bid.id, qty);
}

function cancelListing(id) {
  const listing = state.marketListings.find((candidate) => candidate.id === id && candidate.owner === "player");
  if (!listing || inventoryAvailable(listing.cityId) < listing.qty) return;
  addItem(listing.itemName, listing.qty, listing.cityId);
  state.marketListings = state.marketListings.filter((candidate) => candidate.id !== id);
  recordMarket("Canceled Listing", listing.itemName, listing.qty, listing.price, listing.cityId);
  render();
}

function cancelBid(id) {
  const bid = state.marketBids.find((candidate) => candidate.id === id && candidate.owner === "player");
  if (!bid) return;
  state.credits += bid.price * bid.qty;
  state.marketBids = state.marketBids.filter((candidate) => candidate.id !== id);
  recordMarket("Canceled Bid", bid.itemName, bid.qty, bid.price, bid.cityId);
  render();
}

function marketStatsForItem(item, cityId = state.district) {
  const ask = lowestListing(cityId, item.name);
  const bid = highestBid(cityId, item.name);
  const owned = inventoryFor(cityId)[item.name] || 0;
  const listed = listingsFor(cityId, item.name).reduce((sum, listing) => sum + listing.qty, 0);
  const wanted = bidsFor(cityId, item.name).reduce((sum, marketBid) => sum + marketBid.qty, 0);
  return { ask, bid, owned, listed, wanted, volume: listed + wanted, spread: ask && bid ? ask.price - bid.price : null };
}

function isWatched(itemName) {
  return state.marketWatchlist.includes(itemName);
}

function toggleWatchItem(itemName) {
  if (!knownItemName(itemName)) return;
  state.marketWatchlist = isWatched(itemName)
    ? state.marketWatchlist.filter((name) => name !== itemName)
    : [...state.marketWatchlist, itemName];
  addFeed("Market", isWatched(itemName) ? `watching ${itemName}` : `removed ${itemName}`, itemByName(itemName).iconName);
  render();
}

function totalOwnedEverywhere(itemName) {
  return districts.reduce((sum, district) => sum + (inventoryFor(district.id)[itemName] || 0), 0);
}

function itemCityPositions(itemName) {
  return districts
    .map((district) => ({ district, count: inventoryFor(district.id)[itemName] || 0 }))
    .filter(({ count }) => count > 0);
}

function cityMarketRows(itemName) {
  return districts.map((district) => {
    const item = itemByName(itemName);
    return {
      district,
      stats: marketStatsForItem(item, district.id),
      ask: lowestListing(district.id, itemName),
      bid: highestBid(district.id, itemName),
      owned: inventoryFor(district.id)[itemName] || 0,
    };
  });
}

function bestAskEverywhere(itemName) {
  return cityMarketRows(itemName)
    .map((row) => ({ ...row, listing: row.ask }))
    .filter((row) => row.listing)
    .sort((a, b) => a.listing.price - b.listing.price || a.district.name.localeCompare(b.district.name))[0] || null;
}

function bestBidEverywhere(itemName) {
  return cityMarketRows(itemName)
    .map((row) => ({ ...row, bidOrder: row.bid }))
    .filter((row) => row.bidOrder)
    .sort((a, b) => b.bidOrder.price - a.bidOrder.price || a.district.name.localeCompare(b.district.name))[0] || null;
}

function marketSalesForItem(itemName, cityId = null) {
  const saleTypes = new Set(["Bought", "Sold", "Bulk Sold"]);
  return state.marketHistory
    .filter((entry) => entry.itemName === itemName && saleTypes.has(entry.type) && (!cityId || entry.cityId === cityId));
}

function recentSaleStats(itemName, cityId = null) {
  const sales = marketSalesForItem(itemName, cityId);
  if (!sales.length) return null;
  const prices = sales.map((entry) => Number(entry.price || 0)).filter((price) => price > 0);
  const qty = sales.reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
  const total = sales.reduce((sum, entry) => sum + Number(entry.price || 0) * Number(entry.qty || 0), 0);
  return {
    count: sales.length,
    qty,
    low: Math.min(...prices),
    high: Math.max(...prices),
    average: qty ? Math.round(total / qty) : Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    last: sales[0],
  };
}

function incompleteMelds() {
  return melds.filter((meld) => !state.completed.includes(meld.name));
}

function selectedMarketMeld() {
  const incomplete = incompleteMelds();
  if (!incomplete.length) return null;
  const selected = incomplete.find((meld) => meld.name === state.marketMeldTarget);
  return selected || incomplete[0];
}

function missingPartsForMeld(meld) {
  if (!meld) return [];
  return recipeProgress(meld)
    .map((part) => ({ ...part, missing: Math.max(0, part.count - part.owned) }))
    .filter((part) => part.missing > 0);
}

function renderWatchButton(itemName, label = null) {
  const watched = isWatched(itemName);
  return `<button type="button" class="watch-button ${watched ? "active" : ""}" data-watch-item="${itemName}">${label || (watched ? "Watching" : "Watch")}</button>`;
}

function renderMarketWatchlist() {
  const watched = state.marketWatchlist
    .filter(knownItemName)
    .map((name) => itemByName(name))
    .sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity) || a.name.localeCompare(b.name));

  if (!watched.length) {
    return `<article class="market-intel-card">
      <div class="card-row"><h3>Watchlist</h3><span class="pill">0</span></div>
      <p class="muted">Watch an item from the market or its order book to track it here across every city.</p>
    </article>`;
  }

  const rows = watched.map((item) => {
    const ask = bestAskEverywhere(item.name);
    const bid = bestBidEverywhere(item.name);
    return `<div class="watch-row">
      <span class="item-name">${icon(item.iconName, item.rarity)} ${item.name}</span>
      <strong>${ask ? `${formatCredits(ask.listing.price)} @ ${ask.district.name}` : "no ask"}</strong>
      <strong>${bid ? `${formatCredits(bid.bidOrder.price)} @ ${bid.district.name}` : "no bid"}</strong>
      <em>${totalOwnedEverywhere(item.name)} owned</em>
      <button type="button" data-item="${item.name}">Open</button>
      <button type="button" class="watch-button active" data-market-unwatch="${item.name}">Unwatch</button>
    </div>`;
  }).join("");

  return `<article class="market-intel-card">
    <div class="card-row"><h3>Watchlist</h3><span class="pill">${watched.length}</span></div>
    <div class="market-mini-head"><span>Item</span><strong>Best Ask</strong><strong>Best Bid</strong><em>Held</em><span></span><span></span></div>
    ${rows}
  </article>`;
}

function renderMeldShoppingList() {
  const incomplete = incompleteMelds();
  const target = selectedMarketMeld();
  if (!target) {
    return `<article class="market-intel-card">
      <div class="card-row"><h3>Meld Shopping List</h3><span class="pill">Complete</span></div>
      <p class="muted">All current melds are complete. New meld sets will appear here when we add more fabs and recipes.</p>
    </article>`;
  }

  const options = incomplete
    .map((meld) => `<option value="${meld.name}" ${target.name === meld.name ? "selected" : ""}>${meld.name} (${fabTypeLabels[meld.type] || meld.type})</option>`)
    .join("");
  const missing = missingPartsForMeld(target);
  const rows = missing.map((part) => {
    const item = itemByName(part.name);
    const ask = bestAskEverywhere(part.name);
    const positions = itemCityPositions(part.name).map(({ district, count }) => `${district.name} x${count}`).join(", ") || "none";
    return `<div class="meld-shopping-row">
      <span class="item-name">${icon(item.iconName, item.rarity)} ${part.name}</span>
      <strong>${part.missing} needed</strong>
      <em>${positions}</em>
      <strong>${ask ? `${formatCredits(ask.listing.price)} @ ${ask.district.name}` : "no ask"}</strong>
      <button type="button" data-item="${part.name}">Open</button>
      <button type="button" data-buy-listing="${ask?.listing.id || ""}" ${ask && state.credits >= ask.listing.price && inventoryAvailable(ask.district.id) > 0 ? "" : "disabled"}>Buy 1</button>
    </div>`;
  }).join("");

  return `<article class="market-intel-card">
    <div class="card-row"><h3>Meld Shopping List</h3><span class="pill">${homeDistrict().name}</span></div>
    <label class="select-field"><span>Target Meld</span><select id="marketMeldTarget">${options}</select></label>
    ${
      missing.length
        ? `<div class="market-mini-head meld"><span>Part</span><strong>Missing</strong><em>Owned Elsewhere</em><strong>Best Ask</strong><span></span><span></span></div>${rows}`
        : `<p class="muted">You have every component for ${target.name} in your home city. Head to Melds to fuse it.</p>
          <div class="button-row"><button type="button" data-view="melds">Open Melds</button></div>`
    }
  </article>`;
}

function filteredMarketItems() {
  const search = state.marketSearch.trim().toLowerCase();
  return allItems()
    .map((item) => ({ item, stats: marketStatsForItem(item) }))
    .filter(({ item, stats }) => state.marketCategory === "all" || item.category === state.marketCategory || item.type === state.marketCategory)
    .filter(({ item }) => state.marketRarity === "all" || item.rarity === state.marketRarity)
    .filter(({ item }) => !state.marketWatchOnly || isWatched(item.name))
    .filter(({ item }) => !search || [item.name, item.rarity, item.source, item.fab, marketCategories[item.category]].join(" ").toLowerCase().includes(search))
    .filter(({ stats }) => state.marketShowEmpty || stats.listed || stats.wanted || stats.owned)
    .sort((a, b) => {
      if (state.marketSort === "bid") return (b.stats.bid?.price || 0) - (a.stats.bid?.price || 0) || a.item.name.localeCompare(b.item.name);
      if (state.marketSort === "spread") return (a.stats.spread ?? Number.MAX_SAFE_INTEGER) - (b.stats.spread ?? Number.MAX_SAFE_INTEGER) || a.item.name.localeCompare(b.item.name);
      if (state.marketSort === "owned") return b.stats.owned - a.stats.owned || a.item.name.localeCompare(b.item.name);
      if (state.marketSort === "rarity") return rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity) || a.item.name.localeCompare(b.item.name);
      if (state.marketSort === "volume") return b.stats.volume - a.stats.volume || a.item.name.localeCompare(b.item.name);
      if (state.marketSort === "name") return a.item.name.localeCompare(b.item.name);
      return (a.stats.ask?.price ?? Number.MAX_SAFE_INTEGER) - (b.stats.ask?.price ?? Number.MAX_SAFE_INTEGER) || a.item.name.localeCompare(b.item.name);
    });
}

function addFeed(who, what, itemIcon) {
  state.feed.unshift([who, what, itemIcon, "just now"]);
  state.feed = state.feed.slice(0, 16);
}

function addItem(name, count = 1, cityId = state.district, ignoreLimit = false) {
  const inventory = inventoryFor(cityId);
  const requested = Math.max(0, Math.floor(count));
  const added = ignoreLimit ? requested : Math.min(requested, inventoryAvailable(cityId));
  if (!added) return 0;
  inventory[name] = (inventory[name] || 0) + added;
  return added;
}

function removeItem(name, count = 1, cityId = state.district) {
  const inventory = inventoryFor(cityId);
  inventory[name] = Math.max(0, (inventory[name] || 0) - count);
  if (!inventory[name]) delete inventory[name];
}

function canMeld(meld) {
  const inventory = homeInventory();
  return Object.entries(meld.recipe).every(([name, count]) => (inventory[name] || 0) >= count);
}

function recipeProgress(meld) {
  const inventory = homeInventory();
  return Object.entries(meld.recipe).map(([name, count]) => ({ name, count, owned: inventory[name] || 0, item: itemByName(name) }));
}

function itemMeldDemand(itemName) {
  const neededBy = melds.filter((meld) => !state.completed.includes(meld.name) && meld.recipe[itemName]);
  const totalNeeded = neededBy.reduce((sum, meld) => sum + Number(meld.recipe[itemName] || 0), 0);
  const ownedHome = homeInventory()[itemName] || 0;
  return {
    neededBy,
    totalNeeded,
    ownedHome,
    missing: Math.max(0, totalNeeded - ownedHome),
  };
}

function shouldProtectInventoryItem(itemName) {
  return Boolean(state.inventoryProtectMelds && itemByName(itemName).category === "meld" && itemMeldDemand(itemName).neededBy.length);
}

function inventoryCategoryMatches(item, category = state.inventoryCategory) {
  return category === "all" || item.category === category || item.type === category;
}

function filteredInventoryEntries(cityId = state.district) {
  const search = (state.inventorySearch || "").trim().toLowerCase();
  return Object.entries(inventoryFor(cityId))
    .map(([name, count]) => ({ item: itemByName(name), count }))
    .filter(({ item, count }) => item && count > 0)
    .filter(({ item }) => inventoryCategoryMatches(item))
    .filter(({ item }) => state.inventoryRarity === "all" || item.rarity === state.inventoryRarity)
    .filter(({ item }) => !search || [item.name, item.rarity, item.source, item.fab, marketCategories[item.category], fabTypeLabels[item.type]].join(" ").toLowerCase().includes(search))
    .sort((a, b) => itemByName(a.item.name).value - itemByName(b.item.name).value || a.item.name.localeCompare(b.item.name));
}

function bulkRarityAllows(item) {
  if (state.inventoryBulkRarity === "all") return true;
  return rarityOrder.indexOf(item.rarity) <= rarityOrder.indexOf(state.inventoryBulkRarity);
}

function bulkInventoryTargets(cityId = state.district, options = {}) {
  return filteredInventoryEntries(cityId)
    .filter(({ item }) => !options.requireBid || highestBid(cityId, item.name))
    .filter(({ item }) => !options.requireNoBid || !highestBid(cityId, item.name))
    .filter(({ item }) => !options.rarityCap || bulkRarityAllows(item))
    .filter(({ item }) => !shouldProtectInventoryItem(item.name));
}

function sellItemToBidAmount(itemName, qty, cityId = state.district, type = "Bulk Sold") {
  const bid = highestBid(cityId, itemName);
  const amount = Math.min(Math.max(1, Math.floor(qty)), bid?.qty || 0, inventoryFor(cityId)[itemName] || 0);
  if (!bid || amount <= 0) return { amount: 0, payout: 0 };
  removeItem(itemName, amount, cityId);
  bid.qty -= amount;
  const payout = Math.round(bid.price * amount * (1 + (currentRole().marketSellBonus || 0)));
  state.credits += payout;
  trackContract("itemsSold", amount);
  recordMarket(type, itemName, amount, Math.round(payout / amount), cityId, bid.buyer);
  if (bid.qty <= 0) state.marketBids = state.marketBids.filter((candidate) => candidate.id !== bid.id);
  return { amount, payout };
}

function requestBulkSellFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireBid: true });
  const total = targets.reduce((sum, { count }) => sum + count, 0);
  if (!total) {
    addFeed("Inventory", "nothing to sell", "chip");
    render();
    return;
  }
  const estimated = targets.reduce((sum, { item, count }) => {
    const bid = highestBid(state.district, item.name);
    return sum + (bid ? Math.min(count, bid.qty || 0) * bid.price : 0);
  }, 0);
  openConfirm(
    "inventory-bulk-sell",
    "Sell Visible Items",
    `Sell up to ${total} visible item${total === 1 ? "" : "s"} to the highest local bids in ${currentDistrict().name}. Estimated payout: ${formatCredits(estimated)}. Protected meld ingredients will stay put.`,
    "Sell Items",
  );
}

function bulkSellFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireBid: true });
  let sold = 0;
  let payout = 0;
  targets.forEach(({ item, count }) => {
    const result = sellItemToBidAmount(item.name, count, state.district);
    sold += result.amount;
    payout += result.payout;
  });
  addFeed("Inventory", sold ? `sold ${sold} for ${formatCredits(payout)}` : "nothing to sell", "chip");
  render();
}

function requestBulkRecycleFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireNoBid: true, rarityCap: true });
  const total = targets.reduce((sum, { count }) => sum + count, 0);
  if (!total) {
    addFeed("Inventory", "nothing to recycle", "chip");
    render();
    return;
  }
  openConfirm(
    "inventory-bulk-recycle",
    "Recycle No-Bid Items",
    `Recycle ${total} no-bid item${total === 1 ? "" : "s"} at or below the selected rarity cap for ${formatCredits(total)}. Protected meld ingredients will stay put.`,
    "Recycle Items",
    { danger: true },
  );
}

function bulkRecycleFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireNoBid: true, rarityCap: true });
  let recycled = 0;
  targets.forEach(({ item, count }) => {
    const amount = Math.min(count, inventoryFor(state.district)[item.name] || 0);
    if (!amount) return;
    removeItem(item.name, amount, state.district);
    recycled += amount;
  });
  state.credits += recycled;
  trackContract("itemsRecycled", recycled);
  if (recycled) recordMarket("Bulk Recycled", `${recycled} filtered item${recycled === 1 ? "" : "s"}`, recycled, 1, state.district, state.player);
  addFeed("Inventory", recycled ? `recycled ${recycled}` : "nothing recycled", "chip");
  render();
}

function requestBulkListFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireNoBid: true, rarityCap: true });
  if (!targets.length) {
    addFeed("Inventory", "nothing to list", "chip");
    render();
    return;
  }
  const total = targets.reduce((sum, { count }) => sum + count, 0);
  const estimated = targets.reduce((sum, { item, count }) => sum + item.value * count, 0);
  openConfirm(
    "inventory-bulk-list",
    "List No-Bid Items",
    `List ${total} filtered item${total === 1 ? "" : "s"} at item value in ${currentDistrict().name}. Total asking value: ${formatCredits(estimated)}. Protected meld ingredients will stay put.`,
    "List Items",
  );
}

function bulkListFilteredInventory() {
  const targets = bulkInventoryTargets(state.district, { requireNoBid: true, rarityCap: true });
  let listed = 0;
  targets.forEach(({ item, count }) => {
    const amount = Math.min(count, inventoryFor(state.district)[item.name] || 0);
    if (!amount) return;
    removeItem(item.name, amount, state.district);
    state.marketListings.push({
      id: nextMarketId("list"),
      cityId: state.district,
      itemName: item.name,
      seller: state.player,
      owner: "player",
      price: item.value,
      qty: amount,
    });
    recordMarket("Bulk Listed", item.name, amount, item.value, state.district);
    listed += amount;
  });
  addFeed("Inventory", `listed ${listed}`, "chip");
  render();
}

function createMeld(name, free = false) {
  const meld = melds.find((candidate) => candidate.name === name);
  if (!meld || state.completed.includes(name)) return;
  if (!free && !canMeld(meld)) return;
  if (!free) Object.entries(meld.recipe).forEach(([itemName, count]) => removeItem(itemName, count, state.homeCity));
  state.completed.push(name);
  if (!free) trackContract("meldsFused", 1);
  state.fuseAnimation = { name: meld.name, rarity: meld.rarity };
  addFeed(state.player, name, itemByName(Object.keys(meld.recipe)[0]).iconName);
  render();
  window.setTimeout(() => {
    if (state.fuseAnimation?.name === meld.name) {
      state.fuseAnimation = null;
      render();
    }
  }, 1400);
}

function claimOutput() {
  const currentCity = state.district;
  if (!queuedOutputFor(currentCity).length) return;
  if (inventoryAvailable(currentCity) <= 0) {
    state.printBayNotice = {
      cityId: currentCity,
      text: "Inventory full",
      expiresAt: Date.now() + 1800,
    };
    addFeed("Storage", `${currentDistrict().name} inventory full`, "chip");
    render();
    return;
  }
  state.printBayNotice = null;
  const collected = [];
  const remaining = [];
  state.output.forEach((entry) => {
    const name = outputName(entry);
    const cityId = outputCity(entry);
    const fabId = outputFabId(entry);
    if (cityId !== currentCity) {
      remaining.push(entry);
      return;
    }
    const result = processCollectedItem(name, cityId, fabId);
    if (result.ok) {
      const collectedEntry = typeof entry === "string" ? { name, cityId, fabId, result } : { ...entry, result };
      collected.push(collectedEntry);
      recordFabOutput(collectedEntry, result.label.toLowerCase());
    } else {
      remaining.push(entry);
      recordFabOutput(entry, result.label.toLowerCase());
    }
  });
  state.lastCollected = collected;
  trackContract("outputsCollected", collected.length);
  addFeed(state.player, collected.length ? `${collected.length} outputs` : "battery recharge", "chip");
  state.output = remaining;
  if (collected.length) state.power = batteryCapacity();
  render();
}

function tick() {
  const now = Date.now();
  const elapsed = Math.min(60000, now - state.lastTick);
  state.lastTick = now;
  expireRentedFabs();
  processTime(elapsed);
  processNpcRouteTraffic(now);
  const shipmentsChanged = processShipments();
  const replayChanged = processBattleReplay(now);
  const editingControl = userIsEditingControl();
  renderHeader();
  if (state.activeView === "admin" && !editingControl && (replayChanged || state.battleReplay?.playing)) renderPanels();
  if (state.activeView === "shipments" && !editingControl && (shipmentsChanged || replayChanged || state.battleReplay?.playing)) renderPanels();
  if (!editingControl && (state.activeView === "findings" || state.activeView === "fabs" || state.activeView === "shipments")) refreshLiveViewChrome();
  touchSessionState();
}

function userIsEditingControl() {
  if (typeof document === "undefined") return false;
  const element = document.activeElement;
  if (!element) return false;
  return ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) || element.isContentEditable;
}

function processTime(elapsed) {
  if (state.power <= 0) return;
  const activeSeconds = Math.min(elapsed / 1000, state.power);
  state.power = Math.max(0, state.power - activeSeconds);
  state.fabs.forEach((fab) => {
    fab.grams = (fab.grams || 0) + (effectiveFabRate(fab) / 3600) * activeSeconds;
    while (fab.grams >= ROLL_GRAMS) {
      fab.grams -= ROLL_GRAMS;
      if (fab.mode === "credits") {
        const gain = creditFabGain();
        state.credits += gain;
        addFeed(state.player, `${gain}cr`, "chip");
      } else {
        const found = weightedFind(fabOutputItems(fab));
        if (found) {
          state.output.unshift({ name: found, cityId: fab.city, fabType: fab.type, fabId: fab.id, printPattern: fab.printPattern });
          addFeed(state.player, found, itemByName(found).iconName);
        }
      }
    }
  });
}

function resetPageScroll() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

function renderAndResetScroll() {
  render();
  resetPageScroll();
}

function navigationSnapshot() {
  return {
    activeView: state.activeView,
    district: state.district,
    selectedItem: state.selectedItem,
    selectedFabId: state.selectedFabId,
    selectedMeldType: state.selectedMeldType,
  };
}

function navigationKey(snapshot) {
  return [
    snapshot.activeView,
    snapshot.district,
    snapshot.selectedItem || "",
    snapshot.selectedFabId || "",
    snapshot.selectedMeldType || "",
  ].join("|");
}

function navigationHash(snapshot = navigationSnapshot()) {
  const params = new URLSearchParams();
  params.set("view", snapshot.activeView || "profile");
  params.set("city", snapshot.district || state.district);
  if (snapshot.activeView === "item" && snapshot.selectedItem) params.set("item", snapshot.selectedItem);
  if (snapshot.activeView === "fab-detail" && snapshot.selectedFabId) params.set("fab", snapshot.selectedFabId);
  if (snapshot.activeView === "melds" && snapshot.selectedMeldType) params.set("meld", snapshot.selectedMeldType);
  return `#${params.toString()}`;
}

function pushBrowserNavigation(replace = false) {
  if (typeof window === "undefined" || browserHistoryRestoring) return;
  const snapshot = navigationSnapshot();
  const url = `${window.location.pathname}${window.location.search}${navigationHash(snapshot)}`;
  const payload = { neonFabs: true, snapshot };
  if (replace || !window.history.state?.neonFabs) window.history.replaceState(payload, "", url);
  else window.history.pushState(payload, "", url);
}

function initializeBrowserNavigation() {
  pushBrowserNavigation(true);
}

function handleBrowserNavigation(event) {
  const snapshot = event.state?.neonFabs ? event.state.snapshot : null;
  if (!snapshot) return;
  browserHistoryRestoring = true;
  const previous = state.viewHistory[state.viewHistory.length - 1];
  if (previous && navigationKey(previous) === navigationKey(snapshot)) state.viewHistory.pop();
  else if (navigationKey(navigationSnapshot()) !== navigationKey(snapshot)) {
    state.viewHistory.push(navigationSnapshot());
    state.viewHistory = state.viewHistory.slice(-25);
  }
  restoreNavigation(snapshot);
  renderAndResetScroll();
  browserHistoryRestoring = false;
}

function pushNavigationHistory() {
  const snapshot = navigationSnapshot();
  const previous = state.viewHistory[state.viewHistory.length - 1];
  if (!previous || navigationKey(previous) !== navigationKey(snapshot)) {
    state.viewHistory.push(snapshot);
    state.viewHistory = state.viewHistory.slice(-25);
  }
}

function isFabListView(view) {
  return ["findings", "fabs", "mines", "gadgets"].includes(view);
}

function clearFabRevealForNavigation(nextView, nextDistrict = state.district) {
  if (!state.lastCollected?.length) return;
  if (!isFabListView(nextView) || nextDistrict !== state.district) state.lastCollected = [];
}

function restoreNavigation(snapshot) {
  if (!snapshot) return;
  clearFabRevealForNavigation(snapshot.activeView || "profile", snapshot.district || state.district);
  state.activeView = snapshot.activeView || "profile";
  state.district = districts.some((district) => district.id === snapshot.district) ? snapshot.district : state.district;
  state.selectedItem = itemByName(snapshot.selectedItem)?.name || state.selectedItem;
  state.selectedFabId = state.fabs.some((fab) => fab.id === snapshot.selectedFabId) ? snapshot.selectedFabId : state.selectedFabId;
  state.selectedMeldType = ["starter", "food"].includes(snapshot.selectedMeldType) ? snapshot.selectedMeldType : state.selectedMeldType;
}

function goBack() {
  if (typeof window !== "undefined" && window.history.state?.neonFabs && state.viewHistory.length) {
    window.history.back();
    return;
  }
  const snapshot = state.viewHistory.pop();
  if (!snapshot) return;
  restoreNavigation(snapshot);
  renderAndResetScroll();
}

function setView(view) {
  if (!view) return;
  if (view === state.activeView) {
    renderAndResetScroll();
    return;
  }
  if (!browserHistoryRestoring) pushNavigationHistory();
  clearFabRevealForNavigation(view);
  state.activeView = view;
  pushBrowserNavigation();
  renderAndResetScroll();
}

function setFabMode(index, mode) {
  state.fabs[index].mode = mode;
  render();
}

function viewDistrict(districtId) {
  const district = districts.find((candidate) => candidate.id === districtId);
  if (!district || district.id === state.district) return;
  if (!browserHistoryRestoring) pushNavigationHistory();
  clearFabRevealForNavigation(state.activeView, district.id);
  state.district = district.id;
  addFeed(state.player, `viewing ${district.name}`, "data");
  pushBrowserNavigation();
  renderAndResetScroll();
}

function setHomeCity(districtId) {
  if (!state.homeChosen) {
    chooseStartingHome(districtId);
    return;
  }
}

function chooseStartingHome(districtId) {
  if (!STARTER_HOME_CITIES.includes(districtId) || state.homeChosen) return;
  const previousHome = state.homeCity;
  const district = districtById(districtId);
  state.homeCity = districtId;
  state.district = districtId;
  state.homeChosen = true;
  state.shipmentDestination = routeOptions(districtId)[0]?.to || state.shipmentDestination;
  state.pvpRoute = routeOptions(districtId)[0]?.to || state.pvpRoute;
  state.fabs
    .filter((fab) => fab.type === "starter")
    .forEach((fab) => { fab.city = districtId; });
  if (!state.fabs.some((fab) => fab.type === "starter")) {
    state.fabs.unshift(createFabRecord("starter", districtId, false));
  }
  const fromInventory = inventoryFor(previousHome);
  const toInventory = inventoryFor(districtId);
  [...starterItems.map((item) => item.name), "Common Runner"].forEach((itemName) => {
    const qty = fromInventory[itemName] || 0;
    if (!qty || previousHome === districtId) return;
    delete fromInventory[itemName];
    toInventory[itemName] = (toInventory[itemName] || 0) + qty;
  });
  state.output = state.output.map((entry) => {
    const entryCity = typeof entry === "string" ? previousHome : outputCity(entry);
    if (entryCity !== previousHome || (typeof entry !== "string" && entry.fabType !== "starter")) return entry;
    return typeof entry === "string" ? { name: entry, cityId: districtId, fabType: "starter", fabId: state.fabs.find((fab) => fab.type === "starter")?.id || null } : { ...entry, cityId: districtId };
  });
  addFeed(state.player, `${district.name} home`, "data");
  renderAndResetScroll();
}

function activeProfessionCommitments() {
  return state.shipments.filter((shipment) => {
    const profession = shipment.profession || "drifter";
    return profession !== "drifter" && ["in-transit", "blocked"].includes(shipment.status);
  });
}

function professionLockReason() {
  const commitments = activeProfessionCommitments();
  if (!commitments.length) return "";
  const labels = [...new Set(commitments.map((job) => roles[job.profession]?.label || "Route"))];
  return `${labels.join(", ")} work is still active. Finish those route jobs before changing professions.`;
}

function changeRole(id) {
  if (!roles[id] || level() < roles[id].unlock) return;
  if (id !== state.role && activeProfessionCommitments().length) {
    addFeed("Dispatch", "profession locked", "shield");
    render();
    return;
  }
  state.role = id;
  render();
}

function runAction(action, payload = {}) {
  if (!action) return false;
  if (action === "go-back") {
    goBack();
    return true;
  }
  if (action === "set-view" || action === "contract-view") {
    setView(payload.view);
    return true;
  }
  if (action === "claim-contract") {
    claimContract(payload.id);
    return true;
  }
  if (action === "select-item") {
    if (!knownItemName(payload.itemName)) return false;
    if (!browserHistoryRestoring && (state.activeView !== "item" || state.selectedItem !== payload.itemName)) pushNavigationHistory();
    clearFabRevealForNavigation("item");
    state.selectedItem = payload.itemName;
    state.activeView = "item";
    pushBrowserNavigation();
    renderAndResetScroll();
    return true;
  }
  if (action === "toggle-watch") {
    toggleWatchItem(payload.itemName);
    return true;
  }
  if (action === "unwatch-item") {
    if (isWatched(payload.itemName)) toggleWatchItem(payload.itemName);
    return true;
  }
  if (action === "select-fab") {
    const fab = state.fabs.find((candidate) => candidate.id === payload.fabId);
    if (!fab) return false;
    if (!browserHistoryRestoring && (state.activeView !== "fab-detail" || state.selectedFabId !== fab.id)) pushNavigationHistory();
    clearFabRevealForNavigation("fab-detail");
    state.selectedFabId = fab.id;
    state.activeView = "fab-detail";
    pushBrowserNavigation();
    renderAndResetScroll();
    return true;
  }
  if (action === "toggle-equipment-slot") {
    state.activeEquipmentSlot = state.activeEquipmentSlot === payload.slotId ? "" : payload.slotId;
    render();
    return true;
  }
  if (action === "change-role") {
    changeRole(payload.roleId);
    return true;
  }
  if (action === "view-district") {
    viewDistrict(payload.districtId);
    return true;
  }
  if (action === "set-home-city") {
    setHomeCity(payload.districtId);
    return true;
  }
  if (action === "move-ingredient") {
    prepareIngredientMove(payload.itemName, payload.sourceCityId);
    return true;
  }
  if (action === "buy-fab") {
    buyOrRentFab(payload.fabType, false);
    return true;
  }
  if (action === "rent-fab") {
    buyOrRentFab(payload.fabType, true);
    return true;
  }
  if (action === "retire-fab") {
    requestRetireFab(payload.fabId);
    return true;
  }
  if (action === "set-fab-shop-category") {
    state.fabShopCategory = payload.category;
    render();
    return true;
  }
  if (action === "set-market-category") {
    state.marketCategory = payload.category;
    render();
    return true;
  }
  if (action === "set-inventory-category") {
    state.inventoryCategory = payload.category;
    render();
    return true;
  }
  if (action === "buy-listing") {
    buyListing(payload.listingId, payload.qty || 1);
    return true;
  }
  if (action === "sell-bid") {
    sellToBid(payload.bidId, payload.qty || 1);
    return true;
  }
  if (action === "quick-sell") {
    sellItemToHighestBid(payload.itemName, payload.cityId || state.district, payload.qty || 1);
    return true;
  }
  if (action === "quick-recycle") {
    recycleItem(payload.itemName, payload.qty || 1, payload.cityId || state.district);
    return true;
  }
  if (action === "cancel-listing") {
    cancelListing(payload.id);
    return true;
  }
  if (action === "cancel-bid") {
    cancelBid(payload.id);
    return true;
  }
  if (action === "set-meld-type") {
    state.selectedMeldType = payload.type;
    render();
    return true;
  }
  if (action === "create-meld") {
    createMeld(payload.meldName);
    return true;
  }
  if (action === "view-route-battle") {
    viewRouteBattle(payload.id);
    return true;
  }
  if (action === "open-print-bay" || action === "claim-output") {
    claimOutput();
    return true;
  }
  if (action === "clear-inventory-filters") {
    state.inventoryCategory = "all";
    state.inventorySearch = "";
    state.inventoryRarity = "all";
    render();
    return true;
  }
  if (action === "clear-market-filters") {
    state.marketCategory = "all";
    state.marketSearch = "";
    state.marketRarity = "all";
    state.marketShowEmpty = true;
    state.marketWatchOnly = false;
    render();
    return true;
  }
  return false;
}
