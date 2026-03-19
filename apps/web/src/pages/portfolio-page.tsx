import { useQuery } from "@tanstack/react-query";
import { Card, Col, Progress, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QueryState } from "@/components/query-state";
import { getPortfolioSnapshot } from "@/features/portfolio/api/get-portfolio-snapshot";
import type { PortfolioSnapshot } from "@/features/portfolio/api/get-portfolio-snapshot";

const columns: ColumnsType<PortfolioSnapshot["positions"][number]> = [
  { title: "Тикер", dataIndex: "ticker" },
  { title: "Эмитент", dataIndex: "issuer" },
  {
    title: "Доля",
    dataIndex: "allocation",
    render: (value: number) => `${value}%`,
  },
  {
    title: "Результат",
    dataIndex: "result",
    render: (value: number) => (
      <Tag color={value >= 0 ? "green" : "red"}>{value}%</Tag>
    ),
  },
  { title: "Стратегия", dataIndex: "strategy" },
];

export function PortfolioPage() {
  const query = useQuery({
    queryKey: ["portfolio-snapshot"],
    queryFn: getPortfolioSnapshot,
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="space-y-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0">
                <Typography.Text type="secondary">
                  Общая стоимость
                </Typography.Text>
                <Typography.Title level={2} className="!mb-0 !mt-3">
                  {query.data.totalValue.toLocaleString("ru-RU")} RUB
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0 bg-[#f6faf7]">
                <Typography.Text type="secondary">
                  Месячный кэшфлоу
                </Typography.Text>
                <Typography.Title
                  level={2}
                  className="!mb-0 !mt-3 !text-[#11795f]"
                >
                  +{query.data.monthlyIncome.toLocaleString("ru-RU")} RUB
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="rounded-[28px] border-0 bg-[#fffaf2]">
                <Typography.Text type="secondary">
                  Структура капитала
                </Typography.Text>
                <div className="mt-4 space-y-3">
                  <Progress
                    percent={query.data.stocksShare}
                    strokeColor="#11795f"
                    trailColor="#e4efe8"
                  />
                  <Progress
                    percent={query.data.cashShare}
                    strokeColor="#db8d30"
                    trailColor="#f3ead6"
                  />
                </div>
              </Card>
            </Col>
          </Row>

          <Card className="rounded-[28px] border-0">
            <Typography.Title level={4}>Позиции портфеля</Typography.Title>
            <Table
              rowKey="ticker"
              columns={columns}
              dataSource={query.data.positions}
              pagination={false}
            />
          </Card>
        </div>
      ) : null}
    </QueryState>
  );
}
