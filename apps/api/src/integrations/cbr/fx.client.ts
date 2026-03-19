export async function getFxRates() {
  const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");

  if (!response.ok) {
    throw new Error(`Failed to load FX rates: ${response.status}`);
  }

  const payload = (await response.json()) as {
    Valute?: {
      USD?: { Value?: number };
      EUR?: { Value?: number };
    };
  };

  return {
    base: "RUB",
    rates: {
      USD: payload.Valute?.USD?.Value,
      EUR: payload.Valute?.EUR?.Value,
    },
    ts: Date.now(),
  };
}
