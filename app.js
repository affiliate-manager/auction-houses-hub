// ===========================
// UK Auction Houses Hub - App Logic
// ===========================

const BRIDGING_URL = 'https://app.lendlord.io/bridging-application?country=uk&utm_source=Lendlord&utm_campaign=auction_houses_hub';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const filterSpec = document.getElementById('filterSpec');
const filterRegion = document.getElementById('filterRegion');
const filterFormat = document.getElementById('filterFormat');
const filterData = document.getElementById('filterData');
const filterCondition = document.getElementById('filterCondition');
const filterVendor = document.getElementById('filterVendor');
const clearFiltersBtn = document.getElementById('clearFilters');
const clearFiltersAlt = document.getElementById('clearFiltersAlt');
const resultsGrid = document.getElementById('resultsGrid');
const resultsCount = document.getElementById('resultsCount');
const noResults = document.getElementById('noResults');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.getElementById('nav');
const header = document.getElementById('header');

// State
let currentView = 'grid';
let filteredHouses = [...AUCTION_HOUSES];

// ===========================
// Initialization
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  renderCards(AUCTION_HOUSES);
  setupEventListeners();
  setupScrollHeader();
  // Calendar init
  initCalendar();
  // Sidebar mini calendar
  initSidebarCalendar();
  // Event ticker
  initEventTicker();
  // Recently viewed
  renderRecentlyViewed();
  // Watchlist
  renderWatchlist();
  // Guides accordion
  initGuides();
  // Auction results
  initResults();
});

// ===========================
// Event Listeners
// ===========================
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', debounce(applyFilters, 200));
  searchInput.addEventListener('input', () => {
    searchClear.style.display = searchInput.value ? 'block' : 'none';
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    applyFilters();
  });

  // Filters
  [filterSpec, filterRegion, filterFormat, filterData, filterCondition, filterVendor].forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  // Clear filters
  clearFiltersBtn.addEventListener('click', clearAllFilters);
  clearFiltersAlt.addEventListener('click', clearAllFilters);

  // View toggle
  gridViewBtn.addEventListener('click', () => setView('grid'));
  listViewBtn.addEventListener('click', () => setView('list'));

  // Modal
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Mobile menu
  mobileMenuBtn.addEventListener('click', () => {
    nav.classList.toggle('open');
    mobileMenuBtn.classList.toggle('active');
  });

  // Close mobile menu on link click
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      mobileMenuBtn.classList.remove('active');
    });
  });
}

function setupScrollHeader() {
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    header.classList.toggle('scrolled', scroll > 10);
    if (backToTop) backToTop.classList.toggle('visible', scroll > 500);
    if (sidebarCalendar) sidebarCalendar.classList.toggle('visible', scroll > 1500);
  });
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ===========================
// Filtering
// ===========================
function applyFilters() {
  const search = searchInput.value.toLowerCase().trim();
  const spec = filterSpec.value;
  const region = filterRegion.value;
  const format = filterFormat.value;
  const data = filterData.value;
  const condition = filterCondition.value;
  const vendor = filterVendor.value;

  filteredHouses = AUCTION_HOUSES.filter(h => {
    // Search by name
    if (search && !h.name.toLowerCase().includes(search)) return false;

    // Specialisation
    if (spec && h.spec !== spec) return false;

    // Region
    if (region) {
      if (region === 'National') {
        if (h.reach !== 'National') return false;
      } else {
        if (!h.regions.some(r => r.toLowerCase().includes(region.toLowerCase()))) return false;
      }
    }

    // Format
    if (format && h.format !== format) return false;

    // Data transparency
    if (data) {
      if (data === 'high' && h.dataRating < 4) return false;
      if (data === 'medium' && h.dataRating !== 3) return false;
      if (data === 'low' && h.dataRating > 2) return false;
    }

    // Condition
    if (condition && !h.conditions.includes(condition)) return false;

    // Vendor
    if (vendor && !h.vendors.some(v => v.includes(vendor))) return false;

    return true;
  });

  renderCards(filteredHouses);
  updateResultsCount(filteredHouses.length);
}

function clearAllFilters() {
  searchInput.value = '';
  searchClear.style.display = 'none';
  filterSpec.value = '';
  filterRegion.value = '';
  filterFormat.value = '';
  filterData.value = '';
  filterCondition.value = '';
  filterVendor.value = '';
  applyFilters();
}

