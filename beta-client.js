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
      global.neonBetaLastState = state;
      writeConfig({
        lastStatus: "connected",
        lastLoadedAt: new Date().toISOString(),
        lastSummary: summarizeState(state),
        lastState: state,
        lastCollection: null,
        lastError: "",
      });
      return state;
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || "Unable to load beta state." });
      throw error;
    }
  }

  async function createTester() {
    const config = readConfig();
    if (!config.adminToken) throw new Error("Admin token required to create a tester.");
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
      global.neonBetaLastState = nextState;
      writeConfig({
        lastStatus: "connected",
        lastLoadedAt: new Date().toISOString(),
        lastSummary: summarizeState(nextState),
        lastState: nextState,
        lastCollection,
        lastError: "",
      });
      return { ...result, state: nextState, collected, lastCollection };
    } catch (error) {
      writeConfig({ lastStatus: "error", lastError: error.message || "Unable to collect Print Bay output." });
      throw error;
    }
  }

  global.NeonBetaClient = {
    readConfig,
    writeConfig,
    clearConfig,
    readLastState: () => global.neonBetaLastState || readConfig().lastState || null,
    loadState,
    createTester,
    collectOutputs,
    summarizeState,
  };
})(window);
