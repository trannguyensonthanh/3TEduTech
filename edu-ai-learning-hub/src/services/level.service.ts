// src/services/level.service.ts
import apiHelper from './apiHelper';

// export interface Level {
//   LevelID: number;
//   LevelName: string;
//   CreatedAt: string;
//   UpdatedAt: string;
// }
export interface Level {
  levelId: number;
  levelName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LevelListData {
  levels: Level[];
}

export const getLevels = async (): Promise<LevelListData> => {
  return apiHelper.get('/levels');
};

export const createLevel = async (data: {
  levelName: string;
}): Promise<Level> => {
  return apiHelper.post('/levels', data);
};

export const getLevelById = async (levelId: number): Promise<Level> => {
  return apiHelper.get(`/levels/${levelId}`);
};

export const updateLevel = async (
  levelId: number,
  data: { levelName: string }
): Promise<Level> => {
  return apiHelper.patch(`/levels/${levelId}`, data);
};

export const deleteLevel = async (levelId: number): Promise<void> => {
  await apiHelper.delete(`/levels/${levelId}`);
};
