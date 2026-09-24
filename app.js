// Page-side PWA wiring: register the service worker and handle installation.
// Nothing here transmits data; the service worker only caches same-origin files.
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        // Offline support simply won't activate; app still works online.
        console.warn("Service worker registration failed:", err);
      });
    });
  }

  // Capture the beforeinstallprompt event (Chromium / Edge / Android).
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById("installBtn");
    if (btn) btn.classList.remove("hidden");
  });

  // Expose an installer callable from the button's onclick.
  window.installPWA = function () {
    var btn = document.getElementById("installBtn");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        if (btn) btn.classList.add("hidden");
      });
    } else if (btn) {
      // No auto-prompt available (e.g., iOS Safari): show manual instructions.
      alert(
        "To install on iPhone or iPad (Safari): tap the Share button, then choose " +
        "\u201cAdd to Home Screen\u201d.\n\n" +
        "On Android (Chrome) or desktop (Edge/Chrome): use the browser menu \u2192 " +
        "\u201cInstall app\u201d or \u201cAdd to Home screen / Install\u201d."
      );
    }
  };

  window.addEventListener("appinstalled", function () {
    var btn = document.getElementById("installBtn");
    if (btn) btn.classList.add("hidden");
  });
})();
