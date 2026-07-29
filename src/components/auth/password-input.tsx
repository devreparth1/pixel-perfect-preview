import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function PasswordInput({ label, value, onChange, placeholder, error }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="relative mt-2">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border ${error ? "border-destructive/60" : "border-white/10"} bg-white/[0.03] px-4 py-3 pr-11 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </label>
  );
}