import {
  initErrorReporting,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  sendTestErrorEvent,
} from '../errorReporting';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
}));

import * as Sentry from '@sentry/react-native';

describe('errorReporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles init when DSN is empty without throwing', () => {
    expect(() => initErrorReporting()).not.toThrow();
  });

  it('captures exception safely', () => {
    const error = new Error('Test Exception');
    expect(() => captureException(error, { extraKey: 'val' })).not.toThrow();
  });

  it('captures message safely', () => {
    expect(() => captureMessage('Test Message', 'warning')).not.toThrow();
  });

  it('sets and clears user context safely', () => {
    expect(() => setUserContext({ id: 'user-123', email: 'test@masova.com', userType: 'CUSTOMER' })).not.toThrow();
    expect(() => clearUserContext()).not.toThrow();
  });

  it('sends test error event', () => {
    const eventMessage = sendTestErrorEvent();
    expect(eventMessage).toContain('MaSoVa Debug Test Event');
  });
});
