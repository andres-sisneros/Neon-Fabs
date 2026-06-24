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
  await page.getByRole("button", { name: "Enter Neon Fabs" }).click();
  await expect(page.locator(".intro-overlay")).toHaveCount(0);
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
  await expect(page.getByText("Admin Route Activity")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Encounter Designer" })).toBeVisible();
  await expect(page.getByText("Enemy Library")).toBeVisible();
  await page.getByText("Raw JSON", { exact: true }).click();
  await expect(page.getByText("Custom NPC Units")).toBeVisible();
  await expect(page.getByText("Seed NPC Traffic")).toHaveCount(0);
  await expect(page.getByText("Clear NPC Traffic")).toHaveCount(0);
});

test("melds page uses compact visual set cards", async ({ page }) => {
  await openGame(page, "melds", "drifter");

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
