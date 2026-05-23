"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountSettingsSkeleton } from "@/components/account-settings-skeleton";
import { useRegistryProfile } from "@/components/registry-profile-provider";
import {
  clearRegistryApiKey,
  getRegistryApiKey,
  setRegistryApiKey,
} from "@/lib/registry-auth";
import {
  normalizeRegistryUsername,
  validateRegistryUsername,
} from "@/lib/registry-username";

type ApiKeyResponse = {
  token: string;
  prefix: string;
  name?: string;
};

export function AccountSettings() {
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "username";
  const { me, loading, needsUsername, refresh } = useRegistryProfile();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [storedKey, setStoredKey] = useState<string | null>(null);

  useEffect(() => {
    setUsername(me?.username ?? "");
  }, [me?.username]);

  useEffect(() => {
    setStoredKey(getRegistryApiKey());
  }, []);

  const savedUsername = me?.username ?? "";
  const normalizedInput = normalizeRegistryUsername(username);
  const usernameDirty =
    normalizedInput !== normalizeRegistryUsername(savedUsername);

  const saveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateRegistryUsername(normalizedInput);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!needsUsername && !usernameDirty) return;

    setSaving(true);
    try {
      const res = await fetch("/api/registry/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedInput }),
      });
      const data = (await res.json()) as { username?: string; error?: string };
      if (res.status === 409) {
        throw new Error("That username is already taken");
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update username");
      }
      await refresh();
      toast.success(
        savedUsername ? "Username updated" : "Username saved",
      );
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
    return <AccountSettingsSkeleton />;
  }

  const saveLabel = needsUsername
    ? "Continue"
    : savedUsername
      ? "Update username"
      : "Save username";

  return (
    <div className="stack-lg max-w-lg">
      <section
        className={
          needsUsername
            ? "feature-card stack-sm border-2 border-fire-orange/30"
            : "feature-card stack-sm"
        }
      >
        <h2 className="text-subheading text-ink-black">
          {needsUsername
            ? setupMode
              ? "Welcome — pick a username"
              : "Username required"
            : "Profile"}
        </h2>
        <p className="text-sm text-slate-gray">
          Your public handle on the registry. Workflow URLs use{" "}
          <span className="font-mono text-stone-gray">username/slug</span>.
        </p>
        {savedUsername && usernameDirty && (
          <p className="text-sm text-slate-gray">
            Changing your username updates your workflow URLs. Old links with{" "}
            <span className="font-mono text-stone-gray">{savedUsername}/…</span>{" "}
            will no longer work.
          </p>
        )}
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
              autoFocus={needsUsername}
              required
              minLength={3}
              maxLength={32}
              spellCheck={false}
            />
          </label>
          <button
            type="submit"
            className="btn-primary inline-flex w-fit items-center gap-2"
            disabled={saving || (!needsUsername && !usernameDirty)}
          >
            {saving && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />}
            {saving ? "Saving…" : saveLabel}
          </button>
        </form>
        {me?.id && (
          <p className="text-xs text-silver-mist">
            Account ID: <span className="font-mono">{me.id}</span>
          </p>
        )}
      </section>

      <section
        className={`feature-card stack-sm ${needsUsername ? "opacity-50 pointer-events-none" : ""}`}
        aria-hidden={needsUsername}
      >
        <h2 className="text-subheading text-ink-black">Registry API key</h2>
        {needsUsername ? (
          <p className="text-sm text-slate-gray">
            Set your username first, then create an API key for wallbit-cli.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-gray">
              Use this key with{" "}
              <span className="font-mono text-ink-black">wallbit-cli</span> and
              when publishing from Workflow Studio. Shown once when created.
            </p>

            {newKey && (
              <div className="rounded-lg border border-pale-sienna bg-paper-white p-4 stack-sm">
                <p className="text-caption text-slate-gray">
                  Copy now — won&apos;t show again
                </p>
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
                className="btn-primary inline-flex items-center gap-2"
                onClick={() => void createApiKey()}
                disabled={creatingKey}
              >
                {creatingKey && (
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                )}
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
          </>
        )}
      </section>
    </div>
  );
}
