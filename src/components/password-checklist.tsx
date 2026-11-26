"use client";

export interface PasswordRuleResult {
  key: string;
  label: string;
  met: boolean;
}

export function evaluatePasswordRules(password: string): PasswordRuleResult[] {
  return [
    { key: "length", label: "At least 8 characters", met: password.length >= 8 },
    { key: "upper", label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { key: "lower", label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { key: "digit", label: "One number (0-9)", met: /[0-9]/.test(password) },
    {
      key: "special",
      label: "One special character (!@#$...)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return evaluatePasswordRules(password).every((rule) => rule.met);
}

export function PasswordChecklist({ password }: { password: string }) {
  const rules = evaluatePasswordRules(password);
  const score = rules.filter((r) => r.met).length;

  const strengthLabel =
    score === 0
      ? "Enter a password"
      : score <= 2
      ? "Weak"
      : score <= 4
      ? "Fair"
      : "Strong";

  const barColor =
    score <= 2
      ? "bg-rose-500"
      : score <= 4
      ? "bg-amber-500"
      : "bg-emerald-600";

  return (
    <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-600">Password strength</span>
        <span
          className={
            score === 5
              ? "text-emerald-700"
              : score >= 3
              ? "text-amber-700"
              : "text-slate-500"
          }
        >
          {strengthLabel}
        </span>
      </div>
      <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all duration-200 ${barColor}`}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 ${
              rule.met ? "text-emerald-700 font-medium" : "text-slate-500"
            }`}
          >
            <span
              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                rule.met
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-500"
              }`}
              aria-hidden="true"
            >
              {rule.met ? "✓" : "•"}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
