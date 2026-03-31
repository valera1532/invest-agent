import { useEffect } from "react";
import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  settingsSchema,
  type SettingsSchema,
} from "@/features/settings/schema";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const riskOptions = [
  { label: "Консервативный", value: "conservative" },
  { label: "Сбалансированный", value: "balanced" },
  { label: "Рост", value: "growth" },
];

export function SettingsPage() {
  const settings = useUiStore((state) => state.settings);
  const saveSettings = useUiStore((state) => state.saveSettings);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    reset(settings);
  }, [reset, settings]);

  const onSubmit = async (values: SettingsSchema) => {
    saveSettings(values);
    toast.success("Настройки сохранены локально");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Профиль кабинета</CardTitle>
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
                <Field label="Главная цель" error={errors.primaryGoal?.message}>
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
                      Локальный флаг уведомлений для будущей интеграции.
                    </div>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="lg" loading={isSubmitting}>
                Сохранить
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!isDirty}
                onClick={() => reset(settings)}
              >
                Сбросить
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#fffaf2]">
        <CardHeader>
          <div className="text-[11px] uppercase tracking-[0.28em] text-[#8b6b2d]">
            local store
          </div>
          <CardTitle>Что хранится в Zustand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-[#5d5646]">
          <div>- состояние сайдбара</div>
          <div>- локальные настройки пользователя</div>
          <div>- база для следующих UI-предпочтений и feature flags</div>
        </CardContent>
      </Card>
    </div>
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
