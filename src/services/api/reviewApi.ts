import httpClient from '../http/client';
import { Review, CreateReviewRequest } from '../../types';

export const reviewApi = {
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const payload = {
      ...data,
      overallRating: data.overallRating,
    };
    const response = await httpClient.post<Review>('/reviews', payload);
    return response.data;
  },

  getById: async (reviewId: string): Promise<Review> => {
    const response = await httpClient.get<Review>(`/reviews/${reviewId}`);
    return response.data;
  },

  getByOrderId: async (orderId: string): Promise<Review[]> => {
    const response = await httpClient.get<Review[]>(`/reviews?entityType=ORDER&entityId=${encodeURIComponent(orderId)}`);
    return response.data || [];
  },

  getPublicByToken: async (token: string): Promise<Review> => {
    const response = await httpClient.get<Review>(`/reviews/public/token/${encodeURIComponent(token)}`);
    return response.data;
  },
};

export default reviewApi;
