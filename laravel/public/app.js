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
  // Weekly digest
  initWeeklyDigest();
  // Price map
  initPriceMap();
  // Finance tooltip
  initFinanceTooltip();
  // Live auction lots
  initLiveLots();
  // Investor toolkit
  initInvestorToolkit();
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

  // Sort: houses with upcoming events or recent results appear first
  filteredHouses.sort((a, b) => {
    const aScore = getHouseDataScore(a);
    const bScore = getHouseDataScore(b);
    return bScore - aScore;
  });

  renderCards(filteredHouses);
  updateResultsCount(filteredHouses.length);
}

function getHouseDataScore(h) {
  let score = 0;
  if (typeof AUCTION_EVENTS !== 'undefined') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasEvents = AUCTION_EVENTS.some(e =>
      (e.houseId === h.id || e.house === h.name) && new Date(e.date + 'T00:00:00') >= today
    );
    if (hasEvents) score += 2;
  }
  if (typeof AUCTION_RESULTS !== 'undefined') {
    const hasResults = AUCTION_RESULTS.some(r => r.houseId === h.id || r.house === h.name);
    if (hasResults) score += 1;
  }
  return score;
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

  // Start/restart countdown timers on cards
  startCountdownTimers();
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
    ${buildCardCountdown(h)}
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

