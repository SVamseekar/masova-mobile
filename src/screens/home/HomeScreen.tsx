import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useRecommendedItems } from '../../hooks/useMenuQueries';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, MaSoVaLogo, FloatingChatBubble } from '../../components/ui';
import { RootStackParamList, Category } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    title: 'Fresh Indian, delivered',
    subtitle: 'Hot food at your door',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    title: 'Free Delivery Weekend',
    subtitle: 'No minimum order',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    title: 'Biryani Festival',
    subtitle: '20% off all biryanis',
  },
];

const CATEGORIES: { id: Category; name: string; iconName: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'BIRYANI', name: 'Biryani', iconName: 'restaurant-outline' },
  { id: 'PIZZA', name: 'Pizza', iconName: 'pizza-outline' },
  { id: 'BURGER', name: 'Burger', iconName: 'fast-food-outline' },
  { id: 'DOSA', name: 'Dosa', iconName: 'cafe-outline' },
  { id: 'NOODLES', name: 'Noodles', iconName: 'nutrition-outline' },
  { id: 'BEVERAGE', name: 'Drinks', iconName: 'wine-outline' },
];

const STORE_CARDS = [
  {
    id: '1',
    name: 'MaSoVa Indiranagar',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    rating: 4.7,
    etaMin: 25,
    deliveryFee: 29,
    isTrending: true,
  },
  {
    id: '2',
    name: 'MaSoVa Koramangala',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    rating: 4.5,
    etaMin: 35,
    deliveryFee: 49,
    isTrending: false,
  },
  {
    id: '3',
    name: 'MaSoVa Whitefield',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    rating: 4.6,
    etaMin: 45,
    deliveryFee: 79,
    isTrending: false,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  useRecommendedItems(); // prefetch

  // Hero carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const dotWidth0 = useRef(new Animated.Value(24)).current;
  const dotWidth1 = useRef(new Animated.Value(8)).current;
  const dotWidth2 = useRef(new Animated.Value(8)).current;
  const dotWidths = [dotWidth0, dotWidth1, dotWidth2];

  // Entrance animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;

  const catScale0 = useRef(new Animated.Value(0.8)).current;
  const catScale1 = useRef(new Animated.Value(0.8)).current;
  const catScale2 = useRef(new Animated.Value(0.8)).current;
  const catScale3 = useRef(new Animated.Value(0.8)).current;
  const catScale4 = useRef(new Animated.Value(0.8)).current;
  const catScale5 = useRef(new Animated.Value(0.8)).current;
  const catScales = [catScale0, catScale1, catScale2, catScale3, catScale4, catScale5];

  const catOpacity0 = useRef(new Animated.Value(0)).current;
  const catOpacity1 = useRef(new Animated.Value(0)).current;
  const catOpacity2 = useRef(new Animated.Value(0)).current;
  const catOpacity3 = useRef(new Animated.Value(0)).current;
  const catOpacity4 = useRef(new Animated.Value(0)).current;
  const catOpacity5 = useRef(new Animated.Value(0)).current;
  const catOpacities = [catOpacity0, catOpacity1, catOpacity2, catOpacity3, catOpacity4, catOpacity5];

  const cardTranslate0 = useRef(new Animated.Value(40)).current;
  const cardTranslate1 = useRef(new Animated.Value(40)).current;
  const cardTranslate2 = useRef(new Animated.Value(40)).current;
  const cardTranslates = [cardTranslate0, cardTranslate1, cardTranslate2];

  const cardOpacity0 = useRef(new Animated.Value(0)).current;
  const cardOpacity1 = useRef(new Animated.Value(0)).current;
  const cardOpacity2 = useRef(new Animated.Value(0)).current;
  const cardOpacities = [cardOpacity0, cardOpacity1, cardOpacity2];

  useEffect(() => {
    // Hero fades in at 0ms
    Animated.timing(heroOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Greeting at 100ms
    setTimeout(() => {
      Animated.timing(greetingOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 100);

    // Category icons stagger at 200ms+, 60ms apart
    catScales.forEach((scale, i) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.05, tension: 300, friction: 20, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1.0, tension: 300, friction: 20, useNativeDriver: true }),
        ]).start();
        Animated.timing(catOpacities[i], { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }, 200 + i * 60);
    });

    // Store cards slide up at 400ms+, 80ms apart
    cardTranslates.forEach((translate, i) => {
      setTimeout(() => {
        Animated.timing(translate, { toValue: 0, duration: 300, useNativeDriver: true }).start();
        Animated.timing(cardOpacities[i], { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }, 400 + i * 80);
    });
  }, []);

  // Hero carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentSlide + 1) % HERO_SLIDES.length;
      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentSlide(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // Dot width animation on slide change
  useEffect(() => {
    dotWidths.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === currentSlide ? 24 : 8,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSlide]);

  const renderHeroCarousel = () => (
    <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}>
      <FlatList
        ref={carouselRef}
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentSlide(index);
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, height: 200 }}>
            <Image source={{ uri: item.image }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.heroGradient}
            >
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.dotContainer}>
        {HERO_SLIDES.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidths[index],
                backgroundColor: index === currentSlide ? '#FFD000' : 'rgba(255,255,255,0.4)',
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <Animated.View style={{ opacity: greetingOpacity }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            What are you craving?
          </Text>
        </View>
      </Animated.View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((category, i) => (
          <Animated.View
            key={category.id}
            style={{ transform: [{ scale: catScales[i] }], opacity: catOpacities[i] }}
          >
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => navigation.navigate('Search')}
            >
              <View style={[styles.categoryIcon, { backgroundColor: theme.colors.surface2 }]}>
                <Ionicons name={category.iconName} size={24} color={theme.colors.text1} />
              </View>
              <Text style={[styles.categoryName, { color: theme.colors.text1 }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  const renderStoreCards = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Popular Near You
        </Text>
      </View>
      {STORE_CARDS.map((store, i) => (
        <Animated.View
          key={store.id}
          style={{
            transform: [{ translateY: cardTranslates[i] }],
            opacity: cardOpacities[i],
            marginHorizontal: spacing.screenPadding,
            marginBottom: spacing[4],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('Search')}
          >
            <Card elevation="sm" padding={0} style={styles.storeCard}>
              <Image source={{ uri: store.image }} style={styles.storeImage} />
              {store.isTrending && (
                <View style={styles.trendingBadge}>
                  <Text style={styles.trendingText}>Trending</Text>
                </View>
              )}
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: theme.colors.text1 }]}>
                  {store.name}
                </Text>
                <View style={styles.storeMetaRow}>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2 }]}>
                      {store.rating}
                    </Text>
                  </View>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.colors.text3} />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2 }]}>
                      {store.etaMin} min
                    </Text>
                  </View>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="bicycle-outline" size={13} color={theme.colors.text3} />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2 }]}>
                      ₹{store.deliveryFee} delivery
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <MaSoVaLogo size="md" textColor={isDark ? '#FFFFFF' : '#0F0F0F'} />
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text1} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderHeroCarousel()}
        {renderCategories()}
        {renderStoreCards()}
      </ScrollView>

      <FloatingChatBubble bottomOffset={72} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    marginBottom: spacing[4],
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: typography.fontSize.titleSm,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: typography.fontSize.bodySm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[3],
    gap: spacing[1],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: typography.fontSize.titleSm,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[4],
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  categoryName: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: typography.fontSize.caption,
    textAlign: 'center',
  },
  storeCard: {
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: 160,
  },
  trendingBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: '#FFD000',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.chip,
  },
  trendingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: typography.fontSize.caption,
    color: '#000000',
  },
  storeInfo: {
    padding: spacing[4],
  },
  storeName: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: typography.fontSize.body,
    marginBottom: spacing[2],
  },
  storeMetaRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  storeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeMetaText: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: typography.fontSize.bodySm,
  },
});

export default HomeScreen;
