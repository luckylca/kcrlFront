import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://47.113.189.138/'; // 即实际使用的远端服务器

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
      console.log('Response data:', data);
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

      const title = data.title?.trim() || '';
      const author = data.author?.trim() || '';
      const summary = data.summary?.trim() || '';
      const content = data.content?.trim() || '';
      const category = data.category?.trim() || 'article';

      const VALID_CATEGORIES = ['extension', 'script', 'theme', 'article'];

      if (!title) {
        return {
          success: false,
          message: '标题不能为空',
        };
      }
      if (title.length > 255) {
        return {
          success: false,
          message: '标题长度不能超过255个字符',
        };
      }
      if (!author) {
        return {
          success: false,
          message: '作者不能为空',
        };
      }
      if (author.length > 100) {
        return {
          success: false,
          message: '作者名称长度不能超过100个字符',
        };
      }
      if (summary.length > 500) {
        return {
          success: false,
          message: '简介长度不能超过500个字符',
        };
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return {
          success: false,
          message: `无效的板块类型，可选: ${VALID_CATEGORIES.join(', ')}`,
        };
      }

      formData.append('title', title);
      formData.append('author', author);
      formData.append('content', content);
      formData.append('summary', summary);
      formData.append('category', category);

      if (category === 'extension') {
        if (!data.file) {
          return {
            success: false,
            message: '扩展板块必须上传压缩包文件',
          };
        }
        formData.append('file', {
          uri: data.file.uri,
          type: data.file.type || 'application/zip',
          name: data.file.name || 'extension.zip',
        } as any);
      } else if (category === 'script') {
        if (!data.file) {
          return {
            success: false,
            message: '脚本文板必须上传脚本文件',
          };
        }
        formData.append('file', {
          uri: data.file.uri,
          type: data.file.type || 'application/octet-stream',
          name: data.file.name || 'script.sh',
        } as any);
      } else if (category === 'theme') {
        const hasImage = !!data.image;
        const hasJson = !!data.config;

        if (!hasImage && !hasJson) {
          return {
            success: false,
            message: '主题板块必须上传图片或JSON配置文件',
          };
        }

        if (hasImage) {
          formData.append('image', {
            uri: data.image.uri,
            type: data.image.type || 'image/png',
            name: data.image.name || 'image.png',
          } as any);
        }

        if (hasJson) {
          formData.append('config', {
            uri: data.config.uri,
            type: data.config.type || 'application/json',
            name: data.config.name || 'config.json',
          } as any);
        }
      } else if (category === 'article') {
        if (!content) {
          return {
            success: false,
            message: '文章板块必须填写内容',
          };
        }
      }

      console.log('Uploading with formData:', {
        title,
        author,
        summary,
        category,
        hasFile: !!data.file,
        hasImage: !!data.image,
        hasConfig: !!data.config,
      });

      const response = await fetch(`${API_BASE_URL}/upload.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      const responseData = JSON.parse(responseText);
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
  async getFileSize(file_path: string): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/fileinfo.php?fp=${file_path}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.text().then(text => parseInt(text, 10));
    } catch (error) {
      console.error('Error fetching post:', error);
      return 0;
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
