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
import { getPortfolioSnapshot } from "@/features/portfolio/api/get-portfolio-snapshot";

export function PortfolioPage() {
  const query = useQuery({
    queryKey: ["portfolio-snapshot"],
    queryFn: getPortfolioSnapshot,
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Общая стоимость"
              value={`${query.data.totalValue.toLocaleString("ru-RU")} RUB`}
            />
            <MetricCard
              label="Стоимость бумаг"
              value={`${query.data.stocksValue.toLocaleString("ru-RU")} RUB`}
              tone="green"
            />
            <MetricCard
              label="Денежный остаток"
              value={`${query.data.cashValue.toLocaleString("ru-RU")} RUB`}
              tone="warm"
              note={
                query.data.accountId === "all"
                  ? `Счетов в выборке: ${query.data.accounts.length}`
                  : `Счет: ${query.data.accountId}`
              }
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
                          <TableHead>Эмитент</TableHead>
                          <TableHead>Количество</TableHead>
                          <TableHead>Цена</TableHead>
                          <TableHead>Стоимость</TableHead>
                          <TableHead>Инструмент</TableHead>
                          <TableHead>Счет</TableHead>
                          <TableHead>Валюта</TableHead>
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
                            <TableCell>{position.issuer}</TableCell>
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
                              {position.instrumentType ?? "-"}
                            </TableCell>
                            <TableCell>
                              {position.accountName ?? "Без названия"}
                            </TableCell>
                            <TableCell>{position.currency ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState text="В портфеле нет инструментов по текущим счетам" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Денежные остатки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {query.data.cash.length > 0 ? (
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
                    <EmptyState text="Денежные остатки отсутствуют" />
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
  note,
  tone = "default",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "default" | "green" | "warm";
}) {
  const toneClasses = {
    default: "bg-white",
    green: "bg-[#f6faf7]",
    warm: "bg-[#fffaf2]",
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
