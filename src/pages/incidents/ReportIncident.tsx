import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CloudOff, Crosshair, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "../../components/MediaPicker";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/ui/Button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "../../components/ui/Field";
import { useAgent, useWorkspace } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { useFieldSubmission } from "../../hooks/useFieldSubmission";
import { useTasks } from "../../hooks/useTasks";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SUBJECTS,
  SEVERITY_STYLES,
  SUBJECT_CODE,
} from "../../lib/constants";
import { cn } from "../../lib/format";
import * as service from "../../services/agentService";
import UploadProgress from "../../components/UploadProgress";
import type { IncidentSeverity, MediaItem } from "../../lib/types";

const schema = Yup.object({
  subject: Yup.string().required("Pick what you witnessed"),
  severity: Yup.string().required("Set a severity"),
  unit: Yup.string()
    .trim()
    .required("Enter the polling unit code")
    .min(3, "Enter the full polling unit code"),
  description: Yup.string()
    .trim()
    .min(20, "Give enough detail for the command desk to act")
    .required("Describe what happened"),
});

export default function ReportIncident() {
  const agent = useAgent();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const { isOnline } = useOffline();
  const [searchParams] = useSearchParams();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [locating, setLocating] = useState(false);

  // Arriving from an Incident Report task preselects its allegation.
  const taskId = searchParams.get("task") ?? "";
  const linkedTask = useTasks().data?.find((task) => task.id === taskId);
  const taskSubject =
    linkedTask?.subject && INCIDENT_SUBJECTS.includes(linkedTask.subject)
      ? linkedTask.subject
      : "";

  const { mutation: submitMutation, progress } = useFieldSubmission({
    kind: "incident-report",
    sentMessage: "Incident reported — the command desk has it",
    invalidate: [["incidents", workspace.campaignId]],
    onDone: () => navigate("/incidents", { replace: true }),
  });

  const formik = useFormik({
    initialValues: {
      subject: "",
      severity: "" as IncidentSeverity | "",
      unit: "",
      description: "",
      complete: true,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const draft: service.IncidentDraft = {
        clientSubmissionId: crypto.randomUUID(),
        occurredAt: new Date().toISOString(),
        campaignId: workspace.campaignId,
        incidentType: SUBJECT_CODE[values.subject],
        severity: values.severity as IncidentSeverity,
        unitCode: values.unit.trim().toUpperCase(),
        description: values.description.trim(),
        coords,
        media,
      };

      return submitMutation
        .mutateAsync({
          draft,
          completeTaskId: taskId && values.complete ? taskId : undefined,
        })
        .catch(() => undefined);
    },
  });

  // The task list can land after first render; fill the subject only while it's blank.
  const { setFieldValue } = formik;
  const subjectBlank = formik.values.subject === "";
  useEffect(() => {
    if (taskSubject && subjectBlank) void setFieldValue("subject", taskSubject);
  }, [taskSubject, subjectBlank, setFieldValue]);

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

  return (
    <>
      <PageHeader eyebrow="Field report" title="Report Incident" back />

      <form onSubmit={formik.handleSubmit} className="space-y-5 px-4 py-5" noValidate>
        <p className="flex items-start gap-2 rounded-sm border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-[11px] leading-snug">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <span>
            Reports marked <strong>Critical</strong> can raise an alert on the command
            desk. If anyone is in danger, contact emergency services first.
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
          placeholder="e.g. DEMO-A-001"
          autoCapitalize="characters"
          hint={`Your sector: ${agent.sector}`}
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

        {taskId && linkedTask && (
          <CheckboxField
            name="complete"
            label="Mark the linked task complete"
            hint={
              isOnline
                ? `Closes "${linkedTask.title}" once this report is filed.`
                : "Offline: finish the task from its screen once this report has synced."
            }
            checked={formik.values.complete && isOnline}
            disabled={!isOnline}
            onChange={formik.handleChange}
          />
        )}

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
