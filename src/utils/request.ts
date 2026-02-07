import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// 1. 创建 axios 实例
const service = axios.create({
    // 注意：RN 中不能写相对路径 '/api'，必须写完整的 IP 或域名
    // Android 模拟器用 'http://10.0.2.2:3000' 代表本机 localhost
    // baseURL: 'https://api.example.com',
    timeout: 5000, // 请求超时时间
    headers: {
        'Content-Type': 'application/json',
        // 你可以在这里设置通用的静态 Header
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// 2. 请求拦截器 (Request Interceptor)
// 这里是“自定义 Header”最常用的地方，比如自动加 Token
service.interceptors.request.use(
    async (config) => {
        try {
            // 从本地存储获取 Token
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // 如果存在 Token，则添加到 Header 中
                config.headers['Authorization'] = `Bearer ${token}`;

                // 你也可以动态添加其他 Header
                config.headers['X-Platform'] = 'Android';
            }
        } catch (error) {
            console.error('获取 Token 失败', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. 响应拦截器 (Response Interceptor)
service.interceptors.response.use(
    (response) => {
        // 2xx 范围内的状态码都会触发该函数
        // 可以在这里统一“剥离”数据，直接返回 data
        return response.data;
    },
    (error) => {
        // 处理 401 (未授权)、500 等错误
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Token 过期，跳转登录页逻辑
                    Alert.alert('提示', '登录过期，请重新登录');
                    // navigate('Login'); // 需要结合你的路由库
                    break;
                case 500:
                    Alert.alert('错误', '服务器内部错误');
                    break;
                default:
                    Alert.alert('错误', error.response.data?.message || '网络请求失败');
            }
        } else {
            Alert.alert('错误', '网络连接超时或断开');
        }
        return Promise.reject(error);
    }
);

export default service;