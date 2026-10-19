import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useComparison } from '@/hooks/useComparison';

const { compare, monitor } = vi.hoisted(() => ({
  compare: vi.fn(),
  monitor: { trackMetric: vi.fn(), isEnabled: false }
}));
vi.mock('@/algorithms/MyersAlgorithm', () => ({ MyersAlgorithm: { compare } }));
vi.mock('@/hooks/usePerformanceMonitor', () => ({ usePerformanceMonitor: () => monitor }));
vi.mock('@/services/AnalyticsService', () => ({
  trackEvent: { documentComparison: vi.fn(), featureUsed: vi.fn() }
}));

describe('pair imports and live comparison', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    compare.mockResolvedValue({ changes: [{ type: 'unchanged', content: 'Text' }], stats: {} });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('compares the complete pair once and never compares mixed old/new inputs', async () => {
    const { result } = renderHook(() => useComparison());
    act(() => { result.current.replaceTexts('First original', 'First revised'); });
    act(() => { result.current.setInputImportPending(true); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(compare).not.toHaveBeenCalled();
    act(() => { result.current.replaceTexts('New original', 'New revised'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare).toHaveBeenCalledWith('New original', 'New revised', expect.any(Function));
    expect(result.current.originalText).toBe('New original');
    expect(result.current.revisedText).toBe('New revised');
  });

  it('compares a second import made immediately after the previous comparison finishes', async () => {
    const { result } = renderHook(() => useComparison());
    act(() => { result.current.replaceTexts('First original', 'First revised'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(compare).toHaveBeenCalledTimes(1);
    expect(result.current.isProcessing).toBe(false);
    act(() => { result.current.replaceTexts('Second original', 'Second revised'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(compare).toHaveBeenCalledTimes(2);
    expect(compare).toHaveBeenLastCalledWith('Second original', 'Second revised', expect.any(Function));
  });

  it('clears the previous result and respects live comparison being off', async () => {
    const { result } = renderHook(() => useComparison());
    act(() => { result.current.replaceTexts('First original', 'First revised'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(result.current.result).not.toBeNull();
    act(() => { result.current.toggleQuickCompare(); });
    act(() => { result.current.replaceTexts('New original', 'New revised'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(result.current.result).toBeNull();
    expect(compare).toHaveBeenCalledTimes(1);
  });
});
