import { storage } from "@wxt-dev/storage";

interface PopupActions {
  launchComplexity: () => void;
  openSettings: () => void;
  gotoPerplexity: () => void;
  toggleTheme: () => void;
  exportData: () => void;
  helpDocs: () => void;
}

class PopupController {
  private actions: PopupActions;

  constructor() {
    this.actions = {
      launchComplexity: this.launchComplexity.bind(this),
      openSettings: this.openSettings.bind(this),
      gotoPerplexity: this.gotoPerplexity.bind(this),
      toggleTheme: this.toggleTheme.bind(this),
      exportData: this.exportData.bind(this),
      helpDocs: this.helpDocs.bind(this),
    };

    this.init();
  }

  private init() {
    // Attach event listeners
    document.getElementById("launch-complexity")?.addEventListener("click", this.actions.launchComplexity);
    document.getElementById("open-settings")?.addEventListener("click", this.actions.openSettings);
    document.getElementById("goto-perplexity")?.addEventListener("click", this.actions.gotoPerplexity);
    document.getElementById("toggle-theme")?.addEventListener("click", this.actions.toggleTheme);
    document.getElementById("export-data")?.addEventListener("click", this.actions.exportData);
    document.getElementById("help-docs")?.addEventListener("click", this.actions.helpDocs);

    // Load version
    this.loadVersion();

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private async launchComplexity() {
    const [tab] = await chrome.tabs.query({
      url: "*://www.perplexity.ai/*",
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      this.showToast("Open Perplexity first", "error");
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { type: "COMPLEXITY_LAUNCH" });
      this.showToast("Complexity launched!");
      setTimeout(() => window.close(), 500);
    } catch (error) {
      this.showToast("Failed to launch. Reload the page?", "error");
    }
  }

  private async openSettings() {
    await chrome.runtime.openOptionsPage();
    window.close();
  }

  private async gotoPerplexity() {
    const tabs = await chrome.tabs.query({ url: "*://www.perplexity.ai/*" });
    
    if (tabs.length > 0 && tabs[0]?.id) {
      // Focus existing tab
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId!, { focused: true });
    } else {
      // Create new tab
      await chrome.tabs.create({ url: "https://www.perplexity.ai" });
    }
    
    window.close();
  }

  private async toggleTheme() {
    // Get active Perplexity tab
    const tabs = await chrome.tabs.query({ 
      url: "*://www.perplexity.ai/*",
      active: true 
    });

    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: "COMPLEXITY_TOGGLE_THEME"
        });
        this.showToast("Theme toggled!");
      } catch (error) {
        this.showToast("Launch Complexity first", "error");
      }
    } else {
      this.showToast("Open Perplexity first", "error");
    }
    
    setTimeout(() => window.close(), 500);
  }

  private async exportData() {
    // Get active Perplexity tab
    const tabs = await chrome.tabs.query({ 
      url: "*://www.perplexity.ai/*",
      active: true 
    });

    if (tabs[0]?.id) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: "COMPLEXITY_EXPORT_DATA"
        });
        this.showToast("Export started!");
      } catch (error) {
        this.showToast("Launch Complexity first", "error");
      }
    } else {
      this.showToast("Open Perplexity first", "error");
    }
  }

  private async helpDocs() {
    await chrome.tabs.create({ 
      url: "https://github.com/GlacierEQ/complexity/tree/main/perplexity/extension" 
    });
    window.close();
  }

  private loadVersion() {
    const versionEl = document.getElementById("version");
    if (versionEl) {
      versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
    }
  }

  private setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + L for Launch
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        this.actions.launchComplexity();
      }
      
      // Ctrl/Cmd + ,
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        this.actions.openSettings();
      }
      
      // Ctrl/Cmd + O
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        this.actions.gotoPerplexity();
      }
      
      // Escape to close
      if (e.key === "Escape") {
        window.close();
      }
    });
  }

  private showToast(message: string, type: "success" | "error" = "success") {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === "success" ? "#48bb78" : "#f56565"};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2000);
  }
}

// Initialize popup
new PopupController();