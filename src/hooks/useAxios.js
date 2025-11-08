import { useMemo } from "react";
import apiClient from "../lib/apiClient";

const useAxios = () => {
  return useMemo(
    () => ({
      get: (url, config = {}) => apiClient.get(url, config),
      post: (url, data, config = {}) => apiClient.post(url, data, config),
      put: (url, data, config = {}) => apiClient.put(url, data, config),
      del: (url, config = {}) => apiClient.delete(url, config),
      axios: apiClient,
    }),
    []
  );
};

export default useAxios;
