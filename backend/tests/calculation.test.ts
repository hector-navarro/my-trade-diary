import { describe, expect, it } from 'vitest';
import { TradeDirection, TradeEventType } from '@prisma/client';
import { calculateRMultiple, calculateRiskReward, evaluatePlanCompliance } from '../src/services/calculationService';

describe('calculationService', () => {
  it('calculates risk reward correctly for long trades', () => {
    const rr = calculateRiskReward({
      plannedEntry: 100,
      plannedStopLoss: 95,
      plannedTakeProfit: 110,
      direction: TradeDirection.LONG,
    });
    expect(rr).toBeCloseTo(2);
  });

  it('calculates r multiple for short trades', () => {
    const r = calculateRMultiple({
      plannedEntry: 100,
      plannedStopLoss: 105,
      direction: TradeDirection.SHORT,
    } as any, 90);
    expect(r).toBeCloseTo(2);
  });

  it('evaluates plan compliance considering exit tolerance and time', () => {
    const trade: any = {
      id: 1,
      direction: TradeDirection.LONG,
      plannedEntry: 100,
      plannedStopLoss: 95,
      plannedTakeProfit: 110,
      maxHoldMinutes: 60,
      actualEntryPrice: 100,
      actualExitPrice: 109,
    };

    const events: any[] = [
      { type: TradeEventType.ENTRY, occurredAt: new Date('2023-01-01T00:00:00Z') },
      { type: TradeEventType.EXIT, occurredAt: new Date('2023-01-01T00:30:00Z') },
    ];

    expect(
      evaluatePlanCompliance({
        trade,
        events,
      }),
    ).toBe(true);
  });

  it('detects violations when SL moved against plan', () => {
    const trade: any = {
      id: 1,
      direction: TradeDirection.LONG,
      plannedEntry: 100,
      plannedStopLoss: 95,
      plannedTakeProfit: 110,
      maxHoldMinutes: 60,
      actualEntryPrice: 100,
      actualExitPrice: 109,
    };

    const events: any[] = [
      { type: TradeEventType.ENTRY, occurredAt: new Date('2023-01-01T00:00:00Z') },
      { type: TradeEventType.MOVE_SL, price: 96, occurredAt: new Date('2023-01-01T00:10:00Z') },
      { type: TradeEventType.EXIT, occurredAt: new Date('2023-01-01T00:30:00Z') },
    ];

    expect(
      evaluatePlanCompliance({
        trade,
        events,
      }),
    ).toBe(false);
  });
});
