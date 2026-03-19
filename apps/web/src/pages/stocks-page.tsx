import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Input, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QueryState } from "@/components/query-state";
import { getMarketHighlights } from "@/features/markets/api/get-market-highlights";
import type { MarketHighlight } from "@/features/markets/api/get-market-highlights";

const columns: ColumnsType<MarketHighlight> = [
  { title: "Тикер", dataIndex: "ticker", width: 110 },
  { title: "Компания", dataIndex: "name" },
  { title: "Сектор", dataIndex: "sector" },
  {
    title: "Цена",
    dataIndex: "price",
    render: (value: number) => `${value.toLocaleString("ru-RU")} RUB`,
    sorter: (a, b) => a.price - b.price,
  },
  {
    title: "Неделя",
    dataIndex: "weekChange",
    render: (value: number) => (
      <Tag color={value >= 0 ? "green" : "red"}>{value}%</Tag>
    ),
    sorter: (a, b) => a.weekChange - b.weekChange,
  },
  { title: "Дивидендный тезис", dataIndex: "dividendStory" },
  { title: "Комментарий", dataIndex: "thesis" },
];

export function StocksPage() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["market-highlights"],
    queryFn: getMarketHighlights,
  });

  const filteredData = useMemo(() => {
    if (!query.data) return [];

    const normalized = search.trim().toLowerCase();
    if (!normalized) return query.data;

    return query.data.filter((item) => {
      return [item.ticker, item.sector, item.dividendStory, item.thesis]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query.data, search]);

  const leader = filteredData[0];

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      <div className="flex flex-1 flex-col gap-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card className="rounded-[28px] border-0 bg-[#f6faf7]">
              <Typography.Text type="secondary">Лидер списка</Typography.Text>
              <Typography.Title level={3} className="!mb-0 !mt-3">
                {leader?.ticker ?? "-"}
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="rounded-[28px] border-0 bg-[#fffaf2]">
              <Typography.Text type="secondary">
                Средняя динамика
              </Typography.Text>
              <Typography.Title level={3} className="!mb-0 !mt-3">
                {filteredData.length
                  ? (
                      filteredData.reduce(
                        (total, asset) => total + asset.weekChange,
                        0,
                      ) / filteredData.length
                    ).toFixed(2)
                  : "0.00"}
                %
              </Typography.Title>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="rounded-[28px] border-0 bg-[#f3f7ff]">
              <Typography.Text type="secondary">Найдено бумаг</Typography.Text>
              <Typography.Title level={3} className="!mb-0 !mt-3">
                {filteredData.length}
              </Typography.Title>
            </Card>
          </Col>
        </Row>

        <Card className="flex-1 rounded-[28px] border-0">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography.Title level={4} className="!mb-1">
                Акции
              </Typography.Title>
              <Typography.Text type="secondary">
                Котировки приходят с backend T-API, при недоступности бэка
                включается локальный fallback.
              </Typography.Text>
            </div>
            <Input.Search
              allowClear
              placeholder="Поиск по тикеру, сектору или тезису"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full md:max-w-sm"
            />
          </div>

          <Table
            rowKey="ticker"
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1100 }}
          />
        </Card>
      </div>
    </QueryState>
  );
}
