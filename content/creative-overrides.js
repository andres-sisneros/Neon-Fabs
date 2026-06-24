// Author-facing creative override layer.
// Keep object keys unchanged: they are internal prototype IDs used by recipes, saves, and markets.
// Edit labels, descriptions, flavor, and art paths here as the world gets its real voice.

const NEON_CREATIVE_OVERRIDES = {
  project: {
    title: "Neon Fabs",
    subtitle: "Lowline testnet",
    tagline: "A civic printer economy about batteries, routes, risk, and strange cargo.",
  },

  cities: {
    lowline: {
      label: "Lowline",
      description: "A stacked transit ward where first-run operators start with cheap space and noisy markets.",
      flavor: "",
      art: "",
    },
    "chrome-pier": {
      label: "Chrome Pier",
      description: "Port-side chop shops and container bazaars. Good for route gear once transport exists.",
      flavor: "",
      art: "",
    },
    vanta: {
      label: "Vanta Arcology",
      description: "A sealed tower market with premium buyers, tight storage, and expensive everything.",
      flavor: "",
      art: "",
    },
    orchid: {
      label: "Orchid Sprawl",
      description: "Night markets, bootleg labels, and fashion stalls spread under magenta rain shields.",
      flavor: "",
      art: "",
    },
    helix: {
      label: "Helix Quay",
      description: "An industrial waterfront where useful fabs will eventually become dangerous business.",
      flavor: "",
      art: "",
    },
  },

  fabs: {
    starter: { label: "Starter Fab", category: "Meld", group: "Starter Components", description: "", flavor: "" },
    food: { label: "Food Meld Fab", category: "Meld", group: "Food Components", description: "", flavor: "" },
    vehicle: { label: "Vehicle Fab", category: "Route", group: "Route Vehicles", description: "", flavor: "" },
    aquatic: { label: "Aquatic Vehicle Fab", category: "Route", group: "Water Route Vehicles", description: "", flavor: "" },
    boost: { label: "Boost Fab", category: "Boost", group: "Consumables", description: "", flavor: "" },
    nethack: { label: "Nethack Boost Fab", category: "Boost", group: "Burst Scripts", description: "", flavor: "" },
    equipment: { label: "Equipment Fab", category: "Gear", group: "Gear", description: "", flavor: "" },
  },

  equipmentSlots: {
    motherboard: { label: "Motherboard" },
    extruder: { label: "Extruder" },
    printBed: { label: "Print Bed" },
    stepperMotors: { label: "Stepper Motors" },
  },

  vehicleClasses: {
    land: {
      runner: { label: "Runner", description: "Fast route craft for light cargo, scouting, and evasive shipping work." },
      freighter: { label: "Freighter", description: "Cargo-first vehicles with more slots, slower speeds, and steadier route frames." },
      interceptor: { label: "Interceptor", description: "Aggressive pursuit frames for Routejacks, interdiction, and theft-focused route builds." },
      guardian: { label: "Guardian", description: "Defensive convoy frames for escorts, guarded hauls, and cargo protection." },
    },
    water: {
      runner: { label: "Water Runner", description: "Fast water craft for light cargo, canal scouting, and evasive flood-lane work." },
      freighter: { label: "Water Freighter", description: "Slow, steady water cargo platforms with larger holds." },
      interceptor: { label: "Water Interceptor", description: "Pursuit hulls for water-route interdiction and theft-focused route builds." },
      guardian: { label: "Water Guardian", description: "Protective hulls for defended shipments, escorted hauls, and convoy pressure." },
    },
  },

  printPatterns: {
    starter: {
      random: { label: "Random", description: "Prints every starter component pattern equally." },
      "starter-a": { label: "Starter Component A", description: "Prints the A component for Starter Melds across all rarity tiers." },
      "starter-b": { label: "Starter Component B", description: "Prints the B component for Starter Melds across all rarity tiers." },
      "starter-c": { label: "Starter Component C", description: "Prints the C component for Starter Melds across all rarity tiers." },
    },
    food: {
      random: { label: "Random", description: "Prints every food component pattern equally." },
      "food-a": { label: "Food Component A", description: "Prints the A component for Food Melds across all rarity tiers." },
      "food-b": { label: "Food Component B", description: "Prints the B component for Food Melds across all rarity tiers." },
      "food-c": { label: "Food Component C", description: "Prints the C component for Food Melds across all rarity tiers." },
    },
    vehicle: {
      random: { label: "Random", description: "Prints every land vehicle class equally." },
      runner: { label: "Runner", description: "Fast light-cargo route vehicles." },
      freighter: { label: "Freighter", description: "Slow cargo-heavy route vehicles." },
      interceptor: { label: "Interceptor", description: "Attack-focused route vehicles." },
      guardian: { label: "Guardian", description: "Defensive convoy support vehicles." },
    },
    aquatic: {
      random: { label: "Random", description: "Prints every water vehicle class equally." },
      runner: { label: "Water Runner", description: "Fast light-cargo water vehicles." },
      freighter: { label: "Water Freighter", description: "Slow cargo-heavy water vehicles." },
      interceptor: { label: "Water Interceptor", description: "Attack-focused water vehicles." },
      guardian: { label: "Water Guardian", description: "Defensive water convoy support vehicles." },
    },
    boost: {
      random: { label: "Random", description: "Prints every boost family equally." },
      batteryCap: { label: "Battery Extension", description: "Print stackable power sleeves that permanently increase max battery capacity." },
      filament: { label: "Filament", description: "Print temporary quality feedstock that pushes active fabs toward higher rarity output." },
      scanner: { label: "Scanner", description: "Print route-sensing wafers for reading patrol pressure around the current city." },
    },
    nethack: {
      fabBurst: { label: "Gram Burst", description: "Print one-use payloads that force a chosen fab to process grams instantly." },
    },
    equipment: {
      random: { label: "Random", description: "Prints every equipment slot equally." },
      motherboard: { label: "Motherboard", description: "Print motherboard upgrades only." },
      extruder: { label: "Extruder", description: "Print extruder upgrades only." },
      printBed: { label: "Print Bed", description: "Print bed upgrades only." },
      stepperMotors: { label: "Stepper Motors", description: "Print stepper motor upgrades only." },
    },
  },

  roles: {
    drifter: {
      label: "Drifter",
      text: "Independent operator who squeezes extra credits from fab credit mode.",
      benefit: "+20% credits from fab credit output.",
      flavor: "",
    },
    merchant: {
      label: "Merchant",
      text: "Primary shipping profession. Merchants build convoys and move cargo between cities.",
      benefit: "+15% freight payout, +5% credits when selling into buy orders, and +20% shipment speed.",
      flavor: "",
    },
    routejack: {
      label: "Routejack",
      text: "Route raider who launches jobs against designed NPC cargo targets.",
      benefit: "Can launch route raids. Stolen cargo is limited by vehicle hold capacity.",
      flavor: "",
    },
    fabricator: {
      label: "Fabricator",
      text: "Machine tender who gets more reliable output from non-starter fabs.",
      benefit: "+10% non-starter fab rate.",
      flavor: "",
    },
  },

  contracts: {
    "collect-first-print-run": {
      chain: "New Operator",
      group: "1. Fab Operations",
      title: "First Print Run",
      description: "Open the first four sealed prints from your home city's Print Bay.",
    },
    "fuse-first-meld": {
      chain: "New Operator",
      group: "2. Patterns",
      title: "Create A Stable Pattern",
      description: "Use your first print run to create one pattern in your home city.",
    },
    "market-sell-3": {
      chain: "New Operator",
      group: "3. Market",
      title: "Find Local Demand",
      description: "Sell three items to local bids. Bulk sales count.",
    },
    "market-buy-1": {
      chain: "New Operator",
      group: "4. Market",
      title: "Source A Missing Part",
      description: "Buy one item from any city market listing.",
    },
    "send-first-shipment": {
      chain: "New Operator",
      group: "5. Dispatch",
      title: "Open A Route",
      description: "Send one cargo shipment from Dispatch.",
    },
    "second-fab-slot": {
      chain: "New Operator",
      group: "6. Expansion",
      title: "Run A Second Fab",
      description: "Own or rent a second active fab when you are ready to expand.",
    },
    "equip-first-gear": {
      chain: "New Operator",
      group: "7. Fabs",
      title: "Tune A Machine",
      description: "Equip one gear upgrade onto a fab.",
    },
  },

  items: {
    // Starter meld components.
    "Common Starter Component A": { label: "Common Starter Component A", flavor: "" },
    "Common Starter Component B": { label: "Common Starter Component B", flavor: "" },
    "Common Starter Component C": { label: "Common Starter Component C", flavor: "" },
    "Uncommon Starter Component A": { label: "Uncommon Starter Component A", flavor: "" },
    "Uncommon Starter Component B": { label: "Uncommon Starter Component B", flavor: "" },
    "Uncommon Starter Component C": { label: "Uncommon Starter Component C", flavor: "" },
    "Rare Starter Component A": { label: "Rare Starter Component A", flavor: "" },
    "Rare Starter Component B": { label: "Rare Starter Component B", flavor: "" },
    "Rare Starter Component C": { label: "Rare Starter Component C", flavor: "" },
    "Epic Starter Component A": { label: "Epic Starter Component A", flavor: "" },
    "Epic Starter Component B": { label: "Epic Starter Component B", flavor: "" },
    "Epic Starter Component C": { label: "Epic Starter Component C", flavor: "" },
    "Legendary Starter Component A": { label: "Legendary Starter Component A", flavor: "" },
    "Legendary Starter Component B": { label: "Legendary Starter Component B", flavor: "" },
    "Legendary Starter Component C": { label: "Legendary Starter Component C", flavor: "" },

    // Food meld components.
    "Common Food Component A": { label: "Common Food Component A", flavor: "" },
    "Common Food Component B": { label: "Common Food Component B", flavor: "" },
    "Common Food Component C": { label: "Common Food Component C", flavor: "" },
    "Uncommon Food Component A": { label: "Uncommon Food Component A", flavor: "" },
    "Uncommon Food Component B": { label: "Uncommon Food Component B", flavor: "" },
    "Uncommon Food Component C": { label: "Uncommon Food Component C", flavor: "" },
    "Rare Food Component A": { label: "Rare Food Component A", flavor: "" },
    "Rare Food Component B": { label: "Rare Food Component B", flavor: "" },
    "Rare Food Component C": { label: "Rare Food Component C", flavor: "" },
    "Epic Food Component A": { label: "Epic Food Component A", flavor: "" },
    "Epic Food Component B": { label: "Epic Food Component B", flavor: "" },
    "Epic Food Component C": { label: "Epic Food Component C", flavor: "" },
    "Legendary Food Component A": { label: "Legendary Food Component A", flavor: "" },
    "Legendary Food Component B": { label: "Legendary Food Component B", flavor: "" },
    "Legendary Food Component C": { label: "Legendary Food Component C", flavor: "" },

    // Land vehicles.
    "Common Runner": { label: "Common Runner", flavor: "" },
    "Uncommon Runner": { label: "Uncommon Runner", flavor: "" },
    "Rare Runner": { label: "Rare Runner", flavor: "" },
    "Epic Runner": { label: "Epic Runner", flavor: "" },
    "Legendary Runner": { label: "Legendary Runner", flavor: "" },
    "Common Freighter": { label: "Common Freighter", flavor: "" },
    "Uncommon Freighter": { label: "Uncommon Freighter", flavor: "" },
    "Rare Freighter": { label: "Rare Freighter", flavor: "" },
    "Epic Freighter": { label: "Epic Freighter", flavor: "" },
    "Legendary Freighter": { label: "Legendary Freighter", flavor: "" },
    "Common Interceptor": { label: "Common Interceptor", flavor: "" },
    "Uncommon Interceptor": { label: "Uncommon Interceptor", flavor: "" },
    "Rare Interceptor": { label: "Rare Interceptor", flavor: "" },
    "Epic Interceptor": { label: "Epic Interceptor", flavor: "" },
    "Legendary Interceptor": { label: "Legendary Interceptor", flavor: "" },
    "Common Guardian": { label: "Common Guardian", flavor: "" },
    "Uncommon Guardian": { label: "Uncommon Guardian", flavor: "" },
    "Rare Guardian": { label: "Rare Guardian", flavor: "" },
    "Epic Guardian": { label: "Epic Guardian", flavor: "" },
    "Legendary Guardian": { label: "Legendary Guardian", flavor: "" },

    // Water vehicles.
    "Common Water Runner": { label: "Common Water Runner", flavor: "" },
    "Uncommon Water Runner": { label: "Uncommon Water Runner", flavor: "" },
    "Rare Water Runner": { label: "Rare Water Runner", flavor: "" },
    "Epic Water Runner": { label: "Epic Water Runner", flavor: "" },
    "Legendary Water Runner": { label: "Legendary Water Runner", flavor: "" },
    "Common Water Freighter": { label: "Common Water Freighter", flavor: "" },
    "Uncommon Water Freighter": { label: "Uncommon Water Freighter", flavor: "" },
    "Rare Water Freighter": { label: "Rare Water Freighter", flavor: "" },
    "Epic Water Freighter": { label: "Epic Water Freighter", flavor: "" },
    "Legendary Water Freighter": { label: "Legendary Water Freighter", flavor: "" },
    "Common Water Interceptor": { label: "Common Water Interceptor", flavor: "" },
    "Uncommon Water Interceptor": { label: "Uncommon Water Interceptor", flavor: "" },
    "Rare Water Interceptor": { label: "Rare Water Interceptor", flavor: "" },
    "Epic Water Interceptor": { label: "Epic Water Interceptor", flavor: "" },
    "Legendary Water Interceptor": { label: "Legendary Water Interceptor", flavor: "" },
    "Common Water Guardian": { label: "Common Water Guardian", flavor: "" },
    "Uncommon Water Guardian": { label: "Uncommon Water Guardian", flavor: "" },
    "Rare Water Guardian": { label: "Rare Water Guardian", flavor: "" },
    "Epic Water Guardian": { label: "Epic Water Guardian", flavor: "" },
    "Legendary Water Guardian": { label: "Legendary Water Guardian", flavor: "" },

    // Boost consumables.
    "Common Battery Extension": { label: "Common Battery Extension", flavor: "" },
    "Uncommon Battery Extension": { label: "Uncommon Battery Extension", flavor: "" },
    "Rare Battery Extension": { label: "Rare Battery Extension", flavor: "" },
    "Epic Battery Extension": { label: "Epic Battery Extension", flavor: "" },
    "Legendary Battery Extension": { label: "Legendary Battery Extension", flavor: "" },
    "Common Filament": { label: "Common Filament", flavor: "" },
    "Uncommon Filament": { label: "Uncommon Filament", flavor: "" },
    "Rare Filament": { label: "Rare Filament", flavor: "" },
    "Epic Filament": { label: "Epic Filament", flavor: "" },
    "Legendary Filament": { label: "Legendary Filament", flavor: "" },
    "Common Scanner": { label: "Common Scanner", flavor: "" },
    "Uncommon Scanner": { label: "Uncommon Scanner", flavor: "" },
    "Rare Scanner": { label: "Rare Scanner", flavor: "" },
    "Epic Scanner": { label: "Epic Scanner", flavor: "" },
    "Legendary Scanner": { label: "Legendary Scanner", flavor: "" },

    // Nethack boost consumables.
    "Common Gram Burst": { label: "Common Gram Burst", flavor: "" },
    "Uncommon Gram Burst": { label: "Uncommon Gram Burst", flavor: "" },
    "Rare Gram Burst": { label: "Rare Gram Burst", flavor: "" },
    "Epic Gram Burst": { label: "Epic Gram Burst", flavor: "" },
    "Legendary Gram Burst": { label: "Legendary Gram Burst", flavor: "" },

    // Equipment.
    "Common Logic Board": { label: "Common Logic Board", flavor: "" },
    "Uncommon Logic Board": { label: "Uncommon Logic Board", flavor: "" },
    "Rare Logic Board": { label: "Rare Logic Board", flavor: "" },
    "Epic Logic Board": { label: "Epic Logic Board", flavor: "" },
    "Legendary Logic Board": { label: "Legendary Logic Board", flavor: "" },
    "Common Extruder": { label: "Common Extruder", flavor: "" },
    "Uncommon Extruder": { label: "Uncommon Extruder", flavor: "" },
    "Rare Extruder": { label: "Rare Extruder", flavor: "" },
    "Epic Extruder": { label: "Epic Extruder", flavor: "" },
    "Legendary Extruder": { label: "Legendary Extruder", flavor: "" },
    "Common Print Bed": { label: "Common Print Bed", flavor: "" },
    "Uncommon Print Bed": { label: "Uncommon Print Bed", flavor: "" },
    "Rare Print Bed": { label: "Rare Print Bed", flavor: "" },
    "Epic Print Bed": { label: "Epic Print Bed", flavor: "" },
    "Legendary Print Bed": { label: "Legendary Print Bed", flavor: "" },
    "Common Stepper Motors": { label: "Common Stepper Motors", flavor: "" },
    "Uncommon Stepper Motors": { label: "Uncommon Stepper Motors", flavor: "" },
    "Rare Stepper Motors": { label: "Rare Stepper Motors", flavor: "" },
    "Epic Stepper Motors": { label: "Epic Stepper Motors", flavor: "" },
    "Legendary Stepper Motors": { label: "Legendary Stepper Motors", flavor: "" },
  },

  melds: {
    "Common Starter Meld": { label: "Common Starter Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Uncommon Starter Meld": { label: "Uncommon Starter Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Rare Starter Meld": { label: "Rare Starter Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Epic Starter Meld": { label: "Epic Starter Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Legendary Starter Meld": { label: "Legendary Starter Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Common Food Meld": { label: "Common Food Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Uncommon Food Meld": { label: "Uncommon Food Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Rare Food Meld": { label: "Rare Food Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Epic Food Meld": { label: "Epic Food Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
    "Legendary Food Meld": { label: "Legendary Food Meld", bonus: "Adds +1 hour battery capacity.", flavor: "" },
  },

  npcUnits: {
    "static-skimmer": { label: "Static Skimmer", summary: "Cheap sensor-noise raider. Fast enough to matter, fragile enough for early convoys.", flavor: "" },
    "toll-hound": { label: "Toll Hound", summary: "Road crew enforcer tuned for steady pressure against cargo frames.", flavor: "" },
    "black-ledger-knife": { label: "Black Ledger Knife", summary: "Elite route predator. It hits cargo hard and makes rare encounters feel dangerous.", flavor: "" },
    "tar-wraith": { label: "Tar Wraith", summary: "Slow route anomaly concept. Currently just a heavy, slow combat unit; route-horror mechanics are future candidates.", flavor: "" },
    "market-mule-cargo": { label: "Market Mule Cargo", summary: "Light NPC cargo target for early Routejack raids.", flavor: "" },
    "armored-hauler": { label: "Armored Hauler", summary: "Slower, richer NPC cargo target that needs a real raid convoy to crack.", flavor: "" },
    "arcology-vault-hauler": { label: "Arcology Vault Hauler", summary: "High-value civic transfer target with enough integrity to punish weak Routejack builds.", flavor: "" },
    "ledger-escort": { label: "Ledger Escort", summary: "NPC guard that can jump in front of attacks meant for cargo.", flavor: "" },
    "vault-sentinel": { label: "Vault Sentinel", summary: "Heavy escort for rare target waves.", flavor: "" },
  },

  encounters: {
    "static-skimmers": {
      label: "Static Skimmers",
      summary: "Weak opportunists. Common enough to make quiet routes feel alive.",
      waves: {
        "static-single": { label: "Single Skimmer" },
        "static-pair": { label: "Skimmer Pair" },
      },
    },
    "toll-hounds": {
      label: "Toll Hounds",
      summary: "A harder road ambush. Beating them stabilizes the route for everyone.",
      waves: {
        "toll-hound-roadblock": { label: "Roadblock Hound" },
        "hound-and-skimmer": { label: "Hound With Skimmer" },
      },
    },
    "black-ledger-crew": {
      label: "Black Ledger Crew",
      summary: "Rare, dangerous routejacks. Clearing one should feel like news.",
      waves: {
        "ledger-knife": { label: "Black Ledger Knife" },
      },
    },
    "market-mule": {
      label: "Market Mule",
      summary: "Low-risk NPC cargo target for early Routejack tuning.",
      waves: {
        "market-mule-light": { label: "Market Mule" },
      },
    },
    "armored-haul": {
      label: "Armored Haul",
      summary: "Better rewards, more protection. The first real Routejack check.",
      waves: {
        "armored-haul-escort": { label: "Armored Haul" },
      },
    },
    "arcology-transfer": {
      label: "Arcology Transfer",
      summary: "Rare high-value target. Good test bed for aspirational raid convoys.",
      waves: {
        "arcology-vault-transfer": { label: "Arcology Vault Transfer" },
      },
    },
  },
};

window.NEON_CONTENT_OVERRIDES = NEON_CREATIVE_OVERRIDES;

if (typeof applyCreativeContent === "function") {
  applyCreativeContent(window.NEON_CONTENT_OVERRIDES);
}
