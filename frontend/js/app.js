// ReLoop Application Controller

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const CATEGORY_EMOJI = {
  Calculators: '🧮',
  Books: '📚',
  Cycles: '🚲',
  Electronics: '💻',
  Furniture: '🪑',
  'Lab Equipment': '🧪',
  Other: '🎒'
};

const AVATAR_BG = ['#FFC93C', '#BFE8C9', '#F7A8C4', '#9B7BEA', '#4C9BE8', '#3CC4B3', '#F9C9B0'];

const App = {
  currentCategory: 'All',
  allListings: [],
  pricingSuggestion: null,

  init() {
    this.bindNavigation();
    this.bindSearchAndFilters();
    this.bindSellForm();
    this.bindWantedForm();
    this.bindModals();

    this.loadMarketplace();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // ------------------------------------------------------------------------
  // Navigation & View Toggling
  // ------------------------------------------------------------------------
  bindNavigation() {
    const navButtons = document.querySelectorAll('[data-view-target]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view-target');
        this.switchView(targetView);
      });
    });
  },

  switchView(viewName) {
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    const targetElement = document.getElementById(`${viewName}-view`);
    if (targetElement) {
      targetElement.style.display = 'block';
    }

    document.querySelectorAll('[data-view-target]').forEach(btn => {
      if (btn.getAttribute('data-view-target') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'marketplace') {
      this.loadMarketplace();
    } else if (viewName === 'insights') {
      this.loadInsights();
    } else if (viewName === 'wanted') {
      this.loadWanted();
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // ------------------------------------------------------------------------
  // Marketplace & Filtering
  // ------------------------------------------------------------------------
  async loadMarketplace() {
    const grid = document.getElementById('listingsGrid');

    try {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon">⏳</div><h3 class="empty-state-title">Loading Campus Listings...</h3></div>';
      const listings = await Api.getAllListings();
      this.allListings = listings;
      this.renderListings(listings);
    } catch (err) {
      this.showToast(err.message, 'error');
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon bg-coral">⚠️</div><h3 class="empty-state-title">Could Not Load Listings</h3><p class="empty-state-desc">${this.escapeHtml(err.message)}</p><button class="btn btn-yellow btn-sm" onclick="App.loadMarketplace()">Retry</button></div>`;
    }
  },

  renderListings(listings) {
    const grid = document.getElementById('listingsGrid');
    const emptyState = document.getElementById('listingsEmptyState');
    const counter = document.getElementById('resultsCount');

    if (counter) counter.innerText = `${listings.length} ITEMS FOUND`;

    if (!listings || listings.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = listings.map(item => {
      const orig = parseFloat(item.originalPrice);
      const sell = parseFloat(item.sellingPrice);
      const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
      const condClass = item.condition ? item.condition.replace(/\s+/g, '') : 'Good';

      return `
        <article class="listing-card" data-id="${item.id}">
          <div class="listing-thumb-container">
            <img src="${this.escapeHtml(item.imageUrl)}" alt="${this.escapeHtml(item.itemName)}" class="listing-thumb" loading="lazy">
            <span class="badge-type">SELL</span>
            <span class="badge-condition ${condClass}">${this.escapeHtml(item.condition)}</span>
          </div>
          <div class="listing-body">
            <div class="listing-cat-line">${this.escapeHtml(item.category)} · ${item.ageInMonths} mos old</div>
            <h3 class="listing-title" title="${this.escapeHtml(item.itemName)}">${this.escapeHtml(item.itemName)}</h3>
            <div class="listing-meta-row">
              Seller: ${this.escapeHtml(item.sellerName || 'Campus Senior')}
            </div>

            <div class="listing-price-box">
              <div>
                <span class="price-main">₹${sell.toLocaleString('en-IN')}</span>
                ${orig > sell ? `<span class="price-original">₹${orig.toLocaleString('en-IN')}</span>` : ''}
              </div>
              ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
            </div>

            <div class="listing-footer-actions">
              <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="App.openListingModal(${item.id})">
                Details
              </button>
              <button class="btn btn-yellow btn-sm" onclick="App.openContactModal(${item.id})">
                Contact
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" title="Remove Listing" aria-label="Remove Listing" onclick="App.confirmDeleteListing(${item.id})">
                <i data-lucide="trash-2" style="width:15px;height:15px;color:#F25F5C;"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  },

  bindSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const conditionFilter = document.getElementById('conditionFilter');
    const sortFilter = document.getElementById('sortFilter');
    const minPriceInput = document.getElementById('minPriceInput');
    const maxPriceInput = document.getElementById('maxPriceInput');
    const applyPriceBtn = document.getElementById('applyPriceBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.getAttribute('data-category');
        this.executeSearch();
      });
    });

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.executeSearch(), 280);
    });

    conditionFilter?.addEventListener('change', () => this.executeSearch());
    sortFilter?.addEventListener('change', () => this.executeSearch());
    applyPriceBtn?.addEventListener('click', () => this.executeSearch());

    resetFiltersBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (conditionFilter) conditionFilter.value = 'All';
      if (sortFilter) sortFilter.value = 'newest';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      catPills.forEach(p => p.classList.remove('active'));
      catPills[0]?.classList.add('active');
      this.currentCategory = 'All';
      this.executeSearch();
    });
  },

  async executeSearch() {
    const keyword = document.getElementById('searchInput')?.value || '';
    const condition = document.getElementById('conditionFilter')?.value || 'All';
    const minPrice = document.getElementById('minPriceInput')?.value || '';
    const maxPrice = document.getElementById('maxPriceInput')?.value || '';
    const sortBy = document.getElementById('sortFilter')?.value || 'newest';

    try {
      const results = await Api.searchListings({
        category: this.currentCategory,
        condition,
        minPrice,
        maxPrice,
        keyword
      });

      results.sort((a, b) => {
        if (sortBy === 'price-asc') return parseFloat(a.sellingPrice) - parseFloat(b.sellingPrice);
        if (sortBy === 'price-desc') return parseFloat(b.sellingPrice) - parseFloat(a.sellingPrice);
        if (sortBy === 'age-asc') return parseInt(a.ageInMonths, 10) - parseInt(b.ageInMonths, 10);
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      this.renderListings(results);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ------------------------------------------------------------------------
  // SELL AN ITEM WORKFLOW & PRICING ENGINE INTEGRATION
  // ------------------------------------------------------------------------
  bindSellForm() {
    const sellForm = document.getElementById('sellItemForm');
    const calcPriceBtn = document.getElementById('calculatePriceBtn');
    const publishBtn = document.getElementById('publishListingBtn');
    const demoJudgeBtn = document.getElementById('demoJudgeScenarioBtn');
    const applySuggestedBtn = document.getElementById('applySuggestedPriceBtn');

    demoJudgeBtn?.addEventListener('click', () => {
      document.getElementById('sellItemName').value = 'Scientific Calculator fx-991ES';
      document.getElementById('sellCategory').value = 'Calculators';
      document.getElementById('sellCondition').value = 'Good';
      document.getElementById('sellAge').value = '24';
      document.getElementById('sellOriginalPrice').value = '1200';
      document.getElementById('sellDescription').value = 'Used for 2 academic years in mechanical engineering. Working flawlessly with solar cell.';
      document.getElementById('sellSellerName').value = 'Aarav_EE (Final Yr)';
      document.getElementById('sellContact').value = 'aarav.ee@campus.example';

      this.showToast('Benchmark loaded! Click "Get Fair Price".', 'info');
    });

    calcPriceBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const itemName = document.getElementById('sellItemName').value.trim();
      const category = document.getElementById('sellCategory').value;
      const condition = document.getElementById('sellCondition').value;
      const ageInMonths = document.getElementById('sellAge').value;
      const originalPrice = document.getElementById('sellOriginalPrice').value;

      if (!itemName || !category || !condition || ageInMonths === '' || !originalPrice) {
        this.showToast('Please fill out all required item fields first.', 'error');
        return;
      }

      try {
        calcPriceBtn.disabled = true;
        calcPriceBtn.innerHTML = 'Analyzing 200 Campus Sales...';

        const result = await Api.suggestPricing({
          itemName,
          category,
          condition,
          ageInMonths: parseInt(ageInMonths, 10),
          originalPrice: parseFloat(originalPrice)
        });

        this.pricingSuggestion = result;
        this.displayPricingCard(result);
        this.showToast('Fair market price calculated!', 'success');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        calcPriceBtn.disabled = false;
        calcPriceBtn.innerHTML = '<i data-lucide="sparkles"></i> Get Fair Price';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    applySuggestedBtn?.addEventListener('click', () => {
      if (this.pricingSuggestion) {
        document.getElementById('sellSellingPrice').value = this.pricingSuggestion.suggestedPrice;
        this.showToast(`Price set to ₹${this.pricingSuggestion.suggestedPrice}`, 'info');
      }
    });

    sellForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemName = document.getElementById('sellItemName').value.trim();
      const category = document.getElementById('sellCategory').value;
      const condition = document.getElementById('sellCondition').value;
      const ageInMonths = parseInt(document.getElementById('sellAge').value, 10);
      const originalPrice = parseFloat(document.getElementById('sellOriginalPrice').value);
      const sellingPrice = parseFloat(document.getElementById('sellSellingPrice').value);
      const description = document.getElementById('sellDescription').value.trim();
      const sellerName = document.getElementById('sellSellerName').value.trim();
      const contactInfo = document.getElementById('sellContact').value.trim();
      const imageUrl = document.getElementById('sellImageUrl').value.trim();

      if (!sellingPrice || sellingPrice <= 0) {
        this.showToast('Please specify a valid selling price.', 'error');
        return;
      }

      try {
        publishBtn.disabled = true;
        publishBtn.innerHTML = 'Publishing Listing...';

        const newListing = await Api.createListing({
          itemName,
          category,
          condition,
          ageInMonths,
          originalPrice,
          suggestedPrice: this.pricingSuggestion ? this.pricingSuggestion.suggestedPrice : null,
          sellingPrice,
          description,
          sellerName,
          contactInfo,
          imageUrl
        });

        this.showToast(`Listing "${newListing.itemName}" published!`, 'success');
        sellForm.reset();
        document.getElementById('pricingResultCard').style.display = 'none';
        this.pricingSuggestion = null;
        this.switchView('marketplace');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        publishBtn.disabled = false;
        publishBtn.innerHTML = '<i data-lucide="check-circle-2"></i> Publish Listing';
        if (window.lucide) window.lucide.createIcons();
      }
    });
  },

  displayPricingCard(res) {
    const card = document.getElementById('pricingResultCard');
    document.getElementById('cardSuggestedPrice').innerText = `₹${res.suggestedPrice.toLocaleString('en-IN')}`;
    document.getElementById('cardPriceRange').innerText = `₹${res.minimumPrice.toLocaleString('en-IN')} – ₹${res.maximumPrice.toLocaleString('en-IN')}`;
    document.getElementById('cardDepreciation').innerText = `${res.depreciationPercentage}% Depreciation`;
    document.getElementById('cardRetention').innerText = `${res.retentionPercentage}% Retained`;
    document.getElementById('cardComparableCount').innerText = `${res.comparableTransactions} Comparable Sales`;
    document.getElementById('cardExplanation').innerText = res.explanation;

    const sellingPriceInput = document.getElementById('sellSellingPrice');
    if (sellingPriceInput && (!sellingPriceInput.value || sellingPriceInput.value === '0')) {
      sellingPriceInput.value = res.suggestedPrice;
    }

    const meterFill = document.getElementById('cardPriceMeterFill');
    if (meterFill) {
      meterFill.style.width = `${Math.min(100, Math.max(15, res.retentionPercentage))}%`;
    }

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.lucide) window.lucide.createIcons();
  },

  // ------------------------------------------------------------------------
  // PRICING INSIGHTS
  // ------------------------------------------------------------------------
  async loadInsights() {
    try {
      const insights = await Api.getPricingInsights();

      document.getElementById('statTotalTransactions').innerText = insights.totalHistoricalTransactions || 200;
      document.getElementById('statAvgResale').innerText = `${insights.averageResalePercentage}%`;

      if (insights.bestValueRetainingCategory) {
        document.getElementById('statBestCategory').innerText = insights.bestValueRetainingCategory.category;
        document.getElementById('statBestCategorySub').innerText = `${insights.bestValueRetainingCategory.avgResalePercent}% Avg Retention`;
      }

      if (insights.highestDepreciatingCategory) {
        document.getElementById('statWorstCategory').innerText = insights.highestDepreciatingCategory.category;
        document.getElementById('statWorstCategorySub').innerText = `${insights.highestDepreciatingCategory.avgDepreciation}% Avg Depreciation`;
      }

      ChartManager.renderAllInsights(insights);
    } catch (err) {
      this.showToast('Failed to load insights: ' + err.message, 'error');
    }
  },

  // ------------------------------------------------------------------------
  // WANTED BOARD (Ledger Rows)
  // ------------------------------------------------------------------------
  async loadWanted() {
    const grid = document.getElementById('wantedGrid');
    const ledgerWrap = document.getElementById('wantedLedgerWrap');
    const emptyState = document.getElementById('wantedEmptyState');
    const countLabel = document.getElementById('wantedCountLabel');

    try {
      grid.innerHTML = '<div style="padding:28px; text-align:center; font-weight:700;">Loading campus requests...</div>';

      const requests = await Api.getAllWanted();
      if (countLabel) countLabel.innerText = `${requests.length} OPEN`;

      if (!requests || requests.length === 0) {
        ledgerWrap.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      ledgerWrap.style.display = 'block';

      grid.innerHTML = requests.map((w, idx) => {
        const emoji = CATEGORY_EMOJI[w.category] || '🎒';
        const bg = AVATAR_BG[idx % AVATAR_BG.length];
        return `
          <div class="wanted-row">
            <div class="wanted-emoji-avatar" style="background:${bg};">${emoji}</div>
            <div>
              <div class="wanted-title">${this.escapeHtml(w.itemName)}</div>
              <div class="wanted-desc">${this.escapeHtml(w.description || 'Looking for fair campus resale offer.')}</div>
              <div class="wanted-meta">${this.escapeHtml(w.category)} · Requested by ${this.escapeHtml(w.requestedBy)}</div>
            </div>
            <div class="wanted-row-actions">
              <span class="tag bg-mint">Max ₹${parseFloat(w.maxBudget).toLocaleString('en-IN')}</span>
            </div>
            <div class="wanted-row-actions">
              <button class="btn btn-yellow btn-sm" onclick="App.contactWantedRequester('${this.escapeHtml(w.contactInfo)}', '${this.escapeHtml(w.itemName)}')">
                Offer Item
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  bindWantedForm() {
    const form = document.getElementById('createWantedForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemName = document.getElementById('wantedItemName').value.trim();
      const category = document.getElementById('wantedCategory').value;
      const maxBudget = parseFloat(document.getElementById('wantedMaxBudget').value);
      const description = document.getElementById('wantedDescription').value.trim();
      const requestedBy = document.getElementById('wantedRequester').value.trim();
      const contactInfo = document.getElementById('wantedContact').value.trim();

      try {
        await Api.createWanted({
          itemName,
          category,
          maxBudget,
          description,
          requestedBy,
          contactInfo
        });

        this.showToast('Wanted request posted!', 'success');
        form.reset();
        this.closeModal('wantedModal');
        this.loadWanted();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  contactWantedRequester(contact, itemTitle) {
    this.showToast(`Reach ${contact} to offer "${itemTitle}"`, 'info');
  },

  // ------------------------------------------------------------------------
  // MODALS & ACTIONS
  // ------------------------------------------------------------------------
  bindModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  openListingModal(id) {
    const item = this.allListings.find(l => l.id == id);
    if (!item) return;

    const modalBody = document.getElementById('itemModalBody');
    const orig = parseFloat(item.originalPrice);
    const sell = parseFloat(item.sellingPrice);
    const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;

    modalBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <img src="${this.escapeHtml(item.imageUrl || '')}" alt="${this.escapeHtml(item.itemName)}" style="width:100%; height:230px; object-fit:cover; border-radius:12px; border:2.5px solid #111111;" />
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
          <div>
            <span class="tag bg-yellow" style="margin-bottom:6px;">${this.escapeHtml(item.category)}</span>
            <h2 style="font-size:1.35rem; font-weight:800; color:#111111;">${this.escapeHtml(item.itemName)}</h2>
          </div>
          <span class="tag bg-mint">${this.escapeHtml(item.condition)}</span>
        </div>

        <div class="card" style="padding:14px 16px; display:flex; justify-content:space-between; align-items:center; background:#FFF9E6;">
          <div>
            <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700;">SELLING PRICE</div>
            <div style="font-size:1.8rem; font-weight:800;" class="tabular-nums">₹${sell.toLocaleString('en-IN')}</div>
          </div>
          ${orig > sell ? `
            <div style="text-align:right;">
              <div style="font-size:0.82rem; color:#4A463F;">Original: <span style="text-decoration:line-through;">₹${orig.toLocaleString('en-IN')}</span></div>
              <span class="discount-tag">Save ₹${(orig - sell).toLocaleString('en-IN')} (${discount}% off)</span>
            </div>
          ` : ''}
        </div>

        <div class="card" style="padding:14px 16px;">
          <h4 style="font-weight:800; margin-bottom:4px; font-size:0.92rem;">Item Description</h4>
          <p style="color:#4A463F; font-size:0.9rem; line-height:1.55;">${this.escapeHtml(item.description || 'No description provided.')}</p>
        </div>

        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; font-family:var(--font-mono); font-size:0.78rem;">
          <span><strong>AGE:</strong> ${item.ageInMonths} mos</span>
          <span><strong>SELLER:</strong> ${this.escapeHtml(item.sellerName || 'Campus Senior')}</span>
          <span><strong>CONTACT:</strong> ${this.escapeHtml(item.contactInfo || 'senior@campus.example')}</span>
        </div>
      </div>
    `;

    this.openModal('itemDetailModal');
  },

  openContactModal(id) {
    const item = this.allListings.find(l => l.id == id);
    if (!item) return;

    this.showToast(`Contact ${item.sellerName || 'Campus Senior'} at ${item.contactInfo || 'senior@campus.example'}`, 'info');
  },

  async confirmDeleteListing(id) {
    try {
      await Api.deleteListing(id);
      this.showToast('Listing removed', 'info');
      this.loadMarketplace();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ------------------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------------------
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';
    if (type === 'info') icon = 'info';

    toast.innerHTML = `<i data-lucide="${icon}" style="width:16px;height:16px;"></i> <span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 3800);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
