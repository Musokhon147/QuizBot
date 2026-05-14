import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  fetchAllAdminUsers,
  setUserRoleApi,
  haptic,
  type AdminUser,
  type UserRole,
  type TgUser,
} from "../lib/api.ts";

interface Props {
  user: TgUser;
}

const ROLE_LABEL: Record<UserRole, string> = {
  user: "User",
  admin: "Admin",
  private_admin: "Private Admin",
  super_admin: "Super Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  user: "bg-glass text-muted border-divider",
  admin: "bg-accent/15 text-accent-light border-accent/30",
  private_admin: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  super_admin: "bg-coral/15 text-coral border-coral/30",
};

const ROLE_OPTIONS: UserRole[] = ["user", "admin", "private_admin", "super_admin"];

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function AdminPanel({ user }: Props) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const actor = user.id.toString();

  useEffect(() => {
    fetchAllAdminUsers(actor)
      .then(setUsers)
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load users");
      })
      .finally(() => setLoading(false));
  }, [actor]);

  const handleRoleChange = async (target: AdminUser, newRole: UserRole) => {
    if (newRole === target.role) {
      setEditing(null);
      return;
    }
    setSaving(true);
    haptic("medium");
    try {
      const updated = await setUserRoleApi(actor, target.telegram_id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.telegram_id === updated.telegram_id ? { ...u, role: updated.role } : u))
      );
      toast.success(`Role updated to ${ROLE_LABEL[newRole]}`);
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message?.split(" ").slice(1).join(" ") || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.telegram_id.includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: users.length,
    super: users.filter((u) => u.role === "super_admin").length,
    admins: users.filter((u) => u.role === "admin").length,
    private: users.filter((u) => u.role === "private_admin").length,
  };

  return (
    <div className="px-5 pt-8 pb-24 max-w-lg mx-auto min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-xs text-muted mt-1">
          Manage who can upload tests and who sees what
        </p>
      </motion.div>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card rounded-2xl p-3 mb-5 grid grid-cols-4 gap-2"
      >
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Super", value: stats.super, color: "text-coral" },
          { label: "Admin", value: stats.admins, color: "text-accent-light" },
          { label: "Private", value: stats.private, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username, or ID…"
          className="w-full rounded-2xl px-4 py-3 bg-glass border border-divider text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-accent transition-colors"
        />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 rounded-full border-[3px] border-accent/20 border-t-accent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center text-muted text-sm">
          No users match
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u, i) => {
            const isSelf = u.telegram_id === actor;
            return (
              <motion.button
                key={u.telegram_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                onClick={() => {
                  haptic("light");
                  setEditing(u);
                }}
                className="w-full card card-hover rounded-2xl p-3.5 flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/30 to-mint/30 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  {(u.name || u.username || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.name || u.username || `User ${u.telegram_id}`}
                    {isSelf && <span className="ml-2 text-[10px] text-accent-light">(you)</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted font-mono">{u.telegram_id}</span>
                    <span className="w-1 h-1 rounded-full bg-muted/30" />
                    <span className="text-[11px] text-muted">
                      {timeAgo(u.last_active)}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${ROLE_COLOR[u.role]}`}>
                  {ROLE_LABEL[u.role]}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Role-change sheet */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setEditing(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50"
            >
              <div className="bg-bg border-t border-divider rounded-t-3xl shadow-2xl">
                <div className="max-w-lg mx-auto px-5 pt-4 pb-8">
                  <div className="w-10 h-1 rounded-full bg-muted/30 mx-auto mb-4" />
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground text-lg">
                      {editing.name || editing.username || `User ${editing.telegram_id}`}
                    </h3>
                    <p className="text-xs text-muted font-mono mt-0.5">{editing.telegram_id}</p>
                    <p className="text-xs text-muted mt-2">
                      Current: <span className="font-semibold text-foreground">{ROLE_LABEL[editing.role]}</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted uppercase tracking-wider mb-2 font-semibold">
                    Change role to:
                  </p>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((role) => {
                      const isCurrent = role === editing.role;
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(editing, role)}
                          disabled={saving || isCurrent}
                          className={`w-full text-left rounded-2xl p-4 border transition-all ${
                            isCurrent
                              ? "card border-accent/50 ring-2 ring-accent/30"
                              : "card border-divider hover:border-accent/30"
                          } ${saving ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {ROLE_LABEL[role]}
                              </p>
                              <p className="text-[11px] text-muted mt-0.5">
                                {role === "user" && "Can take tests"}
                                {role === "admin" && "Can upload public tests"}
                                {role === "private_admin" && "Uploads are private (only they see)"}
                                {role === "super_admin" && "Full power + manage users"}
                              </p>
                            </div>
                            {isCurrent && (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setEditing(null)}
                    disabled={saving}
                    className="btn-ghost w-full mt-4"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
