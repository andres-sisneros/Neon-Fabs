const { test, expect } = require("@playwright/test");

async function openGame(page, view, role = "drifter") {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.addInitScript(() => {
    window.localStorage.setItem("neon-fabs.intro.v1.seen", "yes");
  });
  await page.goto(`/index.html?intro=0#view=${view}&city=chrome-pier`);
  await page.waitForFunction(() => window.state && window.render);
  await page.evaluate(({ nextView, nextRole }) => {
    state.homeChosen = true;
    state.district = "chrome-pier";
    state.activeView = nextView;
    state.role = nextRole;
    render();
  }, { nextView: view, nextRole: role });
  await expect(page.locator("#mainPanel")).toBeVisible();
  await expect(page.locator("#screenTitle")).not.toHaveText("");
  return errors;
}

async function capture(page, testInfo, name) {
  await page.screenshot({
    path: `playtest-artifacts/${testInfo.project.name}-${name}.png`,
    fullPage: true,
  });
}

test("intro overlay sets the scene and can be dismissed", async ({ page }) => {
  await page.goto("/index.html?intro=1#view=profile&city=chrome-pier");
  await page.waitForFunction(() => window.state && window.render);
  await expect(page.locator(".intro-overlay")).toBeVisible();
  await expect(page.locator("#introTitle")).toHaveText("Neon Fabs");
  await expect(page.locator(".intro-source-art img")).toBeVisible();
  await expect.poll(() => page.locator(".intro-source-art img").evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Enter Neon Fabs" }).click();
  await expect(page.locator(".intro-overlay")).toHaveCount(0);
});

test("fresh home choice reads like a game start", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("neon-fabs.intro.v1.seen", "yes");
  });
  await page.goto("/index.html?intro=0#view=profile&city=chrome-pier");
  await page.waitForFunction(() => window.state && window.render);

  await expect(page.locator(".first-run-panel")).toBeVisible();
  await expect(page.locator(".city-source-art img")).toHaveCount(2);
  await expect.poll(() => page.locator(".city-source-art img").first().evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Start In Chrome Pier" })).toBeVisible();

  await page.getByRole("button", { name: "Start In Chrome Pier" }).click();
  await expect(page.locator(".operator-console")).toContainText("Chrome Pier");
});

test("new operator systems reveal as milestones are reached", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("neon-fabs.intro.v1.seen", "yes");
  });
  await page.goto("/index.html?intro=0#view=profile&city=chrome-pier");
  await page.waitForFunction(() => window.state && window.render);
  await page.getByRole("button", { name: "Start In Chrome Pier" }).click();

  await expect(page.locator('.side-nav [data-view="profile"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="contracts"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="fabs"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="inventory"]')).toBeHidden();
  await expect(page.locator('.side-nav [data-view="shop"]')).toBeHidden();
  await expect(page.locator('.side-nav [data-view="melds"]')).toBeHidden();
  await expect(page.locator('.side-nav [data-view="cities"]')).toBeHidden();
  await expect(page.locator('.side-nav [data-view="fab-shop"]')).toBeHidden();

  await page.evaluate(() => claimOutput());
  await expect(page.locator('.side-nav [data-view="inventory"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="melds"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="shop"]')).toBeHidden();

  await page.evaluate(() => {
    claimContract("collect-first-print-run");
    createMeld("Common Starter Meld");
  });
  await expect(page.locator('.side-nav [data-view="shop"]')).toBeVisible();
  await expect(page.locator('.side-nav [data-view="cities"]')).toBeVisible();

  await page.evaluate(() => {
    claimContract("fuse-first-meld");
    state.contractStats.itemsSold = 3;
    claimContract("market-sell-3");
    state.contractStats.itemsBought = 1;
    claimContract("market-buy-1");
  });
  await expect(page.locator('.side-nav [data-view="profession"]')).toBeVisible();
});

