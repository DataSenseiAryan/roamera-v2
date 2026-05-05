import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://roamera.in/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('roamera_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
