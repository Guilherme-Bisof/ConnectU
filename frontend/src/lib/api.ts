const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://connectu-gd1z.onrender.com";

export const API_URL = normalizeBaseUrl(configuredApiUrl);

export const SOCKET_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL,
);

export const apiEndpoint = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedPath ? `${API_URL}/${normalizedPath}` : API_URL;
};
