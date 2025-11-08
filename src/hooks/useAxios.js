import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Get baseURL from environment variable
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const useAxios = () => {
  const { user } = useAuth();

  const instance = axios.create({
    baseURL,
    withCredentials: true,
  });

  // Optionally, you can add interceptors here for token refresh, error handling, etc.

  // Example: GET request
  const get = async (url, config = {}) => {
    return instance.get(url, config);
  };

  // Example: POST request
  const post = async (url, data, config = {}) => {
    return instance.post(url, data, config);
  };

  // Example: PUT request
  const put = async (url, data, config = {}) => {
    return instance.put(url, data, config);
  };

  // Example: DELETE request
  const del = async (url, config = {}) => {
    return instance.delete(url, config);
  };

  return { get, post, put, del, axios: instance };
};

export default useAxios;