test("print bay reveal leads into backpack inventory", async ({ page }) => {
  await openGame(page, "fabs", "drifter");
  await page.evaluate(() => {
    const fab = state.fabs.find((candidate) => candidate.city === state.district) || state.fabs[0];
    state.output = [
      { name: "Common Starter Component A", cityId: state.district, fabId: fab.id, fabType: fab.type },
      { name: "Uncommon Starter Component B", cityId: state.district, fabId: fab.id, fabType: fab.type },
    ];
    render();
    claimOutput();
  });

  await expect(page.locator(".reveal-feature")).toContainText("Best pull");
  await expect(page.locator(".collection-result")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Review Inventory" }).click();
  await expect(page.locator(".inventory-compact-panel")).toBeVisible();
  await expect(page.locator(".backpack-grid")).toBeVisible();
});

test("market sell review tray handles city inventory deliberately", async ({ page }) => {
  await openGame(page, "inventory", "drifter");
  await page.evaluate(() => {
    state.contractStats.meldsFused = 1;
    state.cityInventories[state.district] = {};
    addItem("Common Logic Board", 3, state.district, true);
    state.marketBids.unshift({
      id: "test-bid-common-logic-board",
      cityId: state.district,
      itemName: "Common Logic Board",
      buyer: "Test Desk",
      owner: "npc",
      price: 9,
      qty: 10,
    });
    render();
  });

  await expect(page.locator(".inventory-compact-panel")).toBeVisible();
  await expect(page.locator(".bulk-action-panel")).toHaveCount(0);
  await page.locator('[data-open-inventory-actions="Common Logic Board"]').click();
  await page.getByRole("button", { name: "Open In Market" }).click();
  await expect(page.locator(".market-review-tray")).toBeVisible();
  await expect(page.getByText("Has Local Bids")).toBeVisible();
  await page.locator('[data-market-review-toggle="Common Logic Board"]').click();
  await expect(page.locator(".market-review-tray")).toContainText("3 selected");
  await expect(page.locator(".market-review-tray")).toContainText("Expected Credits");
  await page.locator('[data-action="market-review-apply"]').click();
  await page.locator('[data-action="confirm-accept"]').click();

  const snapshot = await page.evaluate(() => ({
    credits: state.credits,
    owned: inventoryFor(state.district)["Common Logic Board"] || 0,
    sold: state.contractStats.itemsSold,
  }));
  expect(snapshot.credits).toBeGreaterThan(0);
  expect(snapshot.owned).toBe(0);
  expect(snapshot.sold).toBe(3);
});

test("core screens render without browser errors", async ({ page }, testInfo) => {
  const screens = [
    ["profile", "drifter"],
    ["fabs", "drifter"],
    ["inventory", "drifter"],
    ["melds", "drifter"],
    ["shop", "drifter"],
    ["shipments", "merchant"],
    ["shipments", "routejack"],
  ];

  const errors = [];
  for (const [view, role] of screens) {
    errors.push(...await openGame(page, view, role));
    await capture(page, testInfo, `${view}-${role}`);
  }

  expect(errors).toEqual([]);
});

test("dispatch role surfaces stay focused", async ({ page }, testInfo) => {
  let errors = await openGame(page, "shipments", "merchant");
  await expect(page.locator("text=Cargo Dispatch")).toBeVisible();
  await expect(page.locator("text=Raid Dispatch")).toHaveCount(0);
  await expect(page.locator("text=Choose Route")).toBeVisible();
  await capture(page, testInfo, "dispatch-merchant");

  errors = errors.concat(await openGame(page, "shipments", "routejack"));
  await expect(page.locator("text=Raid Dispatch")).toBeVisible();
  await expect(page.locator("text=Cargo Dispatch")).toHaveCount(0);
  await expect(page.locator("text=Choose Raid Route")).toBeVisible();
  await expect(page.locator(".dispatch-choice-card")).not.toHaveCount(0);
  await capture(page, testInfo, "dispatch-routejack");

  expect(errors).toEqual([]);
});

test("dispatch tab and wizard follow role state", async ({ page }) => {
  await openGame(page, "profile", "drifter");
  await expect(page.locator('.side-nav [data-view="shipments"]')).toBeHidden();

  await openGame(page, "shipments", "merchant");
  await expect(page.locator('.side-nav [data-view="shipments"]')).toBeVisible();
  await expect(page.getByText("Choose Route")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Choose Vehicle")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("Choose Route")).toBeVisible();
});

test("merchant can load mixed cargo and send shipment", async ({ page }) => {
  await openGame(page, "shipments", "merchant");
  await page.evaluate(() => {
    addItem("Common Starter Component A", 1, state.district, true);
    addItem("Common Starter Component B", 1, state.district, true);
    render();
  });

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Choose Vehicle")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("heading", { name: "Load Cargo" })).toBeVisible();

  await page.locator('[data-cargo-load="Common Starter Component B"][data-cargo-load-delta="1"]').click();
  await expect(page.locator(".cargo-load-panel .pill").first()).toContainText("2/2");

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("Ready To Launch")).toBeVisible();
  await page.getByRole("button", { name: "Send Shipment" }).click();

  await expect(page.locator(".dispatch-notice.success")).toContainText("launched");
  await expect(page.locator(".shipment-card").first()).toContainText("2 items");

  const shipment = await page.evaluate(() => state.shipments[0]);
  expect(shipment.status).toBe("in-transit");
  expect(shipment.cargos).toEqual(expect.arrayContaining([
    expect.objectContaining({ name: "Common Starter Component A", qty: 1 }),
    expect.objectContaining({ name: "Common Starter Component B", qty: 1 }),
  ]));
});

test("admin route activity shows player jobs, not npc traffic controls", async ({ page }) => {
  await openGame(page, "admin", "merchant");
  await expect(page.getByRole("heading", { name: "Jump To A Playtest Moment" })).toBeVisible();
  await expect(page.getByText("Admin Route Activity")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encounter Designer" })).toBeVisible();
  await expect(page.getByText("Enemy Library")).toBeVisible();
  await page.getByText("Raw JSON", { exact: true }).click();
  await expect(page.getByText("Custom NPC Units")).toBeVisible();
  await expect(page.getByText("Seed NPC Traffic")).toHaveCount(0);
  await expect(page.getByText("Clear NPC Traffic")).toHaveCount(0);
});

test("admin test lab presets jump to useful playtest states", async ({ page }) => {
  await openGame(page, "admin", "drifter");

  await page.locator('[data-admin="test-scenario-merchant-ready"]').click();
  await expect(page.getByText("Cargo Dispatch")).toBeVisible();
  await expect(page.locator(".cargo-dispatch-form")).toBeVisible();
  await expect(page.getByText("Ready To Launch")).toBeVisible();
  let snapshot = await page.evaluate(() => ({
    role: state.role,
    activeView: state.activeView,
    loadedCargo: state.shipmentCargoLoad,
  }));
  expect(snapshot.role).toBe("merchant");
  expect(snapshot.activeView).toBe("shipments");
  expect(snapshot.loadedCargo["Common Starter Component A"]).toBe(2);

  await page.locator('[data-view="admin"]').click();
  await page.locator('[data-admin="test-scenario-full-inventory"]').click();
  await expect(page.getByRole("heading", { name: "Inventory", exact: true })).toBeVisible();
  snapshot = await page.evaluate(() => ({
    used: inventoryCount(state.district),
    limit: inventoryLimit(state.district),
    queued: queuedOutputFor(state.district).length,
  }));
  expect(snapshot.used).toBeGreaterThanOrEqual(snapshot.limit);
  expect(snapshot.queued).toBe(4);
});

test("admin beta test account can create, connect, and clear server mode", async ({ page }) => {
  let createCalled = false;
  let stateAuthHeader = "";
  await page.route("https://beta.test/api/admin/tester", async (route) => {
    createCalled = true;
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers()["x-admin-token"]).toBe("admin-secret");
    expect(route.request().postDataJSON()).toEqual({
      displayName: "Friend Tester",
      homeCityId: "chrome-pier",
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "tester-token",
        user: { displayName: "Friend Tester", homeCityId: "chrome-pier", role: "drifter" },
        notice: "Early shared beta data may be wiped.",
      }),
    });
  });
  await page.route("https://beta.test/api/state", async (route) => {
    stateAuthHeader = route.request().headers().authorization || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        beta: { wipesExpected: true, notice: "Early shared beta data may be wiped." },
        user: {
          displayName: "Friend Tester",
          homeCityId: "chrome-pier",
          currentCityId: "chrome-pier",
          credits: 123,
          chips: 1,
          reputation: 10,
          batterySeconds: 7200,
          batteryCapacitySeconds: 86400,
        },
        cities: [
          { id: "chrome-pier", name: "Chrome Pier", inventoryLimit: 96 },
          { id: "lowline", name: "Lowline", inventoryLimit: 96 },
        ],
        items: [
          { id: "common-starter-a", name: "Common Starter Component A", rarity: "green", category: "meld", value: 8 },
          { id: "common-runner", name: "Common Runner", rarity: "green", category: "vehicle", value: 70 },
        ],
        inventories: [{ cityId: "chrome-pier", itemId: "common-starter-a", qty: 2 }],
        fabs: [{ id: "fab-1", type: "starter", cityId: "chrome-pier", rateGph: 12, storedGrams: 0.5, printPattern: "random" }],
        pendingOutputs: [{ cityId: "chrome-pier", qty: 4 }],
        market: {
          listings: [{ id: "listing-1", cityId: "chrome-pier", itemId: "common-starter-a", qty: 1, price: 12 }],
          bids: [{ id: "bid-1", cityId: "chrome-pier", itemId: "common-runner", qty: 1, price: 80 }],
        },
        shipments: [{
          id: "ship-1",
          fromCityId: "chrome-pier",
          toCityId: "lowline",
          vehicleItemId: "common-runner",
          cargoJson: [{ itemId: "common-starter-a", qty: 1 }],
          status: "in_transit",
          arrivalAt: "2026-06-25T12:00:00.000Z",
        }],
      }),
    });
  });

  await openGame(page, "admin", "drifter");
  await page.evaluate(() => {
    localStorage.removeItem("neon-fabs.beta-client.v1");
    render();
  });

  await expect(page.getByRole("heading", { name: "Beta Test Account" })).toBeVisible();
  await expect(page.locator("#betaToken")).toBeHidden();
  await page.getByRole("button", { name: "Create & Connect Test Account" }).click();
  await expect(page.locator(".beta-client-panel")).toContainText("Add the Admin token in Advanced Connection");
  await expect(page.locator(".beta-advanced-card")).toHaveAttribute("open", "");
  await expect(page.locator("#betaToken")).toBeVisible();
  expect(createCalled).toBe(false);
  await page.locator("#betaApiBase").fill("https://beta.test");
  await page.locator("#betaAdminToken").fill("admin-secret");
  await page.locator("#betaTesterName").fill("Friend Tester");
  await page.locator("#betaTesterHomeCity").selectOption("chrome-pier");
  await page.getByRole("button", { name: "Create & Connect Test Account" }).click();

  await expect(page.locator(".beta-client-panel")).toContainText("Friend Tester");
  await expect(page.locator(".beta-client-panel")).toContainText("123cr");
  await expect(page.locator(".beta-client-panel")).toContainText("Early shared beta data may be wiped.");
  expect(createCalled).toBe(true);
  expect(stateAuthHeader).toBe("Bearer tester-token");

  await page.evaluate(() => {
    state.activeView = "fabs";
    render();
  });
  await expect(page.locator("#mainPanel")).toContainText("Server fab");
  await page.evaluate(() => {
    state.activeView = "admin";
    render();
  });

  await page.getByRole("button", { name: "Open Beta Shell" }).click();
  const shell = page.locator(".beta-shell");
  await expect(page.getByRole("heading", { name: "Beta Shell" })).toBeVisible();
  await expect(shell).toContainText("Friend Tester");
  await expect(shell).toContainText("123cr");
  await expect(shell).toContainText("1");
  await expect(shell).toContainText("10");
  await expect(shell).toContainText("Chrome Pier");
  await expect(shell).toContainText("Common Starter Component A");
  await expect(shell).toContainText("Starter Fab");
  await expect(shell).toContainText("4 sealed");
  await expect(shell).toContainText("Listings");
  await expect(shell).toContainText("Bids");
  await expect(shell).toContainText("Shipments");
  await expect(shell).toContainText("Common Runner");
  await expect(shell.getByRole("button", { name: "Collect Output" })).toBeVisible();
  await expect(shell.getByRole("button", { name: "Send Shipment" })).toHaveCount(0);
  await expect(shell.getByRole("button", { name: "Create Meld" })).toHaveCount(0);

  await page.getByRole("button", { name: "Back To Admin" }).click();
  await page.getByRole("button", { name: "Clear Account" }).click();
  await expect.poll(() => page.evaluate(() => window.NeonBetaClient.readConfig().token)).toBe("");
  await page.evaluate(() => {
    state.activeView = "fabs";
    render();
  });
  await expect(page.locator("#mainPanel")).not.toContainText("Server fab");
});

