import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AtSign, CheckCircle2, ChevronLeft, MailCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import { PasswordField, TextField } from "../../../components/ui/Field";
import * as service from "../../../services/agentService";
import { toApiError } from "../../../services/errors";
import { errorMessage } from "../../../services/instance";

/**
 * Password recovery. The API emails a reset link and always answers with the
 * same neutral acknowledgement, so this screen never reveals whether an
 * account exists. The link lands on `/reset-password?token=…&email=…`.
 */
export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <BackToSignIn />
      {sentTo === null ? (
        <IdentifyStep onSent={setSentTo} />
      ) : (
        <SentStep email={sentTo} onBack={() => setSentTo(null)} />
      )}
    </div>
  );
}

/** Landing page for the emailed reset link. */
export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  if (done) {
    return (
      <div className="flex flex-1 flex-col">
        <DoneStep />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <BackToSignIn />
      {token ? (
        <ResetStep email={email} token={token} onDone={() => setDone(true)} />
      ) : (
        <>
          <StepHeading
            title="Link incomplete"
            blurb="This reset link is missing its token. Open the link from your email again, or request a new one."
          />
          <Link
            to="/forgot-password"
            className="mt-7 font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
          >
            Request a new link →
          </Link>
        </>
      )}
    </div>
  );
}

function BackToSignIn() {
  return (
    <Link
      to="/login"
      className="mb-5 -ml-1 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-3.5" aria-hidden />
      Back to sign in
    </Link>
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

function IdentifyStep({ onSent }: { onSent: (email: string) => void }) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string().trim().email("Enter a valid email").required("Enter your email"),
    }),
    onSubmit: async (values) => {
      setError(null);
      try {
        await service.requestPasswordReset(values.email.trim());
        onSent(values.email.trim());
      } catch (err) {
        setError(errorMessage(err, "We couldn't send the reset link. Try again."));
      }
    },
  });

  return (
    <>
      <StepHeading
        title="Reset password"
        blurb="Enter the email on your Sentinel account and we'll send you a reset link."
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
          Send reset link
        </Button>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function SentStep({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <span
        className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary"
        aria-hidden
      >
        <MailCheck className="size-6" />
      </span>

      <div className="mt-5">
        <StepHeading
          title="Check your email"
          blurb={`If ${email} belongs to a Sentinel account, a password reset link is on its way. Open it on this device to choose a new password.`}
        />
      </div>

      <p className="mt-6 rounded-sm border border-border bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Nothing after a few minutes? Check spam, or ask your supervisor to confirm the email
        on your account.
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 self-start font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
      >
        Use a different email
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ResetStep({
  email,
  token,
  onDone,
}: {
  email: string;
  token: string;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email, password: "", confirm: "" },
    validationSchema: Yup.object({
      email: Yup.string().trim().email("Enter a valid email").required("Enter your email"),
      password: Yup.string()
        .min(8, "Use at least 8 characters")
        .matches(/[0-9]/, "Include at least one number")
        .required("Choose a new password"),
      confirm: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords don't match")
        .required("Confirm your new password"),
    }),
    onSubmit: async (values, helpers) => {
      setError(null);
      try {
        await service.resetPassword({
          email: values.email.trim(),
          token,
          password: values.password,
          password_confirmation: values.confirm,
        });
        onDone();
      } catch (err) {
        const fields = toApiError(err).fieldErrors;
        if (fields.password) helpers.setFieldError("password", fields.password);
        if (fields.email) helpers.setFieldError("email", fields.email);
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
        {!email && (
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
        )}

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
