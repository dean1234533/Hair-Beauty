import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, where, getDocs, getDoc, doc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── FIREBASE CONFIG ─────────────────────────────────────────
// Replace these values with your Firebase project config
// Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyBWQwG1eSAnEPotMSnABuPl4xBLxnvbKgE",
  authDomain: "salon-booking-72d67.firebaseapp.com",
  projectId: "salon-booking-72d67",
  storageBucket: "salon-booking-72d67.firebasestorage.app",
  messagingSenderId: "302394452383",
  appId: "1:302394452383:web:b244e4cdaf162fae0175aa",
  measurementId: "G-01B9QBJCRB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── STATE ───────────────────────────────────────────────────
const booking = { service: null, price: null, date: null, time: null };

// ─── HELPERS ─────────────────────────────────────────────────
function showPanel(id) {
  document.querySelectorAll('.booking-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function updateStepper(activeStep) {
  document.querySelectorAll('.booking-step-indicator').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === activeStep) el.classList.add('active');
    if (s < activeStep) el.classList.add('done');
  });
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const DEFAULT_HOURS = {
  monday:    { open: true, start: '09:00', end: '20:00' },
  tuesday:   { open: true, start: '09:00', end: '20:00' },
  wednesday: { open: true, start: '09:00', end: '20:00' },
  thursday:  { open: true, start: '09:00', end: '20:00' },
  friday:    { open: true, start: '09:00', end: '20:00' },
  saturday:  { open: true, start: '08:00', end: '19:00' },
  sunday:    { open: true, start: '10:00', end: '17:00' },
};

async function getSlotsForDay(date) {
  let hours = DEFAULT_HOURS;
  try {
    const snap = await getDoc(doc(db, 'settings', 'hours'));
    if (snap.exists()) hours = snap.data();
  } catch (e) { /* use defaults */ }

  const dayKey = DAY_KEYS[date.getDay()];
  const h = hours[dayKey];

  if (!h || !h.open) return [];

  const [startH, startM] = h.start.split(':').map(Number);
  const [endH, endM]     = h.end.split(':').map(Number);
  const startMins = startH * 60 + startM;
  const endMins   = endH   * 60 + endM;

  const slots = [];
  for (let m = startMins; m < endMins; m += 30) {
    slots.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
  }
  return slots;
}

// ─── STEP 1: SERVICE ─────────────────────────────────────────
document.querySelectorAll('.booking-service-card').forEach(card => {
  card.addEventListener('click', () => selectService(card));
});

function selectService(card) {
  document.querySelectorAll('.booking-service-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  booking.service = card.dataset.service;
  booking.price   = card.dataset.price;
  document.getElementById('step1Next').disabled = false;
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Pre-select service from URL parameter (e.g. booking.html?service=Cuts+%26+Styling)
const preselect = new URLSearchParams(location.search).get('service');
if (preselect) {
  const match = [...document.querySelectorAll('.booking-service-card')]
    .find(c => c.dataset.service === preselect);
  if (match) selectService(match);
}

document.getElementById('step1Next').addEventListener('click', () => {
  showPanel('step-2');
  updateStepper(2);
  renderCalendar();
});

// ─── STEP 2: CALENDAR ────────────────────────────────────────
let calDate = new Date();
calDate.setDate(1);

function renderCalendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  document.getElementById('calMonth').textContent =
    calDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  // Monday-first offset
  const offset = (firstDay === 0 ? 6 : firstDay - 1);
  for (let i = 0; i < offset; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day empty';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const thisDate = new Date(year, month, d);
    thisDate.setHours(0, 0, 0, 0);

    cell.className = 'cal-day';
    cell.textContent = d;

    if (thisDate < today) {
      cell.classList.add('past');
    } else {
      if (thisDate.getTime() === today.getTime()) cell.classList.add('today');

      if (booking.date && dateKey(booking.date) === dateKey(thisDate)) {
        cell.classList.add('selected');
      }

      cell.addEventListener('click', () => {
        booking.date = thisDate;
        document.querySelectorAll('.cal-day').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        document.getElementById('step2Next').disabled = false;
      });
    }

    grid.appendChild(cell);
  }
}

document.getElementById('calPrev').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('calNext').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
});

