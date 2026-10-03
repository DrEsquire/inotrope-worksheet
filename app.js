// Page-side PWA wiring: register the service worker, handle installation,
// and surface update prompts. Nothing here transmits data; the service
// worker only caches same-origin files.
(function () {
  var bannerShown = false;

  function showUpdateBanner() {
    if (bannerShown) return;
    bannerShown = true;
    var el = document.getElementById("updateBanner");
    if (el) el.classList.remove("hidden");
  }

  function hideUpdateBanner() {
    var el = document.getElementById("updateBanner");
    if (el) el.classList.add("hidden");
  }

  window.hideUpdateBanner = hideUpdateBanner;

  window.applyUpdate = function () {
    if (!navigator.serviceWorker) { location.reload(); return; }
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg || !reg.waiting) { location.reload(); return; }
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        // The new worker has taken over: reload once onto the fresh files.
        if (window.__reloadedForUpdate) return;
        window.__reloadedForUpdate = true;
        location.reload();
      });
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    });
  };

  function watchForWaiting(reg) {
    if (reg && reg.waiting) showUpdateBanner();
    reg.addEventListener("updatefound", function () {
      var installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", function () {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          // A new version finished installing while an old one was in control.
          showUpdateBanner();
        }
      });
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function (reg) {
        watchForWaiting(reg);
        // Don't wait for the browser's ~24h poll: check for a new worker now.
        return reg.update();
      }).catch(function (err) {
        // Offline support simply won't activate; app still works online.
        console.warn("Service worker registration failed:", err);
      });
      navigator.serviceWorker.ready.then(watchForWaiting);
    });
  }

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    var ua = window.navigator.userAgent || "";
    var iOSDevice = /iPad|iPhone|iPod/.test(ua);
    // iPadOS 13+ reports as Mac; detect via touch support
    var iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOSDevice || iPadOS;
  }

  function showBtn() {
    var btn = document.getElementById("installBtn");
    if (btn) btn.classList.remove("hidden");
  }
  function hideBtn() {
    var btn = document.getElementById("installBtn");
    if (btn) btn.classList.add("hidden");
  }

  // Capture the beforeinstallprompt event (Chromium / Edge / Android).
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showBtn();
  });

  // On load, decide whether to show the button.
  // - Already installed (standalone): keep it hidden.
  // - Browsers without beforeinstallprompt (notably all iOS browsers): show it
  //   anyway so the user can get manual "Add to Home Screen" instructions.
  window.addEventListener("load", function () {
    if (isStandalone()) {
      hideBtn();
    } else if (isIOS()) {
      showBtn();
    }
    // On Chromium/Edge/Android the button appears via beforeinstallprompt above.
  });

  // Expose an installer callable from the button's onclick.
  window.installPWA = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        hideBtn();
      });
      return;
    }

    // No auto-prompt available: show platform-specific manual instructions.
    var ua = window.navigator.userAgent || "";
    var msg;
    if (isIOS()) {
      var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
      if (isSafari) {
        msg =
          "To install on iPhone or iPad:\n\n" +
          "1. Tap the Share button (the square with an upward arrow).\n" +
          "2. Scroll down and tap \u201cAdd to Home Screen\u201d.\n" +
          "3. Tap \u201cAdd\u201d.";
      } else {
        msg =
          "On iPhone or iPad, apps can only be installed from Safari.\n\n" +
          "1. Open this page in Safari.\n" +
          "2. Tap the Share button, then \u201cAdd to Home Screen\u201d.";
      }
    } else {
      msg =
        "To install this app for offline use:\n\n" +
        "Use your browser menu (\u22ee or \u2026) and choose \u201cInstall app\u201d " +
        "or \u201cAdd to Home screen\u201d.";
    }
    alert(msg);
  };

  window.addEventListener("appinstalled", function () {
    hideBtn();
  });
})();
