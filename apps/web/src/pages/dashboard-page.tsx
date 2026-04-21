import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/query-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardOverview } from "@/features/dashboard/api/get-dashboard-overview";

const periodLabels = {
  week: "1 неделя",
  month: "1 месяц",
  year: "1 год",
} as const;

export function DashboardPage() {
  const [historyPeriod, setHistoryPeriod] = useState<"week" | "month" | "year">(
    "month",
  );
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["dashboard-overview", historyPeriod, page],
    queryFn: () => getDashboardOverview({ historyPeriod, page, pageSize: 10 }),
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Общая стоимость"
              value={`${query.data.totalValue.toLocaleString("ru-RU")} RUB`}
            />
            <MetricCard
              label="В активах"
              value={`${query.data.investedValue.toLocaleString("ru-RU")} RUB`}
              tone="green"
            />
            <MetricCard
              label="Денежный остаток"
              value={`${query.data.cashValue.toLocaleString("ru-RU")} RUB`}
              tone="warm"
            />
            <MetricCard
              label="Сделок за 30 дней"
              value={String(query.data.tradesCount30d)}
              tone="blue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Текущая доходность"
              value={
                query.data.currentYieldPct != null
                  ? `${query.data.currentYieldPct.toLocaleString("ru-RU")} %`
                  : "Нет данных"
              }
            />
            <MetricCard
              label="Изменение за день"
              value={
                query.data.dailyYield != null
                  ? `${query.data.dailyYield.toLocaleString("ru-RU")} RUB`
                  : "Нет данных"
              }
              note={
                query.data.dailyYieldPct != null
                  ? `${query.data.dailyYieldPct.toLocaleString("ru-RU")} %`
                  : undefined
              }
              tone={
                query.data.dailyYield != null && query.data.dailyYield >= 0
                  ? "green"
                  : "rose"
              }
            />
            <MetricCard
              label="Счетов подключено"
              value={String(query.data.accountsCount)}
              tone="blue"
            />
            <Card className="bg-[#f6faf7]">
              <div className="text-sm text-[#60716a]">Обзор проекта</div>
              <div className="mt-3 text-sm leading-7 text-[#30453f]">
                Раздел показывает динамику портфеля, активность по сделкам и
                недавнюю историю покупок и продаж по данным T-Bank.
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Динамика портфеля по периодам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {query.data.periods.map((period) => (
                  <PeriodMetricCard
                    key={period.period}
                    label={periodLabels[period.period]}
                    change={period.change}
                    relativeChange={period.relativeChange}
                    tradesCount={period.tradesCount}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История покупок и продаж</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-3">
                {(["week", "month", "year"] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    variant={historyPeriod === period ? "default" : "outline"}
                    onClick={() => {
                      setHistoryPeriod(period);
                      setPage(1);
                    }}
                  >
                    {periodLabels[period]}
                  </Button>
                ))}
              </div>
              {query.data.tradeHistory.items.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Инструмент</TableHead>
                        <TableHead>Действие</TableHead>
                        <TableHead>Количество</TableHead>
                        <TableHead>Цена</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Счет</TableHead>
                        <TableHead>Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {query.data.tradeHistory.items.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-[#10201b]">
                                {trade.name}
                              </div>
                              <div className="text-xs text-[#60716a]">
                                ({trade.ticker})
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                trade.action === "buy"
                                  ? "text-[#11795f]"
                                  : "text-[#b84d4d]"
                              }
                            >
                              {trade.action === "buy" ? "Покупка" : "Продажа"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {trade.quantity.toLocaleString("ru-RU")}
                          </TableCell>
                          <TableCell>
                            {trade.price != null
                              ? `${trade.price.toLocaleString("ru-RU")} ${trade.currency ?? ""}`.trim()
                              : "Нет данных"}
                          </TableCell>
                          <TableCell>
                            {trade.total != null
                              ? `${trade.total.toLocaleString("ru-RU")} ${trade.currency ?? ""}`.trim()
                              : "Нет данных"}
                          </TableCell>
                          <TableCell>
                            {trade.accountName ?? "Без названия"}
                          </TableCell>
                          <TableCell>
                            {trade.date
                              ? new Date(trade.date).toLocaleString("ru-RU")
                              : "Нет данных"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState text="История сделок пока недоступна" />
              )}
              {query.data.tradeHistory.totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-sm text-[#60716a]">
                    Страница {query.data.tradeHistory.page} из{" "}
                    {query.data.tradeHistory.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={query.data.tradeHistory.page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      Назад
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        query.data.tradeHistory.page >=
                        query.data.tradeHistory.totalPages
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            query.data.tradeHistory.totalPages,
                            current + 1,
                          ),
                        )
                      }
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </QueryState>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "green" | "warm" | "blue" | "rose";
}) {
  const toneClasses = {
    default: "bg-white",
    green: "bg-[#f6faf7]",
    warm: "bg-[#fffaf2]",
    blue: "bg-[#f3f7ff]",
    rose: "bg-[#fff5f5]",
  };

  return (
    <Card className={toneClasses[tone]}>
      <div className="text-sm text-[#60716a]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-[#10201b]">{value}</div>
      {note ? <div className="mt-3 text-sm text-[#60716a]">{note}</div> : null}
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

function PeriodMetricCard({
  label,
  change,
  relativeChange,
  tradesCount,
}: {
  label: string;
  change: number;
  relativeChange: number;
  tradesCount: number;
}) {
  const isPositive = change >= 0;
  const tone = isPositive ? "bg-[#f6faf7]" : "bg-[#fff5f5]";
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const iconColor = isPositive ? "text-[#11795f]" : "text-[#b84d4d]";

  return (
    <Card className={tone}>
      <div className="text-sm text-[#60716a]">{label}</div>
      <div className="mt-4 flex items-center gap-3">
        <div
          className={`rounded-2xl p-2 ${isPositive ? "bg-[#e7f6ef]" : "bg-[#fdeaea]"}`}
        >
          <Icon className={iconColor} size={22} />
        </div>
        <div>
          <div className={`text-3xl font-semibold ${iconColor}`}>
            {`${relativeChange >= 0 ? "+" : ""}${relativeChange.toLocaleString("ru-RU")} %`}
          </div>
          <div className="mt-1 text-sm text-[#60716a]">
            {`${change >= 0 ? "+" : ""}${change.toLocaleString("ru-RU")} RUB`}
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-[#60716a]">
        Сделок за период: {tradesCount}
      </div>
    </Card>
  );
}
