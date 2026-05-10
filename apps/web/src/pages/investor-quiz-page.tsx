import { useEffect } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { QueryState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getInvestorQuestionnaire,
  saveInvestorQuestionnaire,
} from "@/features/investor-questionnaire/api/investor-questionnaire";
import {
  investorQuestionnaireSchema,
  type InvestorQuestionnaireSchema,
} from "@/features/investor-questionnaire/schema";

const defaultValues: InvestorQuestionnaireSchema = {
  ageRange: "25_34",
  experienceLevel: "none",
  investmentGoal: "balanced_growth",
  investmentHorizon: "three_to_five_years",
  liquidityNeed: "in_several_years",
  drawdownTolerance: "up_to_20",
  drawdownReaction: "hold_and_wait",
  riskPriority: "balanced_approach",
  monthlyContribution: 30000,
  aiReviewFrequency: "daily",
};

export function InvestorQuizPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const questionnaireQuery = useQuery({
    queryKey: ["investor-questionnaire"],
    queryFn: getInvestorQuestionnaire,
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<InvestorQuestionnaireSchema>({
    resolver: zodResolver(investorQuestionnaireSchema),
    defaultValues,
  });
  const monthlyContribution = useWatch({
    control,
    name: "monthlyContribution",
  });

  const saveMutation = useMutation({
    mutationFn: saveInvestorQuestionnaire,
    onSuccess: async (result) => {
      reset(result);
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      await queryClient.invalidateQueries({ queryKey: ["investor-settings"] });
      toast.success(
        `Инвест-квиз завершен. Рекомендованный профиль: ${result.recommendedRiskProfile}`,
      );
      navigate({ to: "/app/overview" });
    },
    onError: () => toast.error("Не удалось сохранить инвест-квиз"),
  });

  useEffect(() => {
    if (questionnaireQuery.data) {
      reset(questionnaireQuery.data);
    }
  }, [questionnaireQuery.data, reset]);

  const onSubmit = async (values: InvestorQuestionnaireSchema) => {
    await saveMutation.mutateAsync(values);
  };

  return (
    <QueryState
      isLoading={questionnaireQuery.isLoading}
      error={questionnaireQuery.error as Error | null}
    >
      <div className="flex flex-1 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Инвест-квиз</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-[#d6e7de] bg-[#f6faf7] p-4 text-sm leading-7 text-[#30453f]">
              Ответь на несколько вопросов, чтобы AI определил рекомендуемую
              стратегию портфеля. Результат квиза будет использоваться для
              выбора risk profile и частоты AI-review.
            </div>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="ageRange"
                control={control}
                render={({ field }) => (
                  <Field label="Сколько вам лет?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="18_24">18–24</option>
                      <option value="25_34">25–34</option>
                      <option value="35_44">35–44</option>
                      <option value="45_54">45–54</option>
                      <option value="55_plus">55+</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="experienceLevel"
                control={control}
                render={({ field }) => (
                  <Field label="Есть ли у вас опыт инвестирования?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="none">Нет опыта</option>
                      <option value="up_to_one_year">До 1 года</option>
                      <option value="one_to_three_years">1–3 года</option>
                      <option value="three_plus_years">3+ года</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="investmentGoal"
                control={control}
                render={({ field }) => (
                  <Field label="Какая у вас главная цель инвестирования?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="capital_preservation">
                        Сохранение капитала
                      </option>
                      <option value="passive_income">Пассивный доход</option>
                      <option value="balanced_growth">Умеренный рост</option>
                      <option value="fast_growth">Быстрый рост капитала</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="investmentHorizon"
                control={control}
                render={({ field }) => (
                  <Field
                    label="На какой срок вы инвестируете?"
                    note="Инвестиции — это длинная история. Чем длиннее горизонт, тем устойчивее стратегия к краткосрочной волатильности."
                  >
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="less_than_one_year">До 1 года</option>
                      <option value="one_to_three_years">1–3 года</option>
                      <option value="three_to_five_years">3–5 лет</option>
                      <option value="five_plus_years">5+ лет</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="liquidityNeed"
                control={control}
                render={({ field }) => (
                  <Field
                    label="Как скоро вам могут понадобиться эти деньги?"
                    note="Частый вывод средств из инвестиций обычно вреден для результата: он мешает сложному проценту и ломает долгосрочную стратегию."
                  >
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="anytime">В любой момент</option>
                      <option value="within_one_year">В течение года</option>
                      <option value="in_several_years">
                        Скорее через несколько лет
                      </option>
                      <option value="long_term_only">
                        Это долгосрочный капитал
                      </option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="drawdownTolerance"
                control={control}
                render={({ field }) => (
                  <Field label="Какая максимальная просадка для вас допустима?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="up_to_10">До 10%</option>
                      <option value="up_to_20">До 20%</option>
                      <option value="up_to_30">До 30%</option>
                      <option value="over_30">Более 30%</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="drawdownReaction"
                control={control}
                render={({ field }) => (
                  <Field label="Если портфель упадет на 20%, вы скорее...">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="reduce_positions">Сокращу позиции</option>
                      <option value="hold_and_wait">
                        Подожду и ничего не буду делать
                      </option>
                      <option value="buy_more">Докуплю активы</option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="riskPriority"
                control={control}
                render={({ field }) => (
                  <Field label="Что для вас важнее?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="protect_capital">Сохранить капитал</option>
                      <option value="balanced_approach">
                        Баланс риска и роста
                      </option>
                      <option value="maximize_growth">
                        Максимизировать рост
                      </option>
                    </Select>
                  </Field>
                )}
              />

              <Controller
                name="monthlyContribution"
                control={control}
                render={({ field }) => (
                  <Field
                    label="Сколько вы готовы инвестировать каждый месяц?"
                    note={`Текущий выбор: ${monthlyContribution.toLocaleString("ru-RU")} RUB / месяц`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={200000}
                      step={5000}
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                      className="w-full accent-[#11795f]"
                    />
                  </Field>
                )}
              />

              <Controller
                name="aiReviewFrequency"
                control={control}
                render={({ field }) => (
                  <Field label="Как часто AI может пересматривать и реинвестировать портфель?">
                    <Select value={field.value} onChange={field.onChange}>
                      <option value="daily">Каждый день</option>
                      <option value="weekly">Раз в неделю</option>
                      <option value="monthly">Раз в месяц</option>
                    </Select>
                  </Field>
                )}
              />

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting || saveMutation.isPending}
                >
                  Сохранить и продолжить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate({ to: "/app/overview" })}
                >
                  Пройти позже
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </QueryState>
  );
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {note ? <p className="text-sm text-[#60716a]">{note}</p> : null}
    </div>
  );
}
