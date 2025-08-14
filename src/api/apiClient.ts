import axios from "axios";

const apiClient = axios.create({
  baseURL: 'https://terminal-chat-backend-tesla77.onrender.com/api',
  timeout: 10000,
});

export default apiClient;