// ===========================
// Rendering
// ===========================
function renderCards(houses) {
  resultsGrid.innerHTML = '';
  noResults.style.display = houses.length === 0 ? 'block' : 'none';

  houses.forEach((house, index) => {
    // Insert inline CTA every 15 cards
    if (index > 0 && index % 15 === 0) {
      resultsGrid.appendChild(createInlineCTA(index));
    }

    const card = document.createElement('div');
    card.className = 'auction-card';
    card.setAttribute('data-id', house.id);
    card.innerHTML = createCardHTML(house);
    card.addEventListener('click', (e) => {
      // Don't open modal if clicking a button/link
      if (e.target.closest('a') || e.target.closest('button')) return;
      openModal(house);
    });
    resultsGrid.appendChild(card);
  });

  // Add event listeners to card buttons
  resultsGrid.querySelectorAll('.card-visit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });
}

function createCardHTML(h) {
  const stars = renderStars(h.dataRating);
  const specClass = getSpecClass(h.spec);
  const reachClass = h.reach.toLowerCase();

  const watched = isWatched(h.id);
  return `
    <div class="card-header">
      <div class="card-title-row">
        <span class="card-name">${h.name}</span>
        <button class="wl-heart ${watched ? 'active' : ''}" data-wl-id="${h.id}" onclick="event.stopPropagation();toggleWatchlist(${h.id})" title="Add to watchlist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${watched ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        </button>
      </div>
      <div class="card-reach-rating">
        <span class="card-reach ${reachClass}">${h.reach}</span>
        <div class="card-rating" title="Data Transparency: ${h.dataRating}/5">${stars}</div>
      </div>
    </div>
    <p class="card-desc">${h.desc}</p>
    <div class="card-properties">
      <div class="card-prop-label">Properties offered</div>
      <div class="card-tags">
        <span class="tag ${specClass}">${h.spec}</span>
        ${h.lots.map(l => `<span class="tag">${l}</span>`).join('')}
      </div>
      ${h.conditions && h.conditions.length ? `
      <div class="card-prop-label" style="margin-top:6px">Condition</div>
      <div class="card-tags">
        ${h.conditions.map(c => `<span class="tag tag-outline">${c}</span>`).join('')}
      </div>` : ''}
      ${h.niches && h.niches.length ? `
      <div class="card-prop-label" style="margin-top:6px">Specialities</div>
      <div class="card-tags">
        ${h.niches.map(n => `<span class="tag tag-niche">${n}</span>`).join('')}
      </div>` : ''}
    </div>
    <div class="card-stats">
      <div class="card-stat">
        <span class="card-stat-label">Success Rate</span>
        <span class="card-stat-value">~${h.successRate}%</span>
      </div>
      <div class="card-stat">
        <span class="card-stat-label">Format</span>
        <span class="card-stat-value">${h.format}</span>
      </div>
      <div class="card-stat">
        <span class="card-stat-label">Buyer's Premium</span>
        <span class="card-stat-value">${h.buyerPrem}</span>
      </div>
      <div class="card-stat">
        <span class="card-stat-label">Completion</span>
        <span class="card-stat-value">${h.completion} days</span>
      </div>
    </div>
    <div class="card-actions">
      <a href="${h.url}" target="_blank" rel="noopener" class="btn btn-outline btn-sm card-visit-btn">Visit Website</a>
      <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm card-visit-btn">Get Auction Finance</a>
    </div>
  `;
}

function createInlineCTA(index) {
  const messages = [
    { title: 'Found a Property You Like?', text: 'Get bridging finance pre-approved before auction day and bid with confidence.' },
    { title: 'Need to Complete in 28 Days?', text: 'Bridging loans are designed for auction purchases. Fast decisions, fast completions.' },
    { title: 'Compare Auction Finance Options', text: 'Access competitive bridging loan rates for your next auction purchase.' },
    { title: 'First Time at Auction?', text: 'Having finance in place before you bid is the smart approach. Get pre-approved in minutes.' },
    { title: 'Ready to Make Your Move?', text: 'Don\'t let finance hold you back. Pre-approval takes just 5 minutes.' },
    { title: 'Buying at Auction This Month?', text: 'Join thousands of investors who arrange their bridging finance before bidding.' }
  ];
  const msg = messages[(index / 15 - 1) % messages.length];

  const div = document.createElement('div');
  div.className = 'inline-cta';
  div.innerHTML = `
    <div class="inline-cta-content">
      <h3>${msg.title}</h3>
      <p>${msg.text}</p>
    </div>
    <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-lg">
      Apply Now
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
  `;
  return div;
}

// ===========================
// Modal Helpers
// ===========================
function buildModalUpcomingEvents(h) {
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  let events = [];
  if (typeof AUCTION_EVENTS !== 'undefined') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    events = AUCTION_EVENTS
      .filter(e => (e.houseId === h.id || e.house === h.name) && new Date(e.date + 'T00:00:00') >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }

  let bodyContent;
  if (events.length === 0) {
    bodyContent = `<div class="modal-empty-state">
      <p>No scheduled auction dates available. Visit the auction house website for the latest catalogue.</p>
      <a href="${h.url}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
        View Current Lots on ${h.name}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
    </div>`;
  } else {
    const rows = events.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      const dateStr = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      const typeClass = e.type.toLowerCase();
      return `<tr>
        <td><strong>${dateStr}</strong></td>
        <td>${e.time}</td>
        <td><span class="cal-event-type-badge ${typeClass}">${e.type}</span></td>
        <td>${e.region}</td>
        <td class="modal-event-notes">${e.notes}</td>
      </tr>`;
    }).join('');
    bodyContent = `<table class="modal-events-table">
      <thead><tr><th>Date</th><th>Time</th><th>Format</th><th>Region</th><th>Details</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  return `
    <div class="modal-listings-section">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        Upcoming Auctions ${events.length ? '(' + events.length + ')' : ''}
      </h4>
      ${bodyContent}
    </div>`;
}

function buildModalRecentResults(h) {
  let results = [];
  if (typeof AUCTION_RESULTS !== 'undefined') {
    results = AUCTION_RESULTS
      .filter(r => r.houseId === h.id || r.house === h.name)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }

  let bodyContent;
  if (results.length === 0) {
    bodyContent = `<div class="modal-empty-state">
      <p>No recent results tracked for this auction house yet.</p>
    </div>`;
  } else {
    const rows = results.map(r => {
      const diff = ((r.salePrice - r.guidePrice) / r.guidePrice) * 100;
      const diffClass = diff >= 0 ? 'positive' : 'negative';
      const diffStr = (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%';
      return `<tr>
        <td class="modal-result-address">${r.address}</td>
        <td>${r.type}</td>
        <td>&pound;${r.guidePrice.toLocaleString()}</td>
        <td><strong>&pound;${r.salePrice.toLocaleString()}</strong></td>
        <td class="${diffClass}">${diffStr}</td>
      </tr>`;
    }).join('');
    bodyContent = `<table class="modal-events-table">
      <thead><tr><th>Address</th><th>Type</th><th>Guide</th><th>Sold</th><th>+/-</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  return `
    <div class="modal-listings-section">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        Recent Sold Lots ${results.length ? '(' + results.length + ')' : ''}
      </h4>
      ${bodyContent}
    </div>`;
}

