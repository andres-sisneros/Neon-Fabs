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
