import { useCallback, useEffect, useState } from "react";
import { getPosts } from "../../../api";

export function usePosts() {
  const [posts,     setPosts]   = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error,     setError]   = useState(null);
  const [tick,      setTick]    = useState(0); // bump to re-fetch

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let ignore = false;

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPosts();
        if (ignore) return;
        setPosts(data || []);
        setLoading(false);
      } catch (err) {
        if (ignore) return;
        console.error("Failed to load posts:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchPosts();
    return () => { ignore = true; };
  }, [tick]); // re-runs when tick changes

  return { posts, isLoading, error, refresh };
}