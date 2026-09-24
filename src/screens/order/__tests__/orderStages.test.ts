import {
  DELIVERY_ORDER_STAGES,
  DINE_IN_ORDER_STAGES,
  TAKEAWAY_ORDER_STAGES,
  getDeliveryStageIndex,
} from '../orderStages';

describe('delivery order stages', () => {
  it('places OUT_FOR_DELIVERY after DISPATCHED and before DELIVERED', () => {
    const statuses = DELIVERY_ORDER_STAGES.map((stage) => stage.status);
    const dispatched = statuses.indexOf('DISPATCHED');
    const outForDelivery = statuses.indexOf('OUT_FOR_DELIVERY');
    const delivered = statuses.indexOf('DELIVERED');

    expect(getDeliveryStageIndex('OUT_FOR_DELIVERY')).toBe(outForDelivery);
    expect(outForDelivery).toBeGreaterThanOrEqual(0);
    expect(outForDelivery).toBe(dispatched + 1);
    expect(delivered).toBe(outForDelivery + 1);
  });

  it('leaves takeaway and dine-in stage lists without OUT_FOR_DELIVERY', () => {
    expect(TAKEAWAY_ORDER_STAGES.map((stage) => stage.status)).not.toContain('OUT_FOR_DELIVERY');
    expect(DINE_IN_ORDER_STAGES.map((stage) => stage.status)).not.toContain('OUT_FOR_DELIVERY');
  });
});
