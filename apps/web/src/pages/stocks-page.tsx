import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { QueryState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMarketHighlights } from "@/features/markets/api/get-market-highlights";
import {
  createBuyOrder,
  getBrokerageAccounts,
  searchTradingShares,
} from "@/features/trading/api/trading";

export function StocksPage() {
  const [search, setSearch] = useState("");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["market-highlights"],
    queryFn: getMarketHighlights,
  });
  const accountsQuery = useQuery({
    queryKey: ["brokerage-accounts"],
    queryFn: getBrokerageAccounts,
  });
  const shareCatalogQuery = useQuery({
    queryKey: ["trading-shares", catalogQuery],
    queryFn: () => searchTradingShares(catalogQuery),
    enabled: catalogQuery.trim().length >= 2,
  });

  const buyMutation = useMutation({
    mutationFn: createBuyOrder,
    onSuccess: async (result) => {
      toast.success(result.message || "Заявка на покупку отправлена");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["market-highlights"] }),
        queryClient.invalidateQueries({ queryKey: ["portfolio-snapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
      ]);
    },
    onError: () => toast.error("Не удалось выставить заявку на покупку"),
  });

  const filteredData = useMemo(() => {
    if (!query.data) return [];
    const normalized = search.trim().toLowerCase();
    if (!normalized) return query.data;
    return query.data.filter((item) =>
      [item.ticker, item.name, item.currency]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query.data, search]);

  const selectedShare = useMemo(() => {
    if (!shareCatalogQuery.data?.length) return null;
    return (
      shareCatalogQuery.data.find(
        (share) => share.instrumentId === selectedShareId,
      ) ?? shareCatalogQuery.data[0]
    );
  }, [selectedShareId, shareCatalogQuery.data]);

  const leader = filteredData[0];
  const latestPriceTime = filteredData
    .map((item) => item.lastPriceTime)
    .filter((item): item is string => Boolean(item))
    .sort()
    .at(-1);

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      <div className="flex flex-1 flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Лидер списка" value={leader?.ticker ?? "-"} />
          <MetricCard
            label="С ценой в ответе"
            value={String(
              filteredData.filter((item) => item.price != null).length,
            )}
            tone="warm"
          />
          <MetricCard
            label="Найдено бумаг"
            value={String(filteredData.length)}
            note={
              latestPriceTime
                ? new Date(latestPriceTime).toLocaleString("ru-RU")
                : "Время цены не пришло"
            }
            tone="blue"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Покупка акций</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#60716a]" />
                  <Input
                    className="pl-9"
                    value={catalogQuery}
                    onChange={(event) => setCatalogQuery(event.target.value)}
                    placeholder="Например, SBER или Yandex"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCatalogQuery(catalogQuery.trim())}
                >
                  Искать
                </Button>
              </div>

              {catalogQuery.trim().length < 2 ? (
                <EmptyState text="Введи минимум 2 символа, чтобы найти доступные акции для покупки" />
              ) : (
                <QueryState
                  isLoading={shareCatalogQuery.isLoading}
                  error={shareCatalogQuery.error as Error | null}
                >
                  {shareCatalogQuery.data?.length ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Тикер</TableHead>
                            <TableHead>Компания</TableHead>
                            <TableHead>Лот</TableHead>
                            <TableHead>Цена</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shareCatalogQuery.data.map((share) => (
                            <TableRow key={share.instrumentId}>
                              <TableCell className="font-medium">
                                {share.ticker}
                              </TableCell>
                              <TableCell>{share.name}</TableCell>
                              <TableCell>{share.lot}</TableCell>
                              <TableCell>
                                {share.lastPrice != null
                                  ? `${share.lastPrice.toLocaleString("ru-RU")} ${share.currency ?? ""}`.trim()
                                  : "Нет данных"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant={
                                    selectedShare?.instrumentId ===
                                    share.instrumentId
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    setSelectedShareId(share.instrumentId)
                                  }
                                >
                                  Выбрать
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <EmptyState text="По этому запросу T-Bank не вернул акции для торговли" />
                  )}
                </QueryState>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#f6faf7]">
            <CardHeader>
              <CardTitle>Заявка на покупку</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="rounded-2xl border border-[#d6e7de] bg-white p-4 text-sm text-[#30453f]">
                  {selectedShare ? (
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-[#10201b]">
                        {selectedShare.ticker} - {selectedShare.name}
                      </div>
                      <div>Лот: {selectedShare.lot}</div>
                      <div>
                        Цена:{" "}
                        {selectedShare.lastPrice != null
                          ? `${selectedShare.lastPrice.toLocaleString("ru-RU")} ${selectedShare.currency ?? ""}`.trim()
                          : "Нет данных"}
                      </div>
                    </div>
                  ) : (
                    "Акция пока не выбрана"
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Счет</Label>
                  <Select
                    id="accountId"
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                  >
                    <option value="">Выбери брокерский счет</option>
                    {(accountsQuery.data ?? []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name
                          ? `${account.name} (${account.type ?? account.id})`
                          : account.id}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество лотов</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value) || 1)
                    }
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={!selectedShare || !accountId}
                  loading={buyMutation.isPending}
                  onClick={() => {
                    if (!selectedShare) {
                      toast.warning("Сначала выбери акцию из списка");
                      return;
                    }
                    if (!accountId) {
                      toast.warning("Выбери брокерский счет");
                      return;
                    }
                    buyMutation.mutate({
                      accountId,
                      instrumentId: selectedShare.instrumentId,
                      quantity,
                    });
                  }}
                >
                  Купить на брокерский счет
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Акции в портфеле</CardTitle>
            <div className="flex items-center gap-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по тикеру, названию или валюте"
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Тикер</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Валюта</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Время цены</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.instrumentId}>
                        <TableCell className="font-medium">
                          {item.ticker}
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.currency ?? "-"}</TableCell>
                        <TableCell>
                          {item.price != null
                            ? `${item.price.toLocaleString("ru-RU")} ${item.currency ?? ""}`.trim()
                            : "Нет данных"}
                        </TableCell>
                        <TableCell>
                          {item.lastPriceTime
                            ? new Date(item.lastPriceTime).toLocaleString(
                                "ru-RU",
                              )
                            : "Нет данных"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState text="Бэк не вернул ни одной акции по текущему запросу" />
            )}
          </CardContent>
        </Card>
      </div>
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
