import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { Button } from '../ui';
import { useTheme } from '../../hooks/useTheme';
import { useCancelOrder } from '../../hooks/useOrderQueries';
import { spacing, typography, borderRadius } from '../../styles';
import { Order } from '../../types';
import { canRequestCancellation } from '../../utils/orderCancellation';

const SENT_COPY =
  'Cancellation request sent. A manager will review it. This order is not cancelled.';

interface CancelRequestSectionProps {
  orderId: string;
  status: string;
  cancellationRequested?: boolean;
  onRequested?: (order: Order) => void;
}

const CancelRequestSection: React.FC<CancelRequestSectionProps> = ({
  orderId,
  status,
  cancellationRequested,
  onRequested,
}) => {
  const { theme } = useTheme();
  const cancelOrder = useCancelOrder();
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);

  if (cancellationRequested || sent) {
    return (
      <Text style={[styles.sent, { color: theme.colors.text2 }]} accessibilityRole="text">
        {SENT_COPY}
      </Text>
    );
  }

  if (!canRequestCancellation(status, cancellationRequested)) {
    return null;
  }

  const sendRequest = () => {
    const trimmed = reason.trim();
    cancelOrder.mutate(trimmed ? { orderId, reason: trimmed } : { orderId }, {
      onSuccess: (updated) => {
        setSent(true);
        onRequested?.(updated);
        Alert.alert(
          'Request sent',
          'Your cancellation request was sent. A manager will review it. This order is not cancelled.',
        );
      },
      onError: () => {
        Alert.alert(
          'Request failed',
          'The cancellation request was not sent. This order is not cancelled.',
        );
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="Reason (optional)"
        placeholderTextColor={theme.colors.text3}
        style={[
          styles.input,
          {
            color: theme.colors.text1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface1,
          },
        ]}
        accessibilityLabel="Cancellation reason"
      />
      <Button
        title="Request cancellation"
        variant="danger"
        fullWidth
        loading={cancelOrder.isPending}
        disabled={cancelOrder.isPending}
        onPress={() => {
          Alert.alert(
            'Request cancellation',
            'Send a cancellation request? A manager must approve it. This order stays active until then.',
            [
              { text: 'Keep order', style: 'cancel' },
              { text: 'Send request', style: 'destructive', onPress: sendRequest },
            ],
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.body,
  },
  sent: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing[4],
  },
});

export default CancelRequestSection;