// ===========================
// Modal
// ===========================
function openModal(h) {
  const stars = renderStars(h.dataRating);
  const specClass = getSpecClass(h.spec);

  modalContent.innerHTML = `
    <div class="modal-header">
      <div>
        <h2 class="modal-name">${h.name}</h2>
        <a href="${h.url}" target="_blank" rel="noopener" class="modal-url">
          ${h.url.replace('https://', '').replace(/\/$/, '')}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      </div>
    </div>

    <p class="modal-desc">${h.desc}</p>

    <div class="modal-grid">
      <div class="modal-section">
        <h4>Primary Specialisation</h4>
        <div class="card-tags">
          <span class="tag ${specClass}">${h.spec}</span>
          ${h.lots.map(l => `<span class="tag">${l}</span>`).join('')}
        </div>
      </div>

      <div class="modal-section">
        <h4>Lot Conditions</h4>
        <div class="card-tags">
          ${h.conditions.map(c => `<span class="tag">${c}</span>`).join('')}
        </div>
        <p class="modal-section-detail" style="margin-top:8px">Tenure: ${h.tenure}</p>
      </div>

      <div class="modal-section">
        <h4>Geographic Footprint</h4>
        <p class="modal-section-value">${h.reach} Coverage</p>
        <p class="modal-section-detail">${h.area}</p>
        <div class="card-tags" style="margin-top:8px">
          ${h.regions.map(r => `<span class="tag">${r}</span>`).join('')}
        </div>
      </div>

      <div class="modal-section">
        <h4>Market Performance</h4>
        <p class="modal-section-detail">Success Rate: <strong>~${h.successRate}%</strong></p>
        <p class="modal-section-detail">Premium to Guide: <strong>${h.premium}</strong></p>
        <p class="modal-section-detail">Bargain Incidence: <strong>${h.bargains}</strong></p>
      </div>

      <div class="modal-section">
        <h4>Vendor Profile</h4>
        <div class="card-tags">
          ${h.vendors.map(v => `<span class="tag">${v}</span>`).join('')}
        </div>
        <p class="modal-section-detail" style="margin-top:8px">Primary: ${h.vendorPrimary}</p>
      </div>

      <div class="modal-section">
        <h4>Auction Format & Terms</h4>
        <p class="modal-section-detail">Format: <strong>${h.format}</strong></p>
        <p class="modal-section-detail">Buyer's Premium: <strong>${h.buyerPrem}</strong></p>
        <p class="modal-section-detail">Deposit: <strong>${h.deposit}</strong></p>
        <p class="modal-section-detail">Completion: <strong>${h.completion} working days</strong></p>
      </div>

      <div class="modal-section">
        <h4>Data Transparency</h4>
        <div class="card-rating" style="margin-bottom:8px">${stars}</div>
        <p class="modal-section-detail">Historical Results: ${h.historical ? '✓ Available' : '✗ Limited'}</p>
        <p class="modal-section-detail">Catalogue Download: ${h.catalogue ? '✓ Available' : '✗ Limited'}</p>
      </div>

      ${h.niches && h.niches.length ? `
      <div class="modal-section">
        <h4>Specialist Niches</h4>
        <div class="card-tags">
          ${h.niches.map(n => `<span class="tag">${n}</span>`).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    ${h.highlights && h.highlights.length ? `
    <div class="modal-highlights">
      <h4>Key Highlights</h4>
      <ul>
        ${h.highlights.map(hl => `<li>${hl}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${buildModalUpcomingEvents(h)}
    ${buildModalRecentResults(h)}

    <div class="modal-actions">
      <a href="${h.url}" target="_blank" rel="noopener" class="btn btn-primary">
        Visit ${h.name}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
      </a>
      <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent">
        Finance a Purchase from ${h.name}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
  `;

  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  trackRecentlyViewed(h.id, h.name);
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ===========================
// View Toggle
// ===========================
function setView(view) {
  currentView = view;
  if (view === 'list') {
    resultsGrid.classList.add('list-view');
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
  } else {
    resultsGrid.classList.remove('list-view');
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
  }
}

// ===========================
// Helpers
// ===========================
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      html += '<svg class="card-star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    } else {
      html += '<svg class="card-star empty" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
  }
  return html;
}

function getSpecClass(spec) {
  switch (spec) {
    case 'Residential': return 'spec-residential';
    case 'Commercial': return 'spec-commercial';
    case 'Mixed': return 'spec-mixed';
    case 'Rural/Land': return 'spec-rural';
    default: return '';
  }
}

function updateResultsCount(count) {
  resultsCount.textContent = `Showing ${count} of ${AUCTION_HOUSES.length} auction houses`;
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ===========================
// Calendar
// ===========================
const calGrid = document.getElementById('calGrid');
const calMonthTitle = document.getElementById('calMonthTitle');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const calEventPanel = document.getElementById('calEventPanel');
const calEventDate = document.getElementById('calEventDate');
const calEventList = document.getElementById('calEventList');
const calEventClose = document.getElementById('calEventClose');
const calFilterRegion = document.getElementById('calFilterRegion');
const calFilterHouse = document.getElementById('calFilterHouse');
const calOngoingGrid = document.getElementById('calOngoingGrid');

let calCurrentMonth = new Date().getMonth(); // 0-indexed
let calCurrentYear = 2026;
let calSelectedDate = null;

function initCalendar() {
  // Set initial month to current if 2026, else January
  const now = new Date();
  if (now.getFullYear() === 2026) {
    calCurrentMonth = now.getMonth();
  } else {
    calCurrentMonth = 0; // January
  }
  calCurrentYear = 2026;

  populateCalHouseFilter();
  renderCalendar();
  renderOngoingAuctioneers();
  setupCalendarEvents();
}

function setupCalendarEvents() {
  calPrev.addEventListener('click', () => {
    calCurrentMonth--;
    if (calCurrentMonth < 0) { calCurrentMonth = 11; calCurrentYear--; }
    renderCalendar();
    hideEventPanel();
  });
  calNext.addEventListener('click', () => {
    calCurrentMonth++;
    if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
    renderCalendar();
    hideEventPanel();
  });
  calEventClose.addEventListener('click', hideEventPanel);
  calFilterRegion.addEventListener('change', () => { renderCalendar(); hideEventPanel(); });
  calFilterHouse.addEventListener('change', () => { renderCalendar(); hideEventPanel(); });
}

function populateCalHouseFilter() {
  const houses = new Set();
  AUCTION_EVENTS.forEach(e => houses.add(e.house));
  const sorted = [...houses].sort();
  sorted.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    calFilterHouse.appendChild(opt);
  });
}

function getFilteredEvents() {
  const region = calFilterRegion.value;
  const house = calFilterHouse.value;
  return AUCTION_EVENTS.filter(e => {
    if (region && e.region !== region) return false;
    if (house && e.house !== house) return false;
    return true;
  });
}

function renderCalendar() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  calMonthTitle.textContent = `${months[calCurrentMonth]} ${calCurrentYear}`;

  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1);
  const lastDay = new Date(calCurrentYear, calCurrentMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();
  const prevMonthLast = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  const events = getFilteredEvents();
  const eventsByDate = {};
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let html = '';

  // Previous month days
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    html += `<div class="cal-day other-month"><span class="cal-day-num">${d}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calCurrentYear}-${String(calCurrentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = eventsByDate[dateStr] || [];
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calSelectedDate;
    const hasEvents = dayEvents.length > 0;

    let classes = 'cal-day';
    if (isToday) classes += ' today';
    if (hasEvents) classes += ' has-events';
    if (isSelected) classes += ' selected';

    let eventsHtml = '';
    if (dayEvents.length > 0) {
      const show = dayEvents.slice(0, 3);
      show.forEach(e => {
        const typeClass = 'type-' + e.type.toLowerCase();
        eventsHtml += `<div class="cal-event-dot ${typeClass}">${e.house.length > 18 ? e.house.substring(0,16)+'..' : e.house}</div>`;
      });
      if (dayEvents.length > 3) {
        eventsHtml += `<div class="cal-event-more">+${dayEvents.length - 3} more</div>`;
      }
    }

    html += `<div class="${classes}" data-date="${dateStr}" ${hasEvents ? 'onclick="showEventsForDate(\''+dateStr+'\')"' : ''}>
      <span class="cal-day-num">${d}</span>
      <div class="cal-day-events">${eventsHtml}</div>
    </div>`;
  }

  // Next month days
  const totalCells = startDow + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${d}</span></div>`;
  }

  calGrid.innerHTML = html;
}

function showEventsForDate(dateStr) {
  calSelectedDate = dateStr;
  renderCalendar(); // re-render to highlight selected

  const events = getFilteredEvents().filter(e => e.date === dateStr);
  if (events.length === 0) { hideEventPanel(); return; }

  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  calEventDate.textContent = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} - ${events.length} auction${events.length > 1 ? 's' : ''}`;

  let html = '';
  events.sort((a, b) => a.time.localeCompare(b.time));
  events.forEach(e => {
    const typeClass = e.type.toLowerCase();
    const houseData = AUCTION_HOUSES.find(h => h.id === e.houseId);
    const houseUrl = houseData ? houseData.url : '#';
    html += `
      <div class="cal-event-item type-${typeClass}">
        <div class="cal-event-time">${e.time}</div>
        <div class="cal-event-info">
          <div class="cal-event-name">
            <a href="${houseUrl}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">${e.house}</a>
            <span class="cal-event-type-badge ${typeClass}">${e.type}</span>
          </div>
          <div class="cal-event-meta">${e.region} - ${e.notes}</div>
        </div>
      </div>
    `;
  });

  calEventList.innerHTML = html;
  calEventPanel.style.display = 'block';
  calEventPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideEventPanel() {
  calEventPanel.style.display = 'none';
  calSelectedDate = null;
  // Remove selected class from all days
  document.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
}

function navigateToCalendarEvent(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  // Set calendar to the correct month/year
  calCurrentMonth = d.getMonth();
  calCurrentYear = d.getFullYear();
  // Reset filters so the event is visible
  if (calFilterRegion) calFilterRegion.value = '';
  if (calFilterHouse) calFilterHouse.value = '';
  // Re-render calendar with correct month
  renderCalendar();
  // Scroll to calendar section
  const calSection = document.getElementById('calendar');
  if (calSection) {
    calSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Show event panel and highlight the date cell after scroll completes
  setTimeout(() => {
    showEventsForDate(dateStr);
    // Flash highlight the specific date cell
    const dateCell = document.querySelector(`.cal-day[data-date="${dateStr}"]`);
    if (dateCell) {
      dateCell.classList.add('ticker-highlight');
      setTimeout(() => dateCell.classList.remove('ticker-highlight'), 2000);
    }
  }, 500);
}

function renderOngoingAuctioneers() {
  if (!calOngoingGrid || typeof ONGOING_ONLINE_AUCTIONEERS === 'undefined') return;
  let html = '';
  ONGOING_ONLINE_AUCTIONEERS.forEach(a => {
    html += `
      <div class="cal-ongoing-item">
        <span class="ongoing-dot"></span>
        <div>
          <a href="${a.url}" target="_blank" rel="noopener">${a.house}</a>
          <span class="ongoing-note"> - ${a.notes}</span>
        </div>
      </div>
    `;
  });
  calOngoingGrid.innerHTML = html;
}

// ===========================
// Sidebar Mini Calendar
// ===========================
const sidebarCalendar = document.getElementById('sidebarCalendar');
const sidebarCalGrid = document.getElementById('sidebarCalGrid');
const sidebarCalTitle = document.getElementById('sidebarCalTitle');
const sidebarUpcoming = document.getElementById('sidebarUpcoming');

function initSidebarCalendar() {
  if (!sidebarCalendar) return;
  renderSidebarCalendar();
}

function renderSidebarCalendar() {
  const now = new Date();
  const year = 2026;
  const month = (now.getFullYear() === 2026) ? now.getMonth() : 1; // default Feb if not 2026

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  sidebarCalTitle.textContent = `${months[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();

  // Build event date set for this month
  const eventDates = new Set();
  AUCTION_EVENTS.forEach(e => {
    const d = new Date(e.date + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventDates.add(d.getDate());
    }
  });

  const today = new Date();
  const todayDate = (today.getFullYear() === year && today.getMonth() === month) ? today.getDate() : -1;

  let html = '';

  // Previous month filler
  for (let i = startDow - 1; i >= 0; i--) {
    html += `<span class="sc-day other">${prevMonthLast - i}</span>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'sc-day';
    if (d === todayDate) cls += ' today';
    if (eventDates.has(d)) cls += ' has-event';
    html += `<span class="${cls}">${d}</span>`;
  }

  // Next month filler
  const totalCells = startDow + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += `<span class="sc-day other">${d}</span>`;
  }

  sidebarCalGrid.innerHTML = html;

  // Render upcoming events (next 3)
  renderSidebarUpcoming();
}

function renderSidebarUpcoming() {
  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = AUCTION_EVENTS
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 4);

  if (upcoming.length === 0) {
    sidebarUpcoming.innerHTML = '<div class="sidebar-upcoming-item" style="color:var(--text-light);font-style:italic">No upcoming auctions</div>';
    return;
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let html = '';
  upcoming.forEach(e => {
    const d = new Date(e.date + 'T00:00:00');
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    const dotClass = e.type.toLowerCase();
    const name = e.house.length > 20 ? e.house.substring(0, 18) + '..' : e.house;
    html += `<div class="sidebar-upcoming-item"><span class="sc-dot ${dotClass}"></span><strong>${dateStr}</strong> ${name}</div>`;
  });

  sidebarUpcoming.innerHTML = html;
}

function setupSidebarVisibility() {
  const calSection = document.getElementById('calendar');
  if (!calSection || !sidebarCalendar) return;

  // Show sidebar only when not viewing the calendar section
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sidebarCalendar.classList.add('hidden');
      } else {
        sidebarCalendar.classList.remove('hidden');
      }
    });
  }, { threshold: 0.1 });

  observer.observe(calSection);

  // Also hide at very top of page (hero area)
  window.addEventListener('scroll', () => {
    if (window.scrollY < 300) {
      sidebarCalendar.classList.add('hidden');
    }
  });
}

