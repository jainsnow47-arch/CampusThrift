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
  currentType: 'All',
  currentUser: null,
  personas: [],
  allowedEmojis: ['🐼', '🍡', '🦊', '🐨', '🦦', '🍁', '🦉', '🐝', '🐢', '🌵', '🚀', '🎨'],
  allListings: [],
  pricingSuggestion: null,

  async init() {
    this.bindNavigation();
    this.bindAuth();
    this.bindSearchAndFilters();
    this.bindSellForm();
    this.bindWantedForm();
    this.bindModals();

    await this.bootstrapAuth();
    await this.loadMarketplace();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  // ------------------------------------------------------------------------
  // Pseudonymous Auth & Identity Chip
  // ------------------------------------------------------------------------
  async bootstrapAuth() {
    try {
      const personasRes = await Api.getPersonas();
      this.personas = personasRes.data || [];
      if (Array.isArray(personasRes.allowedEmojis) && personasRes.allowedEmojis.length) {
        this.allowedEmojis = personasRes.allowedEmojis;
      }

      let user = await Api.getCurrentUser();
      if (!user) {
        user = await Api.demoLogin('Panda_27');
      }
      this.setCurrentUser(user);
    } catch (err) {
      // Fallback display only if server unreachable; requests will retry
      this.renderIdentityChip();
    }
  },

  setCurrentUser(user) {
    this.currentUser = user;
    this.renderIdentityChip();
    this.renderPersonaModalState();
    // Pre-fill wanted requester handle if empty
    const wantedReq = document.getElementById('wantedRequester');
    const wantedContact = document.getElementById('wantedContact');
    if (user && wantedReq && !wantedReq.value) {
      wantedReq.value = `${user.handle} (${user.department || 'Demo'})`;
    }
    if (user && wantedContact && !wantedContact.value) {
      wantedContact.value = `${user.handle.toLowerCase()}@campus.example`;
    }
  },

  renderIdentityChip() {
    const emojiEl = document.getElementById('identityChipEmoji');
    const handleEl = document.getElementById('identityChipHandle');
    const sellPostingEl = document.getElementById('sellPostingAs');

    const emoji = this.currentUser?.avatarEmoji || '🐼';
    const handle = this.currentUser?.handle || 'Panda_27';

    if (emojiEl) emojiEl.innerText = emoji;
    if (handleEl) handleEl.innerText = handle;
    if (sellPostingEl) sellPostingEl.innerText = `${emoji} ${handle} (Demo)`;
  },

  bindAuth() {
    const chipBtn = document.getElementById('identityChipBtn');
    const randomBtn = document.getElementById('randomPersonaBtn');
    const profileForm = document.getElementById('saveProfileForm');

    chipBtn?.addEventListener('click', () => this.openAuthModal());

    randomBtn?.addEventListener('click', async () => {
      try {
        randomBtn.disabled = true;
        const user = await Api.demoLogin('');
        const personasRes = await Api.getPersonas();
        this.personas = personasRes.data || this.personas;
        this.setCurrentUser(user);
        this.renderListings(this.filterAndSortClientCache());
        this.showToast(`Switched to ${user.avatarEmoji} ${user.handle}`, 'success');
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        randomBtn.disabled = false;
      }
    });

    profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const handle = document.getElementById('profileHandleInput').value.trim();
      const department = document.getElementById('profileDeptInput').value.trim();
      const avatarEmoji = document.getElementById('profileEmojiInput').value;

      try {
        const updated = await Api.updateProfile({ handle, avatarEmoji, department });
        const personasRes = await Api.getPersonas();
        this.personas = personasRes.data || this.personas;
        this.setCurrentUser(updated);
        this.closeModal('authModal');
        await this.loadMarketplace();
        this.showToast(`Profile updated: ${updated.avatarEmoji} ${updated.handle}`, 'success');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  async openAuthModal() {
    try {
      const personasRes = await Api.getPersonas();
      this.personas = personasRes.data || this.personas;
      if (Array.isArray(personasRes.allowedEmojis)) {
        this.allowedEmojis = personasRes.allowedEmojis;
      }
    } catch {
      // keep existing cache
    }
    this.renderPersonaModalState();
    this.openModal('authModal');
  },

  renderPersonaModalState() {
    const listEl = document.getElementById('personaList');
    const emojiRow = document.getElementById('emojiPickerRow');
    const handleInput = document.getElementById('profileHandleInput');
    const deptInput = document.getElementById('profileDeptInput');
    const emojiInput = document.getElementById('profileEmojiInput');

    if (listEl) {
      listEl.innerHTML = (this.personas || [])
        .slice(0, 8)
        .map((p) => {
          const isActive = this.currentUser && this.currentUser.id === p.id;
          return `
            <button type="button" class="persona-btn ${isActive ? 'active' : ''}" data-persona-handle="${this.escapeHtml(p.handle)}">
              <span style="font-size:1.35rem;">${this.escapeHtml(p.avatarEmoji)}</span>
              <span>
                <strong style="display:block; font-size:0.86rem;">${this.escapeHtml(p.handle)}</strong>
                <span style="font-size:0.72rem; color:var(--ink-muted);">${this.escapeHtml(p.department || 'Demo')}</span>
              </span>
            </button>
          `;
        })
        .join('');

      listEl.querySelectorAll('[data-persona-handle]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const handle = btn.getAttribute('data-persona-handle');
          try {
            const user = await Api.demoLogin(handle);
            this.setCurrentUser(user);
            this.renderListings(this.filterAndSortClientCache());
            this.showToast(`Active persona: ${user.avatarEmoji} ${user.handle}`, 'info');
          } catch (err) {
            this.showToast(err.message, 'error');
          }
        });
      });
    }

    if (handleInput && this.currentUser) handleInput.value = this.currentUser.handle || '';
    if (deptInput && this.currentUser) deptInput.value = this.currentUser.department || '';
    const activeEmoji = this.currentUser?.avatarEmoji || '🐼';
    if (emojiInput) emojiInput.value = activeEmoji;

    if (emojiRow) {
      emojiRow.innerHTML = this.allowedEmojis
        .map(
          (em) => `
            <button type="button" class="emoji-choice ${em === activeEmoji ? 'active' : ''}" data-emoji="${em}" aria-label="Choose ${em}">
              ${em}
            </button>
          `
        )
        .join('');

      emojiRow.querySelectorAll('.emoji-choice').forEach((btn) => {
        btn.addEventListener('click', () => {
          const chosen = btn.getAttribute('data-emoji');
          if (emojiInput) emojiInput.value = chosen;
          emojiRow.querySelectorAll('.emoji-choice').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    }
  },

  // ------------------------------------------------------------------------
  // Navigation & View Toggling
  // ------------------------------------------------------------------------
  bindNavigation() {
    const navButtons = document.querySelectorAll('[data-view-target]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = btn.getAttribute('data-view-target');
        this.switchView(targetView);
      });
    });

    document.getElementById('backToMarketplaceBtn')?.addEventListener('click', () => {
      this.switchView('marketplace');
    });
  },

  switchView(viewName) {
    document.querySelectorAll('.app-view').forEach((view) => {
      view.style.display = 'none';
    });

    const targetElement = document.getElementById(`${viewName}-view`);
    if (targetElement) {
      targetElement.style.display = 'block';
    }

    document.querySelectorAll('[data-view-target]').forEach((btn) => {
      if (btn.getAttribute('data-view-target') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'marketplace') {
      this.executeSearch();
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
      grid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon">⏳</div><h3 class="empty-state-title">Loading Campus Listings...</h3></div>';
      const listings = await Api.getAllListings();
      this.allListings = listings;
      this.renderListings(this.filterAndSortClientCache());
    } catch (err) {
      this.showToast(err.message, 'error');
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon bg-coral">⚠️</div><h3 class="empty-state-title">Could Not Load Listings</h3><p class="empty-state-desc">${this.escapeHtml(err.message)}</p><button class="btn btn-yellow btn-sm" onclick="App.loadMarketplace()">Retry</button></div>`;
    }
  },

  filterAndSortClientCache() {
    const sortBy = document.getElementById('sortFilter')?.value || 'newest';
    const copy = [...this.allListings];
    copy.sort((a, b) => {
      const priceA = a.transactionType === 'RENT' ? parseFloat(a.rentalPricePerDay || 0) : parseFloat(a.sellingPrice || 0);
      const priceB = b.transactionType === 'RENT' ? parseFloat(b.rentalPricePerDay || 0) : parseFloat(b.sellingPrice || 0);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'age-asc') return parseInt(a.ageInMonths, 10) - parseInt(b.ageInMonths, 10);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return copy;
  },

  renderPriceSummaryHtml(item) {
    const type = item.transactionType || 'SELL';
    const orig = parseFloat(item.originalPrice || 0);
    const sell = parseFloat(item.sellingPrice || 0);

    if (type === 'SWAP') {
      return `
        <div>
          <span class="price-main" style="font-size:1.08rem;">OPEN TO SWAP</span>
          <div style="font-size:0.74rem; color:var(--ink-muted); font-weight:600;">Wants: ${this.escapeHtml((item.swapFor || 'Campus items').slice(0, 34))}</div>
        </div>
        <span class="discount-tag bg-purple" style="color:#FFFFFF;">Trade</span>
      `;
    }

    if (type === 'BORROW') {
      const maxD = item.maxDurationDays ? `Up to ${item.maxDurationDays}d` : 'Flexible';
      return `
        <div>
          <span class="price-main" style="font-size:1.15rem;">FREE BORROW</span>
          <div style="font-size:0.74rem; color:var(--ink-muted); font-weight:600;">${this.escapeHtml(maxD)}${item.refundableDeposit > 0 ? ` · ₹${item.refundableDeposit} dep` : ''}</div>
        </div>
        <span class="discount-tag bg-teal">₹0</span>
      `;
    }

    if (type === 'RENT') {
      const rate = parseFloat(item.rentalPricePerDay || item.sellingPrice || 0);
      const daysText = item.minDurationDays && item.maxDurationDays ? `${item.minDurationDays}-${item.maxDurationDays}d` : 'Daily';
      return `
        <div>
          <span class="price-main">₹${rate.toLocaleString('en-IN')}<span style="font-size:0.82rem; font-weight:700;">/day</span></span>
          <div style="font-size:0.74rem; color:var(--ink-muted); font-weight:600;">Term: ${this.escapeHtml(daysText)}</div>
        </div>
        <span class="discount-tag bg-peach">Rent</span>
      `;
    }

    const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
    return `
      <div>
        <span class="price-main">₹${sell.toLocaleString('en-IN')}</span>
        ${orig > sell ? `<span class="price-original">₹${orig.toLocaleString('en-IN')}</span>` : ''}
      </div>
      ${discount > 0 ? `<span class="discount-tag">-${discount}%</span>` : ''}
    `;
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

    grid.innerHTML = listings
      .map((item) => {
        const type = item.transactionType || 'SELL';
        const condClass = item.condition ? item.condition.replace(/\s+/g, '') : 'Good';
        const mascot = item.littleLoop || { emoji: '✨', message: 'Ready for a new campus owner!' };
        const isOwner = this.currentUser && item.sellerId && Number(item.sellerId) === Number(this.currentUser.id);

        return `
          <article class="listing-card" data-id="${item.id}">
            <div class="listing-thumb-container" style="cursor:pointer;" onclick="App.openListingDetail(${item.id})">
              <img src="${this.escapeHtml(item.imageUrl)}" alt="${this.escapeHtml(item.itemName)}" class="listing-thumb" loading="lazy">
              <span class="badge-type badge-type-${this.escapeHtml(type)}">${this.escapeHtml(type)}</span>
              <span class="badge-condition ${condClass}">${this.escapeHtml(item.condition)}</span>
            </div>
            <div class="listing-body">
              <div class="listing-cat-line">${this.escapeHtml(item.category)} · ${item.ageInMonths} mos old</div>
              <h3 class="listing-title" style="cursor:pointer;" onclick="App.openListingDetail(${item.id})" title="${this.escapeHtml(item.itemName)}">${this.escapeHtml(item.itemName)}</h3>
              <div class="listing-meta-row">
                By ${this.escapeHtml(item.sellerName || 'Panda_27 🐼')} · ${this.escapeHtml(item.availabilityStatus || 'AVAILABLE')}
              </div>

              <div class="little-loop-mini">
                <span style="font-size:1.05rem; flex-shrink:0;">${this.escapeHtml(mascot.emoji)}</span>
                <span>“${this.escapeHtml(mascot.message)}”</span>
              </div>

              <div class="listing-price-box">
                ${this.renderPriceSummaryHtml(item)}
              </div>

              <div class="listing-footer-actions">
                <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="App.openListingDetail(${item.id})">
                  View Details
                </button>
                <button class="btn btn-yellow btn-sm" onclick="App.openContactToast(${item.id})">
                  Handle
                </button>
                ${
                  isOwner
                    ? `<button class="btn btn-secondary btn-sm btn-icon" title="Remove My Listing" aria-label="Remove My Listing" onclick="App.confirmDeleteListing(${item.id})">
                         <i data-lucide="trash-2" style="width:15px;height:15px;color:#F25F5C;"></i>
                       </button>`
                    : ''
                }
              </div>
            </div>
          </article>
        `;
      })
      .join('');

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
    catPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        catPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.getAttribute('data-category');
        this.executeSearch();
      });
    });

    const typeBtns = document.querySelectorAll('.type-filter-btn');
    typeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        typeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentType = btn.getAttribute('data-type');
        this.executeSearch();
      });
    });

    let debounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => this.executeSearch(), 260);
    });

    conditionFilter?.addEventListener('change', () => this.executeSearch());
    sortFilter?.addEventListener('change', () => this.renderListings(this.filterAndSortClientCache()));
    applyPriceBtn?.addEventListener('click', () => this.executeSearch());

    resetFiltersBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (conditionFilter) conditionFilter.value = 'All';
      if (sortFilter) sortFilter.value = 'newest';
      if (minPriceInput) minPriceInput.value = '';
      if (maxPriceInput) maxPriceInput.value = '';
      catPills.forEach((p) => p.classList.remove('active'));
      catPills[0]?.classList.add('active');
      typeBtns.forEach((b) => b.classList.remove('active'));
      typeBtns[0]?.classList.add('active');
      this.currentCategory = 'All';
      this.currentType = 'All';
      this.executeSearch();
    });
  },

  async executeSearch() {
    const keyword = document.getElementById('searchInput')?.value || '';
    const condition = document.getElementById('conditionFilter')?.value || 'All';
    const minPrice = document.getElementById('minPriceInput')?.value || '';
    const maxPrice = document.getElementById('maxPriceInput')?.value || '';

    try {
      const results = await Api.searchListings({
        category: this.currentCategory,
        condition,
        transactionType: this.currentType,
        minPrice,
        maxPrice,
        keyword
      });
      this.allListings = results;
      this.renderListings(this.filterAndSortClientCache());
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // ------------------------------------------------------------------------
  // LISTING DETAIL VIEW (Ref 4: 4 Numbered Boxes + Little Loops Speech Bubble)
  // ------------------------------------------------------------------------
  async openListingDetail(id) {
    try {
      const item = await Api.getListingById(id);
      const container = document.getElementById('detailContent');
      const idTag = document.getElementById('detailListingIdTag');
      if (idTag) idTag.innerText = `Listing #${item.id} · ${item.transactionType}`;

      const mascot = item.littleLoop || { emoji: '✨', name: 'Little Loop', message: 'Ready for campus!' };
      const seller = item.sellerProfile || { handle: item.sellerName || 'Panda_27', avatarEmoji: '🐼', department: 'Campus Student (Demo)', isDemo: true, isVerified: false };
      const isOwner = this.currentUser && item.sellerId && Number(item.sellerId) === Number(this.currentUser.id);
      const type = item.transactionType || 'SELL';

      let box2Html = '';
      if (type === 'SELL') {
        const orig = parseFloat(item.originalPrice || 0);
        const sell = parseFloat(item.sellingPrice || 0);
        const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
        box2Html = `
          <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:14px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; color:var(--ink-muted);">ASKING PRICE</div>
              <div style="font-size:2.2rem; font-weight:800; line-height:1.1;" class="tabular-nums">₹${sell.toLocaleString('en-IN')}</div>
            </div>
            ${discount > 0 ? `<span class="tag bg-teal">Save ${discount}% off ₹${orig.toLocaleString('en-IN')}</span>` : ''}
          </div>
          ${
            item.suggestedPrice
              ? `<div class="pricing-explanation-box" style="margin-bottom:12px;">
                   <strong>Engine Fair Price Reference:</strong> ₹${Number(item.suggestedPrice).toLocaleString('en-IN')} based on 200 historical campus transactions.
                 </div>`
              : ''
          }
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <span class="chip ${item.willingToNegotiate ? 'bg-mint' : 'bg-peach'}">
              ${item.willingToNegotiate ? 'Open to Fair Offers' : 'Fixed Asking Price'}
            </span>
            <span class="chip bg-yellow">₹0 Platform Fees</span>
          </div>
        `;
      } else if (type === 'SWAP') {
        box2Html = `
          <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; color:var(--ink-muted); margin-bottom:4px;">WANTED IN EXCHANGE</div>
          <div style="font-size:1.25rem; font-weight:800; margin-bottom:12px;">${this.escapeHtml(item.swapFor || 'Open to campus offers')}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <span class="chip ${item.allowMultipleSwaps ? 'bg-mint' : 'bg-peach'}">
              ${item.allowMultipleSwaps ? 'Accepts Multiple Swap Ideas' : 'Exact Item Swap Preferred'}
            </span>
            <span class="chip bg-yellow">Original Retail: ₹${Number(item.originalPrice).toLocaleString('en-IN')}</span>
          </div>
        `;
      } else if (type === 'BORROW') {
        const minD = item.minDurationDays || 1;
        const maxD = item.maxDurationDays || 7;
        box2Html = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; color:var(--ink-muted);">BORROW FEE</div>
              <div style="font-size:2rem; font-weight:800;">FREE (₹0)</div>
            </div>
            <span class="tag bg-mint">${minD} – ${maxD} Days</span>
          </div>
          <p style="font-size:0.88rem; margin-bottom:8px;"><strong>Collection Spot:</strong> ${this.escapeHtml(item.collectionLocation || 'Campus Library')}</p>
          <p style="font-size:0.88rem; margin-bottom:8px;"><strong>Refundable Deposit:</strong> ${item.refundableDeposit > 0 ? `₹${Number(item.refundableDeposit).toLocaleString('en-IN')}` : 'None required'}</p>
          ${item.specialConditions ? `<p style="font-size:0.86rem; color:var(--ink-muted);"><strong>Conditions:</strong> ${this.escapeHtml(item.specialConditions)}</p>` : ''}
        `;
      } else {
        const minD = item.minDurationDays || 1;
        const maxD = item.maxDurationDays || 14;
        const rate = Number(item.rentalPricePerDay || item.sellingPrice || 0);
        box2Html = `
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; color:var(--ink-muted);">RENTAL RATE</div>
              <div style="font-size:2rem; font-weight:800;" class="tabular-nums">₹${rate.toLocaleString('en-IN')} <span style="font-size:0.95rem;">/ day</span></div>
            </div>
            <span class="tag bg-peach">${minD} – ${maxD} Days</span>
          </div>
          <p style="font-size:0.88rem; margin-bottom:8px;"><strong>Collection Spot:</strong> ${this.escapeHtml(item.collectionLocation || 'Campus Quad')}</p>
          <p style="font-size:0.88rem; margin-bottom:8px;"><strong>Refundable Deposit:</strong> ${item.refundableDeposit > 0 ? `₹${Number(item.refundableDeposit).toLocaleString('en-IN')}` : 'None required'}</p>
          ${item.specialConditions ? `<p style="font-size:0.86rem; color:var(--ink-muted);"><strong>Rental Terms:</strong> ${this.escapeHtml(item.specialConditions)}</p>` : ''}
        `;
      }

      container.innerHTML = `
        <div class="sell-yellow-banner" style="margin-bottom:18px;">
          <div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
              <span class="tag badge-type-${this.escapeHtml(type)}">${this.escapeHtml(type)}</span>
              <span class="tag bg-mint">${this.escapeHtml(item.condition)}</span>
              <span class="tag">${this.escapeHtml(item.availabilityStatus || 'AVAILABLE')}</span>
            </div>
            <h2>${this.escapeHtml(item.itemName)}</h2>
            <p>${this.escapeHtml(item.category)} · ${item.ageInMonths} months owned</p>
          </div>
        </div>

        <!-- Little Loops Mascot Speech Bubble -->
        <div class="little-loop-bubble">
          <div class="little-loop-avatar">${this.escapeHtml(mascot.emoji)}</div>
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <strong style="font-size:0.94rem;">${this.escapeHtml(mascot.name)}</strong>
              <span class="demo-micro-tag">Little Loops</span>
            </div>
            <p style="font-size:0.92rem; line-height:1.45;">“${this.escapeHtml(mascot.message)}”</p>
          </div>
        </div>

        <!-- 4 Numbered Boxes (Ref 4) -->
        <div class="detail-grid-2">
          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-mint">
              <div class="numbered-section-title">
                <span class="num-pill">1</span>
                <span>Item</span>
              </div>
              <span class="tag">${this.escapeHtml(item.category)}</span>
            </div>
            <div class="numbered-section-body">
              <img src="${this.escapeHtml(item.imageUrl)}" alt="${this.escapeHtml(item.itemName)}" style="width:100%; height:210px; object-fit:cover; border-radius:10px; border:2.5px solid #111111; margin-bottom:14px;">
              <p style="font-size:0.92rem; line-height:1.55; margin-bottom:12px;">${this.escapeHtml(item.description || 'Well-kept campus essential ready for its next semester.')}</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap; font-family:var(--font-mono); font-size:0.75rem;">
                <span class="tag">Original: ₹${Number(item.originalPrice).toLocaleString('en-IN')}</span>
                <span class="tag">Age: ${item.ageInMonths} mos</span>
              </div>
            </div>
          </div>

          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-yellow">
              <div class="numbered-section-title">
                <span class="num-pill">2</span>
                <span>Price &amp; Why</span>
              </div>
              <span class="tag">${this.escapeHtml(type)}</span>
            </div>
            <div class="numbered-section-body">
              ${box2Html}
            </div>
          </div>
        </div>

        <div class="detail-grid-2" style="margin-bottom:0;">
          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-pink">
              <div class="numbered-section-title">
                <span class="num-pill">3</span>
                <span>Seller</span>
              </div>
              <span class="tag">${seller.isVerified ? 'Campus Verified' : 'Demo Profile'}</span>
            </div>
            <div class="numbered-section-body">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                <div class="wanted-emoji-avatar" style="background:var(--yellow);">${this.escapeHtml(seller.avatarEmoji || '🐼')}</div>
                <div>
                  <strong style="font-size:1.05rem; display:block;">${this.escapeHtml(seller.handle)}</strong>
                  <span style="font-size:0.84rem; color:var(--ink-muted);">${this.escapeHtml(seller.department || 'Campus Student (Demo)')}</span>
                </div>
              </div>
              <p style="font-size:0.82rem; color:var(--ink-muted);">
                Pseudonymous campus identity protects student privacy—real names and private reserve prices are never exposed.
              </p>
            </div>
          </div>

          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-purple">
              <div class="numbered-section-title">
                <span class="num-pill">4</span>
                <span>Request / Offer</span>
              </div>
              <span class="tag" style="color:#111111;">Campus Handover</span>
            </div>
            <div class="numbered-section-body">
              <p style="font-size:0.88rem; margin-bottom:14px;">
                Status: <strong>${this.escapeHtml(item.availabilityStatus || 'AVAILABLE')}</strong>. Reach out using the student’s pseudonymous campus handle to coordinate a safe in-person meetup.
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button type="button" class="btn btn-yellow btn-sm" onclick="App.copyCampusHandle('${this.escapeHtml(seller.handle)}')">
                  <i data-lucide="copy" style="width:14px;height:14px;"></i> Copy Handle (${this.escapeHtml(seller.handle)})
                </button>
                ${
                  isOwner
                    ? `<button type="button" class="btn btn-coral btn-sm" onclick="App.confirmDeleteListing(${item.id}, true)">
                         <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Remove Listing
                       </button>`
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      `;

      this.switchView('detail');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  copyCampusHandle(handle) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(handle).catch(() => {});
    }
    this.showToast(`Campus handle "${handle}" ready—reach out via campus board!`, 'info');
  },

  openContactToast(id) {
    const item = this.allListings.find((l) => l.id == id);
    if (!item) return;
    const handle = item.sellerProfile?.handle || item.sellerName || 'Panda_27';
    this.copyCampusHandle(handle);
  },

  // ------------------------------------------------------------------------
  // UNIFIED LISTING CREATION (SELL / SWAP / BORROW / RENT) + PRICING ENGINE
  // ------------------------------------------------------------------------
  setActiveListingType(type) {
    const hidden = document.getElementById('sellTransactionType');
    if (hidden) hidden.value = type;

    document.querySelectorAll('.plan-card[data-plan-type]').forEach((card) => {
      const active = card.getAttribute('data-plan-type') === type;
      card.classList.toggle('active', active);
      card.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    const blocks = {
      SELL: document.getElementById('sellTypeFields'),
      SWAP: document.getElementById('swapTypeFields'),
      BORROW: document.getElementById('borrowTypeFields'),
      RENT: document.getElementById('rentTypeFields')
    };

    Object.entries(blocks).forEach(([key, el]) => {
      if (el) el.style.display = key === type ? 'block' : 'none';
    });

    const headings = {
      SELL: 'Price & Negotiation Details',
      SWAP: 'Swap Preferences',
      BORROW: 'Free Borrowing Terms',
      RENT: 'Rental Rate & Terms'
    };

    const headingEl = document.getElementById('panel3Heading');
    const tagEl = document.getElementById('panel3TypeTag');
    if (headingEl) headingEl.innerText = headings[type] || 'Listing Details';
    if (tagEl) tagEl.innerText = `${type} MODE`;
  },

  bindSellForm() {
    const sellForm = document.getElementById('sellItemForm');
    const calcPriceBtn = document.getElementById('calculatePriceBtn');
    const publishBtn = document.getElementById('publishListingBtn');
    const demoJudgeBtn = document.getElementById('demoJudgeScenarioBtn');
    const applySuggestedBtn = document.getElementById('applySuggestedPriceBtn');

    document.querySelectorAll('.plan-card[data-plan-type]').forEach((card) => {
      card.addEventListener('click', () => {
        this.setActiveListingType(card.getAttribute('data-plan-type'));
      });
    });

    demoJudgeBtn?.addEventListener('click', () => {
      this.setActiveListingType('SELL');
      document.getElementById('sellItemName').value = 'Scientific Calculator fx-991ES';
      document.getElementById('sellCategory').value = 'Calculators';
      document.getElementById('sellCondition').value = 'Good';
      document.getElementById('sellAge').value = '24';
      document.getElementById('sellOriginalPrice').value = '1200';
      document.getElementById('sellDescription').value =
        'Used for 2 academic years in mechanical engineering. Working flawlessly with solar cell.';

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
      const transactionType = document.getElementById('sellTransactionType').value || 'SELL';
      const itemName = document.getElementById('sellItemName').value.trim();
      const category = document.getElementById('sellCategory').value;
      const condition = document.getElementById('sellCondition').value;
      const ageInMonths = parseInt(document.getElementById('sellAge').value, 10);
      const originalPrice = parseFloat(document.getElementById('sellOriginalPrice').value);
      const description = document.getElementById('sellDescription').value.trim();
      const imageUrl = document.getElementById('sellImageUrl').value.trim();

      const payload = {
        transactionType,
        itemName,
        category,
        condition,
        ageInMonths,
        originalPrice,
        description,
        imageUrl
      };

      if (transactionType === 'SELL') {
        const sellingPrice = parseFloat(document.getElementById('sellSellingPrice').value);
        const minRaw = document.getElementById('sellMinPrice').value;
        if (!sellingPrice || sellingPrice <= 0) {
          this.showToast('Please enter a valid asking price.', 'error');
          return;
        }
        payload.suggestedPrice = this.pricingSuggestion ? this.pricingSuggestion.suggestedPrice : null;
        payload.sellingPrice = sellingPrice;
        payload.minAcceptablePrice = minRaw !== '' ? parseFloat(minRaw) : null;
        payload.willingToNegotiate = document.getElementById('sellNegotiate').checked;
      } else if (transactionType === 'SWAP') {
        const swapFor = document.getElementById('sellSwapFor').value.trim();
        if (!swapFor) {
          this.showToast('Please specify what items you would like to swap for.', 'error');
          return;
        }
        payload.swapFor = swapFor;
        payload.allowMultipleSwaps = document.getElementById('sellMultiSwap').checked;
      } else if (transactionType === 'BORROW') {
        const location = document.getElementById('sellBorrowLocation').value.trim();
        if (!location) {
          this.showToast('Please specify a campus collection location.', 'error');
          return;
        }
        payload.minDurationDays = parseInt(document.getElementById('sellBorrowMinDays').value || '1', 10);
        payload.maxDurationDays = parseInt(document.getElementById('sellBorrowMaxDays').value || '7', 10);
        payload.collectionLocation = location;
        payload.refundableDeposit = parseFloat(document.getElementById('sellBorrowDeposit').value || '0');
        payload.specialConditions = document.getElementById('sellBorrowConditions').value.trim();
      } else if (transactionType === 'RENT') {
        const rate = parseFloat(document.getElementById('sellRentPerDay').value);
        const location = document.getElementById('sellRentLocation').value.trim();
        if (!rate || rate <= 0) {
          this.showToast('Please specify a valid daily rental rate.', 'error');
          return;
        }
        if (!location) {
          this.showToast('Please specify a campus collection location.', 'error');
          return;
        }
        payload.rentalPricePerDay = rate;
        payload.minDurationDays = parseInt(document.getElementById('sellRentMinDays').value || '1', 10);
        payload.maxDurationDays = parseInt(document.getElementById('sellRentMaxDays').value || '14', 10);
        payload.refundableDeposit = parseFloat(document.getElementById('sellRentDeposit').value || '0');
        payload.collectionLocation = location;
        payload.specialConditions = document.getElementById('sellRentConditions').value.trim();
      }

      try {
        publishBtn.disabled = true;
        publishBtn.innerHTML = 'Publishing Listing...';

        const newListing = await Api.createListing(payload);

        this.showToast(`${newListing.transactionType} listing "${newListing.itemName}" published!`, 'success');
        sellForm.reset();
        this.setActiveListingType('SELL');
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

      grid.innerHTML = requests
        .map((w, idx) => {
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
        })
        .join('');

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
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-overlay').forEach((modal) => {
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

  async confirmDeleteListing(id, returnToMarketplace = false) {
    try {
      await Api.deleteListing(id);
      this.showToast('Listing removed', 'info');
      if (returnToMarketplace) {
        this.switchView('marketplace');
      } else {
        this.executeSearch();
      }
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
