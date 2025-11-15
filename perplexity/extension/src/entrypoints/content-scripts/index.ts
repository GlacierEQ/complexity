import {
  executeCsLoaders,
  executeLibCsLoaders,
} from "@/__registries__/cs-loaders";
import { contentScriptGuards } from "@/entrypoints/content-scripts/guards";
import { storage } from "@wxt-dev/storage";

contentScriptGuards();

let isBootstrapped = false;

async function bootstrapComplexity(reason: "user" | "auto") {
  if (isBootstrapped) {
    console.info("[Complexity] Already bootstrapped");
    return;
  }
  
  isBootstrapped = true;
  console.info("[Complexity] Bootstrapping tools:", reason);

  await executeLibCsLoaders();
  await executeCsLoaders();

  // Store that it was started this session
  await storage.setItem("local:complexity:lastBootReason", reason);
  await storage.setItem("local:complexity:isActive", true);
}

// ---- AUTO-START PREFERENCE (optional) ----
async function maybeAutoStart() {
  const autoStart = await storage.getItem<boolean>("local:complexity:autoStart");
  if (autoStart) {
    void bootstrapComplexity("auto");
  } else {
    injectLauncherButton();
  }
}

// ---- IN-PAGE LAUNCHER BUTTON ----
function injectLauncherButton() {
  if (document.querySelector("#complexity-launcher-btn")) return;

  const btn = document.createElement("button");
  btn.id = "complexity-launcher-btn";
  btn.innerHTML = `<span style="margin-right: 6px;">✨</span>Launch Complexity`;
  btn.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483647;
    padding: 10px 16px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 13px;
    font-weight: 500;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.2s ease;
  `;

  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "translateY(-2px)";
    btn.style.boxShadow = "0 6px 20px rgba(0,0,0,0.3)";
  });
  
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translateY(0)";
    btn.style.boxShadow = "0 4px 16px rgba(0,0,0,0.25)";
  });

  btn.addEventListener("click", () => {
    void bootstrapComplexity("user");
    btn.style.opacity = "0";
    btn.style.transform = "scale(0.8)";
    setTimeout(() => btn.remove(), 300);
  });

  document.body.appendChild(btn);
}

// ---- MESSAGE HANDLING (FROM POPUP / BACKGROUND) ----
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "COMPLEXITY_LAUNCH") {
    void bootstrapComplexity("user");
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "COMPLEXITY_TOGGLE_THEME") {
    const themeButton = document.querySelector("[data-cplx-theme-toggle]");
    if (themeButton instanceof HTMLElement) {
      themeButton.click();
      sendResponse({ ok: true });
    } else {
      sendResponse({ ok: false, error: "Theme button not found" });
    }
    return true;
  }

  if (message?.type === "COMPLEXITY_EXPORT_DATA") {
    const exportButton = document.querySelector("[data-cplx-export]");
    if (exportButton instanceof HTMLElement) {
      exportButton.click();
      sendResponse({ ok: true });
    } else {
      sendResponse({ ok: false, error: "Export button not found" });
    }
    return true;
  }

  return false;
});

// ---- KICKOFF ----
void maybeAutoStart();