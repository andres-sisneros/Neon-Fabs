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
