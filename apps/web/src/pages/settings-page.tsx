import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from "antd";
import {
  settingsSchema,
  type SettingsSchema,
} from "@/features/settings/schema";
import { useUiStore } from "@/store/ui-store";

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
    message.success("Настройки сохранены локально");
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}>
        <Card className="rounded-[28px] border-0">
          <Typography.Title level={4}>Профиль кабинета</Typography.Title>
          <Space direction="vertical" size="large" className="w-full">
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <div>
                  <Typography.Text>Имя владельца</Typography.Text>
                  <Input
                    {...field}
                    size="large"
                    placeholder="Например, Valerii"
                    className="mt-2"
                  />
                  {errors.fullName ? (
                    <Typography.Text className="mt-2 block text-red-500">
                      {errors.fullName.message}
                    </Typography.Text>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="primaryGoal"
              control={control}
              render={({ field }) => (
                <div>
                  <Typography.Text>Главная цель</Typography.Text>
                  <Input.TextArea {...field} rows={4} className="mt-2" />
                  {errors.primaryGoal ? (
                    <Typography.Text className="mt-2 block text-red-500">
                      {errors.primaryGoal.message}
                    </Typography.Text>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="riskProfile"
              control={control}
              render={({ field }) => (
                <div>
                  <Typography.Text>Профиль риска</Typography.Text>
                  <Select
                    value={field.value}
                    onChange={field.onChange}
                    size="large"
                    options={riskOptions}
                    className="mt-2 w-full"
                  />
                </div>
              )}
            />

            <Controller
              name="telegram"
              control={control}
              render={({ field }) => (
                <div>
                  <Typography.Text>Контакт</Typography.Text>
                  <Input
                    {...field}
                    size="large"
                    placeholder="@invest_agent_demo"
                    className="mt-2"
                  />
                  {errors.telegram ? (
                    <Typography.Text className="mt-2 block text-red-500">
                      {errors.telegram.message}
                    </Typography.Text>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="dailyDigest"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-[24px] bg-[#f6faf7] px-5 py-4">
                  <div>
                    <Typography.Text className="block font-medium">
                      Ежедневный digest
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      Включить локальный флаг уведомлений для будущей
                      интеграции.
                    </Typography.Text>
                  </div>
                  <Switch checked={field.value} onChange={field.onChange} />
                </div>
              )}
            />

            <Space>
              <Button
                type="primary"
                size="large"
                loading={isSubmitting}
                onClick={handleSubmit(onSubmit)}
              >
                Сохранить
              </Button>
              <Button
                size="large"
                disabled={!isDirty}
                onClick={() => reset(settings)}
              >
                Сбросить
              </Button>
            </Space>
          </Space>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <Card className="rounded-[28px] border-0 bg-[#fffaf2]">
          <Typography.Text className="text-[11px] uppercase tracking-[0.28em] text-[#8b6b2d]">
            local store
          </Typography.Text>
          <Typography.Title level={4} className="!mt-2">
            Что хранится в Zustand
          </Typography.Title>
          <div className="space-y-3 text-sm leading-7 text-[#5d5646]">
            <div>- состояние сайдбара</div>
            <div>- локальные настройки пользователя</div>
            <div>- база для следующих UI-предпочтений и feature flags</div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
