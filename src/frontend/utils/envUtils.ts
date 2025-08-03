export const API_HOST = process.env.API_HOST || "localhost";
export const API_PROTOCOl = process.env.API_PROTOCOL || "http";
export const API_PORT = process.env.API_PORT || "5112";


export const API_BASE_URL = `${API_PROTOCOl}://${API_HOST}:${API_PORT}`
export const WEBSOCKET_BASE_URL = `ws://${API_HOST}:${API_PORT}`;