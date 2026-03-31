import { ArrowRight, ChartSpline, LogIn, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./landing-page.module.css";

const features = [
  {
    title: "Единое рабочее место",
    text: "Лендинг, кабинет и будущая интеграция с API строятся вокруг одной доменной модели.",
  },
  {
    title: "Shadcn + Tailwind",
    text: "Интерфейс получил более контролируемый компонентный слой без давления со стороны Ant Design.",
  },
  {
    title: "Готовность к росту",
    text: "Маршрутизация, query-кеш и пользовательские токены уже разложены так, чтобы спокойно развивать продукт дальше.",
  },
];

const roadmap = [
  "Довести торговый контур и подтверждение операций до стабильного сценария.",
  "Добавить аналитику по доходности, купонам и структуре активов.",
  "Подготовить презентационный режим для дипломной защиты.",
];

export function LandingPage() {
  return (
    <div className="min-h-screen px-4 pb-10 pt-4 md:px-8 lg:px-10">
      <header className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-[28px] px-5 py-4 md:px-7">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div>
            <div className="text-[11px] uppercase tracking-[0.36em] text-[#5e6e67]">
              diploma project
            </div>
            <div className="mt-1 text-xl font-semibold text-[#10201b]">
              Invest Agent
            </div>
          </div>
        </div>

        <Button asChild size="lg">
          <Link to="/auth/login">
            <LogIn className="h-4 w-4" /> Войти в ЛК
          </Link>
        </Button>
      </header>

      <main className="mx-auto mt-6 flex max-w-7xl flex-col gap-8 md:mt-8">
        <section className={styles.heroGrid}>
          <div
            className={`${styles.heroPanel} glass-panel px-6 py-7 md:px-8 md:py-10 lg:px-10`}
          >
            <div className={styles.heroGlow} />
            <div className="relative z-10 max-w-3xl">
              <Badge variant="warm" className="mb-4">
                new frontend foundation
              </Badge>
              <h1 className="mb-4 text-[2.8rem] font-semibold leading-[0.98] text-[#10201b] md:text-[4.5rem]">
                Новый инвестиционный интерфейс без старого технологического
                шума.
              </h1>
              <p className="mb-6 max-w-2xl text-base leading-8 text-[#43534e] md:text-lg">
                Мы пересобрали проект на shadcn-подходе: выразительный лендинг,
                удобный кабинет через sidebar, multi-user авторизация и реальная
                работа с пользовательским T-Bank token.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth/login">
                    <ArrowRight className="h-4 w-4" /> Открыть кабинет
                  </Link>
                </Button>
                <Button variant="outline" size="lg">
                  <Sparkles className="h-4 w-4" /> Посмотреть сценарий продукта
                </Button>
              </div>
            </div>
          </div>

          <Card
            className={`${styles.heroPanel} ${styles.previewCard} border-black/5`}
          >
            <CardHeader>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#718079]">
                preview
              </div>
              <CardTitle>Что уже готово в MVP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricBlock
                label="Маршруты"
                value="8 экранов"
                tone="bg-[#f6faf7]"
              />
              <MetricBlock
                label="Auth flow"
                value="multi-user ready"
                tone="bg-[#fffaf2]"
              />
              <MetricBlock
                label="Market API"
                value="real accounts only"
                tone="bg-[#f3f7ff]"
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="glass-panel border-0">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-7 text-[#52625d]">
                  {feature.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="glass-panel rounded-[32px]">
          <CardHeader>
            <div className="text-[11px] uppercase tracking-[0.32em] text-[#718079]">
              roadmap
            </div>
            <CardTitle>Следующие шаги после UI-основы</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item, index) => (
              <div
                key={item}
                className="rounded-[24px] border border-black/5 bg-white/70 p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#11795f]">
                  <ChartSpline className="h-4 w-4" /> 0{index + 1}
                </div>
                <p className="text-base leading-7 text-[#43534e]">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`rounded-3xl p-5 ${tone}`}>
      <div className="text-sm text-[#60716a]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#10201b]">{value}</div>
    </div>
  );
}
