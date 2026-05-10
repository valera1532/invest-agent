import { useEffect } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { QueryState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  getInvestorSettings,
  saveInvestorSettings,
} from "@/features/settings/api/settings";
import {
  settingsSchema,
  type SettingsSchema,
} from "@/features/settings/schema";

const riskOptions = [
  { label: "Консервативный", value: "conservative" },
  { label: "Сбалансированный", value: "balanced" },
  { label: "Рост", value: "growth" },
  { label: "Агрессивный", value: "aggressive" },
];

const reviewFrequencyOptions = [
  { label: "Каждый день", value: "daily" },
  { label: "Раз в неделю", value: "weekly" },
  { label: "Раз в месяц", value: "monthly" },
];

const defaultSettings: SettingsSchema = {
  fullName: "Valerii Investor",
  primaryGoal:
    "Сформировать понятный инвестиционный портфель под цели пользователя",
  riskProfile: "balanced",
  telegram: "@invest_agent_demo",
  dailyDigest: true,
  executionMode: "manual_approval",
  aiReviewFrequency: "daily",
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["investor-settings"],
    queryFn: getInvestorSettings,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
  });

  const saveMutation = useMutation({
    mutationFn: saveInvestorSettings,
    onSuccess: async (values) => {
      reset(values);
      queryClient.setQueryData(["investor-settings"], values);
      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      toast.success("Настройки сохранены в базе данных");
    },
    onError: () => toast.error("Не удалось сохранить настройки AI-портфеля"),
  });

  useEffect(() => {
    if (settingsQuery.data) {
      reset(settingsQuery.data);
    }
  }, [reset, settingsQuery.data]);

  const onSubmit = async (values: SettingsSchema) => {
    await saveMutation.mutateAsync(values);
  };

  return (
    <QueryState
      isLoading={settingsQuery.isLoading}
      error={settingsQuery.error as Error | null}
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Профиль AI-портфеля</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <Field label="Имя владельца" error={errors.fullName?.message}>
                    <Input {...field} placeholder="Например, Valerii" />
                  </Field>
                )}
              />
              <Controller
                name="primaryGoal"
                control={control}
                render={({ field }) => (
                  <Field
                    label="Главная цель"
                    error={errors.primaryGoal?.message}
                  >
                    <Textarea {...field} rows={4} />
                  </Field>
                )}
              />
              <Controller
                name="riskProfile"
                control={control}
                render={({ field }) => (
                  <Field label="Профиль риска">
                    <Select value={field.value} onChange={field.onChange}>
                      {riskOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="telegram"
                control={control}
                render={({ field }) => (
                  <Field label="Контакт" error={errors.telegram?.message}>
                    <Input {...field} placeholder="@invest_agent_demo" />
                  </Field>
                )}
              />
              <Controller
                name="dailyDigest"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-[24px] bg-[#f6faf7] px-5 py-4">
                    <div>
                      <div className="font-medium text-[#10201b]">
                        Ежедневный digest
                      </div>
                      <div className="text-sm text-[#52625d]">
                        Флаг для ежедневных сводок и будущих уведомлений от AI.
                      </div>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
              <Controller
                name="aiReviewFrequency"
                control={control}
                render={({ field }) => (
                  <Field label="Как часто AI пересматривает портфель?">
                    <Select value={field.value} onChange={field.onChange}>
                      {reviewFrequencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="executionMode"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-[24px] border border-[#f0d9b0] bg-[#fffaf2] px-5 py-4">
                    <div className="max-w-[80%]">
                      <div className="font-medium text-[#10201b]">
                        Полные права на покупку и продажу
                      </div>
                      <div className="text-sm text-[#6f634d]">
                        Выключено: AI только предлагает сделки и должен
                        спрашивать подтверждение. Включено: AI может сам
                        покупать и продавать по профилю риска и цели портфеля.
                      </div>
                    </div>
                    <Switch
                      checked={field.value === "full_auto"}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked ? "full_auto" : "manual_approval",
                        )
                      }
                    />
                  </div>
                )}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting || saveMutation.isPending}
                >
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={!isDirty || !settingsQuery.data}
                  onClick={() =>
                    settingsQuery.data && reset(settingsQuery.data)
                  }
                >
                  Сбросить
                </Button>
                <Link to="/app/investor-quiz">
                  <Button type="button" variant="outline" size="lg">
                    Перепройти инвест-квиз
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-[#fffaf2]">
          <CardHeader>
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#8b6b2d]">
              server state
            </div>
            <CardTitle>Что теперь хранится в БД</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-[#5d5646]">
            <div>- профиль риска и цель портфеля</div>
            <div>- контакт и флаг ежедневных сводок</div>
            <div>
              - режим автоторговли: с подтверждением или с полными правами
            </div>
            <div>- имя владельца, которое используется во всем кабинете</div>
          </CardContent>
        </Card>
      </div>
    </QueryState>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-[#b84d4d]">{error}</p> : null}
    </div>
  );
}
