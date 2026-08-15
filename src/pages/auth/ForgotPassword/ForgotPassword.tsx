import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AtSign, CheckCircle2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/ui/Button";
import { PasswordField, TextField } from "../../../components/ui/Field";
import * as service from "../../../services/agentService";
import { errorMessage } from "../../../services/instance";

type Step = "identify" | "verify" | "reset" | "done";

/**
 * Three-step recovery: request a code, confirm it, set a new password.
 *
 * Kept in one component because each step needs the email and code from
 * the previous one, and a refresh mid-flow should send the agent back to the
 * start rather than into an unreachable state.
 */
export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("identify");
  const [email, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState("");

  return (
    <div className="flex flex-1 flex-col">
      {step !== "done" && (
        <Link
          to="/login"
          className="mb-5 -ml-1 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Back to sign in
        </Link>
      )}

      {step === "identify" && (
        <IdentifyStep
          onSent={(value, maskedHint) => {
            setIdentifier(value);
            setHint(maskedHint);
            setStep("verify");
          }}
        />
      )}

      {step === "verify" && (
        <VerifyStep
          email={email}
          hint={hint}
          onVerified={(value) => {
            setCode(value);
            setStep("reset");
          }}
          onBack={() => setStep("identify")}
        />
      )}

      {step === "reset" && (
        <ResetStep
          email={email}
          code={code}
          onDone={() => setStep("done")}
        />
      )}

      {step === "done" && <DoneStep />}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StepHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{blurb}</p>
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-sm border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[11px] leading-snug font-medium text-destructive"
    >
      {message}
    </p>
  );
}

/* -------------------------------------------------------------------------- */

function IdentifyStep({
  onSent,
}: {
  onSent: (email: string, hint: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().trim().required("Enter your email"),
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        const { hint } = await service.requestPasswordReset(values.email);
        toast.success("Reset code sent");
        onSent(values.email, hint);
      } catch (err) {
        setError(errorMessage(err, "We couldn't send the code. Try again."));
      }
    },
  });

  return (
    <>
      <StepHeading
        title="Reset password"
        blurb="We'll send a 6-digit code to the contact on your Sentinel account."
      />

      <form onSubmit={formik.handleSubmit} className="mt-7 space-y-4" noValidate>
        <TextField
          label="Email"
          name="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@smhp.ng"
          icon={<AtSign className="size-4" />}
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email ? formik.errors.email : undefined}
          required
        />

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={formik.isSubmitting}>
          Send code
        </Button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function VerifyStep({
  email,
  hint,
  onVerified,
  onBack,
}: {
  email: string;
  hint: string;
  onVerified: (code: string) => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const formik = useFormik({
    initialValues: { code: "" },
    validationSchema: Yup.object({
      code: Yup.string()
        .trim()
        .matches(/^\d{6}$/, "Enter the 6-digit code")
        .required("Enter the 6-digit code"),
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        await service.verifyResetCode(email, values.code);
        onVerified(values.code);
      } catch (err) {
        setError(errorMessage(err, "That code isn't right."));
      }
    },
  });

  const resend = async () => {
    setResending(true);
    try {
      await service.requestPasswordReset(email);
      toast.success("New code sent");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <StepHeading
        title="Enter code"
        blurb={`We sent a 6-digit code to ${hint}. It expires in 10 minutes.`}
      />

      <form onSubmit={formik.handleSubmit} className="mt-7 space-y-4" noValidate>
        <TextField
          label="Verification code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="text-center font-mono text-lg tracking-[0.5em]"
          value={formik.values.code}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.code ? formik.errors.code : undefined}
          required
        />

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={formik.isSubmitting}>
          Verify
        </Button>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Change contact
          </button>
          <button
            type="button"
            onClick={() => void resend()}
            disabled={resending}
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ResetStep({
  email,
  code,
  onDone,
}: {
  email: string;
  code: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { password: "", confirm: "" },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, "Use at least 8 characters")
        .matches(/[0-9]/, "Include at least one number")
        .required("Choose a new password"),
      confirm: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords don't match")
        .required("Confirm your new password"),
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        await service.resetPassword(email, code, values.password);
        onDone();
      } catch (err) {
        setError(errorMessage(err, "We couldn't reset your password."));
      }
    },
  });

  return (
    <>
      <StepHeading
        title="New password"
        blurb="Choose a password you haven't used on Sentinel before."
      />

      <form onSubmit={formik.handleSubmit} className="mt-7 space-y-4" noValidate>
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters, including a number."
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password ? formik.errors.password : undefined}
          required
        />

        <PasswordField
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          placeholder="••••••••"
          value={formik.values.confirm}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirm ? formik.errors.confirm : undefined}
          required
        />

        <FormError message={error} />

        <Button type="submit" size="lg" fullWidth loading={formik.isSubmitting}>
          Update password
        </Button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function DoneStep() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success"
        aria-hidden
      >
        <CheckCircle2 className="size-7" />
      </span>

      <h2 className="mt-5 font-display text-2xl font-bold tracking-tight">
        Password updated
      </h2>
      <p className="mt-1.5 max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
        You can now sign in with your new password.
      </p>

      <Button
        size="lg"
        fullWidth
        className="mt-7"
        onClick={() => navigate("/login", { replace: true })}
      >
        Back to sign in
      </Button>
    </div>
  );
}
