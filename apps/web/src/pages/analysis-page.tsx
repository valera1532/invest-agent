import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/query-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getPortfolioSnapshot,
  type PortfolioSnapshot,
  type PortfolioTotals,
} from "@/features/portfolio/api/get-portfolio-snapshot";

type PortfolioTotalKey = Exclude<keyof PortfolioTotals, "totalPortfolio">;

type ChartRow = {
  key: string;
  label: string;
  value: number;
  percent: number;
  color: string;
  description?: string;
};

const assetAllocationConfig: Array<{
  key: PortfolioTotalKey;
  label: string;
  color: string;
  description: string;
}> = [
  {
    key: "shares",
    label: "Акции",
    color: "#11795f",
    description: "Долевые инструменты",
  },
  {
    key: "bonds",
    label: "Облигации",
    color: "#d69a25",
    description: "Долговые инструменты",
  },
  {
    key: "etf",
    label: "Фонды ETF",
    color: "#4e7dd1",
    description: "Биржевые фонды",
  },
  {
    key: "currencies",
    label: "Валюта и кэш",
    color: "#7a8b84",
    description: "Свободные денежные остатки",
  },
  {
    key: "futures",
    label: "Фьючерсы",
    color: "#7c3aed",
    description: "Срочные инструменты",
  },
  {
    key: "options",
    label: "Опционы",
    color: "#db2777",
    description: "Опционные позиции",
  },
  {
    key: "structuredProducts",
    label: "Структурные продукты",
    color: "#ea580c",
    description: "Ноты и структурные инструменты",
  },
  {
    key: "other",
    label: "Прочее",
    color: "#94a3b8",
    description: "Не классифицировано брокером",
  },
];

const sectorLabels: Record<string, string> = {
  energy: "Нефть, газ и энергетика",
  financial: "Финансы",
  financials: "Финансы",
  it: "IT",
  information_technology: "IT",
  technology: "IT",
  telecom: "Телеком",
  telecommunications: "Телеком",
  communication_services: "Телеком и связь",
  materials: "Материалы",
  industrials: "Промышленность",
  consumer: "Потребительский сектор",
  consumer_discretionary: "Потребительские товары",
  consumer_staples: "Товары первой необходимости",
  health_care: "Здравоохранение",
  healthcare: "Здравоохранение",
  real_estate: "Недвижимость",
  utilities: "Коммунальные услуги",
  other: "Прочее",
  unknown: "Сектор не указан",
};

const sectorColors = [
  "#11795f",
  "#d69a25",
  "#4e7dd1",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#64748b",
  "#84a12e",
  "#b45309",
];