test("beta mode collects Print Bay output from the normal Fabs page", async ({ page }) => {
  const initialState = {
    beta: { wipesExpected: true, notice: "Early shared beta data may be wiped." },
    user: {
      displayName: "Friend Tester",
      homeCityId: "chrome-pier",
      currentCityId: "chrome-pier",
      credits: 123,
      chips: 1,
      reputation: 10,
      batterySeconds: 7200,
      batteryCapacitySeconds: 86400,
    },
    cities: [
      { id: "chrome-pier", name: "Chrome Pier", inventoryLimit: 96 },
      { id: "lowline", name: "Lowline", inventoryLimit: 96 },
    ],
    items: [
      { id: "common-starter-a", name: "Common Starter Component A", rarity: "green", category: "meld", value: 8 },
      { id: "common-starter-b", name: "Common Starter Component B", rarity: "green", category: "meld", value: 8 },
    ],
    inventories: [],
    fabs: [{ id: "fab-1", type: "starter", cityId: "chrome-pier", rateGph: 12, storedGrams: 0.5, printPattern: "random" }],
    pendingOutputs: [{ cityId: "chrome-pier", qty: 2 }],
    market: { listings: [], bids: [] },
    shipments: [],
  };
  const collectedState = {
    ...initialState,
    user: { ...initialState.user, batterySeconds: 86400 },
    inventories: [{ cityId: "chrome-pier", itemId: "common-starter-a", qty: 1 }, { cityId: "chrome-pier", itemId: "common-starter-b", qty: 1 }],
    pendingOutputs: [],
  };
  let collectCalls = 0;

  await page.route("https://beta.test/api/state", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(collectCalls ? collectedState : initialState),
    });
  });
  await page.route("https://beta.test/api/fabs/collect", async (route) => {
    collectCalls += 1;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ cityId: "chrome-pier" });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        collected: [
          { id: "out-1", cityId: "chrome-pier", fabId: "fab-1", itemId: "common-starter-a" },
          { id: "out-2", cityId: "chrome-pier", fabId: "fab-1", itemId: "common-starter-b" },
        ],
        rechargedTo: 86400,
        state: collectedState,
      }),
    });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("neon-fabs.intro.v1.seen", "yes");
    window.localStorage.setItem("neon-fabs.beta-client.v1", JSON.stringify({
      apiBase: "https://beta.test",
      token: "tester-token",
      lastStatus: "saved",
    }));
  });

  await openGame(page, "fabs", "drifter");

  await expect(page.locator("#walletSummary")).toContainText("123cr");
  await expect(page.locator("#mainPanel")).toContainText("Server fab");
  await expect(page.getByRole("button", { name: "Collect Prints" })).toBeVisible();

  await page.getByRole("button", { name: "Collect Prints" }).click();

  await expect(page.locator(".reveal-feature")).toContainText("Best pull");
  await expect(page.locator(".collection-grid")).toContainText("Common Starter Component A");
  await expect(page.locator(".collection-grid")).toContainText("Common Starter Component B");
  await expect(page.locator("#rightPanel")).toContainText("0 sealed");
  expect(collectCalls).toBe(1);
});

