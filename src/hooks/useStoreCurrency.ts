/**
 * Selected store currency/locale for display across customer screens.
 */

import { useMemo } from 'react';
import { useStoreContext } from '../contexts/StoreContext';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, formatMajor, formatPrice } from '../utils/money';

export function useStoreCurrency() {
  const { selectedStore } = useStoreContext();
  const currency = selectedStore?.currency || DEFAULT_CURRENCY;
  const locale = selectedStore?.locale || DEFAULT_LOCALE;

  return useMemo(
    () => ({
      currency,
      locale,
      /** Format minor-or-major API amounts */
      formatMoney: (amount: number | undefined | null) =>
        formatPrice(amount, currency, locale),
      /** Format values already in major units */
      formatMoneyMajor: (amount: number | undefined | null) =>
        formatMajor(amount, currency, locale),
    }),
    [currency, locale]
  );
}
