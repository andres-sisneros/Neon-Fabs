function marketPanel() {
  return document.querySelector("#mainPanel");
}

function marketFilterMatches(item) {
  const search = state.marketSearch.trim().toLowerCase();
  const categoryMatch = state.marketCategory === "all" || item.category === state.marketCategory || item.type === state.marketCategory;
  const rarityMatch = state.marketRarity === "all" || item.rarity === state.marketRarity;
  const searchMatch = !search || [item.name, item.rarity, item.source, item.fab, marketCategories[item.category]].join(" ").toLowerCase().includes(search);
  return categoryMatch && rarityMatch && searchMatch;
}

function marketItemSort(a, b) {
  if (state.marketSort === "bid") return (b.stats.bid?.price || 0) - (a.stats.bid?.price || 0) || a.item.name.localeCompare(b.item.name);
  if (state.marketSort === "owned") return b.stats.owned - a.stats.owned || a.item.name.localeCompare(b.item.name);
  if (state.marketSort === "rarity") return rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity) || a.item.name.localeCompare(b.item.name);
  if (state.marketSort === "volume") return b.stats.volume - a.stats.volume || a.item.name.localeCompare(b.item.name);
  if (state.marketSort === "name") return a.item.name.localeCompare(b.item.name);
  return (a.stats.ask?.price ?? Number.MAX_SAFE_INTEGER) - (b.stats.ask?.price ?? Number.MAX_SAFE_INTEGER) || a.item.name.localeCompare(b.item.name);
}

function marketFilters({ collapsed = true } = {}) {
  const categoryOptions = Object.entries(marketCategories)
    .filter(([id]) => id === "all" || allItems().some((item) => item.category === id || item.type === id))
    .map(([id, label]) => `<button type="button" class="${state.marketCategory === id ? "active" : ""}" data-market-category="${id}">${label}</button>`)
    .join("");
  const rarityOptions = [`<option value="all" ${state.marketRarity === "all" ? "selected" : ""}>All Rarities</option>`]
    .concat(rarityOrder.map((rarity) => `<option value="${rarity}" ${state.marketRarity === rarity ? "selected" : ""}>${rarityMeta[rarity].label}</option>`))
    .join("");
  const activeFilters = [
    state.marketSearch.trim(),
    state.marketCategory !== "all",
    state.marketRarity !== "all",
    state.marketSort !== "ask",
  ].filter(Boolean).length;
  const controls = `<div class="market-toolbar compact">
    <label class="search-field"><span>Search</span><input id="marketSearch" type="search" value="${state.marketSearch}" placeholder="Item, rarity, source"></label>
    <label class="select-field"><span>Rarity</span><select id="marketRarity">${rarityOptions}</select></label>
    <label class="select-field"><span>Sort</span><select id="marketSort">
      <option value="ask" ${state.marketSort === "ask" ? "selected" : ""}>Lowest Ask</option>
      <option value="bid" ${state.marketSort === "bid" ? "selected" : ""}>Highest Bid</option>
      <option value="owned" ${state.marketSort === "owned" ? "selected" : ""}>Owned Here</option>
      <option value="rarity" ${state.marketSort === "rarity" ? "selected" : ""}>Rarity</option>
      <option value="volume" ${state.marketSort === "volume" ? "selected" : ""}>Volume</option>
      <option value="name" ${state.marketSort === "name" ? "selected" : ""}>Name</option>
    </select></label>
    <button type="button" data-action="market-clear-filters">Clear</button>
    <div class="segmented">${categoryOptions}</div>
  </div>`;
  if (!collapsed) return controls;
  return `<details class="market-filter-drawer" ${activeFilters ? "open" : ""}>
    <summary>Search & filter${activeFilters ? ` (${activeFilters})` : ""}</summary>
    ${controls}
  </details>`;
}

function renderMarketModeButton(mode, label, count) {
  return `<button type="button" class="market-mode-button ${state.marketMode === mode ? "active" : ""}" data-market-mode="${mode}">
    <span>${label}</span>
    <strong>${count}</strong>
  </button>`;
}

