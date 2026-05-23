"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RegistryMe = {
  id: string;
  username?: string;
};

type RegistryProfileContextValue = {
  me: RegistryMe | null;
  loading: boolean;
  needsUsername: boolean;
  refresh: () => Promise<void>;
};

const RegistryProfileContext =
  createContext<RegistryProfileContextValue | null>(null);

export function RegistryProfileProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [me, setMe] = useState<RegistryMe | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setMe(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/registry/me");
      const data = (await res.json()) as RegistryMe & { error?: string };
      if (!res.ok) {
        setMe(null);
        return;
      }
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  const needsUsername = Boolean(
    isSignedIn && !loading && me && !me.username,
  );

  const value = useMemo(
    () => ({ me, loading: !isLoaded || loading, needsUsername, refresh }),
    [me, isLoaded, loading, needsUsername, refresh],
  );

  return (
    <RegistryProfileContext.Provider value={value}>
      {children}
    </RegistryProfileContext.Provider>
  );
}

export function useRegistryProfile() {
  const ctx = useContext(RegistryProfileContext);
  if (!ctx) {
    throw new Error("useRegistryProfile must be used within RegistryProfileProvider");
  }
  return ctx;
}
