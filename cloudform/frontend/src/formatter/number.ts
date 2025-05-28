// const DAY_IN_MONTH = 30;
const HOUR_IN_MONTH = 720;

export function formatPrice(price?: number, decimal = 2) {
  if (typeof price !== 'undefined')
    return Number(price).toLocaleString('en', {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
    });
}

export function toMonthlyPrice(price?: number, decimal = 2) {
  if (typeof price !== 'undefined')
    return (Number(price) * HOUR_IN_MONTH).toLocaleString('en', {
      minimumFractionDigits: decimal,
      maximumFractionDigits: decimal,
    });
}
