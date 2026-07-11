// src/services/skill.service.ts
import apiHelper from './apiHelper';

export interface Skill {
  skillId: number;
  skillName: string;
  description?: string | null;
  createdAt?: string; // Optional depending on API response
  updatedAt?: string; // Optional
}

export interface SkillListData {
  skills: Skill[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface SkillQueryParams {
  page?: number;
  limit?: number; // 0 = all
  searchTerm?: string;
}

export interface CreateSkillData {
  skillName: string;
  description?: string;
}

export interface UpdateSkillData {
  skillName?: string;
  description?: string;
}

// --- Public/User APIs ---
//hàm này sẽ lấy danh sách kỹ năng từ API
export const getSkills = async (
  params?: SkillQueryParams
): Promise<SkillListData> => {
  return apiHelper.get('/skills', undefined, params);
};

// --- Admin APIs ---

export const createSkill = async (data: CreateSkillData): Promise<Skill> => {
  return apiHelper.post('/skills', data);
};

export const getSkillById = async (skillId: number): Promise<Skill> => {
  return apiHelper.get(`/skills/${skillId}`);
};

export const updateSkill = async (
  skillId: number,
  data: UpdateSkillData
): Promise<Skill> => {
  return apiHelper.patch(`/skills/${skillId}`, data);
};

export const deleteSkill = async (skillId: number): Promise<void> => {
  await apiHelper.delete(`/skills/${skillId}`);
};
