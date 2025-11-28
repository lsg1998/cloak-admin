import { Upload } from "@/api/interface/index";
import http from "@/api";

/**
 * @name 文件上传模块
 */
// 图片上传
export const uploadImg = (params: FormData) => {
  return http.post<Upload.ResFileUrl>("/admin/upload/image", params, { cancel: false });
};

// Base64图片上传
export const uploadBase64Img = (params: { base64: string }) => {
  return http.post<Upload.ResFileUrl>("/admin/upload/base64", params);
};

// 视频上传
export const uploadVideo = (params: FormData) => {
  return http.post<Upload.ResFileUrl>("/admin/upload/video", params, { cancel: false });
};

// 删除文件
export const deleteFile = (params: { file_name: string }) => {
  return http.delete<Upload.ResFileUrl>("/admin/upload/file", params);
};
