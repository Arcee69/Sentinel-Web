import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AtSign } from "lucide-react";
import { toast } from "sonner";
import Button from "../../../components/ui/Button";
import { PasswordField, TextField } from "../../../components/ui/Field";
import { useAuth } from "../../../context/auth";
import { errorMessage } from "../../../services/instance";

const schema = Yup.object({
  email: Yup.string().trim().required("Enter your email"),
  password: Yup.string().required("Enter your password"),
});

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // The 401 interceptor sends expired sessions here — say why they were kicked.
  const expired = searchParams.get("expired") === "1";

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      setFormError(null);
      try {
        await signIn(values.email, values.password);
        toast.success("Signed in");
        navigate(from, { replace: true });
      } catch (error) {
        setFormError(errorMessage(error, "We couldn't sign you in. Try again."));
      }
    },
  });

  const fieldError = (name: "email" | "password") =>
    formik.touched[name] ? formik.errors[name] : undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Sign in</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Enter the credentials your administrator issued you.
        </p>
      </div>

      {expired && (
        <p
          role="status"
          className="mt-5 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-snug"
        >
          Your session expired. Sign in again to continue.
        </p>
      )}

      <form onSubmit={formik.handleSubmit} className="mt-7 space-y-4" noValidate>
        <TextField
          label="Email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder="you@smhp.ng"
          icon={<AtSign className="size-4" />}
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={fieldError("email")}
          required
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={fieldError("password")}
          required
          action={
            <Link
              to="/forgot-password"
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Forgot?
            </Link>
          }
        />

        {formError && (
          <p
            role="alert"
            className="rounded-sm border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[11px] leading-snug font-medium text-destructive"
          >
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" fullWidth loading={formik.isSubmitting}>
          {formik.isSubmitting ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 rounded-sm border border-border bg-muted/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Sentinel accounts are created by your administrator. If you don't have one,
        contact your LGA supervisor.
      </p>
    </div>
  );
}
