/**
 * Statuses OrderService.requestCancellation accepts.
 * It throws for CANCELLED and DELIVERED, and when a request is already pending.
 * PENDING is not a commerce OrderStatus, so the customer app must not offer it.
 */
const CANCELLATION_REQUEST_STATUSES = new Set([
  'RECEIVED',
  'PREPARING',
  'OVEN',
  'BAKED',
  'READY',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'SERVED',
  'COMPLETED',
]);

export function canRequestCancellation(
  status: string | undefined,
  cancellationRequested?: boolean,
): boolean {
  if (!status || cancellationRequested) {
    return false;
  }
  return CANCELLATION_REQUEST_STATUSES.has(status);
}
