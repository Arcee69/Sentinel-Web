import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CloudOff, Vote } from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "../../components/MediaPicker";
import PageHeader from "../../components/PageHeader";
import UploadProgress from "../../components/UploadProgress";
import Button from "../../components/ui/Button";
import { SelectField, TextAreaField, TextField } from "../../components/ui/Field";
import { useAgent } from "../../context/auth";
import { useOffline } from "../../context/offline";
import {
  ELECTION_SUBJECTS,
  ELECTION_SUBJECTS_NEEDING_FIGURES,
  POLLING_UNIT_STATUSES,
  POLLING_UNIT_STATUS_STYLES,
} from "../../lib/constants";
import { cn } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { MediaItem, PollingUnitStatus } from "../../lib/types";

/** Figures are mandatory for the subjects that exist to carry them. */
const needsFigures = (subject: string) =>
  ELECTION_SUBJECTS_NEEDING_FIGURES.includes(subject);

const count = Yup.number()
  .transform((value, original) => (original === "" ? undefined : value))
  .typeError("Numbers only")
  .min(0, "Can't be negative")
  .integer("Whole numbers only");

const requiredWhenFigures = (message: string) => ({
  is: (subject: string) => needsFigures(subject),
  then: (schema: Yup.NumberSchema) => schema.required(message),
  otherwise: (schema: Yup.NumberSchema) => schema.optional(),
});

const schema = Yup.object({
  subject: Yup.string().required("Pick what you're reporting"),
  unit: Yup.string()
    .trim()
    .required("Enter the polling unit code")
    .matches(/^[A-Za-z0-9/\- ]{3,}$/, "Use the code format, e.g. AN/ON/04/012"),
  ward: Yup.string().trim().required("Enter the ward"),
  unitStatus: Yup.string().required("Set the polling unit status"),
  accredited: count.when("subject", requiredWhenFigures("Accreditation figure required")),
  votesCast: count
    .when("subject", requiredWhenFigures("Votes cast required"))
    .test(
      "within-accredited",
      "Votes cast can't exceed accredited voters",
      function (value) {
        const raw = this.parent.accredited;
        // A blank box means "not supplied" — it must not read as zero.
        if (value === undefined || raw === "" || raw === undefined || raw === null) {
          return true;
        }

        const accredited = Number(raw);
        return !Number.isFinite(accredited) || value <= accredited;
      },
    ),
  body: Yup.string()
    .trim()
    .min(20, "Give the collation desk at least a sentence or two")
    .required("Describe what you observed"),
});

