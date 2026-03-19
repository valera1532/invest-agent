type Quotation = {
  units?: number | string;
  nano?: number;
};

type ProtoTimestamp = {
  seconds?: number | string;
  nanos?: number;
};

export function quotationToNumber(value?: Quotation | null): number | undefined {
  if (!value || value.units == null || value.nano == null) {
    return undefined;
  }

  const units = typeof value.units === "string" ? parseInt(value.units, 10) : value.units;
  return units + value.nano / 1e9;
}

export function moneyValueToNumber(value?: Quotation | null): number | undefined {
  return quotationToNumber(value);
}

export function timestampToIso(value?: Date | ProtoTimestamp | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const seconds =
    value.seconds != null
      ? typeof value.seconds === "string"
        ? parseInt(value.seconds, 10)
        : value.seconds
      : undefined;

  if (seconds == null) {
    return undefined;
  }

  const milliseconds = seconds * 1000 + (typeof value.nanos === "number" ? Math.trunc(value.nanos / 1e6) : 0);
  return new Date(milliseconds).toISOString();
}
