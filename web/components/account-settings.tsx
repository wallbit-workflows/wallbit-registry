"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  clearRegistryApiKey,
  getRegistryApiKey,
  setRegistryApiKey,
} from "@/lib/registry-auth";

type Me = {
  id: string;
  username?: string;
};

type ApiKeyResponse = {
  token: string;
  prefix: string;
  name?: string;
};

export function AccountSettings() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/registry/me");
      const data = (await res.json()) as Me & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load profile");
      }
      setMe(data);
      setUsername(data.username ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
    setStoredKey(getRegistryApiKey());
  }, [loadProfile]);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = username.trim();
    if (!value) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/registry/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = (await res.json()) as Me & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update username");
      }
      setMe(data);
      toast.success("Username saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const createApiKey = async () => {
    setCreatingKey(true);
    setNewKey(null);
    try {
      const res = await fetch("/api/registry/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "wallbit-cli" }),
      });
      const data = (await res.json()) as ApiKeyResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create API key");
      }
      setNewKey(data.token);
      setRegistryApiKey(data.token);
      setStoredKey(data.token);
      toast.success("Registry API key created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  };

  const clearStoredKey = () => {
    clearRegistryApiKey();
    setStoredKey(null);
    toast.success("Removed key from this browser");
  };

  if (loading) {
    return (
      <p className="text-sm text-slate-gray">Loading your account…</p>
    );
  }

  return (
    <div className="stack-lg max-w-lg">
      <section className="feature-card stack-sm">
        <h2 className="text-subheading text-ink-black">Profile</h2>
        <p className="text-sm text-slate-gray">
          Your username is used in workflow URLs (
          <span className="font-mono text-stone-gray">username/slug</span>).
        </p>
        <form onSubmit={(e) => void saveUsername(e)} className="stack-sm">
          <label className="stack-sm">
            <span className="text-caption text-slate-gray">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field font-mono"
              placeholder="jeremyjsx"
              autoComplete="username"
            />
          </label>
          <button
            type="submit"
            className="btn-primary w-fit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save username"}
          </button>
        </form>
        {me?.id && (
          <p className="text-xs text-silver-mist">
            Account ID: <span className="font-mono">{me.id}</span>
          </p>
        )}
      </section>

      <section className="feature-card stack-sm">
        <h2 className="text-subheading text-ink-black">Registry API key</h2>
        <p className="text-sm text-slate-gray">
          Use this key with{" "}
          <span className="font-mono text-ink-black">wallbit-cli</span> and when
          publishing from Workflow Studio. Shown once when created.
        </p>

        {newKey && (
          <div className="rounded-lg border border-pale-sienna bg-paper-white p-4 stack-sm">
            <p className="text-caption text-slate-gray">Copy now — won&apos;t show again</p>
            <code className="block break-all font-mono text-xs text-ink-black">
              {newKey}
            </code>
            <button
              type="button"
              className="btn-ghost w-fit text-sm"
              onClick={() => {
                void navigator.clipboard.writeText(newKey);
                toast.success("Copied to clipboard");
              }}
            >
              Copy key
            </button>
          </div>
        )}

        {storedKey && !newKey && (
          <p className="text-sm text-stone-gray">
            A key is saved in this browser (
            <span className="font-mono">{storedKey.slice(0, 12)}…</span>).
          </p>
        )}

        <div className="flex flex-wrap gap-element">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void createApiKey()}
            disabled={creatingKey}
          >
            {creatingKey ? "Creating…" : "Create new API key"}
          </button>
          {storedKey && (
            <button
              type="button"
              className="btn-ghost"
              onClick={clearStoredKey}
            >
              Clear from browser
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