test("connected beta account can use the server-owned core loop screens", async ({ page }) => {
  const pattern = {
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
  };
  const routes = [{ from: "chrome-pier", to: "lowline", distanceMiles: 72, kind: "land", baseHours: 2 }];
  const cities = [
    { id: "chrome-pier", name: "Chrome Pier", inventoryLimit: 96 },
    { id: "lowline", name: "Lowline", inventoryLimit: 96 },
  ];
  const items = [
    { id: "common-starter-a", name: "Common Starter Component A", rarity: "green", category: "meld", value: 8 },
    { id: "common-starter-b", name: "Common Starter Component B", rarity: "green", category: "meld", value: 8 },
    { id: "common-starter-c", name: "Common Starter Component C", rarity: "green", category: "meld", value: 8 },
    { id: "uncommon-starter-a", name: "Uncommon Starter Component A", rarity: "blue", category: "meld", value: 35 },
    { id: "common-runner", name: "Common Runner", rarity: "green", category: "vehicle", value: 70 },
  ];
  let serverState = {
    beta: { wipesExpected: true, notice: "Early shared beta data may be wiped.", now: "2026-06-25T12:00:00.000Z", clockOffsetMs: 0 },
    user: {
      id: "user-1",
      displayName: "Loop Tester",
      homeCityId: "chrome-pier",
      currentCityId: "chrome-pier",
      credits: 200,
      chips: 1,
      reputation: 0,
      batterySeconds: 86400,
      batteryCapacitySeconds: 86400,
    },
    cities,
    items,
    patterns: [pattern],
    ownedPatterns: [],
    inventories: [
      { cityId: "chrome-pier", itemId: "common-starter-a", qty: 4 },
      { cityId: "chrome-pier", itemId: "common-starter-b", qty: 1 },
      { cityId: "chrome-pier", itemId: "common-starter-c", qty: 1 },
      { cityId: "chrome-pier", itemId: "uncommon-starter-a", qty: 2 },
      { cityId: "chrome-pier", itemId: "common-runner", qty: 1 },
    ],
    fabs: [{ id: "fab-1", type: "starter", cityId: "chrome-pier", rateGph: 12, storedGrams: 0, printPattern: "random" }],
    pendingOutputs: [],
    market: { listings: [], bids: [] },
    shipments: [],
    routes,
  };
  const removeInventory = (cityId, itemId, qty) => {
    const row = serverState.inventories.find((entry) => entry.cityId === cityId && entry.itemId === itemId);
    if (!row) return;
    row.qty -= qty;
    serverState.inventories = serverState.inventories.filter((entry) => entry.qty > 0);
  };
  const addInventory = (cityId, itemId, qty) => {
    const row = serverState.inventories.find((entry) => entry.cityId === cityId && entry.itemId === itemId);
    if (row) row.qty += qty;
    else serverState.inventories.push({ cityId, itemId, qty });
  };

  await page.route("https://beta.test/api/state", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(serverState) });
  });
  await page.route("https://beta.test/api/patterns/create", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ patternId: "common-starter-meld" });
    for (const [itemId, qty] of Object.entries(pattern.recipe)) removeInventory("chrome-pier", itemId, qty);
    serverState.ownedPatterns = [{ patternId: pattern.id }];
    serverState.user.reputation += pattern.repReward;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ created: pattern, state: serverState }) });
  });
  await page.route("https://beta.test/api/market/list", async (route) => {
    const body = route.request().postDataJSON();
    removeInventory(body.cityId, body.itemId, body.qty);
    serverState.market.listings.push({ id: "listing-1", cityId: body.cityId, itemId: body.itemId, sellerUserId: "user-1", qty: body.qty, price: body.price });
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ listing: serverState.market.listings[0], state: serverState }) });
  });
  await page.route("https://beta.test/api/inventory/recycle", async (route) => {
    const body = route.request().postDataJSON();
    removeInventory(body.cityId, body.itemId, body.qty);
    serverState.user.credits += body.qty;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recycled: body.qty, state: serverState }) });
  });
  await page.route("https://beta.test/api/dispatch/send", async (route) => {
    const body = route.request().postDataJSON();
    removeInventory(body.fromCityId, body.vehicleItemId, 1);
    body.cargo.forEach((entry) => removeInventory(body.fromCityId, entry.itemId, entry.qty));
    serverState.shipments.push({
      id: "ship-1",
      userId: "user-1",
      fromCityId: body.fromCityId,
      toCityId: body.toCityId,
      vehicleItemId: body.vehicleItemId,
      cargo: body.cargo,
      status: "in_transit",
      arrivalAt: "2026-06-25T14:00:00.000Z",
      encounterJson: { mode: "pve-lite", rolled: false },
    });
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ shipment: serverState.shipments[0], state: serverState }) });
  });
  await page.route("https://beta.test/api/admin/time/advance", async (route) => {
    expect(route.request().headers()["x-admin-token"]).toBe("admin-secret");
    const shipment = serverState.shipments[0];
    shipment.status = "arrived";
    shipment.encounterJson = {
      mode: "pve-lite",
      rolled: true,
      note: "No contact. The convoy crossed the route cleanly.",
      freightPayout: 42,
    };
    addInventory(shipment.toCityId, shipment.vehicleItemId, 1);
    shipment.cargo.forEach((entry) => addInventory(shipment.toCityId, entry.itemId, entry.qty));
    serverState.user.credits += 42;
    serverState.beta.clockOffsetMs = 7200000;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ advancedHours: 2, state: serverState }) });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("neon-fabs.intro.v1.seen", "yes");
    window.localStorage.setItem("neon-fabs.beta-client.v1", JSON.stringify({
      apiBase: "https://beta.test",
      token: "tester-token",
      adminToken: "admin-secret",
      lastStatus: "saved",
    }));
  });

  await openGame(page, "profile", "drifter");
  await expect(page.locator("#mainPanel")).toContainText("Loop Tester");
  await expect(page.locator("#walletSummary")).toContainText("200cr");

  await page.getByRole("button", { name: "Patterns", exact: true }).click();
  await expect(page.locator("#mainPanel")).toContainText("Common Starter Meld");
  await page.getByRole("button", { name: "Create Pattern" }).click();
  await expect(page.locator("#walletSummary")).toContainText("10 Rep");
  await expect(page.getByRole("button", { name: "Already Created" })).toBeVisible();

  await page.evaluate(() => {
    state.marketMode = "sell";
    state.activeView = "shop";
    render();
  });
  await page.locator('[data-beta-list-item="common-starter-a"]').click();
  await expect.poll(() => page.evaluate(() => window.NeonBetaClient.readLastState().market.listings.length)).toBe(1);
  await page.locator('[data-beta-recycle-item="common-starter-a"]').click();
  await expect(page.locator("#walletSummary")).toContainText("201cr");

  await page.evaluate(() => {
    state.activeView = "shipments";
    render();
  });
  await expect(page.getByRole("button", { name: "Send Shipment" })).toBeVisible();
  await page.getByRole("button", { name: "Send Shipment" }).click();
  await expect.poll(() => page.evaluate(() => window.NeonBetaClient.readLastState().shipments.length)).toBe(1);
  await expect(page.locator("#mainPanel")).toContainText("in_transit");

  await page.evaluate(() => {
    state.activeView = "admin";
    render();
  });
  await page.locator("#betaAdvanceHours").fill("2");
  await page.getByRole("button", { name: "Advance Global Time" }).click();
  await expect(page.locator(".beta-client-panel")).toContainText("243cr");

  await page.evaluate(() => {
    state.activeView = "inventory";
    state.district = "lowline";
    render();
  });
  await expect(page.locator("#mainPanel")).toContainText("Lowline Inventory");
  await expect(page.locator("#mainPanel")).toContainText("Common Runner");
  await expect(page.locator("#mainPanel")).toContainText("Uncommon Starter Component A");
});

