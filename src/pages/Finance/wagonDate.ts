// Wagon dates are picked as a calendar day (stored as midnight), so read the day part
// directly instead of converting through the browser's time zone, which could shift it.
export const formatWagonDate = (createdAt?: string): string => {
  const match = createdAt?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
};
