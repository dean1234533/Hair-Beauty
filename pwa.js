// Register service worker (relative path works on GitHub Pages subdirectories)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// ─── INSTALL BANNER ──────────────────────────────────────────
(function () {
  const banner       = document.getElementById('pwaBanner');
  if (!banner) return;

  const closeBtn     = document.getElementById('pwaBannerClose');
  const installBtn   = document.getElementById('pwaInstallBtn');
  const instructions = document.getElementById('pwaBannerInstructions');

  // Don't show if already installed or dismissed this session
  const dismissed    = sessionStorage.getItem('pwaDismissed');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  if (isStandalone) return; // already running as installed app

  let deferredPrompt = null;

  // Chrome / Android — catch the native install prompt
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (!dismissed) {
      installBtn.style.display = 'inline-flex';
      instructions.textContent = 'Install the app for quick access.';
      showBanner();
    }
  });

  // iOS — show manual share-sheet instructions
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS && !dismissed) {
    instructions.textContent = 'Tap the share icon ⎎ at the bottom of your browser, then tap “Add to Home Screen”.';
    showBanner();
  }

  installBtn.addEventListener('click', function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (result) {
      if (result.outcome === 'accepted') hideBanner();
      deferredPrompt = null;
    });
  });

  closeBtn.addEventListener('click', function () {
    hideBanner();
    sessionStorage.setItem('pwaDismissed', '1');
  });

  window.addEventListener('appinstalled', hideBanner);

  function showBanner() {
    setTimeout(function () { banner.classList.add('visible'); }, 1500);
  }

  function hideBanner() {
    banner.classList.remove('visible');
  }
}());
