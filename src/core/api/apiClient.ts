import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config, API_TIMEOUT } from '../constants/config';
import { getAuthToken, clearAuthData } from '../storage/secureStorage';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token and log requests
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }

    // Log network request for debugging
    console.log('🌐 API REQUEST:', {
      method: requestConfig.method?.toUpperCase(),
      url: (requestConfig.baseURL || '') + (requestConfig.url || ''),
      headers: requestConfig.headers,
      data: requestConfig.data,
      params: requestConfig.params,
    });

    return requestConfig;
  },
  (error: AxiosError) => {
    console.error('❌ API REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and log responses
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ API RESPONSE:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    // Log error response
    console.error('❌ API ERROR:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await clearAuthData();
      // Navigation to login will be handled by auth context
    }
    return Promise.reject(error);
  }
);

export { apiClient };
