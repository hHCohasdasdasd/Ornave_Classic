import { apiClient } from './api';

export interface Course {
  id: string;
  companyId: string;
  title: string;
  instructor?: string;
  category?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  rating: number;
  enrolled: number;
  progress?: number;
  saved: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

class LearningService {
  async listCourses(companyId: string): Promise<Course[]> {
    const response = await apiClient.get(`/companies/${companyId}/courses`);
    return response.data.data || [];
  }

  async createCourse(
    companyId: string,
    data: Partial<Pick<Course, 'title' | 'instructor' | 'category' | 'level' | 'duration' | 'rating' | 'enrolled' | 'progress' | 'saved' | 'thumbnail'>>
  ): Promise<Course> {
    const response = await apiClient.post(`/companies/${companyId}/courses`, data);
    return response.data.data;
  }

  async updateCourse(
    companyId: string,
    courseId: string,
    data: Partial<Pick<Course, 'title' | 'instructor' | 'category' | 'level' | 'duration' | 'rating' | 'enrolled' | 'progress' | 'saved' | 'thumbnail'>>
  ): Promise<Course> {
    const response = await apiClient.put(`/companies/${companyId}/courses/${courseId}`, data);
    return response.data.data;
  }

  async deleteCourse(companyId: string, courseId: string): Promise<void> {
    await apiClient.delete(`/companies/${companyId}/courses/${courseId}`);
  }
}

export const learningService = new LearningService();
