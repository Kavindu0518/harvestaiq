"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Role } from "@prisma/client";
import type { AdminDirectoryUser } from "@/lib/admin-users";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { PasswordInput } from "@/components/password-input";
import {
  PasswordChecklist,
  isPasswordStrong,
} from "@/components/password-checklist";

type StaffRole = Extract<
  Role,
  "FARM_MANAGER" | "AGRONOMIST" | "GREENHOUSE_TECH"
>;

const STAFF_ROLE_OPTIONS: readonly { value: StaffRole; label: string }[] = [
  { value: "FARM_MANAGER", label: "Farm Manager" },
  { value: "AGRONOMIST", label: "Agronomist" },
  { value: "GREENHOUSE_TECH", label: "Greenhouse Technician" },
];

const INDIVIDUAL_GREENHOUSES = ["GH-01", "GH-02", "GH-03", "GH-04"] as const;

function pickRandomChar(charset: string): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return charset[buf[0] % charset.length];
  }
  return charset[Math.floor(Math.random() * charset.length)];
}

function generateStrongPassword(length = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  const chars = [
    pickRandomChar(upper),
    pickRandomChar(lower),
    pickRandomChar(digits),
    pickRandomChar(symbols),
  ];

  while (chars.length < length) {
    chars.push(pickRandomChar(all));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j =
      typeof window !== "undefined" && window.crypto?.getRandomValues
        ? window.crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
        : Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

interface CreateStaffModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: AdminDirectoryUser) => void;
}

export function CreateStaffModal({
  open,
  onClose,
  onCreated,
}: CreateStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>("AGRONOMIST");
  const [password, setPassword] = useState("");
  const [selectedGreenhouses, setSelectedGreenhouses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedPhone = useMemo(() => {
    if (!phone.trim()) return null;
    return normalizeSriLankanPhone(phone);
  }, [phone]);

  const phoneInvalid = phone.trim().length > 0 && !normalizedPhone;
  const allSelected = selectedGreenhouses.includes("ALL");

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  if (!open) {
    return null;
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setRole("AGRONOMIST");
    setPassword("");
    setSelectedGreenhouses([]);
    setErrorMessage(null);
  }

  function handleClose() {
    if (submitting) return;
    resetForm();
    onClose();
  }

  function toggleAllGreenhouses() {
    setSelectedGreenhouses((prev) => (prev.includes("ALL") ? [] : ["ALL"]));
  }

  function toggleIndividualGreenhouse(code: string) {
    setSelectedGreenhouses((prev) => {
      const withoutAll = prev.filter((item) => item !== "ALL");
      if (withoutAll.includes(code)) {
        return withoutAll.filter((item) => item !== code);
      }
      return [...withoutAll, code];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (name.trim().length < 2) {
      setErrorMessage("Full name must be at least 2 characters.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }

    if (phoneInvalid) {
      setErrorMessage(
        "Invalid Sri Lankan phone number. Use 07XXXXXXXX or +947XXXXXXXX."
      );
      return;
    }

    if (!isPasswordStrong(password)) {
      setErrorMessage(
        "Temporary password must satisfy all password strength requirements."
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: normalizedPhone || null,
          role,
          password,
          assignedGreenhouses: selectedGreenhouses,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminDirectoryUser;
      };

      if (!response.ok || !data.user) {
        setErrorMessage(data.error || "Unable to create staff account.");
        return;
      }

      const createdUser = data.user;
      resetForm();
      onCreated(createdUser);
    } catch {
      setErrorMessage("Network error occurred while creating staff account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-staff-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-emerald-100 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-emerald-100 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="create-staff-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Create Staff Account
            </h2>
            <p className="text-xs text-slate-500">
              Creates a PENDING HAIQ-STF account and sends a 24h email
              verification link.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close modal"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6" noValidate>
          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
            >
              {errorMessage}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="staff-name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="staff-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              disabled={submitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nimali Jayawardena"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="staff-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="staff-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                disabled={submitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@harvestaiq.lk"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="staff-phone"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Phone <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="staff-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                disabled={submitting}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0771234567"
                aria-invalid={phoneInvalid}
                className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 sm:text-sm ${
                  phoneInvalid
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20"
                }`}
              />
              {phoneInvalid ? (
                <p className="mt-1 text-xs text-rose-600">
                  Use 07XXXXXXXX or +947XXXXXXXX.
                </p>
              ) : normalizedPhone ? (
                <p className="mt-1 text-xs text-emerald-700">
                  Normalized: <span className="font-mono">{normalizedPhone}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label
              htmlFor="staff-role"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Staff role
            </label>
            <select
              id="staff-role"
              name="role"
              disabled={submitting}
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-100 sm:text-sm"
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="staff-password"
                className="block text-sm font-medium text-slate-700"
              >
                Temporary password
              </label>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPassword(generateStrongPassword())}
                className="inline-flex min-h-[44px] items-center rounded-lg px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer"
              >
                Generate Strong Password
              </button>
            </div>
            <PasswordInput
              id="staff-password"
              name="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Set a temporary strong password"
              disabled={submitting}
            />
            <PasswordChecklist password={password} />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Assigned greenhouses
            </span>
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors select-none ${
                  allSelected
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAllGreenhouses}
                  disabled={submitting}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span>ALL Greenhouses</span>
              </label>

              {INDIVIDUAL_GREENHOUSES.map((gh) => {
                const checked = !allSelected && selectedGreenhouses.includes(gh);
                return (
                  <label
                    key={gh}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors select-none ${
                      allSelected
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : checked
                        ? "cursor-pointer border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:bg-emerald-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={submitting || allSelected}
                      onChange={() => toggleIndividualGreenhouse(gh)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 disabled:opacity-50"
                    />
                    <span>{gh}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {allSelected
                ? "ALL grants access across all current and future greenhouses."
                : "Select individual greenhouse bays or choose ALL."}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating Staff Account..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
