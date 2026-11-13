/** Search the selected store's loaded dishes, with category and dietary filters. */
import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MainTabParamList } from '../../types';
import { MenuBrowse } from '../../components/menu/MenuBrowse';
const SearchScreen: React.FC = () => {
  const route = useRoute<RouteProp<MainTabParamList, 'Search'>>();
  return (
    <MenuBrowse
      search
      initialCategory={route.params?.category}
      initialQuery={route.params?.query}
    />
  );
};
export default SearchScreen;
