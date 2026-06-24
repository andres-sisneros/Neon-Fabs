// Game content, tuning tables, and default prototype state. Loaded before app.js.
const LEGACY_SAVE_PREFIX = "neon-fabs";
const PLAYTEST_SAVE_KEY = "neon-fabs.playtest.v1";
const PLAYTEST_SAVE_VERSION = 1;

const BASE_BATTERY_CAPACITY = 86400;
const MELD_BATTERY_BONUS = 3600;
const ROLL_GRAMS = 1;
const GOLD_PER_GRAM = 1;
const HOME_CITY_RATE_BONUS = 0.1;
const MIN_ROUTE_RISK = 2;
const MAX_ACTIVE_FABS = 3;
const MARKET_SELLER_NAMES = ["ByteLot", "ChromeBroker", "PatchVendor", "SignalCartel", "NeonKiosk"];
const MARKET_BUYER_NAMES = ["StreetBuyer", "MeldRunner", "NightDesk", "RelayBuyer", "ScrapDesk"];
const LORE_TONE = "contract drifters, civic matter, sleeper crews, and machine-made scarcity";
const STARTER_HOME_CITIES = ["chrome-pier", "orchid"];

const rarityMeta = {
  green: { label: "Common", weight: 1000, accent: "#78ff88" },
  blue: { label: "Uncommon", weight: 200, accent: "#24bff2" },
  gold: { label: "Rare", weight: 100, accent: "#ffd447" },
  purple: { label: "Epic", weight: 10, accent: "#b46bff" },
  orange: { label: "Legendary", weight: 1, accent: "#ff9e2d" },
};

const rarityOrder = ["green", "blue", "gold", "purple", "orange"];

const REP_MELD_REWARDS = {
  green: 10,
  blue: 25,
  gold: 60,
  purple: 160,
  orange: 400,
};

const reputationTracks = {
  collection: { label: "Collection Rep", shortLabel: "Collection" },
  market: { label: "Market Rep", shortLabel: "Market" },
  route: { label: "Route Rep", shortLabel: "Routes" },
  fab: { label: "Fab Rep", shortLabel: "Fabs" },
};

const reputationTitles = [
  { min: 0, label: "Unknown Signal", flavor: "A new handle on the local mesh." },
  { min: 10, label: "Local Name", flavor: "People have started to recognize your work." },
  { min: 50, label: "Street Verified", flavor: "Your output has a traceable reputation." },
  { min: 150, label: "District Known", flavor: "Your home city knows your handle." },
  { min: 400, label: "City Figure", flavor: "Your prints and deals move city gossip." },
  { min: 900, label: "Network Famous", flavor: "Your rep travels faster than your cargo." },
  { min: 1800, label: "Mythic Operator", flavor: "Your name is part of the network folklore." },
];

const reputationBoardSeed = [
  { name: "Glass Nomad", rep: 860, title: "City Figure", city: "Vanta Arcology", track: "Routes" },
  { name: "Orchid Proxy", rep: 420, title: "City Figure", city: "Orchid Sprawl", track: "Collection" },
  { name: "Patch Saint", rep: 210, title: "District Known", city: "Helix Quay", track: "Fabs" },
  { name: "Chrome Yara", rep: 95, title: "Street Verified", city: "Chrome Pier", track: "Market" },
  { name: "Lowline Echo", rep: 35, title: "Local Name", city: "Lowline", track: "Collection" },
];

const defaultNoItemWeight = () => Object.values(rarityMeta).reduce((sum, meta) => sum + meta.weight, 0);

const fabTypeLabels = {
  starter: "Starter Fab",
  food: "Food Melds",
  vehicle: "Vehicles",
  aquatic: "Aquatic Vehicles",
  boost: "Boosts",
  nethack: "Nethack Bursts",
  cyberware: "Cyberware",
  security: "Security",
  music: "Music",
  luxury: "Luxury",
  equipment: "Equipment",
  weapons: "Weapons",
};

const equipmentSlots = [
  { id: "motherboard", label: "Motherboard" },
  { id: "extruder", label: "Extruder" },
  { id: "printBed", label: "Print Bed" },
  { id: "stepperMotors", label: "Stepper Motors" },
];

const equipmentTierStats = {
  green: { tier: "Common", rateBonus: 0.05, value: 180 },
  blue: { tier: "Uncommon", rateBonus: 0.12, value: 620 },
  gold: { tier: "Rare", rateBonus: 0.25, value: 1800 },
  purple: { tier: "Epic", rateBonus: 0.45, value: 5400 },
  orange: { tier: "Legendary", rateBonus: 0.75, value: 16000 },
};

const marketCategories = {
  all: "All",
  meld: "Meld Components",
  vehicle: "Vehicles",
  boost: "Boosts",
  gear: "Gear",
  cyberware: "Cyberware",
};

const fabCatalog = [
  { type: "starter", label: "Starter Fab", category: "Meld", buyPrice: 1200, rentPrice: 120, rentHours: 168, rate: 12, cities: ["chrome-pier", "orchid"] },
  { type: "food", label: "Food Meld Fab", category: "Meld", buyPrice: 1500, rentPrice: 150, rentHours: 168, rate: 12, cities: ["orchid", "vanta"] },
  { type: "vehicle", label: "Vehicle Fab", category: "Route", buyPrice: 1800, rentPrice: 180, rentHours: 168, rate: 12, cities: ["lowline", "chrome-pier", "helix"] },
  { type: "aquatic", label: "Aquatic Vehicle Fab", category: "Route", buyPrice: 2200, rentPrice: 220, rentHours: 168, rate: 12, cities: ["orchid", "vanta"] },
  { type: "boost", label: "Boost Fab", category: "Boost", buyPrice: 2400, rentPrice: 240, rentHours: 168, rate: 12, cities: ["chrome-pier", "helix"] },
  { type: "nethack", label: "Nethack Boost Fab", category: "Boost", buyPrice: 3000, rentPrice: 300, rentHours: 168, rate: 12, cities: ["lowline", "vanta"] },
  { type: "equipment", label: "Equipment Fab", category: "Gear", buyPrice: 3600, rentPrice: 360, rentHours: 168, rate: 12, cities: ["chrome-pier", "helix"] },
];

const fabShopCategories = ["all", "Meld", "Route", "Boost", "Gear"];

const defaultContractStats = () => ({
  outputsCollected: 0,
  itemsBought: 0,
  itemsSold: 0,
  itemsRecycled: 0,
  meldsFused: 0,
  equipmentEquipped: 0,
  boostsUsed: 0,
  shipmentsSent: 0,
});

