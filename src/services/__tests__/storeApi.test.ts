import httpClient from '../http/client';
import { storeApi } from '../api/storeApi';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('storeApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStores', () => {
    it('fetches stores without query params when location is omitted', async () => {
      const mockStores = [{ id: 'DOM001', name: 'Dominick Hyderabad' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStores });

      const res = await storeApi.getStores();

      expect(httpClient.get).toHaveBeenCalledWith('/stores');
      expect(res).toEqual(mockStores);
    });

    it('appends lat and lng query params when location is provided', async () => {
      const mockStores = [{ id: 'DOM001' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStores });

      const res = await storeApi.getStores({ lat: 17.385, lng: 78.4867 });

      expect(httpClient.get).toHaveBeenCalledWith('/stores?lat=17.385&lng=78.4867');
      expect(res).toEqual(mockStores);
    });
  });

  describe('getAll', () => {
    it('delegates to getStores', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });
      await storeApi.getAll();
      expect(httpClient.get).toHaveBeenCalledWith('/stores');
    });
  });

  describe('getNearestStore', () => {
    it('returns first store from location search', async () => {
      const mockStores = [{ id: 'DOM001', name: 'Nearest Store' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStores });

      const store = await storeApi.getNearestStore(17.385, 78.4867);
      expect(store).toEqual(mockStores[0]);
    });

    it('throws error when no stores found nearby', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await expect(storeApi.getNearestStore(0, 0)).rejects.toThrow(
        'No stores available near this location'
      );
    });
  });

  describe('getStoreById', () => {
    it('fetches store by id or code', async () => {
      const mockStore = { id: 'DOM001', name: 'Main Branch' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockStore });

      const res = await storeApi.getStoreById('DOM001');
      expect(httpClient.get).toHaveBeenCalledWith('/stores/DOM001');
      expect(res).toEqual(mockStore);
    });
  });
});
