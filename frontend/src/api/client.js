// AnnData API Client

const getBaseUrl = () => {
  const customUrl = localStorage.getItem('anndata_api_url');
  if (customUrl) return customUrl.replace(/\/+$/, '');
  return 'http://127.0.0.1:8000';
};

export const setCustomApiUrl = (url) => {
  if (url) {
    localStorage.setItem('anndata_api_url', url);
  } else {
    localStorage.removeItem('anndata_api_url');
  }
};

export const getSavedApiUrl = () => {
  return localStorage.getItem('anndata_api_url') || 'http://127.0.0.1:8000';
};

async function request(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = { ...(options.headers || {}) };
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      if (typeof data === 'object' && data !== null) {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map((err) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
          } else {
            errorMessage = String(data.detail);
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export const checkHealth = () => request('/api/health');

// ---------------------------------------------------------------------------
// CropClock
// ---------------------------------------------------------------------------
export const cropclockApi = {
  getHarvests: (params = {}) => {
    const query = new URLSearchParams();
    if (params.crop) query.append('crop', params.crop);
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/harvests?${query.toString()}`);
  },

  getHarvest: (harvestId) => request(`/api/harvests/${harvestId}`),

  createHarvest: (data) =>
    request('/api/harvests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitOffer: (harvestId, data) =>
    request(`/api/harvests/${harvestId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOffers: (harvestId) => request(`/api/harvests/${harvestId}/offers`),

  compareOffers: (harvestId) => request(`/api/harvests/${harvestId}/compare-offers`),

  updateOfferStatus: (offerId, status, farmerId) =>
    request(`/api/offers/${offerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, farmer_id: Number(farmerId) }),
    }),
};

// ---------------------------------------------------------------------------
// FairQueue
// ---------------------------------------------------------------------------
export const fairqueueApi = {
  getMachinery: (params = {}) => {
    const query = new URLSearchParams();
    if (params.equipment_type) query.append('equipment_type', params.equipment_type);
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.is_available !== undefined && params.is_available !== 'all') {
      query.append('is_available', params.is_available);
    }
    if (params.start_time) query.append('start_time', params.start_time);
    if (params.end_time) query.append('end_time', params.end_time);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/machinery?${query.toString()}`);
  },

  getMachineryItem: (id) => request(`/api/machinery/${id}`),

  createMachinery: (data) =>
    request('/api/machinery', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createBooking: (machineryId, data) =>
    request(`/api/machinery/${machineryId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBookings: (machineryId) => request(`/api/machinery/${machineryId}/bookings`),

  updateBookingStatus: (bookingId, status, userId) =>
    request(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, user_id: Number(userId) }),
    }),
};

// ---------------------------------------------------------------------------
// WaterWindow
// ---------------------------------------------------------------------------
export const waterwindowApi = {
  createPlan: (data) =>
    request('/api/irrigation/plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPlans: (params = {}) => {
    const query = new URLSearchParams();
    if (params.farm_id) query.append('farm_id', params.farm_id);
    if (params.crop) query.append('crop', params.crop);
    if (params.growth_stage) query.append('growth_stage', params.growth_stage);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/irrigation/plans?${query.toString()}`);
  },

  getPlan: (id) => request(`/api/irrigation/plans/${id}`),

  getWeather: (params = {}) => {
    const query = new URLSearchParams();
    if (params.district) query.append('district', params.district);
    if (params.state) query.append('state', params.state);
    if (params.latitude) query.append('latitude', params.latitude);
    if (params.longitude) query.append('longitude', params.longitude);
    return request(`/api/irrigation/weather?${query.toString()}`);
  },
};

// ---------------------------------------------------------------------------
// FarmConnect Camps
// ---------------------------------------------------------------------------
export const campsApi = {
  getCamps: (params = {}) => {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    if (params.include_past !== undefined) query.append('include_past', params.include_past);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/camps?${query.toString()}`);
  },

  getNextCamp: (params = {}) => {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.district) query.append('district', params.district);
    return request(`/api/camps/next?${query.toString()}`);
  },

  getCamp: (id) => request(`/api/camps/${id}`),

  createCamp: (data) =>
    request('/api/camps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ---------------------------------------------------------------------------
// SchemeSaathi
// ---------------------------------------------------------------------------
export const schemeApi = {
  getSchemes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.state) query.append('state', params.state);
    if (params.category) query.append('category', params.category);
    if (params.q) query.append('q', params.q);
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/schemes?${query.toString()}`);
  },

  getScheme: (id) => request(`/api/schemes/${id}`),

  getFarmerMatches: (farmerId) => request(`/api/schemes/farmer/${farmerId}/matches`),

  updateFarmerProfile: (farmerId, data) =>
    request(`/api/farmer/${farmerId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ---------------------------------------------------------------------------
// Crop Disease Detection (ML Models)
// ---------------------------------------------------------------------------
export const diseaseApi = {
  detectDisease: (formData) =>
    request('/api/disease/detect', {
      method: 'POST',
      body: formData,
    }),

  getDetections: (params = {}) => {
    const query = new URLSearchParams();
    if (params.farm_id) query.append('farm_id', params.farm_id);
    if (params.needs_expert_review !== undefined && params.needs_expert_review !== 'all') {
      query.append('needs_expert_review', params.needs_expert_review);
    }
    if (params.page) query.append('page', params.page);
    if (params.page_size) query.append('page_size', params.page_size);
    return request(`/api/disease/detections?${query.toString()}`);
  },

  getDetection: (id) => request(`/api/disease/detections/${id}`),

  getAssetsStatus: () => request('/api/disease/assets/status'),
};

// ---------------------------------------------------------------------------
// Authentication & User Sync
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

