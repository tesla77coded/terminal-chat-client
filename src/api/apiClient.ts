import axios from "axios";

const apiClient = axios.create({
  baseURL: 'https://terminal-chat-backend-tesla77.onrender.com/api',
  // baseURL: 'http://localhost:9090/api',
  timeout: 90000,
});

export default apiClient;
