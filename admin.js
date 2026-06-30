import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, onSnapshot, doc, updateDoc, orderBy, query } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

// ─── CONFIG — same values as booking.js and sw.js ────────────
const firebaseConfig = {
  apiKey: "AIzaSyBWQwG1eSAnEPotMSnABuPl4xBLxnvbKgE",
  authDomain: "salon-booking-72d67.firebaseapp.com",
  projectId: "salon-booking-72d67",
  storageBucket: "salon-booking-72d67.firebasestorage.app",
  messagingSenderId: "302394452383",
  appId: "1:302394452383:web:b244e4cdaf162fae0175aa",
  measurementId: "G-01B9QBJCRB"
};

// Replace with your VAPID key from Firebase Console →
// Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = "clLmWL5UQewpPZFh-ttdWjIrWLUts3MtQ9bxZog50jI";

// Set your admin password here
const ADMIN_PASSWORD = "dacutsadmin2026";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── PASSWORD GATE ────────────────────────────────────────────
const gate = document.getElementById('adminGate');
const dash = document.getElementById('adminDash');

if (sessionStorage.getItem('adminAuthed') === '1') {
  showDash();
}

document.getElementById('adminLogin').addEventListener('click', login);
document.getElementById('adminPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

function login() {
  const val = document.getElementById('adminPassword').value;
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminAuthed', '1');
    showDash();
  } else {
    document.getElementById('adminError').textContent = 'Incorrect password.';
  }
}

function showDash() {
  gate.style.display = 'none';
  dash.style.display = 'block';
  initDash();
}

document.getElementById('adminLogout').addEventListener('click', () => {
  sessionStorage.removeItem('adminAuthed');
  location.reload();
});

// ─── DASHBOARD ────────────────────────────────────────────────
let allBookings = [];
let currentFilter = 'all';
let searchTerm = '';
let isFirstLoad = true;

function initDash() {
  const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

  onSnapshot(q, snap => {
    const incoming = [];
    snap.forEach(d => incoming.push({ id: d.id, ...d.data() }));

    // Detect new booking (not on first load)
    if (!isFirstLoad && incoming.length > allBookings.length) {
      const newest = incoming[0];
      triggerNewBookingAlert(newest);
    }

    allBookings = incoming;
    isFirstLoad = false;
    updateStats();
    renderBookings();
  });
}

// ─── STATS ───────────────────────────────────────────────────
function updateStats() {
  const todayKey = todayDateKey();
  const weekStart = getWeekStart();

  document.getElementById('statTotal').textContent = allBookings.length;
  document.getElementById('statToday').textContent = allBookings.filter(b => b.dateKey === todayKey).length;
  document.getElementById('statPending').textContent = allBookings.filter(b => b.status === 'pending').length;
  document.getElementById('statThisWeek').textContent = allBookings.filter(b => {
    const d = b.date?.toDate ? b.date.toDate() : new Date(b.dateKey);
    return d >= weekStart;
  }).length;
}

function todayDateKey() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ─── FILTERS + SEARCH ────────────────────────────────────────
document.querySelectorAll('.admin-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderBookings();
  });
});

document.getElementById('adminSearch').addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase();
  renderBookings();
});

// ─── RENDER BOOKINGS ─────────────────────────────────────────
function renderBookings() {
  const container = document.getElementById('adminBookings');

  let filtered = allBookings;

  if (currentFilter !== 'all') {
    filtered = filtered.filter(b => b.status === currentFilter);
  }

  if (searchTerm) {
    filtered = filtered.filter(b =>
      b.name?.toLowerCase().includes(searchTerm) ||
      b.service?.toLowerCase().includes(searchTerm) ||
      b.email?.toLowerCase().includes(searchTerm)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="admin-empty">No bookings found</div>';
    return;
  }

  container.innerHTML = filtered.map(b => {
    const date = b.date?.toDate ? b.date.toDate() : new Date(b.dateKey);
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return `
      <div class="booking-row" id="row-${b.id}">
        <div>
          <div class="booking-row__name">${esc(b.name)}</div>
          <div class="booking-row__contact">${esc(b.phone)} · ${esc(b.email)}</div>
          ${b.notes ? `<div class="booking-row__contact" style="margin-top:4px;font-style:italic">"${esc(b.notes)}"</div>` : ''}
        </div>
        <div>
          <div class="booking-row__service">${esc(b.service)}</div>
          <div class="booking-row__price">${esc(b.price)}</div>
        </div>
        <div class="booking-row__datetime">${dateStr}<br />${esc(b.time)}</div>
        <div class="booking-row__datetime" style="color:var(--text-muted);font-size:11px">
          Ref: ${b.id.slice(0,8).toUpperCase()}<br />
          ${b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('en-GB') : ''}
        </div>
        <div class="booking-row__status">
          <select data-id="${b.id}" data-status="${b.status}" onchange="updateStatus(this)">
            <option value="pending"   ${b.status==='pending'   ? 'selected':''}>Pending</option>
            <option value="confirmed" ${b.status==='confirmed' ? 'selected':''}>Confirmed</option>
            <option value="cancelled" ${b.status==='cancelled' ? 'selected':''}>Cancelled</option>
          </select>
        </div>
      </div>
    `;
  }).join('');
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Update booking status in Firestore
window.updateStatus = async function(select) {
  const id = select.dataset.id;
  const status = select.value;
  select.dataset.status = status;
  await updateDoc(doc(db, 'bookings', id), { status });
};

// ─── NEW BOOKING ALERT ────────────────────────────────────────
function triggerNewBookingAlert(booking) {
  // In-app notification
  if (Notification.permission === 'granted') {
    new Notification('New Booking — Da Cuts', {
      body: `${booking.name} · ${booking.service} · ${booking.dateKey} at ${booking.time}`,
      icon: '/icons/icon-192.png'
    });
  }

  // Highlight the new row briefly
  setTimeout(() => {
    const row = document.getElementById(`row-${booking.id}`);
    if (row) row.classList.add('booking-row__new');
  }, 300);
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────
const notifyBtn = document.getElementById('enableNotifications');

// Check if already enabled
if (Notification.permission === 'granted') {
  notifyBtn.textContent = '🔔 Notifications On';
  notifyBtn.classList.add('enabled');
}

notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support notifications.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Notification permission denied. Enable it in your browser settings.');
    return;
  }

  notifyBtn.textContent = '🔔 Notifications On';
  notifyBtn.classList.add('enabled');

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('FCM Token (save this or store in Firestore):', token);

    // Handle foreground messages
    onMessage(messaging, payload => {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icons/icon-192.png'
      });
    });
  } catch (e) {
    // FCM requires HTTPS in production — falls back to in-app only on localhost
    console.warn('FCM token error (normal on localhost):', e.message);
  }
});
