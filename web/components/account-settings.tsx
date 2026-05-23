"use client";

import { useAuth } from "@clerk/nextjs";
import { Check, Copy, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountSettingsSkeleton } from "@/components/account-settings-skeleton";
import { useRegistryProfile } from "@/components/registry-profile-provider";
import {
  normalizeRegistryUsername,
  validateRegistryUsername,
} from "@/lib/registry-username";

type ApiKeyCreated = {
  token: string;
  prefix: string;
  name?: string;
};

type ApiKeyListItem = {
  id: string;
  prefix: string;
  name: string;
  created_at: string;
};

export function AccountSettings() {
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "username";
  const { isSignedIn } = useAuth();
  const { me, loading, needsUsername, refresh } = useRegistryProfile();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [issuedKey, setIssuedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setUsername(me?.username ?? "");
  }, [me?.username]);

  const loadKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/registry/api-keys");
      const data = (await res.json()) as ApiKeyListItem[] & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load API keys");
      }
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && !needsUsername && !loading) {
      void loadKeys();
    }
  }, [isSignedIn, needsUsername, loading, loadKeys]);

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
    setIssuedKey(null);
    setCopied(false);
    try {
      const name = keyLabel.trim() || "wallbit-cli";
      const res = await fetch("/api/registry/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as ApiKeyCreated & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create API key");
      }
      setIssuedKey(data);
      await loadKeys();
      toast.success("Copy your key now — it won't be shown again");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeKey = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/registry/api-keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.status === 404) {
        throw new Error("Key not found");
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to revoke key");
      }
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyIssuedKey = async () => {
    if (!issuedKey) return;
    try {
      await navigator.clipboard.writeText(issuedKey.token);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy — select the key and copy manually");
    }
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
        <h2 className="text-subheading text-ink-black">wallbit-cli</h2>
        {needsUsername ? (
          <p className="text-sm text-slate-gray">
            Set your username first, then manage CLI keys here.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-gray">
              Keys for{" "}
              <span className="font-mono text-stone-gray">wallbit-cli</span> only.
              The full secret is shown once when you create a key.
            </p>

            <CliKeyList
              keys={keys}
              loading={loadingKeys}
              revokingId={revokingId}
              onRevoke={(id) => void revokeKey(id)}
            />

            {issuedKey ? (
              <CliKeyReveal
                issuedKey={issuedKey}
                copied={copied}
                onCopy={() => void copyIssuedKey()}
                onDismiss={() => {
                  setIssuedKey(null);
                  setCopied(false);
                }}
              />
            ) : (
              <CliKeyIssueForm
                keyLabel={keyLabel}
                creatingKey={creatingKey}
                onKeyLabelChange={setKeyLabel}
                onSubmit={() => void createApiKey()}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CliKeyList({
  keys,
  loading,
  revokingId,
  onRevoke,
}: {
  keys: ApiKeyListItem[];
  loading: boolean;
  revokingId: string | null;
  onRevoke: (id: string) => void;
}) {
  if (loading) {
    return (
      <p className="text-sm text-silver-mist" aria-live="polite">
        Loading keys…
      </p>
    );
  }

  if (keys.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-cloud-canvas rounded-lg border border-cloud-canvas">
      {keys.map((key) => {
        const label = key.name?.trim() || "wallbit-cli";
        const created = new Date(key.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const revoking = revokingId === key.id;

        return (
          <li
            key={key.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
          >
            <div className="min-w-0 stack-sm">
              <span className="font-medium text-ink-black">{label}</span>
              <span className="font-mono text-xs text-stone-gray">
                {key.prefix}… · {created}
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost shrink-0 px-3 py-1.5 text-xs text-slate-gray hover:text-ink-black"
              disabled={revoking || revokingId !== null}
              onClick={() => onRevoke(key.id)}
            >
              {revoking ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                "Revoke"
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CliKeyIssueForm({
  keyLabel,
  creatingKey,
  onKeyLabelChange,
  onSubmit,
}: {
  keyLabel: string;
  creatingKey: boolean;
  onKeyLabelChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="stack-sm pt-1">
      <label className="stack-sm text-sm">
        <span className="text-caption text-slate-gray">Label (optional)</span>
        <input
          type="text"
          value={keyLabel}
          onChange={(e) => onKeyLabelChange(e.target.value)}
          className="input-field"
          placeholder="laptop, ci, …"
          maxLength={64}
          disabled={creatingKey}
        />
      </label>

      <button
        type="button"
        className="btn-primary inline-flex w-fit items-center gap-2"
        onClick={onSubmit}
        disabled={creatingKey}
      >
        {creatingKey && (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        )}
        {creatingKey ? "Creating…" : "Create key"}
      </button>
    </div>
  );
}

function CliKeyReveal({
  issuedKey,
  copied,
  onCopy,
  onDismiss,
}: {
  issuedKey: ApiKeyCreated;
  copied: boolean;
  onCopy: () => void;
  onDismiss: () => void;
}) {
  const label = issuedKey.name?.trim() || "wallbit-cli";

  return (
    <div className="rounded-lg border border-pale-sienna bg-ink-black/5 p-4 stack-sm">
      <p className="text-sm text-slate-gray">
        Copy into your CLI config — won&apos;t show again.
      </p>
      <p className="text-caption text-slate-gray">{label}</p>
      <code className="block break-all font-mono text-xs text-ink-black">
        {issuedKey.token}
      </code>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2 text-sm"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {copied ? "Copied" : "Copy key"}
        </button>
        <button type="button" className="btn-ghost text-sm" onClick={onDismiss}>
          Done
        </button>
      </div>
    </div>
  );
}
