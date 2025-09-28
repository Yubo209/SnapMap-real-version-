// src/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;

// 取本地 token（如未登录则不带）
function authHeaders() {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/** 上传图片到后端 /api/upload/image → Cloudinary
 * @param {File} file - 选择的图片文件
 * @param {string} folder - 云端文件夹（可选）
 * @returns {Promise<{url: string, public_id: string}>}
 */
export async function uploadImage(file, folder = 'snapmap/uploads') {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('folder', folder);

  const res = await fetch(`${API_BASE}/api/upload/image`, {
    method: 'POST',
    headers: { ...authHeaders() }, // 上传如不需要鉴权可删掉
    body: fd
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Upload failed'));
  return res.json();
}

/** 创建帖子（后端要求 imageUrl + imagePublicId） */
export async function createPost(payload) {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Create post failed'));
  return res.json();
}

/** 获取全部帖子（AllSpots 用） */
export async function getPosts() {
  const res = await fetch(`${API_BASE}/api/posts`);
  if (!res.ok) throw new Error(await res.text().catch(() => 'Fetch posts failed'));
  return res.json();
}

/** 获取当前用户资料 + 我的帖子（/api/users/me） */
export async function getMe() {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Fetch profile failed'));
  return res.json();
}

/** 更新头像（需要先 uploadImage） */
export async function updateAvatar(payload /* {avatarUrl, avatarPublicId} */) {
  const res = await fetch(`${API_BASE}/api/users/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Update avatar failed'));
  return res.json();
}

/** （可选）获取所有 photos（如果你保留了 /api/photos GET） */
export async function getPhotos() {
  const res = await fetch(`${API_BASE}/api/photos`);
  if (!res.ok) throw new Error(await res.text().catch(() => 'Fetch photos failed'));
  return res.json();
}

/** 删除帖子（仅作者可删） */
export async function deletePost(postId) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Delete post failed'));
  return res.json(); // { ok: true }
}
