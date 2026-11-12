import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CloudOff, Vote } from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "../../components/MediaPicker";
import PageHeader from "../../components/PageHeader";
import UploadProgress from "../../components/UploadProgress";
import Button from "../../components/ui/Button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "../../components/ui/Field";
import { useAgent, useWorkspace } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { useFieldSubmission } from "../../hooks/useFieldSubmission";
import { useTasks } from "../../hooks/useTasks";
import {
  ELECTION_SUBJECTS,
  ELECTION_SUBJECTS_NEEDING_FIGURES,
  OPERATING_STATUS_CODE,
  POLLING_UNIT_STATUSES,
  POLLING_UNIT_STATUS_STYLES,
  SUBJECT_CODE,
} from "../../lib/constants";
import { cn } from "../../lib/format";
import { isActionable } from "../../lib/tasks";
import * as service from "../../services/agentService";
import { toApiError } from "../../services/errors";
import type { ApiPollingPlace, MediaItem, PollingUnitStatus } from "../../lib/types";

/** Figures are mandatory for the subjects that exist to carry them. */
const needsFigures = (subject: string) =>
  ELECTION_SUBJECTS_NEEDING_FIGURES.includes(subject);

const normaliseCode = (value: string) => value.trim().toUpperCase();

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
    .min(3, "Enter the full polling unit code"),
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
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline } = useOffline();
  const [searchParams] = useSearchParams();

  const [media, setMedia] = useState<MediaItem[]>([]);
  /** The code as last committed (on blur), which is what gets looked up. */
  const [lookupCode, setLookupCode] = useState("");
  /** Guards the deep-link prefill so it can never overwrite typed input. */
  const prefilled = useRef(false);

  const tasksQuery = useTasks();

  const openElectionTasks = useMemo(
    () =>
      (tasksQuery.data ?? []).filter(
        (task) => task.category === "Election Report" && isActionable(task.status),
      ),
    [tasksQuery.data],
  );

  const placesKey = (code: string) => ["polling-places", workspace.campaignId, code];

  const placesQuery = useQuery({
    queryKey: placesKey(lookupCode),
    queryFn: () => service.lookupPollingPlaces(workspace.campaignId, lookupCode),
    enabled: isOnline && lookupCode.length >= 3,
    retry: false,
    staleTime: 10 * 60_000,
  });

  const places = placesQuery.data ?? [];

  // Only needed to tell occasions apart when one code matches several.
  const occasionsQuery = useQuery({
    queryKey: ["polling-occasions"],
    queryFn: service.fetchPollingOccasions,
    enabled: places.length > 1,
    staleTime: 10 * 60_000,
  });

  const { mutation: submitMutation, progress } = useFieldSubmission({
    kind: "polling-report",
    sentMessage: "Election report filed — the collation desk has it",
    invalidate: [["election-reports", workspace.campaignId]],
    onDone: () => navigate("/elections", { replace: true }),
  });

  const formik = useFormik({
    initialValues: {
      taskId: searchParams.get("task") ?? "",
      subject: "",
      unit: "",
      placeId: "",
      unitStatus: "" as PollingUnitStatus | "",
      accredited: "",
      votesCast: "",
      body: "",
      complete: true,
    },
    validationSchema: schema,
    enableReinitialize: false,
    onSubmit: async (values, helpers) => {
      if (!workspace.assignmentId) {
        toast.error("You have no active assignment. Contact your supervisor.");
        return;
      }

      const code = normaliseCode(values.unit);
      let place: ApiPollingPlace | null = null;

      // Online, the code must resolve to exactly one published polling place
      // before anything is filed. Offline, it is resolved when the queue syncs.
      if (isOnline) {
        let matches: ApiPollingPlace[];
        try {
          matches = await queryClient.fetchQuery({
            queryKey: placesKey(code),
            queryFn: () => service.lookupPollingPlaces(workspace.campaignId, code),
            staleTime: 10 * 60_000,
          });
        } catch (error) {
          const apiError = toApiError(error);
          if (!apiError.isNotFound && !apiError.isNetwork) {
            toast.error(apiError.message);
            return;
          }
          if (apiError.isNotFound) {
            helpers.setFieldError("unit", "No published polling unit in your campaign has this code");
            return;
          }
          matches = [];
        }

        if (matches.length > 1) {
          place = matches.find((m) => m.id === values.placeId) ?? null;
          if (!place) {
            setLookupCode(code);
            helpers.setFieldError("placeId", "Pick which election this report is for");
            return;
          }
        } else {
          place = matches[0] ?? null;
        }
      }

      const draft: service.PollingReportDraft = {
        clientSubmissionId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        observedAt: new Date().toISOString(),
        campaignId: workspace.campaignId,
        assignmentId: workspace.assignmentId,
        taskId: values.taskId || undefined,
        unitCode: code,
        place,
        subject: SUBJECT_CODE[values.subject],
        operatingStatus: values.unitStatus
          ? OPERATING_STATUS_CODE[values.unitStatus]
          : undefined,
        accredited: values.accredited === "" ? undefined : Number(values.accredited),
        votesCast: values.votesCast === "" ? undefined : Number(values.votesCast),
        notes: values.body.trim(),
        media,
      };

      await submitMutation
        .mutateAsync({
          draft,
          completeTaskId: values.taskId && values.complete ? values.taskId : undefined,
        })
        .catch(() => undefined);
    },
  });

  /**
   * Picking a task fills in everything the admin already told us, so the agent
   * only types what they actually went out and observed.
   */
  const linkTask = async (taskId: string) => {
    prefilled.current = true;
    await formik.setFieldValue("taskId", taskId);

    const task = openElectionTasks.find((t) => t.id === taskId);
    if (task?.subject && ELECTION_SUBJECTS.includes(task.subject)) {
      await formik.setFieldValue("subject", task.subject);
    }
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
      subject:
        task.subject && ELECTION_SUBJECTS.includes(task.subject) ? task.subject : current.subject,
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
  const codeIsCurrent = lookupCode !== "" && lookupCode === normaliseCode(formik.values.unit);

  const unitHint = (() => {
    if (!isOnline) return "Offline — the code is checked when this report syncs.";
    if (!codeIsCurrent) return `Your sector: ${agent.sector}. Reports are recorded against the polling unit, not the ward.`;
    if (placesQuery.isFetching) return "Checking code…";
    if (places.length === 1) return `✓ ${places[0].name}`;
    if (places.length > 1) return `${places[0].name} — used in ${places.length} elections, pick one below.`;
    return undefined;
  })();

  const unitError =
    formik.touched.unit && formik.errors.unit
      ? formik.errors.unit
      : codeIsCurrent && placesQuery.isError
        ? toApiError(placesQuery.error).isNotFound
          ? "No published polling unit in your campaign has this code"
          : toApiError(placesQuery.error).message
        : undefined;

  const occasionName = (occasionId: string) =>
    occasionsQuery.data?.find((o) => o.id === occasionId)?.name ??
    `Election ${occasionId.slice(0, 8)}`;

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
          placeholder="e.g. DEMO-A-001"
          autoCapitalize="characters"
          hint={unitHint}
          value={formik.values.unit}
          onChange={(event) => {
            formik.handleChange(event);
            void formik.setFieldValue("placeId", "");
          }}
          onBlur={(event) => {
            formik.handleBlur(event);
            setLookupCode(normaliseCode(event.target.value));
          }}
          error={unitError}
          required
        />

        {codeIsCurrent && places.length > 1 && (
          <SelectField
            label="Which election?"
            name="placeId"
            options={places.map((place) => ({
              value: place.id,
              label: occasionName(place.polling_occasion_id),
            }))}
            placeholder="Select the election"
            value={formik.values.placeId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.placeId}
            required
          />
        )}

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
          hint="Attach the result sheet, posted figures, or the unit itself. Evidence may show as pending while it's scanned."
        />

        {formik.values.taskId && (
          <CheckboxField
            name="complete"
            label="Mark the linked task complete"
            hint={
              isOnline
                ? "Untick if this task needs more returns."
                : "Offline: finish the task from its screen once this report has synced."
            }
            checked={formik.values.complete && isOnline}
            disabled={!isOnline}
            onChange={formik.handleChange}
          />
        )}

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