const contractCatalog = [
  {
    id: "collect-first-print-run",
    chain: "New Operator",
    group: "1. Fab Operations",
    title: "First Print Run",
    description: "Open the first four sealed prints from your home city's Print Bay.",
    target: 4,
    metric: "outputsCollected",
    view: "fabs",
    reward: { credits: 180 },
  },
  {
    id: "fuse-first-meld",
    chain: "New Operator",
    group: "2. Patterns",
    title: "Create A Stable Pattern",
    description: "Use your first print run to create one pattern in your home city.",
    target: 1,
    metric: "meldsFused",
    view: "melds",
    reward: { credits: 420, chips: 1 },
    requires: ["collect-first-print-run"],
  },
  {
    id: "market-sell-3",
    chain: "New Operator",
    group: "3. Market",
    title: "Find Local Demand",
    description: "Sell three items to local bids. Bulk sales count.",
    target: 3,
    metric: "itemsSold",
    view: "shop",
    reward: { credits: 300 },
    requires: ["fuse-first-meld"],
  },
  {
    id: "market-buy-1",
    chain: "New Operator",
    group: "4. Market",
    title: "Source A Missing Part",
    description: "Buy one item from any city market listing.",
    target: 1,
    metric: "itemsBought",
    view: "shop",
    reward: { credits: 180 },
    requires: ["market-sell-3"],
  },
  {
    id: "send-first-shipment",
    chain: "New Operator",
    group: "5. Dispatch",
    title: "Open A Route",
    description: "Send one cargo shipment from Dispatch.",
    target: 1,
    metric: "shipmentsSent",
    view: "shipments",
    reward: { credits: 600 },
    requires: ["market-buy-1"],
  },
  {
    id: "second-fab-slot",
    chain: "New Operator",
    group: "6. Expansion",
    title: "Run A Second Fab",
    description: "Own or rent a second active fab when you are ready to expand.",
    target: 2,
    view: "fab-shop",
    reward: { credits: 420 },
    requires: ["send-first-shipment"],
    progress: () => state.fabs.length,
  },
  {
    id: "equip-first-gear",
    chain: "New Operator",
    group: "7. Fabs",
    title: "Tune A Machine",
    description: "Equip one gear upgrade onto a fab.",
    target: 1,
    metric: "equipmentEquipped",
    view: "fabs",
    reward: { credits: 450 },
    requires: ["second-fab-slot"],
  },
];

const defaultBattleSim = () => ({
  from: "lowline",
  to: "chrome-pier",
  encounterRole: "merchant",
  encounterId: "static-skimmers",
  encounterWaveId: "random",
  attackerVehicle: "Common Interceptor",
  attackerSupport1: "Common Runner",
  attackerSupport2: "none",
  attackerUnits: [],
  replaceAttackers: false,
  defenderVehicle: "Common Runner",
  defenderEscort1: "Common Guardian",
  defenderEscort2: "none",
  defenderUnits: [],
  replaceDefenders: false,
  cargo: "Common Starter Component A",
  cargoUnits: 2,
  attackerRole: "routejack",
  defenderRole: "merchant",
  lootPolicy: "upgrade",
  runs: 250,
  attackBonus: 0,
  defenseBonus: 0,
  modules: defaultBattleModules(),
});

function defaultBattleModules() {
  return {
    attackerVehicle: { standard1: "exhaust-hack", standard2: "seeker-array", overdrive: "breach-lance" },
    attackerSupport1: { standard1: "corrosion-payload", standard2: "none", overdrive: "lockdown-net" },
    attackerSupport2: { standard1: "none", standard2: "none", overdrive: "none" },
    defenderVehicle: { standard1: "umbrella-shield", standard2: "patch-cloud", overdrive: "survival-core" },
    defenderEscort1: { standard1: "cargo-bulwark", standard2: "retaliation-coil", overdrive: "signal-bugle" },
    defenderEscort2: { standard1: "none", standard2: "none", overdrive: "none" },
  };
}

function defaultBattleBuilds() {
  const buildA = cloneBattleSettings(defaultBattleSim());
  const buildB = cloneBattleSettings({
    ...defaultBattleSim(),
    attackerVehicle: "Common Interceptor",
    attackerSupport1: "Common Runner",
    defenderVehicle: "Common Freighter",
    defenderEscort1: "Common Guardian",
    modules: {
      ...defaultBattleModules(),
      attackerVehicle: { standard1: "seeker-array", standard2: "exhaust-hack", overdrive: "breach-lance" },
      defenderVehicle: { standard1: "umbrella-shield", standard2: "patch-cloud", overdrive: "survival-core" },
    },
  });
  return {
    a: { name: "Build A", settings: buildA, savedAt: null },
    b: { name: "Build B", settings: buildB, savedAt: null },
  };
}

const battleUnitModuleSlots = [
  { key: "attackerVehicle", label: "Attacker Lead" },
  { key: "attackerSupport1", label: "Attacker Support 1" },
  { key: "attackerSupport2", label: "Attacker Support 2" },
  { key: "defenderVehicle", label: "Cargo Vehicle" },
  { key: "defenderEscort1", label: "Escort 1" },
  { key: "defenderEscort2", label: "Escort 2" },
];

const encounterTierMeta = {
  common: { label: "Common", rarity: "green", defaultRatePerMile: 0.02 },
  uncommon: { label: "Uncommon", rarity: "blue", defaultRatePerMile: 0.01 },
  rare: { label: "Rare", rarity: "gold", defaultRatePerMile: 0.005 },
};

function defaultEncounterRatesPerMile() {
  return Object.fromEntries(Object.entries(encounterTierMeta).map(([tier, meta]) => [tier, meta.defaultRatePerMile]));
}

const routeModuleCatalog = [
  {
    id: "cargo-bulwark",
    label: "Cargo Defense Module",
    type: "standard",
    summary: "Adds integrity, starting shield, and Brave chance for escort protection.",
    integrity: 18,
    startShield: 10,
    braveBonus: 14,
  },
  {
    id: "exhaust-hack",
    label: "Initiative Jam Module",
    type: "standard",
    summary: "Reduces target initiative and weakens the target's next hit.",
    impact: 2,
    exhaustInitiative: 16,
    exhaustImpactDown: 4,
  },
  {
    id: "patch-cloud",
    label: "Repair Module",
    type: "standard",
    summary: "Repairs the most damaged ally after attacks.",
    integrity: 8,
    healAllyOnAttack: 6,
  },
  {
    id: "seeker-array",
    label: "Targeting Module",
    type: "standard",
    summary: "Targets the weakest enemy and hits damaged units harder.",
    speed: 3,
    targetLowestHp: true,
    damageVsDamaged: 0.35,
  },
  {
    id: "retaliation-coil",
    label: "Counterattack Module",
    type: "standard",
    summary: "Damages attackers back when this unit takes damage.",
    integrity: 10,
    retaliation: 7,
  },
  {
    id: "corrosion-payload",
    label: "Damage Over Time Module",
    type: "standard",
    summary: "Applies damage-over-time stacks.",
    impact: 1,
    poisonStacks: 2,
  },
  {
    id: "umbrella-shield",
    label: "Shield Module",
    type: "standard",
    summary: "Gives a chance to reduce incoming damage.",
    integrity: 14,
    mitigationChance: 38,
    mitigationFlat: 9,
  },
  {
    id: "signal-bugle",
    label: "Team Buff Overdrive",
    type: "overdrive",
    summary: "Gives allies impact and shield.",
    teamImpactBuff: 2,
    teamShield: 6,
  },
  {
    id: "breach-lance",
    label: "Cargo Strike Overdrive",
    type: "overdrive",
    summary: "Hits cargo directly and ignores Brave.",
    breach: true,
  },
  {
    id: "field-forge",
    label: "Stat Buff Overdrive",
    type: "overdrive",
    summary: "Upgrades one ally's route stats for the run.",
    forge: true,
  },
  {
    id: "black-box",
    label: "Random Effect Overdrive",
    type: "overdrive",
    summary: "Rolls one powerful random effect at battle start.",
    blackBox: true,
  },
  {
    id: "survival-core",
    label: "Survival Overdrive",
    type: "overdrive",
    summary: "Gives cargo an emergency shield. Future route-avoidance hooks stay outside the current HP-only battle layer.",
    shieldBonus: 12,
  },
  {
    id: "lockdown-net",
    label: "Slow Overdrive",
    type: "overdrive",
    summary: "Slows and delays every enemy.",
    slowAll: 5,
    initiativeDownAll: 24,
  },
];