function renderMarketSellCard({ item, owned, stats }) {
  const bid = stats.bid;
  const ask = stats.ask;
  return `<article class="market-trade-card">
    <div class="market-card-main">
      <h3 class="item-name">${icon(item.iconName, item.rarity)} ${itemLabel(item)}</h3>
      ${rarityPill(item.rarity)}
    </div>
    <div class="market-card-line">
      <span>You have <strong>x${owned}</strong></span>
      <span>${bid ? `Best bid <strong>${formatCredits(bid.price)}</strong>` : "No local bid"}</span>
      <span>${ask ? `Listed from <strong>${formatCredits(ask.price)}</strong>` : "No local ask"}</span>
    </div>
    <div class="market-card-actions">
      ${
        bid
          ? `<button type="button" data-sell-bid="${bid.id}">Sell 1</button>`
          : `<button type="button" data-item="${item.name}">List</button>`
      }
      <button type="button" class="secondary" data-item="${item.name}">Details</button>
    </div>
  </article>`;
}

function renderMarketBuyCard({ item, stats }) {
  const ask = stats.ask;
  const globalAsk = bestAskEverywhere(item.name);
  const globalBid = bestBidEverywhere(item.name);
  const canBuy = ask && state.credits >= ask.price && inventoryAvailable(state.district) > 0;
  const remoteHint = !ask && globalAsk ? `Elsewhere ${formatCredits(globalAsk.listing.price)} @ ${globalAsk.district.name}` : "";
  return `<article class="market-trade-card">
    <div class="market-card-main">
      <h3 class="item-name">${icon(item.iconName, item.rarity)} ${itemLabel(item)}</h3>
      ${rarityPill(item.rarity)}
    </div>
    <div class="market-card-line">
      <span>${ask ? `Ask <strong>${formatCredits(ask.price)}</strong>` : "No local ask"}</span>
      <span>${globalBid ? `Best bid <strong>${formatCredits(globalBid.bidOrder.price)}</strong>` : "No bids"}</span>
      <span>${stats.owned ? `Held here <strong>x${stats.owned}</strong>` : remoteHint || "Not held here"}</span>
    </div>
    <div class="market-card-actions">
      <button type="button" data-buy-listing="${ask?.id || ""}" ${canBuy ? "" : "disabled"}>Buy 1</button>
      <button type="button" class="secondary" data-item="${item.name}">Details</button>
      ${renderWatchButton(item.name)}
    </div>
  </article>`;
}

function renderMarketCompactCard({ item, stats, note = "" }) {
  const ask = stats.ask;
  const bid = stats.bid;
  const canBuy = ask && state.credits >= ask.price && inventoryAvailable(state.district) > 0;
  return `<article class="market-compact-card">
    <div class="market-compact-main">
      <h3 class="item-name">${icon(item.iconName, item.rarity)} ${itemLabel(item)}</h3>
      ${rarityPill(item.rarity)}
      ${note ? `<p class="muted">${note}</p>` : ""}
    </div>
    <div class="market-compact-price">
      <span>${ask ? "Local ask" : bid ? "Local bid" : "No local orders"}</span>
      <strong>${ask ? formatCredits(ask.price) : bid ? formatCredits(bid.price) : "--"}</strong>
    </div>
    <div class="market-card-actions">
      <button type="button" data-buy-listing="${ask?.id || ""}" ${canBuy ? "" : "disabled"}>Buy 1</button>
      <button type="button" class="secondary" data-item="${item.name}">Details</button>
    </div>
  </article>`;
}

function uniqueLocalListingRows(limit = 6) {
  const seen = new Set();
  return listingsFor(state.district)
    .filter((listing) => {
      if (seen.has(listing.itemName)) return false;
      seen.add(listing.itemName);
      return knownItemName(listing.itemName);
    })
    .map((listing) => {
      const item = itemByName(listing.itemName);
      return { item, stats: marketStatsForItem(item), listing };
    })
    .sort((a, b) => rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity) || a.listing.price - b.listing.price || a.item.name.localeCompare(b.item.name))
    .slice(0, limit);
}

function watchedMarketRows(limit = 4) {
  return state.marketWatchlist
    .filter(knownItemName)
    .map((name) => itemByName(name))
    .map((item) => ({ item, stats: marketStatsForItem(item) }))
    .filter(({ stats }) => stats.ask || stats.bid || stats.owned)
    .sort(marketItemSort)
    .slice(0, limit);
}

function neededMarketRows(limit = 4) {
  const target = selectedMarketMeld();
  return missingPartsForMeld(target)
    .map((part) => {
      const item = itemByName(part.name);
      const localAsk = lowestListing(state.district, item.name);
      const remoteAsk = localAsk ? null : bestAskEverywhere(item.name);
      const note = localAsk
        ? `${part.missing} needed for ${target.name}`
        : remoteAsk
          ? `${part.missing} needed - seen in ${remoteAsk.district.name}`
          : `${part.missing} needed - no listings`;
      return { item, stats: marketStatsForItem(item), note };
    })
    .slice(0, limit);
}

