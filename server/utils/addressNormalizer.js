// server/utils/addressNormalizer.js

/**
 * 标准化地址字符串
 * "1330 53st rd, chicago, il, 60615" → "1330 53st rd chicago il 60615"
 * 目的：使不同表述的同一地址能匹配
 */
function normalizeAddressString(address) {
  if (!address) return '';
  
  return address
    .toLowerCase()              // 小写
    .trim()                     // 去前后空格
    .replace(/[,\.]/g, '')      // 去掉逗号、句号
    .replace(/\s+/g, ' ')       // 多个空格转单个
    .split(' ')                 // 拆成单词
    .sort()                     // 排序（顺序不同也能匹配）
    .join(' ');                 // 重新组合
}

/**
 * 计算两点间距离（km）
 * 使用 Haversine 公式，准确计算地球表面两点距离
 */
function getDistanceBetweenCoords(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径（km）
  
  // 转换为弧度
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  // Haversine 公式
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

module.exports = {
  normalizeAddressString,
  getDistanceBetweenCoords,
};