function buildModalAvailableLots(h) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Pull from liveLots (API or fallback) + AUCTION_RESULTS with upcoming dates
  let lots = [];
  if (typeof liveLots !== 'undefined' && liveLots.length > 0) {
    lots = liveLots.filter(l => l.houseId === h.id || (l.houseId === 999 && l.title && l.title.toLowerCase().includes(h.name.toLowerCase())));
  }
  // Also check AUCTION_RESULTS for this house where we can present as "recent catalogue"
  // But primarily use liveLots

  if (lots.length === 0) {
    return `
      <div class="modal-listings-section">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
          Available Lots for Sale
        </h4>
        <div class="modal-empty-state">
          <p>No live lots currently tracked for ${h.name}. Check their website for the latest catalogue.</p>
          <a href="${h.url}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">
            Browse Lots on ${h.name}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
        </div>
      </div>`;
  }

  const sorted = lots.sort((a, b) => {
    const da = a.auctionDate || '9999-12-31';
    const db = b.auctionDate || '9999-12-31';
    return da.localeCompare(db);
  }).slice(0, 8);

  const cards = sorted.map(lot => {
    const price = lot.guidePrice > 0 ? `&pound;${lot.guidePrice.toLocaleString()}` : 'POA';
    let dateStr = '';
    if (lot.auctionDate) {
      const d = new Date(lot.auctionDate + 'T00:00:00');
      dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    const typeLabel = lot.type ? lot.type.charAt(0).toUpperCase() + lot.type.slice(1) : 'Property';
    const imgHtml = lot.imageUrl
      ? `<img src="${lot.imageUrl}" alt="" class="mlot-img" loading="lazy" onerror="this.style.display='none'">`
      : '';

    return `<div class="mlot-card">
      ${imgHtml}
      <div class="mlot-body">
        <div class="mlot-badges">
          <span class="ll-badge ll-badge-type">${typeLabel}</span>
          ${lot.region && lot.region !== 'National' ? `<span class="ll-badge ll-badge-region">${lot.region}</span>` : ''}
          ${lot.bedrooms ? `<span class="ll-badge" style="background:#F3E8FF;color:#7C3AED">${lot.bedrooms} bed</span>` : ''}
        </div>
        <div class="mlot-title">${lot.title}</div>
        ${lot.address && lot.address !== lot.title ? `<div class="mlot-address">${lot.address}</div>` : ''}
        <div class="mlot-bottom">
          <span class="mlot-price">${price}</span>
          ${dateStr ? `<span class="mlot-date">${dateStr}</span>` : ''}
        </div>
        <div class="mlot-actions">
          ${lot.externalUrl ? `<a href="${lot.externalUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">View Details</a>` : ''}
          <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm" onclick="event.stopPropagation()">Finance This</a>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="modal-listings-section">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>
        Available Lots for Sale (${sorted.length})
      </h4>
      <div class="mlot-grid">${cards}</div>
      ${lots.length > 8 ? `<div style="text-align:center;padding:12px"><a href="#liveLots" class="btn btn-outline btn-sm" onclick="closeModal();document.getElementById('llSearch').value='${h.name}';document.getElementById('llSearch').dispatchEvent(new Event('input'))">View All ${lots.length} Lots</a></div>` : ''}
    </div>`;
}

function buildModalRecentResults(h) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let results = [];
  if (typeof AUCTION_RESULTS !== 'undefined') {
    results = AUCTION_RESULTS
      .filter(r => r.houseId === h.id || r.house === h.name)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }

  let bodyContent;
  if (results.length === 0) {
    bodyContent = `<div class="modal-empty-state">
      <p>No recent results tracked for this auction house yet.</p>
    </div>`;
  } else {
    const cards = results.map(r => {
      const diff = ((r.salePrice - r.guidePrice) / r.guidePrice) * 100;
      const diffClass = diff >= 0 ? 'sold-premium' : 'sold-discount';
      const diffStr = (diff >= 0 ? '+' : '') + diff.toFixed(0) + '%';
      let dateStr = '';
      if (r.date) {
        const d = new Date(r.date + 'T00:00:00');
        dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      }
      const beds = r.beds ? `${r.beds} bed` : '';
      const imgHtml = r.image ? `<img src="${r.image}" alt="" class="msold-img" loading="lazy" onerror="this.style.display='none'">` : '';
      return `<div class="msold-card">
        ${imgHtml}
        <div class="msold-diff ${diffClass}">${diffStr}</div>
        <div class="msold-body">
          <div class="msold-address">${r.address}</div>
          <div class="msold-meta">
            <span class="ll-badge ll-badge-type">${r.type}</span>
            ${beds ? `<span class="ll-badge" style="background:#F3E8FF;color:#7C3AED">${beds}</span>` : ''}
            ${dateStr ? `<span class="msold-date">Sold ${dateStr}</span>` : ''}
          </div>
          <div class="msold-prices">
            <div class="msold-price-col">
              <span class="msold-price-label">Guide</span>
              <span class="msold-price-value">&pound;${r.guidePrice.toLocaleString()}</span>
            </div>
            <div class="msold-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div class="msold-price-col">
              <span class="msold-price-label">Sold</span>
              <span class="msold-price-value msold-sold">&pound;${r.salePrice.toLocaleString()}</span>
            </div>
            <button class="finance-icon-btn finance-icon-sm" onclick="event.stopPropagation();showFinanceTooltip(this,${r.salePrice})" title="View finance estimate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    // Summary stats
    const avgDiff = results.reduce((s, r) => s + ((r.salePrice - r.guidePrice) / r.guidePrice) * 100, 0) / results.length;
    const avgSale = Math.round(results.reduce((s, r) => s + r.salePrice, 0) / results.length);
    const aboveGuide = results.filter(r => r.salePrice >= r.guidePrice).length;

    bodyContent = `
      <div class="msold-stats">
        <div class="msold-stat"><strong>${results.length}</strong> lots sold</div>
        <div class="msold-stat"><strong class="${avgDiff >= 0 ? 'positive' : 'negative'}">${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(0)}%</strong> avg vs guide</div>
        <div class="msold-stat"><strong>&pound;${avgSale.toLocaleString()}</strong> avg sale</div>
        <div class="msold-stat"><strong>${Math.round(aboveGuide / results.length * 100)}%</strong> at/above guide</div>
      </div>
      <div class="msold-grid">${cards}</div>
    `;
  }

  return `
    <div class="modal-listings-section">
      <h4>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        Recently Sold Properties ${results.length ? '(' + results.length + ')' : ''}
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

    ${buildModalAvailableLots(h)}
    ${buildModalRecentResults(h)}
    ${buildModalUpcomingEvents(h)}

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
      <button class="finance-icon-btn" onclick="event.stopPropagation();showFinanceTooltip(this,${r.salePrice})" title="View finance estimate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
      </button>
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

// ===========================
// Countdown Timers
// ===========================
function getNextAuctionForHouse(houseId, houseName) {
  if (typeof AUCTION_EVENTS === 'undefined') return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = AUCTION_EVENTS
    .filter(e => (e.houseId === houseId || e.house === houseName) && new Date(e.date + 'T00:00:00') >= now)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return upcoming.length > 0 ? upcoming[0] : null;
}

function buildCardCountdown(h) {
  const nextEvent = getNextAuctionForHouse(h.id, h.name);
  if (!nextEvent) {
    return `<div class="card-countdown card-countdown-none">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span class="countdown-text">Check website for dates</span>
    </div>`;
  }
  const targetISO = nextEvent.date + 'T' + (nextEvent.time || '10:00') + ':00';
  return `<div class="card-countdown" data-countdown-target="${targetISO}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
    <span class="countdown-text">Loading...</span>
    <span class="countdown-type ${nextEvent.type.toLowerCase()}">${nextEvent.type}</span>
  </div>`;
}

let countdownInterval = null;
function startCountdownTimers() {
  if (countdownInterval) clearInterval(countdownInterval);
  function updateAll() {
    const now = new Date();
    document.querySelectorAll('[data-countdown-target]').forEach(el => {
      const target = new Date(el.dataset.countdownTarget);
      const diff = target - now;
      const textEl = el.querySelector('.countdown-text');
      if (!textEl) return;
      if (diff <= 0) {
        textEl.textContent = 'Auction today!';
        el.classList.add('card-countdown-urgent');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) {
        textEl.textContent = `Next auction in ${days}d ${hours}h`;
      } else {
        textEl.textContent = `Next auction in ${hours}h ${mins}m`;
      }
      if (diff < 48 * 60 * 60 * 1000) {
        el.classList.add('card-countdown-urgent');
      } else {
        el.classList.remove('card-countdown-urgent');
      }
    });
  }
  updateAll();
  countdownInterval = setInterval(updateAll, 60000);
}

// ===========================
// Weekly Digest Widget
// ===========================
function initWeeklyDigest() {
  const container = document.getElementById('weeklyDigest');
  if (!container) return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  let thisWeekEvents = 0, thisWeekRoom = 0, thisWeekOnline = 0;
  let nextWeekEvents = 0;
  const regionCounts = {};

  if (typeof AUCTION_EVENTS !== 'undefined') {
    AUCTION_EVENTS.forEach(e => {
      const d = new Date(e.date + 'T00:00:00');
      if (d >= weekStart && d <= weekEnd) {
        thisWeekEvents++;
        if (e.type === 'Room') thisWeekRoom++;
        else thisWeekOnline++;
        regionCounts[e.region] = (regionCounts[e.region] || 0) + 1;
      }
      if (d >= nextWeekStart && d <= nextWeekEnd) nextWeekEvents++;
    });
  }

  let lotsSold = 0, avgSalePrice = 0, avgPremium = 0;
  if (typeof AUCTION_RESULTS !== 'undefined' && AUCTION_RESULTS.length > 0) {
    lotsSold = AUCTION_RESULTS.length;
    avgSalePrice = Math.round(AUCTION_RESULTS.reduce((s, r) => s + r.salePrice, 0) / lotsSold);
    avgPremium = AUCTION_RESULTS.reduce((s, r) => s + ((r.salePrice - r.guidePrice) / r.guidePrice) * 100, 0) / lotsSold;
  }

  const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekLabel = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const isCollapsed = localStorage.getItem('digestCollapsed') === 'true';
  container.className = 'weekly-digest' + (isCollapsed ? '' : ' open');
  container.innerHTML = `
    <div class="digest-header" id="digestToggle">
      <div class="digest-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
        <span>Week of ${weekLabel}</span>
      </div>
      <svg class="digest-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
    </div>
    <div class="digest-body">
      <div class="digest-stats">
        <div class="digest-stat">
          <span class="digest-stat-value">${thisWeekEvents}</span>
          <span class="digest-stat-label">Auctions This Week</span>
          <span class="digest-stat-detail">${thisWeekRoom} Room / ${thisWeekOnline} Online</span>
        </div>
        <div class="digest-stat">
          <span class="digest-stat-value">${nextWeekEvents}</span>
          <span class="digest-stat-label">Next Week</span>
        </div>
        <div class="digest-stat">
          <span class="digest-stat-value">&pound;${avgSalePrice.toLocaleString()}</span>
          <span class="digest-stat-label">Avg. Sale Price</span>
          <span class="digest-stat-detail">${lotsSold} lots tracked</span>
        </div>
        <div class="digest-stat">
          <span class="digest-stat-value ${avgPremium >= 0 ? 'positive' : 'negative'}">${avgPremium >= 0 ? '+' : ''}${avgPremium.toFixed(1)}%</span>
          <span class="digest-stat-label">Avg. Premium to Guide</span>
        </div>
      </div>
      <div class="digest-footer">
        ${topRegion ? `<span class="digest-top-region">Top Region: <strong>${topRegion[0]}</strong> (${topRegion[1]} events)</span>` : '<span></span>'}
        <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
          Secure Finance Before the Auction
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </div>
  `;

  document.getElementById('digestToggle').addEventListener('click', () => {
    container.classList.toggle('open');
    localStorage.setItem('digestCollapsed', !container.classList.contains('open'));
  });
}

// ===========================
// UK Price Map
// ===========================
function initPriceMap() {
  const container = document.getElementById('priceMapGrid');
  const panel = document.getElementById('mapDetailsPanel');
  if (!container || !panel) return;

  const regions = ['Scotland', 'North East', 'North West', 'Yorkshire', 'Wales', 'West Midlands', 'East Midlands', 'East Anglia', 'South West', 'London', 'South East'];
  const regionStats = {};
  regions.forEach(r => {
    regionStats[r] = { name: r, avgGuide: 0, avgSale: 0, count: 0, avgPremium: 0, events: 0 };
  });

  if (typeof AUCTION_RESULTS !== 'undefined') {
    AUCTION_RESULTS.forEach(r => {
      if (regionStats[r.region]) {
        regionStats[r.region].count++;
        regionStats[r.region].avgGuide += r.guidePrice;
        regionStats[r.region].avgSale += r.salePrice;
      }
    });
  }

  if (typeof AUCTION_EVENTS !== 'undefined') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    AUCTION_EVENTS.forEach(e => {
      if (regionStats[e.region] && new Date(e.date + 'T00:00:00') >= today) {
        regionStats[e.region].events++;
      }
    });
  }

  let minAvg = Infinity, maxAvg = 0;
  regions.forEach(r => {
    const s = regionStats[r];
    if (s.count > 0) {
      s.avgGuide = Math.round(s.avgGuide / s.count);
      s.avgSale = Math.round(s.avgSale / s.count);
      s.avgPremium = ((s.avgSale - s.avgGuide) / s.avgGuide) * 100;
      if (s.avgGuide < minAvg) minAvg = s.avgGuide;
      if (s.avgGuide > maxAvg) maxAvg = s.avgGuide;
    }
  });

  function getColor(avgGuide) {
    if (avgGuide === 0) return '#C5CDD8';
    const range = maxAvg - minAvg || 1;
    const ratio = (avgGuide - minAvg) / range;
    if (ratio < 0.5) {
      const t = ratio * 2;
      const r = Math.round(16 + t * (201 - 16));
      const g = Math.round(185 + t * (151 - 185));
      const b = Math.round(129 + t * (63 - 129));
      return `rgb(${r},${g},${b})`;
    } else {
      const t = (ratio - 0.5) * 2;
      const r = Math.round(201 + t * (239 - 201));
      const g = Math.round(151 + t * (68 - 151));
      const b = Math.round(63 + t * (68 - 63));
      return `rgb(${r},${g},${b})`;
    }
  }

  container.innerHTML = regions.map(r => {
    const s = regionStats[r];
    const color = getColor(s.avgGuide);
    const hasData = s.count > 0;
    return `<div class="map-cell" data-map-region="${r}" style="background:${color}${hasData ? '' : ';opacity:0.5'}">
      <span class="map-cell-name">${r}</span>
      ${hasData ? `<span class="map-cell-price">&pound;${s.avgGuide.toLocaleString()}</span>` : '<span class="map-cell-price">No data</span>'}
    </div>`;
  }).join('');

  panel.innerHTML = `<div class="map-panel-placeholder">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
    <p>Click a region to see auction market details</p>
  </div>`;

  container.querySelectorAll('.map-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      container.querySelectorAll('.map-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');

      const region = cell.dataset.mapRegion;
      const s = regionStats[region];

      if (s.count === 0 && !s.events) {
        panel.innerHTML = `<div class="map-panel-placeholder">
          <p>No recent data for <strong>${region}</strong></p>
          <a href="#directory" class="btn btn-outline btn-sm" onclick="document.getElementById('filterRegion').value='${region}';document.getElementById('filterRegion').dispatchEvent(new Event('change'))">
            Browse ${region} Auction Houses
          </a>
        </div>`;
        return;
      }

      panel.innerHTML = `
        <h4 class="map-panel-title">${region}</h4>
        <div class="map-panel-stats">
          ${s.count > 0 ? `
          <div class="map-panel-stat">
            <span class="map-panel-stat-label">Avg Guide Price</span>
            <span class="map-panel-stat-value">&pound;${s.avgGuide.toLocaleString()}</span>
          </div>
          <div class="map-panel-stat">
            <span class="map-panel-stat-label">Avg Sale Price</span>
            <span class="map-panel-stat-value">&pound;${s.avgSale.toLocaleString()}</span>
          </div>
          <div class="map-panel-stat">
            <span class="map-panel-stat-label">Avg Premium</span>
            <span class="map-panel-stat-value ${s.avgPremium >= 0 ? 'positive' : 'negative'}">${s.avgPremium >= 0 ? '+' : ''}${s.avgPremium.toFixed(1)}%</span>
          </div>
          <div class="map-panel-stat">
            <span class="map-panel-stat-label">Lots Tracked</span>
            <span class="map-panel-stat-value">${s.count}</span>
          </div>
          ` : ''}
          ${s.events ? `
          <div class="map-panel-stat">
            <span class="map-panel-stat-label">Upcoming Auctions</span>
            <span class="map-panel-stat-value">${s.events}</span>
          </div>
          ` : ''}
        </div>
        <div class="map-panel-actions">
          <a href="#directory" class="btn btn-outline btn-sm" onclick="document.getElementById('filterRegion').value='${region}';document.getElementById('filterRegion').dispatchEvent(new Event('change'))">
            Browse ${region} Houses
          </a>
          <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
            Finance in ${region}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      `;
    });
  });

  const legend = document.getElementById('mapLegend');
  if (legend) {
    legend.innerHTML = `
      <span class="map-legend-label">&pound;${minAvg === Infinity ? '0' : minAvg.toLocaleString()}</span>
      <div class="map-legend-bar"></div>
      <span class="map-legend-label">&pound;${maxAvg === 0 ? '0' : maxAvg.toLocaleString()}</span>
    `;
  }
}

// ===========================
// Finance Tooltip
// ===========================
function calcBridgingCosts(purchasePrice) {
  const ltv = 0.70;
  const monthlyRate = 0.0075;
  const arrangementPct = 0.02;
  const term = 12;
  const loanAmount = Math.round(purchasePrice * ltv);
  const depositNeeded = purchasePrice - loanAmount;
  const monthlyInterest = Math.round(loanAmount * monthlyRate);
  const arrangementFee = Math.round(loanAmount * arrangementPct);
  const totalInterest = monthlyInterest * term;
  const totalCost = totalInterest + arrangementFee;
  return { purchasePrice, loanAmount, depositNeeded, monthlyInterest, arrangementFee, totalInterest, totalCost, term };
}

function initFinanceTooltip() {
  const tooltip = document.getElementById('financeTooltip');
  if (!tooltip) return;
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.finance-tooltip') && !e.target.closest('.finance-icon-btn')) {
      tooltip.classList.remove('active');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') tooltip.classList.remove('active');
  });
}

