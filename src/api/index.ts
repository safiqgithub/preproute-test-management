import axios from 'axios';

const BASE_URL = '/api';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (userId: string, password: string) =>
  api.post('/auth/login', { userId, password });

// Subjects
export const getSubjects = () => api.get('/subjects');

// Topics
export const getTopicsBySubject = (subjectId: string) =>
  api.get(`/topics/subject/${subjectId}`);

// Sub-topics
export const getSubTopicsByTopic = (topicId: string) =>
  api.get(`/sub-topics/topic/${topicId}`);

export const getSubTopicsByTopics = (topicIds: string[]) =>
  api.post('/sub-topics/multi-topics', { topicIds });

// Tests
export const getAllTests = () => api.get('/tests');
export const getTestById = (id: string) => api.get(`/tests/${id}`);
export const createTest = (data: any) => api.post('/tests', data);
export const updateTest = (id: string, data: any) => api.put(`/tests/${id}`, data);
export const deleteTest = (id: string) => api.delete(`/tests/${id}`);

// Questions
export const createQuestionsBulk = (questions: any[]) =>
  api.post('/questions/bulk', { questions });

export const fetchBulkQuestions = (questionIds: string[]) =>
  api.post('/questions/fetchBulk', { question_ids: questionIds });

export default api;
