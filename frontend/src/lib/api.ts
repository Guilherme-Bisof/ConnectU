const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (!configuredApiUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_URL não está configurada. Defina a URL base da API no ambiente do frontend.",
  );
}

export const API_URL = normalizeBaseUrl(configuredApiUrl);

export const SOCKET_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL,
);

export const apiEndpoint = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedPath ? `${API_URL}/${normalizedPath}` : API_URL;
};
