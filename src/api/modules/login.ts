import { Login } from "@/api/interface/index";
import authMenuList from "@/assets/json/authMenuList.json";
import authButtonList from "@/assets/json/authButtonList.json";
import http from "@/api";

/**
 * @name 登录模块
 */
// 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
  return http.post<Login.ResLogin>(`/admin/auth/login`, params, { loading: false }); // 正常 post json 请求  ==>  application/json
};

// 获取用户信息
export const getUserInfo = () => {
  return http.get<Login.ResUserInfo>(`/admin/auth/userinfo`, {}, { loading: false });
};

// 刷新token
export const refreshToken = () => {
  return http.post<Login.ResRefreshToken>(`/admin/auth/refresh`);
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  return http.get<Menu.MenuOptions[]>(`/admin/menu/list`, {}, { loading: false });
  // 如果想让菜单变为本地数据，注释上一行代码，并引入本地 authMenuList.json 数据
  return authMenuList;
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  return http.get<Login.ResAuthButtons>(`/admin/auth/buttons`, {}, { loading: false });
  // 如果想让按钮权限变为本地数据，注释上一行代码，并引入本地 authButtonList.json 数据
  return authButtonList;
};

// 用户退出登录
export const logoutApi = () => {
  return http.post(`/admin/auth/logout`);
};
