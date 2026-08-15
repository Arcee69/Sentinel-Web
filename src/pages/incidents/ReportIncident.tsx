import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CloudOff, Crosshair, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "../../components/MediaPicker";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/ui/Button";
import { SelectField, TextAreaField, TextField } from "../../components/ui/Field";
import { useAgent } from "../../context/auth";
import { useOffline } from "../../context/offline";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SUBJECTS,
  INCIDENT_SUBJECT_TYPE,
  SEVERITY_STYLES,
} from "../../lib/constants";
import { cn } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import UploadProgress from "../../components/UploadProgress";
import type { IncidentSeverity, MediaItem } from "../../lib/types";

const schema = Yup.object({
  subject: Yup.string().required("Pick what you witnessed"),
  severity: Yup.string().required("Set a severity"),
  unit: Yup.string()
    .trim()
    .required("Enter the polling unit code")
    .matches(/^[A-Za-z0-9/\- ]{3,}$/, "Use the code format, e.g. AN/ON/04/012"),
  description: Yup.string()
    .trim()
    .min(20, "Give enough detail for the command desk to act")
    .required("Describe what happened"),
});

export default function ReportIncident() {
  const agent = useAgent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline, queue } = useOffline();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [locating, setLocating] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const submitMutation = useMutation({
    mutationFn: async (draft: service.IncidentDraft) => {
      if (!isOnline) {
        await queue("incident", draft);
        return null;
      }
      setProgress(0);
      return service.submitIncident(draft, setProgress);
    },
    onSuccess: async () => {
      toast.success(
        isOnline
          ? "Incident reported — the command desk has been notified"
          : "Saved offline — it'll be sent the moment you have signal",
      );
      await queryClient.invalidateQueries({ queryKey: ["incidents", agent.id] });
      navigate("/incidents", { replace: true });
    },
    onError: (error) => {
      setProgress(null);
      toast.error(errorMessage(error, "Couldn't file the incident. Try again."));
    },
  });

  const formik = useFormik({
    initialValues: {
      subject: "",
      severity: "" as IncidentSeverity | "",
      unit: "",
      description: "",
    },
    validationSchema: schema,
    onSubmit: (values) =>
      submitMutation.mutateAsync({
        subject: values.subject,
        severity: values.severity as IncidentSeverity,
        unit: values.unit.trim().toUpperCase(),
        description: values.description.trim(),
        media,
        coords,
      }),
  });

  /** Attaches a GPS fix so the desk can dispatch to the right place. */
  const attachLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location isn't available on this device");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
        toast.success("Location attached");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Check permissions.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  };

  const derivedType = formik.values.subject
    ? INCIDENT_SUBJECT_TYPE[formik.values.subject]
    : null;

  return (
    <>
      <PageHeader eyebrow="Field report" title="Report Incident" back />

      <form onSubmit={formik.handleSubmit} className="space-y-5 px-4 py-5" noValidate>
        <p className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[11px] leading-snug">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <span>
            Reports marked <strong>Critical</strong> are escalated to the command desk
            immediately. If anyone is in danger, contact emergency services first.
          </span>
        </p>

        {!isOnline && (
          <p className="flex items-start gap-2 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-snug">
            <CloudOff className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            You're offline. This report and its media stay on your device and send
            automatically once you have signal.
          </p>
        )}

        <SelectField
          label="What did you witness?"
          name="subject"
          options={INCIDENT_SUBJECTS}
          placeholder="Select an incident"
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.subject ? formik.errors.subject : undefined}
          hint={derivedType ? `Filed under ${derivedType}` : undefined}
          required
        />

        <div className="space-y-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Severity <span className="text-destructive">*</span>
          </span>
          <div className="grid grid-cols-4 gap-2">
            {INCIDENT_SEVERITIES.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => formik.setFieldValue("severity", level)}
                aria-pressed={formik.values.severity === level}
                className={cn(
                  "rounded-sm border py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
                  formik.values.severity === level
                    ? SEVERITY_STYLES[level]
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {level}
              </button>
            ))}
          </div>
          {formik.touched.severity && formik.errors.severity && (
            <p className="text-[11px] font-medium text-destructive">
              {formik.errors.severity}
            </p>
          )}
        </div>

        <TextField
          label="Polling unit code"
          name="unit"
          placeholder="AN/ON/04/012"
          autoCapitalize="characters"
          hint={`Your sector: ${agent.lga}, ${agent.state}`}
          value={formik.values.unit}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.unit ? formik.errors.unit : undefined}
          required
        />

        <TextAreaField
          label="What happened?"
          name="description"
          placeholder="Describe what you saw, when it happened, who was involved, and whether security or officials are aware."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.description ? formik.errors.description : undefined}
          required
        />

        <MediaPicker
          value={media}
          onChange={setMedia}
          label="Photos & video evidence"
          hint="Attach photos, video, or both. Only capture what is safe to capture."
        />

        <div>
          <Button
            type="button"
            variant="outline"
            size="md"
            fullWidth
            loading={locating}
            icon={<Crosshair className="size-4" aria-hidden />}
            onClick={attachLocation}
          >
            {coords ? "Location attached" : "Attach GPS location"}
          </Button>
          {coords && (
            <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground">
              {coords.lat}, {coords.lng}
            </p>
          )}
        </div>

        <UploadProgress percent={progress} visible={submitMutation.isPending && media.length > 0} />

        <Button
          type="submit"
          size="lg"
          variant="danger"
          fullWidth
          loading={formik.isSubmitting || submitMutation.isPending}
        >
          {isOnline ? "File incident report" : "Save & queue"}
        </Button>
      </form>
    </>
  );
}