const defaultNpcCombatUnitCatalog = [
  {
    id: "static-skimmer",
    label: "Static Skimmer",
    role: "raider",
    rarity: "green",
    iconName: "data",
    maxHp: 42,
    attackMin: 7,
    attackMax: 11,
    speed: 24,
    impact: 9,
    summary: "Cheap sensor-noise raider. Fast enough to matter, fragile enough for early convoys.",
  },
  {
    id: "toll-hound",
    label: "Toll Hound",
    role: "raider",
    rarity: "blue",
    iconName: "tool",
    maxHp: 72,
    attackMin: 12,
    attackMax: 18,
    speed: 20,
    impact: 15,
    summary: "Road crew enforcer tuned for steady pressure against cargo frames.",
  },
  {
    id: "black-ledger-knife",
    label: "Black Ledger Knife",
    role: "raider",
    rarity: "purple",
    iconName: "chip",
    maxHp: 96,
    attackMin: 18,
    attackMax: 24,
    speed: 26,
    impact: 21,
    summary: "Elite route predator. It hits cargo hard and makes rare encounters feel dangerous.",
  },
  {
    id: "tar-wraith",
    label: "Tar Wraith",
    role: "raider",
    rarity: "purple",
    iconName: "cell",
    maxHp: 160,
    attackMin: 24,
    attackMax: 32,
    speed: 8,
    impact: 28,
    futureHooks: ["hard to survive", "vehicle damage", "non-theft hazard"],
    summary: "Slow route anomaly concept. Currently just a heavy, slow combat unit; route-horror mechanics are future candidates.",
  },
  {
    id: "market-mule-cargo",
    label: "Market Mule Cargo",
    role: "cargo",
    rarity: "green",
    iconName: "poly",
    maxHp: 62,
    attackMin: 2,
    attackMax: 6,
    speed: 18,
    impact: 4,
    summary: "Light NPC cargo target for early Routejack raids.",
  },
  {
    id: "armored-hauler",
    label: "Armored Hauler",
    role: "cargo",
    rarity: "gold",
    iconName: "chip",
    maxHp: 120,
    attackMin: 5,
    attackMax: 9,
    speed: 12,
    impact: 7,
    summary: "Slower, richer NPC cargo target that needs a real raid convoy to crack.",
  },
  {
    id: "arcology-vault-hauler",
    label: "Arcology Vault Hauler",
    role: "cargo",
    rarity: "orange",
    iconName: "cell",
    maxHp: 168,
    attackMin: 8,
    attackMax: 12,
    speed: 13,
    impact: 10,
    summary: "High-value civic transfer target with enough integrity to punish weak Routejack builds.",
  },
  {
    id: "ledger-escort",
    label: "Ledger Escort",
    role: "escort",
    rarity: "blue",
    iconName: "lens",
    maxHp: 76,
    attackMin: 9,
    attackMax: 15,
    speed: 18,
    impact: 12,
    braveChance: 34,
    summary: "NPC guard that can jump in front of attacks meant for cargo.",
  },
  {
    id: "vault-sentinel",
    label: "Vault Sentinel",
    role: "escort",
    rarity: "purple",
    iconName: "tool",
    maxHp: 112,
    attackMin: 15,
    attackMax: 21,
    speed: 16,
    impact: 18,
    braveChance: 48,
    summary: "Heavy escort for rare target waves.",
  },
];

const defaultRouteEncounterCatalog = [
  {
    id: "static-skimmers",
    role: "merchant",
    label: "Static Skimmers",
    weight: 70,
    encounterTier: "common",
    rateMultiplier: 1,
    routeKinds: ["land", "water"],
    minMiles: 0,
    maxMiles: 150,
    difficulty: 0,
    rarityCeiling: "green",
    attackerClasses: ["runner"],
    cargoUnits: 1,
    waves: [
      {
        id: "static-single",
        label: "Single Skimmer",
        weight: 3,
        attackerUnits: ["static-skimmer"],
      },
      {
        id: "static-pair",
        label: "Skimmer Pair",
        weight: 1,
        attackerUnits: ["static-skimmer", "static-skimmer"],
      },
    ],
    clearHours: 1.5,
    clearReduction: 0.25,
    summary: "Weak opportunists. Common enough to make quiet routes feel alive.",
  },
  {
    id: "toll-hounds",
    role: "merchant",
    label: "Toll Hounds",
    weight: 35,
    encounterTier: "uncommon",
    rateMultiplier: 1,
    routeKinds: ["land"],
    minMiles: 90,
    maxMiles: 220,
    difficulty: 1,
    rarityCeiling: "blue",
    attackerClasses: ["interceptor", "runner"],
    cargoUnits: 1,
    waves: [
      {
        id: "toll-hound-roadblock",
        label: "Roadblock Hound",
        attackerUnits: ["toll-hound"],
      },
      {
        id: "hound-and-skimmer",
        label: "Hound With Skimmer",
        weight: 1,
        attackerUnits: ["toll-hound", "static-skimmer"],
      },
    ],
    clearHours: 2.5,
    clearReduction: 0.35,
    summary: "A harder road ambush. Beating them stabilizes the route for everyone.",
  },
  {
    id: "black-ledger-crew",
    role: "merchant",
    label: "Black Ledger Crew",
    weight: 10,
    encounterTier: "rare",
    rateMultiplier: 1,
    routeKinds: ["land", "water"],
    minMiles: 120,
    maxMiles: 999,
    difficulty: 3,
    rarityCeiling: "purple",
    attackerClasses: ["interceptor"],
    attackerSupportClasses: ["runner", "guardian"],
    supportChance: 0.6,
    cargoUnits: 2,
    waves: [
      {
        id: "ledger-knife",
        label: "Black Ledger Knife",
        attackerUnits: ["black-ledger-knife", "static-skimmer"],
      },
    ],
    clearHours: 4,
    clearReduction: 0.45,
    summary: "Rare, dangerous routejacks. Clearing one should feel like news.",
  },
  {
    id: "market-mule",
    role: "routejack",
    label: "Market Mule",
    weight: 68,
    encounterTier: "common",
    rateMultiplier: 1,
    routeKinds: ["land", "water"],
    minMiles: 0,
    maxMiles: 170,
    difficulty: 0,
    rarityCeiling: "green",
    vehicleClasses: ["runner", "freighter"],
    escortChance: 0.05,
    cargoUnits: 1,
    waves: [
      {
        id: "market-mule-light",
        label: "Market Mule",
        defenderUnits: ["market-mule-cargo"],
      },
    ],
    summary: "Low-risk NPC cargo target for early Routejack tuning.",
  },
  {
    id: "armored-haul",
    role: "routejack",
    label: "Armored Haul",
    weight: 28,
    encounterTier: "uncommon",
    rateMultiplier: 1,
    routeKinds: ["land"],
    minMiles: 70,
    maxMiles: 240,
    difficulty: 2,
    rarityCeiling: "gold",
    vehicleClasses: ["freighter"],
    escortChance: 0.45,
    cargoUnits: 2,
    waves: [
      {
        id: "armored-haul-escort",
        label: "Armored Haul",
        defenderUnits: ["armored-hauler", "ledger-escort"],
      },
    ],
    summary: "Better rewards, more protection. The first real Routejack check.",
  },
  {
    id: "arcology-transfer",
    role: "routejack",
    label: "Arcology Transfer",
    weight: 8,
    encounterTier: "rare",
    rateMultiplier: 1,
    routeKinds: ["land", "water"],
    minMiles: 140,
    maxMiles: 999,
    difficulty: 4,
    rarityCeiling: "orange",
    vehicleClasses: ["freighter"],
    escortChance: 0.8,
    cargoUnits: 3,
    waves: [
      {
        id: "arcology-vault-transfer",
        label: "Arcology Vault Transfer",
        defenderUnits: ["arcology-vault-hauler", "vault-sentinel", "ledger-escort"],
      },
    ],
    summary: "Rare high-value target. Good test bed for aspirational raid convoys.",
  },
];

