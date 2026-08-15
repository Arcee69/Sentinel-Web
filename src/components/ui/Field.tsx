import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/format";

const CONTROL =
  "w-full rounded-sm border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground/70 " +
  "transition-colors focus:outline-2 focus:outline-offset-0 focus:outline-ring disabled:opacity-60";

interface WrapperProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; invalid: boolean; describedBy?: string }) => ReactNode;
  /** Rendered on the label row, e.g. a "Forgot?" link. */
  action?: ReactNode;
}

/** Shared label / hint / error scaffolding so every control reads the same. */
export function Field({ label, hint, error, required, action, children }: WrapperProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const invalid = Boolean(error);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
        {action}
      </div>

      {children({ id, invalid, describedBy: error || hint ? messageId : undefined })}

      {(error || hint) && (
        <p
          id={messageId}
          className={cn(
            "text-[11px] leading-snug",
            error ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function TextField({
  label,
  hint,
  error,
  icon,
  action,
  className,
  required,
  ...rest
}: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} action={action}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            >
              {icon}
            </span>
          )}
          <input
            {...rest}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              CONTROL,
              "h-11",
              Boolean(icon) && "pl-9",
              invalid ? "border-destructive" : "border-input",
              className,
            )}
          />
        </div>
      )}
    </Field>
  );
}

/* -------------------------------------------------------------------------- */

export function PasswordField({
  label,
  hint,
  error,
  action,
  className,
  required,
  ...rest
}: Omit<TextFieldProps, "icon" | "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} hint={hint} error={error} required={required} action={action}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          <input
            {...rest}
            id={id}
            required={required}
            type={visible ? "text" : "password"}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              CONTROL,
              "h-11 pr-11",
              invalid ? "border-destructive" : "border-input",
              className,
            )}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      )}
    </Field>
  );
}

/* -------------------------------------------------------------------------- */

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  required,
  ...rest
}: TextAreaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ id, invalid, describedBy }) => (
        <textarea
          {...rest}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL,
            "min-h-32 resize-y py-2.5 leading-relaxed",
            invalid ? "border-destructive" : "border-input",
            className,
          )}
        />
      )}
    </Field>
  );
}

/* -------------------------------------------------------------------------- */

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  options: readonly string[];
  placeholder?: string;
}

export function SelectField({
  label,
  hint,
  error,
  options,
  placeholder,
  className,
  required,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {({ id, invalid, describedBy }) => (
        <select
          {...rest}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL,
            "h-11 appearance-none bg-[length:1rem] pr-9",
            invalid ? "border-destructive" : "border-input",
            className,
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.65rem center",
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
