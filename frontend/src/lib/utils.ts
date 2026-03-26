export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const START_YEAR = 2000;
export const END_YEAR = new Date().getFullYear() + 50;
export const YEARS = Array.from(
  { length: END_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i,
);

export const currencySymbols = [
  "$",
  "€",
  "¥",
  "£",
  "₩",
  "CHF",
  "₣",
  "₹",
  "₽",
  "₫",
  "₱",
  "₺",
  "฿",
  "₪",
  "R",
  "₴",
];