const districts = [
  {
    id: "lowline",
    name: "Lowline",
    fare: 0,
    priceBias: 1,
    inventoryLimit: 120,
    map: { x: 28, y: 67 },
    fabs: ["vehicle", "nethack"],
    routes: [
      { to: "chrome-pier", miles: 72 },
      { to: "orchid", miles: 105 },
    ],
    description: "A stacked transit ward where first-run operators start with cheap space and noisy markets.",
  },
  {
    id: "chrome-pier",
    name: "Chrome Pier",
    fare: 45,
    priceBias: 1.18,
    inventoryLimit: 96,
    map: { x: 43, y: 35 },
    fabs: ["starter", "vehicle", "boost", "equipment"],
    routes: [
      { to: "lowline", miles: 72 },
      { to: "vanta", miles: 156 },
      { to: "helix", miles: 190 },
    ],
    description: "Port-side chop shops and container bazaars. Good for route gear once transport exists.",
  },
  {
    id: "vanta",
    name: "Vanta Arcology",
    fare: 65,
    priceBias: 1.34,
    inventoryLimit: 88,
    map: { x: 76, y: 28 },
    fabs: ["food", "aquatic", "nethack"],
    routes: [
      { to: "chrome-pier", miles: 156 },
      { to: "orchid", miles: 220, type: "water" },
    ],
    description: "A sealed tower market with premium buyers, tight storage, and expensive everything.",
  },
  {
    id: "orchid",
    name: "Orchid Sprawl",
    fare: 80,
    priceBias: 1.52,
    inventoryLimit: 108,
    map: { x: 20, y: 30 },
    fabs: ["starter", "food", "aquatic"],
    routes: [
      { to: "lowline", miles: 105 },
      { to: "vanta", miles: 220, type: "water" },
    ],
    description: "Night markets, bootleg labels, and fashion stalls spread under magenta rain shields.",
  },
  {
    id: "helix",
    name: "Helix Quay",
    fare: 100,
    priceBias: 1.76,
    inventoryLimit: 92,
    map: { x: 72, y: 70 },
    fabs: ["equipment", "boost", "vehicle"],
    routes: [{ to: "chrome-pier", miles: 190 }],
    description: "An industrial waterfront where useful fabs will eventually become dangerous business.",
  },
];

const qualityLabel = (rarity) => rarityMeta[rarity].label;
const componentLetters = ["A", "B", "C"];
const componentIcons = ["poly", "chip", "lens"];
const componentBaseValues = { green: 5, blue: 24, gold: 130, purple: 620, orange: 2600 };

function makeComponentItems(prefix, use) {
  return rarityOrder.flatMap((rarity) => componentLetters.map((letter, index) => ({
    name: `${qualityLabel(rarity)} ${prefix} Component ${letter}`,
    iconName: componentIcons[index],
    rarity,
    value: componentBaseValues[rarity] + index,
    description: `${qualityLabel(rarity)} ${prefix.toLowerCase()} meld component ${letter}. Placeholder name for design clarity.`,
    use,
  })));
}

const starterItems = makeComponentItems("Starter", "Starter meld component.");
const foodItems = makeComponentItems("Food", "Food meld component.");

const vehicleClassLabels = {
  runner: "Runner",
  freighter: "Freighter",
  interceptor: "Interceptor",
  guardian: "Guardian",
};

const vehicleClassProfileBase = {
  runner: 22,
  freighter: 58,
  interceptor: 36,
  guardian: 46,
};

const vehicleClassSensorBase = {
  runner: 24,
  freighter: 14,
  interceptor: 48,
  guardian: 30,
};

function vehicleProfileForClass(classId, tierIndex, routeMode) {
  const waterAdjustment = routeMode === "water" ? 4 : 0;
  return Math.max(8, Math.min(80, (vehicleClassProfileBase[classId] || 40) + waterAdjustment - tierIndex * 3));
}

function vehicleSensorForClass(classId, tierIndex, routeMode) {
  const waterAdjustment = routeMode === "water" ? 2 : 0;
  return Math.max(5, Math.min(80, (vehicleClassSensorBase[classId] || 24) + waterAdjustment + tierIndex * 5));
}

function profileBand(score) {
  if (score <= 28) return "Low";
  if (score <= 48) return "Medium";
  return "High";
}

const landVehicleClassDefs = [
  {
    id: "runner",
    label: "Runner",
    description: "Fast route craft for light cargo, scouting, and evasive shipping work.",
    tiers: [
      ["Common Runner", "tool", 70, 2, 38, 5, "Common Runner placeholder: fast, light cargo, low durability."],
      ["Uncommon Runner", "cell", 260, 3, 52, 8, "Uncommon Runner placeholder: faster light transport."],
      ["Rare Runner", "data", 860, 4, 62, 11, "Rare Runner placeholder: fast transport with a flexible small hold."],
      ["Epic Runner", "lens", 2800, 5, 78, 16, "Epic Runner placeholder: very fast transport."],
      ["Legendary Runner", "data", 8200, 6, 96, 24, "Legendary Runner placeholder: fastest runner with modest cargo."],
    ],
  },
  {
    id: "freighter",
    label: "Freighter",
    description: "Cargo-first vehicles with more slots, slower speeds, and steadier route frames.",
    tiers: [
      ["Common Freighter", "tool", 90, 6, 26, 7, "Common Freighter placeholder: slow cargo platform with a larger hold."],
      ["Uncommon Freighter", "chip", 320, 8, 36, 10, "Uncommon Freighter placeholder: better speed and durability."],
      ["Rare Freighter", "chip", 900, 10, 48, 14, "Rare Freighter placeholder: reliable mid-tier cargo hauler."],
      ["Epic Freighter", "poly", 3100, 12, 54, 19, "Epic Freighter placeholder: heavy cargo route vehicle."],
      ["Legendary Freighter", "data", 9000, 16, 68, 28, "Legendary Freighter placeholder: premium high-capacity cargo hauler."],
    ],
  },
  {
    id: "interceptor",
    label: "Interceptor",
    description: "Aggressive pursuit frames for Routejacks, interdiction, and theft-focused route builds.",
    tiers: [
      ["Common Interceptor", "tool", 85, 2, 42, 4, "Common Interceptor placeholder: attack-focused with a small loot hold."],
      ["Uncommon Interceptor", "cell", 300, 3, 56, 7, "Uncommon Interceptor placeholder: faster attack vehicle."],
      ["Rare Interceptor", "lens", 980, 4, 68, 10, "Rare Interceptor placeholder: stronger pursuit stats."],
      ["Epic Interceptor", "data", 3300, 5, 84, 14, "Epic Interceptor placeholder: high-speed raider with extra loot space."],
      ["Legendary Interceptor", "chip", 9800, 6, 104, 22, "Legendary Interceptor placeholder: top pursuit vehicle."],
    ],
  },
  {
    id: "guardian",
    label: "Guardian",
    description: "Defensive convoy frames for escorts, guarded hauls, and cargo protection.",
    tiers: [
      ["Common Guardian", "tool", 80, 2, 30, 8, "Common Guardian placeholder: defensive escort."],
      ["Uncommon Guardian", "poly", 280, 3, 40, 12, "Uncommon Guardian placeholder: better escort durability."],
      ["Rare Guardian", "chip", 920, 4, 46, 17, "Rare Guardian placeholder: defensive escort with useful cargo room."],
      ["Epic Guardian", "cell", 3000, 5, 58, 22, "Epic Guardian placeholder: durable convoy support."],
      ["Legendary Guardian", "data", 8800, 6, 70, 32, "Legendary Guardian placeholder: top defensive escort."],
    ],
  },
];

