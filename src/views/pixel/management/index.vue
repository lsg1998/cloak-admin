<template>
  <div class="pixel-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>像素配置管理</h2>
      <p>管理所有商品的像素跟踪配置，支持Google Ads、Facebook、TikTok等平台</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon google">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.totalProducts }}</div>
                <div class="stat-label">总商品数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon enabled">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.enabledProducts }}</div>
                <div class="stat-label">已启用像素</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon google">
                <el-icon><Platform /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.googleAdsCount }}</div>
                <div class="stat-label">Google Ads</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon facebook">
                <el-icon><Share /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.facebookCount }}</div>
                <div class="stat-label">Facebook</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="商品标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入商品标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="像素状态">
          <el-select v-model="searchForm.pixelStatus" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="已启用" value="enabled" />
            <el-option label="未启用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="平台类型">
          <el-select v-model="searchForm.platform" placeholder="请选择平台" clearable style="width: 120px">
            <el-option label="Google Ads" value="google_ads" />
            <el-option label="Facebook" value="facebook" />
            <el-option label="TikTok" value="tiktok" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家筛选">
          <el-select v-model="searchForm.country" placeholder="请选择国家" clearable style="width: 200px">
            <!-- 有商品的国家 -->
            <el-option
              v-for="country in sortedCountryOptions.withProducts"
              :key="country.code"
              :label="`${country.name} (${country.count}条)`"
              :value="country.code"
            />
            <!-- 分隔线 -->
            <el-option v-if="sortedCountryOptions.withProducts.length > 0" disabled value="">
              <span style="color: #dcdfe6">──────────</span>
            </el-option>
            <!-- 无商品的国家 -->
            <el-option
              v-for="country in sortedCountryOptions.withoutProducts"
              :key="country.code"
              :label="country.name"
              :value="country.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">
          <span>像素配置列表</span>
          <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
        </div>
        <div class="table-actions">
          <el-button type="primary" @click="handleBatchConfig">
            <el-icon><Setting /></el-icon>
            批量配置
          </el-button>
          <el-button size="small" @click="loadData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#606266' }"
      >
        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar v-if="row.image_urls && row.image_urls[0]" :size="40" :src="row.image_urls[0]" shape="square" />
              <el-avatar v-else :size="40" shape="square">
                <el-icon><Picture /></el-icon>
              </el-avatar>
              <div class="product-details">
                <div class="product-title">{{ row.title }}</div>
                <div class="product-id">ID: {{ row.id }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="像素状态" width="100" align="center">
          <template #default>
            <el-tag :type="globalPixelConfig?.enabled ? 'success' : 'info'" size="small">
              {{ globalPixelConfig?.enabled ? "已启用" : "未启用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Google Ads" width="120" align="center">
          <template #default>
            <div v-if="isGoogleAdsEnabled" class="pixel-status">
              <el-icon class="status-icon success"><Check /></el-icon>
              <span class="status-text">已配置</span>
            </div>
            <div v-else class="pixel-status">
              <el-icon class="status-icon disabled"><Close /></el-icon>
              <span class="status-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Facebook" width="120" align="center">
          <template #default>
            <div v-if="globalPixelConfig?.facebook_enabled" class="pixel-status">
              <el-icon class="status-icon success"><Check /></el-icon>
              <span class="status-text">已配置</span>
            </div>
            <div v-else class="pixel-status">
              <el-icon class="status-icon disabled"><Close /></el-icon>
              <span class="status-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="TikTok" width="120" align="center">
          <template #default>
            <div v-if="globalPixelConfig?.tiktok_enabled" class="pixel-status">
              <el-icon class="status-icon success"><Check /></el-icon>
              <span class="status-text">已配置</span>
            </div>
            <div v-else class="pixel-status">
              <el-icon class="status-icon disabled"><Close /></el-icon>
              <span class="status-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="自定义像素" width="120" align="center">
          <template #default>
            <el-tag v-if="globalPixelConfig?.custom_pixels" type="warning" size="small">已配置</el-tag>
            <span v-else style="color: #999999">--</span>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ row.updated_at }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleConfig(row)">
                <el-icon><Setting /></el-icon>
                配置
              </el-button>
              <el-button size="small" type="success" link @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button size="small" type="warning" link @click="handleTest(row)">
                <el-icon><Connection /></el-icon>
                测试
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 像素配置对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      :title="`像素配置 - ${currentProduct?.title}`"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- 这里可以复用商品列表中的像素配置组件 -->
      <div class="pixel-config-content">
        <el-alert title="像素配置说明" type="info" :closable="false" show-icon>
          <template #default>
            <p>• Google Ads: 需要转化ID和转化标签</p>
            <p>• Facebook: 需要像素ID</p>
            <p>• TikTok: 需要像素ID</p>
            <p>• 自定义: 可以添加任意像素代码</p>
          </template>
        </el-alert>

        <div class="config-actions">
          <el-button type="primary" @click="openProductPixelConfig">
            <el-icon><Setting /></el-icon>
            打开详细配置
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PixelManagement">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Refresh,
  Setting,
  View,
  Monitor,
  Check,
  Close,
  Calendar,
  Picture,
  Connection,
  Platform,
  Share
} from "@element-plus/icons-vue";
import { getProductListApi, type Product } from "@/api/modules/product";
import { getGlobalPixelConfigApi } from "@/api/modules/pixel";

// 响应式数据
const loading = ref(false);
const configDialogVisible = ref(false);
const currentProduct = ref<Product | null>(null);
const globalPixelConfig = ref<any>(null);

// 统计数据
const stats = reactive({
  totalProducts: 0,
  enabledProducts: 0,
  googleAdsCount: 0,
  facebookCount: 0
});

// 搜索表单
const searchForm = reactive({
  title: "",
  pixelStatus: "",
  platform: "",
  country: "" // 国家筛选
});

// 分页数据
const pagination = reactive({
  current: 1,
  size: 50, // 默认显示50条
  total: 0
});

// 表格数据
const tableData = ref<Product[]>([]);

// 国家列表
const allCountries = [
  { code: "SK", name: "斯洛伐克" },
  { code: "CZ", name: "捷克" },
  { code: "PL", name: "波兰" },
  { code: "HU", name: "匈牙利" },
  { code: "DE", name: "德国" },
  { code: "AT", name: "奥地利" },
  { code: "RO", name: "罗马尼亚" },
  { code: "JP", name: "日本" }
];

// 计算当前页面每个国家的商品数量
const countryProductCounts = computed(() => {
  const counts: { [key: string]: number } = {};
  tableData.value.forEach(product => {
    if (product.country) {
      const countryCode = product.country.toUpperCase();
      counts[countryCode] = (counts[countryCode] || 0) + 1;
    }
  });
  return counts;
});

// 排序后的国家选项
const sortedCountryOptions = computed(() => {
  const counts = countryProductCounts.value;
  const withProducts: { code: string; name: string; count: number }[] = [];
  const withoutProducts: { code: string; name: string }[] = [];

  allCountries.forEach(country => {
    const count = counts[country.code] || 0;
    if (count > 0) {
      withProducts.push({ ...country, count });
    } else {
      withoutProducts.push(country);
    }
  });

  withProducts.sort((a, b) => b.count - a.count);

  return {
    withProducts,
    withoutProducts
  };
});

// 计算属性：判断Google Ads是否启用
const isGoogleAdsEnabled = computed(() => {
  if (!globalPixelConfig.value?.google_ads_accounts) return false;
  try {
    const accounts = JSON.parse(globalPixelConfig.value.google_ads_accounts);
    return accounts.some((account: any) => account.enabled);
  } catch (e) {
    return false;
  }
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.title = "";
  searchForm.pixelStatus = "";
  searchForm.platform = "";
  searchForm.country = "";
  pagination.current = 1;
  loadData();
};

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadData();
};

const handleCurrentChange = (page: number) => {
  pagination.current = page;
  loadData();
};

// 配置像素
const handleConfig = (row: Product) => {
  currentProduct.value = row;
  configDialogVisible.value = true;
};

// 查看详情
const handleView = (row: Product) => {
  ElMessage.info(`查看商品 ${row.title} 的像素配置详情`);
};

// 测试像素
const handleTest = (row: Product) => {
  ElMessageBox.confirm(`确定要测试商品 "${row.title}" 的像素配置吗？`, "测试确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    ElMessage.success("像素测试已启动，请查看控制台输出");
  });
};