function showFinanceTooltip(btn, price) {
  const tooltip = document.getElementById('financeTooltip');
  if (!tooltip) return;

  const costs = calcBridgingCosts(price);
  tooltip.innerHTML = `
    <div class="ft-header">
      <strong>Estimated Bridging Finance</strong>
      <button class="ft-close" onclick="document.getElementById('financeTooltip').classList.remove('active')">&times;</button>
    </div>
    <div class="ft-rows">
      <div class="ft-row"><span>Purchase Price</span><span>&pound;${costs.purchasePrice.toLocaleString()}</span></div>
      <div class="ft-row"><span>Deposit (30%)</span><span>&pound;${costs.depositNeeded.toLocaleString()}</span></div>
      <div class="ft-row"><span>Loan (70% LTV)</span><span>&pound;${costs.loanAmount.toLocaleString()}</span></div>
      <div class="ft-divider"></div>
      <div class="ft-row"><span>Monthly Interest (0.75%)</span><span>&pound;${costs.monthlyInterest.toLocaleString()}</span></div>
      <div class="ft-row"><span>Arrangement Fee (2%)</span><span>&pound;${costs.arrangementFee.toLocaleString()}</span></div>
      <div class="ft-row ft-total"><span>Total Finance Cost (${costs.term}m)</span><span>&pound;${costs.totalCost.toLocaleString()}</span></div>
    </div>
    <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm ft-cta">
      Get Your Exact Quote
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </a>
    <div class="ft-note">Illustration only. Actual rates may vary.</div>
  `;

  const rect = btn.getBoundingClientRect();
  const scrollTop = window.scrollY;
  const scrollLeft = window.scrollX;
  tooltip.style.top = (rect.bottom + scrollTop + 8) + 'px';
  tooltip.style.left = Math.max(16, Math.min(rect.left + scrollLeft - 100, window.innerWidth - 320)) + 'px';
  tooltip.classList.add('active');
}