const aquaticVehicleClassDefs = [
  {
    id: "runner",
    label: "Water Runner",
    description: "Fast water craft for light cargo, canal scouting, and evasive flood-lane work.",
    tiers: [
      ["Common Water Runner", "tool", 120, 2, 28, 5, "Common Water Runner placeholder: light water transport."],
      ["Uncommon Water Runner", "cell", 360, 3, 38, 8, "Uncommon Water Runner placeholder: faster light water transport."],
      ["Rare Water Runner", "data", 1150, 4, 48, 11, "Rare Water Runner placeholder: light water transport with a flexible hold."],
      ["Epic Water Runner", "lens", 3400, 5, 60, 17, "Epic Water Runner placeholder: very fast water transport."],
      ["Legendary Water Runner", "data", 9600, 6, 76, 25, "Legendary Water Runner placeholder: top water runner."],
    ],
  },
  {
    id: "freighter",
    label: "Water Freighter",
    description: "Slow, steady water cargo platforms with larger holds.",
    tiers: [
      ["Common Water Freighter", "tool", 130, 6, 20, 7, "Common Water Freighter placeholder: slow cargo hull with a larger hold."],
      ["Uncommon Water Freighter", "poly", 390, 8, 30, 10, "Uncommon Water Freighter placeholder: better water cargo frame."],
      ["Rare Water Freighter", "chip", 1100, 10, 42, 13, "Rare Water Freighter placeholder: reliable water cargo hauler."],
      ["Epic Water Freighter", "cell", 3600, 12, 50, 20, "Epic Water Freighter placeholder: heavy water cargo platform."],
      ["Legendary Water Freighter", "data", 10400, 16, 62, 30, "Legendary Water Freighter placeholder: premium high-capacity water hauler."],
    ],
  },
  {
    id: "interceptor",
    label: "Water Interceptor",
    description: "Pursuit hulls for water-route interdiction and theft-focused route builds.",
    tiers: [
      ["Common Water Interceptor", "tool", 125, 2, 34, 4, "Common Water Interceptor placeholder: attack-focused water vehicle with a small loot hold."],
      ["Uncommon Water Interceptor", "cell", 420, 3, 44, 7, "Uncommon Water Interceptor placeholder: faster water pursuit."],
      ["Rare Water Interceptor", "lens", 1300, 4, 56, 11, "Rare Water Interceptor placeholder: stronger water pursuit stats."],
      ["Epic Water Interceptor", "data", 3900, 5, 68, 15, "Epic Water Interceptor placeholder: high-speed water raider with extra loot space."],
      ["Legendary Water Interceptor", "chip", 11200, 6, 84, 24, "Legendary Water Interceptor placeholder: top water pursuit vehicle."],
    ],
  },
  {
    id: "guardian",
    label: "Water Guardian",
    description: "Protective hulls for defended shipments, escorted hauls, and convoy pressure.",
    tiers: [
      ["Common Water Guardian", "tool", 115, 2, 24, 8, "Common Water Guardian placeholder: defensive water escort."],
      ["Uncommon Water Guardian", "poly", 380, 3, 34, 12, "Uncommon Water Guardian placeholder: better water escort durability."],
      ["Rare Water Guardian", "chip", 1180, 4, 42, 17, "Rare Water Guardian placeholder: defensive water escort with useful cargo room."],
      ["Epic Water Guardian", "cell", 3700, 5, 52, 22, "Epic Water Guardian placeholder: durable water convoy support."],
      ["Legendary Water Guardian", "data", 10800, 6, 66, 32, "Legendary Water Guardian placeholder: top water guardian."],
    ],
  },
];

function vehicleItemsFromClasses(classDefs, routeMode) {
  return classDefs.flatMap((classDef) => classDef.tiers.map(([name, iconName, value, capacity, mph, durability, description], tierIndex) => {
    const profile = vehicleProfileForClass(classDef.id, tierIndex, routeMode);
    const sensor = vehicleSensorForClass(classDef.id, tierIndex, routeMode);
    return {
      name,
      iconName,
      rarity: rarityOrder[tierIndex],
      value,
      capacity,
      mph,
      durability,
      profile,
      sensor,
      routeMode,
      vehicleClass: classDef.id,
      printPattern: classDef.id,
      classLabel: classDef.label,
      battleRole: classDef.id,
      description,
      use: `${classDef.label} class. Moves up to ${capacity} item${capacity === 1 ? "" : "s"} along ${routeMode} routes. ${profileBand(profile)} profile, ${sensor} sensor.`,
    };
  }));
}

const vehicleItems = vehicleItemsFromClasses(landVehicleClassDefs, "land");
const aquaticVehicleItems = vehicleItemsFromClasses(aquaticVehicleClassDefs, "water");

const starterFab = {
  label: "Starter Fab",
  group: "Starter Components",
  accent: "#24bff2",
  items: starterItems,
};

const foodFab = {
  label: "Food Meld Fab",
  group: "Food Components",
  accent: "#35d6b4",
  items: foodItems,
};

const vehicleFab = {
  label: "Vehicle Fab",
  group: "Route Vehicles",
  accent: "#78ff88",
  items: vehicleItems,
};

const aquaticFab = {
  label: "Aquatic Vehicle Fab",
  group: "Water Route Vehicles",
  accent: "#24bff2",
  items: aquaticVehicleItems,
};

const boostTiers = {
  green: { tier: "Common", value: 80, batteryHours: 1, filamentHours: 4, filamentBoost: 0.12, scannerHours: 2 },
  blue: { tier: "Uncommon", value: 220, batteryHours: 3, filamentHours: 8, filamentBoost: 0.22, scannerHours: 4 },
  gold: { tier: "Rare", value: 780, batteryHours: 8, filamentHours: 12, filamentBoost: 0.38, scannerHours: 8 },
  purple: { tier: "Epic", value: 2400, batteryHours: 18, filamentHours: 18, filamentBoost: 0.6, scannerHours: 12 },
  orange: { tier: "Legendary", value: 7600, batteryHours: 36, filamentHours: 24, filamentBoost: 0.9, scannerHours: 24 },
};

