// Campus Thrift Frontend API Client
// Connects to Express REST Backend with Server-Issued Demo Session Token

const API_BASE_URL =
  window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? `${window.location.origin}/api`
    : '/api';

const TOKEN_KEY = 'reloop_session_token';

const Api = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  },

  setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },

  authHeaders(extra = {}) {
    const token = this.getToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
  },

  // 0. Auth & Pseudonymous Profile APIs
  async getPersonas() {
    const res = await fetch(`${API_BASE_URL}/auth/personas`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load demo personas');
    return data;
  },

  async demoLogin(handle = '') {
    const res = await fetch(`${API_BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handle ? { handle } : {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Demo login failed');
    this.setToken(data.token);
    return data.user;
  },

  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.authHeaders()
    });
    if (res.status === 401) {
      this.setToken('');
      return null;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch current user');
    return data.user;
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data.user;
  },

  async getPublicUserProfile(userId) {
    const res = await fetch(`${API_BASE_URL}/auth/users/${userId}/profile`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load peer profile');
    return data;
  },

  async verifyCampus(campusCredential) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-campus`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ campusCredential })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Campus verification failed');
    return data.user;
  },

  // 1. Pricing Engine APIs
  async suggestPricing(itemData) {
    const res = await fetch(`${API_BASE_URL}/pricing/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to calculate suggested price');
    return data;
  },

  async getPricingInsights() {
    const res = await fetch(`${API_BASE_URL}/pricing/insights`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch pricing insights');
    return data.data;
  },

  // 2. Marketplace Listings APIs
  async getAllListings() {
    const res = await fetch(`${API_BASE_URL}/listings`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve listings');
    return data.data;
  },

  async getListingById(id) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to retrieve listing');
    return data.data;
  },

  async searchListings({ category, condition, transactionType, minPrice, maxPrice, keyword } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (condition && condition !== 'All') params.append('condition', condition);
    if (transactionType && transactionType !== 'All') params.append('transactionType', transactionType);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim());

    const res = await fetch(`${API_BASE_URL}/listings/search?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Search query failed');
    return data.data;
  },

  async createListing(listingData) {
    const res = await fetch(`${API_BASE_URL}/listings`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(listingData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to publish listing');
    return data.data;
  },

  async deleteListing(id) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: this.authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete listing');
    return data;
  },

  // 3. Wanted Board APIs
  async getAllWanted() {
    const res = await fetch(`${API_BASE_URL}/wanted`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch wanted requests');
    return data.data;
  },

  async createWanted(wantedData) {
    const res = await fetch(`${API_BASE_URL}/wanted`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(wantedData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit wanted request');
    return data.data;
  },

  // 4. Transactions & Post-Completion Ratings APIs
  async getMyTransactions() {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      headers: this.authHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load transactions');
    return data.data;
  },

  async createTransactionRequest(payload) {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit request');
    return data.data;
  },

  async updateTransactionStatus(id, action) {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}/status`, {
      method: 'PATCH',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update transaction');
    return data.data;
  },

  async submitRating(payload) {
    const res = await fetch(`${API_BASE_URL}/ratings`, {
      method: 'POST',
      headers: this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
    return data.data;
  },

  // 5. Campus Event Calendar APIs
  async getCampusEvents() {
    const res = await fetch(`${API_BASE_URL}/events`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch campus events');
    return data.data;
  },

  async getApproachingEvents() {
    const res = await fetch(`${API_BASE_URL}/events/approaching`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch approaching events');
    return data.data;
  }
};

