// Campus Thrift Application Controller

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

const CATEGORY_FALLBACK_SVG = {
  Calculators:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#BFE8C9"/><rect x="135" y="28" width="130" height="184" rx="14" fill="#111111"/><rect x="148" y="42" width="104" height="40" rx="6" fill="#FFC93C"/><text x="242" y="70" font-family="monospace" font-size="18" font-weight="bold" fill="#111111" text-anchor="end">sin(x)</text><g fill="#FFFDF8"><rect x="150" y="96" width="20" height="18" rx="4"/><rect x="176" y="96" width="20" height="18" rx="4"/><rect x="202" y="96" width="20" height="18" rx="4"/><rect x="228" y="96" width="20" height="18" rx="4"/><rect x="150" y="122" width="20" height="18" rx="4"/><rect x="176" y="122" width="20" height="18" rx="4"/><rect x="202" y="122" width="20" height="18" rx="4"/><rect x="228" y="122" width="20" height="18" rx="4"/><rect x="150" y="148" width="20" height="18" rx="4"/><rect x="176" y="148" width="20" height="18" rx="4"/><rect x="202" y="148" width="20" height="18" rx="4"/><rect x="228" y="148" width="20" height="44" rx="4" fill="#3CC4B3"/><rect x="150" y="174" width="46" height="18" rx="4"/><rect x="202" y="174" width="20" height="18" rx="4"/></g></svg>`
    ),
  Books:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#FFC93C"/><rect x="92" y="140" width="216" height="36" rx="8" fill="#FFFDF8" stroke="#111111" stroke-width="5"/><rect x="108" y="100" width="184" height="36" rx="8" fill="#3CC4B3" stroke="#111111" stroke-width="5"/><rect x="124" y="60" width="152" height="36" rx="8" fill="#9B7BEA" stroke="#111111" stroke-width="5"/><rect x="145" y="72" width="90" height="10" rx="4" fill="#FFFDF8"/></svg>`
    ),
  Cycles:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#4C9BE8"/><circle cx="120" cy="155" r="44" fill="#FFFDF8" stroke="#111111" stroke-width="8"/><circle cx="280" cy="155" r="44" fill="#FFFDF8" stroke="#111111" stroke-width="8"/><path d="M120 155 L185 155 L230 95 L155 95 Z M230 95 L280 155 M175 75 L200 75 M222 72 L248 72" fill="none" stroke="#FFC93C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    ),
  Electronics:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#9B7BEA"/><rect x="105" y="48" width="190" height="122" rx="12" fill="#111111"/><rect x="118" y="61" width="164" height="96" rx="6" fill="#3CC4B3"/><path d="M85 178 L315 178 L330 196 L70 196 Z" fill="#FFC93C" stroke="#111111" stroke-width="5"/></svg>`
    ),
  Furniture:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#F9C9B0"/><rect x="90" y="95" width="220" height="22" rx="6" fill="#111111"/><rect x="110" y="117" width="18" height="78" rx="4" fill="#111111"/><rect x="272" y="117" width="18" height="78" rx="4" fill="#111111"/><rect x="145" y="55" width="110" height="40" rx="8" fill="#FFC93C" stroke="#111111" stroke-width="5"/></svg>`
    ),
  'Lab Equipment':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#F7A8C4"/><path d="M175 45 L225 45 M185 45 L185 95 L140 178 C134 188 142 198 154 198 L246 198 C258 198 266 188 260 178 L215 95 L215 45" fill="#FFFDF8" stroke="#111111" stroke-width="8" stroke-linejoin="round"/><path d="M158 148 L242 148 L254 178 C256 183 252 188 246 188 L154 188 C148 188 144 183 146 178 Z" fill="#3CC4B3"/></svg>`
    ),
  Other:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#3CC4B3"/><rect x="125" y="62" width="150" height="122" rx="14" fill="#FFC93C" stroke="#111111" stroke-width="6"/><path d="M125 104 L275 104 M200 62 L200 184" stroke="#111111" stroke-width="6"/></svg>`
    )
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
  approachingEvents: [],
  activeEventIndex: 0,
  allEvents: [],
  selectedEventId: null,
  viewedProfileUserId: null,
  myTransactions: [],
  DISMISSED_EVENTS_KEY: 'campus_thrift_dismissed_events',

  async init() {
    this.bindNavigation();
    this.bindAuth();
    this.bindSearchAndFilters();
    this.bindSellForm();
    this.bindWantedForm();
    this.bindModals();
    this.bindRatingModal();

    await this.bootstrapAuth();
    await Promise.all([this.loadMarketplace(), this.loadApproachingEventBanner()]);

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
        if (document.getElementById('profile-view')?.style.display === 'block') {
          await this.loadProfileView();
        }
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
        if (document.getElementById('profile-view')?.style.display === 'block') {
          await this.loadProfileView();
        }
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
            if (document.getElementById('profile-view')?.style.display === 'block') {
              await this.loadProfileView();
            }
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
      this.renderEventSpotlightBanner();
    } else if (viewName === 'insights') {
      this.loadInsights();
    } else if (viewName === 'wanted') {
      this.loadWanted();
    } else if (viewName === 'events') {
      this.loadEventsView();
    } else if (viewName === 'profile') {
      this.loadProfileView(this.viewedProfileUserId);
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

  getFallbackImage(category) {
    return CATEGORY_FALLBACK_SVG[category] || CATEGORY_FALLBACK_SVG.Other;
  },

  getDeptAgeTag(item) {
    const rawDept = item.sellerProfile?.department || 'ALL';
    const token = rawDept.split(/[\s•,]+/).find(Boolean) || 'ALL';
    const deptCode = token.length <= 7 ? token.toUpperCase() : token.slice(0, 4).toUpperCase();
    const months = Number(item.ageInMonths || 0);
    let ageStr = `${months}M`;
    if (months >= 12) {
      const years = Number((months / 12).toFixed(1));
      ageStr = `${years % 1 === 0 ? Math.round(years) : years}Y`;
    }
    return `${deptCode} · ${ageStr}`;
  },

  getCardModeLabel(item) {
    const type = (item.transactionType || 'SELL').toUpperCase();
    const cat = String(item.category || 'CAMPUS').toUpperCase();
    const prefixMap = {
      BORROW: 'FREE BORROW',
      SELL: 'FOR SALE',
      SWAP: 'OPEN SWAP',
      RENT: 'DAILY RENT'
    };
    return `${prefixMap[type] || type} · ${cat === 'LAB EQUIPMENT' ? 'LAB GEAR' : cat}`;
  },

  getConditionBadgeHtml(condition) {
    const condClass = condition ? condition.replace(/\s+/g, '') : 'Good';
    const iconMap = {
      'Like New': '✨',
      Excellent: '🌟',
      Good: '💛',
      Fair: '🛠️',
      Poor: '📦'
    };
    const labelMap = {
      Good: 'Well Loved'
    };
    const icon = iconMap[condition] || '✨';
    const label = labelMap[condition] || condition || 'Good';
    return `<span class="badge-condition-bottom ${condClass}">${icon} ${this.escapeHtml(label)}</span>`;
  },

  getLocationRowHtml(item) {
    const type = (item.transactionType || 'SELL').toUpperCase();
    if (type === 'BORROW') {
      const days = item.minDurationDays && item.maxDurationDays ? `${item.minDurationDays}–${item.maxDurationDays}d` : 'Flexible';
      const spot = item.collectionLocation || 'Campus Library';
      return `
        <div class="listing-loc-row">
          <i data-lucide="map-pin" style="width:13px;height:13px;flex-shrink:0;"></i>
          <span>${this.escapeHtml(days)} · ${this.escapeHtml(spot)}</span>
        </div>
      `;
    }
    if (type === 'RENT') {
      const days = item.minDurationDays && item.maxDurationDays ? `${item.minDurationDays}–${item.maxDurationDays}d` : 'Daily';
      const spot = item.collectionLocation || 'Campus Quad';
      return `
        <div class="listing-loc-row">
          <i data-lucide="clock" style="width:13px;height:13px;flex-shrink:0;"></i>
          <span>${this.escapeHtml(days)} · ${this.escapeHtml(spot)}</span>
        </div>
      `;
    }
    if (type === 'SWAP') {
      return `
        <div class="listing-loc-row is-swap">
          <i data-lucide="repeat" style="width:13px;height:13px;flex-shrink:0;"></i>
          <span>Wants: ${this.escapeHtml((item.swapFor || 'Campus gear').slice(0, 40))}</span>
        </div>
      `;
    }
    const spot = item.collectionLocation || (item.willingToNegotiate ? 'Open to fair offers' : 'Fixed asking price');
    return `
      <div class="listing-loc-row ${item.willingToNegotiate ? '' : 'is-urgent'}">
        <i data-lucide="map-pin" style="width:13px;height:13px;flex-shrink:0;"></i>
        <span>${this.escapeHtml(spot)}${item.willingToNegotiate ? ' · Negotiable' : ' · Fixed Price'}</span>
      </div>
    `;
  },

  renderCardFooterPriceHtml(item) {
    const type = (item.transactionType || 'SELL').toUpperCase();
    const orig = parseFloat(item.originalPrice || 0);
    const sell = parseFloat(item.sellingPrice || 0);

    if (type === 'BORROW') {
      return `<div class="listing-price-inline"><span class="price-main">FREE LEND</span></div>`;
    }
    if (type === 'SWAP') {
      return `<div class="listing-price-inline"><span class="price-main">OPEN SWAP</span></div>`;
    }
    if (type === 'RENT') {
      const rate = parseFloat(item.rentalPricePerDay || item.sellingPrice || 0);
      return `
        <div class="listing-price-inline">
          <span class="price-main">₹${rate.toLocaleString('en-IN')}<span style="font-size:0.75rem;">/day</span></span>
        </div>
      `;
    }
    const discount = orig > sell ? Math.round(((orig - sell) / orig) * 100) : 0;
    return `
      <div class="listing-price-inline">
        <span class="price-main">₹${sell.toLocaleString('en-IN')}</span>
        ${discount > 0 ? `<span class="listing-discount-inline">-${discount}%</span>` : ''}
      </div>
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
        const type = (item.transactionType || 'SELL').toUpperCase();
        const mascot = item.littleLoop || { emoji: '✨', message: 'Ready for a new campus owner!' };
        const seller = item.sellerProfile || {
          handle: (item.sellerName || 'Panda_27').split(' ')[0],
          avatarEmoji: '🐼',
          department: 'ALL',
          isVerified: false
        };
        const sellerTrust = item.sellerTrust || {};
        const isOwner = this.currentUser && item.sellerId && Number(item.sellerId) === Number(this.currentUser.id);
        const fallbackImg = this.getFallbackImage(item.category);

        return `
          <article class="listing-card card-interactive" data-id="${item.id}">
            <div class="listing-card-top type-${this.escapeHtml(type)}" onclick="App.openListingDetail(${item.id})">
              <span class="listing-top-mode">${this.escapeHtml(this.getCardModeLabel(item))}</span>
              <span class="listing-dept-tag">${this.escapeHtml(this.getDeptAgeTag(item))}</span>
            </div>

            <div class="listing-thumb-container" style="cursor:pointer;" onclick="App.openListingDetail(${item.id})">
              <img
                src="${this.escapeHtml(this.safeImageUrl(item.imageUrl, fallbackImg))}"
                alt="${this.escapeHtml(item.itemName)}"
                class="listing-thumb"
                loading="lazy"
                onerror="this.onerror=null;this.src='${fallbackImg}';"
              >
              ${this.getConditionBadgeHtml(item.condition)}
            </div>

            <div class="listing-body">
              <h3 class="listing-title" style="cursor:pointer;" onclick="App.openListingDetail(${item.id})" title="${this.escapeHtml(item.itemName)}">
                ${this.escapeHtml(item.itemName)}
              </h3>

              <div class="little-loop-mini">
                <span style="font-size:1.05rem; flex-shrink:0;">${this.escapeHtml(mascot.emoji)}</span>
                <span>“${this.escapeHtml(mascot.message)}”</span>
              </div>

              ${this.getLocationRowHtml(item)}

              <div class="listing-bottom-bar">
                ${this.renderCardFooterPriceHtml(item)}

                <div class="listing-seller-cluster">
                  <button type="button" class="seller-handle-btn" title="Copy handle ${this.escapeHtml(seller.handle)}" onclick="App.openContactToast(${item.id})">
                    <span>${this.escapeHtml(seller.avatarEmoji || '🐼')}</span>
                    <span>${this.escapeHtml(seller.handle)}</span>
                  </button>
                  ${
                    sellerTrust.ratingCount > 0 && sellerTrust.averageRating !== null
                      ? `<button type="button" class="verified-pill" style="background:#FFF9E6; border-color:#111111; color:#111111; cursor:pointer;" title="View peer badges & ratings" onclick="App.inspectPeerProfile(${Number(seller.id || item.sellerId)})">★ ${sellerTrust.averageRating}</button>`
                      : ''
                  }
                  ${
                    seller.isVerified
                      ? `<span class="verified-pill"><i data-lucide="check-circle" style="width:11px;height:11px;"></i> Verified</span>`
                      : ''
                  }
                  ${
                    isOwner
                      ? `<button type="button" class="card-arrow-btn" title="Remove My Listing" aria-label="Remove My Listing" onclick="App.confirmDeleteListing(${item.id})">
                           <i data-lucide="trash-2" style="width:14px;height:14px;color:#F25F5C;"></i>
                         </button>`
                      : ''
                  }
                  <button type="button" class="card-arrow-btn" title="View Listing Details" aria-label="View Listing Details" onclick="App.openListingDetail(${item.id})">
                    <i data-lucide="arrow-right" style="width:15px;height:15px;"></i>
                  </button>
                </div>
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
      const seller = item.sellerProfile || { id: item.sellerId, handle: item.sellerName || 'Panda_27', avatarEmoji: '🐼', department: 'Campus Student (Demo)', isDemo: true, isVerified: false };
      const sellerTrust = item.sellerTrust || { isVerified: seller.isVerified, completedCount: 0, averageRating: null, ratingCount: 0, badges: [] };
      const isOwner = this.currentUser && item.sellerId && Number(item.sellerId) === Number(this.currentUser.id);
      const isAvailable = String(item.availabilityStatus || 'AVAILABLE').toUpperCase() === 'AVAILABLE';
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

      const ratingDisplay =
        sellerTrust.ratingCount > 0 && sellerTrust.averageRating !== null
          ? `★ ${sellerTrust.averageRating}/5 (${sellerTrust.ratingCount})`
          : 'New Peer';
      const sellerBadgePills = (sellerTrust.badges || [])
        .slice(0, 3)
        .map(
          (b) =>
            `<span class="chip bg-${this.escapeHtml(b.tone || 'mint')}" style="font-size:0.72rem;">${this.escapeHtml(b.emoji)} ${this.escapeHtml(b.label)}</span>`
        )
        .join('');

      let requestFormHtml = '';
      if (!isOwner && isAvailable) {
        let modeInputs = '';
        if (type === 'SELL') {
          modeInputs = `
            <div class="form-group" style="margin-bottom:10px;">
              <label class="form-label" for="reqProposedPrice">Your Offer (₹)</label>
              <input type="number" id="reqProposedPrice" class="form-control" min="1" value="${Number(item.sellingPrice || 0)}" ${item.willingToNegotiate ? '' : 'readonly'}>
            </div>
          `;
        } else if (type === 'SWAP') {
          modeInputs = `
            <div class="form-group" style="margin-bottom:10px;">
              <label class="form-label" for="reqSwapOffer">Item You Are Offering to Swap *</label>
              <input type="text" id="reqSwapOffer" class="form-control" maxlength="200" placeholder="e.g. Data Structures textbook + Casio fx-82MS">
            </div>
          `;
        } else {
          modeInputs = `
            <div class="form-grid-2" style="margin-bottom:10px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="reqStartDate">Pickup Date</label>
                <input type="date" id="reqStartDate" class="form-control">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="reqEndDate">Return Date</label>
                <input type="date" id="reqEndDate" class="form-control">
              </div>
            </div>
          `;
        }

        const actionLabel =
          type === 'SELL' ? 'Request Purchase' : type === 'SWAP' ? 'Propose Swap' : type === 'BORROW' ? 'Request Borrow' : 'Request Rental';

        requestFormHtml = `
          <form id="detailRequestForm" style="margin-bottom:12px;">
            ${modeInputs}
            <div class="form-group" style="margin-bottom:12px;">
              <label class="form-label" for="reqNote">Meetup Note (Optional)</label>
              <input type="text" id="reqNote" class="form-control" maxlength="300" placeholder="e.g. Can pick up near Central Library at 4 PM">
            </div>
            <button type="submit" class="btn btn-teal btn-sm" style="width:100%;">
              <i data-lucide="send" style="width:14px;height:14px;"></i> ${actionLabel}
            </button>
          </form>
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
              <img src="${this.escapeHtml(this.safeImageUrl(item.imageUrl, this.getFallbackImage(item.category)))}" alt="${this.escapeHtml(item.itemName)}" onerror="this.onerror=null;this.src='${this.getFallbackImage(item.category)}';" style="width:100%; height:210px; object-fit:cover; border-radius:10px; border:2.5px solid #111111; margin-bottom:14px;">
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
                <span>Seller &amp; Trust</span>
              </div>
              <span class="tag">${sellerTrust.isVerified ? 'Campus Verified' : 'Demo Profile'}</span>
            </div>
            <div class="numbered-section-body">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
                <div class="wanted-emoji-avatar" style="background:var(--yellow);">${this.escapeHtml(seller.avatarEmoji || '🐼')}</div>
                <div>
                  <strong style="font-size:1.05rem; display:block;">${this.escapeHtml(seller.handle)}</strong>
                  <span style="font-size:0.84rem; color:var(--ink-muted);">${this.escapeHtml(seller.department || 'Campus Student (Demo)')}</span>
                </div>
              </div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
                <span class="chip bg-yellow">${this.escapeHtml(ratingDisplay)}</span>
                <span class="chip bg-mint">${Number(sellerTrust.completedCount || 0)} Completed Loops</span>
                ${sellerBadgePills}
              </div>
              <p style="font-size:0.82rem; color:var(--ink-muted); margin-bottom:12px;">
                Pseudonymous identity protects student privacy—badges and ratings come strictly from completed exchanges.
              </p>
              ${
                seller.id
                  ? `<button type="button" class="btn btn-secondary btn-sm" onclick="App.inspectPeerProfile(${Number(seller.id)})">
                       <i data-lucide="award" style="width:14px;height:14px;"></i> Inspect Badges &amp; Ratings
                     </button>`
                  : ''
              }
            </div>
          </div>

          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-purple">
              <div class="numbered-section-title">
                <span class="num-pill">4</span>
                <span>Request / Offer</span>
              </div>
              <span class="tag" style="color:#111111;">${this.escapeHtml(item.availabilityStatus || 'AVAILABLE')}</span>
            </div>
            <div class="numbered-section-body">
              ${requestFormHtml}
              <p style="font-size:0.84rem; color:var(--ink-muted); margin-bottom:12px;">
                ${
                  isOwner
                    ? 'You own this listing. Track incoming requests and handover confirmations in your Profile.'
                    : isAvailable
                      ? 'Send a request above or copy the pseudonymous handle to coordinate on campus. Ratings unlock once both peers confirm completion.'
                      : 'This listing is currently reserved or completed.'
                }
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

      document.getElementById('detailRequestForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitListingRequest(item.id, type);
      });

      this.switchView('detail');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async submitListingRequest(listingId, type) {
    try {
      const payload = {
        listingId,
        note: document.getElementById('reqNote')?.value.trim() || ''
      };

      if (type === 'SELL') {
        const raw = document.getElementById('reqProposedPrice')?.value;
        if (raw) payload.proposedPrice = parseFloat(raw);
      } else if (type === 'SWAP') {
        const swapOffer = document.getElementById('reqSwapOffer')?.value.trim() || '';
        if (!swapOffer) {
          this.showToast('Please describe the item you are offering to swap.', 'error');
          return;
        }
        payload.swapOffer = swapOffer;
      } else {
        payload.startDate = document.getElementById('reqStartDate')?.value || '';
        payload.endDate = document.getElementById('reqEndDate')?.value || '';
      }

      await Api.createTransactionRequest(payload);
      this.showToast('Request sent! Track handover and rate once completed in Profile.', 'success');
      this.viewedProfileUserId = this.currentUser?.id || null;
      this.switchView('profile');
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
  // CAMPUS EVENT CALENDAR & DISMISSIBLE RECOMMENDATIONS
  // ------------------------------------------------------------------------
  getDismissedEventSlugs() {
    try {
      const raw = localStorage.getItem(this.DISMISSED_EVENTS_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  setDismissedEventSlugs(slugs) {
    try {
      localStorage.setItem(this.DISMISSED_EVENTS_KEY, JSON.stringify([...new Set(slugs)]));
    } catch {
      // ignore storage errors
    }
  },

  dismissEventBanner(slug) {
    const dismissed = this.getDismissedEventSlugs();
    dismissed.push(slug);
    this.setDismissedEventSlugs(dismissed);
    this.activeEventIndex = 0;
    this.renderEventSpotlightBanner();
    this.updateRestoreDismissedButton();
    this.showToast('Event suggestion dismissed. You can restore it anytime in Events.', 'info');
  },

  restoreDismissedEvents() {
    this.setDismissedEventSlugs([]);
    this.activeEventIndex = 0;
    this.renderEventSpotlightBanner();
    this.updateRestoreDismissedButton();
    this.showToast('Dismissed campus event banners restored.', 'success');
  },

  updateRestoreDismissedButton() {
    const btn = document.getElementById('restoreDismissedEventsBtn');
    if (btn) {
      btn.style.display = this.getDismissedEventSlugs().length > 0 ? 'inline-flex' : 'none';
    }
  },

  cycleApproachingEvent(delta) {
    const visible = this.getVisibleApproachingEvents();
    if (visible.length <= 1) return;
    this.activeEventIndex = (this.activeEventIndex + delta + visible.length) % visible.length;
    this.renderEventSpotlightBanner();
  },

  getVisibleApproachingEvents() {
    const dismissed = new Set(this.getDismissedEventSlugs());
    return (this.approachingEvents || []).filter((ev) => !dismissed.has(ev.slug));
  },

  async loadApproachingEventBanner() {
    try {
      this.approachingEvents = await Api.getApproachingEvents();
      this.renderEventSpotlightBanner();
    } catch {
      // Non-blocking: banner stays hidden if no approaching events
    }
  },

  renderEventSpotlightBanner() {
    const banner = document.getElementById('eventSpotlightBanner');
    if (!banner) return;

    const visible = this.getVisibleApproachingEvents();
    if (!visible.length) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    if (this.activeEventIndex >= visible.length) {
      this.activeEventIndex = 0;
    }

    const ev = visible[this.activeEventIndex];
    const recs = (ev.recommendedListings || []).slice(0, 3);
    const thumbSrc = this.safeImageUrl(ev.imageUrl, this.getFallbackImage(ev.relevantCategories?.[0] || 'Other'));

    const recButtonsHtml = recs
      .map(
        (item) => `
          <button type="button" class="chip bg-yellow" style="cursor:pointer;" onclick="App.openListingDetail(${Number(item.id)})">
            ${this.escapeHtml(CATEGORY_EMOJI[item.category] || '🎒')} ${this.escapeHtml(item.itemName.slice(0, 26))}${item.itemName.length > 26 ? '…' : ''}
          </button>
        `
      )
      .join('');

    banner.style.display = 'flex';
    banner.innerHTML = `
      <div class="event-spotlight-left">
        <img src="${this.escapeHtml(thumbSrc)}" alt="${this.escapeHtml(ev.eventName)}" class="event-spotlight-thumb" onerror="this.style.display='none'">
        <div>
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
            <span class="tag bg-yellow">${this.escapeHtml(ev.countdownLabel)}</span>
            <span style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; text-transform:uppercase;">
              ${this.escapeHtml(ev.eventName)} · ${this.escapeHtml(ev.eventDate)}
            </span>
          </div>
          <p style="font-size:0.95rem; font-weight:700; margin-bottom:8px;">
            ${this.escapeHtml(ev.bannerMessage)}
          </p>
          ${recButtonsHtml ? `<div style="display:flex; gap:6px; flex-wrap:wrap;">${recButtonsHtml}</div>` : ''}
        </div>
      </div>

      <div class="event-spotlight-actions">
        ${
          visible.length > 1
            ? `<button type="button" class="btn btn-secondary btn-sm" title="Next approaching event" onclick="App.cycleApproachingEvent(1)">
                 Next (${this.activeEventIndex + 1}/${visible.length})
               </button>`
            : ''
        }
        <button type="button" class="btn btn-primary btn-sm" onclick="App.exploreEventRecommendations(${Number(ev.id)})">
          <i data-lucide="calendar" style="width:14px;height:14px;"></i> Explore Items (${Number(ev.matchingCount || 0)})
        </button>
        <button type="button" class="btn btn-secondary btn-sm" aria-label="Dismiss event suggestion" onclick="App.dismissEventBanner('${this.escapeHtml(ev.slug)}')">
          × Dismiss
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  exploreEventRecommendations(eventId) {
    this.selectedEventId = eventId;
    this.switchView('events');
  },

  async loadEventsView() {
    const timelineGrid = document.getElementById('eventsTimelineGrid');
    if (!timelineGrid) return;

    this.updateRestoreDismissedButton();

    try {
      timelineGrid.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon">📅</div><h3 class="empty-state-title">Loading Campus Calendar...</h3></div>';

      const events = await Api.getCampusEvents();
      this.allEvents = events || [];

      if (!this.allEvents.length) {
        timelineGrid.innerHTML =
          '<div class="empty-state" style="grid-column:1/-1; margin:0;"><div class="empty-state-icon">📅</div><h3 class="empty-state-title">No Configured Campus Events</h3><p class="empty-state-desc">Configured campus events will appear here with matching listings.</p></div>';
        return;
      }

      if (!this.selectedEventId || !this.allEvents.some((e) => Number(e.id) === Number(this.selectedEventId))) {
        const firstApproaching = this.allEvents.find((e) => e.isApproaching);
        this.selectedEventId = firstApproaching ? firstApproaching.id : this.allEvents[0].id;
      }

      this.renderEventsTimeline();
      const selected = this.allEvents.find((e) => Number(e.id) === Number(this.selectedEventId));
      if (selected) {
        this.renderEventRecommendations(selected);
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  selectEvent(eventId) {
    this.selectedEventId = eventId;
    this.renderEventsTimeline();
    const selected = this.allEvents.find((e) => Number(e.id) === Number(eventId));
    if (selected) {
      this.renderEventRecommendations(selected);
      document.getElementById('eventRecsSection')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  renderEventsTimeline() {
    const timelineGrid = document.getElementById('eventsTimelineGrid');
    if (!timelineGrid) return;

    timelineGrid.innerHTML = this.allEvents
      .map((ev) => {
        const isActive = Number(ev.id) === Number(this.selectedEventId);
        const headBg = ev.isApproaching ? 'bg-yellow' : ev.isPast ? 'bg-peach' : 'bg-mint';
        const statusLabel = ev.isApproaching ? 'Approaching' : ev.isPast ? 'Past' : 'Upcoming';
        const catsHtml = (ev.relevantCategories || [])
          .map((cat) => `<span class="tag">${this.escapeHtml(cat)}</span>`)
          .join('');
        const safeImg = this.safeImageUrl(ev.imageUrl, '');

        return `
          <article class="event-card ${isActive ? 'active' : ''}">
            <div class="event-card-head ${headBg}">
              <span>${this.escapeHtml(ev.countdownLabel)} · ${this.escapeHtml(ev.eventDate)}</span>
              <span class="tag" style="background:#FFFFFF;">${statusLabel}</span>
            </div>
            ${safeImg ? `<img src="${this.escapeHtml(safeImg)}" alt="${this.escapeHtml(ev.eventName)}" class="event-card-img">` : ''}
            <div class="event-card-body">
              <h3 style="font-size:1.1rem; font-weight:800;">${this.escapeHtml(ev.eventName)}</h3>
              <p style="font-size:0.86rem; color:var(--ink-muted); line-height:1.45;">${this.escapeHtml(ev.description)}</p>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                ${catsHtml}
              </div>
              <div style="margin-top:auto; padding-top:10px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <span style="font-family:var(--font-mono); font-size:0.75rem; font-weight:700;">
                  ${Number(ev.matchingCount || 0)} matching items
                </span>
                <button type="button" class="btn ${isActive ? 'btn-primary' : 'btn-yellow'} btn-sm" onclick="App.selectEvent(${Number(ev.id)})">
                  ${isActive ? 'Selected' : 'View Items'}
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  },

  renderEventRecommendations(ev) {
    const section = document.getElementById('eventRecsSection');
    const heading = document.getElementById('eventRecsHeading');
    const countTag = document.getElementById('eventRecsCountTag');
    const subtext = document.getElementById('eventRecsSubtext');
    const grid = document.getElementById('eventRecsGrid');
    if (!section || !grid) return;

    const recs = ev.recommendedListings || [];
    section.style.display = 'block';
    if (heading) heading.innerText = `Recommended for ${ev.eventName}`;
    if (countTag) countTag.innerText = `${recs.length} Match${recs.length === 1 ? '' : 'es'}`;
    if (subtext) subtext.innerText = `${ev.bannerMessage} (${ev.eventDate} · ${ev.countdownLabel})`;

    if (!recs.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1; margin:0;">
          <div class="empty-state-icon">✨</div>
          <h3 class="empty-state-title">No Matching Items Listed Yet</h3>
          <p class="empty-state-desc">Have relevant gear for ${this.escapeHtml(ev.eventName)}? List it for fellow students.</p>
          <button type="button" class="btn btn-yellow btn-sm" onclick="App.switchView('sell')">List an Item</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = recs
      .map((item) => {
        const type = (item.transactionType || 'SELL').toUpperCase();
        const fallbackImg = this.getFallbackImage(item.category);
        const seller = item.sellerProfile || { handle: 'Campus_Peer', avatarEmoji: '🐼', isVerified: false };
        return `
          <article class="listing-card card-interactive">
            <div class="listing-card-top type-${this.escapeHtml(type)}" onclick="App.openListingDetail(${Number(item.id)})">
              <span class="listing-top-mode">${this.escapeHtml(this.getCardModeLabel(item))}</span>
              <span class="listing-dept-tag">${this.escapeHtml(this.getDeptAgeTag(item))}</span>
            </div>
            <div class="listing-thumb-container" style="cursor:pointer;" onclick="App.openListingDetail(${Number(item.id)})">
              <img
                src="${this.escapeHtml(this.safeImageUrl(item.imageUrl, fallbackImg))}"
                alt="${this.escapeHtml(item.itemName)}"
                class="listing-thumb"
                loading="lazy"
                onerror="this.onerror=null;this.src='${fallbackImg}';"
              >
              ${this.getConditionBadgeHtml(item.condition)}
            </div>
            <div class="listing-body">
              <div class="event-reason-pill">✨ ${this.escapeHtml(item.matchReason || `Useful for ${ev.eventName}`)}</div>
              <h3 class="listing-title" style="cursor:pointer;" onclick="App.openListingDetail(${Number(item.id)})">
                ${this.escapeHtml(item.itemName)}
              </h3>
              ${this.getLocationRowHtml(item)}
              <div class="listing-bottom-bar">
                ${this.renderCardFooterPriceHtml(item)}
                <div class="listing-seller-cluster">
                  <span class="seller-handle-btn" style="cursor:default;">
                    <span>${this.escapeHtml(seller.avatarEmoji || '🐼')}</span>
                    <span>${this.escapeHtml(seller.handle)}</span>
                  </span>
                  <button type="button" class="card-arrow-btn" title="View Listing Details" onclick="App.openListingDetail(${Number(item.id)})">
                    <i data-lucide="arrow-right" style="width:15px;height:15px;"></i>
                  </button>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();
  },

  // ------------------------------------------------------------------------
  // PROFILE, TRUST BADGES, CAMPUS VERIFICATION, EXCHANGES & RATINGS
  // ------------------------------------------------------------------------
  inspectPeerProfile(userId) {
    this.viewedProfileUserId = userId;
    this.switchView('profile');
  },

  async loadProfileView(targetUserId = null) {
    const dirEl = document.getElementById('profilePeerDirectory');
    const mountEl = document.getElementById('profileOverviewMount');
    const txSection = document.getElementById('myTransactionsSection');
    const txBody = document.getElementById('myTransactionsBody');
    const txCountTag = document.getElementById('myTransactionsCountTag');
    const ratingsHeading = document.getElementById('ratingsReceivedHeading');
    const ratingsCountTag = document.getElementById('ratingsReceivedCountTag');
    const ratingsBody = document.getElementById('ratingsReceivedBody');

    if (!mountEl) return;

    const resolvedTargetId = targetUserId || this.currentUser?.id;
    this.viewedProfileUserId = resolvedTargetId || null;

    if (!resolvedTargetId) {
      mountEl.innerHTML = '<div class="empty-state"><p>Sign in with a demo persona to view your profile.</p></div>';
      return;
    }

    const isOwnProfile = this.currentUser && Number(resolvedTargetId) === Number(this.currentUser.id);

    // Build peer directory pills
    if (dirEl) {
      const peerMap = new Map();
      if (this.currentUser) peerMap.set(Number(this.currentUser.id), this.currentUser);
      (this.personas || []).forEach((p) => {
        if (!peerMap.has(Number(p.id))) peerMap.set(Number(p.id), p);
      });

      dirEl.innerHTML = [...peerMap.values()]
        .slice(0, 10)
        .map((p) => {
          const active = Number(p.id) === Number(resolvedTargetId);
          return `
            <button type="button" class="peer-pill-btn ${active ? 'active' : ''}" onclick="App.loadProfileView(${Number(p.id)})">
              <span>${this.escapeHtml(p.avatarEmoji || '🐼')}</span>
              <span>${this.escapeHtml(p.handle)}</span>
              ${p.isVerified ? '<span>✅</span>' : ''}
            </button>
          `;
        })
        .join('');
    }

    try {
      mountEl.innerHTML = '<div class="empty-state" style="margin:0;"><h3 class="empty-state-title">Loading Profile &amp; Badges...</h3></div>';
      const profileRes = await Api.getPublicUserProfile(resolvedTargetId);
      const user = profileRes.user;
      const trust = user.trust || {
        isVerified: Boolean(user.isVerified),
        completedCount: 0,
        completedSwaps: 0,
        completedLends: 0,
        ratingCount: 0,
        averageRating: null,
        badges: []
      };
      const ratings = profileRes.ratings || [];

      const avgDisplay =
        trust.ratingCount > 0 && trust.averageRating !== null
          ? `★ ${trust.averageRating} (${trust.ratingCount})`
          : 'No ratings yet';

      const badgesHtml = (trust.badges || []).length
        ? `<div class="badges-grid">
             ${trust.badges
               .map(
                 (b) => `
                   <div class="trust-badge-card bg-${this.escapeHtml(b.tone || 'mint')}">
                     <div class="trust-badge-emoji">${this.escapeHtml(b.emoji)}</div>
                     <div>
                       <strong style="display:block; font-size:0.94rem;">${this.escapeHtml(b.label)}</strong>
                       <span style="font-size:0.78rem; color:var(--ink-muted); line-height:1.35; display:block; margin-top:2px;">
                         ${this.escapeHtml(b.reason)}
                       </span>
                     </div>
                   </div>
                 `
               )
               .join('')}
           </div>`
        : `<div class="pricing-explanation-box" style="margin-top:0;">
             No badges earned yet. Badges unlock automatically from verified campus status, completed exchanges, lends, swaps, and peer ratings.
           </div>`;

      const verifyBlockHtml =
        isOwnProfile && !user.isVerified
          ? `
            <form id="verifyCampusForm" style="margin-top:14px; padding-top:14px; border-top:2px dashed rgba(17,17,17,0.2);">
              <label class="form-label" for="verifyCampusInput">
                <span>Verify Campus Student Status</span>
                <span class="form-label-hint">Roll ID (e.g. CS2024042) or .edu / .ac.in email</span>
              </label>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <input type="text" id="verifyCampusInput" class="form-control" style="flex:1; min-width:210px;" placeholder="e.g. CS2024042 or panda27@iit.ac.in" required>
                <button type="submit" class="btn btn-teal btn-sm">
                  <i data-lucide="shield-check" style="width:15px;height:15px;"></i> Verify Now
                </button>
              </div>
            </form>
          `
          : '';

      mountEl.innerHTML = `
        <div class="detail-grid-2" style="margin-bottom:0;">
          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-yellow">
              <div class="numbered-section-title">
                <span class="num-pill">1</span>
                <span>${isOwnProfile ? 'My Campus Identity' : 'Student Profile'}</span>
              </div>
              <span class="tag ${trust.isVerified ? 'bg-mint' : ''}">
                ${trust.isVerified ? '✅ Campus Verified' : 'Unverified Demo'}
              </span>
            </div>
            <div class="numbered-section-body">
              <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px;">
                <div class="wanted-emoji-avatar" style="width:56px; height:56px; font-size:1.7rem; background:var(--yellow);">
                  ${this.escapeHtml(user.avatarEmoji || '🐼')}
                </div>
                <div>
                  <h3 style="font-size:1.3rem; font-weight:800;">${this.escapeHtml(user.handle)}</h3>
                  <p style="font-size:0.86rem; color:var(--ink-muted);">${this.escapeHtml(user.department || 'Campus Student (Demo)')}</p>
                </div>
              </div>

              <div class="trust-stats-strip">
                <div class="trust-stat-box">
                  <strong>${Number(trust.completedCount || 0)}</strong>
                  <span>Completed</span>
                </div>
                <div class="trust-stat-box">
                  <strong>${trust.ratingCount > 0 && trust.averageRating !== null ? `★ ${trust.averageRating}` : '—'}</strong>
                  <span>Avg (${Number(trust.ratingCount || 0)})</span>
                </div>
                <div class="trust-stat-box">
                  <strong>${Number(trust.completedSwaps || 0)}</strong>
                  <span>Swaps</span>
                </div>
                <div class="trust-stat-box">
                  <strong>${Number(trust.completedLends || 0)}</strong>
                  <span>Lends</span>
                </div>
              </div>

              <div style="font-size:0.82rem; color:var(--ink-muted);">
                Rating Summary: <strong>${this.escapeHtml(avgDisplay)}</strong>
              </div>
              ${verifyBlockHtml}
            </div>
          </div>

          <div class="numbered-section" style="margin-bottom:0;">
            <div class="numbered-section-head bg-purple">
              <div class="numbered-section-title">
                <span class="num-pill">2</span>
                <span>Earned Trust Badges</span>
              </div>
              <span class="tag" style="color:#111111;">${(trust.badges || []).length} Earned</span>
            </div>
            <div class="numbered-section-body">
              ${badgesHtml}
            </div>
          </div>
        </div>
      `;

      document.getElementById('verifyCampusForm')?.addEventListener('submit', (e) => {
        this.submitCampusVerification(e);
      });

      // Load My Exchanges & Post-Completion Ratings when viewing own profile
      if (txSection && txBody) {
        if (isOwnProfile) {
          txSection.style.display = 'block';
          const txs = await Api.getMyTransactions();
          this.myTransactions = txs || [];
          if (txCountTag) txCountTag.innerText = `${this.myTransactions.length} Exchange${this.myTransactions.length === 1 ? '' : 's'}`;

          if (!this.myTransactions.length) {
            txBody.innerHTML =
              '<p style="font-size:0.9rem; color:var(--ink-muted);">No active or completed exchanges yet. Request any listing in Marketplace to start a campus handover.</p>';
          } else {
            txBody.innerHTML = this.myTransactions
              .map((tx) => {
                const roleLabel = tx.isSeller ? 'Owner / Seller' : 'Buyer / Requester';
                const peer = tx.peerProfile || { id: 0, handle: 'Campus_Peer', avatarEmoji: '🐼' };
                const statusTone =
                  tx.status === 'COMPLETED'
                    ? 'bg-teal'
                    : tx.status === 'ACCEPTED'
                      ? 'bg-yellow'
                      : tx.status === 'CANCELLED'
                        ? 'bg-coral'
                        : 'bg-mint';

                let detailStr = '';
                if (tx.transactionType === 'SELL' && tx.proposedPrice) {
                  detailStr = `Offer: ₹${Number(tx.proposedPrice).toLocaleString('en-IN')}`;
                } else if (tx.transactionType === 'SWAP' && tx.swapOffer) {
                  detailStr = `Swap Offer: ${tx.swapOffer}`;
                } else if ((tx.transactionType === 'BORROW' || tx.transactionType === 'RENT') && (tx.startDate || tx.endDate)) {
                  detailStr = `Dates: ${tx.startDate || 'TBD'} → ${tx.endDate || 'TBD'}`;
                }

                const userConfirmed = tx.isBuyer ? tx.buyerConfirmed : tx.sellerConfirmed;
                const peerConfirmed = tx.isBuyer ? tx.sellerConfirmed : tx.buyerConfirmed;

                let actionsHtml = '';
                if (tx.status === 'REQUESTED') {
                  if (tx.isSeller) {
                    actionsHtml += `<button type="button" class="btn btn-teal btn-sm" onclick="App.handleTransactionAction(${Number(tx.id)}, 'ACCEPT')">Accept Request</button>`;
                  }
                  actionsHtml += `<button type="button" class="btn btn-secondary btn-sm" onclick="App.handleTransactionAction(${Number(tx.id)}, 'CANCEL')">Cancel</button>`;
                } else if (tx.status === 'ACCEPTED') {
                  if (!userConfirmed) {
                    actionsHtml += `<button type="button" class="btn btn-yellow btn-sm" onclick="App.handleTransactionAction(${Number(tx.id)}, 'CONFIRM')">Confirm Handover</button>`;
                  } else {
                    actionsHtml += `<span class="tag bg-mint">${peerConfirmed ? 'Both Confirmed' : 'You Confirmed · Waiting Peer'}</span>`;
                  }
                  actionsHtml += `<button type="button" class="btn btn-secondary btn-sm" onclick="App.handleTransactionAction(${Number(tx.id)}, 'CANCEL')">Cancel</button>`;
                } else if (tx.status === 'COMPLETED') {
                  if (tx.hasRated) {
                    actionsHtml += `<span class="tag bg-yellow">Rated ★ ${Number(tx.myRatingScore || 5)}/5</span>`;
                  } else {
                    actionsHtml += `<button type="button" class="btn btn-primary btn-sm" onclick="App.openRatingModal(${Number(tx.id)}, '${this.escapeHtml(tx.itemName)}', '${this.escapeHtml(peer.handle)}')">Rate Peer ★</button>`;
                  }
                }

                return `
                  <div class="tx-row-card">
                    <div>
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
                        <span class="tag ${statusTone}">${this.escapeHtml(tx.status)}</span>
                        <span class="tag">${this.escapeHtml(tx.transactionType)}</span>
                        <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--ink-muted);">${roleLabel}</span>
                      </div>
                      <strong style="font-size:1rem; cursor:pointer; text-decoration:underline;" onclick="App.openListingDetail(${Number(tx.listingId)})">
                        ${this.escapeHtml(tx.itemName)}
                      </strong>
                      <div style="font-size:0.84rem; color:var(--ink-muted); margin-top:3px;">
                        With <button type="button" class="seller-handle-btn" style="padding:0;" onclick="App.inspectPeerProfile(${Number(peer.id)})">${this.escapeHtml(peer.avatarEmoji || '🐼')} ${this.escapeHtml(peer.handle)}</button>
                        ${detailStr ? ` · ${this.escapeHtml(detailStr)}` : ''}
                        ${tx.note ? ` · “${this.escapeHtml(tx.note)}”` : ''}
                      </div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                      ${actionsHtml}
                    </div>
                  </div>
                `;
              })
              .join('');
          }
        } else {
          txSection.style.display = 'none';
        }
      }

      // Render ratings received feed
      if (ratingsHeading) ratingsHeading.innerText = `Peer Ratings Received by ${user.handle}`;
      if (ratingsCountTag) ratingsCountTag.innerText = `${ratings.length} Rating${ratings.length === 1 ? '' : 's'}`;
      if (ratingsBody) {
        if (!ratings.length) {
          ratingsBody.innerHTML = '<p style="font-size:0.9rem; color:var(--ink-muted);">No completed exchange ratings received yet.</p>';
        } else {
          ratingsBody.innerHTML = ratings
            .map(
              (r) => `
                <div class="rating-item-card">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span class="tag bg-yellow">${'★'.repeat(Number(r.score || 5))} (${Number(r.score || 5)}/5)</span>
                      <strong>${this.escapeHtml(r.raterEmoji || '🐼')} ${this.escapeHtml(r.raterHandle)}</strong>
                    </div>
                    <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--ink-muted);">
                      ${this.escapeHtml(r.transactionType)} · ${this.escapeHtml(r.itemName)}
                    </span>
                  </div>
                  ${r.feedback ? `<p style="font-size:0.88rem; line-height:1.45;">“${this.escapeHtml(r.feedback)}”</p>` : '<p style="font-size:0.82rem; color:var(--ink-muted);">Completed campus handover rated.</p>'}
                </div>
              `
            )
            .join('');
        }
      }

      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async submitCampusVerification(e) {
    e.preventDefault();
    const input = document.getElementById('verifyCampusInput');
    const credential = input?.value.trim() || '';
    if (!credential) {
      this.showToast('Please enter a campus roll ID or .edu/.ac.in email.', 'error');
      return;
    }

    try {
      const updatedUser = await Api.verifyCampus(credential);
      this.setCurrentUser(updatedUser);
      const personasRes = await Api.getPersonas();
      this.personas = personasRes.data || this.personas;
      await Promise.all([this.loadProfileView(updatedUser.id), this.loadMarketplace()]);
      this.showToast('Campus Verified badge unlocked!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async handleTransactionAction(txId, action) {
    try {
      const updated = await Api.updateTransactionStatus(txId, action);
      if (updated.status === 'COMPLETED') {
        this.showToast('Exchange marked COMPLETED! You can now rate your campus peer.', 'success');
      } else if (action === 'ACCEPT') {
        this.showToast('Request accepted! Confirm handover once you meet on campus.', 'success');
      } else if (action === 'CONFIRM') {
        this.showToast('Handover confirmed! Waiting for the other student to confirm.', 'info');
      } else {
        this.showToast('Transaction updated.', 'info');
      }
      await Promise.all([this.loadProfileView(this.viewedProfileUserId), this.loadMarketplace()]);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  openRatingModal(txId, itemName, peerHandle) {
    const txInput = document.getElementById('ratingTransactionId');
    const summaryEl = document.getElementById('ratingTargetSummary');
    const scoreInput = document.getElementById('ratingScoreInput');
    const feedbackInput = document.getElementById('ratingFeedbackInput');

    if (txInput) txInput.value = String(txId);
    if (summaryEl) {
      summaryEl.innerHTML = `<span>⭐ Rating <strong>${this.escapeHtml(peerHandle)}</strong> for completed exchange: <strong>${this.escapeHtml(itemName)}</strong></span>`;
    }
    if (scoreInput) scoreInput.value = '5';
    if (feedbackInput) feedbackInput.value = '';
    document.querySelectorAll('#starPickerRow .star-choice').forEach((btn) => btn.classList.add('active'));
    this.openModal('ratingModal');
  },

  bindRatingModal() {
    const starRow = document.getElementById('starPickerRow');
    const scoreInput = document.getElementById('ratingScoreInput');
    const form = document.getElementById('submitRatingForm');

    starRow?.querySelectorAll('.star-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = parseInt(btn.getAttribute('data-score'), 10) || 5;
        if (scoreInput) scoreInput.value = String(chosen);
        starRow.querySelectorAll('.star-choice').forEach((b) => {
          const val = parseInt(b.getAttribute('data-score'), 10) || 0;
          b.classList.toggle('active', val <= chosen);
        });
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const transactionId = parseInt(document.getElementById('ratingTransactionId')?.value || '0', 10);
      const score = parseInt(scoreInput?.value || '5', 10);
      const feedback = document.getElementById('ratingFeedbackInput')?.value.trim() || '';

      try {
        await Api.submitRating({ transactionId, score, feedback });
        this.closeModal('ratingModal');
        this.showToast('Peer rating submitted! Trust badges updated.', 'success');
        await Promise.all([this.loadProfileView(this.viewedProfileUserId), this.loadMarketplace()]);
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  // ------------------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------------------
  safeImageUrl(url, fallback = '') {
    if (!url || typeof url !== 'string') return fallback;
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed) || /^data:image\/svg\+xml/i.test(trimmed)) {
      return trimmed;
    }
    return fallback;
  },

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