const boostItems = rarityOrder.flatMap((rarity) => {
  const tier = boostTiers[rarity];
  return [
    {
      name: `${tier.tier} Battery Extension`,
      iconName: "cell",
      rarity,
      value: tier.value,
      description: `${tier.tier} Battery Extension placeholder. Permanently extends the operator battery by ${tier.batteryHours} hour${tier.batteryHours === 1 ? "" : "s"}.`,
      use: `Consumable: permanently adds +${tier.batteryHours}h battery capacity and fills that added charge.`,
      effect: "batteryCap",
      printPattern: "batteryCap",
      amount: tier.batteryHours * 3600,
    },
    {
      name: `${tier.tier} Filament`,
      iconName: "poly",
      rarity,
      value: Math.round(tier.value * 1.35),
      description: `${tier.tier} Filament placeholder. Pushes active fabs toward better rarity output for ${tier.filamentHours} hour${tier.filamentHours === 1 ? "" : "s"}.`,
      use: `Consumable: non-stacking +${Math.round(tier.filamentBoost * 100)}% higher-rarity pressure for ${tier.filamentHours}h.`,
      effect: "filament",
      printPattern: "filament",
      amount: tier.filamentBoost,
      duration: tier.filamentHours * 3600,
    },
    {
      name: `${tier.tier} Scanner`,
      iconName: "data",
      rarity,
      value: Math.round(tier.value * 1.15),
      description: `${tier.tier} Scanner placeholder. Reveals hidden NPC route pressure around the city you are viewing for ${tier.scannerHours} hour${tier.scannerHours === 1 ? "" : "s"}.`,
      use: `Consumable: reveals hidden NPC route statistics from the current city for ${tier.scannerHours}h.`,
      effect: "scanner",
      printPattern: "scanner",
      amount: tier.scannerHours * 3600,
    },
  ];
});

const nethackBurstTiers = {
  green: { tier: "Common", value: 140, grams: 100 },
  blue: { tier: "Uncommon", value: 460, grams: 500 },
  gold: { tier: "Rare", value: 1600, grams: 2000 },
  purple: { tier: "Epic", value: 5200, grams: 7500 },
  orange: { tier: "Legendary", value: 16000, grams: 20000 },
};

const nethackItems = rarityOrder.map((rarity) => {
  const tier = nethackBurstTiers[rarity];
  return {
    name: `${tier.tier} Gram Burst`,
    iconName: "data",
    rarity,
    value: tier.value,
    description: `${tier.tier} Gram Burst placeholder. Instantly processes ${tier.grams.toLocaleString()} grams of pending fab work.`,
    use: `Consumable: apply to any owned fab to instantly run ${tier.grams.toLocaleString()}g of rolls on that fab.`,
    effect: "fabBurst",
    printPattern: "fabBurst",
    amount: tier.grams,
  };
});

const boostFab = {
  label: "Boost Fab",
  group: "Consumables",
  accent: "#ffd447",
  items: boostItems,
};

const nethackFab = {
  label: "Nethack Boost Fab",
  group: "Burst Scripts",
  accent: "#ff4da6",
  items: nethackItems,
};

const equipmentNameParts = {
  motherboard: ["Common Logic Board", "Uncommon Logic Board", "Rare Logic Board", "Epic Logic Board", "Legendary Logic Board"],
  extruder: ["Common Extruder", "Uncommon Extruder", "Rare Extruder", "Epic Extruder", "Legendary Extruder"],
  printBed: ["Common Print Bed", "Uncommon Print Bed", "Rare Print Bed", "Epic Print Bed", "Legendary Print Bed"],
  stepperMotors: ["Common Stepper Motors", "Uncommon Stepper Motors", "Rare Stepper Motors", "Epic Stepper Motors", "Legendary Stepper Motors"],
};

const equipmentIconBySlot = {
  motherboard: "chip",
  extruder: "tool",
  printBed: "poly",
  stepperMotors: "cell",
};

const equipmentItems = equipmentSlots.flatMap((slot) => rarityOrder.map((rarity, tierIndex) => {
  const tier = equipmentTierStats[rarity];
  return {
    name: equipmentNameParts[slot.id][tierIndex],
    iconName: equipmentIconBySlot[slot.id],
    rarity,
    value: tier.value,
    equipmentSlot: slot.id,
    printPattern: slot.id,
    rateBonus: tier.rateBonus,
    description: `${tier.tier} ${slot.label} placeholder. Equip it to increase a fab's grams/hour.`,
    use: `Equip to a fab's ${slot.label} slot for +${Math.round(tier.rateBonus * 100)}% grams/hour on that fab.`,
  };
}));

const equipmentFab = {
  label: "Equipment Fab",
  group: "Gear",
  accent: "#b46bff",
  items: equipmentItems,
};

const roles = {
  drifter: {
    label: "Drifter",
    unlock: 0,
    text: "Independent operator who squeezes extra credits from fab credit mode.",
    benefit: "+20% credits from fab credit output.",
    fabCreditBonus: 0.2,
  },
  merchant: {
    label: "Merchant",
    unlock: 1,
    text: "Primary shipping profession. Merchants build convoys and move cargo between cities.",
    benefit: "+15% freight payout, +5% credits when selling into buy orders, and +20% shipment speed.",
    marketSellBonus: 0.05,
    freightBonus: 0.15,
    shipmentSpeedBonus: 0.2,
  },
  routejack: {
    label: "Routejack",
    unlock: 3,
    text: "Route raider who launches jobs against designed NPC cargo targets.",
    benefit: "Can launch route raids. Stolen cargo is limited by vehicle hold capacity.",
    interceptBonus: 10,
  },
  fabricator: {
    label: "Fabricator",
    unlock: 4,
    text: "Machine tender who gets more reliable output from non-starter fabs.",
    benefit: "+10% non-starter fab rate.",
    fabRateBonus: 0.1,
  },
};

