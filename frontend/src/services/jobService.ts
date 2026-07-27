import { apiClient } from './api';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  location?: string;
  type: string;
  description?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  benefits: string[];
  qualifications: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  location?: string;
  type?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  benefits?: string[];
  qualifications?: string[];
}

class JobService {
  async getCompanyIdBySlug(slug: string): Promise<string | null> {
    try {
      const response = await apiClient.get(`/companies/slug/${slug}`);
      const data = response.data.data || response.data;
      return data?.id || null;
    } catch (error) {
      console.error('Failed to resolve company id from slug:', error);
      return null;
    }
  }

  async listJobs(companyId: string): Promise<Job[]> {
    try {
      const response = await apiClient.get(`/companies/${companyId}/jobs`);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      return [];
    }
  }

  async createJob(companyId: string, input: CreateJobInput): Promise<Job> {
    const response = await apiClient.post(`/companies/${companyId}/jobs`, input);
    return response.data.data || response.data;
  }

  async deleteJob(companyId: string, jobId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/jobs/${jobId}`);
  }
}

export const jobService = new JobService();