// ===========================
// Live Auction Lots
// ===========================
let liveLots = [];
let llPage = 0;
const LL_PER_PAGE = 12;

function initLiveLots() {
  const grid = document.getElementById('llGrid');
  if (!grid) return;

  // Determine API base: use API when on production, fallback to static data locally
  const apiBase = (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? '/api' : null;

  if (apiBase) {
    fetchLiveLots(apiBase);
  } else {
    // Fallback: use AUCTION_RESULTS data to simulate live lots
    loadFallbackLots();
  }

  // Filter listeners
  const search = document.getElementById('llSearch');
  const typeFilter = document.getElementById('llFilterType');
  const regionFilter = document.getElementById('llFilterRegion');
  const maxPrice = document.getElementById('llMaxPrice');
  const sort = document.getElementById('llSort');
  const loadMoreBtn = document.getElementById('llLoadMoreBtn');

  if (search) search.addEventListener('input', debounce(renderLiveLots, 300));
  if (typeFilter) typeFilter.addEventListener('change', renderLiveLots);
  if (regionFilter) regionFilter.addEventListener('change', renderLiveLots);
  if (maxPrice) maxPrice.addEventListener('input', debounce(renderLiveLots, 500));
  if (sort) sort.addEventListener('change', renderLiveLots);
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { llPage++; renderLiveLots(true); });
}

