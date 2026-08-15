import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CloudOff } from "lucide-react";
import { toast } from "sonner";
import MediaPicker from "../../components/MediaPicker";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/ui/Button";
import { SelectField, TextAreaField, TextField } from "../../components/ui/Field";
import { ErrorState, Loading } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { REPORT_TYPES } from "../../lib/constants";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import UploadProgress from "../../components/UploadProgress";
import type { MediaItem, ReportType } from "../../lib/types";

const schema = Yup.object({
  type: Yup.string().required("Pick how this was gathered"),
  body: Yup.string()
    .trim()
    .min(20, "Give the command desk at least a sentence or two")
    .required("Describe what you found"),
  respondents: Yup.number()
    .transform((value, original) => (original === "" ? undefined : value))
    .min(0, "Can't be negative")
    .integer("Whole numbers only")
    .optional(),
});

export default function SubmitReport() {
  const { id = "" } = useParams();
  const agent = useAgent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline, queue } = useOffline();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);

  const taskQuery = useQuery({
    queryKey: ["task", id],
    queryFn: () => service.fetchTask(id),
    enabled: Boolean(id),
  });

  const submitMutation = useMutation({
    mutationFn: async (draft: service.ReportDraft) => {
      if (!isOnline) {
        await queue("report", draft);
        return null;
      }
      setProgress(0);
      return service.submitReport(draft, setProgress);
    },
    onSuccess: async () => {
      toast.success(
        isOnline
          ? "Report submitted"
          : "Saved offline — it'll sync automatically when you're back on a network",
      );
      await queryClient.invalidateQueries({ queryKey: ["tasks", agent.id] });
      await queryClient.invalidateQueries({ queryKey: ["task", id] });
      await queryClient.invalidateQueries({ queryKey: ["reports", agent.id] });
      navigate(`/tasks/${id}`, { replace: true });
    },
    onError: (error) => {
      setProgress(null);
      toast.error(errorMessage(error, "Couldn't submit the report. Try again."));
    },
  });

  const formik = useFormik({
    initialValues: { type: "" as ReportType | "", body: "", respondents: "" },
    validationSchema: schema,
    onSubmit: (values) =>
      submitMutation.mutateAsync({
        taskId: id,
        type: values.type as ReportType,
        body: values.body.trim(),
        respondents: values.respondents === "" ? undefined : Number(values.respondents),
        media,
      }),
  });

  if (taskQuery.isPending) {
    return (
      <>
        <PageHeader title="Submit report" back />
        <Loading label="Loading task" />
      </>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    return (
      <>
        <PageHeader title="Submit report" back />
        <div className="px-4 py-6">
          <ErrorState
            title="Task unavailable"
            onRetry={() => void taskQuery.refetch()}
          />
        </div>
      </>
    );
  }

  const task = taskQuery.data;

  return (
    <>
      <PageHeader eyebrow="Submit report" title={task.title} back={`/tasks/${id}`} />

      <form onSubmit={formik.handleSubmit} className="space-y-5 px-4 py-5" noValidate>
        <div className="rounded-sm border border-border bg-muted/40 px-3 py-2.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Reporting on
          </p>
          <p className="mt-0.5 text-xs font-bold">{task.subject}</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {task.category} · {task.ward ?? task.lga}, {task.state}
          </p>
        </div>

        {!isOnline && (
          <p className="flex items-start gap-2 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-snug text-foreground">
            <CloudOff className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            You're offline. This report will be saved on your device and sent
            automatically once you have signal.
          </p>
        )}

        <SelectField
          label="How was this gathered?"
          name="type"
          options={REPORT_TYPES}
          placeholder="Select a method"
          value={formik.values.type}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.type ? formik.errors.type : undefined}
          required
        />

        <TextAreaField
          label="Findings"
          name="body"
          placeholder="What did you observe? Include numbers, names of locations, and anything the command desk should act on."
          value={formik.values.body}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.body ? formik.errors.body : undefined}
          required
        />

        <TextField
          label={task.target ? `People reached (target ${task.target})` : "People reached"}
          name="respondents"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          hint="Optional — respondents, attendees or households covered."
          value={formik.values.respondents}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.respondents ? formik.errors.respondents : undefined}
        />

        <MediaPicker
          value={media}
          onChange={setMedia}
          label="Photos & video"
          hint="Optional. Attach photos or short clips that back up your findings."
        />

        <UploadProgress percent={progress} visible={submitMutation.isPending && media.length > 0} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={formik.isSubmitting || submitMutation.isPending}
        >
          {isOnline ? "Submit report" : "Save & queue"}
        </Button>
      </form>
    </>
  );
}
