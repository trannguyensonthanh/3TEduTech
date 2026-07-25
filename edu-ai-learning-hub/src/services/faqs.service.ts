import apiHelper from './apiHelper';

export interface FAQ {
  faqID: number;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export const FaqService = {
  getAll: async () => {
    return apiHelper.get<FAQ[]>('/faqs');
  },
  getById: async (id: number) => {
    return apiHelper.get<FAQ>(`/faqs/${id}`);
  },
  create: async (data: Partial<FAQ>) => {
    return apiHelper.post<FAQ>('/faqs', data);
  },
  update: async (id: number, data: Partial<FAQ>) => {
    return apiHelper.put<FAQ>(`/faqs/${id}`, data);
  },
  delete: async (id: number) => {
    return apiHelper.delete(`/faqs/${id}`);
  },
  uploadPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiHelper.post<{ data: { text: string; fileName: string } }>('/faqs/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
