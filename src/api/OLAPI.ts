import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://47.113.189.138:80'; // 即实际使用的远端服务器

export interface Post {
  id: string;
  title: string;
  author: string;
  content: string;
  summary: string;
  category: string;
  file_path?: string;
  status: string;
  created_at: string;
}

export interface PostData {
  title: string;
  author: string;
  content: string;
  summary: string;
  category: string;
  file?: any;
  image?: any;
  config?: any;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class ApiService {
  async getPosts(params: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append('search', params.search);
      if (params.category && params.category !== '全部') {
        queryParams.append('category', params.category);
      }
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api.php?${queryParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        success: false,
        message: '获取失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async uploadPost(data: PostData): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('author', data.author);
      formData.append('content', data.content);
      formData.append('summary', data.summary);
      formData.append('category', data.category);

      // 处理普通文件上传（扩展和脚本类型）
      if (data.file) {
        formData.append('file', {
          uri: data.file.uri,
          type: data.file.type || 'application/octet-stream',
          name: data.file.name || 'file',
        } as any);
      }

      // 处理主题类型的双重文件上传
      if (data.category === 'theme') {
        // 处理图片文件
        if (data.image) {
          formData.append('image', {
            uri: data.image.uri,
            type: data.image.type || 'image/png',
            name: data.image.name || 'image.png',
          } as any);
        }

        // 处理配置文件
        if (data.config) {
          formData.append('config', {
            uri: data.config.uri,
            type: data.config.type || 'application/json',
            name: data.config.name || 'config.json',
          } as any);
        }
      }

      const response = await fetch(`${API_BASE_URL}/upload.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error uploading post:', error);
      return {
        success: false,
        message: '上传失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async getPostById(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api.php?id=${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching post:', error);
      return {
        success: false,
        message: '获取详情失败',
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  async saveUserInfo(userInfo: { name: string }): Promise<void> {
    try {
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  }

  async getUserInfo(): Promise<{ name: string } | null> {
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      return userInfoStr ? JSON.parse(userInfoStr) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }
}

export default new ApiService();
