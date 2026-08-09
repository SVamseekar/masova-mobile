/**
 * Selected store — single source of truth via StoreContext.
 * (Previously this hook held a separate AsyncStorage copy, so the picker
 * and menu queries could disagree.)
 */

export { useStoreContext as useSelectedStore } from '../contexts/StoreContext';
