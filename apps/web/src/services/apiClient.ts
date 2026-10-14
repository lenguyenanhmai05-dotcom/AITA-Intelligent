import axios from 'axios';

// Khởi tạo một Axios instance với cấu hình mặc định
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 10000, // Timeout sau 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động đính kèm Token vào Header
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token (PAT hoặc JWT) từ localStorage nếu có
    const token = localStorage.getItem('aita_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi toàn cục (ví dụ: Token hết hạn, lỗi mạng)
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Tự động unwrap data từ Axios response object
  },
  (error) => {
    // Xử lý lỗi 401 Unauthorized (Token hết hạn -> Xóa token, đẩy ra màn login)
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or unauthorized. Logging out...");
      localStorage.removeItem('aita_token');
      localStorage.removeItem('aita_user');
      // Tùy chỉnh: window.location.href = '/login';
    }
    
    // Đẩy lỗi ra ngoài cho Component tự bắt (try-catch)
    const errorMessage = error.response?.data?.message || error.message || 'Lỗi không xác định từ máy chủ';
    return Promise.reject(new Error(errorMessage));
  }
);
