import { ApiError, setClientUserContext, setClientSelectedStoreContext } from '../http/client';

describe('httpClient & ApiError', () => {
  beforeEach(() => {
    setClientUserContext(null);
    setClientSelectedStoreContext(null);
  });

  it('correctly constructs ApiError with status and data', () => {
    const error = new ApiError('Unauthorized access', 401, { error: 'invalid_token' });
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Unauthorized access');
    expect(error.status).toBe(401);
    expect(error.data).toEqual({ error: 'invalid_token' });
  });

  it('manages user and store contexts for headers', () => {
    setClientUserContext('usr_123');
    setClientSelectedStoreContext('DOM001');

    // Contexts set correctly
    expect(require('../http/client').getClientUserContext()).toBe('usr_123');
    expect(require('../http/client').getClientSelectedStoreContext()).toBe('DOM001');
  });
});