// ===========================
// Event Ticker
// ===========================
function initEventTicker() {
  const tickerContent = document.getElementById('tickerContent');
  if (!tickerContent || typeof AUCTION_EVENTS === 'undefined') return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);

  const upcoming = AUCTION_EVENTS
    .filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= today && d <= weekLater;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  if (upcoming.length === 0) {
    document.getElementById('eventTicker').style.display = 'none';
    return;
  }

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function buildItems(events) {
    return events.map(e => {
      const d = new Date(e.date + 'T00:00:00');
      const dateStr = `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
      const typeClass = e.type.toLowerCase() === 'room' ? 'room' : 'online';
      const name = e.house.length > 25 ? e.house.substring(0, 23) + '..' : e.house;
      return `<div class="event-ticker-item" data-event-date="${e.date}">
        <span class="event-ticker-date">${dateStr}</span>
        <span class="event-ticker-type ${typeClass}">${e.type}</span>
        <span>${name}</span>
        <span style="opacity:0.5;font-size:0.75rem">${e.time} - ${e.region}</span>
      </div>`;
    }).join('');
  }

  // Duplicate items for seamless infinite scroll
  const itemsHtml = buildItems(upcoming);
  tickerContent.innerHTML = itemsHtml + itemsHtml;

  // Use event delegation for reliable clicks on animated elements
  tickerContent.addEventListener('click', function(e) {
    const item = e.target.closest('.event-ticker-item');
    if (item) {
      const dateStr = item.getAttribute('data-event-date');
      if (dateStr) navigateToCalendarEvent(dateStr);
    }
  });

  // Adjust animation speed based on content width
  requestAnimationFrame(() => {
    const contentWidth = tickerContent.scrollWidth / 2;
    const speed = 50; // pixels per second
    const duration = contentWidth / speed;
    tickerContent.style.animationDuration = duration + 's';
  });
}

// ===========================
// Auction Results
// ===========================
function initResults() {
  if (typeof AUCTION_RESULTS === 'undefined') return;
  const regionFilter = document.getElementById('resFilterRegion');
  const typeFilter = document.getElementById('resFilterType');
  if (!regionFilter || !typeFilter) return;

  regionFilter.addEventListener('change', renderResults);
  typeFilter.addEventListener('change', renderResults);
  renderResults();
}

function renderResults() {
  const statsBar = document.getElementById('resultsStatsBar');
  const grid = document.getElementById('resGrid');
  if (!statsBar || !grid || typeof AUCTION_RESULTS === 'undefined') return;

  const regionVal = document.getElementById('resFilterRegion').value;
  const typeVal = document.getElementById('resFilterType').value;

  let filtered = AUCTION_RESULTS;
  if (regionVal) filtered = filtered.filter(r => r.region === regionVal);
  if (typeVal) filtered = filtered.filter(r => r.type === typeVal);

  // Calculate stats
  const total = filtered.length;
  const diffs = filtered.map(r => ((r.salePrice - r.guidePrice) / r.guidePrice) * 100);
  const avgDiff = total > 0 ? diffs.reduce((a, b) => a + b, 0) / total : 0;
  const aboveGuide = total > 0 ? filtered.filter(r => r.salePrice >= r.guidePrice).length : 0;
  const abovePct = total > 0 ? Math.round((aboveGuide / total) * 100) : 0;
  const avgSale = total > 0 ? Math.round(filtered.reduce((a, r) => a + r.salePrice, 0) / total) : 0;

  statsBar.innerHTML = `
    <div class="res-stat">
      <span class="res-stat-value ${avgDiff >= 0 ? 'positive' : 'negative'}">${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(1)}%</span>
      <span class="res-stat-label">Avg. Sale vs Guide</span>
    </div>
    <div class="res-stat">
      <span class="res-stat-value">${abovePct}%</span>
      <span class="res-stat-label">Sold At/Above Guide</span>
    </div>
    <div class="res-stat">
      <span class="res-stat-value">&pound;${avgSale.toLocaleString()}</span>
      <span class="res-stat-label">Avg. Sale Price</span>
    </div>
    <div class="res-stat">
      <span class="res-stat-value">${total}</span>
      <span class="res-stat-label">Lots Tracked</span>
    </div>
  `;

  grid.innerHTML = filtered.map(r => {
    const diff = ((r.salePrice - r.guidePrice) / r.guidePrice) * 100;
    const diffClass = diff >= 0 ? 'premium' : 'discount';
    const diffStr = (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%';
    return `<div class="res-card">
      <div class="res-card-diff ${diffClass}">${diffStr}</div>
      <div class="res-card-info">
        <div class="res-card-house">${r.house}</div>
        <div class="res-card-address">${r.address}</div>
        <div class="res-card-prices">
          <span>Guide: <strong>&pound;${r.guidePrice.toLocaleString()}</strong></span>
          <span>Sold: <strong>&pound;${r.salePrice.toLocaleString()}</strong></span>
          <span>${r.type}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ===========================
// Guides Accordion
// ===========================
function initGuides() {
  document.querySelectorAll('.guide-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.guide-card');
      const wasOpen = card.classList.contains('open');
      // Close all guides
      document.querySelectorAll('.guide-card').forEach(c => c.classList.remove('open'));
      // Toggle clicked
      if (!wasOpen) card.classList.add('open');
    });
  });
}