async function fetchLiveLots(apiBase) {
  const status = document.getElementById('llStatus');
  if (status) status.textContent = 'Loading live lots...';
  try {
    const res = await fetch(`${apiBase}/lots?status=upcoming&per_page=200`);
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    liveLots = (data.data || data).map(lot => ({
      id: lot.id,
      title: lot.title,
      address: lot.address || lot.title,
      region: lot.region || 'National',
      type: lot.property_type || 'residential',
      guidePrice: lot.guide_price_low || 0,
      auctionDate: lot.auction_date,
      imageUrl: lot.image_url,
      externalUrl: lot.external_url,
      houseId: lot.auction_house_id,
      bedrooms: lot.bedrooms,
      condition: lot.lot_condition
    }));
    if (status) status.textContent = `${liveLots.length} lots found`;
    renderLiveLots();
  } catch (err) {
    loadFallbackLots();
  }
}

function loadFallbackLots() {
  const status = document.getElementById('llStatus');
  // Build from AUCTION_RESULTS if available
  if (typeof AUCTION_RESULTS !== 'undefined' && AUCTION_RESULTS.length > 0) {
    liveLots = AUCTION_RESULTS.map((r, i) => ({
      id: i + 1,
      title: r.address,
      address: r.address,
      region: r.region || 'National',
      type: (r.type || 'Residential').toLowerCase(),
      guidePrice: r.guidePrice,
      auctionDate: r.date || null,
      imageUrl: r.image || null,
      externalUrl: null,
      houseId: r.houseId || 0,
      bedrooms: r.beds || null,
      condition: null
    }));
    const notice = document.querySelector('.ll-fallback-notice');
    if (!notice) {
      const grid = document.getElementById('llGrid');
      if (grid) {
        const div = document.createElement('div');
        div.className = 'll-fallback-notice';
        div.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Showing sample data - live lots will load when connected to the API';
        grid.parentNode.insertBefore(div, grid);
      }
    }
  } else {
    liveLots = [];
  }
  if (status) status.textContent = `${liveLots.length} lots available`;
  renderLiveLots();
}

