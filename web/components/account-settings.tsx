"use client";

import { useAuth } from "@clerk/nextjs";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountSettingsSkeleton } from "@/components/account-settings-skeleton";
import {
  CreateCliKeyDialog,
  type ApiKeyCreated,
} from "@/components/create-cli-key-dialog";
import { IconTooltipButton } from "@/components/icon-tooltip-button";
import { useRegistryProfile } from "@/components/registry-profile-provider";
import {
  forgetIssuedKeyToken,
  getIssuedKeyToken,
  rememberIssuedKeyToken,
} from "@/lib/cli-issued-keys";
import {
  normalizeRegistryUsername,
  validateRegistryUsername,
} from "@/lib/registry-username";

type ApiKeyListItem = {
  id: string;
  prefix: string;
  name: string;
  created_at: string;
};

function maskPrefix(prefix: string) {
  return `${prefix}…`;
}

export function AccountSettings() {
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "username";
  const { isSignedIn } = useAuth();
  const { me, loading, needsUsername, refresh } = useRegistryProfile();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      const revoked = keys.find((k) => k.id === id);
      forgetIssuedKeyToken({ id, prefix: revoked?.prefix ?? "" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async (key: ApiKeyListItem) => {
    const token = getIssuedKeyToken({ id: key.id, prefix: key.prefix });
    if (!token) {
      toast.error("Full key not available", {
        description:
          "Create a new key in this browser, or use a key you saved when you created it.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      setCopiedId(key.id);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const onKeyCreated = (key: ApiKeyCreated) => {
    rememberIssuedKeyToken(key.token, { id: key.id, prefix: key.prefix });
    void loadKeys();
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
          This username is public. Every workflow URL starts with it:{" "}
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
              autoComplete="off"
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
        <div className="flex items-start justify-between gap-3">
          <div className="stack-sm min-w-0">
            <h2 className="text-subheading text-ink-black">wallbit-cli</h2>
            <p className="text-sm text-slate-gray">
              CLI keys only. Prefix shown here; copy uses the full secret saved
              in this browser when you created the key.
            </p>
          </div>
          {!needsUsername && (
            <button
              type="button"
              className="btn-primary inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm"
              onClick={() => setCreateKeyOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Create key
            </button>
          )}
        </div>

        {needsUsername ? (
          <p className="text-sm text-slate-gray">
            Set your username first.
          </p>
        ) : (
          <CliKeyList
            keys={keys}
            loading={loadingKeys}
            revokingId={revokingId}
            copiedId={copiedId}
            onCopy={(key) => void copyKey(key)}
            onRevoke={(id) => void revokeKey(id)}
          />
        )}
      </section>

      <CreateCliKeyDialog
        open={createKeyOpen}
        onClose={() => setCreateKeyOpen(false)}
        onCreated={onKeyCreated}
      />
    </div>
  );
}

function CliKeyList({
  keys,
  loading,
  revokingId,
  copiedId,
  onCopy,
  onRevoke,
}: {
  keys: ApiKeyListItem[];
  loading: boolean;
  revokingId: string | null;
  copiedId: string | null;
  onCopy: (key: ApiKeyListItem) => void;
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
    return (
      <p className="text-sm text-silver-mist">
        No keys yet. Create one for{" "}
        <span className="font-mono text-stone-gray">wallbit-cli</span>.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-cloud-canvas rounded-lg border border-cloud-canvas">
      {keys.map((key) => {
        const title = key.name?.trim() || "wallbit-cli";
        const created = new Date(key.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const busy = revokingId !== null;
        const revoking = revokingId === key.id;
        const copied = copiedId === key.id;
        return (
          <li
            key={key.id}
            className="flex items-center justify-between gap-2 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-black">
                {title}
              </p>
              <p className="truncate font-mono text-xs text-stone-gray">
                {maskPrefix(key.prefix)}{" "}
                <span className="font-sans text-silver-mist">· {created}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconTooltipButton
                tooltip={copied ? "Copied" : "Copy key"}
                hideTooltip={copied}
                disabled={busy}
                onClick={() => onCopy(key)}
              >
                <Copy className="size-4" aria-hidden />
              </IconTooltipButton>
              <IconTooltipButton
                tooltip="Revoke key"
                disabled={busy}
                className="text-slate-gray hover:text-fire-orange"
                onClick={() => onRevoke(key.id)}
              >
                {revoking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-4" aria-hidden />
                )}
              </IconTooltipButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
