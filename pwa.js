// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ─── INSTALL BANNER ──────────────────────────────────────────
const banner = document.getElementById('pwaBanner');
const closeBtn = document.getElementById('pwaBannerClose');
const installBtn = document.getElementById('pwaInstallBtn');
const instructions = document.getElementById('pwaBannerInstructions');

if (!banner) return; // not on a page with the banner

// Don't show if already installed or dismissed this session
const dismissed = sessionStorage.getItem('pwaDismissed');
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

let deferredPrompt = null;

// Chrome/Android: catch the install prompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (!dismissed && !isStandalone) {
    installBtn.style.display = 'inline-flex';
    instructions.textContent = 'Install the app for quick booking access.';
    showBanner();
  }
});

// iOS: show manual instructions
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
if (isIOS && !dismissed && !isStandalone) {
  instructions.textContent = 'Tap the share icon ⎙ at the bottom of your browser, then tap "Add to Home Screen".';
  showBanner();
}

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') hideBanner();
  deferredPrompt = null;
});

closeBtn.addEventListener('click', () => {
  hideBanner();
  sessionStorage.setItem('pwaDismissed', '1');
});

function showBanner() {
  setTimeout(() => banner.classList.add('visible'), 1500);
}

function hideBanner() {
  banner.classList.remove('visible');
}

// Hide banner once installed
window.addEventListener('appinstalled', hideBanner);
