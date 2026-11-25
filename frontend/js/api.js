// ReLoop Frontend API Client
// Connects to Express REST Backend

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

const Api = {
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

  async searchListings({ category, minPrice, maxPrice, condition, keyword } = {}) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (condition && condition !== 'All') params.append('condition', condition);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to publish listing');
    return data.data;
  },

  async deleteListing(id) {
    const res = await fetch(`${API_BASE_URL}/listings/${id}`, {
      method: 'DELETE'
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wantedData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to submit wanted request');
    return data.data;
  }
};
