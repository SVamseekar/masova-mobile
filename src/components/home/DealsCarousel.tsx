/**
 * Premium deals carousel — photo-led cards (food-app quality).
 * Soft brand gold accents; no muddy multi-stop color washes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../styles';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { MenuDishImage } from '../menu/MenuDishImage';
import { CustomerPromotion } from '../../services/promotionsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;
const CARD_HEIGHT = 188;
const AUTO_MS = 4800;

type Props = {
  promotions: CustomerPromotion[];
  onPress: (promo: CustomerPromotion) => void;
};

/** Refined surfaces when no dish photo — charcoal + gold, not rainbow mud */
const FALLBACK_SURFACES = [
  { base: '#141414', glow: '#2A2410' },
  { base: '#12161A', glow: '#1A2228' },
  { base: '#161412', glow: '#242018' },
  { base: '#14181A', glow: '#1C2420' },
];

export const DealsCarousel: React.FC<Props> = ({ promotions, onPress }) => {
  const { theme, isDark } = useTheme();
  const listRef = useRef<FlatList<CustomerPromotion>>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const userPaused = useRef(false);

  const goTo = useCallback(
    (i: number, animated = true) => {
      if (!promotions.length) return;
      const next = ((i % promotions.length) + promotions.length) % promotions.length;
      indexRef.current = next;
      setIndex(next);
      try {
        listRef.current?.scrollToIndex({ index: next, animated });
      } catch {
        listRef.current?.scrollToOffset({
          offset: next * (CARD_WIDTH + spacing[3]),
          animated,
        });
      }
    },
    [promotions.length]
  );

  useEffect(() => {
    if (promotions.length <= 1) return;
    const id = setInterval(() => {
      if (userPaused.current) return;
      goTo(indexRef.current + 1);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [promotions.length, goTo]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (CARD_WIDTH + spacing[3]));
    if (i >= 0 && i < promotions.length) {
      indexRef.current = i;
      setIndex(i);
    }
  };

  if (!promotions.length) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing[3]}
        snapToAlignment="start"
        onScrollBeginDrag={() => {
          userPaused.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          onScrollEnd(e);
          setTimeout(() => {
            userPaused.current = false;
          }, 6000);
        }}
        getItemLayout={(_, i) => ({
          length: CARD_WIDTH + spacing[3],
          offset: (CARD_WIDTH + spacing[3]) * i,
          index: i,
        })}
        renderItem={({ item: promo, index: i }) => {
          const heroName = promo.dishNames[0];
          const heroUrl = promo.dishImageUrls[0];
          const hasHero = !!(heroName || heroUrl);
          const surface = FALLBACK_SURFACES[i % FALLBACK_SURFACES.length];

          return (
            <AnimatedPressable
              onPress={() => onPress(promo)}
              scaleTo={0.985}
              style={[styles.card, { width: CARD_WIDTH }]}
            >
              {/* Background: dish photo or refined charcoal */}
              {hasHero ? (
                <MenuDishImage
                  name={heroName}
                  imageUrl={heroUrl}
                  style={styles.heroImage}
                  placeholderColor="#1A1A1A"
                  iconColor="#666"
                />
              ) : (
                <LinearGradient
                  colors={[surface.base, surface.glow, surface.base]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}

              {/* Subtle vignette + readable bottom panel */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.15)',
                  'rgba(0,0,0,0.25)',
                  'rgba(0,0,0,0.82)',
                ]}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Soft gold rim light (top) */}
              <LinearGradient
                colors={['rgba(255,208,0,0.18)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.45 }}
                style={styles.topSheen}
                pointerEvents="none"
              />

              <View style={styles.content}>
                <View style={styles.topRow}>
                  {promo.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{promo.badge}</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  {/* Mini dish stack — secondary dishes only */}
                  {promo.dishNames.length > 1 ? (
                    <View style={styles.thumbs}>
                      {promo.dishNames.slice(1, 3).map((name, ti) => (
                        <View
                          key={`${promo.id}-t-${ti}`}
                          style={[
                            styles.stackThumb,
                            { marginLeft: ti === 0 ? 0 : -10, zIndex: 2 - ti },
                          ]}
                        >
                          <MenuDishImage
                            name={name}
                            imageUrl={promo.dishImageUrls[ti + 1]}
                            style={styles.stackImg}
                          />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View style={styles.bottomBlock}>
                  <Text style={styles.headline} numberOfLines={1}>
                    {promo.headline}
                  </Text>
                  <Text style={styles.title} numberOfLines={1}>
                    {promo.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={2}>
                    {promo.subtitle}
                  </Text>
                  <View style={styles.ctaRow}>
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>{promo.ctaLabel}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#0F0F0F" />
                    </View>
                  </View>
                </View>
              </View>
            </AnimatedPressable>
          );
        }}
      />

      {promotions.length > 1 ? (
        <View style={styles.dots}>
          {promotions.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === index
                      ? '#FFD000'
                      : isDark
                        ? 'rgba(255,255,255,0.28)'
                        : 'rgba(0,0,0,0.2)',
                },
                i === index ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.screenPadding,
  },
  card: {
    marginRight: spacing[3],
    borderRadius: 20,
    overflow: 'hidden',
    height: CARD_HEIGHT,
    backgroundColor: '#141414',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
  },
  content: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#FFD000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
    letterSpacing: 0.2,
  },
  thumbs: { flexDirection: 'row', alignItems: 'center' },
  stackThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  stackImg: { width: '100%', height: '100%' },
  bottomBlock: {
    gap: 2,
  },
  headline: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    letterSpacing: -0.6,
    color: '#FFD000',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Regular',
    color: 'rgba(255,255,255,0.82)',
    marginTop: 3,
    lineHeight: 16,
  },
  ctaRow: {
    marginTop: spacing[2],
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD000',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[3],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
  },
});

export default DealsCarousel;
