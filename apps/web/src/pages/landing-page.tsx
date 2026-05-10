import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./landing-page.module.css";

const productCards = [
  {
    icon: Bot,
    title: "Персональный инвестиционный ассистент",
    text: "Система анализирует состав портфеля, историю операций и выбранную стратегию, после чего формирует понятные рекомендации по дальнейшим действиям.",
  },
  {
    icon: ShieldCheck,
    title: "Контроль риска и стратегии",
    text: "Перед началом работы пользователь проходит анкетирование. На его основе сервис определяет риск-профиль, инвестиционный горизонт и ограничения для рекомендаций.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Личный кабинет инвестора",
    text: "В одном интерфейсе доступны активы, сделки, история решений, настройки стратегии и подключение брокерского аккаунта пользователя.",
  },
];

const highlights = [
  "Подключение брокерского аккаунта T-Bank через токен пользователя",
  "Автоматическая аналитика портфеля с сохранением истории решений",
  "Кабинет инвестора: активы, сделки, рекомендации и контроль исполнения",
];

export function LandingPage() {
  return (
    <div
      className={`${styles.page} app-scrollbar min-h-dvh overflow-y-auto px-4 pb-10 pt-4 md:px-8 lg:px-10`}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />
        <div className={styles.gridGlow} />
      </div>

      <header
        className={`${styles.headerShell} ${styles.revealHeader} glass-panel relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-[28px] px-5 py-4 md:px-7`}
      >
        <div className="flex items-center gap-4">
          <BrandMark />
          <div>
            <div className="text-[11px] uppercase tracking-[0.36em] text-[#d6efe6]">
              graduation project
            </div>
            <div className="mt-1 text-xl font-semibold text-white">
              Invest Agent
            </div>
          </div>
        </div>

        <Button asChild size="lg" className={styles.ctaButton}>
          <Link to="/auth/login">Войти в кабинет</Link>
        </Button>
      </header>

      <main className="relative z-10 mx-auto mt-6 flex max-w-7xl flex-col gap-8 md:mt-8">
        <section className={styles.heroGrid}>
          <div
            className={`${styles.heroPanel} ${styles.revealPrimary} glass-panel px-6 py-7 md:px-8 md:py-10 lg:px-10`}
          >
            <div className={styles.heroGlow} />
            <div className="relative z-10 max-w-3xl">
              <Badge variant="warm" className="mb-4">
                Готовая инвестиционная платформа
              </Badge>
              <h1 className="mb-4 text-[2.8rem] font-semibold leading-[0.96] text-white md:text-[4.5rem]">
                Invest Agent помогает управлять портфелем на основе данных,
                риска и целей инвестора.
              </h1>
              <p className="mb-6 max-w-2xl text-base leading-8 text-[#d5e6e0] md:text-lg">
                Выпускной проект реализован как полноценный веб-сервис:
                пользователь проходит регистрацию, подключает брокерский
                аккаунт, заполняет инвестиционный профиль и получает
                рекомендации по управлению портфелем в личном кабинете.
              </p>
              <div className="mb-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className={styles.ctaButton}>
                  <Link to="/auth/register">
                    <ArrowRight className="h-4 w-4" /> Начать работу
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className={styles.secondaryButton}
                >
                  <Link to="/auth/login">
                    <Sparkles className="h-4 w-4" /> Открыть кабинет
                  </Link>
                </Button>
              </div>
              <div className="grid gap-3 text-sm text-[#dcebe6] md:grid-cols-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className={`${styles.revealItem} rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-sm`}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card
            className={`${styles.heroPanel} ${styles.previewCard} ${styles.revealSecondary} border-0`}
          >
            <CardHeader>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#a8c9be]">
                product snapshot
              </div>
              <CardTitle className="text-white">
                Что уже умеет продукт
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricBlock
                label="Рекомендации"
                value="формируются и сохраняются"
                tone={styles.metricMint}
              />
              <MetricBlock
                label="Портфель"
                value="отображает активы и сделки"
                tone={styles.metricTeal}
              />
              <MetricBlock
                label="Профиль"
                value="учитывает цели и риск"
                tone={styles.metricBlue}
              />
              <MetricBlock
                label="Исполнение"
                value="остается под контролем пользователя"
                tone={styles.metricGraphite}
              />
            </CardContent>
          </Card>
        </section>

        <section className={styles.featuresGrid}>
          {productCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className={`${styles.featureCard} ${styles.revealCard} glass-panel border-0`}
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1d7d63_0%,#0f5a48_100%)] text-white shadow-[0_18px_40px_rgba(18,98,77,0.24)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-white">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-7 text-[#d6e6e0]">
                    {card.text}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className={styles.insightGrid}>
          <Card
            className={`${styles.infoCard} ${styles.revealCard} glass-panel border-0`}
          >
            <CardHeader>
              <div className="text-[11px] uppercase tracking-[0.3em] text-[#a8c9be]">
                for whom
              </div>
              <CardTitle className="text-white">
                Кому подойдет Invest Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoTile
                title="Частному инвестору"
                text="Сервис помогает держать под рукой портфель, сделки, риск-профиль и историю рекомендаций без переключения между разными инструментами."
              />
              <InfoTile
                title="Для выпускного проекта"
                text="В проекте показан полный цикл разработки продукта: авторизация, база данных, API, интеграция с брокером, пользовательский сценарий и аналитический модуль."
              />
              <InfoTile
                title="Для демонстрации архитектуры"
                text="Продукт разделен на backend, frontend и базу данных, поэтому его удобно показывать как законченное приложение с понятной структурой и зонами ответственности."
              />
              <InfoTile
                title="Для ежедневной работы"
                text="Пользователь может регулярно пересматривать состояние портфеля, обновлять настройки стратегии и принимать решения на основе сохраненной аналитики."
              />
            </CardContent>
          </Card>

          <Card
            className={`${styles.darkInsightCard} ${styles.revealCard} glass-panel border-0 text-white`}
          >
            <CardHeader>
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/45">
                solution scope
              </div>
              <CardTitle className="text-white">Что входит в решение</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <div className="flex items-center gap-3 text-sm text-white/70">
                  <TrendingUp className="h-4 w-4 text-[#8fe0b3]" />
                  Практическая ценность
                </div>
                <p className="mt-3 text-base leading-7 text-white/90">
                  Invest Agent закрывает основной сценарий частного инвестора:
                  от первичной настройки профиля до анализа портфеля и принятия
                  решений по активам в личном кабинете.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <div className="text-sm text-white/70">
                  Ключевые модули продукта
                </div>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-white/88">
                  <li>
                    Регистрация, вход и защищенный доступ к личному кабинету
                  </li>
                  <li>
                    Анкета инвестора для определения целей, горизонта и риска
                  </li>
                  <li>
                    Интеграция с T-Bank Invest API для работы с брокерским
                    счетом
                  </li>
                  <li>
                    История рекомендаций, подтверждений и действий пользователя
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
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
    <div className={`${styles.revealItem} rounded-3xl p-5 ${tone}`}>
      <div className="text-sm text-white/64">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoTile({ title, text }: { title: string; text: string }) {
  return (
    <div
      className={`${styles.infoTile} ${styles.revealItem} rounded-[24px] p-5`}
    >
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-3 text-sm leading-7 text-[#d6e6e0]">{text}</p>
    </div>
  );
}
