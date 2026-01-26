"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export default function AuthRefreshOnSignIn() {
  const { isLoaded, isSignedIn } = useUser();
  const reloaded = useRef(false);

  useEffect(() => {
    if (reloaded.current) return;
    
    let timeoutId: NodeJS.Timeout;

    if (isLoaded && isSignedIn) {
      // Poll the server to confirm the session cookie is visible to server-side code.
      let attempts = 0;
      const maxAttempts = 4;

      const checkServerAuth = async () => {
        attempts += 1;
        try {
          const res = await fetch('/api/auth/check');
          const data = await res.json();
          
          if (data?.signedIn) {
            reloaded.current = true;
            // Replace location to avoid adding history entries
            window.location.replace(window.location.href);
            return;
          }
        } catch {
          // Error variable 'e' removed to satisfy @typescript-eslint/no-unused-vars
          // ignore and retry
        }

        if (attempts < maxAttempts) {
          timeoutId = setTimeout(checkServerAuth, 700);
        }
      };

      checkServerAuth();
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoaded, isSignedIn]);

  return null;
}