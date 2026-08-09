import { getListPerfProps, LIST_PERF } from '../listPerf';

describe('listPerf', () => {
  it('exposes virtualization defaults', () => {
    expect(LIST_PERF.initialNumToRender).toBeGreaterThan(0);
    expect(LIST_PERF.windowSize).toBeGreaterThan(0);
    const props = getListPerfProps();
    expect(props.initialNumToRender).toBe(LIST_PERF.initialNumToRender);
    expect(props.maxToRenderPerBatch).toBe(LIST_PERF.maxToRenderPerBatch);
    expect(props.windowSize).toBe(LIST_PERF.windowSize);
    expect(typeof props.removeClippedSubviews).toBe('boolean');
  });
});
