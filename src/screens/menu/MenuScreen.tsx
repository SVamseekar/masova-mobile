/**
 * Menu Screen
 * Browse the selected store menu with combined filters and categories.
 */
import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MainTabParamList } from '../../types';
import { MenuBrowse } from '../../components/menu/MenuBrowse';
const MenuScreen: React.FC = () => {
  const route = useRoute<RouteProp<MainTabParamList, 'Search'>>();
  return <MenuBrowse initialCategory={route.params?.category} initialQuery={route.params?.query} />;
};
export default MenuScreen;
