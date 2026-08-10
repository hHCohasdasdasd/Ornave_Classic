import { apiClient } from './api';

export interface Candidate {
  id: string;
  companyId: string;
  name: string;
  title?: string;
  location?: string;
  skills: string[];
  experience?: string;
  availability: 'Available' | 'Passive' | 'Not looking';
  saved: boolean;
  createdAt: string;
  updatedAt: string;
}

class TalentService {
  async listCandidates(companyId: string): Promise<Candidate[]> {
    const response = await apiClient.get(`/companies/${companyId}/candidates`);
    return response.data.data || [];
  }

  async createCandidate(
    companyId: string,
    data: Partial<Pick<Candidate, 'name' | 'title' | 'location' | 'skills' | 'experience' | 'availability' | 'saved'>>
  ): Promise<Candidate> {
    const response = await apiClient.post(`/companies/${companyId}/candidates`, data);
    return response.data.data;
  }

  async updateCandidate(
    companyId: string,
    candidateId: string,
    data: Partial<Pick<Candidate, 'name' | 'title' | 'location' | 'skills' | 'experience' | 'availability' | 'saved'>>
  ): Promise<Candidate> {
    const response = await apiClient.put(`/companies/${companyId}/candidates/${candidateId}`, data);
    return response.data.data;
  }

  async deleteCandidate(companyId: string, candidateId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/candidates/${candidateId}`);
  }
}

export const talentService = new TalentService();
