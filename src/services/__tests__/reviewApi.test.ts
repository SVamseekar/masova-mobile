import httpClient from '../http/client';
import { reviewApi } from '../api/reviewApi';

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

describe('reviewApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('posts review payload with overallRating', async () => {
      const mockReview = { id: 'rev_1', overallRating: 5 };
      (httpClient.post as jest.Mock).mockResolvedValue({ data: mockReview });

      const res = await reviewApi.create({
        orderId: 'ord_1',
        overallRating: 5,
        comment: 'Great food!',
      });

      expect(httpClient.post).toHaveBeenCalledWith('/reviews', {
        orderId: 'ord_1',
        overallRating: 5,
        comment: 'Great food!',
      });
      expect(res).toEqual(mockReview);
    });
  });

  describe('getById', () => {
    it('fetches review by reviewId', async () => {
      const mockReview = { id: 'rev_1', overallRating: 4 };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockReview });

      const res = await reviewApi.getById('rev_1');
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/rev_1');
      expect(res).toEqual(mockReview);
    });
  });

  describe('getByOrderId', () => {
    it('fetches reviews associated with an order', async () => {
      const mockReviews = [{ id: 'rev_1' }];
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockReviews });

      const res = await reviewApi.getByOrderId('ord_1');
      expect(httpClient.get).toHaveBeenCalledWith('/reviews?entityType=ORDER&entityId=ord_1');
      expect(res).toEqual(mockReviews);
    });
  });

  describe('getPublicByToken', () => {
    it('fetches public review by token', async () => {
      const mockReview = { id: 'rev_1' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockReview });

      const res = await reviewApi.getPublicByToken('token_123');
      expect(httpClient.get).toHaveBeenCalledWith('/reviews/public/token/token_123');
      expect(res).toEqual(mockReview);
    });
  });
});
