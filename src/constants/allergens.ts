// EU Regulation 1169/2011 — 14 mandatory declarable allergens
export type AllergenType =
  | 'CELERY'
  | 'CEREALS_GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'LUPIN'
  | 'MILK'
  | 'MOLLUSCS'
  | 'MUSTARD'
  | 'NUTS'
  | 'PEANUTS'
  | 'SESAME'
  | 'SOYA'
  | 'SULPHUR_DIOXIDE';

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  CELERY: 'Celery',
  CEREALS_GLUTEN: 'Gluten',
  CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs',
  FISH: 'Fish',
  LUPIN: 'Lupin',
  MILK: 'Milk',
  MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard',
  NUTS: 'Tree Nuts',
  PEANUTS: 'Peanuts',
  SESAME: 'Sesame',
  SOYA: 'Soya',
  SULPHUR_DIOXIDE: 'Sulphur Dioxide',
};
