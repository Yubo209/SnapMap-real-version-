const { v2: cloudinary } = require('cloudinary');

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const api_key = process.env.CLOUDINARY_API_KEY?.trim();
const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

console.log('🔍 Cloudinary config check:');
console.log('cloud_name:', cloud_name ? '✅ SET' : '❌ MISSING');
console.log('api_key:', api_key ? '✅ SET' : '❌ MISSING');
console.log('api_secret:', api_secret ? '✅ SET' : '❌ MISSING');

if (!cloud_name || !api_key || !api_secret) {
  console.error('❌ Cloudinary 环境变量不完整！');
  console.error('需要设置: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({ cloud_name, api_key, api_secret });

module.exports = cloudinary;