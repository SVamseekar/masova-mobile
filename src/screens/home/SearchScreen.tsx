/**
 * Search Screen
 * Full-screen search with recent searches and suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';
import { Chip } from '../../components/ui';

const RECENT_SEARCHES = ['Margherita Pizza', 'Chicken Biryani', 'Burger'];
const POPULAR_SEARCHES = ['Pizza', 'Biryani', 'Chinese', 'Desserts', 'Healthy', 'Fast Food'];

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClearRecent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches([]);
  };

  const handleSearch = (searchQuery: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    // Navigate to menu with search filter
    navigation.goBack();
  };

  const handleRemoveRecent = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches(recentSearches.filter((s) => s !== item));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: theme.colors.surface2 },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={theme.colors.text2} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for dishes, restaurants..."
            placeholderTextColor={theme.colors.text3}
            style={[styles.searchInput, { color: theme.colors.text1 }]}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                    Recent Searches
                  </Text>
                  <TouchableOpacity onPress={handleClearRecent}>
                    <Text style={[styles.clearButton, { color: '#FFD000' }]}>
                      Clear all
                    </Text>
                  </TouchableOpacity>
                </View>
                {recentSearches.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.recentItem}
                    onPress={() => handleSearch(item)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={theme.colors.text2}
                    />
                    <Text
                      style={[styles.recentText, { color: theme.colors.text1 }]}
                    >
                      {item}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveRecent(item)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={theme.colors.text3}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Popular Searches */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                Popular Searches
              </Text>
              <View style={styles.chipContainer}>
                {POPULAR_SEARCHES.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    onPress={() => handleSearch(item)}
                    style={styles.chip}
                  />
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                Browse by Category
              </Text>
              <View style={styles.categoryGrid}>
                {[
                  { name: 'Pizza', icon: '🍕' },
                  { name: 'Burger', icon: '🍔' },
                  { name: 'Biryani', icon: '🍚' },
                  { name: 'Chinese', icon: '🥡' },
                  { name: 'South Indian', icon: '🥞' },
                  { name: 'Desserts', icon: '🍰' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() => handleSearch(cat.name)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[styles.categoryName, { color: theme.colors.text1 }]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[1],
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    paddingVertical: 0,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[3],
  },
  clearButton: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  recentText: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    marginBottom: spacing[1],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
  categoryName: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});

export default SearchScreen;