// ===========================
// Recently Viewed
// ===========================
const RV_KEY = 'auctionHubRecentlyViewed';
const RV_MAX = 5;

function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem(RV_KEY)) || []; }
  catch { return []; }
}

function trackRecentlyViewed(id, name) {
  let rv = getRecentlyViewed();
  rv = rv.filter(item => item.id !== id);
  rv.unshift({ id, name });
  if (rv.length > RV_MAX) rv = rv.slice(0, RV_MAX);
  localStorage.setItem(RV_KEY, JSON.stringify(rv));
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  const bar = document.getElementById('recentlyViewedBar');
  const chips = document.getElementById('rvChips');
  if (!bar || !chips) return;

  const rv = getRecentlyViewed();
  if (rv.length === 0) { bar.style.display = 'none'; return; }

  bar.style.display = 'flex';
  chips.innerHTML = rv.map(item =>
    `<span class="rv-chip" data-rv-id="${item.id}">
      ${item.name}
      <span class="rv-chip-close" data-rv-remove="${item.id}">&times;</span>
    </span>`
  ).join('');

  // Click chip to reopen modal
  chips.querySelectorAll('.rv-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      if (e.target.classList.contains('rv-chip-close')) return;
      const houseId = parseInt(chip.dataset.rvId);
      const house = AUCTION_HOUSES.find(h => h.id === houseId);
      if (house) openModal(house);
    });
  });

  // Click X to remove single item
  chips.querySelectorAll('.rv-chip-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.rvRemove);
      let rv = getRecentlyViewed();
      rv = rv.filter(item => item.id !== id);
      localStorage.setItem(RV_KEY, JSON.stringify(rv));
      renderRecentlyViewed();
    });
  });

  // Clear all button
  document.getElementById('rvClearAll').onclick = () => {
    localStorage.removeItem(RV_KEY);
    renderRecentlyViewed();
  };
}

