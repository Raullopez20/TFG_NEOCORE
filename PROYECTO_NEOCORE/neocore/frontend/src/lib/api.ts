  import axios, { AxiosError } from 'axios';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Create axios instance
// Uses the API URL directly; withCredentials is not needed since we use
// JWT tokens via Authorization header (not cookies).
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  specialty?: string;
  bio?: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price?: number;
  image?: string;
  available_professionals_count: number;
  professionals_list?: Professional[];
  is_active: boolean;
}

export interface Professional {
  id: number;
  full_name: string;
  specialty: string;
  bio: string;
  profile_image?: string;
}

export interface Booking {
  id: number;
  client: number;
  client_info?: User;
  notes?: string;
  professional: number;
  professional_info?: User;
  service: number;
  service_info?: Service;
  start_datetime: string;
  end_datetime: string;
  duration_minutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELED' | 'DONE';
  client_notes: string;
  professional_notes?: string;
  cancellation_reason?: string;
  is_past: boolean;
  is_upcoming: boolean;
  created_at: string;
}

export interface TimeSlot {
  start_datetime: string;
  end_datetime: string;
  is_available: boolean;
}

export interface AvailabilityRule {
  id: number;
  professional: number;
  professional_name: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface TimeOff {
  id: number;
  professional: number;
  professional_name: string;
  start_date: string;
  end_date: string;
  reason: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login/', { email, password });
    return response.data;
  },

  register: async (data: {
    email: string;
    password1: string;
    password2: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }) => {
    const response = await api.post('/api/auth/register/', data);
    return response.data;
  },

  logout: async () => {
    await api.post('/api/auth/logout/');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  me: async (): Promise<User> => {
    const response = await api.get('/api/auth/users/me/');
    return response.data;
  },

  requestPasswordReset: async (email: string) => {
    const response = await api.post('/api/auth/password/reset/', { email });
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.patch('/api/auth/users/update_me/', data);
    return response.data;
  },
};

// Services API
export const servicesAPI = {
  list: async (): Promise<Service[]> => {
    const response = await api.get('/api/services/');
    return response.data.results || response.data;
  },

  get: async (id: number): Promise<Service> => {
    const response = await api.get(`/api/services/${id}/`);
    return response.data;
  },
};

// Professionals API
export const professionalsAPI = {
  list: async (specialty?: string): Promise<Professional[]> => {
    const params = specialty ? { specialty } : {};
    const response = await api.get('/api/auth/users/professionals/', { params });
    return response.data;
  },

  get: async (id: number): Promise<Professional> => {
    const response = await api.get(`/api/auth/users/${id}/professional_detail/`);
    return response.data;
  },
};

// Bookings API
export const bookingsAPI = {
  list: async (): Promise<Booking[]> => {
    const response = await api.get('/api/bookings/');
    return response.data.results || response.data;
  },

  get: async (id: number): Promise<Booking> => {
    const response = await api.get(`/api/bookings/${id}/`);
    return response.data;
  },

  create: async (data: {
    service: number;
    professional: number;
    start_datetime: string;
    end_datetime: string;
    client_notes?: string;
  }): Promise<Booking> => {
    const response = await api.post('/api/bookings/', data);
    return response.data;
  },

  upcoming: async (): Promise<Booking[]> => {
    const response = await api.get('/api/bookings/upcoming/');
    return response.data;
  },

  past: async (): Promise<Booking[]> => {
    const response = await api.get('/api/bookings/past/');
    return response.data;
  },

  confirm: async (id: number): Promise<Booking> => {
    const response = await api.post(`/api/bookings/${id}/confirm/`);
    return response.data;
  },

  reject: async (id: number, reason?: string): Promise<Booking> => {
    const response = await api.post(`/api/bookings/${id}/reject/`, { reason });
    return response.data;
  },

  cancel: async (id: number, reason?: string): Promise<Booking> => {
    const response = await api.post(`/api/bookings/${id}/cancel/`, { reason });
    return response.data;
  },

  markDone: async (id: number): Promise<Booking> => {
    const response = await api.post(`/api/bookings/${id}/mark_done/`);
    return response.data;
  },
};

// Availability API
export const availabilityAPI = {
  getSlots: async (params: {
    professional_id: number;
    service_duration: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{ slots: TimeSlot[] }> => {
    const response = await api.get('/api/availability/slots/get_slots/', { params });
    return response.data;
  },

  getRules: async (professionalId?: number): Promise<AvailabilityRule[]> => {
    const params = professionalId ? { professional: professionalId } : {};
    const response = await api.get('/api/availability/rules/', { params });
    return response.data.results || response.data;
  },

  createRule: async (data: {
    professional?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }): Promise<AvailabilityRule> => {
    const response = await api.post('/api/availability/rules/', data);
    return response.data;
  },

  updateRule: async (id: number, data: Partial<AvailabilityRule>): Promise<AvailabilityRule> => {
    const response = await api.patch(`/api/availability/rules/${id}/`, data);
    return response.data;
  },

  deleteRule: async (id: number): Promise<void> => {
    await api.delete(`/api/availability/rules/${id}/`);
  },

  getTimeOffs: async (professionalId?: number): Promise<TimeOff[]> => {
    const params = professionalId ? { professional: professionalId } : {};
    const response = await api.get('/api/availability/time-off/', { params });
    return response.data.results || response.data;
  },

  createTimeOff: async (data: {
    professional?: number;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<TimeOff> => {
    const response = await api.post('/api/availability/time-off/', data);
    return response.data;
  },

  deleteTimeOff: async (id: number): Promise<void> => {
    await api.delete(`/api/availability/time-off/${id}/`);
  },
};
