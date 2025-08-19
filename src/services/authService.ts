import { API_CONFIG, buildApiUrl } from '../config/api';
import { User } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
}

export class AuthService {
  private static TOKEN_KEY = 'chatify_token';
  private static USER_KEY = 'chatify_user';

  /**
   * Đăng nhập user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Lưu token và user info vào localStorage
        this.setToken(result.data.token);
        this.setUser(result.data.user);
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối server'
      };
    }
  }

  /**
   * Đăng ký user mới
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Lưu token và user info vào localStorage
        this.setToken(result.data.token);
        this.setUser(result.data.user);
      }

      return result;
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối server'
      };
    }
  }

  /**
   * Đăng xuất user
   */
  static async logout(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      
      if (currentUser) {
        // Call logout API để update status user
        await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
          },
          body: JSON.stringify({ userId: currentUser.id })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Xóa token và user info khỏi localStorage
      this.clearAuth();
    }
  }

  /**
   * Kiểm tra user hiện tại có hợp lệ không
   */
  static async getCurrentUserFromServer(): Promise<User | null> {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ME), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.setUser(result.data);
        return result.data;
      } else {
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearAuth();
      return null;
    }
  }

  /**
   * Lấy token từ localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Lưu token vào localStorage
   */
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Lấy user hiện tại từ localStorage
   */
  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Lưu user vào localStorage
   */
  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  static isAuthenticated(): boolean {
    return !!(this.getToken() && this.getCurrentUser());
  }

  /**
   * Xóa tất cả thông tin auth
   */
  static clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get auth headers for API calls
   */
  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
