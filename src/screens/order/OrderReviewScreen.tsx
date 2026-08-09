/**
 * Order Review Screen
 * Post-delivery review and rating submission
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';
import { Button, Card } from '../../components/ui';
import { RootStackParamList } from '../../types';

import { reviewApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'OrderReview'>;

interface RatingStarsProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
}

const OrderReviewScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const { orderId } = route.params;

  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const RatingStars: React.FC<RatingStarsProps> = ({ rating, onRatingChange, label }) => (
    <View style={styles.ratingSection}>
      <Text style={[styles.ratingLabel, { color: theme.colors.text2 }]}>
        {label}
      </Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRatingChange(star);
            }}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={36}
              color={star <= rating ? '#FFD000' : theme.colors.text3}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSubmit = async () => {
    // Validation
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating.');
      return;
    }

    try {
      setIsSubmitting(true);

      await reviewApi.create({
        orderId,
        overallRating,
        comment: comment.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Thank You!',
        'Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('OrderHistory'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Review?',
      'Are you sure you want to skip rating your experience?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => navigation.navigate('OrderHistory'),
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text1 }]}>
          Rate Your Experience
        </Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.text2 }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: `${'#FFD000'}15` },
            ]}
          >
            <Ionicons
              name="happy-outline"
              size={56}
              color={'#FFD000'}
            />
          </View>
          <Text style={[styles.heroTitle, { color: theme.colors.text1 }]}>
            How was your order?
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.text2 }]}>
            Your feedback helps us improve
          </Text>
        </View>

        {/* Overall Rating */}
        <Card elevation="sm" style={styles.card}>
          <RatingStars
            rating={overallRating}
            onRatingChange={setOverallRating}
            label="Overall Experience"
          />
        </Card>

        {/* Detailed Ratings */}
        <Card elevation="sm" style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text1 }]}>
            Rate Specific Aspects
          </Text>

          <RatingStars
            rating={foodRating}
            onRatingChange={setFoodRating}
            label="Food Quality"
          />

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <RatingStars
            rating={deliveryRating}
            onRatingChange={setDeliveryRating}
            label="Delivery Experience"
          />
        </Card>

        {/* Comment Section */}
        <Card elevation="sm" style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text1 }]}>
            Share More Details (Optional)
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us what you liked or what could be improved..."
            placeholderTextColor={theme.colors.text3}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: theme.colors.text3 }]}>
            {comment.length}/500
          </Text>
        </Card>

        {/* Tips Section */}
        <View style={[styles.tipsCard, { backgroundColor: `${'#FFD000'}08` }]}>
          <Ionicons
            name="bulb-outline"
            size={20}
            color={'#FFD000'}
          />
          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: theme.colors.text1 }]}>
              Writing a Great Review
            </Text>
            <Text style={[styles.tipsText, { color: theme.colors.text2 }]}>
              • Mention specific dishes you enjoyed{'\n'}
              • Share details about packaging and delivery{'\n'}
              • Be honest and constructive
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <Button
          title="Submit Review"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={overallRating === 0 || isSubmitting}
          style={styles.submitButton}
        />
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skipButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  skipText: {
    fontSize: typography.fontSize.body,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[4],
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  heroTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: spacing[2],
  },
  heroSubtitle: {
    fontSize: typography.fontSize.body,
  },
  card: {
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[4],
  },
  ratingSection: {
    marginBottom: spacing[3],
  },
  ratingLabel: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing[2],
  },
  stars: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  starButton: {
    padding: spacing[1],
  },
  divider: {
    height: 1,
    marginVertical: spacing[4],
  },
  commentInput: {
    minHeight: 100,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.body,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  characterCount: {
    fontSize: typography.fontSize.caption,
    textAlign: 'right',
  },
  tipsCard: {
    flexDirection: 'row',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[3],
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },
  tipsText: {
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  footer: {
    paddingTop: spacing[4],
    paddingHorizontal: spacing.screenPadding,
  },
  submitButton: {
    width: '100%',
  },
});

export default OrderReviewScreen;
