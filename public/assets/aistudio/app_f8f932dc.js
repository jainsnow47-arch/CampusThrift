// ReLoop Application Controller

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

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

    // Load initial marketplace data
    this.loadMarketplace();

    // Initialize Lucide icons
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
    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    // Show target view
    const targetElement = document.getElementById(`${viewName}-view`);
    if (targetElement) {
      targetElement.style.display = 'block';
    }

    // Update active nav button
    document.querySelectorAll('[data-view-target]').forEach(btn => {
      if (btn.getAttribute('data-view-target') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger view-specific data loads
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
    const emptyState = document.getElementById('listingsEmptyState');
    const counter = document.getElementById('resultsCount');

    try {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><div class="empty-state-icon"><i data-lucide="loader-2" class="spin"></i></div><p>Loading campus listings...</p></div>';
      if (window.lucide) window.lucide.createIcons();

      const listings = await Api.getAllListings();
      this.allListings = listings;
      this.renderListings(listings);
    } catch (err) {
      this.showToast(err.message, 'error');
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;"><p>Failed to load listings: ${err.message}</p></div>`;
    }
  },

  renderListings(listings) {
    const grid = document.getElementById('listingsGrid');
    const emptyState = document.getElementById('listingsEmptyState');
    const counter = document.getElementById('resultsCount');

    if (counter) counter.innerText = `${listings.length} items found`;

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
        <div class="listing-card" data-id="${item.id}">
          <div class="listing-thumb-container">
            <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}" alt="${this.escapeHtml(item.itemName)}" class="listing-thumb" loading="lazy">
            <span class="badge-condition ${condClass}">${item.condition}</span>
            <span class="badge-category">${item.category}</span>
          </div>
          <div class="listing-body">
            <h3 class="listing-title" title="${this.escapeHtml(item.itemName)}">${this.escapeHtml(item.itemName)}</h3>
            <div class="listing-meta-row">
              <span><i data-lucide="clock" style="width:14px;height:14px;"></i> ${item.ageInMonths} mos old</span>
              <span>•</span>
              <span><i data-lucide="user" style="width:14px;height:14px;"></i> ${this.escapeHtml(item.sellerName || 'Senior')}</span>
            </div>
            
            <div class="listing-price-box">
              <div>
                <span class="price-main">₹${sell.toLocaleString('en-IN')}</span>
                ${orig > sell ? `<span class="price-original">₹${orig.toLocaleString('en-IN')}</span>` : ''}
              </div>
              ${discount > 0 ? `<span class="discount-tag">-${discount}% OFF</span>` : ''}
            </div>

            <div class="listing-footer-actions">
              <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="App.openListingModal(${item.id})">
                <i data-lucide="eye" style="width:14px;height:14px;"></i> View Details
              </button>
              <button class="btn btn-primary btn-sm" onclick="App.openContactModal(${item.id})">
                <i data-lucide="message-circle" style="width:14px;height:14px;"></i> Contact
              </button>
              <button class="btn btn-secondary btn-sm btn-icon" title="Remove Listing" onclick="App.confirmDeleteListing(${item.id})">
                <i data-lucide="trash-2" style="width:14px;height:14px; color:#ef4444;"></i>
              </button>
            </div>
          </div>
        </div>
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

    // Category pills
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
      debounceTimer = setTimeout(() => this.executeSearch(), 300);
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

      // Client-side sorting
      results.sort((a, b) => {
        if (sortBy === 'price-asc') return parseFloat(a.sellingPrice) - parseFloat(b.sellingPrice);
        if (sortBy === 'price-desc') return parseFloat(b.sellingPrice) - parseFloat(a.sellingPrice);
        if (sortBy === 'age-asc') return parseInt(a.ageInMonths) - parseInt(b.ageInMonths);
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

    // Judge Demonstration quick fill scenario button
    demoJudgeBtn?.addEventListener('click', () => {
      document.getElementById('sellItemName').value = 'Scientific Calculator fx-991ES';
      document.getElementById('sellCategory').value = 'Calculators';
      document.getElementById('sellCondition').value = 'Good';
      document.getElementById('sellAge').value = '24';
      document.getElementById('sellOriginalPrice').value = '1200';
      document.getElementById('sellDescription').value = 'Used for 2 academic years in mechanical engineering. Working flawlessly with solar cell.';
      document.getElementById('sellSellerName').value = 'Rachit Sharma (EE Final Yr)';
      document.getElementById('sellContact').value = 'rachit.ee@campus.edu';
      
      this.showToast('⚡ Judge scenario prefilled! Click "Get Fair Price".', 'info');
    });

    // Step 1: Calculate Suggested Price
    calcPriceBtn?.addEventListener('click', async (e) => {
      e.preventDefault();
      const itemName = document.getElementById('sellItemName').value.trim();
      const category = document.getElementById('sellCategory').value;
      const condition = document.getElementById('sellCondition').value;
      const ageInMonths = document.getElementById('sellAge').value;
      const originalPrice = document.getElementById('sellOriginalPrice').value;

      if (!itemName || !category || !condition || !ageInMonths || !originalPrice) {
        this.showToast('Please fill out all required item fields first.', 'error');
        return;
      }

      try {
        calcPriceBtn.disabled = true;
        calcPriceBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Analyzing 200+ Transactions...';
        if (window.lucide) window.lucide.createIcons();

        const result = await Api.suggestPricing({
          itemName,
          category,
          condition,
          ageInMonths: parseInt(ageInMonths, 10),
          originalPrice: parseFloat(originalPrice)
        });

        this.pricingSuggestion = result;
        this.displayPricingCard(result);
        this.showToast('✨ Fair market valuation calculated!', 'success');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        calcPriceBtn.disabled = false;
        calcPriceBtn.innerHTML = '<i data-lucide="sparkles"></i> Get Fair Price';
        if (window.lucide) window.lucide.createIcons();
      }
    });

    // One-click apply suggested price to input
    applySuggestedBtn?.addEventListener('click', () => {
      if (this.pricingSuggestion) {
        document.getElementById('sellSellingPrice').value = this.pricingSuggestion.suggestedPrice;
        this.showToast(`Set price to recommended ₹${this.pricingSuggestion.suggestedPrice}`, 'info');
      }
    });

    // Step 2 & 3: Publish Listing to MySQL
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
        publishBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Publishing to ReLoop...';
        if (window.lucide) window.lucide.createIcons();

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

        this.showToast(`🎉 Listing "${newListing.itemName}" published successfully!`, 'success');

        // Reset form
        sellForm.reset();
        document.getElementById('pricingResultCard').style.display = 'none';
        this.pricingSuggestion = null;

        // Switch to Marketplace view immediately to show the item live!
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
    const priceDisplay = document.getElementById('cardSuggestedPrice');
    const rangeDisplay = document.getElementById('cardPriceRange');
    const deprecDisplay = document.getElementById('cardDepreciation');
    const retentionDisplay = document.getElementById('cardRetention');
    const compsDisplay = document.getElementById('cardComparableCount');
    const explanationDisplay = document.getElementById('cardExplanation');
    const meterFill = document.getElementById('cardPriceMeterFill');

    priceDisplay.innerText = `₹${res.suggestedPrice.toLocaleString('en-IN')}`;
    rangeDisplay.innerText = `₹${res.minimumPrice.toLocaleString('en-IN')} - ₹${res.maximumPrice.toLocaleString('en-IN')}`;
    deprecDisplay.innerText = `${res.depreciationPercentage}% Depreciation`;
    retentionDisplay.innerText = `${res.retentionPercentage}% Value Retained`;
    compsDisplay.innerText = `${res.comparableTransactions} Comparable Sales`;
    explanationDisplay.innerText = res.explanation;

    // Fill selling price input automatically
    const sellingPriceInput = document.getElementById('sellSellingPrice');
    if (sellingPriceInput && (!sellingPriceInput.value || sellingPriceInput.value == '0')) {
      sellingPriceInput.value = res.suggestedPrice;
    }

    // Set visual meter percentage
    if (meterFill) {
      meterFill.style.width = `${Math.min(100, Math.max(15, res.retentionPercentage))}%`;
    }

    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.lucide) window.lucide.createIcons();
  },

  // ------------------------------------------------------------------------
  // PRICING INSIGHTS & ANALYTICS DASHBOARD
  // ------------------------------------------------------------------------
  async loadInsights() {
    try {
      const insights = await Api.getPricingInsights();

      // Update stat cards
      document.getElementById('statTotalTransactions').innerText = insights.totalHistoricalTransactions || 200;
      document.getElementById('statAvgResale').innerText = `${insights.averageResalePercentage}%`;
      document.getElementById('statAvgDeprec').innerText = `${insights.averageDepreciation}%`;
      
      if (insights.bestValueRetainingCategory) {
        document.getElementById('statBestCategory').innerText = insights.bestValueRetainingCategory.category;
        document.getElementById('statBestCategorySub').innerText = `${insights.bestValueRetainingCategory.avgResalePercent}% Avg Retention`;
      }

      if (insights.highestDepreciatingCategory) {
        document.getElementById('statWorstCategory').innerText = insights.highestDepreciatingCategory.category;
        document.getElementById('statWorstCategorySub').innerText = `${insights.highestDepreciatingCategory.avgDepreciation}% Avg Depreciation`;
      }

      // Render Chart.js graphs
      ChartManager.renderAllInsights(insights);
    } catch (err) {
      this.showToast('Failed to load insights: ' + err.message, 'error');
    }
  },

  // ------------------------------------------------------------------------
  // WANTED BOARD
  // ------------------------------------------------------------------------
  async loadWanted() {
    const grid = document.getElementById('wantedGrid');
    const emptyState = document.getElementById('wantedEmptyState');

    try {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><p>Loading student requests...</p></div>';

      const requests = await Api.getAllWanted();
      if (!requests || requests.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      grid.style.display = 'grid';

      grid.innerHTML = requests.map(w => `
        <div class="wanted-card">
          <div class="wanted-top-row">
            <span class="badge-category" style="position:static;">${w.category}</span>
            <span class="wanted-budget-badge">Max Budget: ₹${parseFloat(w.maxBudget).toLocaleString('en-IN')}</span>
          </div>
          <h3 class="wanted-title">${this.escapeHtml(w.itemName)}</h3>
          <p class="wanted-desc">${this.escapeHtml(w.description || 'No additional notes provided.')}</p>
          <div class="wanted-user-footer">
            <span><i data-lucide="user" style="width:14px;height:14px; display:inline;"></i> ${this.escapeHtml(w.requestedBy)}</span>
            <button class="btn btn-primary btn-sm" onclick="App.contactWantedRequester('${this.escapeHtml(w.contactInfo)}', '${this.escapeHtml(w.itemName)}')">
              <i data-lucide="send" style="width:13px;height:13px;"></i> Offer Item
            </button>
          </div>
        </div>
      `).join('');

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

        this.showToast('Wanted request posted to board!', 'success');
        form.reset();
        this.closeModal('wantedModal');
        this.loadWanted();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  contactWantedRequester(contact, itemTitle) {
    alert(`Campus Seller Match!\n\nTo fulfill this wanted request for "${itemTitle}", contact the junior student at:\n\nEmail / Hostel: ${contact}`);
  },

  // ------------------------------------------------------------------------
  // MODALS & ACTIONS
  // ------------------------------------------------------------------------
  bindModals() {
    // Generic modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    // Close on outside click
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
        <img src="${item.imageUrl || ''}" style="width:100%; height:260px; object-fit:cover; border-radius:12px;" />
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span class="badge-category" style="position:static; margin-bottom:6px; display:inline-block;">${item.category}</span>
            <h2 style="font-size:1.4rem; font-weight:800; color:#0f2d1e;">${this.escapeHtml(item.itemName)}</h2>
          </div>
          <span class="badge-condition ${item.condition.replace(/\s+/g,'')}" style="position:static;">${item.condition}</span>
        </div>

        <div style="background:#f4f6f3; padding:16px; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.8rem; color:#6b7280;">Selling Price</div>
            <div style="font-size:1.8rem; font-weight:800; color:#143d2b;">₹${sell.toLocaleString('en-IN')}</div>
          </div>
          ${orig > sell ? `
            <div style="text-align:right;">
              <div style="font-size:0.8rem; color:#6b7280;">Original Price: <span style="text-decoration:line-through;">₹${orig.toLocaleString('en-IN')}</span></div>
              <span class="discount-tag">Save ₹${(orig - sell).toLocaleString('en-IN')} (${discount}% off)</span>
            </div>
          ` : ''}
        </div>

        <div>
          <h4 style="font-weight:700; margin-bottom:6px;">Item Description</h4>
          <p style="color:#4b5563; font-size:0.92rem; line-height:1.6;">${this.escapeHtml(item.description || 'No description provided.')}</p>
        </div>

        <div style="border-top:1px solid #e5e7eb; padding-top:14px; display:flex; justify-content:space-between; font-size:0.86rem; color:#6b7280;">
          <span><strong>Age:</strong> ${item.ageInMonths} months</span>
          <span><strong>Seller:</strong> ${this.escapeHtml(item.sellerName || 'Campus Senior')}</span>
          <span><strong>Contact:</strong> ${this.escapeHtml(item.contactInfo || 'campus@college.edu')}</span>
        </div>
      </div>
    `;

    this.openModal('itemDetailModal');
  },

  openContactModal(id) {
    const item = this.allListings.find(l => l.id == id);
    if (!item) return;

    alert(`Contact Seller for "${item.itemName}":\n\nName: ${item.sellerName || 'Campus Senior'}\nEmail / Hostel: ${item.contactInfo || 'campus@college.edu'}\n\nPlease reach out directly for campus handover!`);
  },

  async confirmDeleteListing(id) {
    if (confirm('Are you sure you want to remove this listing from ReLoop?')) {
      try {
        await Api.deleteListing(id);
        this.showToast('Listing successfully deleted', 'info');
        this.loadMarketplace();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
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
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
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
