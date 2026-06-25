const BETA_WIPE_NOTICE = "Early shared beta data may be wiped while systems and balance change.";
const DEFAULT_HOME_CITY = "chrome-pier";
const STARTER_FAB_RATE_GPH = 12;
const BASE_BATTERY_SECONDS = 86400;
const PATTERN_BATTERY_BONUS_SECONDS = 3600;
const MAX_ROLLS_PER_TICK = 50;
const SESSION_DAYS = 30;
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-admin-token",
};

const cities = [
  { id: "chrome-pier", name: "Chrome Pier", inventoryLimit: 96 },
  { id: "orchid", name: "Orchid Sprawl", inventoryLimit: 96 },
  { id: "lowline", name: "Lowline", inventoryLimit: 96 },
  { id: "helix", name: "Helix Quay", inventoryLimit: 96 },
  { id: "vanta", name: "Vanta Arcology", inventoryLimit: 96 },
];

const items = [
  { id: "common-starter-a", name: "Common Starter Component A", rarity: "green", category: "meld", value: 8 },
  { id: "common-starter-b", name: "Common Starter Component B", rarity: "green", category: "meld", value: 8 },
  { id: "common-starter-c", name: "Common Starter Component C", rarity: "green", category: "meld", value: 8 },
  { id: "uncommon-starter-a", name: "Uncommon Starter Component A", rarity: "blue", category: "meld", value: 35 },
  { id: "common-runner", name: "Common Runner", rarity: "green", category: "vehicle", value: 70 },
];

const patterns = [
  {
    id: "common-starter-meld",
    name: "Common Starter Meld",
    type: "starter",
    rarity: "green",
    repReward: 10,
    recipe: {
      "common-starter-a": 2,
      "common-starter-b": 1,
      "common-starter-c": 1,
    },
  },
];

const routes = [
  { from: "chrome-pier", to: "lowline", distanceMiles: 72, kind: "land", baseHours: 2 },
  { from: "chrome-pier", to: "orchid", distanceMiles: 108, kind: "land", baseHours: 3 },
  { from: "orchid", to: "vanta", distanceMiles: 88, kind: "water", baseHours: 3 },
  { from: "lowline", to: "helix", distanceMiles: 64, kind: "land", baseHours: 2 },
];

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function errorJson(message, status = 400, details = {}) {
  return json({ error: message, ...details }, status);
}

async function readJson(request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new HttpError("Invalid JSON body.", 400);
  }
}

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function addDaysIso(days, now = Date.now()) {
  return new Date(now + days * 86400000).toISOString();
}

function cityById(id) {
  return cities.find((city) => city.id === id) || cities.find((city) => city.id === DEFAULT_HOME_CITY);
}

function itemById(id) {
  return items.find((item) => item.id === id) || null;
}

function patternById(id) {
  return patterns.find((pattern) => pattern.id === id) || null;
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function readBearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)neon_beta_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function secureEquals(a = "", b = "") {
  if (!a || !b) return false;
  const aHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(a)));
  const bHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(b)));
  if (aHash.length !== bHash.length) return false;
  let diff = 0;
  for (let index = 0; index < aHash.length; index += 1) diff |= aHash[index] ^ bHash[index];
  return diff === 0;
}

async function requireAdmin(request, env) {
  const configured = env.ADMIN_TOKEN || "";
  const provided = request.headers.get("x-admin-token") || "";
  if (!(await secureEquals(provided, configured))) throw new HttpError("Admin token required.", 401);
}

async function requireUser(repo, request) {
  const token = readBearerToken(request);
  if (!token) throw new HttpError("Session token required.", 401);
  const session = await repo.sessionByHash(await sha256Hex(token));
  if (!session) throw new HttpError("Invalid or expired session.", 401);
  return session.userId;
}

function routeFor(fromCityId, toCityId) {
  return routes.find((route) => route.from === fromCityId && route.to === toCityId)
    || routes.find((route) => route.from === toCityId && route.to === fromCityId)
    || null;
}

function starterRollItemId() {
  const starter = ["common-starter-a", "common-starter-b", "common-starter-c", "uncommon-starter-a"];
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return starter[bytes[0] % starter.length];
}

async function withUserState(repo, userId) {
  await repo.tickUser(userId, Date.now());
  await repo.resolveShipments(userId, Date.now());
  return repo.stateForUser(userId);
}

