import { useState } from "react";
import { uploadImage, createPost } from "../../../api"; 


export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  
  const submitPost = async ({ name, description, address, image }) => {
    if (!image) {
      throw new Error("Please select an image.");
    }

    setLoading(true);
    setError(null);

    let lat = null, lng = null;

    
    try {
      if (address) {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            address
          )}`
        );
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }
    } catch (geoErr) {
      console.error("Geocoding failed:", geoErr);
      setLoading(false);
      setError(new Error("Failed to resolve address to coordinates."));
      throw geoErr;
    }

    
    try {
      const up = await uploadImage(image); 

      await createPost({
        name,
        description,
        address,
        imageUrl: up.url,
        imagePublicId: up.public_id,
        lat,
        lng,
      });

      setLoading(false);
      return true; 
    } catch (err) {
      console.error("Create post failed:", err);
      setError(err);
      setLoading(false);
      throw err;
    }
  };

  return { submitPost, loading, error };
}