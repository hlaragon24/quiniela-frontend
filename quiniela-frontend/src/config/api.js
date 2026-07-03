export const API = import.meta.env.VITE_API_URL;

if (!API) {
  console.warn("VITE_API_URL no está definida. Las peticiones al servidor fallarán.");
}

let _onUnauthorized = null;

export const setOnUnauthorized = (cb) => {
  _onUnauthorized = cb;
};

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401 && _onUnauthorized) {
    _onUnauthorized();
  }
  return res;
}
