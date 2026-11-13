import { filterMenu, validateSelection, toggleOption } from '../menuDiscovery';
import { MenuItem } from '../../../types';

const dish = (patch: Partial<MenuItem>): MenuItem => ({
  id: 'one',
  name: 'Paneer',
  description: 'Grilled cheese',
  cuisine: 'ITALIAN',
  category: 'PIZZA',
  basePrice: 1200,
  variants: [],
  customizations: [],
  dietaryInfo: ['VEGETARIAN'],
  imageUrl: '',
  isAvailable: true,
  preparationTime: 15,
  isRecommended: false,
  ...patch,
});

describe('store menu discovery', () => {
  it('rejects selected sizes and extras that became unavailable in the refreshed menu', () => {
    const variant = { id: 'large', name: 'Large', priceModifier: 400, isAvailable: false };
    const option = { id: 'olives', name: 'Olives', priceModifier: 200, isAvailable: false };
    const item = dish({ variants: [variant], customizations: [
      { id: 'extras', name: 'Extras', required: false, maxSelections: 1, options: [option] },
    ] });
    expect(validateSelection(item, true, variant, new Map())).toMatch(/size/i);
    expect(validateSelection({ ...item, variants: [] }, true, undefined,
      new Map([['extras', [option]]]))).toMatch(/Extras/);
  });
  it('combines query, category, cuisine and dietary filters without dropping same-named SKUs', () => {
    const items = [
      dish({}),
      dish({ id: 'two' }),
      dish({ id: 'three', dietaryInfo: ['NON_VEGETARIAN'] }),
    ];
    const filters = {
      category: 'PIZZA',
      cuisine: 'ITALIAN',
      dietary: 'VEGETARIAN',
      sort: 'recommended' as const,
    };
    expect(filterMenu(items, ' paneer ', filters).map((i) => i.id)).toEqual(['one', 'two']);
    expect(filterMenu(items, 'paneer', { ...filters, category: 'PASTA' })).toEqual([]);
  });
  it('sorts effective prices, retaining legitimate zero discounts', () => {
    const items = [
      dish({ id: 'full', basePrice: 1000 }),
      dish({ id: 'free', discountedPrice: 0 }),
      dish({ id: 'sale', discountedPrice: 500 }),
    ];
    expect(filterMenu(items, '', { sort: 'price_low' }).map((i) => i.id)).toEqual([
      'free',
      'sale',
      'full',
    ]);
  });
  it('requires an eligible available store, supported size and required options', () => {
    const item = dish({
      variants: [{ id: 'small', name: 'Small', priceModifier: 0 }],
      customizations: [
        {
          id: 'crust',
          name: 'Crust',
          required: true,
          maxSelections: 1,
          options: [{ id: 'thin', name: 'Thin', priceModifier: 0 }],
        },
      ],
    });
    expect(validateSelection(item, false, undefined, new Map())).toMatch(/store/i);
    expect(validateSelection(item, true, undefined, new Map())).toMatch(/size/i);
    expect(validateSelection(item, true, item.variants[0], new Map())).toMatch(/Crust/);
    expect(
      validateSelection(
        item,
        true,
        item.variants[0],
        new Map([['crust', [item.customizations[0].options[0]]]]),
      ),
    ).toBeNull();
    expect(
      validateSelection({ ...item, isAvailable: false }, true, item.variants[0], new Map()),
    ).toMatch(/unavailable/i);
  });
  it('rejects stale modifier IDs and counts; single-selection replaces while multi-selection respects maximum', () => {
    const option = { id: 'one', name: 'One', priceModifier: 0 };
    const other = { id: 'two', name: 'Two', priceModifier: 0 };
    expect(toggleOption([option], other, 1)).toEqual([other]);
    expect(toggleOption([option], other, 2)).toEqual([option, other]);
    expect(toggleOption([option, other], { ...option, id: 'third' }, 2)).toEqual([option, other]);
    expect(toggleOption([option], option, 1)).toEqual([]);
    const item = dish({
      customizations: [
        { id: 'group', name: 'Extras', required: false, maxSelections: 1, options: [option] },
      ],
    });
    expect(validateSelection(item, true, undefined, new Map([['group', [other]]]))).toMatch(
      /Extras/,
    );
  });
});
