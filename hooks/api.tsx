import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.radar.io/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'prj_live_sk_5c0ef8c2755aefb837e398da83aad8062c57aa6b', // Reemplaza con tu API key
  },
});

export default api;