// ===========================
// Watchlist
// ===========================
const WL_KEY = 'auctionHubWatchlist';

function getWatchlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY)) || []; }
  catch { return []; }
}

function toggleWatchlist(id) {
  let wl = getWatchlist();
  if (wl.includes(id)) {
    wl = wl.filter(x => x !== id);
  } else {
    wl.push(id);
  }
  localStorage.setItem(WL_KEY, JSON.stringify(wl));
  // Update all heart icons on page
  document.querySelectorAll(`.wl-heart[data-wl-id="${id}"]`).forEach(el => {
    el.classList.toggle('active', wl.includes(id));
  });
  renderWatchlist();
}

function isWatched(id) {
  return getWatchlist().includes(id);
}

function renderWatchlist() {
  const section = document.getElementById('watchlistSection');
  const grid = document.getElementById('watchlistGrid');
  if (!section || !grid) return;

  const wl = getWatchlist();
  if (wl.length === 0) { section.style.display = 'none'; return; }

  section.style.display = 'block';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);

  const houses = wl.map(id => AUCTION_HOUSES.find(h => h.id === id)).filter(Boolean);

  grid.innerHTML = houses.map(h => {
    const hasUpcoming = typeof AUCTION_EVENTS !== 'undefined' && AUCTION_EVENTS.some(e => {
      if (e.houseId !== h.id) return false;
      const d = new Date(e.date + 'T00:00:00');
      return d >= today && d <= weekLater;
    });
    return `<div class="wl-card" data-wl-card-id="${h.id}">
      <div class="wl-card-top">
        <span class="wl-card-name">${h.name}</span>
        ${hasUpcoming ? '<span class="wl-badge-soon">Auction Soon</span>' : ''}
      </div>
      <span class="wl-card-region">${h.reach} - ${h.format}</span>
      <button class="wl-card-remove" data-wl-remove="${h.id}">&times;</button>
    </div>`;
  }).join('');

  // Click card to open modal
  grid.querySelectorAll('.wl-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('wl-card-remove')) return;
      const id = parseInt(card.dataset.wlCardId);
      const house = AUCTION_HOUSES.find(h => h.id === id);
      if (house) openModal(house);
    });
  });

  // Remove from watchlist
  grid.querySelectorAll('.wl-card-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatchlist(parseInt(btn.dataset.wlRemove));
    });
  });
}
