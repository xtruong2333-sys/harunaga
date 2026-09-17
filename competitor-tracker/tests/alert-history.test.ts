import { describe, it, expect } from 'vitest';
import {
  mapAlertStatus,
  calculateThresholdRatio,
  checkSendingStuck,
  formatElapsedSeconds,
  getTimeFilterThreshold,
  sanitizeAlertError,
  computeAlertSummary,
  filterAndSortAlerts,
} from '../src/services/alert-history-service';
import type { AlertHistoryItem, AlertHistoryFilter } from '../src/types/alert-history';

function makeItem(overrides: Partial<AlertHistoryItem> = {}): AlertHistoryItem {
  return {
    id: 'id-1',
    videoId: 'video-1',
    videoTitle: 'Test Video',
    videoYoutubeId: 'abc123',
    videoThumbnailUrl: null,
    channelId: 'ch-1',
    channelName: 'Test Channel',
    channelHandle: '@test',
    channelAvatarUrl: null,
    thresholdVph: 1000,
    measuredVph: 2000,
    viewCountAtAlert: 50000,
    viewDeltaAtAlert: 5000,
    elapsedSeconds: 3600,
    thresholdRatio: 2.0,
    currentVph: 1800,
    currentViewCount: 55000,
    status: 'sent',
    isSendingStuck: false,
    attempts: 1,
    discordMessageId: 'msg-1',
    sanitizedLastError: null,
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 3500 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3500 * 1000).toISOString(),
    ...overrides,
  };
}

describe('mapAlertStatus', () => {
  it('maps all 4 known statuses correctly', () => {
        expect(mapAlertStatus('sent')).toBe('Đã gửi');
    expect(mapAlertStatus('pending')).toBe('Đang chờ');
    expect(mapAlertStatus('sending')).toBe('Đang gửi');
    expect(mapAlertStatus('failed')).toBe('Gửi lỗi');
  });
  it('returns unknown status as-is', () => {
    expect(mapAlertStatus('unknown')).toBe('unknown');
  });
});

describe('calculateThresholdRatio', () => {
  it('returns ratio = measuredVph / thresholdVph', () => {
    expect(calculateThresholdRatio(2000, 1000)).toBe(2.0);
    expect(calculateThresholdRatio(1500, 1000)).toBe(1.5);
  });
  it('returns null when threshold is 0', () => {
    expect(calculateThresholdRatio(2000, 0)).toBeNull();
  });
  it('returns null when threshold is negative', () => {
    expect(calculateThresholdRatio(2000, -1)).toBeNull();
  });
});

describe('checkSendingStuck', () => {
  it('returns false for non-sending status', () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString();
    expect(checkSendingStuck('sent', recent)).toBe(false);
    expect(checkSendingStuck('failed', recent)).toBe(false);
  });
  it('returns false when sending but updated recently (< 15 min)', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(checkSendingStuck('sending', recent)).toBe(false);
  });
  it('returns true when sending and updated > 15 min ago', () => {
    const old = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    expect(checkSendingStuck('sending', old)).toBe(true);
  });
});

describe('formatElapsedSeconds', () => {
  it('returns em-dash for null', () => { expect(formatElapsedSeconds(null)).toBe('\u2014'); });
  it('formats seconds only', () => { expect(formatElapsedSeconds(45)).toBe('45s'); });
  it('formats minutes only', () => { expect(formatElapsedSeconds(120)).toBe('2m'); });
  it('formats minutes and seconds', () => { expect(formatElapsedSeconds(90)).toBe('1m 30s'); });
});

describe('getTimeFilterThreshold', () => {
  it('returns null for all', () => { expect(getTimeFilterThreshold('all')).toBeNull(); });
  it('returns ISO string for 24h', () => {
    const result = getTimeFilterThreshold('24h');
    expect(result).not.toBeNull();
    const diff = Date.now() - new Date(result!).getTime();
    expect(diff).toBeGreaterThan(23 * 3600 * 1000);
    expect(diff).toBeLessThan(25 * 3600 * 1000);
  });
});