function renderMarketLandingSection(title, subtitle, rows, emptyText) {
  return `<section class="market-landing-section">
    <div class="market-section-head">
      <div>
        <h3>${title}</h3>
        <p class="muted">${subtitle}</p>
      </div>
      <span class="pill">${rows.length}</span>
    </div>
    <div class="market-section-list">${rows.length ? rows.map(renderMarketCompactCard).join("") : `<p class="muted">${emptyText}</p>`}</div>
  </section>`;
}

function renderMarketCategoryTiles() {
  const tiles = Object.entries(marketCategories)
    .filter(([id]) => id !== "all")
    .map(([id, label]) => {
      const items = allItems().filter((item) => item.category === id || item.type === id);
      const listed = items.reduce((sum, item) => sum + marketStatsForItem(item).listed, 0);
      const wanted = items.reduce((sum, item) => sum + marketStatsForItem(item).wanted, 0);
      return `<button type="button" class="market-category-tile" data-market-category="${id}">
        <span>${label}</span>
        <strong>${items.length}</strong>
        <em>${listed} listed / ${wanted} wanted</em>
      </button>`;
    })
    .join("");
  return `<section class="market-landing-section">
    <div class="market-section-head">
      <div>
        <h3>Browse Categories</h3>
        <p class="muted">Drill into one market lane at a time.</p>
      </div>
    </div>
    <div class="market-category-grid">${tiles}</div>
  </section>`;
}

function renderMarketOrderCard(order, type) {
  const item = itemByName(order.itemName);
  const isListing = type === "listing";
  return `<article class="market-order-card">
    <div>
      <h3 class="item-name">${icon(item.iconName, item.rarity)} ${itemLabel(item)}</h3>
      <p class="muted">${districtById(order.cityId).name} - ${isListing ? "listed for sale" : "buy order"}</p>
    </div>
    <div class="market-order-meta">
      <span>${formatCredits(order.price)}</span>
      <strong>x${order.qty}</strong>
    </div>
    <button type="button" ${isListing ? `data-cancel-listing="${order.id}"` : `data-cancel-bid="${order.id}"`}>Cancel</button>
  </article>`;
}

function renderMarketSellFlow() {
  const rows = Object.entries(inventoryFor(state.district))
    .filter(([name, count]) => count > 0 && knownItemName(name))
    .map(([name, owned]) => {
      const item = itemByName(name);
      return { item, owned, stats: marketStatsForItem(item) };
    })
    .filter(({ item }) => marketFilterMatches(item))
    .sort((a, b) => (b.stats.bid?.price || 0) - (a.stats.bid?.price || 0) || b.owned - a.owned || a.item.name.localeCompare(b.item.name));

  return `<section class="market-flow-panel">
    <div class="market-flow-head">
      <div>
        <h2>Sell From ${currentDistrict().name}</h2>
        <p class="muted">Only items stored in this city can be sold here.</p>
      </div>
      <span class="pill">${rows.length} held</span>
    </div>
    ${marketFilters()}
    <div class="market-card-list">${rows.map(renderMarketSellCard).join("") || `<div class="empty-guidance">
      <h3>No Local Items Match</h3>
      <p class="muted">Collect prints here, ship cargo here, or clear filters.</p>
      <div class="button-row"><button type="button" data-action="market-clear-filters">Clear Filters</button><button type="button" data-view="inventory">Inventory</button></div>
    </div>`}</div>
  </section>`;
}

