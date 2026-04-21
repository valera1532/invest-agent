import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, LoaderCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  approveAiDecision,
  getAiDecisionHistory,
  rejectAiDecision,
  type AiDecisionRecord,
} from "@/features/ai/api/decision-history";
import {
  createAiPreviewJob,
  getAiPreviewJob,
} from "@/features/ai/api/preview-jobs";
import type { AiDecisionPreview } from "@/features/ai/api/preview-ai-decision";

const EMPTY_HISTORY_ITEMS: AiDecisionRecord[] = [];
const AI_LOADING_STAGES = [
  "Собираю портфель",
  "Собираю рынок",
  "Анализирую историю",
  "Готовлю контекст",
  "Запрашиваю AI",
  "Сохраняю решение",
] as const;

const AI_LOADING_STAGE_LABELS = {
  collecting_portfolio: "Собираю портфель",
  analyzing_history: "Анализирую историю",
  building_universe: "Собираю рынок",
  preparing_context: "Готовлю контекст",
  requesting_ai: "Запрашиваю AI",
  saving_decision: "Сохраняю решение",
} as const;

const AI_JOB_STEPS = [
  "collecting_portfolio",
  "analyzing_history",
  "building_universe",
  "preparing_context",
  "requesting_ai",
  "saving_decision",
] as const;

