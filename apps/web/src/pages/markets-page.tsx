import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QueryState } from "@/components/query-state";
import { getMarketHighlights } from "@/features/markets/api/get-market-highlights";
import type { MarketHighlight } from "@/features/markets/api/get-market-highlights";

const columns: ColumnsType<MarketHighlight> = [
  { title: "Инструмент", dataIndex: "ticker" },
  { title: "Сектор", dataIndex: "sector" },
  {
    title: "Цена",
    dataIndex: "price",
    render: (value: number) => `${value.toLocaleString("ru-RU")} RUB`,
  },
  {
    title: "Неделя",
    dataIndex: "weekChange",
    render: (value: number) => (
      <Tag color={value >= 0 ? "green" : "red"}>{value}%</Tag>
    ),
  },
  { title: "Дивидендная история", dataIndex: "dividendStory" },
  { title: "Комментарий", dataIndex: "thesis" },
];

export function MarketsPage() {
  const query = useQuery({
    queryKey: ["market-highlights"],
    queryFn: getMarketHighlights,
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0 bg-[#f6faf7]">
                <Typography.Text type="secondary">
                  Лидеры недели
                </Typography.Text>
                <Typography.Title level={3} className="!mb-0 !mt-3">
                  {query.data[0]?.ticker}
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0 bg-[#fffaf2]">
                <Typography.Text type="secondary">
                  Средняя динамика
                </Typography.Text>
                <Typography.Title level={3} className="!mb-0 !mt-3">
                  {(
                    query.data.reduce(
                      (total, asset) => total + asset.weekChange,
                      0,
                    ) / query.data.length
                  ).toFixed(2)}
                  %
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0 bg-[#f3f7ff]">
                <Typography.Text type="secondary">Отслеживаем</Typography.Text>
                <Typography.Title level={3} className="!mb-0 !mt-3">
                  {query.data.length} бумаг
                </Typography.Title>
              </Card>
            </Col>
          </Row>

          <Card className="rounded-[28px] border-0">
            <Typography.Title level={4}>Список акций</Typography.Title>
            <Table
              rowKey="ticker"
              columns={columns}
              dataSource={query.data}
              pagination={false}
            />
          </Card>
        </div>
      ) : null}
    </QueryState>
  );
}
