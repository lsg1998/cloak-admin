<template>
  <div class="visitor-ip-list">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="IP地址">
          <el-input
            v-model="searchForm.ip"
            placeholder="请输入IP地址"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="国家">
          <el-input
            v-model="searchForm.country"
            placeholder="请输入国家"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="城市">
          <el-input
            v-model="searchForm.city"
            placeholder="请输入城市"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息卡片 -->
    <el-row :gutter="20" class="statistics-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalIps }}</div>
            <div class="stat-label">总IP数</div>
          </div>
          <div class="stat-icon">
            <el-icon><Monitor /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayIps }}</div>
            <div class="stat-label">今日新增</div>
          </div>
          <div class="stat-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.countryStats.length }}</div>
            <div class="stat-label">涉及国家</div>
          </div>
          <div class="stat-icon">
            <el-icon><Location /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.cityStats.length }}</div>
            <div class="stat-label">涉及城市</div>
          </div>
          <div class="stat-icon">
            <el-icon><MapLocation /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">访客IP列表</div>
        <div class="table-actions">
          <el-button @click="loadStatistics">
            <el-icon><Refresh /></el-icon>
            刷新统计
          </el-button>
        </div>
      </div>

      <!-- IP列表 -->
      <div v-loading="loading" class="ip-list">
        <div
          v-for="(row, index) in tableData"
          :key="row.id"
          class="ip-item"
          :class="{ 'last-item': index === tableData.length - 1 }"
        >
          <div class="ip-header">
            <div class="ip-address">{{ row.ip_address }}</div>
            <div class="ip-actions">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </div>

          <div class="ip-content">
            <div class="ip-section">
              <div class="section-title">地址信息</div>
              <div class="address-info">
                <div class="address-line">
                  <span class="label">地址:</span>
                  <span class="value">
                    {{ getLocationString(row) || "-" }}
                  </span>
                </div>
                <div class="address-line">
                  <span class="label">时间:</span>
                  <span class="value">{{ formatDate(row.last_visit) }}</span>
                </div>
              </div>
            </div>

            <div class="ip-section">
              <div class="section-title">组织信息</div>
              <div class="organization-info">
                <div class="org-name">{{ row.organization || "-" }}</div>
                <div class="org-tags">
                  <el-tag v-if="isProxy(row)" size="small" type="info">代理</el-tag>
                  <el-tag v-if="isDataCenter(row)" size="small" type="warning">机房</el-tag>
                </div>
              </div>
            </div>

            <div class="ip-section">
              <div class="section-title">基础类型</div>
              <div class="basic-type">
                <div class="type-line">
                  <span class="label">类型:</span>
                  <el-tag :type="getTypeColor(row)" size="small">{{ getTypeName(row) }}</el-tag>
                </div>
                <div class="type-line">
                  <span class="label">设备:</span>
                  <span class="value">{{ getDeviceInfo(row) || "-" }}</span>
                </div>
                <div class="type-line">
                  <span class="label">系统:</span>
                  <span class="value">{{ getSystemInfo(row) || "-" }}</span>
                </div>
              </div>
            </div>

            <div class="ip-section">
              <div class="section-title">详细类型</div>
              <div class="detailed-type">
                <div class="type-line">
                  <span class="label">类型:</span>
                  <el-tag :type="getTypeColor(row)" size="small">{{ getTypeName(row) }}</el-tag>
                </div>
                <div class="type-line">
                  <span class="label">名称:</span>
                  <span class="value">{{ getBotName(row) || "-" }}</span>
                </div>
                <div class="type-line">
                  <span class="label">说明:</span>
                  <span class="value">{{ getBotDescription(row) || "-" }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="IP详情" width="600px" :close-on-click-modal="false">
      <div v-if="currentVisitorIp" class="ip-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="IP地址">{{ currentVisitorIp.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="国家">
            <span v-if="currentVisitorIp.country">{{ currentVisitorIp.country }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="国家代码">
            <span v-if="currentVisitorIp.country">{{ currentVisitorIp.country }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="地区">
            <span v-if="currentVisitorIp.region">{{ currentVisitorIp.region }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            <span v-if="currentVisitorIp.city">{{ currentVisitorIp.city }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="时区">
            <span v-if="currentVisitorIp.timezone">{{ currentVisitorIp.timezone }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="ISP">
            <span v-if="currentVisitorIp.organization">{{ currentVisitorIp.organization }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="主机名">
            <span v-if="currentVisitorIp.hostname">{{ currentVisitorIp.hostname }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="邮编">
            <span v-if="currentVisitorIp.postal_code">{{ currentVisitorIp.postal_code }}</span>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="来源页面">
            <div v-if="currentVisitorIp.referer" class="referer-info">
              <el-link :href="currentVisitorIp.referer" target="_blank" type="primary" size="small">
                {{ currentVisitorIp.referer }}
              </el-link>
            </div>
            <span v-else class="text-gray-400">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="访问次数">
            <el-tag type="info">{{ currentVisitorIp.visit_count }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="首次访问">{{ formatDate(currentVisitorIp.first_visit) }}</el-descriptions-item>
          <el-descriptions-item label="最后访问">{{ formatDate(currentVisitorIp.last_visit) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentVisitorIp.location" class="location-info">
          <h4>地理位置</h4>
          <p>坐标: {{ currentVisitorIp.location }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Monitor, TrendCharts, Location, MapLocation, Refresh } from "@element-plus/icons-vue";
import { visitorIpApi, type VisitorIp, type IpStatistics } from "@/api/modules/visitorIp";

// 响应式数据
const loading = ref(false);
const detailDialogVisible = ref(false);
const currentVisitorIp = ref<VisitorIp | null>(null);

// 搜索表单
const searchForm = reactive({
  ip: "",
  country: "",
  city: ""
});

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<VisitorIp[]>([]);
// const selectedRows = ref<VisitorIp[]>([]);

// 统计数据
const statistics = ref<IpStatistics>({
  totalIps: 0,
  todayIps: 0,
  countryStats: [],
  cityStats: []
});

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取地理位置字符串
const getLocationString = (row: VisitorIp) => {
  const parts = [];
  if (row.country) parts.push(row.country);
  if (row.region) parts.push(row.region);
  if (row.city) parts.push(row.city);
  return parts.length > 0 ? parts.join(" - ") : null;
};

// 判断是否为代理
const isProxy = (row: VisitorIp) => {
  const proxyKeywords = ["proxy", "vpn", "tor", "anonymizer"];
  const org = (row.organization || "").toLowerCase();
  return proxyKeywords.some(keyword => org.includes(keyword));
};

// 判断是否为数据中心
const isDataCenter = (row: VisitorIp) => {
  const datacenterKeywords = [
    "amazon",
    "google",
    "microsoft",
    "cloudflare",
    "digitalocean",
    "linode",
    "vultr",
    "aws",
    "gcp",
    "azure"
  ];
  const org = (row.organization || "").toLowerCase();
  return datacenterKeywords.some(keyword => org.includes(keyword));
};

// 获取类型名称
const getTypeName = (row: VisitorIp) => {
  if (isBot(row)) return "爬虫";
  if (isProxy(row)) return "代理";
  return "访客";
};

// 获取类型颜色
const getTypeColor = (row: VisitorIp) => {
  if (isBot(row)) return "primary";
  if (isProxy(row)) return "warning";
  return "success";
};

// 判断是否为爬虫
const isBot = (row: VisitorIp) => {
  const botKeywords = ["bot", "crawler", "spider", "scraper", "googlebot", "bingbot", "facebook", "twitter"];
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();
  return botKeywords.some(keyword => userAgent.includes(keyword) || org.includes(keyword));
};

// 获取设备信息
const getDeviceInfo = (row: VisitorIp) => {
  const userAgent = row.user_agent || "";
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Desktop")) return "Desktop";
  return null;
};

// 获取系统信息
const getSystemInfo = (row: VisitorIp) => {
  const userAgent = row.user_agent || "";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS")) return "iOS";
  return null;
};

// 获取爬虫名称
const getBotName = (row: VisitorIp) => {
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();

  if (userAgent.includes("googlebot") || org.includes("google")) return "Googlebot";
  if (userAgent.includes("bingbot") || org.includes("microsoft")) return "BingBot";
  if (userAgent.includes("facebook") || org.includes("facebook")) return "Facebook Crawler";
  if (userAgent.includes("twitter") || org.includes("twitter")) return "Twitter Bot";
  if (userAgent.includes("ahrefs") || org.includes("ahrefs")) return "aHrefs Bot";
  if (userAgent.includes("httpx")) return "httpx";
  if (userAgent.includes("barkrowler")) return "Barkrowler";
  if (isBot(row)) return "Generic Bot";
  return null;
};

// 获取爬虫说明
const getBotDescription = (row: VisitorIp) => {
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();

  if (userAgent.includes("googlebot") || org.includes("google")) return "搜索引擎蜘蛛";
  if (userAgent.includes("bingbot") || org.includes("microsoft")) return "搜索引擎蜘蛛";
  if (userAgent.includes("facebook") || org.includes("facebook")) return "社交媒体爬虫";
  if (userAgent.includes("twitter") || org.includes("twitter")) return "社交媒体爬虫";
  if (userAgent.includes("ahrefs") || org.includes("ahrefs")) return "SEO分析爬虫";
  if (isBot(row)) return "通用网络爬虫";
  return null;
};

// 获取访客IP列表
const getVisitorIps = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    };

    const response = await visitorIpApi.getVisitorIps(params);
    if (response.code === 200) {
      tableData.value = response.data.list;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error("获取访客IP列表失败:", error);
    ElMessage.error("获取访客IP列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const loadStatistics = async () => {
  try {
    const response = await visitorIpApi.getIpStatistics();
    if (response.code === 200) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    ElMessage.error("获取统计数据失败");
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  getVisitorIps();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    ip: "",
    country: "",
    city: ""
  });
  handleSearch();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
  getVisitorIps();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  getVisitorIps();
};

// 选择改变（暂时未使用，保留以备后用）
// const handleSelectionChange = (selection: VisitorIp[]) => {
//   selectedRows.value = selection;
// };

// 查看详情
const handleView = async (row: VisitorIp) => {
  try {
    const response = await visitorIpApi.getVisitorIp(row.ip_address);
    if (response.code === 200) {
      currentVisitorIp.value = response.data;
      detailDialogVisible.value = true;
    }
  } catch (error) {
    console.error("获取IP详情失败:", error);
    ElMessage.error("获取IP详情失败");
  }
};

// 删除
const handleDelete = async (row: VisitorIp) => {
  try {
    await ElMessageBox.confirm(`确定要删除IP"${row.ip_address}"的记录吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const response = await visitorIpApi.deleteVisitorIp(row.ip_address);
    if (response.code === 200) {
      ElMessage.success("删除成功");
      getVisitorIps();
      loadStatistics();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除访客IP失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 组件挂载
onMounted(() => {
  getVisitorIps();
  loadStatistics();
});
</script>

<style scoped>
.visitor-ip-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card .stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #666;
}

.stat-card .stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  color: #409eff;
  opacity: 0.3;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.text-gray-400 {
  color: #9ca3af;
}

.ip-detail {
  padding: 10px 0;
}

.location-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.location-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.location-info p {
  margin: 5px 0;
  color: #666;
}

.referer-info {
  word-break: break-all;
}

/* IP列表样式 */
.ip-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.ip-item {
  border-bottom: 1px solid #e4e7ed;
  padding: 20px;
  transition: background-color 0.3s;
}

.ip-item:hover {
  background-color: #f8f9fa;
}

.ip-item.last-item {
  border-bottom: none;
}

.ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ip-address {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  font-family: "Courier New", monospace;
}

.ip-actions {
  display: flex;
  gap: 8px;
}

.ip-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
}

.ip-section {
  min-height: 120px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}

.address-info,
.organization-info,
.basic-type,
.detailed-type {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-line,
.type-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: #909399;
  min-width: 40px;
}

.value {
  font-size: 13px;
  color: #303133;
  flex: 1;
}

.org-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 8px;
}

.org-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .ip-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .ip-content {
    grid-template-columns: 1fr;
  }

  .ip-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .ip-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
