import {
  ArrowRightOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Link } from "@tanstack/react-router";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import styles from "./landing-page.module.css";

const features = [
  {
    title: "Единое рабочее место",
    text: "Лендинг, кабинет и будущая интеграция с API строятся вокруг одной доменной модели.",
  },
  {
    title: "Чистый UI-слой",
    text: "Ant Design отвечает за скорость сборки, Tailwind - за сетки, ритм и аккуратный responsive.",
  },
  {
    title: "Готовность к росту",
    text: "Маршрутизация, query-кеш и стор уже разложены так, чтобы без боли подключить backend.",
  },
];

const roadmap = [
  "Подключить реальные API-эндпоинты и авторизацию.",
  "Добавить детальные карточки счета и аналитику по доходности.",
  "Подготовить презентационный контур для дипломной защиты.",
];

export function LandingPage() {
  return (
    <div className="min-h-screen px-4 pb-10 pt-4 md:px-8 lg:px-10">
      <header className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-[28px] px-5 py-4 md:px-7">
        <div>
          <Typography.Text className="text-[11px] uppercase tracking-[0.36em] text-[#5e6e67]">
            diploma project
          </Typography.Text>
          <Typography.Title level={4} className="!mb-0 !mt-1 !text-[#10201b]">
            Invest Agent
          </Typography.Title>
        </div>

        <Link to="/app/overview">
          <Button type="primary" size="large" icon={<LockOutlined />}>
            Войти в ЛК
          </Button>
        </Link>
      </header>

      <main className="mx-auto mt-6 flex max-w-7xl flex-col gap-8 md:mt-8">
        <section className={styles.heroGrid}>
          <div
            className={`${styles.heroPanel} glass-panel px-6 py-7 md:px-8 md:py-10 lg:px-10`}
          >
            <div className={styles.heroGlow} />
            <div className="relative z-10 max-w-3xl">
              <Tag
                color="gold"
                className="mb-4 rounded-full px-3 py-1 text-xs uppercase tracking-[0.24em]"
              >
                new frontend foundation
              </Tag>
              <Typography.Title className="!mb-4 !text-[2.5rem] !leading-[1.02] !text-[#10201b] md:!text-[4.3rem]">
                Новый инвестиционный интерфейс без старого технологического
                шума.
              </Typography.Title>
              <Typography.Paragraph className="!mb-6 max-w-2xl text-base !leading-8 text-[#43534e] md:text-lg">
                Мы собираем проект заново: выразительный лендинг, удобный
                кабинет через sidebar, прозрачная структура и стек, который не
                стыдно защищать на дипломе.
              </Typography.Paragraph>
              <Space wrap size="middle">
                <Link to="/app/overview">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRightOutlined />}
                  >
                    Открыть кабинет
                  </Button>
                </Link>
                <Button size="large" icon={<PlayCircleOutlined />} ghost>
                  Посмотреть сценарий продукта
                </Button>
              </Space>
            </div>
          </div>

          <div
            className={`${styles.heroPanel} ${styles.previewCard} p-6 md:p-7`}
          >
            <Typography.Text className="text-[11px] uppercase tracking-[0.3em] text-[#718079]">
              preview
            </Typography.Text>
            <Typography.Title level={3} className="!mb-5 !mt-2 !text-[#10201b]">
              Что уже готово в MVP
            </Typography.Title>
            <Space direction="vertical" size="middle" className="w-full">
              <Card bordered={false} className="rounded-3xl bg-[#f6faf7]">
                <Statistic title="Маршруты" value={5} suffix="экрана" />
              </Card>
              <Card bordered={false} className="rounded-3xl bg-[#fffaf2]">
                <Statistic title="Базовые модули" value={8} suffix="секции" />
              </Card>
              <Card bordered={false} className="rounded-3xl bg-[#f3f7ff]">
                <Statistic title="UI readiness" value={78} suffix="%" />
              </Card>
            </Space>
          </div>
        </section>

        <section>
          <Row gutter={[20, 20]}>
            {features.map((feature) => (
              <Col key={feature.title} xs={24} md={8}>
                <Card className="glass-panel h-full rounded-[28px] border-0">
                  <Typography.Title level={4} className="!mt-0 !text-[#10201b]">
                    {feature.title}
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-0 text-base leading-7 text-[#52625d]">
                    {feature.text}
                  </Typography.Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="glass-panel rounded-[32px] px-6 py-7 md:px-8 md:py-8">
          <Typography.Text className="text-[11px] uppercase tracking-[0.32em] text-[#718079]">
            roadmap
          </Typography.Text>
          <Typography.Title level={2} className="!mb-5 !mt-2 !text-[#10201b]">
            Следующие шаги после UI-основы
          </Typography.Title>
          <div className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item, index) => (
              <div
                key={item}
                className="rounded-[24px] border border-black/5 bg-white/70 p-5"
              >
                <div className="mb-3 text-sm font-semibold text-[#11795f]">
                  0{index + 1}
                </div>
                <Typography.Paragraph className="!mb-0 text-base leading-7 text-[#43534e]">
                  {item}
                </Typography.Paragraph>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