const melds = [
  {
    name: "Common Starter Meld",
    type: "starter",
    rarity: "green",
    recipe: { "Common Starter Component A": 2, "Common Starter Component B": 1, "Common Starter Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Uncommon Starter Meld",
    type: "starter",
    rarity: "blue",
    recipe: { "Uncommon Starter Component A": 1, "Uncommon Starter Component B": 1, "Uncommon Starter Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Rare Starter Meld",
    type: "starter",
    rarity: "gold",
    recipe: { "Rare Starter Component A": 1, "Rare Starter Component B": 1, "Rare Starter Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Epic Starter Meld",
    type: "starter",
    rarity: "purple",
    recipe: { "Epic Starter Component A": 1, "Epic Starter Component B": 1, "Epic Starter Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Legendary Starter Meld",
    type: "starter",
    rarity: "orange",
    recipe: { "Legendary Starter Component A": 1, "Legendary Starter Component B": 1, "Legendary Starter Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Common Food Meld",
    type: "food",
    rarity: "green",
    recipe: { "Common Food Component A": 2, "Common Food Component B": 1, "Common Food Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Uncommon Food Meld",
    type: "food",
    rarity: "blue",
    recipe: { "Uncommon Food Component A": 1, "Uncommon Food Component B": 1, "Uncommon Food Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Rare Food Meld",
    type: "food",
    rarity: "gold",
    recipe: { "Rare Food Component A": 1, "Rare Food Component B": 1, "Rare Food Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Epic Food Meld",
    type: "food",
    rarity: "purple",
    recipe: { "Epic Food Component A": 1, "Epic Food Component B": 1, "Epic Food Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
  {
    name: "Legendary Food Meld",
    type: "food",
    rarity: "orange",
    recipe: { "Legendary Food Component A": 1, "Legendary Food Component B": 1, "Legendary Food Component C": 1 },
    bonus: "Adds +1 hour battery capacity.",
  },
];

const starterPrintPatternDefs = [
  {
    id: "starter-a",
    label: "Starter Component A",
    description: "Prints the A component for Starter Melds across all rarity tiers.",
    itemNames: ["Common Starter Component A", "Uncommon Starter Component A", "Rare Starter Component A", "Epic Starter Component A", "Legendary Starter Component A"],
  },
  {
    id: "starter-b",
    label: "Starter Component B",
    description: "Prints the B component for Starter Melds across all rarity tiers.",
    itemNames: ["Common Starter Component B", "Uncommon Starter Component B", "Rare Starter Component B", "Epic Starter Component B", "Legendary Starter Component B"],
  },
  {
    id: "starter-c",
    label: "Starter Component C",
    description: "Prints the C component for Starter Melds across all rarity tiers.",
    itemNames: ["Common Starter Component C", "Uncommon Starter Component C", "Rare Starter Component C", "Epic Starter Component C", "Legendary Starter Component C"],
  },
];

const foodPrintPatternDefs = [
  {
    id: "food-a",
    label: "Food Component A",
    description: "Prints the A component for Food Melds across all rarity tiers.",
    itemNames: ["Common Food Component A", "Uncommon Food Component A", "Rare Food Component A", "Epic Food Component A", "Legendary Food Component A"],
  },
  {
    id: "food-b",
    label: "Food Component B",
    description: "Prints the B component for Food Melds across all rarity tiers.",
    itemNames: ["Common Food Component B", "Uncommon Food Component B", "Rare Food Component B", "Epic Food Component B", "Legendary Food Component B"],
  },
  {
    id: "food-c",
    label: "Food Component C",
    description: "Prints the C component for Food Melds across all rarity tiers.",
    itemNames: ["Common Food Component C", "Uncommon Food Component C", "Rare Food Component C", "Epic Food Component C", "Legendary Food Component C"],
  },
];

function itemsFromNames(itemNames) {
  const catalog = allItems();
  return itemNames.map((name) => catalog.find((item) => item.name === name)).filter(Boolean);
}

function itemPatternFromNames(pattern) {
  return {
    id: pattern.id,
    label: pattern.label,
    description: pattern.description,
    items: itemsFromNames(pattern.itemNames),
  };
}

function withRandomPrintPattern(patterns) {
  const uniqueItems = new Map();
  patterns.forEach((pattern) => {
    (pattern.items || []).forEach((item) => {
      if (!uniqueItems.has(item.name)) uniqueItems.set(item.name, item);
    });
  });
  if (patterns.length <= 1) return patterns;
  return [
    {
      id: "random",
      label: "Random",
      description: "Prints every pattern in this fab's pool. Rarity decides quality; matching tier items are chosen at random.",
      items: [...uniqueItems.values()],
    },
    ...patterns,
  ];
}

function applyPrintPatternOverrides(type, patterns) {
  const typeOverrides = typeof window !== "undefined"
    ? window.NEON_CONTENT_OVERRIDES?.printPatterns?.[type] || {}
    : {};
  return patterns.map((pattern) => {
    const next = typeOverrides[pattern.id];
    if (!next) return pattern;
    return {
      ...pattern,
      label: next.label ? String(next.label) : pattern.label,
      description: next.description ? String(next.description) : pattern.description,
    };
  });
}

function printPatternsForFabType(type) {
  let patterns = [];
  if (type === "starter") patterns = withRandomPrintPattern(starterPrintPatternDefs.map(itemPatternFromNames));
  else if (type === "food") patterns = withRandomPrintPattern(foodPrintPatternDefs.map(itemPatternFromNames));
  else if (type === "vehicle") {
    patterns = withRandomPrintPattern(landVehicleClassDefs.map((classDef) => ({
      id: classDef.id,
      label: classDef.label,
      description: `${classDef.description} Your fab prints this class only; rarity decides the frame quality.`,
      items: vehicleItems.filter((item) => item.vehicleClass === classDef.id),
    })));
  } else if (type === "aquatic") {
    patterns = withRandomPrintPattern(aquaticVehicleClassDefs.map((classDef) => ({
      id: classDef.id,
      label: classDef.label,
      description: `${classDef.description} Your fab prints this hull class only; rarity decides the frame quality.`,
      items: aquaticVehicleItems.filter((item) => item.vehicleClass === classDef.id),
    })));
  } else if (type === "boost") {
    patterns = withRandomPrintPattern([
      {
        id: "batteryCap",
        label: "Battery Extension",
        description: "Print stackable power sleeves that permanently increase max battery capacity.",
        items: boostItems.filter((item) => item.effect === "batteryCap"),
      },
      {
        id: "filament",
        label: "Filament",
        description: "Print temporary quality feedstock that pushes active fabs toward higher rarity output.",
        items: boostItems.filter((item) => item.effect === "filament"),
      },
      {
        id: "scanner",
        label: "Scanner",
        description: "Print route-sensing wafers for reading patrol pressure around the current city.",
        items: boostItems.filter((item) => item.effect === "scanner"),
      },
    ]);
  } else if (type === "nethack") {
    patterns = [{
      id: "fabBurst",
      label: "Gram Burst",
      description: "Print one-use payloads that force a chosen fab to process grams instantly.",
      items: nethackItems,
    }];
  } else if (type === "equipment") {
    patterns = withRandomPrintPattern(equipmentSlots.map((slot) => ({
      id: slot.id,
      label: slot.label,
      description: `Print ${slot.label.toLowerCase()} upgrades only. Better quality parts give stronger grams/hour bonuses.`,
      items: equipmentItems.filter((item) => item.equipmentSlot === slot.id),
    })));
  }
  return applyPrintPatternOverrides(type, patterns);
}

function defaultPrintPattern(type) {
  return printPatternsForFabType(type)[0]?.id || "default";
}

function isValidPrintPattern(type, patternId) {
  return printPatternsForFabType(type).some((pattern) => pattern.id === patternId);
}

function printPatternForFab(fab) {
  const patterns = printPatternsForFabType(fab?.type || "starter");
  if (!patterns.length) {
    return {
      id: "default",
      label: "Full Output Pool",
      description: "This fab has no specialized pattern yet.",
      items: fabDefinition(fab?.type || "starter").items || [],
    };
  }
  return patterns.find((pattern) => pattern.id === fab.printPattern) || patterns[0];
}

function fabOutputItems(fab) {
  return printPatternForFab(fab).items || [];
}

function fabPatternLabel(fab) {
  return printPatternForFab(fab).label;
}

const defaultState = () => ({
  player: "Operator",
  credits: 0,
  chips: 1,
  district: "chrome-pier",
  homeCity: "chrome-pier",
  homeChosen: false,
  role: "drifter",
  activeView: "profile",
  viewHistory: [],
  selectedMeldType: "starter",
  marketCategory: "all",
  marketSearch: "",
  marketRarity: "all",
  marketSort: "ask",
  marketShowEmpty: false,
  marketWatchOnly: false,
  marketWatchlist: [],
  marketMeldTarget: "",
  inventorySearch: "",
  inventoryCategory: "all",
  inventoryRarity: "all",
  inventoryBulkRarity: "green",
  inventoryProtectMelds: true,
  pendingConfirm: null,
  actionSheet: null,
  dispatchNotice: null,
  printBayNotice: null,
  fabShopCategory: "all",
  fabShopScope: "current",
  fabOutputHistory: {},
  contractStats: defaultContractStats(),
  claimedContracts: [],
  reputation: {
    total: 0,
    tracks: {
      collection: 0,
      market: 0,
      route: 0,
      fab: 0,
    },
    history: [],
  },
  fuseAnimation: null,
  selectedFabId: "fab-1",
  activeEquipmentSlot: "motherboard",
  selectedItem: "Common Starter Component A",
  shipmentCargo: "Common Starter Component A",
  shipmentCargoQty: 1,
  shipmentCargoLoad: {},
  shipmentCargoLoadTouched: false,
  dispatchCargoSearch: "",
  shipmentVehicle: "Common Runner",
  shipmentEscort: "Common Guardian",
  shipmentDestination: "lowline",
  pvpRoute: "lowline",
  pvpVehicle: "Common Runner",
  pvpSupport1: "none",
  pvpSupport2: "none",
  pvpLootPolicy: "upgrade",
  battleSim: defaultBattleSim(),
  battleSimResult: null,
  battleReplay: null,
  battleBuilds: defaultBattleBuilds(),
  battleComparisonResult: null,
  routeBattles: [],
  selectedRouteBattleId: null,
  npcRouteTraffic: [],
  nextNpcTrafficAt: Date.now(),
  npcCombatUnitCatalog: null,
  routeEncounterCatalog: null,
  encounterRatesPerMile: defaultEncounterRatesPerMile(),
  routeClearances: {},
  batteryExtensions: 0,
  filamentBoost: null,
  routeScanUntil: 0,
  routeScanQuality: null,
  power: BASE_BATTERY_CAPACITY,
  lastTick: Date.now(),
  nextFabId: 2,
  fabs: [{ id: "fab-1", type: "starter", city: "chrome-pier", rate: 12, mode: "parts", printPattern: defaultPrintPattern("starter"), grams: 0, equipment: {}, ownedStatus: "owned", installedAt: Date.now() }],
  cityInventories: {
    lowline: {},
    "chrome-pier": {
      "Common Runner": 1,
      "Common Guardian": 1,
    },
    vanta: {},
    orchid: {},
    helix: {},
  },
  output: ["Common Starter Component A", "Common Starter Component A", "Common Starter Component B", "Common Starter Component C"],
  lastCollected: [],
  completed: [],
  dropRates: defaultDropRates(),
  noItemWeight: defaultNoItemWeight(),
  marketListings: defaultMarketListings(),
  marketBids: defaultMarketBids(),
  marketHistory: [],
  shipments: [],
  stolenGoods: [],
  pvpLog: [],
  cityStorageBonus: {},
  nextShipmentRiskReduction: 0,
  nextMarketId: 1,
  feed: [],
});

function applyCreativeContent(overrides = {}) {
  const applyText = (target, next, fields) => {
    if (!target || !next) return;
    fields.forEach((field) => {
      const value = next[field];
      if (value !== undefined && value !== null && String(value).length) target[field] = String(value);
    });
  };

  const itemOverrides = overrides.items || {};
  const itemPools = [starterItems, foodItems, vehicleItems, aquaticVehicleItems, boostItems, nethackItems, equipmentItems];
  itemPools.forEach((pool) => {
    pool.forEach((item) => {
      const next = itemOverrides[item.name];
      if (!next) return;
      if (next.label) item.displayName = String(next.label);
      if (next.description) item.description = String(next.description);
      if (next.use) item.use = String(next.use);
      if (next.flavor) item.flavor = String(next.flavor);
      if (next.art) item.art = String(next.art);
    });
  });

  const meldOverrides = overrides.melds || {};
  melds.forEach((meld) => {
    const next = meldOverrides[meld.name];
    if (!next) return;
    if (next.label) meld.displayName = String(next.label);
    if (next.bonus) meld.bonus = String(next.bonus);
    if (next.flavor) meld.flavor = String(next.flavor);
    if (next.art) meld.art = String(next.art);
  });

  const cityOverrides = overrides.cities || {};
  districts.forEach((district) => {
    const next = cityOverrides[district.id];
    if (!next) return;
    if (next.label) district.name = String(next.label);
    if (next.description) district.description = String(next.description);
    if (next.flavor) district.flavor = String(next.flavor);
    if (next.art) district.art = String(next.art);
  });

  const fabOverrides = overrides.fabs || {};
  const fabDefinitions = {
    starter: starterFab,
    food: foodFab,
    vehicle: vehicleFab,
    aquatic: aquaticFab,
    boost: boostFab,
    nethack: nethackFab,
    equipment: equipmentFab,
  };
  fabCatalog.forEach((fab) => {
    const next = fabOverrides[fab.type];
    if (!next) return;
    if (next.label) {
      fab.label = String(next.label);
      fabDefinitions[fab.type].label = String(next.label);
    }
    applyText(fab, next, ["category", "description", "flavor"]);
    applyText(fabDefinitions[fab.type], next, ["group", "accent", "description", "flavor"]);
  });

  const roleOverrides = overrides.roles || {};
  Object.entries(roleOverrides).forEach(([id, next]) => {
    applyText(roles[id], next, ["label", "text", "benefit", "flavor"]);
  });

  const contractOverrides = overrides.contracts || {};
  contractCatalog.forEach((contract) => {
    applyText(contract, contractOverrides[contract.id], ["chain", "group", "title", "description"]);
  });

  const slotOverrides = overrides.equipmentSlots || {};
  equipmentSlots.forEach((slot) => {
    applyText(slot, slotOverrides[slot.id], ["label"]);
  });

  const classOverrides = overrides.vehicleClasses || {};
  const applyClassOverrides = (routeMode, classDefs) => {
    const routeModeOverrides = classOverrides[routeMode] || {};
    classDefs.forEach((classDef) => {
      applyText(classDef, routeModeOverrides[classDef.id], ["label", "description"]);
    });
  };
  applyClassOverrides("land", landVehicleClassDefs);
  applyClassOverrides("water", aquaticVehicleClassDefs);

  const npcOverrides = overrides.npcUnits || {};
  defaultNpcCombatUnitCatalog.forEach((unit) => {
    applyText(unit, npcOverrides[unit.id], ["label", "summary", "flavor"]);
  });

  const encounterOverrides = overrides.encounters || {};
  defaultRouteEncounterCatalog.forEach((encounter) => {
    const next = encounterOverrides[encounter.id];
    applyText(encounter, next, ["label", "summary", "flavor"]);
    const waveOverrides = next?.waves || {};
    (encounter.waves || []).forEach((wave) => {
      applyText(wave, waveOverrides[wave.id], ["label", "summary", "flavor"]);
    });
  });

  if (overrides.project?.title && typeof document !== "undefined") document.title = String(overrides.project.title);
}
