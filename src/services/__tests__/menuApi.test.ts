import httpClient from '../http/client';
import { menuApi } from '../api/menuApi';

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

describe('menuApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMenu', () => {
    it('fetches menu with all query filters', async () => {
      const mockRawItems = [
        { _id: 'm1', name: 'Dosa', price: 15000, category: 'DOSA', cuisine: 'SOUTH_INDIAN' },
      ];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockRawItems });

      const res = await menuApi.getMenu({
        storeId: 'DOM001',
        category: 'DOSA',
        cuisine: 'SOUTH_INDIAN',
        dietary: 'VEGETARIAN',
        search: 'dosa',
        recommended: true,
        tag: 'POPULAR',
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/menu?storeId=DOM001&category=DOSA&cuisine=SOUTH_INDIAN&dietary=VEGETARIAN&search=dosa&recommended=true&tag=POPULAR'
      );
      expect(res).toEqual([
        {
          _id: 'm1',
          id: 'm1',
          name: 'Dosa',
          price: 15000,
          basePrice: 15000,
          category: 'DOSA',
          cuisine: 'SOUTH_INDIAN',
        },
      ]);
    });

    it('fetches menu with no params', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });
      const res = await menuApi.getMenu();
      expect(httpClient.get).toHaveBeenCalledWith('/menu');
      expect(res).toEqual([]);
    });
  });

  describe('getMenuItem', () => {
    it('fetches single menu item by ID and maps price fields', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: { id: 'm1', name: 'Idly', price: 6000 },
      });

      const res = await menuApi.getMenuItem('m1');
      expect(httpClient.get).toHaveBeenCalledWith('/menu/m1');
      expect(res.basePrice).toBe(6000);
    });
  });

  describe('getRecommended & searchMenu', () => {
    it('getRecommended calls getMenu with recommended: true', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });
      await menuApi.getRecommended('DOM001');
      expect(httpClient.get).toHaveBeenCalledWith('/menu?storeId=DOM001&recommended=true');
    });

    it('searchMenu calls getMenu with search query', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({ data: [] });
      await menuApi.searchMenu('paneer', 'DOM001');
      expect(httpClient.get).toHaveBeenCalledWith('/menu?storeId=DOM001&search=paneer');
    });
  });
});
