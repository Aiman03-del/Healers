import { useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// Get baseURL from environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const useAxios = () => {
  const { user } = useAuth();

  const instance = useMemo(() => {
    const axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });

    axiosInstance.interceptors.request.use(
      (config) => {
        const token = user?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return axiosInstance;
  }, [user?.accessToken]);

  const get = useCallback(
    (url, config = {}) => instance.get(url, config),
    [instance]
  );

  const post = useCallback(
    (url, data, config = {}) => instance.post(url, data, config),
    [instance]
  );

  const put = useCallback(
    (url, data, config = {}) => instance.put(url, data, config),
    [instance]
  );

  const del = useCallback(
    (url, config = {}) => instance.delete(url, config),
    [instance]
  );

  return { get, post, put, del, axios: instance };
};

export default useAxios;
