import { GasBatchResponse } from '../types';

export class GasApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async initQueue(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=init`);
      if (!response.ok) throw new Error('Failed to initialize queue');
      return await response.json();
    } catch (error) {
      console.error('Error initializing queue:', error);
      throw error;
    }
  }

  async fetchNextBatch(): Promise<GasBatchResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}?action=next`);
      if (!response.ok) throw new Error('Failed to fetch next batch');
      const data = await response.json();
      
      // If no more batches, it might return empty or specific message
      if (!data || !data.images || data.images.length === 0) {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching next batch:', error);
      throw error;
    }
  }

  async resetQueue(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?action=reset`);
      if (!response.ok) throw new Error('Failed to reset queue');
      return await response.json();
    } catch (error) {
      console.error('Error resetting queue:', error);
      throw error;
    }
  }
}
