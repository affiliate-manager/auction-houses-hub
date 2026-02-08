// ===========================
// Live Lot Listings Module
// ===========================
// Fetches lots from Laravel API and renders interactive cards
// with Lendlord bridging finance CTAs.

const LotsModule = (() => {
  'use strict';

  const BRIDGING_URL = 'https://app.lendlord.io/bridging-application?country=uk&utm_source=Lendlord&utm_campaign=auction_houses_hub';
  const API_BASE = '/api';
  const PER_PAGE = 20;

  // State
  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let currentFilters = {};

  // DOM refs (set on init)
  let lotsGrid, lotsCount, lotsLoading, lotsEmpty, lotsPagination;
  let filterRegion, filterType, filterCondition, filterPriceMin, filterPriceMax, filterSort, filterSearch;

  // ===========================
  // Public: Initialize
  // ===========================
  function init() {
    lotsGrid = document.getElementById('lotsGrid');
    lotsCount = document.getElementById('lotsCount');
    lotsLoading = document.getElementById('lotsLoading');
    lotsEmpty = document.getElementById('lotsEmpty');
    lotsPagination = document.getElementById('lotsPagination');
    filterRegion = document.getElementById('lotsFilterRegion');
    filterType = document.getElementById('lotsFilterType');
    filterCondition = document.getElementById('lotsFilterCondition');
    filterPriceMin = document.getElementById('lotsFilterPriceMin');
    filterPriceMax = document.getElementById('lotsFilterPriceMax');
    filterSort = document.getElementById('lotsFilterSort');
    filterSearch = document.getElementById('lotsSearch');

    if (!lotsGrid) return;

    setupListeners();
    fetchAndRender();
    fetchStats();
  }

  // ===========================
  // Event Listeners
  // ===========================
  function setupListeners() {
    [filterRegion, filterType, filterCondition, filterSort].forEach(el => {
      if (el) el.addEventListener('change', () => { currentPage = 1; fetchAndRender(); });
    });

    [filterPriceMin, filterPriceMax].forEach(el => {
      if (el) el.addEventListener('change', () => { currentPage = 1; fetchAndRender(); });
    });

    if (filterSearch) {
      filterSearch.addEventListener('input', debounce(() => { currentPage = 1; fetchAndRender(); }, 300));
    }

    const clearBtn = document.getElementById('lotsClearFilters');
    if (clearBtn) clearBtn.addEventListener('click', clearFilters);
  }

  // ===========================
  // API Calls
  // ===========================
  async function fetchAndRender() {
    if (isLoading) return;
    isLoading = true;
    showLoading(true);

    const params = buildQueryParams();
    try {
      const res = await fetch(`${API_BASE}/lots?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      totalPages = data.last_page || 1;
      currentPage = data.current_page || 1;

      renderLots(data.data || []);
      renderPagination(data);
      updateCount(data.total || 0);
    } catch (err) {
      console.warn('Lots API unavailable, showing demo data:', err.message);
      renderDemoLots();
    } finally {
      isLoading = false;
      showLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (!res.ok) return;
      const stats = await res.json();

      const el = document.getElementById('lotsStatCount');
      if (el && stats.upcoming_lots) {
        el.textContent = stats.upcoming_lots;
      }
    } catch {
      // Stats are non-critical
    }
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('per_page', PER_PAGE);

    if (filterRegion?.value) params.set('region', filterRegion.value);
    if (filterType?.value) params.set('property_type', filterType.value);
    if (filterCondition?.value) params.set('condition', filterCondition.value);
    if (filterPriceMin?.value) params.set('price_min', filterPriceMin.value);
    if (filterPriceMax?.value) params.set('price_max', filterPriceMax.value);
    if (filterSort?.value) params.set('sort', filterSort.value);
    if (filterSearch?.value.trim()) params.set('q', filterSearch.value.trim());

    return params.toString();
  }

  // ===========================
  // Rendering
  // ===========================
  function renderLots(lots) {
    if (!lotsGrid) return;

    if (lots.length === 0) {
      lotsGrid.innerHTML = '';
      if (lotsEmpty) lotsEmpty.style.display = 'block';
      return;
    }

    if (lotsEmpty) lotsEmpty.style.display = 'none';

    let html = '';
    lots.forEach((lot, i) => {
      // Insert finance CTA every 8 cards
      if (i > 0 && i % 8 === 0) {
        html += createLotCTA(i);
      }
      html += createLotCard(lot);
    });

    lotsGrid.innerHTML = html;

    // Attach calculator buttons
    lotsGrid.querySelectorAll('.lot-calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const price = parseInt(btn.dataset.price) || 0;
        if (typeof LoanCalc !== 'undefined') {
          LoanCalc.open(price);
        }
      });
    });
  }

  function createLotCard(lot) {
    const price = formatPrice(lot.guide_price_low, lot.guide_price_high);
    const daysUntil = getDaysUntil(lot.auction_date);
    const daysLabel = daysUntil !== null ? (daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`) : '';
    const typeBadge = getTypeBadgeClass(lot.property_type);
    const condBadge = getCondBadgeClass(lot.lot_condition);
    const houseName = getHouseName(lot.auction_house_id);
    const auctionDateFormatted = formatDate(lot.auction_date);
    const bridgingUrl = `${BRIDGING_URL}&amount=${lot.guide_price_low || ''}`;
    const imageStyle = lot.image_url
      ? `background-image: url('${lot.image_url}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-light) 100%);`;

    return `
      <div class="lot-card">
        <div class="lot-card-image" style="${imageStyle}">
          ${!lot.image_url ? `<div class="lot-card-image-icon">${getPropertyIcon(lot.property_type)}</div>` : ''}
          ${daysLabel ? `<span class="lot-card-countdown">${daysLabel}</span>` : ''}
          <span class="lot-card-type-badge ${typeBadge}">${capitalise(lot.property_type)}</span>
        </div>
        <div class="lot-card-body">
          <div class="lot-card-price">${price}</div>
          <h3 class="lot-card-title">${escapeHtml(lot.title)}</h3>
          <p class="lot-card-address">${escapeHtml(lot.address || '')}${lot.postcode ? ', ' + lot.postcode : ''}</p>
          <div class="lot-card-meta">
            <span class="lot-card-house">${escapeHtml(houseName)}</span>
            <span class="lot-card-date">${auctionDateFormatted}</span>
          </div>
          <div class="lot-card-tags">
            ${lot.bedrooms !== null && lot.bedrooms !== undefined ? `<span class="lot-tag">${lot.bedrooms} Bed${lot.bedrooms !== 1 ? 's' : ''}</span>` : ''}
            <span class="lot-tag ${condBadge}">${capitalise(lot.lot_condition)}</span>
            ${lot.lot_number ? `<span class="lot-tag">Lot ${lot.lot_number}</span>` : ''}
          </div>
          <div class="lot-card-actions">
            <button class="btn btn-outline btn-sm lot-calc-btn" data-price="${lot.guide_price_low || 0}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>
              Calculate Finance
            </button>
            <a href="${bridgingUrl}" target="_blank" rel="noopener" class="btn btn-accent btn-sm">
              Get Pre-Approved
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  function createLotCTA(index) {
    const messages = [
      { title: 'Found a Property at Auction?', text: 'Pre-approve your bridging loan and bid with confidence. 5-minute application.' },
      { title: 'Ready to Complete in 28 Days?', text: 'Bridging finance designed for auction buyers. Fast decisions, fast completions.' },
      { title: 'Spotted a Bargain?', text: 'Don\'t lose it to slow finance. Get pre-approved before the hammer falls.' },
    ];
    const msg = messages[Math.floor(index / 8 - 1) % messages.length];

    return `
      <div class="lot-inline-cta">
        <div class="lot-inline-cta-content">
          <h3>${msg.title}</h3>
          <p>${msg.text}</p>
        </div>
        <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent">
          Apply Now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    `;
  }

  function renderPagination(data) {
    if (!lotsPagination) return;
    const total = data.last_page || 1;
    const current = data.current_page || 1;

    if (total <= 1) {
      lotsPagination.innerHTML = '';
      return;
    }

    let html = '';

    // Previous
    html += `<button class="lot-page-btn" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">&laquo; Prev</button>`;

    // Page numbers (show max 7)
    const start = Math.max(1, current - 3);
    const end = Math.min(total, current + 3);
    if (start > 1) html += `<button class="lot-page-btn" data-page="1">1</button>`;
    if (start > 2) html += `<span class="lot-page-dots">...</span>`;

    for (let p = start; p <= end; p++) {
      html += `<button class="lot-page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }

    if (end < total - 1) html += `<span class="lot-page-dots">...</span>`;
    if (end < total) html += `<button class="lot-page-btn" data-page="${total}">${total}</button>`;

    // Next
    html += `<button class="lot-page-btn" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">Next &raquo;</button>`;

    lotsPagination.innerHTML = html;

    // Attach handlers
    lotsPagination.querySelectorAll('.lot-page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        fetchAndRender();
        document.getElementById('live-lots')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ===========================
  // Demo/Fallback Data
  // ===========================
  function renderDemoLots() {
    // When API is unavailable, show hardcoded demo lots
    const demoLots = [
      { title: '3-Bed Semi - Refurbishment Opportunity', address: '14 Maple Avenue, Croydon', postcode: 'CR0 6TN', region: 'London', property_type: 'residential', lot_condition: 'refurbishment', bedrooms: 3, guide_price_low: 280000, guide_price_high: 310000, auction_date: '2026-03-12', lot_number: 15, auction_house_id: 5 },
      { title: '2-Bed Terrace - Ideal BTL Investment', address: '27 Stanley Street, Burnley', postcode: 'BB11 4HE', region: 'North West', property_type: 'residential', lot_condition: 'modern', bedrooms: 2, guide_price_low: 45000, guide_price_high: 55000, auction_date: '2026-03-05', lot_number: 3, auction_house_id: 13 },
      { title: 'Ground Floor Commercial Unit - A1/A2 Use', address: '221 High Street, Bromley', postcode: 'BR1 1NG', region: 'London', property_type: 'commercial', lot_condition: 'modern', bedrooms: null, guide_price_low: 175000, guide_price_high: 200000, auction_date: '2026-03-12', lot_number: 22, auction_house_id: 5 },
      { title: 'Freehold Building Plot with Planning', address: 'Land adj 5 The Green, Ashford', postcode: 'TN24 8RX', region: 'South East', property_type: 'land', lot_condition: 'development', bedrooms: null, guide_price_low: 90000, guide_price_high: 110000, auction_date: '2026-03-25', lot_number: 4, auction_house_id: 36 },
      { title: '3-Bed Tenanted Producing £7,200 PA', address: '45 Birchfield Road, Birmingham', postcode: 'B20 3DG', region: 'West Midlands', property_type: 'residential', lot_condition: 'modern', bedrooms: 3, guide_price_low: 85000, guide_price_high: 95000, auction_date: '2026-03-19', lot_number: 12, auction_house_id: 19 },
      { title: '2-Bed Flat - Glasgow West End', address: '3/1, 42 Byres Road, Glasgow', postcode: 'G11 5JY', region: 'Scotland', property_type: 'residential', lot_condition: 'modern', bedrooms: 2, guide_price_low: 110000, guide_price_high: 130000, auction_date: '2026-03-15', lot_number: 5, auction_house_id: 98 },
    ];

    renderLots(demoLots);
    updateCount(demoLots.length);
    if (lotsPagination) lotsPagination.innerHTML = '';
  }

  // ===========================
  // Helpers
  // ===========================
  function formatPrice(low, high) {
    if (!low) return '<span class="lot-price-poa">POA</span>';
    const fmtLow = '£' + Number(low).toLocaleString('en-GB');
    if (high && high !== low) {
      const fmtHigh = '£' + Number(high).toLocaleString('en-GB');
      return `${fmtLow} - ${fmtHigh}`;
    }
    return fmtLow + '+';
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.floor((target - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }

  function getHouseName(houseId) {
    if (typeof AUCTION_HOUSES !== 'undefined') {
      const h = AUCTION_HOUSES.find(ah => ah.id === houseId);
      if (h) return h.name;
    }
    return `Auction House #${houseId}`;
  }

  function getTypeBadgeClass(type) {
    const map = { residential: 'lot-badge-residential', commercial: 'lot-badge-commercial', land: 'lot-badge-land', mixed: 'lot-badge-mixed' };
    return map[type] || '';
  }

  function getCondBadgeClass(cond) {
    const map = { modern: 'lot-cond-modern', refurbishment: 'lot-cond-refurb', development: 'lot-cond-dev', mixed: '' };
    return map[cond] || '';
  }

  function getPropertyIcon(type) {
    const icons = {
      residential: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
      commercial: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
      land: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><path d="M3 21h18M9 8h1M5 21V7l7-4 7 4v14"/></svg>',
      mixed: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
    };
    return icons[type] || icons.residential;
  }

  function capitalise(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showLoading(show) {
    if (lotsLoading) lotsLoading.style.display = show ? 'flex' : 'none';
    if (lotsGrid && show) lotsGrid.style.opacity = '0.5';
    if (lotsGrid && !show) lotsGrid.style.opacity = '1';
  }

  function updateCount(count) {
    if (lotsCount) lotsCount.textContent = `${count} lot${count !== 1 ? 's' : ''} available`;
  }

  function clearFilters() {
    [filterRegion, filterType, filterCondition, filterSort].forEach(el => { if (el) el.value = ''; });
    [filterPriceMin, filterPriceMax].forEach(el => { if (el) el.value = ''; });
    if (filterSearch) filterSearch.value = '';
    currentPage = 1;
    fetchAndRender();
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Public API
  return { init };
})();

// Init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  LotsModule.init();
});
