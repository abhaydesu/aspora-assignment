import { useState, useEffect, useRef, useCallback } from 'react';

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export interface UseCommentSearchReturn {
  results: Comment[];
  isLoading: boolean;
  error: string | null;
}

let cachedComments: Comment[] | null = null;

export function useCommentSearch(debouncedQuery: string): UseCommentSearchReturn {
  const [results, setResults] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const searchIdRef = useRef(0);

  const fetchComments = useCallback(async (): Promise<Comment[]> => {
    if (cachedComments) return cachedComments;

    const response = await fetch('https://jsonplaceholder.typicode.com/comments');
    if (!response.ok) {
      throw new Error(`Failed to fetch comments (HTTP ${response.status})`);
    }
    const data: Comment[] = await response.json();
    cachedComments = data;
    return data;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      searchIdRef.current += 1; 
      return;
    }

    const currentSearchId = ++searchIdRef.current;

    const runSearch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const comments = await fetchComments();

        if (currentSearchId !== searchIdRef.current) return;

        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        if (currentSearchId !== searchIdRef.current) return;

        const lowerQuery = debouncedQuery.toLowerCase();
        const filtered = comments.filter((c) =>
          c.body.toLowerCase().includes(lowerQuery),
        );

        if (currentSearchId === searchIdRef.current && mountedRef.current) {
          setResults(filtered);
          setIsLoading(false);
        }
      } catch (err) {
        if (currentSearchId === searchIdRef.current && mountedRef.current) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setResults([]);
          setIsLoading(false);
        }
      }
    };

    runSearch();
  }, [debouncedQuery, fetchComments]);

  return { results, isLoading, error };
}
