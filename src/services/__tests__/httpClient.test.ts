import httpClient, {
  ApiError,
  setClientUserContext,
  setClientSelectedStoreContext,
  getClientUserContext,
  getClientSelectedStoreContext,
} from '../http/client';

describe('httpClient & ApiError', () => {
  beforeEach(() => {
    setClientUserContext(null);
    setClientSelectedStoreContext(null);
  });

  describe('ApiError', () => {
    it('correctly constructs ApiError with status, data, and code', () => {
      const error = new ApiError('Unauthorized access', 401, { error: 'invalid_token' }, 'ERR_UNAUTHORIZED');
      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Unauthorized access');
      expect(error.status).toBe(401);
      expect(error.data).toEqual({ error: 'invalid_token' });
      expect(error.code).toBe('ERR_UNAUTHORIZED');
    });
  });

  describe('Context state helpers', () => {
    it('manages user and store contexts for header injection', () => {
      setClientUserContext('usr_123');
      setClientSelectedStoreContext('DOM001');

      expect(getClientUserContext()).toBe('usr_123');
      expect(getClientSelectedStoreContext()).toBe('DOM001');

      setClientUserContext(null);
      setClientSelectedStoreContext(null);

      expect(getClientUserContext()).toBeNull();
      expect(getClientSelectedStoreContext()).toBeNull();
    });
  });

  describe('httpClient instance config', () => {
    it('has baseURL and timeout configured', () => {
      expect(httpClient.defaults.baseURL).toBeDefined();
      expect(httpClient.defaults.timeout).toBeGreaterThan(0);
    });
  });
});