export default function SubmitElectionReport() {
  const agent = useAgent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline, queue } = useOffline();
  const [searchParams] = useSearchParams();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  /** Guards the deep-link prefill so it can never overwrite typed input. */
  const prefilled = useRef(false);

  const tasksQuery = useQuery({
    queryKey: ["tasks", agent.id],
    queryFn: service.fetchTasks,
  });

  const openElectionTasks = useMemo(
    () =>
      (tasksQuery.data ?? []).filter(
        (task) => task.category === "Election Report" && task.status !== "Completed",
      ),
    [tasksQuery.data],
  );

  const submitMutation = useMutation({
    mutationFn: async (draft: service.ElectionReportDraft) => {
      if (!isOnline) {
        await queue("election-report", draft);
        return null;
      }
      setProgress(0);
      return service.submitElectionReport(draft, setProgress);
    },
    onSuccess: async () => {
      toast.success(
        isOnline
          ? "Election report filed — the collation desk has it"
          : "Saved offline — it'll be sent the moment you have signal",
      );
      await queryClient.invalidateQueries({ queryKey: ["election-reports", agent.id] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", agent.id] });
      navigate("/elections", { replace: true });
    },
    onError: (error) => {
      setProgress(null);
      toast.error(errorMessage(error, "Couldn't file the report. Try again."));
    },
  });

  const formik = useFormik({
    initialValues: {
      taskId: searchParams.get("task") ?? "",
      subject: "",
      unit: "",
      ward: agent.ward ?? "",
      unitStatus: "" as PollingUnitStatus | "",
      accredited: "",
      votesCast: "",
      body: "",
    },
    validationSchema: schema,
    enableReinitialize: false,
    onSubmit: (values) =>
      submitMutation.mutateAsync({
        subject: values.subject,
        unit: values.unit.trim().toUpperCase(),
        ward: values.ward.trim(),
        unitStatus: values.unitStatus as PollingUnitStatus,
        accredited: values.accredited === "" ? undefined : Number(values.accredited),
        votesCast: values.votesCast === "" ? undefined : Number(values.votesCast),
        body: values.body.trim(),
        media,
        taskId: values.taskId || undefined,
      }),
  });

  /**
   * Picking a task fills in everything the admin already told us, so the agent
   * only types what they actually went out and observed.
   */
  const linkTask = async (taskId: string) => {
    prefilled.current = true;
    await formik.setFieldValue("taskId", taskId);

    const task = openElectionTasks.find((t) => t.id === taskId);
    if (!task) return;

    await formik.setFieldValue("subject", task.subject);
    if (task.pollingUnit) await formik.setFieldValue("unit", task.pollingUnit);
    if (task.ward) await formik.setFieldValue("ward", task.ward);
  };

  // A deep link from the Election tab arrives before the task list does, so
  // the prefill waits for the fetch to land.
  const { setValues } = formik;

  useEffect(() => {
    if (prefilled.current || !tasksQuery.isSuccess) return;

    const linked = searchParams.get("task");
    if (!linked) return;

    const task = openElectionTasks.find((t) => t.id === linked);
    if (!task) return;

    prefilled.current = true;
    setValues((current) => ({
      ...current,
      taskId: task.id,
      subject: task.subject,
      unit: task.pollingUnit ?? current.unit,
      ward: task.ward ?? current.ward,
    }));
  }, [tasksQuery.isSuccess, openElectionTasks, searchParams, setValues]);

  const accredited = Number(formik.values.accredited);
  const votesCast = Number(formik.values.votesCast);
  const turnout =
    Number.isFinite(accredited) &&
    accredited > 0 &&
    Number.isFinite(votesCast) &&
    formik.values.votesCast !== ""
      ? Math.round((votesCast / accredited) * 100)
      : null;

  const figuresRequired = needsFigures(formik.values.subject);

  return (
    <>
      <PageHeader eyebrow="Election day" title="File Report" back="/elections" />

      <form onSubmit={formik.handleSubmit} className="space-y-5 px-4 py-5" noValidate>
        <p className="flex items-start gap-2 rounded-sm border border-primary/25 bg-primary/8 px-3 py-2.5 text-[11px] leading-snug">
          <Vote className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            Report only what you have seen or what the presiding officer has posted.
            Photograph the posted figures wherever you can.
          </span>
        </p>

        {!isOnline && (
          <p className="flex items-start gap-2 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-snug">
            <CloudOff className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            You're offline. This return and its media stay on your device and send
            automatically once you have signal.
          </p>
        )}

        {openElectionTasks.length > 0 && (
          <SelectField
            label="Answering an assigned task?"
            name="taskId"
            options={openElectionTasks.map((task) => ({
              value: task.id,
              label: task.title,
            }))}
            placeholder="Not linked to a task"
            value={formik.values.taskId}
            onChange={(event) => void linkTask(event.target.value)}
            onBlur={formik.handleBlur}
            hint="Linking marks that task complete once this report is filed."
          />
        )}

        <SelectField
          label="What are you reporting?"
          name="subject"
          options={ELECTION_SUBJECTS}
          placeholder="Select a report subject"
          value={formik.values.subject}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.subject ? formik.errors.subject : undefined}
          required
        />

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

        <TextField
          label="Ward"
          name="ward"
          placeholder="Onitsha North 04"
          value={formik.values.ward}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.ward ? formik.errors.ward : undefined}
          required
        />

        <div className="space-y-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Polling unit status <span className="text-destructive">*</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            {POLLING_UNIT_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => formik.setFieldValue("unitStatus", status)}
                aria-pressed={formik.values.unitStatus === status}
                className={cn(
                  "rounded-sm border py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
                  formik.values.unitStatus === status
                    ? POLLING_UNIT_STATUS_STYLES[status]
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {status}
              </button>
            ))}
          </div>
          {formik.touched.unitStatus && formik.errors.unitStatus && (
            <p className="text-[11px] font-medium text-destructive">
              {formik.errors.unitStatus}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Accredited"
            name="accredited"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={formik.values.accredited}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.accredited ? formik.errors.accredited : undefined}
            required={figuresRequired}
          />
          <TextField
            label="Votes cast"
            name="votesCast"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={formik.values.votesCast}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.votesCast ? formik.errors.votesCast : undefined}
            required={figuresRequired}
          />
        </div>

        {turnout !== null && (
          <p className="-mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Turnout: <span className="font-bold text-foreground">{turnout}%</span> of
            accredited voters
          </p>
        )}

        <TextAreaField
          label="Observations"
          name="body"
          placeholder="Opening time, queue length, party agents present, BVAS performance, and anything the collation desk should know."
          value={formik.values.body}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.body ? formik.errors.body : undefined}
          required
        />

        <MediaPicker
          value={media}
          onChange={setMedia}
          label="Photos of posted results"
          hint="Attach the result sheet, posted figures, or the unit itself."
        />

        <UploadProgress
          percent={progress}
          visible={submitMutation.isPending && media.length > 0}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={formik.isSubmitting || submitMutation.isPending}
        >
          {isOnline ? "File election report" : "Save & queue"}
        </Button>
      </form>
    </>
  );
}
