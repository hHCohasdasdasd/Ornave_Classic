import { apiClient } from './api';
import { MentionCandidate } from '@/types/feed';

class MentionService {
  async searchPeople(query: string): Promise<MentionCandidate[]> {
    if (!query.trim()) return [];
    try {
      const response = await apiClient.get('/users/search', { params: { q: query, limit: 6 } });
      const data = response.data.data || response.data || [];
      // Backend already ranks the searching user's own connections first.
      return data.map((u: any) => ({
        id: u.id,
        type: 'user' as const,
        name: `${u.firstName} ${u.lastName}`.trim(),
        avatarUrl: u.profilePicture,
        // The real id — not a name slug — so two people sharing a name still
        // resolve to the exact person that was tagged.
        slug: u.id,
        headline: u.headline,
        bio: u.bio,
        location: u.location,
        companyName: u.companyName,
        isConnection: !!u.isConnection,
      }));
    } catch (error) {
      console.error('Failed to search people:', error);
      return [];
    }
  }

  async searchCompanies(query: string): Promise<MentionCandidate[]> {
    if (!query.trim()) return [];
    try {
      const response = await apiClient.get('/network/directory/search', { params: { name: query } });
      const data = response.data.data || response.data || [];
      return data.slice(0, 6).map((profile: any) => ({
        id: profile.company?.id || profile.companyId,
        type: 'company' as const,
        name: profile.company?.name,
        avatarUrl: profile.company?.logo,
        slug: profile.company?.slug,
        headline: profile.industry,
        location: profile.country,
      }));
    } catch (error) {
      console.error('Failed to search companies:', error);
      return [];
    }
  }

  /** Shown before the user types anything — their own connections, so the
   * first thing they see is people they actually know. */
  async getNetworkSuggestions(limit = 6): Promise<MentionCandidate[]> {
    try {
      const response = await apiClient.get('/users/connections');
      const data = response.data.data || response.data || [];
      return data.slice(0, limit).map((u: any) => ({
        id: u.id,
        type: 'user' as const,
        name: `${u.firstName} ${u.lastName}`.trim(),
        avatarUrl: u.profilePicture,
        slug: u.id,
        headline: u.headline,
        isConnection: true,
      }));
    } catch (error) {
      console.error('Failed to load network suggestions:', error);
      return [];
    }
  }

  async search(query: string): Promise<MentionCandidate[]> {
    const [people, companies] = await Promise.all([this.searchPeople(query), this.searchCompanies(query)]);
    // Connections first, then everyone else people, then companies.
    return [...people.sort((a, b) => Number(b.isConnection) - Number(a.isConnection)), ...companies];
  }
}

export const mentionService = new MentionService();
