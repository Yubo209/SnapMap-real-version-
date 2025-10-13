
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '';

if (typeof window !== 'undefined') {
  console.log('[API_BASE]', API_BASE); 
}

 
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}


export async function apiFetch(path, options = {}) {
  const isFormData = options?.body instanceof FormData;
  const tokenHeader = authHeaders();

  const res = await fetch(`${API_BASE}${path}`, {
    
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...tokenHeader,
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}


export function login({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}


export function register({ username, email, password }) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}


export function getMe() {
  return apiFetch('/api/users/me');
}


export function createPost(payload) {
  return apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


export function getPosts() {
  return apiFetch('/api/posts');
}


export function deletePost(postId) {
  return apiFetch(`/api/posts/${postId}`, {
    method: 'DELETE',
  });
}


export function uploadImage(file, folder = 'snapmap/uploads') {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('folder', folder);
  return apiFetch('/api/upload/image', {
    method: 'POST',
    body: fd, 
  });
}


export function updateAvatar(payload) {
  return apiFetch('/api/users/avatar', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


export function getPhotos() {
  return apiFetch('/api/photos');
}
