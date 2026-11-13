import { CustomizationOption, MenuItem, MenuVariant } from '../../types';

export type MenuFilters = {
  category?: string;
  cuisine?: string;
  dietary?: string;
  sort: 'recommended' | 'price_low' | 'price_high';
};
export const emptyFilters: MenuFilters = { sort: 'recommended' };

/** Filters apply together to the selected store's loaded menu. Distinct IDs remain distinct dishes. */
export function filterMenu(items: MenuItem[], query: string, filters: MenuFilters): MenuItem[] {
  const text = query.trim().toLowerCase().replace(/_/g, ' ');
  const filtered = items.filter(
    (item) =>
      (!filters.category || item.category === filters.category) &&
      (!filters.cuisine || item.cuisine === filters.cuisine) &&
      (!filters.dietary ||
        item.dietaryInfo?.includes(filters.dietary as never) ||
        (filters.dietary === 'VEGETARIAN' && item.dietaryInfo?.includes('VEGAN'))) &&
      (!text ||
        [item.name, item.description, item.category, item.cuisine].some((value) =>
          value?.toLowerCase().replace(/_/g, ' ').includes(text),
        )),
  );
  return filtered.sort((a, b) => {
    const first = a.discountedPrice ?? a.basePrice;
    const second = b.discountedPrice ?? b.basePrice;
    return filters.sort === 'price_low'
      ? first - second
      : filters.sort === 'price_high'
        ? second - first
        : Number(!!b.isRecommended) - Number(!!a.isRecommended) ||
          (b.rating ?? 0) - (a.rating ?? 0);
  });
}

export function toggleOption(
  current: CustomizationOption[],
  option: CustomizationOption,
  max: number,
): CustomizationOption[] {
  if (current.some((value) => value.id === option.id))
    return current.filter((value) => value.id !== option.id);
  if (max === 1) return [option];
  return current.length < max ? [...current, option] : current;
}

/** Validate against current store menu and current supported options immediately before local cart insertion. */
export function validateSelection(
  item: MenuItem,
  eligibleStore: boolean,
  variant: MenuVariant | undefined,
  selected: Map<string, CustomizationOption[]>,
): string | null {
  if (!eligibleStore) return 'Choose an open store where this dish is available.';
  if (!item.isAvailable) return 'This dish is currently unavailable.';
  if (item.variants?.length && !item.variants.some((value) => value.id === variant?.id && value.isAvailable !== false))
    return 'Choose a size.';
  for (const group of item.customizations ?? []) {
    const options = selected.get(group.id) ?? [];
    if (
      (group.required && !options.length) ||
      options.length > group.maxSelections ||
      options.some((option) => !group.options.some((value) => value.id === option.id && value.isAvailable !== false))
    )
      return `Check your selection for ${group.name}.`;
  }
  if ([...selected.keys()].some((id) => !item.customizations?.some((group) => group.id === id)))
    return 'Menu options changed. Choose your extras again.';
  return null;
}
