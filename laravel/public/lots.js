// ===========================
// Live Lot Listings Module
// ===========================
// Fetches lots from Laravel API and renders interactive cards
// with Lendlord bridging finance CTAs and enrichment data.

const LotsModule = (() => {
  'use strict';

  const BRIDGING_URL = 'https://app.lendlord.io/bridging-application?country=uk&utm_source=Lendlord&utm_campaign=auction_houses_hub';
  const API_BASE = '/api';
  const PER_PAGE = 20;

  let currentPage = 1;
  let totalPages = 1;
  let isLoading = false;
  let currentFilters = {};

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

    injectDrawerShell();
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
      if (el && stats.upcoming_lots) el.textContent = stats.upcoming_lots;
    } catch { /* non-critical */ }
  }

  async function fetchEnrichment(lotId) {
    try {
      const res = await fetch(`${API_BASE}/lots/${lotId}/enrichment`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function buildQueryParams() {
    const params = new URLSearchParams();
    params.set('page', currentPage);
    params.set('per_page', PER_PAGE);
    params.set('include_enrichment', '1');

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
      if (i > 0 && i % 8 === 0) html += createLotCTA(i);
      html += createLotCard(lot);
    });

    lotsGrid.innerHTML = html;

    lotsGrid.querySelectorAll('.lot-calc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const price = parseInt(btn.dataset.price) || 0;
        if (typeof LoanCalc !== 'undefined') LoanCalc.open(price);
      });
    });

    lotsGrid.querySelectorAll('.lot-card[data-lot-id]').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button')) return;
        const lotId = card.dataset.lotId;
        const lot = lots.find(l => String(l.id) === lotId);
        if (lot) openDrawer(lot);
      });
      card.style.cursor = 'pointer';
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

    const e = lot.enrichment;
    let badgesHtml = '';
    if (e) {
      const pills = [];
      if (e.epc_rating) pills.push(`<span class="enr-pill enr-epc enr-epc-${e.epc_rating.toLowerCase()}">${e.epc_rating}</span>`);
      if (e.flood_risk_level) pills.push(`<span class="enr-pill enr-flood enr-flood-${e.flood_risk_level}">${floodLabel(e.flood_risk_level)}</span>`);
      if (e.crime_total !== null && e.crime_total !== undefined) pills.push(`<span class="enr-pill enr-crime enr-crime-${crimeLevel(e.crime_total)}">${crimeLevel(e.crime_total)}</span>`);
      if (e.floor_area_sqm) pills.push(`<span class="enr-pill enr-sqft">${Math.round(e.floor_area_sqm * 10.764)} sqft</span>`);
      if (e.land_reg_avg_price) {
        const guidePrice = lot.guide_price_low || 0;
        if (guidePrice > 0) {
          const diff = ((guidePrice - e.land_reg_avg_price) / e.land_reg_avg_price * 100).toFixed(0);
          const cls = diff <= 0 ? 'below' : 'above';
          pills.push(`<span class="enr-pill enr-price-cmp enr-price-${cls}">${diff <= 0 ? '' : '+'}${diff}% vs area</span>`);
        }
      }
      if (pills.length > 0) {
        badgesHtml = `<div class="enr-badges">${pills.join('')}</div>`;
      }
    }

    return `
      <div class="lot-card" data-lot-id="${lot.id || ''}">
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
          ${badgesHtml}
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

  // ===========================
  // Lot Detail Drawer
  // ===========================
  function injectDrawerShell() {
    if (document.getElementById('lotDrawerOverlay')) return;
    const shell = document.createElement('div');
    shell.innerHTML = `
      <div class="lot-drawer-overlay" id="lotDrawerOverlay">
        <div class="lot-drawer" id="lotDrawer">
          <button class="lot-drawer-close" id="lotDrawerClose">&times;</button>
          <div class="lot-drawer-content" id="lotDrawerContent"></div>
        </div>
      </div>
    `;
    document.body.appendChild(shell);

    document.getElementById('lotDrawerOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'lotDrawerOverlay') closeDrawer();
    });
    document.getElementById('lotDrawerClose').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  }

  function openDrawer(lot) {
    const overlay = document.getElementById('lotDrawerOverlay');
    const content = document.getElementById('lotDrawerContent');
    if (!overlay || !content) return;

    const houseName = getHouseName(lot.auction_house_id);
    const price = formatPrice(lot.guide_price_low, lot.guide_price_high);
    const auctionDate = formatDate(lot.auction_date);
    const bridgingUrl = `${BRIDGING_URL}&amount=${lot.guide_price_low || ''}`;

    content.innerHTML = `
      <div class="ld-header">
        ${lot.image_url ? `<img src="${lot.image_url}" alt="" class="ld-hero-img" onerror="this.style.display='none'">` : ''}
        <div class="ld-hero-info">
          <div class="ld-price">${price}</div>
          <h2 class="ld-title">${escapeHtml(lot.title)}</h2>
          <p class="ld-address">${escapeHtml(lot.address || '')}${lot.postcode ? ', ' + lot.postcode : ''}</p>
          <div class="ld-meta">
            <span>${escapeHtml(houseName)}</span>
            ${auctionDate ? `<span>${auctionDate}</span>` : ''}
            ${lot.lot_number ? `<span>Lot ${lot.lot_number}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="ld-tabs">
        <button class="ld-tab active" data-tab="overview">Overview</button>
        <button class="ld-tab" data-tab="location">Location</button>
        <button class="ld-tab" data-tab="prices">Prices</button>
        <button class="ld-tab" data-tab="property">Property</button>
      </div>

      <div class="ld-panels">
        <div class="ld-panel active" id="ldPanelOverview">
          ${renderOverviewTab(lot)}
        </div>
        <div class="ld-panel" id="ldPanelLocation">
          <div class="ld-loading">Loading location data...</div>
        </div>
        <div class="ld-panel" id="ldPanelPrices">
          <div class="ld-loading">Loading price data...</div>
        </div>
        <div class="ld-panel" id="ldPanelProperty">
          <div class="ld-loading">Loading property details...</div>
        </div>
      </div>

      <div class="ld-actions">
        ${lot.external_url ? `<a href="${lot.external_url}" target="_blank" rel="noopener" class="btn btn-outline">View on Auction House</a>` : ''}
        <a href="${bridgingUrl}" target="_blank" rel="noopener" class="btn btn-accent">Get Auction Finance</a>
      </div>
    `;

    content.querySelectorAll('.ld-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        content.querySelectorAll('.ld-tab').forEach(t => t.classList.remove('active'));
        content.querySelectorAll('.ld-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panelId = 'ldPanel' + capitalise(tab.dataset.tab);
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('active');
      });
    });

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (lot.id) {
      fetchEnrichment(lot.id).then(resp => {
        if (resp && resp.data) {
          populateEnrichmentTabs(resp.data, lot);
        } else {
          setTabPlaceholder('ldPanelLocation', 'No enrichment data available yet for this property.');
          setTabPlaceholder('ldPanelPrices', 'No enrichment data available yet for this property.');
          setTabPlaceholder('ldPanelProperty', 'No enrichment data available yet for this property.');
        }
      });
    }
  }

  function closeDrawer() {
    const overlay = document.getElementById('lotDrawerOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    destroyMap();
  }

  function setTabPlaceholder(panelId, msg) {
    const panel = document.getElementById(panelId);
    if (panel) panel.innerHTML = `<div class="ld-empty">${msg}</div>`;
  }

  function renderOverviewTab(lot) {
    const e = lot.enrichment;
    const facts = [];
    if (lot.bedrooms !== null && lot.bedrooms !== undefined) facts.push(['Bedrooms', lot.bedrooms]);
    if (e?.floor_area_sqm) facts.push(['Floor Area', `${e.floor_area_sqm} sqm / ${Math.round(e.floor_area_sqm * 10.764)} sqft`]);
    if (e?.epc_rating) facts.push(['EPC Rating', e.epc_rating]);
    if (e?.built_form) facts.push(['Built Form', e.built_form]);
    if (lot.lot_condition) facts.push(['Condition', capitalise(lot.lot_condition)]);
    if (lot.property_type) facts.push(['Type', capitalise(lot.property_type)]);

    const factsHtml = facts.length > 0
      ? `<div class="ld-facts">${facts.map(f => `<div class="ld-fact"><span class="ld-fact-label">${f[0]}</span><span class="ld-fact-value">${f[1]}</span></div>`).join('')}</div>`
      : '';

    let quickBadges = '';
    if (e) {
      const items = [];
      if (e.epc_rating) items.push(`<span class="enr-pill enr-epc enr-epc-${e.epc_rating.toLowerCase()}">EPC ${e.epc_rating}</span>`);
      if (e.flood_risk_level) items.push(`<span class="enr-pill enr-flood enr-flood-${e.flood_risk_level}">Flood: ${floodLabel(e.flood_risk_level)}</span>`);
      if (e.crime_total !== null && e.crime_total !== undefined) items.push(`<span class="enr-pill enr-crime enr-crime-${crimeLevel(e.crime_total)}">Crime: ${capitalise(crimeLevel(e.crime_total))}</span>`);
      if (items.length) quickBadges = `<div class="enr-badges" style="margin-bottom:16px">${items.join('')}</div>`;
    }

    return `${quickBadges}${factsHtml}`;
  }

  // ===========================
  // Enrichment Tab Population
  // ===========================
  function populateEnrichmentTabs(data, lot) {
    // Location tab
    const locPanel = document.getElementById('ldPanelLocation');
    if (locPanel) locPanel.innerHTML = renderLocationTab(data, lot);

    // Prices tab
    const pricePanel = document.getElementById('ldPanelPrices');
    if (pricePanel) pricePanel.innerHTML = renderPricesTab(data, lot);

    // Property tab
    const propPanel = document.getElementById('ldPanelProperty');
    if (propPanel) propPanel.innerHTML = renderPropertyTab(data);

    if (data.location?.latitude && data.location?.longitude) {
      initDrawerMap(data.location.latitude, data.location.longitude, data.amenities?.details);
    }
  }

  function renderLocationTab(data, lot) {
    const loc = data.location || {};
    const crime = data.crime || {};
    const flood = data.flood || {};
    const amenities = data.amenities || {};

    let html = '';

    html += `<div class="ld-map-container" id="ldMap"></div>`;

    if (loc.admin_district || loc.ward) {
      html += `<div class="ld-section">
        <h4>Area</h4>
        <div class="ld-facts">
          ${loc.admin_district ? `<div class="ld-fact"><span class="ld-fact-label">District</span><span class="ld-fact-value">${loc.admin_district}</span></div>` : ''}
          ${loc.ward ? `<div class="ld-fact"><span class="ld-fact-label">Ward</span><span class="ld-fact-value">${loc.ward}</span></div>` : ''}
          ${loc.constituency ? `<div class="ld-fact"><span class="ld-fact-label">Constituency</span><span class="ld-fact-value">${loc.constituency}</span></div>` : ''}
        </div>
      </div>`;
    }

    // Crime section
    if (crime.total !== null && crime.total !== undefined) {
      const lvl = crime.level || crimeLevel(crime.total);
      html += `<div class="ld-section">
        <h4>Crime (1-mile radius, last month)</h4>
        <div class="ld-crime-header">
          <span class="enr-pill enr-crime enr-crime-${lvl}">${capitalise(lvl)} (${crime.total} incidents)</span>
        </div>
        <div class="ld-crime-chart">${renderCrimeDonut(crime)}</div>
        <div class="ld-crime-legend">
          ${crimeLegendItems(crime)}
        </div>
      </div>`;
    }

    // Flood section
    if (flood.risk_level) {
      html += `<div class="ld-section">
        <div class="ld-flood-box ld-flood-${flood.risk_level}">
          <div class="ld-flood-icon">${floodIcon()}</div>
          <div>
            <strong>Flood Risk: ${flood.level_label || capitalise(flood.risk_level)}</strong>
            <span>${flood.risk_zone || ''}</span>
            ${flood.warnings_nearby > 0 ? `<span class="ld-flood-warn">${flood.warnings_nearby} active warning${flood.warnings_nearby > 1 ? 's' : ''} nearby</span>` : ''}
          </div>
        </div>
      </div>`;
    }

    // Amenities section
    const am = amenities.details;
    if (am) {
      html += `<div class="ld-section">
        <h4>Nearby Amenities (1.5 km)</h4>
        <div class="ld-amenity-grid">
          ${renderAmenityGroup('Train Stations', amenities.stations_count, am.stations, stationIcon())}
          ${renderAmenityGroup('Schools', amenities.schools_count, am.schools, schoolIcon())}
          ${renderAmenityGroup('Supermarkets', amenities.supermarkets_count, am.supermarkets, shopIcon())}
          ${am.hospitals?.length ? renderAmenityGroup('Hospitals', am.hospitals.length, am.hospitals, hospitalIcon()) : ''}
          ${am.parks?.length ? renderAmenityGroup('Parks', am.parks.length, am.parks, parkIcon()) : ''}
        </div>
      </div>`;
    }

    return html || '<div class="ld-empty">No location data available.</div>';
  }

  function renderPricesTab(data, lot) {
    const lr = data.land_registry || {};
    let html = '';

    if (lr.avg_price) {
      const guidePrice = lot.guide_price_low || 0;
      const diffPct = guidePrice > 0 ? ((guidePrice - lr.avg_price) / lr.avg_price * 100).toFixed(1) : null;

      html += `<div class="ld-section">
        <h4>Area Price Summary</h4>
        <div class="ld-price-comparison">
          <div class="ld-price-bar-group">
            <div class="ld-price-bar-row">
              <span class="ld-bar-label">Guide Price</span>
              <div class="ld-bar-track"><div class="ld-bar-fill ld-bar-guide" style="width:${barPct(guidePrice, lr.avg_price)}%"></div></div>
              <span class="ld-bar-value">${guidePrice ? '£' + guidePrice.toLocaleString() : 'POA'}</span>
            </div>
            <div class="ld-price-bar-row">
              <span class="ld-bar-label">Area Average</span>
              <div class="ld-bar-track"><div class="ld-bar-fill ld-bar-avg" style="width:${barPct(lr.avg_price, guidePrice || lr.avg_price)}%"></div></div>
              <span class="ld-bar-value">£${lr.avg_price.toLocaleString()}</span>
            </div>
          </div>
          ${diffPct !== null ? `<div class="ld-price-verdict ${parseFloat(diffPct) <= 0 ? 'positive' : 'negative'}">
            ${parseFloat(diffPct) <= 0 ? 'Below' : 'Above'} area average by <strong>${Math.abs(parseFloat(diffPct))}%</strong>
          </div>` : ''}
        </div>
      </div>`;
    }

    if (lr.last_sale_price) {
      html += `<div class="ld-section">
        <h4>Last Sale at This Postcode</h4>
        <div class="ld-facts">
          <div class="ld-fact"><span class="ld-fact-label">Price</span><span class="ld-fact-value">£${lr.last_sale_price.toLocaleString()}</span></div>
          ${lr.last_sale_date ? `<div class="ld-fact"><span class="ld-fact-label">Date</span><span class="ld-fact-value">${formatDate(lr.last_sale_date)}</span></div>` : ''}
        </div>
      </div>`;
    }

    if (lr.transactions && lr.transactions.length > 0) {
      const rows = lr.transactions.slice(0, 10).map(t => `
        <tr>
          <td>£${(t.price || 0).toLocaleString()}</td>
          <td>${t.date ? formatDate(t.date) : '-'}</td>
          <td>${escapeHtml(t.address || '-')}</td>
        </tr>`).join('');
      html += `<div class="ld-section">
        <h4>Recent Sales at Postcode (${lr.transactions.length})</h4>
        <div class="ld-table-wrap">
          <table class="ld-table">
            <thead><tr><th>Price</th><th>Date</th><th>Address</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
    }

    return html || '<div class="ld-empty">No price data available for this area.</div>';
  }

  function renderPropertyTab(data) {
    const epc = data.epc || {};
    let html = '';

    if (epc.rating) {
      html += `<div class="ld-section">
        <h4>Energy Performance Certificate</h4>
        <div class="ld-epc-visual">
          ${renderEpcBar(epc)}
        </div>
      </div>`;
    }

    const details = [];
    if (epc.floor_area_sqm) details.push(['Floor Area', `${epc.floor_area_sqm} sqm / ${epc.floor_area_sqft} sqft`]);
    if (epc.built_form) details.push(['Built Form', epc.built_form]);
    if (epc.heating_type) details.push(['Heating', epc.heating_type]);
    if (epc.wall_description) details.push(['Walls', epc.wall_description]);
    if (epc.roof_description) details.push(['Roof', epc.roof_description]);

    if (details.length > 0) {
      html += `<div class="ld-section">
        <h4>Construction Details</h4>
        <div class="ld-facts">
          ${details.map(d => `<div class="ld-fact"><span class="ld-fact-label">${d[0]}</span><span class="ld-fact-value">${d[1]}</span></div>`).join('')}
        </div>
      </div>`;
    }

    return html || '<div class="ld-empty">No property details available yet.</div>';
  }

  // ===========================
  // SVG Chart Helpers
  // ===========================
  function renderCrimeDonut(crime) {
    if (!crime.breakdown) return '';
    const entries = Object.entries(crime.breakdown).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = entries.reduce((s, e) => s + e[1], 0);
    if (total === 0) return '';

    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
    let cumulative = 0;
    const size = 100;
    const cx = 50, cy = 50, r = 38;
    let paths = '';

    entries.forEach((entry, i) => {
      const pct = entry[1] / total;
      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      cumulative += pct;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const largeArc = pct > 0.5 ? 1 : 0;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      paths += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" opacity="0.85"/>`;
    });

    return `<svg viewBox="0 0 ${size} ${size}" class="ld-donut">${paths}
      <circle cx="${cx}" cy="${cy}" r="20" fill="var(--bg-card, #fff)"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" font-size="10" font-weight="700" fill="var(--text-primary, #1a1a2e)">${total}</text>
    </svg>`;
  }

  function crimeLegendItems(crime) {
    if (!crime.breakdown) return '';
    const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#6B7280'];
    return Object.entries(crime.breakdown).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map((e, i) => `<span class="ld-legend-item"><span class="ld-legend-dot" style="background:${colors[i % colors.length]}"></span>${formatCrimeCat(e[0])} (${e[1]})</span>`)
      .join('');
  }

  function formatCrimeCat(cat) {
    return cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function renderEpcBar(epc) {
    const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const colors = ['#00A651', '#50B848', '#BFD730', '#FFC107', '#F7941D', '#ED1C24', '#BE1E2D'];
    const ranges = [[92, 100], [81, 91], [69, 80], [55, 68], [39, 54], [21, 38], [1, 20]];

    return `<div class="ld-epc-bars">
      ${ratings.map((r, i) => {
        const isCurrent = r === epc.rating;
        const isPotential = epc.score_potential && epc.score_potential >= ranges[i][0] && epc.score_potential <= ranges[i][1] && r !== epc.rating;
        const width = 30 + (7 - i) * 10;
        return `<div class="ld-epc-row ${isCurrent ? 'ld-epc-current' : ''} ${isPotential ? 'ld-epc-potential' : ''}">
          <div class="ld-epc-band" style="background:${colors[i]};width:${width}%">${r} <span class="ld-epc-range">${ranges[i][0]}-${ranges[i][1]}</span></div>
          ${isCurrent ? `<span class="ld-epc-marker">Current (${epc.score_current || ''})</span>` : ''}
          ${isPotential ? `<span class="ld-epc-marker ld-epc-marker-pot">Potential (${epc.score_potential || ''})</span>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  // ===========================
  // Map (Leaflet.js)
  // ===========================
  let drawerMap = null;

  function initDrawerMap(lat, lng, amenities) {
    const container = document.getElementById('ldMap');
    if (!container) return;

    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => buildMap(lat, lng, amenities);
      document.head.appendChild(script);
    } else {
      buildMap(lat, lng, amenities);
    }
  }

  function buildMap(lat, lng, amenities) {
    const container = document.getElementById('ldMap');
    if (!container || !window.L) return;

    drawerMap = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(drawerMap);

    L.marker([lat, lng]).addTo(drawerMap).bindPopup('Property Location').openPopup();

    if (amenities) {
      const icons = { stations: '#3B82F6', schools: '#F59E0B', supermarkets: '#10B981', hospitals: '#EF4444', parks: '#22C55E' };
      Object.entries(amenities).forEach(([type, list]) => {
        if (!Array.isArray(list)) return;
        list.forEach(item => {
          if (!item.lat || !item.lng) return;
          L.circleMarker([item.lat, item.lng], {
            radius: 6, color: icons[type] || '#6B7280', fillColor: icons[type] || '#6B7280', fillOpacity: 0.7, weight: 1
          }).addTo(drawerMap).bindPopup(`<strong>${escapeHtml(item.name)}</strong><br>${type} (${item.distance_m}m)`);
        });
      });
    }

    setTimeout(() => drawerMap.invalidateSize(), 300);
  }

  function destroyMap() {
    if (drawerMap) { drawerMap.remove(); drawerMap = null; }
  }

  // ===========================
  // Amenity Rendering
  // ===========================
  function renderAmenityGroup(title, count, items, icon) {
    const listHtml = (items || []).slice(0, 3).map(i =>
      `<div class="ld-amenity-item"><span>${escapeHtml(i.name)}</span><span class="ld-amenity-dist">${formatDistance(i.distance_m)}</span></div>`
    ).join('');
    return `<div class="ld-amenity-card">
      <div class="ld-amenity-head">${icon}<strong>${title}</strong><span class="ld-amenity-count">${count || 0}</span></div>
      ${listHtml}
    </div>`;
  }

  function formatDistance(m) {
    if (!m) return '';
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
  }

  // ===========================
  // SVG Icons
  // ===========================
  function stationIcon() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M12 17v4M8 21h8M9 10h0M15 10h0"/></svg>'; }
  function schoolIcon() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>'; }
  function shopIcon() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><path d="M3 9l1-4h16l1 4M3 9h18v12H3V9z"/><path d="M9 21V14h6v7"/></svg>'; }
  function hospitalIcon() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>'; }
  function parkIcon() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2"><path d="M12 3c-3 0-7 4-7 8s3 6 7 6 7-2 7-6-4-8-7-8z"/><path d="M12 17v4"/></svg>'; }
  function floodIcon() { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M2 20c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><path d="M12 4v8"/><circle cx="12" cy="4" r="1"/></svg>'; }

  // ===========================
  // Helpers
  // ===========================
  function floodLabel(level) {
    const map = { low: 'Low', very_low: 'V.Low', medium: 'Med', high: 'High' };
    return map[level] || level;
  }

  function crimeLevel(total) {
    if (total === null || total === undefined) return 'unknown';
    if (total <= 30) return 'low';
    if (total <= 80) return 'medium';
    return 'high';
  }

  function barPct(val, reference) {
    if (!val || !reference) return 50;
    const max = Math.max(val, reference) * 1.1;
    return Math.min(100, Math.round((val / max) * 100));
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
        <div class="lot-inline-cta-content"><h3>${msg.title}</h3><p>${msg.text}</p></div>
        <a href="${BRIDGING_URL}" target="_blank" rel="noopener" class="btn btn-accent">Apply Now <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
      </div>`;
  }

  function renderPagination(data) {
    if (!lotsPagination) return;
    const total = data.last_page || 1;
    const current = data.current_page || 1;
    if (total <= 1) { lotsPagination.innerHTML = ''; return; }
    let html = `<button class="lot-page-btn" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">&laquo; Prev</button>`;
    const start = Math.max(1, current - 3);
    const end = Math.min(total, current + 3);
    if (start > 1) html += `<button class="lot-page-btn" data-page="1">1</button>`;
    if (start > 2) html += `<span class="lot-page-dots">...</span>`;
    for (let p = start; p <= end; p++) html += `<button class="lot-page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
    if (end < total - 1) html += `<span class="lot-page-dots">...</span>`;
    if (end < total) html += `<button class="lot-page-btn" data-page="${total}">${total}</button>`;
    html += `<button class="lot-page-btn" ${current >= total ? 'disabled' : ''} data-page="${current + 1}">Next &raquo;</button>`;
    lotsPagination.innerHTML = html;
    lotsPagination.querySelectorAll('.lot-page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        fetchAndRender();
        document.getElementById('live-lots')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderDemoLots() {
    const demoLots = [
      { id: 'd1', title: '3-Bed Semi - Refurbishment Opportunity', address: '14 Maple Avenue, Croydon', postcode: 'CR0 6TN', region: 'London', property_type: 'residential', lot_condition: 'refurbishment', bedrooms: 3, guide_price_low: 280000, guide_price_high: 310000, auction_date: '2026-03-12', lot_number: 15, auction_house_id: 5 },
      { id: 'd2', title: '2-Bed Terrace - Ideal BTL Investment', address: '27 Stanley Street, Burnley', postcode: 'BB11 4HE', region: 'North West', property_type: 'residential', lot_condition: 'modern', bedrooms: 2, guide_price_low: 45000, guide_price_high: 55000, auction_date: '2026-03-05', lot_number: 3, auction_house_id: 13 },
      { id: 'd3', title: 'Ground Floor Commercial Unit - A1/A2 Use', address: '221 High Street, Bromley', postcode: 'BR1 1NG', region: 'London', property_type: 'commercial', lot_condition: 'modern', bedrooms: null, guide_price_low: 175000, guide_price_high: 200000, auction_date: '2026-03-12', lot_number: 22, auction_house_id: 5 },
      { id: 'd4', title: 'Freehold Building Plot with Planning', address: 'Land adj 5 The Green, Ashford', postcode: 'TN24 8RX', region: 'South East', property_type: 'land', lot_condition: 'development', bedrooms: null, guide_price_low: 90000, guide_price_high: 110000, auction_date: '2026-03-25', lot_number: 4, auction_house_id: 36 },
      { id: 'd5', title: '3-Bed Tenanted Producing 7,200 PA', address: '45 Birchfield Road, Birmingham', postcode: 'B20 3DG', region: 'West Midlands', property_type: 'residential', lot_condition: 'modern', bedrooms: 3, guide_price_low: 85000, guide_price_high: 95000, auction_date: '2026-03-19', lot_number: 12, auction_house_id: 19 },
      { id: 'd6', title: '2-Bed Flat - Glasgow West End', address: '3/1, 42 Byres Road, Glasgow', postcode: 'G11 5JY', region: 'Scotland', property_type: 'residential', lot_condition: 'modern', bedrooms: 2, guide_price_low: 110000, guide_price_high: 130000, auction_date: '2026-03-15', lot_number: 5, auction_house_id: 98 },
    ];
    renderLots(demoLots);
    updateCount(demoLots.length);
    if (lotsPagination) lotsPagination.innerHTML = '';
  }

  function formatPrice(low, high) {
    if (!low) return '<span class="lot-price-poa">POA</span>';
    const fmtLow = '£' + Number(low).toLocaleString('en-GB');
    if (high && high !== low) return `${fmtLow} - £${Number(high).toLocaleString('en-GB')}`;
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
    const now = new Date(); now.setHours(0, 0, 0, 0);
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
    return { residential: 'lot-badge-residential', commercial: 'lot-badge-commercial', land: 'lot-badge-land', mixed: 'lot-badge-mixed' }[type] || '';
  }

  function getCondBadgeClass(cond) {
    return { modern: 'lot-cond-modern', refurbishment: 'lot-cond-refurb', development: 'lot-cond-dev', mixed: '' }[cond] || '';
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

  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function showLoading(show) {
    if (lotsLoading) lotsLoading.style.display = show ? 'flex' : 'none';
    if (lotsGrid) lotsGrid.style.opacity = show ? '0.5' : '1';
  }
  function updateCount(count) { if (lotsCount) lotsCount.textContent = `${count} lot${count !== 1 ? 's' : ''} available`; }
  function clearFilters() {
    [filterRegion, filterType, filterCondition, filterSort].forEach(el => { if (el) el.value = ''; });
    [filterPriceMin, filterPriceMax].forEach(el => { if (el) el.value = ''; });
    if (filterSearch) filterSearch.value = '';
    currentPage = 1; fetchAndRender();
  }
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => { LotsModule.init(); });
