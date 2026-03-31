import { useQuery } from "@tanstack/react-query";
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

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Капитал"
              value={`${query.data.totalCapital.toLocaleString("ru-RU")} RUB`}
            />
            <MetricCard
              label="В бумагах"
              value={`${query.data.investedCapital.toLocaleString("ru-RU")} RUB`}
              tone="green"
            />
            <MetricCard
              label="Денежный остаток"
              value={`${query.data.cashBalance.toLocaleString("ru-RU")} RUB`}
              tone="warm"
            />
            <MetricCard
              label="Счетов подключено"
              value={String(query.data.accountsCount)}
              tone="blue"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Позиции портфеля</CardTitle>
              </CardHeader>
              <CardContent>
                {query.data.positions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Тикер</TableHead>
                          <TableHead>Компания</TableHead>
                          <TableHead>Количество</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Стоимость</TableHead>
                          <TableHead>Счет</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {query.data.positions.map((position) => (
                          <TableRow
                            key={`${position.ticker}-${position.accountName ?? "account"}`}
                          >
                            <TableCell className="font-medium">
                              {position.ticker}
                            </TableCell>
                            <TableCell>{position.name}</TableCell>
                            <TableCell>
                              {position.quantity.toLocaleString("ru-RU")}
                            </TableCell>
                            <TableCell>
                              {position.lastPrice != null
                                ? `${position.lastPrice.toLocaleString("ru-RU")} ${position.currency ?? ""}`.trim()
                                : "Нет данных"}
                            </TableCell>
                            <TableCell>
                              {position.currentValue != null
                                ? `${position.currentValue.toLocaleString("ru-RU")} ${position.currency ?? ""}`.trim()
                                : "Нет данных"}
                            </TableCell>
                            <TableCell>
                              {position.accountName ?? "Без названия"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState text="В портфеле пока нет позиций" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Счета и остатки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {query.data.accounts.length > 0 ? (
                    query.data.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="rounded-2xl bg-[#f6faf7] p-4"
                      >
                        <div className="font-semibold text-[#10201b]">
                          {account.name || account.id}
                        </div>
                        <div className="mt-1 text-sm text-[#52625d]">
                          {account.type || "Тип счета не указан"}
                        </div>
                        <div className="mt-1 text-sm text-[#52625d]">
                          {account.status || "Статус не указан"}
                        </div>
                      </div>
                    ))
                  ) : query.data.cash.length > 0 ? (
                    query.data.cash.map((item, index) => (
                      <div
                        key={`${item.currency}-${index}`}
                        className="rounded-2xl bg-[#f6faf7] p-4"
                      >
                        <div className="font-semibold text-[#10201b]">
                          {item.currency}
                        </div>
                        <div className="mt-1 text-sm text-[#52625d]">
                          {item.amount.toLocaleString("ru-RU")}
                        </div>
                        <div className="mt-1 text-sm text-[#52625d]">
                          {item.accountName ?? "Без названия счета"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState text="Счета и денежные остатки не найдены" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </QueryState>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "green" | "warm" | "blue";
}) {
  const toneClasses = {
    default: "bg-white",
    green: "bg-[#f6faf7]",
    warm: "bg-[#fffaf2]",
    blue: "bg-[#f3f7ff]",
  };

  return (
    <Card className={toneClasses[tone]}>
      <div className="text-sm text-[#60716a]">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-[#10201b]">{value}</div>
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