// 批量配置
const handleBatchConfig = () => {
  ElMessage.info("批量配置功能开发中...");
};

// 打开商品像素配置
const openProductPixelConfig = () => {
  if (currentProduct.value) {
    // 跳转到商品列表页面并打开像素配置
    window.open(`/product/list?pixelConfig=${currentProduct.value.id}`, "_blank");
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    // 并行获取商品列表和全局像素配置（只获取正品，过滤掉仿品）
    const [productsResponse, pixelResponse] = await Promise.all([
      getProductListApi({
        page: pagination.current,
        size: pagination.size,
        title: searchForm.title || undefined,
        country: searchForm.country || undefined,
        product_type: "original" // 只获取正品商品
      }),
      getGlobalPixelConfigApi()
    ]);

    tableData.value = productsResponse.data.list;
    pagination.total = productsResponse.data.total;
    globalPixelConfig.value = pixelResponse.data;

    // 计算统计数据
    calculateStats(productsResponse.data.list);
  } catch (error) {
    ElMessage.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

// 计算统计数据
const calculateStats = (products: Product[]) => {
  stats.totalProducts = products.length;

  // 基于全局像素配置计算统计数据
  if (globalPixelConfig.value) {
    const config = globalPixelConfig.value;
    stats.enabledProducts = config.enabled ? products.length : 0;

    // 解析Google Ads账户配置
    let googleAdsEnabled = false;
    if (config.google_ads_accounts) {
      try {
        const accounts = JSON.parse(config.google_ads_accounts);
        googleAdsEnabled = accounts.some((account: any) => account.enabled);
      } catch (e) {
        console.error("解析Google Ads账户配置失败:", e);
      }
    }

    stats.googleAdsCount = googleAdsEnabled ? products.length : 0;
    stats.facebookCount = config.facebook_enabled ? products.length : 0;
  } else {
    // 如果没有全局配置，使用商品级别的配置
    stats.enabledProducts = products.filter(p => p.pixel_enabled).length;
    stats.googleAdsCount = products.filter(p => p.pixel_config?.google_ads?.enabled).length;
    stats.facebookCount = products.filter(p => p.pixel_config?.facebook?.enabled).length;
  }
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.pixel-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.google {
  background: linear-gradient(135deg, #4285f4, #34a853);
}

.stat-icon.enabled {
  background: linear-gradient(135deg, #13ce66, #00d4aa);
}

.stat-icon.facebook {
  background: linear-gradient(135deg, #1877f2, #42a5f5);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.search-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-details {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-weight: 500;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pixel-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.disabled {
  color: #c0c4cc;
}

.status-text {
  font-size: 12px;
  color: #606266;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.pixel-config-content {
  padding: 20px 0;
}

.config-actions {
  margin-top: 20px;
  text-align: center;
}
</style>
