// server/routes/location.js

const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { normalizeAddressString, getDistanceBetweenCoords } = require('../utils/addressNormalizer');

/**
 * GET /api/locations/by-address?address=xxx
 * 根据地址查询该位置的所有照片
 * 
 * 例：/api/locations/by-address?address=1330%2053st%20rd
 * 返回：{
 *   _id: "...",
 *   address: "1330 53st rd",
 *   posts: [{_id, name, imageUrl, user, ...}, ...],
 *   photoCount: 3
 * }
 */
router.get('/by-address', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: 'address query parameter required' });
    }

    const normalizedAddress = normalizeAddressString(address);
    
    const location = await Location.findOne({ normalizedAddress })
      .populate({
        path: 'posts',
        populate: {
          path: 'user',
          select: 'username avatarUrl'
        }
      });
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    return res.json(location);
  } catch (err) {
    console.error('getLocationByAddress error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/locations/by-coords?lat=xxx&lng=xxx&radius=0.05
 * 根据坐标查询该位置的所有照片（用于地图）
 * 
 * 返回Location对象（已populate所有posts）：
 * {
 *   _id: ObjectId,
 *   address: "1330 53st rd, Chicago, IL",
 *   normalizedAddress: "...",
 *   lat: 41.8235,
 *   lng: -87.6299,
 *   posts: [
 *     { _id, name, description, address, imageUrl, lat, lng, user: {...}, likes, comments },
 *     { ... },
 *     { ... }
 *   ],
 *   photoCount: 3,
 *   createdAt, updatedAt
 * }
 * 
 * MiniCard 显示：posts[0] 的图片
 * BigCard 显示：所有 posts
 */
router.get('/by-coords', async (req, res) => {
  try {
    const { lat, lng, radius = 0.05 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng required' });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius);

    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).json({ message: 'lat and lng must be numbers' });
    }

    // 查找所有 locations，然后用 Haversine 过滤距离
    const allLocations = await Location.find({
      lat: { $exists: true },
      lng: { $exists: true }
    }).populate({
      path: 'posts',
      populate: {
        path: 'user',
        select: 'username avatarUrl'
      }
    });

    if (allLocations.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // 过滤距离在 radius 以内的 locations
    const closestLocations = allLocations.filter(loc => {
      const distance = getDistanceBetweenCoords(latNum, lngNum, loc.lat, loc.lng);
      return distance <= radiusNum;
    });

    if (closestLocations.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // 返回距离最近的 location
    const closest = closestLocations.reduce((nearest, curr) => {
      const currDist = getDistanceBetweenCoords(latNum, lngNum, curr.lat, curr.lng);
      const nearestDist = getDistanceBetweenCoords(latNum, lngNum, nearest.lat, nearest.lng);
      return currDist < nearestDist ? curr : nearest;
    });

    return res.json(closest);
  } catch (err) {
    console.error('getLocationByCoords error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;