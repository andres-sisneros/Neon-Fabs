// Shared beta API helper. This is intentionally separate from local prototype state.
(function attachBetaClient(global) {
  const STORAGE_KEY = "neon-fabs.beta-client.v1";
  const DEFAULT_API_BASE = "http://127.0.0.1:8787";

  function defaultConfig() {
    return {
      apiBase: DEFAULT_API_BASE,
      token: "",
      adminToken: "",
      testerName: "Beta Tester",
      testerHomeCity: "chrome-pier",
      lastStatus: "idle",
      lastError: "",
      lastLoadedAt: "",
      lastSummary: null,
      lastState: null,
      lastCollection: null,
    };
  }

  function normalizeConfig(raw = {}) {
    return {
      ...defaultConfig(),
      ...raw,
      apiBase: String(raw.apiBase || DEFAULT_API_BASE).replace(/\/+$/, ""),
      token: String(raw.token || ""),
      adminToken: String(raw.adminToken || ""),
      testerName: String(raw.testerName || "Beta Tester").slice(0, 40),
      testerHomeCity: String(raw.testerHomeCity || "chrome-pier"),
      lastState: raw.lastState && typeof raw.lastState === "object" ? raw.lastState : null,
      lastCollection: raw.lastCollection && typeof raw.lastCollection === "object" ? raw.lastCollection : null,
    };
  }

  function readConfig() {
    try {
      return normalizeConfig(JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (error) {
      return defaultConfig();
    }
  }

  function writeConfig(patch = {}) {
    const next = normalizeConfig({ ...readConfig(), ...patch });
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  function clearConfig() {
    global.localStorage.removeItem(STORAGE_KEY);
    global.neonBetaLastState = null;
    return defaultConfig();
  }

  function endpoint(path, config = readConfig()) {
    const base = config.apiBase || DEFAULT_API_BASE;
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }

  function summarizeState(state) {
    const inventoryUnits = (state.inventories || []).reduce((sum, row) => sum + Number(row.qty || 0), 0);
    const pendingOutputs = (state.pendingOutputs || []).reduce((sum, row) => sum + Number(row.qty || 1), 0);
    return {
      userName: state.user?.display_name || state.user?.displayName || "Unknown Tester",
      homeCityId: state.user?.home_city_id || state.user?.homeCityId || "",
      credits: Number(state.user?.credits || 0),
      reputation: Number(state.user?.reputation || 0),
      inventoryRows: (state.inventories || []).length,
      inventoryUnits,
      fabs: (state.fabs || []).length,
      pendingOutputs,
      listings: (state.market?.listings || []).length,
      bids: (state.market?.bids || []).length,
      shipments: (state.shipments || []).length,
      notice: state.beta?.notice || "",
    };
  }

  function itemNameFromState(state, itemId) {
    const item = (state?.items || []).find((entry) => entry.id === itemId);
    return item?.name || itemId || "Unknown Item";
  }

  function normalizeCollected(result, state) {
    const rows = Array.isArray(result?.collected) ? result.collected : [];
    return rows.map((row) => ({
      id: row.id || "",
      cityId: row.cityId || row.city_id || "",
      fabId: row.fabId || row.fab_id || "",
      itemId: row.itemId || row.item_id || "",
      name: row.name || row.itemName || itemNameFromState(state, row.itemId || row.item_id),
    }));
  }

  function storeState(state, patch = {}) {
    if (!state) return writeConfig(patch);
    global.neonBetaLastState = state;
    return writeConfig({
      lastStatus: "connected",
      lastLoadedAt: new Date().toISOString(),
      lastSummary: summarizeState(state),
      lastState: state,
      lastError: "",
      ...patch,
    });
  }

  async function apiFetch(path, options = {}) {
    const config = readConfig();
    const headers = {
      "content-type": "application/json",
      ...(options.token !== false && config.token ? { authorization: `Bearer ${config.token}` } : {}),
      ...(options.admin ? { "x-admin-token": config.adminToken } : {}),
      ...(options.headers || {}),
    };
    const response = await global.fetch(endpoint(path, config), {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Beta API request failed (${response.status})`);
    return body;
  }

  async function loadState() {
    writeConfig({ lastStatus: "loading", lastError: "" });
    try {
      const state = await apiFetch("/api/state");
      storeState(state, {
        lastCollection: null,
      });
      return state;
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || "Unable to load beta state." });
      throw error;
    }
  }

  async function createTester() {
    const config = readConfig();
    if (!config.adminToken) {
      const message = "Add the Admin token in Advanced Connection before creating a test account.";
      writeConfig({ lastStatus: "setup-needed", lastError: message });
      throw new Error(message);
    }
    writeConfig({ lastStatus: "creating", lastError: "" });
    try {
      const result = await apiFetch("/api/admin/tester", {
        method: "POST",
        admin: true,
        token: false,
        body: {
          displayName: config.testerName || "Beta Tester",
          homeCityId: config.testerHomeCity || "chrome-pier",
        },
      });
      writeConfig({
        token: result.token || config.token,
        lastStatus: "created",
        lastLoadedAt: new Date().toISOString(),
        lastSummary: result.user ? {
          userName: result.user.displayName || result.user.display_name || config.testerName,
          homeCityId: result.user.homeCityId || result.user.home_city_id || config.testerHomeCity,
          credits: 0,
          reputation: 0,
          inventoryRows: 0,
          inventoryUnits: 0,
          fabs: 1,
          pendingOutputs: 4,
          listings: 0,
          bids: 0,
          shipments: 0,
          notice: result.notice || "",
        } : null,
        lastCollection: null,
        lastError: "",
      });
      return result;
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || "Unable to create tester." });
      throw error;
    }
  }

  async function collectOutputs(cityId) {
    writeConfig({ lastStatus: "collecting", lastError: "" });
    try {
      const result = await apiFetch("/api/fabs/collect", {
        method: "POST",
        body: { cityId },
      });
      const nextState = result.state || await apiFetch("/api/state");
      const collected = normalizeCollected(result, nextState);
      const lastCollection = {
        cityId: cityId || "",
        collected,
        count: collected.length,
        rechargedTo: result.rechargedTo || result.recharged_to || null,
        at: new Date().toISOString(),
      };
      storeState(nextState, {
        lastCollection,
      });
      return { ...result, state: nextState, collected, lastCollection };
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || "Unable to collect Print Bay output." });
      throw error;
    }
  }

  async function statefulPost(path, body = {}, options = {}) {
    writeConfig({ lastStatus: options.status || "syncing", lastError: "" });
    try {
      const result = await apiFetch(path, {
        method: "POST",
        body,
        admin: Boolean(options.admin),
      });
      const nextState = result.state || await apiFetch("/api/state");
      storeState(nextState, { lastCollection: options.keepCollection ? readConfig().lastCollection : null });
      return { ...result, state: nextState };
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || options.errorMessage || "Server action failed." });
      throw error;
    }
  }

  async function createPattern(patternId) {
    return statefulPost("/api/patterns/create", { patternId }, {
      status: "creating-pattern",
      errorMessage: "Unable to create pattern.",
    });
  }

  async function createListing({ cityId, itemId, qty = 1, price = 1 }) {
    return statefulPost("/api/market/list", { cityId, itemId, qty, price }, {
      status: "listing",
      errorMessage: "Unable to list item.",
    });
  }

  async function createBid({ cityId, itemId, qty = 1, price = 1 }) {
    return statefulPost("/api/market/bid", { cityId, itemId, qty, price }, {
      status: "placing-bid",
      errorMessage: "Unable to place bid.",
    });
  }

  async function buyListing(listingId, qty = 1) {
    return statefulPost("/api/market/buy", { listingId, qty }, {
      status: "buying",
      errorMessage: "Unable to buy listing.",
    });
  }

  async function sellToBid(bidId, qty = 1) {
    return statefulPost("/api/market/sell", { bidId, qty }, {
      status: "selling",
      errorMessage: "Unable to sell to bid.",
    });
  }

  async function cancelListing(listingId) {
    return statefulPost("/api/market/cancel-listing", { listingId }, {
      status: "canceling-listing",
      errorMessage: "Unable to cancel listing.",
    });
  }

  async function cancelBid(bidId) {
    return statefulPost("/api/market/cancel-bid", { bidId }, {
      status: "canceling-bid",
      errorMessage: "Unable to cancel bid.",
    });
  }

  async function recycleInventory({ cityId, itemId, qty = 1 }) {
    return statefulPost("/api/inventory/recycle", { cityId, itemId, qty }, {
      status: "recycling",
      errorMessage: "Unable to recycle item.",
    });
  }

  async function sendShipment({ fromCityId, toCityId, vehicleItemId, cargo = [] }) {
    return statefulPost("/api/dispatch/send", { fromCityId, toCityId, vehicleItemId, cargo }, {
      status: "dispatching",
      errorMessage: "Unable to send shipment.",
    });
  }

  async function advanceTime(hours = 1) {
    return statefulPost("/api/admin/time/advance", { hours }, {
      admin: true,
      status: "advancing-time",
      errorMessage: "Unable to advance beta time.",
    });
  }

  async function grantBundle(cityId) {
    return statefulPost("/api/admin/grant-bundle", { cityId }, {
      admin: true,
      status: "granting-bundle",
      errorMessage: "Unable to grant test bundle.",
    });
  }

  global.NeonBetaClient = {
    readConfig,
    writeConfig,
    clearConfig,
    readLastState: () => global.neonBetaLastState || readConfig().lastState || null,
    loadState,
    refreshState: loadState,
    createTester,
    collectOutputs,
    createPattern,
    createListing,
    createBid,
    buyListing,
    sellToBid,
    cancelListing,
    cancelBid,
    recycleInventory,
    sendShipment,
    advanceTime,
    grantBundle,
    summarizeState,
  };
})(window);
