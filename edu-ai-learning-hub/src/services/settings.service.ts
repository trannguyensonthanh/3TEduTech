// src/services/settings.service.ts
import apiHelper from './apiHelper';

export interface SettingValue {
  value: string;
  description?: string | null;
  isEditable: boolean;
  lastUpdated: string; // ISO Date string
}

export interface SettingsResponse {
  [key: string]: SettingValue;
}

export interface UpdateSettingData {
  value: string;
}

/** Admin: Lấy tất cả settings */
export const getAllSettings = async (): Promise<SettingsResponse> => {
  return apiHelper.get('/settings');
};

/** Admin: Cập nhật một setting */
export const updateSetting = async (
  settingKey: string,
  data: UpdateSettingData
): Promise<SettingValue> => {
  // API trả về setting đã cập nhật
  const updatedSettingRecord = await apiHelper.patch(
    `/settings/${settingKey}`,
    data
  );
  // Trả về cấu trúc giống như trong SettingsResponse
  return {
    value: updatedSettingRecord.SettingValue,
    description: updatedSettingRecord.Description,
    isEditable: updatedSettingRecord.IsEditableByAdmin,
    lastUpdated: updatedSettingRecord.LastUpdated,
  };
};