export function AnalysisPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const accountsQuery = useQuery({
    queryKey: ["analysis-portfolio-accounts"],
    queryFn: () => getPortfolioSnapshot(),
    staleTime: 60_000,
  });
  const query = useQuery({
    queryKey: ["analysis-portfolio", selectedAccountId],
    queryFn: () =>
      getPortfolioSnapshot(
        selectedAccountId === "all"
          ? undefined
          : { accountId: selectedAccountId },
      ),
    staleTime: 60_000,
  });
  const visibleAccounts =
    accountsQuery.data?.accounts ?? query.data?.accounts ?? [];
  const assetRows = query.data ? buildAssetAllocationRows(query.data) : [];
  const stockSectorRows = query.data
    ? buildStockSectorAllocationRows(query.data)
    : [];
  const stockSectorValue = stockSectorRows.reduce(
    (sum, row) => sum + row.value,
    0,
  );

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Счета для анализа</CardTitle>
              <CardDescription>
                Выберите один счет или анализируйте общий портфель по всем
                счетам.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <AccountChip
                  isActive={selectedAccountId === "all"}
                  onClick={() => setSelectedAccountId("all")}
                >
                  Все счета
                </AccountChip>
                {visibleAccounts.map((account, index) => (
                  <AccountChip
                    key={account.id}
                    isActive={selectedAccountId === account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    {account.name?.trim() || `Брокерский счет ${index + 1}`}
                  </AccountChip>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Стоимость портфеля"
              value={formatMoney(query.data.totalValue)}
              note="По данным T-Bank Portfolio API"
            />
            <MetricCard
              label="Ценные бумаги"
              value={formatMoney(query.data.stocksValue)}
              tone="green"
              note={`Позиций: ${query.data.positions.length}`}
            />
            <MetricCard
              label="Секторная база"
              value={formatMoney(stockSectorValue)}
              tone="warm"
              note={`Акционных секторов: ${stockSectorRows.length}`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardHeader>
                <CardTitle>Распределение по классам активов</CardTitle>
                <CardDescription>
                  Доля акций, облигаций, фондов, валюты и других инструментов.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assetRows.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-center">
                    <DonutChart
                      rows={assetRows}
                      centerLabel="Портфель"
                      centerValue={formatMoney(query.data.totalValue)}
                    />
                    <DistributionList rows={assetRows} />
                  </div>
                ) : (
                  <EmptyState text="Нет данных для распределения по классам активов" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Распределение по секторам</CardTitle>
                <CardDescription>
                  Проценты показывают структуру только акционной части портфеля:
                  нефтегаз, IT, финансы и другие сектора.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stockSectorRows.length > 0 ? (
                  <BarDistribution rows={stockSectorRows} />
                ) : (
                  <EmptyState text="В портфеле нет акций с рыночной оценкой для секторного анализа" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Крупнейшие секторные экспозиции</CardTitle>
              <CardDescription>
                Показывает крупнейшие сектора внутри акционной части портфеля.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockSectorRows.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {stockSectorRows.slice(0, 6).map((row) => (
                    <div
                      key={row.key}
                      className="rounded-3xl border border-black/5 bg-[#f6faf7] p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-sm font-semibold text-[#10201b]">
                          {row.label}
                        </span>
                      </div>
                      <div className="mt-3 text-2xl font-semibold text-[#10201b]">
                        {formatPercent(row.percent)}
                      </div>
                      <div className="mt-1 text-sm text-[#60716a]">
                        {formatMoney(row.value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Секторные экспозиции появятся, когда в портфеле будут акции с рыночной оценкой" />
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </QueryState>
  );
}

function buildAssetAllocationRows(portfolio: PortfolioSnapshot) {
  const positionTotals = buildPositionTypeTotals(portfolio);
  const rawRows = assetAllocationConfig
    .map((item) => {
      const brokerValue = portfolio.totals[item.key];
      const value =
        item.key === "currencies"
          ? brokerValue > 0
            ? brokerValue
            : portfolio.cashValue
          : brokerValue > 0
            ? brokerValue
            : positionTotals[item.key];

      return {
        key: item.key,
        label: item.label,
        value,
        color: item.color,
        description: item.description,
      };
    })
    .filter((row) => row.value > 0);

  return addPercent(rawRows);
}

function buildPositionTypeTotals(portfolio: PortfolioSnapshot) {
  const totals: Record<PortfolioTotalKey, number> = {
    shares: 0,
    bonds: 0,
    etf: 0,
    currencies: 0,
    futures: 0,
    options: 0,
    structuredProducts: 0,
    other: 0,
  };

  for (const position of portfolio.positions) {
    const value = position.currentValue ?? 0;
    if (value <= 0) {
      continue;
    }

    totals[mapInstrumentTypeToTotalKey(position.instrumentType)] += value;
  }

  return totals;
}

function mapInstrumentTypeToTotalKey(
  instrumentType?: string,
): PortfolioTotalKey {
  switch (instrumentType?.toLowerCase()) {
    case "share":
    case "shares":
      return "shares";
    case "bond":
    case "bonds":
      return "bonds";
    case "etf":
      return "etf";
    case "currency":
    case "currencies":
      return "currencies";
    case "future":
    case "futures":
      return "futures";
    case "option":
    case "options":
      return "options";
    case "sp":
    case "structured_product":
    case "structured_products":
      return "structuredProducts";
    default:
      return "other";
  }
}

function buildStockSectorAllocationRows(portfolio: PortfolioSnapshot) {
  const grouped = new Map<string, Omit<ChartRow, "percent" | "color">>();

  for (const position of portfolio.positions) {
    const value = position.currentValue ?? 0;
    if (
      value <= 0 ||
      mapInstrumentTypeToTotalKey(position.instrumentType) !== "shares"
    ) {
      continue;
    }

    const key = normalizeSectorKey(position.sector);
    const current = grouped.get(key);
    grouped.set(key, {
      key,
      label: formatSectorLabel(key, position.sector),
      value: (current?.value ?? 0) + value,
      description: current?.description,
    });
  }

  const rawRows = [...grouped.values()]
    .sort((left, right) => right.value - left.value)
    .map((row, index) => ({
      ...row,
      color: sectorColors[index % sectorColors.length] ?? "#64748b",
    }));

  return addPercent(rawRows);
}

function addPercent(rows: Array<Omit<ChartRow, "percent">>): ChartRow[] {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return addPercentAgainstTotal(rows, total);
}

function addPercentAgainstTotal(
  rows: Array<Omit<ChartRow, "percent">>,
  total: number,
): ChartRow[] {
  const safeTotal = Math.max(total, 0);

  return rows.map((row) => ({
    ...row,
    percent: safeTotal > 0 ? (row.value / safeTotal) * 100 : 0,
  }));
}

function normalizeSectorKey(sector?: string) {
  return sector?.trim().toLowerCase() || "unknown";
}

function formatSectorLabel(key: string, sector?: string) {
  return sectorLabels[key] ?? sector?.trim() ?? sectorLabels.unknown;
}

function buildConicGradient(rows: ChartRow[]) {
  if (rows.length === 0) {
    return "#edf2ee";
  }

  let cursor = 0;
  const segments = rows.map((row) => {
    const start = cursor;
    cursor += row.percent;
    return `${row.color} ${start}% ${cursor}%`;
  });

  if (cursor < 100) {
    segments.push(`#edf2ee ${cursor}% 100%`);
  }

  return `conic-gradient(${segments.join(", ")})`;
}

function formatMoney(value: number) {
  return `${Math.round(value).toLocaleString("ru-RU")} RUB`;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
    maximumFractionDigits: 1,
  })}%`;
}

function DonutChart({
  rows,
  centerLabel,
  centerValue,
}: {
  rows: ChartRow[];
  centerLabel: string;
  centerValue: string;
}) {
  return (
    <div className="flex justify-center">
      <div
        className="relative grid h-60 w-60 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]"
        style={{ background: buildConicGradient(rows) }}
      >
        <div className="grid h-36 w-36 place-items-center rounded-full bg-white text-center shadow-[0_14px_35px_rgba(18,32,28,0.14)]">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-[#8a9a94]">
              {centerLabel}
            </div>
            <div className="mt-2 px-3 text-lg font-semibold leading-tight text-[#10201b]">
              {centerValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributionList({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={row.key}
          className="rounded-2xl border border-black/5 bg-[#f9fbf8] px-4 py-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="font-semibold text-[#10201b]">
                  {row.label}
                </span>
              </div>
              {row.description ? (
                <div className="mt-1 text-sm text-[#60716a]">
                  {row.description}
                </div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="font-semibold text-[#10201b]">
                {formatPercent(row.percent)}
              </div>
              <div className="mt-1 text-sm text-[#60716a]">
                {formatMoney(row.value)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BarDistribution({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="space-y-5">
      {rows.map((row) => (
        <div key={row.key}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-semibold text-[#10201b]">{row.label}</div>
              <div className="mt-1 text-sm text-[#60716a]">
                {formatMoney(row.value)}
              </div>
            </div>
            <div className="text-right text-sm font-semibold text-[#10201b]">
              {formatPercent(row.percent)}
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full bg-[#edf2ee]">
            <div
              className="h-3 rounded-full"
              style={{
                width: `${Math.max(row.percent, 1)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
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

function AccountChip({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button
      type="button"
      variant={isActive ? "default" : "outline"}
      className={
        isActive
          ? "bg-[#17362f] hover:bg-[#143028]"
          : "bg-white hover:bg-[#f6faf7]"
      }
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
