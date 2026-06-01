const { test, expect } = require("@playwright/test");

async function openGame(page, view, role = "drifter") {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`/index.html#view=${view}&city=chrome-pier`);
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

test("core screens render without browser errors", async ({ page }, testInfo) => {
  const screens = [
    ["profile", "drifter"],
    ["fabs", "drifter"],
    ["inventory", "drifter"],
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
  await expect(page.getByText("Encounter Designer")).toBeVisible();
  await expect(page.getByText("Seed NPC Traffic")).toHaveCount(0);
  await expect(page.getByText("Clear NPC Traffic")).toHaveCount(0);
});

test("route encounters roll during travel and save a battle replay", async ({ page }) => {
  await openGame(page, "shipments", "merchant");

  await page.evaluate(() => {
    state.routeEncounterCatalog = normalizeRouteEncounterCatalog([{
      id: "test-road-ambush",
      role: "merchant",
      label: "Test Road Ambush",
      weight: 1,
      ratePerHour: 0.95,
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