function getFilteredLiveLots() {
  const search = (document.getElementById('llSearch')?.value || '').toLowerCase().trim();
  const typeVal = document.getElementById('llFilterType')?.value || '';
  const regionVal = document.getElementById('llFilterRegion')?.value || '';
  const maxPrice = parseInt(document.getElementById('llMaxPrice')?.value) || 0;
  const sortVal = document.getElementById('llSort')?.value || 'date';

  let filtered = liveLots.filter(lot => {
    if (search && !lot.title.toLowerCase().includes(search) && !lot.address.toLowerCase().includes(search)) return false;
    if (typeVal && lot.type !== typeVal) return false;
    if (regionVal && lot.region !== regionVal) return false;
    if (maxPrice > 0 && lot.guidePrice > maxPrice) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortVal === 'price_asc') return (a.guidePrice || 0) - (b.guidePrice || 0);
    if (sortVal === 'price_desc') return (b.guidePrice || 0) - (a.guidePrice || 0);
    // Default: soonest auction date
    const da = a.auctionDate || '9999-12-31';
    const db = b.auctionDate || '9999-12-31';
    return da.localeCompare(db);
  });

  return filtered;
}

function renderLiveLots(append) {
  const grid = document.getElementById('llGrid');
  const status = document.getElementById('llStatus');
  const loadMore = document.getElementById('llLoadMore');
  if (!grid) return;

  if (!append) llPage = 0;

  const filtered = getFilteredLiveLots();
  const total = filtered.length;
  const display = filtered.slice(0, (llPage + 1) * LL_PER_PAGE);

  if (status) status.textContent = `Showing ${display.length} of ${total} lots`;
  if (loadMore) loadMore.style.display = display.length < total ? 'block' : 'none';

  if (total === 0) {
    grid.innerHTML = '<div class="ll-no-results"><p>No lots match your filters. Try adjusting your search criteria.</p></div>';
    return;
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  grid.innerHTML = display.map(lot => {
    const price = lot.guidePrice > 0 ? `&pound;${lot.guidePrice.toLocaleString()}` : 'POA';
    let dateStr = '';
    if (lot.auctionDate) {
      const d = new Date(lot.auctionDate + 'T00:00:00');
      dateStr = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    const typeLabel = lot.type.charAt(0).toUpperCase() + lot.type.slice(1);
    const imgHtml = lot.imageUrl
      ? `<img class="ll-card-img" src="${lot.imageUrl}" alt="${lot.title}" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="ll-card-img" style="display:flex;align-items:center;justify-content:center;color:var(--text-light)"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg></div>`;

    return `<div class="ll-card">
      ${imgHtml}
      <div class="ll-card-body">
        <div class="ll-card-badges">
          <span class="ll-badge ll-badge-type">${typeLabel}</span>
          ${lot.region !== 'National' ? `<span class="ll-badge ll-badge-region">${lot.region}</span>` : ''}
          ${lot.bedrooms ? `<span class="ll-badge" style="background:#F3E8FF;color:#7C3AED">${lot.bedrooms} bed</span>` : ''}
        </div>
        <div class="ll-card-title">${lot.title}</div>
        ${lot.address !== lot.title ? `<div class="ll-card-address">${lot.address}</div>` : ''}
        <div class="ll-card-bottom">
          <span class="ll-card-price">${price}</span>
          <span class="ll-card-date">${dateStr ? `<strong>${dateStr}</strong>Auction Date` : ''}</span>
        </div>
      </div>
      <div class="ll-card-actions">
        ${lot.externalUrl ? `<a href="${lot.externalUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">View Lot</a>` : '<span></span>'}
        <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">Finance This</a>
      </div>
    </div>`;
  }).join('');
}

// ===========================
// Investor Toolkit
// ===========================
function initInvestorToolkit() {
  // Tab switching
  document.querySelectorAll('.tk-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tk-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tk-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tkTab;
      const panel = document.getElementById('tk' + target.charAt(0).toUpperCase() + target.slice(1));
      if (panel) panel.classList.add('active');
    });
  });

  // Set placeholders
  ['tkSdltResult', 'tkTcResult', 'tkYieldResult', 'tkFlipResult'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.innerHTML.trim()) {
      el.innerHTML = '<div class="tk-result-placeholder">Enter values and click Calculate to see results</div>';
    }
  });

  // SDLT Calculator
  document.getElementById('tkSdltCalc')?.addEventListener('click', calcSDLT);

  // True Cost Calculator
  document.getElementById('tkTcCalc')?.addEventListener('click', calcTrueCost);

  // Yield Calculator
  document.getElementById('tkYieldCalc')?.addEventListener('click', calcYield);

  // Flip Calculator
  document.getElementById('tkFlipCalc')?.addEventListener('click', calcFlip);
}