async function routeRequest(request, env, repo) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (!path.startsWith("/api")) return errorJson("Not found.", 404);
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (path === "/api/session" && request.method === "GET") {
    const token = readBearerToken(request);
    if (!token) return json({ authenticated: false, betaWipesExpected: true, notice: BETA_WIPE_NOTICE });
    const session = await repo.sessionByHash(await sha256Hex(token));
    if (!session) return json({ authenticated: false, betaWipesExpected: true, notice: BETA_WIPE_NOTICE });
    return json({ authenticated: true, betaWipesExpected: true, notice: BETA_WIPE_NOTICE, user: session.user });
  }

  if (path === "/api/admin/tester" && request.method === "POST") {
    await requireAdmin(request, env);
    const body = await readJson(request);
    const result = await repo.createTester({
      displayName: body.displayName || "Beta Tester",
      homeCityId: body.homeCityId || DEFAULT_HOME_CITY,
      role: body.role || "drifter",
    });
    return json(result, 201, {
      "set-cookie": `neon_beta_session=${encodeURIComponent(result.token)}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    });
  }

  if (path === "/api/admin/wipe" && request.method === "POST") {
    await requireAdmin(request, env);
    await repo.wipeBetaData();
    return json({ ok: true, notice: BETA_WIPE_NOTICE });
  }

  const userId = await requireUser(repo, request);

  if (path === "/api/state" && request.method === "GET") return json(await withUserState(repo, userId));

  if (path === "/api/fabs/collect" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.collectOutputs(userId, body.cityId || null);
    return json({ ...result, state: await withUserState(repo, userId) });
  }

  if (path === "/api/patterns/create" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.createPattern(userId, body.patternId);
    return json({ ...result, state: await withUserState(repo, userId) });
  }

  if (path === "/api/market/list" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.createListing(userId, body);
    return json({ ...result, state: await withUserState(repo, userId) }, 201);
  }

  if (path === "/api/market/bid" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.createBid(userId, body);
    return json({ ...result, state: await withUserState(repo, userId) }, 201);
  }

  if (path === "/api/market/buy" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.buyListing(userId, body.listingId, body.qty || 1);
    return json({ ...result, state: await withUserState(repo, userId) });
  }

  if (path === "/api/market/sell" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.sellToBid(userId, body.bidId, body.qty || 1);
    return json({ ...result, state: await withUserState(repo, userId) });
  }

  if (path === "/api/dispatch/send" && request.method === "POST") {
    const body = await readJson(request);
    const result = await repo.sendShipment(userId, body);
    return json({ ...result, state: await withUserState(repo, userId) }, 201);
  }

  return errorJson("Not found.", 404);
}

export async function handleRequest(request, env = {}, ctx = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  const repo = env.__repo || createD1Repo(env.DB);
  try {
    await repo.ensureWorld();
    return await routeRequest(request, env, repo, ctx);
  } catch (error) {
    if (error instanceof HttpError) return errorJson(error.message, error.status);
    console.error(JSON.stringify({ level: "error", message: error?.message || "Unhandled beta API error" }));
    return errorJson("Server error.", 500);
  }
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};

function createD1Repo(db) {
  if (!db) throw new Error("D1 binding DB is required.");
  const run = (sql, ...params) => db.prepare(sql).bind(...params).run();
  const first = (sql, ...params) => db.prepare(sql).bind(...params).first();
  const all = async (sql, ...params) => (await db.prepare(sql).bind(...params).all()).results || [];

  async function upsertInventory(userId, cityId, itemId, qty) {
    await run(
      `INSERT INTO inventories (user_id, city_id, item_id, qty)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, city_id, item_id) DO UPDATE SET qty = qty + excluded.qty`,
      userId,
      cityId,
      itemId,
      qty,
    );
    await run("DELETE FROM inventories WHERE qty <= 0");
  }

  return {
    async ensureWorld() {
      for (const city of cities) {
        await run(
          "INSERT OR IGNORE INTO cities (id, name, inventory_limit) VALUES (?, ?, ?)",
          city.id,
          city.name,
          city.inventoryLimit,
        );
      }
      for (const item of items) {
        await run(
          "INSERT OR IGNORE INTO items (id, name, rarity, category, value) VALUES (?, ?, ?, ?, ?)",
          item.id,
          item.name,
          item.rarity,
          item.category,
          item.value,
        );
      }
      for (const pattern of patterns) {
        await run(
          "INSERT OR IGNORE INTO patterns (id, name, type, rarity, recipe_json, rep_reward) VALUES (?, ?, ?, ?, ?, ?)",
          pattern.id,
          pattern.name,
          pattern.type,
          pattern.rarity,
          JSON.stringify(pattern.recipe),
          pattern.repReward,
        );
      }
      for (const route of routes) {
        await run(
          "INSERT OR IGNORE INTO routes (from_city_id, to_city_id, distance_miles, kind, base_hours) VALUES (?, ?, ?, ?, ?)",
          route.from,
          route.to,
          route.distanceMiles,
          route.kind,
          route.baseHours,
        );
      }
    },

    async sessionByHash(tokenHash) {
      const session = await first(
        `SELECT sessions.user_id AS userId, users.display_name AS displayName, users.home_city_id AS homeCityId, users.role
         FROM sessions
         JOIN users ON users.id = sessions.user_id
         WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
        tokenHash,
        nowIso(),
      );
      if (!session) return null;
      return {
        userId: session.userId,
        user: {
          id: session.userId,
          displayName: session.displayName,
          homeCityId: session.homeCityId,
          role: session.role,
        },
      };
    },

    async createTester({ displayName, homeCityId, role }) {
      const safeHomeCity = cityById(homeCityId).id;
      const userId = randomId("user");
      const sessionId = randomId("session");
      const token = crypto.randomUUID();
      const createdAt = nowIso();
      await run(
        `INSERT INTO users
         (id, display_name, home_city_id, current_city_id, role, credits, chips, reputation, battery_seconds, battery_capacity_seconds, last_tick_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 1, 0, ?, ?, ?, ?, ?)`,
        userId,
        String(displayName).slice(0, 40),
        safeHomeCity,
        safeHomeCity,
        role,
        BASE_BATTERY_SECONDS,
        BASE_BATTERY_SECONDS,
        createdAt,
        createdAt,
        createdAt,
      );
      await run(
        "INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
        sessionId,
        userId,
        await sha256Hex(token),
        createdAt,
        addDaysIso(SESSION_DAYS),
      );
      const fabId = randomId("fab");
      await run(
        `INSERT INTO fabs (id, user_id, type, city_id, rate_gph, stored_grams, print_pattern, installed_at, last_tick_at)
         VALUES (?, ?, 'starter', ?, ?, 0, 'random', ?, ?)`,
        fabId,
        userId,
        safeHomeCity,
        STARTER_FAB_RATE_GPH,
        createdAt,
        createdAt,
      );
      for (const itemId of ["common-starter-a", "common-starter-a", "common-starter-b", "common-starter-c"]) {
        await run(
          "INSERT INTO fab_outputs (id, user_id, fab_id, city_id, item_id, hidden, created_at, collected_at) VALUES (?, ?, ?, ?, ?, 1, ?, NULL)",
          randomId("output"),
          userId,
          fabId,
          safeHomeCity,
          itemId,
          createdAt,
        );
      }
      return {
        token,
        user: { id: userId, displayName, homeCityId: safeHomeCity, role },
        notice: BETA_WIPE_NOTICE,
      };
    },

    async stateForUser(userId) {
      const user = await first("SELECT * FROM users WHERE id = ?", userId);
      if (!user) throw new HttpError("User not found.", 404);
      const inventories = await all(
        `SELECT city_id AS cityId, item_id AS itemId, qty
         FROM inventories
         WHERE user_id = ? AND qty > 0
         ORDER BY city_id, item_id`,
        userId,
      );
      const fabs = await all("SELECT * FROM fabs WHERE user_id = ? ORDER BY installed_at", userId);
      const outputs = await all(
        `SELECT city_id AS cityId, COUNT(*) AS qty
         FROM fab_outputs
         WHERE user_id = ? AND hidden = 1
         GROUP BY city_id`,
        userId,
      );
      const ownedPatterns = await all("SELECT pattern_id AS patternId, created_at AS createdAt FROM user_patterns WHERE user_id = ?", userId);
      const listings = await all("SELECT * FROM market_listings WHERE qty > 0 ORDER BY created_at DESC LIMIT 100");
      const bids = await all("SELECT * FROM market_bids WHERE qty > 0 ORDER BY created_at DESC LIMIT 100");
      const shipments = await all("SELECT * FROM shipments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", userId);
      return {
        beta: { wipesExpected: true, notice: BETA_WIPE_NOTICE },
        user,
        cities,
        items,
        patterns,
        routes,
        inventories,
        fabs,
        pendingOutputs: outputs,
        ownedPatterns,
        market: { listings, bids },
        shipments: shipments.map((shipment) => ({
          ...shipment,
          cargoJson: shipment.cargo_json ? JSON.parse(shipment.cargo_json) : [],
          encounterJson: shipment.encounter_json ? JSON.parse(shipment.encounter_json) : null,
        })),
      };
    },

    async tickUser(userId, now) {
      const user = await first("SELECT * FROM users WHERE id = ?", userId);
      if (!user) return;
      const elapsedSeconds = Math.max(0, Math.floor((now - new Date(user.last_tick_at).getTime()) / 1000));
      if (!elapsedSeconds) return;
      const activeSeconds = Math.min(elapsedSeconds, Math.max(0, Number(user.battery_seconds || 0)));
      const batterySeconds = Math.max(0, Number(user.battery_seconds || 0) - activeSeconds);
      const userTickAt = nowIso(now);
      await run("UPDATE users SET battery_seconds = ?, last_tick_at = ?, updated_at = ? WHERE id = ?", batterySeconds, userTickAt, userTickAt, userId);
      if (!activeSeconds) return;
      const fabs = await all("SELECT * FROM fabs WHERE user_id = ?", userId);
      for (const fab of fabs) {
        const grams = Number(fab.stored_grams || 0) + Number(fab.rate_gph || STARTER_FAB_RATE_GPH) * (activeSeconds / 3600);
        const rolls = Math.min(MAX_ROLLS_PER_TICK, Math.floor(grams));
        const stored = grams - Math.floor(grams);
        for (let index = 0; index < rolls; index += 1) {
          await run(
            "INSERT INTO fab_outputs (id, user_id, fab_id, city_id, item_id, hidden, created_at, collected_at) VALUES (?, ?, ?, ?, ?, 1, ?, NULL)",
            randomId("output"),
            userId,
            fab.id,
            fab.city_id,
            starterRollItemId(),
            userTickAt,
          );
        }
        await run("UPDATE fabs SET stored_grams = ?, last_tick_at = ? WHERE id = ?", stored, userTickAt, fab.id);
      }
    },

    async resolveShipments(userId, now) {
      const due = await all(
        "SELECT * FROM shipments WHERE user_id = ? AND status = 'in_transit' AND arrival_at <= ?",
        userId,
        nowIso(now),
      );
      for (const shipment of due) {
        const cargo = shipment.cargo_json ? JSON.parse(shipment.cargo_json) : [];
        await upsertInventory(userId, shipment.to_city_id, shipment.vehicle_item_id, 1);
        for (const entry of cargo) await upsertInventory(userId, shipment.to_city_id, entry.itemId, Number(entry.qty || 0));
        await run("UPDATE shipments SET status = 'arrived', resolved_at = ? WHERE id = ?", nowIso(now), shipment.id);
      }
    },

    async collectOutputs(userId, cityId) {
      const outputs = await all(
        `SELECT fab_outputs.id, fab_outputs.item_id AS itemId, fab_outputs.city_id AS cityId, items.name
         FROM fab_outputs
         JOIN items ON items.id = fab_outputs.item_id
         WHERE fab_outputs.user_id = ? AND fab_outputs.hidden = 1 AND (? IS NULL OR fab_outputs.city_id = ?)
         ORDER BY fab_outputs.created_at`,
        userId,
        cityId,
        cityId,
      );
      for (const output of outputs) {
        await upsertInventory(userId, output.cityId, output.itemId, 1);
        await run("UPDATE fab_outputs SET hidden = 0, collected_at = ? WHERE id = ?", nowIso(), output.id);
      }
      const user = await first("SELECT battery_capacity_seconds FROM users WHERE id = ?", userId);
      await run(
        "UPDATE users SET battery_seconds = battery_capacity_seconds, updated_at = ? WHERE id = ?",
        nowIso(),
        userId,
      );
      return { collected: outputs, rechargedTo: user?.battery_capacity_seconds || BASE_BATTERY_SECONDS };
    },

    async createPattern(userId, patternId) {
      const pattern = patternById(patternId);
      if (!pattern) throw new HttpError("Unknown pattern.", 404);
      const existing = await first("SELECT pattern_id FROM user_patterns WHERE user_id = ? AND pattern_id = ?", userId, patternId);
      if (existing) throw new HttpError("Pattern already created.", 409);
      const user = await first("SELECT home_city_id, battery_capacity_seconds FROM users WHERE id = ?", userId);
      for (const [itemId, qty] of Object.entries(pattern.recipe)) {
        const row = await first(
          "SELECT qty FROM inventories WHERE user_id = ? AND city_id = ? AND item_id = ?",
          userId,
          user.home_city_id,
          itemId,
        );
        if (Number(row?.qty || 0) < qty) throw new HttpError("Missing pattern components.", 409);
      }
      for (const [itemId, qty] of Object.entries(pattern.recipe)) await upsertInventory(userId, user.home_city_id, itemId, -qty);
      await run("INSERT INTO user_patterns (user_id, pattern_id, created_at) VALUES (?, ?, ?)", userId, patternId, nowIso());
      await run(
        "UPDATE users SET reputation = reputation + ?, battery_capacity_seconds = ?, updated_at = ? WHERE id = ?",
        pattern.repReward,
        Number(user.battery_capacity_seconds || BASE_BATTERY_SECONDS) + PATTERN_BATTERY_BONUS_SECONDS,
        nowIso(),
        userId,
      );
      return { created: pattern };
    },

    async createListing(userId, { cityId, itemId, qty = 1, price = 1 }) {
      const amount = Math.max(1, Math.floor(Number(qty || 1)));
      const ask = Math.max(1, Math.floor(Number(price || 1)));
      const owned = await first("SELECT qty FROM inventories WHERE user_id = ? AND city_id = ? AND item_id = ?", userId, cityId, itemId);
      if (Number(owned?.qty || 0) < amount) throw new HttpError("Not enough local inventory.", 409);
      await upsertInventory(userId, cityId, itemId, -amount);
      const listing = { id: randomId("listing"), cityId, itemId, qty: amount, price: ask };
      await run(
        "INSERT INTO market_listings (id, city_id, item_id, seller_user_id, qty, price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        listing.id,
        cityId,
        itemId,
        userId,
        amount,
        ask,
        nowIso(),
      );
      return { listing };
    },

    async createBid(userId, { cityId, itemId, qty = 1, price = 1 }) {
      const amount = Math.max(1, Math.floor(Number(qty || 1)));
      const bidPrice = Math.max(1, Math.floor(Number(price || 1)));
      const cost = amount * bidPrice;
      const user = await first("SELECT credits FROM users WHERE id = ?", userId);
      if (Number(user?.credits || 0) < cost) throw new HttpError("Not enough credits.", 409);
      await run("UPDATE users SET credits = credits - ?, updated_at = ? WHERE id = ?", cost, nowIso(), userId);
      const bid = { id: randomId("bid"), cityId, itemId, qty: amount, price: bidPrice };
      await run(
        "INSERT INTO market_bids (id, city_id, item_id, buyer_user_id, qty, price, reserved_credits, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        bid.id,
        cityId,
        itemId,
        userId,
        amount,
        bidPrice,
        cost,
        nowIso(),
      );
      return { bid };
    },

    async buyListing(userId, listingId, qty = 1) {
      const listing = await first("SELECT * FROM market_listings WHERE id = ? AND qty > 0", listingId);
      if (!listing) throw new HttpError("Listing not found.", 404);
      const amount = Math.min(Math.max(1, Math.floor(Number(qty || 1))), Number(listing.qty));
      const cost = amount * Number(listing.price);
      const buyer = await first("SELECT credits FROM users WHERE id = ?", userId);
      if (Number(buyer?.credits || 0) < cost) throw new HttpError("Not enough credits.", 409);
      await run("UPDATE users SET credits = credits - ?, updated_at = ? WHERE id = ?", cost, nowIso(), userId);
      await run("UPDATE users SET credits = credits + ?, updated_at = ? WHERE id = ?", cost, nowIso(), listing.seller_user_id);
      await upsertInventory(userId, listing.city_id, listing.item_id, amount);
      await run("UPDATE market_listings SET qty = qty - ? WHERE id = ?", amount, listingId);
      await run("DELETE FROM market_listings WHERE qty <= 0");
      await recordTransaction(run, "buy", listing.city_id, listing.item_id, amount, listing.price, listing.seller_user_id, userId);
      return { bought: amount, itemId: listing.item_id, price: listing.price };
    },

    async sellToBid(userId, bidId, qty = 1) {
      const bid = await first("SELECT * FROM market_bids WHERE id = ? AND qty > 0", bidId);
      if (!bid) throw new HttpError("Bid not found.", 404);
      const owned = await first("SELECT qty FROM inventories WHERE user_id = ? AND city_id = ? AND item_id = ?", userId, bid.city_id, bid.item_id);
      const amount = Math.min(Math.max(1, Math.floor(Number(qty || 1))), Number(bid.qty), Number(owned?.qty || 0));
      if (!amount) throw new HttpError("Not enough local inventory.", 409);
      const payout = amount * Number(bid.price);
      await upsertInventory(userId, bid.city_id, bid.item_id, -amount);
      await upsertInventory(bid.buyer_user_id, bid.city_id, bid.item_id, amount);
      await run("UPDATE users SET credits = credits + ?, updated_at = ? WHERE id = ?", payout, nowIso(), userId);
      await run("UPDATE market_bids SET qty = qty - ?, reserved_credits = reserved_credits - ? WHERE id = ?", amount, payout, bidId);
      await run("DELETE FROM market_bids WHERE qty <= 0");
      await recordTransaction(run, "sell", bid.city_id, bid.item_id, amount, bid.price, userId, bid.buyer_user_id);
      return { sold: amount, itemId: bid.item_id, price: bid.price };
    },

    async sendShipment(userId, { fromCityId, toCityId, vehicleItemId, cargo = [] }) {
      const route = routeFor(fromCityId, toCityId);
      if (!route) throw new HttpError("Route not connected.", 409);
      const vehicle = await first("SELECT qty FROM inventories WHERE user_id = ? AND city_id = ? AND item_id = ?", userId, fromCityId, vehicleItemId);
      if (Number(vehicle?.qty || 0) < 1) throw new HttpError("Vehicle not in source city.", 409);
      for (const entry of cargo) {
        const owned = await first("SELECT qty FROM inventories WHERE user_id = ? AND city_id = ? AND item_id = ?", userId, fromCityId, entry.itemId);
        if (Number(owned?.qty || 0) < Number(entry.qty || 0)) throw new HttpError("Cargo not in source city.", 409);
      }
      await upsertInventory(userId, fromCityId, vehicleItemId, -1);
      for (const entry of cargo) await upsertInventory(userId, fromCityId, entry.itemId, -Number(entry.qty || 0));
      const shipment = {
        id: randomId("ship"),
        fromCityId,
        toCityId,
        vehicleItemId,
        cargo,
        arrivalAt: new Date(Date.now() + route.baseHours * 3600000).toISOString(),
      };
      await run(
        `INSERT INTO shipments
         (id, user_id, from_city_id, to_city_id, vehicle_item_id, cargo_json, status, depart_at, arrival_at, encounter_json, created_at, resolved_at)
         VALUES (?, ?, ?, ?, ?, ?, 'in_transit', ?, ?, ?, ?, NULL)`,
        shipment.id,
        userId,
        fromCityId,
        toCityId,
        vehicleItemId,
        JSON.stringify(cargo),
        nowIso(),
        shipment.arrivalAt,
        JSON.stringify({ mode: "pve-lite", rolled: false }),
        nowIso(),
      );
      return { shipment };
    },

    async wipeBetaData() {
      for (const table of ["transactions", "shipments", "market_bids", "market_listings", "user_patterns", "fab_outputs", "fabs", "inventories", "sessions", "users"]) {
        await run(`DELETE FROM ${table}`);
      }
    },
  };
}