test("melds page uses compact visual set cards", async ({ page }) => {
  await openGame(page, "melds", "drifter");
  await page.evaluate(() => {
    addItem("Common Starter Component A", 2, state.homeCity, true);
    addItem("Common Starter Component B", 1, state.homeCity, true);
    addItem("Common Starter Component C", 1, state.homeCity, true);
    render();
  });

  await expect(page.getByText("Meld Sets")).toBeVisible();
  await expect(page.locator(".meld-card")).toHaveCount(5);
  await expect(page.locator(".meld-card.ready")).toContainText("Common Starter Meld");
  await expect(page.locator(".meld-token.ready")).not.toHaveCount(0);
  await expect(page.locator(".meld-token.missing")).not.toHaveCount(0);
  await expect(page.getByText("Home Ask")).toHaveCount(0);
  await expect(page.getByText("Best Ask")).toHaveCount(0);
  await expect(page.getByText("Move Path")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fuse" })).toBeVisible();
});

test("creative overrides and playtest save survive refresh", async ({ page }) => {
  await openGame(page, "inventory", "drifter");
  await page.evaluate(() => {
    state.credits = 321;
    render();
    savePlaytestState(true);
  });
  await expect(page.locator("#walletSummary")).toContainText("321cr");

  await page.reload();
  await page.waitForFunction(() => window.state && window.render);
  await expect(page.locator("#walletSummary")).toContainText("321cr");
  await expect(page.locator(".brand")).toContainText("Neon Fabs");
  await expect(page.locator(".brand")).toContainText("Lowline testnet");

  await page.evaluate(() => {
    clearPrototypeSaves();
    state = seedState(defaultState());
    render();
    savePlaytestState(true);
  });
  await expect(page.locator("#walletSummary")).toContainText("0cr");
});

test("admin simulator runs designed encounters for merchant and routejack convoys", async ({ page }) => {
  await openGame(page, "admin", "merchant");

  await expect(page.getByText("Encounter Setup")).toBeVisible();
  await expect(page.getByText("Encounter Rate Calculator")).toBeVisible();
  await expect(page.locator("#encounter-rate-common")).toHaveValue("2.00");
  await expect(page.locator("#encounter-rate-uncommon")).toHaveValue("1.00");
  await expect(page.locator("#encounter-rate-rare")).toHaveValue("0.50");
  await expect(page.getByText("Base Tier Total")).toBeVisible();
  await expect(page.getByText("Player Merchant Convoy")).toBeVisible();
  await expect(page.getByText("NPC Encounter Raiders")).toBeVisible();
  await expect(page.locator("#battleEncounterId option")).toHaveCount(3);
  await expect(page.locator("#battleEncounterId")).toContainText("Static Skimmers");
  await expect(page.locator("#battleEncounterId")).toContainText("Toll Hounds");
  await expect(page.locator("#battleEncounterId")).toContainText("Black Ledger Crew");
  await page.getByRole("button", { name: "Run Batch" }).click();
  await expect(page.locator(".battle-results")).toContainText("Merchant Shipment");
  await expect(page.locator(".battle-results")).toContainText("Static Skimmers");

  await page.locator("#battleEncounterRole").selectOption("routejack");
  await expect(page.getByText("Player Routejack Convoy")).toBeVisible();
  await expect(page.getByText("NPC Encounter Cargo")).toBeVisible();
  await expect(page.locator("#battleEncounterId option")).toHaveCount(3);
  await expect(page.locator("#battleEncounterId")).toContainText("Market Mule");
  await expect(page.locator("#battleEncounterId")).toContainText("Armored Haul");
  await expect(page.locator("#battleEncounterId")).toContainText("Arcology Transfer");
  await page.getByRole("button", { name: "Run One Encounter" }).click();
  await expect(page.locator(".battle-results")).toContainText("Routejack Raid");
  await expect(page.locator(".battle-results")).toContainText("Market Mule");
});

test("route encounters roll during travel and save a battle replay", async ({ page }) => {
  await openGame(page, "shipments", "merchant");

  await page.evaluate(() => {
    addItem("Common Starter Component A", 1, state.district, true);
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog([{
      id: "test-road-ambush",
      role: "merchant",
      label: "Test Road Ambush",
      weight: 1,
      encounterTier: "common",
      rateMultiplier: 9.5,
      routeKinds: ["land"],
      minMiles: 0,
      maxMiles: 999,
      difficulty: 0,
      rarityCeiling: "green",
      attackerClasses: ["runner"],
      cargoUnits: 1,
      clearHours: 1,
      clearReduction: 0.25,
    }]);
    createShipment([{ name: "Common Starter Component A", qty: 1 }], "Common Runner", "lowline", "none");
    const originalRandom = Math.random;
    Math.random = () => 0;
    advanceGameTime(0.25);
    Math.random = originalRandom;
    render();
  });

  await expect.poll(async () => page.evaluate(() => state.routeBattles.length)).toBeGreaterThan(0);
  await expect(page.getByText("Route Battles")).toBeVisible();
  await expect(page.locator(".shipment-card").filter({ hasText: "Test Road Ambush" }).first()).toBeVisible();
});

test("custom npc unit can drive a route battle with core stats", async ({ page }) => {
  await openGame(page, "shipments", "merchant");

  const result = await page.evaluate(() => {
    addItem("Common Starter Component A", 1, state.district, true);
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog([{
      id: "test-route-hazard",
      role: "merchant",
      label: "Test Route Hazard",
      weight: 1,
      encounterTier: "common",
      rateMultiplier: 9.5,
      routeKinds: ["land"],
      minMiles: 0,
      maxMiles: 999,
      difficulty: 4,
      rarityCeiling: "purple",
      cargoUnits: 1,
      waves: [{
        id: "test-breaker-wave",
        label: "Test Breaker Wave",
        attackerUnits: [{
          id: "test-breaker",
          label: "Test Breaker",
          role: "raider",
          rarity: "purple",
          iconName: "cell",
          maxHp: 999,
          attackMin: 999,
          attackMax: 999,
          speed: 200,
          impact: 999,
        }],
      }],
    }]);
    createShipment([{ name: "Common Starter Component A", qty: 1 }], "Common Runner", "lowline", "none");
    const originalRandom = Math.random;
    Math.random = () => 0;
    advanceGameTime(0.25);
    Math.random = originalRandom;
    render();
    return {
      outcome: state.routeBattles[0]?.outcome,
      title: state.routeBattles[0]?.title,
      stolen: state.stolenGoods.length,
      shipmentStatus: state.shipments[0]?.status,
    };
  });

  expect(result.outcome).toBe("stolen");
  expect(result.title).toContain("Test Route Hazard");
  expect(result.stolen).toBe(1);
  expect(result.shipmentStatus).toBe("raided");
  await expect(page.locator(".shipment-card").filter({ hasText: "Cargo Taken" }).first()).toBeVisible();
});