document.getElementById('step2Back').addEventListener('click', () => {
  showPanel('step-1');
  updateStepper(1);
});

document.getElementById('step2Next').addEventListener('click', async () => {
  showPanel('step-3');
  updateStepper(3);
  await renderTimeSlots();
});

// ─── STEP 3: TIME SLOTS ──────────────────────────────────────
async function renderTimeSlots() {
  const label = document.getElementById('selectedDateLabel');
  label.textContent = formatDate(booking.date);

  const container = document.getElementById('timeSlots');
  container.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Loading availability…</p>';

  // Fetch already-booked slots from Firestore
  let bookedSlots = [];
  try {
    const key = dateKey(booking.date);
    const q = query(collection(db, 'bookings'), where('dateKey', '==', key));
    const snap = await getDocs(q);
    snap.forEach(doc => bookedSlots.push(doc.data().time));
  } catch (e) {
    console.warn('Could not fetch bookings:', e);
  }

  const slots = await getSlotsForDay(booking.date);

  if (slots.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:14px;padding:20px 0">We are closed on this day. Please choose another date.</p>';
    return;
  }

  container.innerHTML = '';

  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.className = 'time-slot';
    btn.textContent = slot;

    if (bookedSlots.includes(slot)) {
      btn.classList.add('booked');
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
        booking.time = slot;
        document.getElementById('step3Next').disabled = false;
      });
    }

    container.appendChild(btn);
  });
}

document.getElementById('step3Back').addEventListener('click', () => {
  showPanel('step-2');
  updateStepper(2);
});

document.getElementById('step3Next').addEventListener('click', () => {
  showPanel('step-4');
  updateStepper(4);
  renderSummaryBar();
});

// ─── STEP 4: DETAILS ─────────────────────────────────────────
function renderSummaryBar() {
  document.getElementById('summaryBar').innerHTML = `
    <span><strong>${booking.service}</strong></span>
    <span>${formatDate(booking.date)}</span>
    <span>${booking.time}</span>
    <span style="color:var(--gold)">${booking.price}</span>
  `;
}

document.getElementById('step4Back').addEventListener('click', () => {
  showPanel('step-3');
  updateStepper(3);
});

document.getElementById('step4Submit').addEventListener('click', async () => {
  const name = document.getElementById('bName').value.trim();
  const phone = document.getElementById('bPhone').value.trim();
  const email = document.getElementById('bEmail').value.trim();
  const notes = document.getElementById('bNotes').value.trim();

  if (!name || !phone || !email) {
    document.getElementById('bName').reportValidity();
    document.getElementById('bPhone').reportValidity();
    document.getElementById('bEmail').reportValidity();
    return;
  }

  const submitBtn = document.getElementById('step4Submit');
  submitBtn.textContent = 'Saving…';
  submitBtn.classList.add('btn--loading');

  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      service: booking.service,
      price: booking.price,
      date: Timestamp.fromDate(booking.date),
      dateKey: dateKey(booking.date),
      time: booking.time,
      name,
      phone,
      email,
      notes,
      status: 'pending',
      createdAt: Timestamp.now()
    });

    showConfirmation(docRef.id, name);
  } catch (e) {
    console.error('Booking failed:', e);
    submitBtn.textContent = 'Error — try again';
    submitBtn.classList.remove('btn--loading');
    submitBtn.style.background = '#8b2020';
  }
});

// ─── CONFIRMATION ─────────────────────────────────────────────
function showConfirmation(refId, name) {
  document.getElementById('confirmRef').textContent = refId.slice(0, 8).toUpperCase();
  document.getElementById('confirmDetails').innerHTML = `
    <p><span>Name</span><span>${name}</span></p>
    <p><span>Service</span><span>${booking.service}</span></p>
    <p><span>Date</span><span>${formatDate(booking.date)}</span></p>
    <p><span>Time</span><span>${booking.time}</span></p>
    <p><span>Price</span><span>${booking.price}</span></p>
  `;

  // Hide stepper on confirmation
  document.getElementById('stepper').style.display = 'none';
  showPanel('step-confirm');
}