async function recordTransaction(run, type, cityId, itemId, qty, price, sellerUserId, buyerUserId) {
  await run(
    "INSERT INTO transactions (id, type, city_id, item_id, qty, price, seller_user_id, buyer_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    randomId("txn"),
    type,
    cityId,
    itemId,
    qty,
    price,
    sellerUserId,
    buyerUserId,
    nowIso(),
  );
}

export function createMemoryRepo() {
  const data = {
    users: new Map(),
    sessions: new Map(),
    inventories: new Map(),
    fabs: new Map(),
    outputs: new Map(),
    listings: new Map(),
    bids: new Map(),
    patterns: new Map(),
    shipments: new Map(),
    transactions: [],
  };

  const invKey = (userId, cityId, itemId) => `${userId}:${cityId}:${itemId}`;
  const addInventory = (userId, cityId, itemId, qty) => {
    const key = invKey(userId, cityId, itemId);
    const next = (data.inventories.get(key) || 0) + qty;
    if (next <= 0) data.inventories.delete(key);
    else data.inventories.set(key, next);
  };

  const repo = {
    async ensureWorld() {},
    async sessionByHash(tokenHash) {
      const session = data.sessions.get(tokenHash);
      if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
      const user = data.users.get(session.userId);
      return { userId: session.userId, user };
    },
    async createTester({ displayName, homeCityId, role }) {
      const userId = randomId("user");
      const token = crypto.randomUUID();
      const tokenHash = await sha256Hex(token);
      const safeHomeCity = cityById(homeCityId).id;
      const user = {
        id: userId,
        displayName,
        homeCityId: safeHomeCity,
        currentCityId: safeHomeCity,
        role,
        credits: 0,
        chips: 1,
        reputation: 0,
        batterySeconds: BASE_BATTERY_SECONDS,
        batteryCapacitySeconds: BASE_BATTERY_SECONDS,
      };
      data.users.set(userId, user);
      data.sessions.set(tokenHash, { userId, expiresAt: addDaysIso(SESSION_DAYS) });
      const fabId = randomId("fab");
      data.fabs.set(fabId, { id: fabId, userId, type: "starter", cityId: safeHomeCity, rateGph: STARTER_FAB_RATE_GPH });
      for (const itemId of ["common-starter-a", "common-starter-a", "common-starter-b", "common-starter-c"]) {
        const id = randomId("output");
        data.outputs.set(id, { id, userId, fabId, cityId: safeHomeCity, itemId, hidden: true });
      }
      return { token, user, notice: BETA_WIPE_NOTICE };
    },
    async tickUser() {},
    async resolveShipments(userId, now) {
      for (const shipment of data.shipments.values()) {
        if (shipment.userId !== userId || shipment.status !== "in_transit" || new Date(shipment.arrivalAt).getTime() > now) continue;
        addInventory(userId, shipment.toCityId, shipment.vehicleItemId, 1);
        for (const entry of shipment.cargo) addInventory(userId, shipment.toCityId, entry.itemId, entry.qty);
        shipment.status = "arrived";
      }
    },
    async stateForUser(userId) {
      const user = data.users.get(userId);
      return {
        beta: { wipesExpected: true, notice: BETA_WIPE_NOTICE },
        user,
        cities,
        items,
        patterns,
        routes,
        inventories: [...data.inventories.entries()]
          .map(([key, qty]) => {
            const [ownerId, cityId, itemId] = key.split(":");
            return { userId: ownerId, cityId, itemId, qty };
          })
          .filter((entry) => entry.userId === userId)
          .map(({ cityId, itemId, qty }) => ({ cityId, itemId, qty })),
        fabs: [...data.fabs.values()].filter((fab) => fab.userId === userId),
        pendingOutputs: [...data.outputs.values()].filter((output) => output.userId === userId && output.hidden),
        ownedPatterns: [...data.patterns.entries()].filter(([key]) => key.startsWith(`${userId}:`)).map(([key]) => ({ patternId: key.split(":")[1] })),
        market: { listings: [...data.listings.values()], bids: [...data.bids.values()] },
        shipments: [...data.shipments.values()].filter((shipment) => shipment.userId === userId),
      };
    },
    async collectOutputs(userId, cityId = null) {
      const collected = [];
      for (const output of data.outputs.values()) {
        if (output.userId !== userId || !output.hidden || (cityId && output.cityId !== cityId)) continue;
        output.hidden = false;
        addInventory(userId, output.cityId, output.itemId, 1);
        collected.push(output);
      }
      const user = data.users.get(userId);
      user.batterySeconds = user.batteryCapacitySeconds;
      return { collected, rechargedTo: user.batteryCapacitySeconds };
    },
    async createPattern(userId, patternId) {
      const pattern = patternById(patternId);
      if (!pattern) throw new HttpError("Unknown pattern.", 404);
      const user = data.users.get(userId);
      for (const [itemId, qty] of Object.entries(pattern.recipe)) {
        if ((data.inventories.get(invKey(userId, user.homeCityId, itemId)) || 0) < qty) throw new HttpError("Missing pattern components.", 409);
      }
      for (const [itemId, qty] of Object.entries(pattern.recipe)) addInventory(userId, user.homeCityId, itemId, -qty);
      data.patterns.set(`${userId}:${patternId}`, true);
      user.reputation += pattern.repReward;
      user.batteryCapacitySeconds += PATTERN_BATTERY_BONUS_SECONDS;
      return { created: pattern };
    },
    async createListing(userId, { cityId, itemId, qty = 1, price = 1 }) {
      if ((data.inventories.get(invKey(userId, cityId, itemId)) || 0) < qty) throw new HttpError("Not enough local inventory.", 409);
      addInventory(userId, cityId, itemId, -qty);
      const listing = { id: randomId("listing"), cityId, itemId, sellerUserId: userId, qty, price };
      data.listings.set(listing.id, listing);
      return { listing };
    },
    async createBid(userId, { cityId, itemId, qty = 1, price = 1 }) {
      const user = data.users.get(userId);
      const cost = qty * price;
      if (user.credits < cost) throw new HttpError("Not enough credits.", 409);
      user.credits -= cost;
      const bid = { id: randomId("bid"), cityId, itemId, buyerUserId: userId, qty, price, reservedCredits: cost };
      data.bids.set(bid.id, bid);
      return { bid };
    },
    async buyListing(userId, listingId, qty = 1) {
      const listing = data.listings.get(listingId);
      if (!listing) throw new HttpError("Listing not found.", 404);
      const amount = Math.min(qty, listing.qty);
      const cost = amount * listing.price;
      const buyer = data.users.get(userId);
      const seller = data.users.get(listing.sellerUserId);
      if (buyer.credits < cost) throw new HttpError("Not enough credits.", 409);
      buyer.credits -= cost;
      seller.credits += cost;
      addInventory(userId, listing.cityId, listing.itemId, amount);
      listing.qty -= amount;
      if (listing.qty <= 0) data.listings.delete(listingId);
      return { bought: amount, itemId: listing.itemId, price: listing.price };
    },
    async sellToBid(userId, bidId, qty = 1) {
      const bid = data.bids.get(bidId);
      if (!bid) throw new HttpError("Bid not found.", 404);
      const owned = data.inventories.get(invKey(userId, bid.cityId, bid.itemId)) || 0;
      const amount = Math.min(qty, bid.qty, owned);
      if (!amount) throw new HttpError("Not enough local inventory.", 409);
      addInventory(userId, bid.cityId, bid.itemId, -amount);
      addInventory(bid.buyerUserId, bid.cityId, bid.itemId, amount);
      data.users.get(userId).credits += amount * bid.price;
      bid.qty -= amount;
      bid.reservedCredits -= amount * bid.price;
      if (bid.qty <= 0) data.bids.delete(bidId);
      return { sold: amount, itemId: bid.itemId, price: bid.price };
    },
    async sendShipment(userId, { fromCityId, toCityId, vehicleItemId, cargo = [] }) {
      if (!routeFor(fromCityId, toCityId)) throw new HttpError("Route not connected.", 409);
      if ((data.inventories.get(invKey(userId, fromCityId, vehicleItemId)) || 0) < 1) throw new HttpError("Vehicle not in source city.", 409);
      addInventory(userId, fromCityId, vehicleItemId, -1);
      for (const entry of cargo) addInventory(userId, fromCityId, entry.itemId, -entry.qty);
      const shipment = {
        id: randomId("ship"),
        userId,
        fromCityId,
        toCityId,
        vehicleItemId,
        cargo,
        status: "in_transit",
        arrivalAt: new Date(Date.now() + routeFor(fromCityId, toCityId).baseHours * 3600000).toISOString(),
        encounterJson: { mode: "pve-lite", rolled: false },
      };
      data.shipments.set(shipment.id, shipment);
      return { shipment };
    },
    async wipeBetaData() {
      Object.values(data).forEach((value) => {
        if (value instanceof Map) value.clear();
        else if (Array.isArray(value)) value.length = 0;
      });
    },
    grantInventory(userId, cityId, itemId, qty) {
      addInventory(userId, cityId, itemId, qty);
    },
    grantCredits(userId, credits) {
      data.users.get(userId).credits += credits;
    },
  };

  return repo;
}
