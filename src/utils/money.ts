export const parseCurrency = (value: string): number => Number(value.replace(/[$,]/g, "").trim());

export const formatCurrency = (value: number): string => value.toFixed(2);
