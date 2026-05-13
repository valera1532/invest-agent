import {
  SignalDirection,
  SignalState,
  StrategyType,
  type Signal,
} from "tinkoff-invest-api/cjs/generated/signals";
import { createTinkoffSignalsClient } from "@/integrations/tinkoff/tinkoff.factory";
import { quotationToNumber, timestampToIso } from "@/integrations/tinkoff/tinkoff.utils";
import type { AiBrokerResearchContext, AiBrokerResearchSignal } from "@/types/ai";

const BROKER_RESEARCH_SOURCES = ["Аналитики БКС", "Аналитики SberCIB", "Аналитики Т-Инвестиций"];
const BROKER_RESEARCH_INSTRUMENT_LIMIT = 35;
const BROKER_RESEARCH_SIGNALS_PER_INSTRUMENT = 3;
const MAX_SIGNAL_AGE_WITHOUT_EXPIRY_MS = 180 * 24 * 60 * 60 * 1000;

export type BrokerResearchCandidate = {
  instrumentId: string;
  ticker: string;
  instrumentName: string;
};

function buildEmptyBrokerResearchContext(input: {
  fetchedAt: string;
  unavailableReason?: string;
}): AiBrokerResearchContext {
  const context: AiBrokerResearchContext = {
    fetchedAt: input.fetchedAt,
    sources: BROKER_RESEARCH_SOURCES,
    filters: {
      strategyType: "fundamental",
      active: "active",
      maxSignalsPerInstrument: BROKER_RESEARCH_SIGNALS_PER_INSTRUMENT,
    },
    signals: [],
    missingActiveSignalsForTickers: [],
  };

  if (input.unavailableReason) {
    context.unavailableReason = input.unavailableReason;
  }

  return context;
}

function uniqueCandidates(candidates: BrokerResearchCandidate[]) {
  const seen = new Set<string>();
  const result: BrokerResearchCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.instrumentId || !candidate.ticker || seen.has(candidate.instrumentId)) {
      continue;
    }

    seen.add(candidate.instrumentId);
    result.push(candidate);
  }

  return result.slice(0, BROKER_RESEARCH_INSTRUMENT_LIMIT);
}

function isBrokerResearchSource(strategyName: string) {
  return BROKER_RESEARCH_SOURCES.includes(strategyName);
}

function isFreshSignal(signal: Signal, now: Date) {
  if (signal.endDt && signal.endDt.getTime() < now.getTime()) {
    return false;
  }

  if (!signal.endDt && signal.createDt && now.getTime() - signal.createDt.getTime() > MAX_SIGNAL_AGE_WITHOUT_EXPIRY_MS) {
    return false;
  }

  return true;
}

function mapSignalDirection(direction: SignalDirection): AiBrokerResearchSignal["direction"] | null {
  switch (direction) {
    case SignalDirection.SIGNAL_DIRECTION_BUY:
      return "buy";
    case SignalDirection.SIGNAL_DIRECTION_SELL:
      return "sell";
    default:
      return null;
  }
}

function mapBrokerSignal(candidate: BrokerResearchCandidate, signal: Signal): AiBrokerResearchSignal | null {
  const direction = mapSignalDirection(signal.direction);
  if (!direction) {
    return null;
  }

  const result: AiBrokerResearchSignal = {
    instrumentId: candidate.instrumentId,
    ticker: candidate.ticker,
    instrumentName: candidate.instrumentName,
    source: signal.strategyName,
    direction,
    strategyType: "fundamental",
    signalName: signal.name,
  };
  const targetPrice = quotationToNumber(signal.targetPrice);
  const createdAt = timestampToIso(signal.createDt);
  const expiresAt = timestampToIso(signal.endDt);

  if (targetPrice != null) {
    result.targetPrice = targetPrice;
  }
  if (signal.probability != null) {
    result.probability = signal.probability;
  }
  if (createdAt) {
    result.createdAt = createdAt;
  }
  if (expiresAt) {
    result.expiresAt = expiresAt;
  }

  return result;
}

export async function buildBrokerResearchContext(
  token: string,
  candidates: BrokerResearchCandidate[],
): Promise<AiBrokerResearchContext> {
  const fetchedAt = new Date().toISOString();
  const selectedCandidates = uniqueCandidates(candidates);

  if (!selectedCandidates.length) {
    return buildEmptyBrokerResearchContext({ fetchedAt, unavailableReason: "No instruments were provided for broker research lookup" });
  }

  try {
    const signalsClient = createTinkoffSignalsClient(token);
    const signals: AiBrokerResearchSignal[] = [];
    const missingActiveSignalsForTickers: string[] = [];
    const now = new Date();

    for (const candidate of selectedCandidates) {
      const response = await signalsClient.getSignals({
        instrumentUid: candidate.instrumentId,
        strategyType: StrategyType.STRATEGY_TYPE_FUNDAMENTAL,
        active: SignalState.SIGNAL_STATE_ACTIVE,
        paging: { limit: 10, pageNumber: 0 },
      });

      const candidateSignals = response.signals
        .filter((signal) => isBrokerResearchSource(signal.strategyName))
        .filter((signal) => isFreshSignal(signal, now))
        .map((signal) => mapBrokerSignal(candidate, signal))
        .filter((signal): signal is AiBrokerResearchSignal => signal !== null)
        .slice(0, BROKER_RESEARCH_SIGNALS_PER_INSTRUMENT);

      if (candidateSignals.length) {
        signals.push(...candidateSignals);
      } else {
        missingActiveSignalsForTickers.push(candidate.ticker);
      }
    }

    return {
      fetchedAt,
      sources: BROKER_RESEARCH_SOURCES,
      filters: {
        strategyType: "fundamental",
        active: "active",
        maxSignalsPerInstrument: BROKER_RESEARCH_SIGNALS_PER_INSTRUMENT,
      },
      signals,
      missingActiveSignalsForTickers,
    };
  } catch (error) {
    const unavailableReason = error instanceof Error ? error.message : "T-Invest SignalService request failed";
    return buildEmptyBrokerResearchContext({ fetchedAt, unavailableReason });
  }
}
