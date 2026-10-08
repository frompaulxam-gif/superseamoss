export const offers = Object.freeze({
  '141ml': Object.freeze([0, 1200, 2400, 3600]),
  '330ml': Object.freeze([0, 2500, 5000, 6800, 8800]),
  '720ml': Object.freeze([0, 4500, 8500, 12000])
});

export function deliveryForSubtotal(pence, subscription = false, method = 'shipping') {
  if (method !== 'shipping') {
    throw new RangeError('Local delivery must be confirmed directly with the team.');
  }
  return subscription || pence >= 5000 ? 0 : 995;
}

export function priceOrder(size, quantity, subscription = false, deliveryMethod = 'shipping', blends = []) {
  if (size === '141ml' && (quantity !== 3 || subscription)) {
    throw new RangeError('Taster jars are available only as a one-off trio of 3.');
  }
  const prices = offers[size];
  if (!prices || !Number.isInteger(quantity) || quantity < 1 || quantity >= prices.length) {
    throw new RangeError('Choose an available jar size and quantity.');
  }
  const singleOceanPrices = { 'ocean-gold': 1500, 'ocean-vitality': 2000 };
  const specialPrice = size === '330ml' && quantity === 1 && !subscription
    ? singleOceanPrices[blends[0]] : undefined;
  const bundlePrice = specialPrice ?? prices[quantity];
  const subscriptionSaving = subscription ? Math.round(bundlePrice * 0.1) : 0;
  const jarSubtotal = bundlePrice - subscriptionSaving;
  const delivery = deliveryForSubtotal(jarSubtotal, subscription, deliveryMethod);
  return Object.freeze({
    bundlePrice,
    bundleSaving: specialPrice === undefined ? prices[1] * quantity - bundlePrice : 0,
    subscriptionSaving,
    jarSubtotal,
    delivery,
    total: jarSubtotal + delivery
  });
}

export function money(pence) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  }).format(pence / 100);
}