describe('sanitizeAlertError', () => {
  it('returns null for null input', () => { expect(sanitizeAlertError(null)).toBeNull(); });
  it('strips Discord webhook URLs', () => {
    const err = 'Failed: https://discord.com/api/webhooks/123/abc POST error';
    const result = sanitizeAlertError(err);
    expect(result).not.toContain('discord.com');
  });
  it('passes through generic error messages', () => {
    expect(sanitizeAlertError('Network timeout')).toBe('Network timeout');
  });
});

describe('computeAlertSummary', () => {
  it('counts 0 for empty list', () => {
    const s = computeAlertSummary([]);
    expect(s.total).toBe(0);
    expect(s.sent).toBe(0);
    expect(s.waiting).toBe(0);
    expect(s.failed).toBe(0);
  });
  it('counts correctly for mixed statuses', () => {
    const items = [
      makeItem({ status: 'sent' }),
      makeItem({ id: '2', status: 'sent' }),
      makeItem({ id: '3', status: 'pending' }),
      makeItem({ id: '4', status: 'sending' }),
      makeItem({ id: '5', status: 'failed' }),
    ];
    const s = computeAlertSummary(items);
    expect(s.total).toBe(5);
    expect(s.sent).toBe(2);
    expect(s.waiting).toBe(2);
    expect(s.failed).toBe(1);
  });
});

describe('filterAndSortAlerts - status', () => {
  const items = [
    makeItem({ id: '1', status: 'sent' }),
    makeItem({ id: '2', status: 'failed' }),
    makeItem({ id: '3', status: 'pending' }),
  ];
  it('returns all when status is all', () => {
    const filter: AlertHistoryFilter = { status: 'all', range: 'all', channelId: null, search: '', videoId: null };
    expect(filterAndSortAlerts(items, filter, 'newest').length).toBe(3);
  });
  it('filters by specific status', () => {
    const filter: AlertHistoryFilter = { status: 'failed', range: 'all', channelId: null, search: '', videoId: null };
    const result = filterAndSortAlerts(items, filter, 'newest');
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('failed');
  });
});

describe('filterAndSortAlerts - search', () => {
  const items = [
    makeItem({ id: '1', videoTitle: 'Amazing Tutorial', channelName: 'Tech Channel', channelHandle: '@tech' }),
    makeItem({ id: '2', videoTitle: 'Cooking Recipe', channelName: 'Food Channel', channelHandle: '@foodie' }),
  ];
  it('matches by video title', () => {
    const filter: AlertHistoryFilter = { status: 'all', range: 'all', channelId: null, search: 'amazing', videoId: null };
    const result = filterAndSortAlerts(items, filter, 'newest');
    expect(result.length).toBe(1);
    expect(result[0].videoTitle).toBe('Amazing Tutorial');
  });
  it('matches by channel handle', () => {
    const filter: AlertHistoryFilter = { status: 'all', range: 'all', channelId: null, search: 'foodie', videoId: null };
    const result = filterAndSortAlerts(items, filter, 'newest');
    expect(result.length).toBe(1);
    expect(result[0].channelHandle).toBe('@foodie');
  });
});

describe('filterAndSortAlerts - sort', () => {
  const items = [
    makeItem({ id: '1', measuredVph: 1000, viewCountAtAlert: 5000, attempts: 1,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() }),
    makeItem({ id: '2', measuredVph: 5000, viewCountAtAlert: 1000, attempts: 3,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }),
    makeItem({ id: '3', measuredVph: 3000, viewCountAtAlert: 3000, attempts: 2,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }),
  ];
  const filter: AlertHistoryFilter = { status: 'all', range: 'all', channelId: null, search: '', videoId: null };
  it('sorts by newest first', () => {
    const result = filterAndSortAlerts(items, filter, 'newest');
    expect(result[0].id).toBe('2');
    expect(result[2].id).toBe('1');
  });
  it('sorts by vph_desc', () => {
    const result = filterAndSortAlerts(items, filter, 'vph_desc');
    expect(result[0].measuredVph).toBe(5000);
    expect(result[2].measuredVph).toBe(1000);
  });
  it('sorts by views_desc', () => {
    const result = filterAndSortAlerts(items, filter, 'views_desc');
    expect(result[0].viewCountAtAlert).toBe(5000);
  });
  it('sorts by attempts_desc', () => {
    const result = filterAndSortAlerts(items, filter, 'attempts_desc');
    expect(result[0].attempts).toBe(3);
    expect(result[2].attempts).toBe(1);
  });
});