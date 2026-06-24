// Lightweight first-load intro overlay. This is a presentation layer only.

const INTRO_STORAGE_KEY = "neon-fabs.intro.v1.seen";

function introForcedByUrl() {
  return window.location.search.includes("intro=1") || window.location.hash.includes("intro=1");
}

function introSuppressedByUrl() {
  return window.location.search.includes("intro=0") || window.location.hash.includes("intro=0");
}

function shouldShowIntro() {
  if (introSuppressedByUrl()) return false;
  if (introForcedByUrl()) return true;
  return window.localStorage.getItem(INTRO_STORAGE_KEY) !== "yes";
}

function dismissIntroOverlay() {
  window.localStorage.setItem(INTRO_STORAGE_KEY, "yes");
  const overlay = document.querySelector(".intro-overlay");
  if (!overlay) return;
  overlay.classList.add("closing");
  window.setTimeout(() => overlay.remove(), 280);
}

function renderIntroOverlay() {
  if (!shouldShowIntro() || document.querySelector(".intro-overlay")) return;
  const chromePier = districtById("chrome-pier");
  const starterFab = state.fabs.find((fab) => fab.type === "starter") || state.fabs[0];
  const overlay = document.createElement("section");
  overlay.className = "intro-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "introTitle");
  overlay.innerHTML = `
    <div class="intro-cinema" aria-hidden="true">
      <div class="intro-cityline">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="intro-route">
        <span class="intro-route-light light-a"></span>
        <span class="intro-route-light light-b"></span>
        <span class="intro-cargo cargo-a"></span>
        <span class="intro-cargo cargo-b"></span>
      </div>
      <div class="intro-printer-wrap">
        ${renderFabPixelScene(starterFab, {
          label: "Starter Fab",
          compact: true,
          state: "printing",
          statusText: "booting civic matter",
          patternText: "operator license",
        })}
      </div>
    </div>
    <div class="intro-copy">
      <p class="eyebrow">Prototype game build</p>
      <h1 id="introTitle">Neon Fabs</h1>
      <p class="intro-lede">A city-scale printer economy where small operators turn sealed output into markets, melds, and route risk.</p>
      <div class="intro-boot-lines" aria-label="Game premise">
        <span>Battery online</span>
        <span>Starter Fab assigned</span>
        <span>Local markets waking</span>
        <span>Routes unstable</span>
      </div>
      <div class="intro-actions">
        <button type="button" class="primary-command" data-intro-dismiss>Enter Neon Fabs</button>
        <button type="button" data-intro-dismiss>Skip Intro</button>
      </div>
      <p class="intro-footnote">${chromePier.name} and ${districtById("orchid").name} are accepting new operators.</p>
    </div>`;
  document.body.appendChild(overlay);
  const startButton = overlay.querySelector("[data-intro-dismiss]");
  if (startButton) startButton.focus({ preventScroll: true });
}

document.body.addEventListener("click", (event) => {
  if (event.target.closest("[data-intro-dismiss]")) dismissIntroOverlay();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.querySelector(".intro-overlay")) dismissIntroOverlay();
});