function getSDLTAmount(price, isAdditional) {
  // UK SDLT rates 2025/26
  const bands = [
    { threshold: 125000, rate: 0 },
    { threshold: 250000, rate: 0.02 },
    { threshold: 925000, rate: 0.05 },
    { threshold: 1500000, rate: 0.10 },
    { threshold: Infinity, rate: 0.12 }
  ];
  const surcharge = isAdditional ? 0.05 : 0;

  let tax = 0;
  let prev = 0;
  const breakdown = [];

  for (const band of bands) {
    if (price <= prev) break;
    const taxable = Math.min(price, band.threshold) - prev;
    if (taxable > 0) {
      const rate = band.rate + surcharge;
      const bandTax = Math.round(taxable * rate);
      tax += bandTax;
      breakdown.push({
        from: prev,
        to: Math.min(price, band.threshold),
        rate: rate * 100,
        baseRate: band.rate * 100,
        tax: bandTax
      });
    }
    prev = band.threshold;
  }

  return { total: tax, breakdown, surcharge: surcharge * 100 };
}

function calcSDLT() {
  const price = parseInt(document.getElementById('tkSdltPrice')?.value) || 0;
  const isAdditional = document.getElementById('tkSdltAdditional')?.checked || false;
  const result = document.getElementById('tkSdltResult');
  if (!result || price <= 0) return;

  const sdlt = getSDLTAmount(price, isAdditional);

  result.innerHTML = `
    <div class="tk-result-title">SDLT Breakdown</div>
    <div class="tk-result-rows">
      ${sdlt.breakdown.map(b => `
        <div class="tk-row">
          <span>&pound;${b.from.toLocaleString()} - &pound;${b.to.toLocaleString()} @ ${b.rate.toFixed(1)}%</span>
          <span>&pound;${b.tax.toLocaleString()}</span>
        </div>
      `).join('')}
      ${isAdditional ? `<div class="tk-row tk-row-highlight"><span>Includes 5% additional property surcharge</span><span></span></div>` : ''}
      <div class="tk-row tk-row-total">
        <span>Total SDLT</span>
        <span>&pound;${sdlt.total.toLocaleString()}</span>
      </div>
    </div>
    <div class="tk-result-cta">
      <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px">Now calculate your total purchase cost</p>
      <button class="btn btn-outline btn-sm" onclick="document.querySelector('[data-tk-tab=truecost]').click();document.getElementById('tkTcHammer').value=${price}">Go to True Cost Calculator</button>
    </div>
  `;
}

function calcTrueCost() {
  const hammer = parseInt(document.getElementById('tkTcHammer')?.value) || 0;
  const premiumPct = parseFloat(document.getElementById('tkTcPremium')?.value) || 0;
  const legal = parseInt(document.getElementById('tkTcLegal')?.value) || 0;
  const survey = parseInt(document.getElementById('tkTcSurvey')?.value) || 0;
  const refurb = parseInt(document.getElementById('tkTcRefurb')?.value) || 0;
  const isAdditional = document.getElementById('tkTcAdditional')?.checked || false;
  const result = document.getElementById('tkTcResult');
  if (!result || hammer <= 0) return;

  const premium = Math.round(hammer * premiumPct / 100);
  const sdlt = getSDLTAmount(hammer, isAdditional);
  const bridging = calcBridgingCosts(hammer);
  const totalCost = hammer + premium + sdlt.total + legal + survey + refurb + bridging.totalCost;

  result.innerHTML = `
    <div class="tk-result-title">True Cost Breakdown</div>
    <div class="tk-result-rows">
      <div class="tk-row"><span>Hammer Price</span><span>&pound;${hammer.toLocaleString()}</span></div>
      <div class="tk-row"><span>Buyer's Premium (${premiumPct}%)</span><span>&pound;${premium.toLocaleString()}</span></div>
      <div class="tk-row"><span>SDLT${isAdditional ? ' (inc. 5% surcharge)' : ''}</span><span>&pound;${sdlt.total.toLocaleString()}</span></div>
      <div class="tk-row"><span>Legal Fees</span><span>&pound;${legal.toLocaleString()}</span></div>
      <div class="tk-row"><span>Survey</span><span>&pound;${survey.toLocaleString()}</span></div>
      ${refurb > 0 ? `<div class="tk-row"><span>Refurbishment</span><span>&pound;${refurb.toLocaleString()}</span></div>` : ''}
      <div class="tk-row tk-row-highlight"><span>Bridging Finance (${bridging.term}m)</span><span>&pound;${bridging.totalCost.toLocaleString()}</span></div>
      <div class="tk-row tk-row-total">
        <span>Total All-In Cost</span>
        <span>&pound;${totalCost.toLocaleString()}</span>
      </div>
    </div>
    <div class="tk-result-cta">
      <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
        Finance the Total with Lendlord
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
  `;
}

