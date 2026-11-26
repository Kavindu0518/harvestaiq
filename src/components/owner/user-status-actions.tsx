"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Lock,
  MoreHorizontal,
  PauseCircle,
  PowerOff,
} from "lucide-react";
import type { AccountStatus } from "@prisma/client";
import type { AdminDirectoryUser } from "@/lib/admin-users";

export type ManageableStatus = Extract<
  AccountStatus,
  "ACTIVE" | "SUSPENDED" | "INACTIVE"
>;

interface UserStatusActionsProps {
  user: AdminDirectoryUser;
  currentUserId: string;
  updatingUserId: string | null;
  onRequestStatusChange: (
    user: AdminDirectoryUser,
    nextStatus: ManageableStatus
  ) => void;
}

export function UserStatusActions({
  user,
  currentUserId,
  updatingUserId,
  onRequestStatusChange,
}: UserStatusActionsProps) {
  const isSelf = user.id === currentUserId;
  const isUpdating = updatingUserId === user.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleScrollOrResize() {
      setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [menuOpen]);

  if (isSelf) {
    return (
      <button
        type="button"
        disabled
        title="You cannot suspend or deactivate your own owner account"
        aria-label="Current owner account protected"
        className="inline-flex min-h-[44px] min-w-[44px] cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2.5 text-xs font-medium text-slate-400"
      >
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="lg:hidden">Protected</span>
      </button>
    );
  }

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 196;
      const estimatedHeight = 148;
      const openUpward = rect.bottom + estimatedHeight > window.innerHeight - 16;
      const top = openUpward
        ? Math.max(12, rect.top - estimatedHeight)
        : rect.bottom + 6;
      const left = Math.max(
        12,
        Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 12)
      );
      setMenuCoords({ top, left });
    }

    setMenuOpen(true);
  }

  function handleSelect(status: ManageableStatus) {
    setMenuOpen(false);
    onRequestStatusChange(user, status);
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        disabled={isUpdating}
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Manage account status for ${user.name}`}
        className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>

      {menuOpen && menuCoords ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Status actions for ${user.name}`}
          style={{ top: menuCoords.top, left: menuCoords.left }}
          className="fixed z-50 w-[196px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5"
        >
          {user.accountStatus !== "ACTIVE" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("ACTIVE")}
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
            >
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>Activate Account</span>
            </button>
          ) : null}

          {user.accountStatus !== "SUSPENDED" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("SUSPENDED")}
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-800 hover:bg-amber-50 cursor-pointer"
            >
              <PauseCircle
                className="h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <span>Suspend Account</span>
            </button>
          ) : null}

          {user.accountStatus !== "INACTIVE" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => handleSelect("INACTIVE")}
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 cursor-pointer"
            >
              <PowerOff
                className="h-4 w-4 shrink-0 text-rose-600"
                aria-hidden="true"
              />
              <span>Deactivate Account</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
