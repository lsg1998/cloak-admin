/**
 * 用户行为追踪 API
 */
import http from "../index";

// 用户行为摘要
export interface UserBehaviorSummary {
  id: number;
  productId: string;
  ip: string;
  visitDate: string;
  sessionId: string;
  enterTime: string;
  exitTime: string;
  duration: number;
  durationText: string;
  visitCount: number;
  exitType: string;
  orderId?: string;
  isConverted: boolean;
  scrollDepth: number;
  clickCount: number;
  formFilled: boolean;
  provinceSelected?: string;
  citySelected?: string;
  deviceType?: string;
  createdAt: string;
}

// 操作记录
export interface UserAction {
  sequence: number;
  type: string;
  typeName: string;
  target?: string;
  value?: string;
  description: string;
  time: string;
  timeShort: string;
  detail?: any;
}

// 用户行为时间线
export interface UserBehaviorTimeline {
  source: "redis" | "mysql";
  sessionId: string;
  ip: string;
  productId: string;
  enterTime: string;
  exitTime: string;
  duration: number;
  durationText: string;
  actions: UserAction[];
}

// 查询参数
export interface BehaviorQueryParams {
  ip?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
}

// 时间线查询参数
export interface TimelineQueryParams {
  sessionId?: string;
  ip?: string;
  productId?: string;
  date?: string;
}

// 用户行为 API
export const userBehaviorApi = {
  // 获取用户行为摘要列表
  getSummary: (params: BehaviorQueryParams) => {
    return http.get<{ list: UserBehaviorSummary[]; total: number }>("/admin/user-behavior/summary", params);
  },

  // 获取用户行为时间线（详细）
  getTimeline: (params: TimelineQueryParams) => {
    return http.get<UserBehaviorTimeline>("/admin/user-behavior/timeline", params);
  },

  // 手动从Redis获取最新数据
  fetchFromRedis: (ip: string) => {
    return http.get<UserBehaviorSummary>("/admin/user-behavior/fetch-from-redis", { ip });
  }
};
