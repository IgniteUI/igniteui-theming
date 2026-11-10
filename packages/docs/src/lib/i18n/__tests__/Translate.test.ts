import { describe, expect, it } from 'vitest';
import { interpolate, translate } from '../Translate';

describe('interpolate', () => {
  it('joins numeric placeholders without array commas', () => {
    expect(interpolate('{count} documents found', { count: 2 })).toBe(
      '2 documents found'
    );
    expect(interpolate('検索数：{count}件', { count: 2 })).toBe('検索数：2件');
  });

  it('leaves unknown placeholders in place', () => {
    expect(interpolate('{a} and {b}', { a: 'x' })).toBe('x and {b}');
  });
});

describe('translate', () => {
  it('falls back to the message when the id is unknown', () => {
    expect(
      translate({ id: 'nope', message: 'Hi {name}' }, { name: 'A' }, 'en')
    ).toBe('Hi A');
  });
});
