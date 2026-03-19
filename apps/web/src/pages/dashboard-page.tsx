import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { QueryState } from "@/components/query-state";
import { getDashboardOverview } from "@/features/dashboard/api/get-dashboard-overview";
import type { DashboardOverview } from "@/features/dashboard/api/get-dashboard-overview";

const columns: ColumnsType<DashboardOverview["watchlist"][number]> = [
  { title: "Тикер", dataIndex: "ticker" },
  { title: "Компания", dataIndex: "name" },
  {
    title: "Цена",
    dataIndex: "price",
    render: (value: number) => `${value.toLocaleString("ru-RU")} RUB`,
  },
  {
    title: "Изменение",
    dataIndex: "change",
    render: (value: number) => (
      <Tag color={value >= 0 ? "green" : "red"}>{value}%</Tag>
    ),
  },
  { title: "Тезис", dataIndex: "thesis" },
];

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: getDashboardOverview,
  });

  return (
    <QueryState isLoading={query.isLoading} error={query.error}>
      {query.data ? (
        <div className="flex h-full min-h-full flex-1 flex-col gap-6">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={6}>
              <Card className="rounded-[28px] border-0">
                <Typography.Text type="secondary">Капитал</Typography.Text>
                <Typography.Title level={2} className="!mb-0 !mt-3">
                  {query.data.totalCapital.toLocaleString("ru-RU")} RUB
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="rounded-[28px] border-0 bg-[#f6faf7]">
                <Typography.Text type="secondary">PnL за день</Typography.Text>
                <Typography.Title
                  level={2}
                  className="!mb-0 !mt-3 !text-[#11795f]"
                >
                  +{query.data.dailyPnL.toLocaleString("ru-RU")} RUB
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="rounded-[28px] border-0 bg-[#fffaf2]">
                <Typography.Text type="secondary">
                  Доходность месяца
                </Typography.Text>
                <Typography.Title level={2} className="!mb-0 !mt-3">
                  {query.data.monthlyYield}%
                </Typography.Title>
              </Card>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Card className="rounded-[28px] border-0 bg-[#f3f7ff]">
                <Typography.Text type="secondary">
                  Активные идеи
                </Typography.Text>
                <Typography.Title level={2} className="!mb-0 !mt-3">
                  {query.data.activeIdeas}
                </Typography.Title>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="flex-1">
            <Col xs={24} xl={16}>
              <Card className="h-full rounded-[28px] border-0">
                <Typography.Title level={4}>Лист наблюдения</Typography.Title>
                <Table
                  rowKey="ticker"
                  columns={columns}
                  dataSource={query.data.watchlist}
                  pagination={false}
                />
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card className="h-full rounded-[28px] border-0">
                <Typography.Title level={4}>Фокус недели</Typography.Title>
                <div className="space-y-3">
                  {query.data.milestones.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-3xl bg-[#f6faf7] px-4 py-4"
                    >
                      <div className="text-xs uppercase tracking-[0.24em] text-[#11795f]">
                        шаг 0{index + 1}
                      </div>
                      <Typography.Paragraph className="!mb-0 !mt-2 text-base leading-7">
                        {item}
                      </Typography.Paragraph>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ) : null}
    </QueryState>
  );
}