function calcYield() {
  const cost = parseInt(document.getElementById('tkYieldCost')?.value) || 0;
  const rent = parseInt(document.getElementById('tkYieldRent')?.value) || 0;
  const result = document.getElementById('tkYieldResult');
  if (!result || cost <= 0 || rent <= 0) return;

  const annualRent = rent * 12;
  const grossYield = (annualRent / cost) * 100;

  // Estimate net yield: deduct mortgage interest (assume 5.5% on 70% LTV) + 15% running costs
  const mortgageInterest = cost * 0.7 * 0.055;
  const runningCosts = annualRent * 0.15;
  const netIncome = annualRent - mortgageInterest - runningCosts;
  const netYield = (netIncome / cost) * 100;

  result.innerHTML = `
    <div class="tk-result-title">Rental Yield Analysis</div>
    <div class="tk-result-rows">
      <div class="tk-row"><span>Monthly Rent</span><span>&pound;${rent.toLocaleString()}</span></div>
      <div class="tk-row"><span>Annual Rent</span><span>&pound;${annualRent.toLocaleString()}</span></div>
      <div class="tk-row"><span>Total Investment</span><span>&pound;${cost.toLocaleString()}</span></div>
      <div class="tk-row tk-row-highlight">
        <span>Gross Yield</span>
        <span>${grossYield.toFixed(1)}%</span>
      </div>
      <div class="tk-row"><span>Est. Mortgage Interest (5.5% on 70% LTV)</span><span>-&pound;${Math.round(mortgageInterest).toLocaleString()}</span></div>
      <div class="tk-row"><span>Est. Running Costs (15%)</span><span>-&pound;${Math.round(runningCosts).toLocaleString()}</span></div>
      <div class="tk-row"><span>Net Annual Income</span><span>&pound;${Math.round(netIncome).toLocaleString()}</span></div>
      <div class="tk-row tk-row-total">
        <span>Net Yield</span>
        <span class="${netYield >= 0 ? 'tk-profit-positive' : 'tk-profit-negative'}">${netYield.toFixed(1)}%</span>
      </div>
    </div>
    <div class="tk-result-cta">
      <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px">Buy with bridging, refinance to mortgage</p>
      <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
        Get Bridging Finance
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
  `;
}

function calcFlip() {
  const purchase = parseInt(document.getElementById('tkFlipPurchase')?.value) || 0;
  const refurb = parseInt(document.getElementById('tkFlipRefurb')?.value) || 0;
  const salePrice = parseInt(document.getElementById('tkFlipSale')?.value) || 0;
  const months = parseInt(document.getElementById('tkFlipMonths')?.value) || 6;
  const result = document.getElementById('tkFlipResult');
  if (!result || purchase <= 0 || salePrice <= 0) return;

  const sdlt = getSDLTAmount(purchase, true); // Assume additional property
  const bridging = calcBridgingCosts(purchase);
  // Scale bridging costs to actual holding period
  const actualBridgingInterest = bridging.monthlyInterest * months;
  const bridgingCosts = actualBridgingInterest + bridging.arrangementFee;
  const sellingFees = Math.round(salePrice * 0.015); // 1.5% estate agent + legal

  const totalCosts = purchase + refurb + sdlt.total + bridgingCosts + sellingFees;
  const grossProfit = salePrice - purchase - refurb;
  const netProfit = salePrice - totalCosts;
  const roi = (netProfit / (purchase + refurb)) * 100;
  const annualizedRoi = (roi / months) * 12;

  result.innerHTML = `
    <div class="tk-result-title">Flip / ROI Analysis</div>
    <div class="tk-result-rows">
      <div class="tk-row"><span>Purchase Price</span><span>&pound;${purchase.toLocaleString()}</span></div>
      <div class="tk-row"><span>Refurbishment</span><span>&pound;${refurb.toLocaleString()}</span></div>
      <div class="tk-row"><span>SDLT (inc. 5% surcharge)</span><span>&pound;${sdlt.total.toLocaleString()}</span></div>
      <div class="tk-row"><span>Bridging Finance (${months}m)</span><span>&pound;${bridgingCosts.toLocaleString()}</span></div>
      <div class="tk-row"><span>Selling Fees (1.5%)</span><span>&pound;${sellingFees.toLocaleString()}</span></div>
      <div class="tk-row" style="font-weight:600"><span>Total Cost</span><span>&pound;${totalCosts.toLocaleString()}</span></div>
      <div class="tk-row"><span>Target Sale Price</span><span>&pound;${salePrice.toLocaleString()}</span></div>
      <div class="tk-row tk-row-highlight">
        <span>Gross Profit</span>
        <span class="${grossProfit >= 0 ? 'tk-profit-positive' : 'tk-profit-negative'}">&pound;${grossProfit.toLocaleString()}</span>
      </div>
      <div class="tk-row tk-row-total">
        <span>Net Profit</span>
        <span class="${netProfit >= 0 ? 'tk-profit-positive' : 'tk-profit-negative'}">&pound;${netProfit.toLocaleString()}</span>
      </div>
      <div class="tk-row">
        <span>ROI</span>
        <span class="${roi >= 0 ? 'tk-profit-positive' : 'tk-profit-negative'}" style="font-weight:700">${roi.toFixed(1)}%</span>
      </div>
      <div class="tk-row">
        <span>Annualized ROI</span>
        <span class="${annualizedRoi >= 0 ? 'tk-profit-positive' : 'tk-profit-negative'}" style="font-weight:700">${annualizedRoi.toFixed(1)}%</span>
      </div>
    </div>
    <div class="tk-result-cta">
      <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
        Finance the Flip with Lendlord
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
  `;
}
