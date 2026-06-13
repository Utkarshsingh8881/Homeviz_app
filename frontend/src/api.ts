import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("aura_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const tokenStorage = {
  get: () => AsyncStorage.getItem("aura_token"),
  set: (t: string) => AsyncStorage.setItem("aura_token", t),
  clear: () => AsyncStorage.removeItem("aura_token"),
};
