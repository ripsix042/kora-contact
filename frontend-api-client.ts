/**
 * Kora Contacts Hub API Client
 * 
 * Copy this file to your frontend project: src/lib/apiClient.ts
 * 
 * Usage:
 * import apiClient from './lib/apiClient';
 * const contacts = await apiClient.contacts.getAll();
 * const dashboard = await apiClient.dashboard.getMetrics();
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 
                     (process.env as any).REACT_APP_API_URL || 
                     'http://localhost:3000';

// Type definitions
export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  title?: string;
  notes?: string;
  syncedAt?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface Device {
  _id: string;
  name: string;
  serialNumber: string;
  model?: string;
  osVersion?: string;
  assignedTo?: string | Contact;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  mosyleDeviceId?: string;
  lastSyncedAt?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalContacts: number;
  totalDevices: number;
  lastSync: {
    type: string;
    status: string;
    completedAt: string;
    recordsProcessed: number;
  } | null;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  contacts?: T[];
  devices?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BulkUploadResponse {
  message: string;
  syncLog: {
    id: string;
    status: string;
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    errors: Array<{
      row: number;
      message: string;
      data: any;
    }>;
  };
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get Okta token from storage
   * Update this method based on how you store tokens in your app
   */
  private getToken(): string | null {
    // Option 1: localStorage
    return localStorage.getItem('okta_token');
    
    // Option 2: sessionStorage
    // return sessionStorage.getItem('okta_token');
    
    // Option 3: From your auth context/state
    // return authContext?.token;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add Okta token if available (when you add Okta later)
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Remove Content-Type for FormData (browser will set it automatically)
    if (options.body instanceof FormData) {
      const headers = { ...config.headers } as Record<string, string>;
      delete headers['Content-Type'];
      config.headers = headers;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = new Error(data.message || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        // Unauthorized - redirect to login or refresh token
        console.error('Unauthorized - please login');
        // You can dispatch a logout action here
      } else if (apiError.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Forbidden - insufficient permissions');
      }
      throw error;
    }
  }

  // ==================== CONTACTS API ====================

  contacts = {
    /**
     * Get all contacts with pagination and search
     * @param params - { page, limit, search }
     */
    getAll: async (params: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<Contact>> => {
      const queryParams: Record<string, string> = {};
      if (params.page !== undefined) queryParams.page = String(params.page);
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.search) queryParams.search = params.search;
      
      const queryString = new URLSearchParams(queryParams).toString();
      return this.request<PaginatedResponse<Contact>>(`/api/contacts${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get contact by ID
     * @param id - Contact ID
     */
    getById: async (id: string): Promise<Contact> => {
      return this.request<Contact>(`/api/contacts/${id}`);
    },

    /**
     * Create new contact
     * @param contact - { name, email, phone, company?, title?, notes? }
     */
    create: async (contact: Omit<Contact, '_id' | 'createdAt' | 'updatedAt' | 'syncedAt' | 'syncStatus'>): Promise<Contact> => {
      return this.request<Contact>('/api/contacts', {
        method: 'POST',
        body: JSON.stringify(contact),
      });
    },

    /**
     * Update contact
     * @param id - Contact ID
     * @param contact - Contact data to update
     */
    update: async (id: string, contact: Partial<Contact>): Promise<Contact> => {
      return this.request<Contact>(`/api/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
      });
    },

    /**
     * Delete contact
     * @param id - Contact ID
     */
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/api/contacts/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // ==================== DEVICES API ====================

  devices = {
    /**
     * Get all devices with pagination, search, and status filter
     * @param params - { page, limit, search, status }
     */
    getAll: async (params: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<PaginatedResponse<Device>> => {
      const queryParams: Record<string, string> = {};
      if (params.page !== undefined) queryParams.page = String(params.page);
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.search) queryParams.search = params.search;
      if (params.status) queryParams.status = params.status;
      
      const queryString = new URLSearchParams(queryParams).toString();
      return this.request<PaginatedResponse<Device>>(`/api/devices${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Get device by ID
     * @param id - Device ID
     */
    getById: async (id: string): Promise<Device> => {
      return this.request<Device>(`/api/devices/${id}`);
    },

    /**
     * Create new device
     * @param device - { name, serialNumber, model?, osVersion?, status? }
     */
    create: async (device: Omit<Device, '_id' | 'createdAt' | 'updatedAt' | 'lastSyncedAt' | 'syncStatus' | 'mosyleDeviceId'>): Promise<Device> => {
      return this.request<Device>('/api/devices', {
        method: 'POST',
        body: JSON.stringify(device),
      });
    },

    /**
     * Update device
     * @param id - Device ID
     * @param device - Device data to update
     */
    update: async (id: string, device: Partial<Device>): Promise<Device> => {
      return this.request<Device>(`/api/devices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(device),
      });
    },

    /**
     * Delete device
     * @param id - Device ID
     */
    delete: async (id: string): Promise<{ message: string }> => {
      return this.request<{ message: string }>(`/api/devices/${id}`, {
        method: 'DELETE',
      });
    },
  };

  // ==================== DASHBOARD API ====================

  dashboard = {
    /**
     * Get dashboard metrics
     */
    getMetrics: async (): Promise<DashboardMetrics> => {
      return this.request<DashboardMetrics>('/api/dashboard');
    },
  };

  // ==================== SETTINGS API (Admin Only) ====================

  settings = {
    /**
     * Get integration settings
     */
    getIntegrations: async (): Promise<Array<{
      type: string;
      enabled: boolean;
      config: Record<string, any>;
      updatedAt: string;
    }>> => {
      return this.request('/api/settings/integrations');
    },

    /**
     * Update CardDAV settings
     * @param settings - { enabled, url, username, password }
     */
    updateCardDAV: async (settings: { enabled?: boolean; url?: string; username?: string; password?: string }): Promise<{
      type: string;
      enabled: boolean;
      config: Record<string, any>;
    }> => {
      return this.request('/api/settings/integrations/carddav', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    /**
     * Update Mosyle settings
     * @param settings - { enabled, apiKey, baseUrl }
     */
    updateMosyle: async (settings: { enabled?: boolean; apiKey?: string; baseUrl?: string }): Promise<{
      type: string;
      enabled: boolean;
      config: Record<string, any>;
    }> => {
      return this.request('/api/settings/integrations/mosyle', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    /**
     * Trigger sync for integration type
     * @param type - 'mosyle' or 'carddav'
     */
    triggerSync: async (type: 'mosyle' | 'carddav'): Promise<{ message: string; syncLogId?: string }> => {
      return this.request(`/api/settings/integrations/${type}/sync`, {
        method: 'POST',
      });
    },
  };

  // ==================== BULK UPLOAD API (Admin Only) ====================

  bulkUpload = {
    /**
     * Upload contacts CSV file
     * @param file - CSV file
     */
    uploadContacts: async (file: File): Promise<BulkUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      
      return this.request<BulkUploadResponse>('/api/bulk-upload/contacts', {
        method: 'POST',
        headers: {}, // Let browser set Content-Type for FormData
        body: formData,
      });
    },

    /**
     * Upload devices CSV file
     * @param file - CSV file
     */
    uploadDevices: async (file: File): Promise<BulkUploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      
      return this.request<BulkUploadResponse>('/api/bulk-upload/devices', {
        method: 'POST',
        headers: {},
        body: formData,
      });
    },
  };

  // ==================== HEALTH CHECK ====================

  /**
   * Health check endpoint (no auth required)
   */
  health = async (): Promise<{ status: string; timestamp: string }> => {
    return this.request<{ status: string; timestamp: string }>('/health');
  };
}

// Export singleton instance
export default new ApiClient();

// Also export class for custom instances
export { ApiClient };

