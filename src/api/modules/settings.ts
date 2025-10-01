import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

// 网站设置数据结构
export interface WebsiteSetting {
  value: any;
  description: string;
  type: string;
}

export interface WebsiteSettings {
  [key: string]: WebsiteSetting;
}

// 单个设置数据结构
export interface Setting {
  key: string;
  value: any;
  description: string;
  type: string;
}

// 获取网站设置
export const getWebsiteSettingsApi = () => {
  return http.get<WebsiteSettings>(PORT1 + `/settings/website`);
};

// 更新网站设置
export const updateWebsiteSettingsApi = (data: Record<string, any>) => {
  return http.put(PORT1 + `/settings/website`, data);
};

// 获取单个设置
export const getSettingApi = (key: string) => {
  return http.get<Setting>(PORT1 + `/settings/${key}`);
};

// 更新单个设置
export const updateSettingApi = (key: string, data: { value: any }) => {
  return http.put(PORT1 + `/settings/${key}`, data);
};

// 重置网站设置为默认值
export const resetWebsiteSettingsApi = () => {
  return http.post(PORT1 + `/settings/reset`);
};

// 上传网站Logo
export const uploadLogoApi = (file: File) => {
  const formData = new FormData();
  formData.append("logo", file);
  return http.post(PORT1 + `/settings/upload-logo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
