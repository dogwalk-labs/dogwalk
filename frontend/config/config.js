// IP 또는 호스트만 바꾸면 아래 base URL들이 함께 적용됩니다.
export const SERVER_HOST = "192.168.0.7";

const API_PORT = 8000;
const POI_SERVICE_PORT = 8080;

export const API_BASE_URL = `http://${SERVER_HOST}:${API_PORT}`;
export const POI_SERVICE_BASE_URL = `http://${SERVER_HOST}:${POI_SERVICE_PORT}`;
