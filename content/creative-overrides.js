// Author-facing creative override layer.
// Edit labels and flavor here without changing internal item keys used by saves, recipes, and markets.
window.NEON_CONTENT_OVERRIDES = {
  project: {
    title: "Neon Fabs",
    subtitle: "Lowline testnet",
  },
  cities: {
    "chrome-pier": {
      label: "Chrome Pier",
      flavor: "Container bazaars under sodium rain, where starter operators learn the market by touch.",
      art: "assets/cities/chrome-pier.png",
    },
    lowline: {
      label: "Lowline",
      flavor: "Stacked transit wards, cheap storage, and the hum of rented printers behind roll-up doors.",
      art: "assets/cities/lowline.png",
    },
  },
  items: {
    "Common Starter Component A": {
      label: "Common Starter Component A",
      flavor: "Placeholder component name. Replace this when the first real starter-set lore is ready.",
    },
    "Common Starter Component B": {
      label: "Common Starter Component B",
      flavor: "Placeholder component name. Replace this when the first real starter-set lore is ready.",
    },
    "Common Starter Component C": {
      label: "Common Starter Component C",
      flavor: "Placeholder component name. Replace this when the first real starter-set lore is ready.",
    },
  },
  melds: {
    "Common Starter Meld": {
      label: "Common Starter Meld",
      flavor: "A first civic-memory set. It proves the operator can collect, sort, and fuse small signals into working time.",
    },
  },
};

if (typeof applyCreativeContent === "function") {
  applyCreativeContent(window.NEON_CONTENT_OVERRIDES);
}
