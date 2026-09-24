import { Ionicons } from '@expo/vector-icons';
import { OrderStatus } from '../../types';

export type OrderStage = {
  status: OrderStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const DELIVERY_ORDER_STAGES: OrderStage[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready', icon: 'fast-food' },
  { status: 'DISPATCHED', label: 'On the Way', icon: 'bicycle' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: 'bicycle' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' },
];

export const TAKEAWAY_ORDER_STAGES: OrderStage[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready for Pickup', icon: 'bag-check' },
  { status: 'COMPLETED', label: 'Picked Up', icon: 'checkmark-done-circle' },
];

export const DINE_IN_ORDER_STAGES: OrderStage[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready to Serve', icon: 'fast-food' },
  { status: 'SERVED', label: 'Served', icon: 'checkmark-done-circle' },
];

export function getOrderStages(orderType?: string): OrderStage[] {
  switch (orderType) {
    case 'TAKEAWAY':
    case 'COLLECTION':
      return TAKEAWAY_ORDER_STAGES;
    case 'DINE_IN':
      return DINE_IN_ORDER_STAGES;
    case 'DELIVERY':
    default:
      return DELIVERY_ORDER_STAGES;
  }
}

export function getDeliveryStageIndex(status: string): number {
  return DELIVERY_ORDER_STAGES.findIndex((stage) => stage.status === status);
}

/** Driver has the order or is about to. DELIVERED is separate. */
export function isDeliveryOnTheWay(status: string): boolean {
  return status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY';
}
