import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryRepo, handleRequest } from "../worker/index.mjs";

const ADMIN_TOKEN = "test-admin-token";

function request(path, options = {}) {
  return new Request(`https://beta.neon-fabs.test${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.admin ? { "x-admin-token": ADMIN_TOKEN } : {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

async function call(repo, path, options = {}) {
  const response = await handleRequest(request(path, options), { ADMIN_TOKEN, __repo: repo }, {});
  const body = await response.json();
  return { response, body };
}

async function createTester(repo, displayName, homeCityId = "chrome-pier") {
  const { response, body } = await call(repo, "/api/admin/tester", {
    method: "POST",
    admin: true,
    body: { displayName, homeCityId },
  });
  assert.equal(response.status, 201);
  assert.ok(body.token);
  return body;
}

test("beta API creates a manual tester and loads shared state", async () => {
  const repo = createMemoryRepo();
  const tester = await createTester(repo, "Chrome Yara");

  const session = await call(repo, "/api/session", { token: tester.token });
  assert.equal(session.response.status, 200);
  assert.equal(session.body.authenticated, true);
  assert.equal(session.body.betaWipesExpected, true);

  const state = await call(repo, "/api/state", { token: tester.token });
  assert.equal(state.response.status, 200);
  assert.equal(state.body.user.displayName, "Chrome Yara");
  assert.equal(state.body.fabs.length, 1);
  assert.equal(state.body.pendingOutputs.length, 4);
});

test("beta API collects outputs and creates the first pattern", async () => {
  const repo = createMemoryRepo();
  const tester = await createTester(repo, "Pattern Tester");

  const collected = await call(repo, "/api/fabs/collect", {
    method: "POST",
    token: tester.token,
    body: { cityId: "chrome-pier" },
  });
  assert.equal(collected.response.status, 200);
  assert.equal(collected.body.collected.length, 4);
  assert.equal(collected.body.state.pendingOutputs.length, 0);
  assert.equal(collected.body.state.inventories.reduce((sum, row) => sum + Number(row.qty || 0), 0), 4);

  const pattern = await call(repo, "/api/patterns/create", {
    method: "POST",
    token: tester.token,
    body: { patternId: "common-starter-meld" },
  });
  assert.equal(pattern.response.status, 200);
  assert.equal(pattern.body.created.id, "common-starter-meld");
  assert.equal(pattern.body.state.user.reputation, 10);
});

test("beta API reserves listings and lets another tester buy them", async () => {
  const repo = createMemoryRepo();
  const seller = await createTester(repo, "Seller");
  const buyer = await createTester(repo, "Buyer");

  const sellerSession = await call(repo, "/api/session", { token: seller.token });
  const buyerSession = await call(repo, "/api/session", { token: buyer.token });
  repo.grantInventory(sellerSession.body.user.id, "chrome-pier", "common-starter-a", 2);
  repo.grantCredits(buyerSession.body.user.id, 100);

  const listingResult = await call(repo, "/api/market/list", {
    method: "POST",
    token: seller.token,
    body: { cityId: "chrome-pier", itemId: "common-starter-a", qty: 2, price: 12 },
  });
  assert.equal(listingResult.response.status, 201);

  const buyResult = await call(repo, "/api/market/buy", {
    method: "POST",
    token: buyer.token,
    body: { listingId: listingResult.body.listing.id, qty: 1 },
  });
  assert.equal(buyResult.response.status, 200);
  assert.equal(buyResult.body.bought, 1);
  assert.equal(buyResult.body.state.inventories.find((row) => row.itemId === "common-starter-a").qty, 1);
});

test("beta API recycles inventory and cancels reserved market orders", async () => {
  const repo = createMemoryRepo();
  const tester = await createTester(repo, "Market Steward");
  const session = await call(repo, "/api/session", { token: tester.token });
  repo.grantInventory(session.body.user.id, "chrome-pier", "common-starter-a", 3);
  repo.grantCredits(session.body.user.id, 100);

  const listingResult = await call(repo, "/api/market/list", {
    method: "POST",
    token: tester.token,
    body: { cityId: "chrome-pier", itemId: "common-starter-a", qty: 2, price: 12 },
  });
  assert.equal(listingResult.response.status, 201);

  const canceledListing = await call(repo, "/api/market/cancel-listing", {
    method: "POST",
    token: tester.token,
    body: { listingId: listingResult.body.listing.id },
  });
  assert.equal(canceledListing.response.status, 200);
  assert.equal(canceledListing.body.canceledListing, listingResult.body.listing.id);
  assert.equal(canceledListing.body.state.inventories.find((row) => row.itemId === "common-starter-a").qty, 3);

  const bidResult = await call(repo, "/api/market/bid", {
    method: "POST",
    token: tester.token,
    body: { cityId: "chrome-pier", itemId: "common-starter-b", qty: 2, price: 10 },
  });
  assert.equal(bidResult.response.status, 201);
  assert.equal(bidResult.body.state.user.credits, 80);

  const canceledBid = await call(repo, "/api/market/cancel-bid", {
    method: "POST",
    token: tester.token,
    body: { bidId: bidResult.body.bid.id },
  });
  assert.equal(canceledBid.response.status, 200);
  assert.equal(canceledBid.body.refunded, 20);
  assert.equal(canceledBid.body.state.user.credits, 100);

  const recycled = await call(repo, "/api/inventory/recycle", {
    method: "POST",
    token: tester.token,
    body: { cityId: "chrome-pier", itemId: "common-starter-a", qty: 2 },
  });
  assert.equal(recycled.response.status, 200);
  assert.equal(recycled.body.recycled, 2);
  assert.equal(recycled.body.state.user.credits, 102);
  assert.equal(recycled.body.state.inventories.find((row) => row.itemId === "common-starter-a").qty, 1);
});

test("beta API creates in-transit shipments with reserved vehicle and cargo", async () => {
  const repo = createMemoryRepo();
  const tester = await createTester(repo, "Merchant");
  const session = await call(repo, "/api/session", { token: tester.token });
  repo.grantInventory(session.body.user.id, "chrome-pier", "common-runner", 1);
  repo.grantInventory(session.body.user.id, "chrome-pier", "common-starter-a", 1);

  const shipment = await call(repo, "/api/dispatch/send", {
    method: "POST",
    token: tester.token,
    body: {
      fromCityId: "chrome-pier",
      toCityId: "lowline",
      vehicleItemId: "common-runner",
      cargo: [{ itemId: "common-starter-a", qty: 1 }],
    },
  });
  assert.equal(shipment.response.status, 201);
  assert.equal(shipment.body.shipment.status, "in_transit");
  assert.equal(shipment.body.shipment.encounterJson.mode, "pve-lite");

  const state = await call(repo, "/api/state", { token: tester.token });
  assert.equal(state.body.inventories.length, 0);
  assert.equal(state.body.shipments.length, 1);
});

test("beta API globally advances time and resolves merchant shipment arrivals", async () => {
  const repo = createMemoryRepo();
  const tester = await createTester(repo, "Freight Runner");
  const session = await call(repo, "/api/session", { token: tester.token });
  repo.grantInventory(session.body.user.id, "chrome-pier", "common-runner", 1);
  repo.grantInventory(session.body.user.id, "chrome-pier", "common-starter-a", 2);

  const shipment = await call(repo, "/api/dispatch/send", {
    method: "POST",
    token: tester.token,
    body: {
      fromCityId: "chrome-pier",
      toCityId: "lowline",
      vehicleItemId: "common-runner",
      cargo: [{ itemId: "common-starter-a", qty: 2 }],
    },
  });
  assert.equal(shipment.response.status, 201);

  const advanced = await call(repo, "/api/admin/time/advance", {
    method: "POST",
    token: tester.token,
    admin: true,
    body: { hours: 3 },
  });
  assert.equal(advanced.response.status, 200);
  assert.equal(advanced.body.advancedHours, 3);
  assert.ok(advanced.body.state.user.credits > 0);
  assert.equal(advanced.body.state.inventories.find((row) => row.cityId === "lowline" && row.itemId === "common-runner").qty, 1);
  assert.equal(advanced.body.state.inventories.find((row) => row.cityId === "lowline" && row.itemId === "common-starter-a").qty, 2);
  const arrived = advanced.body.state.shipments.find((row) => row.id === shipment.body.shipment.id);
  assert.equal(arrived.status, "arrived");
  assert.equal(arrived.encounterJson.rolled, true);
  assert.ok(arrived.encounterJson.note);
  assert.ok(arrived.encounterJson.freightPayout > 0);
});

test("beta API uses one shared server clock for multiple accounts", async () => {
  const repo = createMemoryRepo();
  const alpha = await createTester(repo, "Clock Alpha");
  const beta = await createTester(repo, "Clock Beta");

  await call(repo, "/api/fabs/collect", {
    method: "POST",
    token: alpha.token,
    body: { cityId: "chrome-pier" },
  });
  await call(repo, "/api/fabs/collect", {
    method: "POST",
    token: beta.token,
    body: { cityId: "chrome-pier" },
  });

  const advanced = await call(repo, "/api/admin/time/advance", {
    method: "POST",
    token: alpha.token,
    admin: true,
    body: { hours: 1 },
  });
  assert.equal(advanced.response.status, 200);
  assert.ok(advanced.body.state.pendingOutputs.length > 0);
  assert.ok(advanced.body.state.beta.clockOffsetMs >= 3600000);

  const betaState = await call(repo, "/api/state", { token: beta.token });
  assert.equal(betaState.response.status, 200);
  assert.ok(betaState.body.pendingOutputs.length > 0);
  assert.ok(betaState.body.beta.clockOffsetMs >= 3600000);
});