function renderMarketBuyFlow() {
  const browsing = Boolean(state.marketSearch.trim()) || state.marketCategory !== "all" || state.marketRarity !== "all";
  const rows = allItems()
    .map((item) => ({ item, stats: marketStatsForItem(item) }))
    .filter(({ item, stats }) => marketFilterMatches(item) && (browsing || state.marketShowEmpty || stats.listed || stats.wanted || stats.owned))
    .sort(marketItemSort);
  const activeLabel = state.marketSearch.trim()
    ? `Search: ${state.marketSearch.trim()}`
    : state.marketCategory !== "all"
      ? marketCategories[state.marketCategory]
      : state.marketRarity !== "all"
        ? rarityMeta[state.marketRarity].label
        : "City Market";
  if (browsing) {
    return `<section class="market-flow-panel">
      <div class="market-flow-head">
        <div>
          <h2>${activeLabel}</h2>
          <p class="muted">Focused results for ${currentDistrict().name}. Open an item for full order book details.</p>
        </div>
        <span class="pill">${rows.length} results</span>
      </div>
      ${marketFilters()}
      <div class="market-card-list">${rows.map(renderMarketBuyCard).join("") || `<div class="empty-guidance">
        <h3>No Listings Match</h3>
        <p class="muted">Clear filters or open an item detail to post a buy order.</p>
        <div class="button-row"><button type="button" data-action="market-clear-filters">Clear Filters</button></div>
      </div>`}</div>
    </section>`;
  }

  const neededRows = neededMarketRows();
  const localRows = uniqueLocalListingRows();
  const watchedRows = watchedMarketRows();

  return `<section class="market-flow-panel">
    <div class="market-flow-head">
      <div>
        <h2>Buy In ${currentDistrict().name}</h2>
        <p class="muted">Find useful items before opening the full order book.</p>
      </div>
      <span class="pill">${localRows.length} local</span>
    </div>
    <label class="market-landing-search">
      <span>Search Market</span>
      <input id="marketSearch" type="search" value="${state.marketSearch}" placeholder="Find an item, fab, rarity">
    </label>
    ${renderMarketLandingSection("Needed For Patterns", "Parts your home city is missing.", neededRows, "No missing pattern parts right now.")}
    ${renderMarketLandingSection("Local Listings", "Lowest asks available in this city.", localRows, "No local listings in this city yet.")}
    ${watchedRows.length ? renderMarketLandingSection("Watched Items", "Your tracked item markets.", watchedRows, "No watched items with local activity.") : ""}
    ${renderMarketCategoryTiles()}
  </section>`;
}

function renderMarketOrdersFlow() {
  const playerListings = state.marketListings
    .filter((listing) => listing.owner === "player")
    .sort((a, b) => districtById(a.cityId).name.localeCompare(districtById(b.cityId).name) || a.itemName.localeCompare(b.itemName));
  const playerBids = state.marketBids
    .filter((bid) => bid.owner === "player")
    .sort((a, b) => districtById(a.cityId).name.localeCompare(districtById(b.cityId).name) || a.itemName.localeCompare(b.itemName));
  const history = state.marketHistory.length
    ? state.marketHistory.slice(0, 8).map((entry) => `<div class="market-line"><span>${entry.type} ${entry.qty}x ${entry.itemName}</span><strong>${formatCredits(entry.price)} @ ${districtById(entry.cityId).name}</strong></div>`).join("")
    : `<p class="muted">No transactions yet.</p>`;

  return `<section class="market-flow-panel">
    <div class="market-flow-head">
      <div>
        <h2>My Orders</h2>
        <p class="muted">Cancel listings and buy orders from any city.</p>
      </div>
      <span class="pill">${playerListings.length + playerBids.length} active</span>
    </div>
    <div class="market-order-section">
      <h3>Listings</h3>
      <div class="market-order-list">${playerListings.map((order) => renderMarketOrderCard(order, "listing")).join("") || `<p class="muted">No active listings.</p>`}</div>
    </div>
    <div class="market-order-section">
      <h3>Buy Orders</h3>
      <div class="market-order-list">${playerBids.map((order) => renderMarketOrderCard(order, "bid")).join("") || `<p class="muted">No active buy orders.</p>`}</div>
    </div>
    <div class="market-order-section">
      <h3>Recent Activity</h3>
      ${history}
    </div>
  </section>`;
}

function renderMarket() {
  const localHoldings = Object.entries(inventoryFor(state.district)).filter(([name, count]) => count > 0 && knownItemName(name)).length;
  const playerOrders = state.marketListings.filter((listing) => listing.owner === "player").length
    + state.marketBids.filter((bid) => bid.owner === "player").length;
  const modeContent = state.marketMode === "buy"
    ? renderMarketBuyFlow()
    : state.marketMode === "orders"
      ? renderMarketOrdersFlow()
      : renderMarketSellFlow();

  marketPanel().innerHTML = `
    <section class="panel market-hub">
      <div class="blueprint-head">
        <div>
          <h2>${currentDistrict().name} Market</h2>
          <p class="muted">City-local listings and bids.</p>
        </div>
        <span class="pill">${formatCredits(state.credits)}</span>
      </div>
      <div class="capacity-bar" aria-label="Inventory capacity"><span style="width:${Math.min(100, (inventoryCount(state.district) / inventoryLimit(state.district)) * 100)}%"></span></div>
      <div class="market-mode-row">
        ${renderMarketModeButton("sell", "Sell", localHoldings)}
        ${renderMarketModeButton("buy", "Buy", "City")}
        ${renderMarketModeButton("orders", "Orders", playerOrders)}
      </div>
      ${modeContent}
    </section>`;
}