export function AiPage() {
  const queryClient = useQueryClient();
  const lastPreviewJobStatusRef = useRef<string | null>(null);
  const [decision, setDecision] = useState<AiDecisionPreview | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [loadingStageIndex, setLoadingStageIndex] = useState(0);
  const historyQuery = useQuery({
    queryKey: ["ai-decisions", historyPage],
    queryFn: () => getAiDecisionHistory(historyPage, 10),
  });
  const previewJobQuery = useQuery({
    queryKey: ["ai-preview-job", activeJobId],
    queryFn: () => getAiPreviewJob(activeJobId!),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job && (job.status === "queued" || job.status === "running")
        ? 1500
        : false;
    },
  });
  const previewMutation = useMutation({
    mutationFn: createAiPreviewJob,
    onSuccess: (result) => {
      lastPreviewJobStatusRef.current = null;
      setLoadingStageIndex(0);
      setActiveJobId(result.id);
      setDecision(null);
      toast.success("AI preview job создан");
    },
    onError: (error) => {
      setLoadingStageIndex(0);
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось получить AI-решение";
      toast.error(message);
    },
  });
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAiDecision(id),
    onSuccess: (result) => {
      setDecision((current) => (current?.id === result.id ? result : current));
      queryClient.invalidateQueries({ queryKey: ["ai-decisions"] });
      toast.success("AI-решение подтверждено");
    },
    onError: () => toast.error("Не удалось подтвердить AI-решение"),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectAiDecision(id),
    onSuccess: (result) => {
      setDecision((current) => (current?.id === result.id ? result : current));
      queryClient.invalidateQueries({ queryKey: ["ai-decisions"] });
      toast.success("AI-решение отклонено");
    },
    onError: () => toast.error("Не удалось отклонить AI-решение"),
  });
  const historyItems = historyQuery.data?.items ?? EMPTY_HISTORY_ITEMS;
  const historyPageNumber = historyQuery.data?.page ?? 1;
  const historyTotalPages = historyQuery.data?.totalPages ?? 1;
  const activeDecision = useMemo(
    () => decision ?? previewJobQuery.data?.decision ?? historyItems[0] ?? null,
    [decision, previewJobQuery.data?.decision, historyItems],
  );
  const activeJob = previewJobQuery.data;
  const loadingStageLabel = useMemo(() => {
    const stage = previewJobQuery.data?.stage;
    if (stage) {
      return AI_LOADING_STAGE_LABELS[stage];
    }

    return AI_LOADING_STAGES[loadingStageIndex];
  }, [loadingStageIndex, previewJobQuery.data?.stage]);
  const activeJobStageIndex = useMemo(() => {
    const stage = activeJob?.stage;
    return stage ? AI_JOB_STEPS.indexOf(stage) : -1;
  }, [activeJob?.stage]);
  const topBuyIdeas = (
    activeDecision?.futureBuyIdeas?.length
      ? activeDecision.futureBuyIdeas
      : (activeDecision?.actions ?? [])
          .filter((action) => action.type === "buy")
          .map((action) => ({
            instrumentId: action.instrumentId,
            ticker: action.ticker,
            ...(action.instrumentName
              ? { instrumentName: action.instrumentName }
              : {}),
            accountId: action.accountId,
            confidence: action.confidence,
            thesis: action.thesis,
            trigger: action.portfolioImpact,
            riskNotes: action.riskNotes,
          }))
  )
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 10);

  useEffect(() => {
    if (!previewMutation.isPending && !previewJobQuery.data?.stage) {
      return;
    }

    const timer = window.setInterval(() => {
      setLoadingStageIndex((current) =>
        Math.min(current + 1, AI_LOADING_STAGES.length - 1),
      );
    }, 2200);

    return () => window.clearInterval(timer);
  }, [previewMutation.isPending, previewJobQuery.data]);

  useEffect(() => {
    const job = previewJobQuery.data;
    if (!job) {
      return;
    }

    if (lastPreviewJobStatusRef.current === job.status) {
      return;
    }

    lastPreviewJobStatusRef.current = job.status;

    if (job.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["ai-decisions"] });
      toast.success("AI-решение сгенерировано и сохранено");
      return;
    }

    if (job.status === "failed") {
      toast.error(job.errorMessage || "AI preview job завершился с ошибкой");
    }
  }, [previewJobQuery.data, queryClient]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Decision Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#d6e7de] bg-[#f6faf7] p-4 text-sm leading-7 text-[#30453f]">
            Здесь AI анализирует multi-asset портфель: акции, облигации, ETF и
            валютные инструменты. Теперь preview не теряется: решение
            сохраняется в историю и может быть подтверждено или отклонено.
          </div>
          <Button
            size="lg"
            loading={previewMutation.isPending}
            onClick={() => {
              setLoadingStageIndex(0);
              previewMutation.mutate({});
            }}
          >
            Сгенерировать решение AI
          </Button>
          {previewMutation.isPending ||
          previewJobQuery.isFetching ||
          previewJobQuery.data?.status === "queued" ||
          previewJobQuery.data?.status === "running" ? (
            <div className="rounded-2xl border border-[#d6e7de] bg-white p-4 text-sm text-[#30453f]">
              <div className="font-medium text-[#10201b]">
                AI сейчас работает
              </div>
              <div className="mt-2 text-[#52625d]">{loadingStageLabel}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {previewMutation.isPending || activeJob ? (
        <JobStatusCard
          job={activeJob}
          loadingStageLabel={loadingStageLabel}
          activeStageIndex={activeJobStageIndex}
        />
      ) : null}

      {activeDecision ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Risk Alignment"
              value={activeDecision.portfolioView.riskAlignment}
            />
            <MetricCard
              label="Cash Status"
              value={activeDecision.portfolioView.cashStatus}
              tone="warm"
            />
            <MetricCard
              label="Diversification"
              value={activeDecision.portfolioView.diversificationStatus}
              tone="blue"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Краткий вывод</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-[#30453f]">
              <div className="rounded-2xl border border-[#d6e7de] bg-white p-4">
                <div className="font-semibold text-[#10201b]">
                  {activeDecision.summary}
                </div>
                <div className="mt-2 text-[#52625d]">
                  {activeDecision.portfolioView.portfolioAssessment}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#60716a]">
                  <StatusBadge status={activeDecision.status} />
                  <div className="rounded-full bg-[#f6faf7] px-3 py-1">
                    Mode: {activeDecision.executionMode}
                  </div>
                  <div className="rounded-full bg-[#f6faf7] px-3 py-1">
                    ID: {activeDecision.id}
                  </div>
                </div>
              </div>
              {activeDecision.status === "proposed" ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    loading={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(activeDecision.id)}
                  >
                    Подтвердить решение
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    loading={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(activeDecision.id)}
                  >
                    Отклонить решение
                  </Button>
                </div>
              ) : null}
              {activeDecision.warnings.length ? (
                <Alert>
                  <AlertIcon />
                  <div>
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      {activeDecision.warnings.join("; ")}
                    </AlertDescription>
                  </div>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Предлагаемые действия</CardTitle>
            </CardHeader>
            <CardContent>
              {activeDecision.actions.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип</TableHead>
                        <TableHead>Инструмент</TableHead>
                        <TableHead>Лоты</TableHead>
                        <TableHead>Счет</TableHead>
                        <TableHead>Уверенность</TableHead>
                        <TableHead>Тезис</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeDecision.actions.map((action) => (
                        <TableRow
                          key={`${action.type}-${action.instrumentId}-${action.accountId}`}
                        >
                          <TableCell className="font-medium uppercase">
                            {action.type}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-[#10201b]">
                                {action.instrumentName ?? action.ticker}
                              </div>
                              <div className="text-xs text-[#60716a]">
                                ({action.ticker})
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{action.lots}</TableCell>
                          <TableCell>{action.accountId}</TableCell>
                          <TableCell>
                            {Math.round(action.confidence * 100)}%
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{action.thesis}</div>
                              <div className="text-xs text-[#60716a]">
                                {action.portfolioImpact}
                              </div>
                              {action.riskNotes.length ? (
                                <div className="text-xs text-[#8a6d3b]">
                                  {action.riskNotes.join("; ")}
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState text="AI не нашел сильных buy/sell действий и рекомендует удержание текущего портфеля." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Топ-10 рекомендаций к покупке</CardTitle>
            </CardHeader>
            <CardContent>
              {topBuyIdeas.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Инструмент</TableHead>
                        <TableHead>Счет</TableHead>
                        <TableHead>Уверенность</TableHead>
                        <TableHead>Почему покупать</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topBuyIdeas.map((action, index) => (
                        <TableRow
                          key={`top-buy-${action.instrumentId}-${action.accountId}-${index}`}
                        >
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-[#10201b]">
                                {action.instrumentName ?? action.ticker}
                              </div>
                              <div className="text-xs text-[#60716a]">
                                ({action.ticker})
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{action.accountId}</TableCell>
                          <TableCell>
                            {Math.round(action.confidence * 100)}%
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{action.thesis}</div>
                              <div className="text-xs text-[#60716a]">
                                Триггер: {action.trigger}
                              </div>
                              {action.riskNotes.length ? (
                                <div className="text-xs text-[#8a6d3b]">
                                  {action.riskNotes.join("; ")}
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState text="В текущем AI-решении нет выраженных рекомендаций к покупке." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Отклоненные идеи</CardTitle>
            </CardHeader>
            <CardContent>
              {activeDecision.rejectedIdeas.length ? (
                <div className="space-y-3">
                  {activeDecision.rejectedIdeas.map((idea, index) => (
                    <div
                      key={`${idea}-${index}`}
                      className="rounded-2xl bg-[#f6faf7] p-4 text-sm text-[#30453f]"
                    >
                      {idea}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="AI не вернул отдельных rejected ideas для этого анализа." />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>История AI-решений</CardTitle>
        </CardHeader>
        <CardContent>
          {historyItems.length ? (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <DecisionHistoryCard
                  key={item.id}
                  decision={item}
                  isCurrent={activeDecision?.id === item.id}
                  onOpen={() => setDecision(item)}
                />
              ))}
              {historyTotalPages > 1 ? (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="text-sm text-[#60716a]">
                    Страница {historyPageNumber} из {historyTotalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={historyPageNumber <= 1}
                      onClick={() =>
                        setHistoryPage((current) => Math.max(1, current - 1))
                      }
                    >
                      Назад
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={historyPageNumber >= historyTotalPages}
                      onClick={() =>
                        setHistoryPage((current) =>
                          Math.min(historyTotalPages, current + 1),
                        )
                      }
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState text="AI-решения еще не сохранялись." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warm" | "blue";
}) {
  const toneClasses = {
    default: "bg-white",
    warm: "bg-[#fffaf2]",
    blue: "bg-[#f3f7ff]",
  };

  return (
    <Card className={toneClasses[tone]}>
      <div className="text-sm text-[#60716a]">{label}</div>
      <div className="mt-3 text-2xl font-semibold capitalize text-[#10201b]">
        {value.replaceAll("_", " ")}
      </div>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-[#60716a]">
      {text}
    </div>
  );
}

function JobStatusCard({
  job,
  loadingStageLabel,
  activeStageIndex,
}: {
  job?: Awaited<ReturnType<typeof getAiPreviewJob>>;
  loadingStageLabel: string;
  activeStageIndex: number;
}) {
  const statusTone = {
    queued: "bg-[#fffaf2] text-[#8b6b2d]",
    running: "bg-[#f3f7ff] text-[#355fb8]",
    completed: "bg-[#f6faf7] text-[#11795f]",
    failed: "bg-[#fff5f5] text-[#b84d4d]",
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-medium text-[#10201b]">
            {job ? `Job ${job.id}` : "Создаем preview job..."}
          </div>
          {job ? (
            <div
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${statusTone[job.status]}`}
            >
              {job.status}
            </div>
          ) : null}
        </div>
        <div className="text-sm text-[#60716a]">
          {job?.status === "failed"
            ? job.errorMessage || "Job завершился с ошибкой"
            : loadingStageLabel}
        </div>
        <div className="space-y-3 pt-2">
          {AI_JOB_STEPS.map((stage, index) => {
            const isCompleted =
              job?.status === "completed" ||
              (activeStageIndex >= 0 && index < activeStageIndex);
            const isCurrent =
              job?.status !== "completed" &&
              job?.status !== "failed" &&
              activeStageIndex === index;
            const isFailed =
              job?.status === "failed" && activeStageIndex === index;

            return (
              <div key={stage} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isFailed ? (
                    <XCircle className="h-5 w-5 text-[#b84d4d]" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-[#11795f]" />
                  ) : isCurrent ? (
                    <LoaderCircle className="h-5 w-5 animate-spin text-[#355fb8]" />
                  ) : (
                    <Circle className="h-5 w-5 text-[#b8c1bd]" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[#10201b]">
                    {AI_LOADING_STAGE_LABELS[stage]}
                  </div>
                  <div className="text-xs text-[#60716a]">
                    {isFailed
                      ? "Этап завершился ошибкой"
                      : isCompleted
                        ? "Этап завершен"
                        : isCurrent
                          ? "Этап выполняется сейчас"
                          : "Ожидает выполнения"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: AiDecisionRecord["status"] }) {
  const styles = {
    proposed: "bg-[#fffaf2] text-[#8b6b2d]",
    approved: "bg-[#f6faf7] text-[#11795f]",
    rejected: "bg-[#fff5f5] text-[#b84d4d]",
    executed: "bg-[#f3f7ff] text-[#355fb8]",
    failed: "bg-[#fff5f5] text-[#b84d4d]",
  };

  return (
    <div
      className={`rounded-full px-3 py-1 font-medium capitalize ${styles[status]}`}
    >
      {status}
    </div>
  );
}

function DecisionHistoryCard({
  decision,
  isCurrent,
  onOpen,
}: {
  decision: AiDecisionRecord;
  isCurrent: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl border p-4 text-left transition-colors ${
        isCurrent
          ? "border-[#11795f]/30 bg-[#f6faf7]"
          : "border-black/8 bg-white hover:bg-[#f9fbfa]"
      }`}
      onClick={onOpen}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-[#10201b]">{decision.summary}</div>
          <div className="mt-1 text-xs text-[#60716a]">
            {new Date(decision.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <StatusBadge status={decision.status} />
      </div>
    </button>
  );
}
