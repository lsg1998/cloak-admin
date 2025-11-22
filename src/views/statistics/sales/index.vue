<template>
  <div class="sales-statistics">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>商品销售统计</h2>
      <p>分析商品销量、国家分布、销售趋势等数据</p>
    </div>

    <!-- 时间筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="loadData"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="商品类型">
          <el-select v-model="filterForm.productType" placeholder="请选择类型" clearable style="width: 120px" @change="loadData">
            <el-option label="全部" value="" />
            <el-option label="正品" value="original" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-select v-model="filterForm.country" placeholder="请选择国家" clearable style="width: 150px" @change="loadData">
            <el-option label="全部国家" value="" />
            <el-option v-for="country in countryList" :key="country.code" :label="country.name" :value="country.code" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 概览统计 -->
    <div class="overview-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><ShoppingCart /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewStats.totalOrders }}</div>
                <div class="stat-label">总订单数</div>
                <div class="stat-sub">{{ overviewStats.totalQuantity }} 件商品</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon revenue">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">¥{{ formatNumber(overviewStats.totalRevenue) }}</div>
                <div class="stat-label">总销售额</div>
                <div class="stat-sub">均价: ¥{{ overviewStats.avgOrderValue }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon products">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewStats.totalProducts }}</div>
                <div class="stat-label">在售商品</div>
                <div class="stat-sub">{{ overviewStats.activeProducts }} 个有销量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon countries">
                <el-icon><Location /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewStats.totalCountries }}</div>
                <div class="stat-label">覆盖国家</div>
                <div class="stat-sub">{{ overviewStats.topCountry }} 销量最高</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据展示区域 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 商品销量排行 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">商品销量排行 TOP 10</span>
              <el-radio-group v-model="productRankType" size="small" @change="loadData">
                <el-radio-button label="quantity">按数量</el-radio-button>
                <el-radio-button label="amount">按金额</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-table :data="productRanking" v-loading="loading" max-height="500">
            <el-table-column label="排名" width="60" align="center">
              <template #default="{ $index }">
                <el-tag v-if="$index === 0" type="danger" size="small">1</el-tag>
                <el-tag v-else-if="$index === 1" type="warning" size="small">2</el-tag>
                <el-tag v-else-if="$index === 2" type="success" size="small">3</el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="商品" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="product-cell">
                  <el-avatar :size="40" v-if="row.image">
                    <img :src="row.image" style="width: 100%; height: 100%; object-fit: cover" />
                  </el-avatar>
                  <el-avatar :size="40" v-else>
                    <el-icon><Box /></el-icon>
                  </el-avatar>
                  <div class="product-info">
                    <div class="product-title">{{ row.title }}</div>
                    <div class="product-id">ID: {{ row.product_id }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="销量" width="100" align="right">
              <template #default="{ row }">
                <span class="quantity">{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销售额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ formatNumber(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="占比" width="100">
              <template #default="{ row }">
                <el-progress :percentage="row.percentage" :stroke-width="8" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 国家销量分布 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">国家销量分布 TOP 10</span>
              <el-radio-group v-model="countryRankType" size="small" @change="loadData">
                <el-radio-button label="quantity">按数量</el-radio-button>
                <el-radio-button label="amount">按金额</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-table :data="countryRanking" v-loading="loading" max-height="500">
            <el-table-column label="排名" width="60" align="center">
              <template #default="{ $index }">
                <el-tag v-if="$index === 0" type="danger" size="small">1</el-tag>
                <el-tag v-else-if="$index === 1" type="warning" size="small">2</el-tag>
                <el-tag v-else-if="$index === 2" type="success" size="small">3</el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="国家" min-width="120">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.country_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="订单数" width="100" align="right">
              <template #default="{ row }">
                <span>{{ row.orders }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销量" width="100" align="right">
              <template #default="{ row }">
                <span class="quantity">{{ row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="销售额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ formatNumber(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="占比" width="100">
              <template #default="{ row }">
                <el-progress :percentage="row.percentage" :stroke-width="8" color="#67c23a" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 商品-国家交叉分析 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span class="card-title">商品国家销售明细</span>
          <el-input v-model="detailSearch" placeholder="搜索商品名称" clearable style="width: 200px" @input="handleDetailSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>
      <el-table :data="displayDetailData" v-loading="loading" border style="width: 100%">
        <el-table-column label="商品" min-width="250" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-cell">
              <el-avatar :size="40" v-if="row.image">
                <img :src="row.image" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="40" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-info">
                <div class="product-title">{{ row.title }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总销量" width="100" align="right">
          <template #default="{ row }">
            <span class="total-quantity">{{ row.total_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总销售额" width="120" align="right">
          <template #default="{ row }">
            <span class="total-amount">¥{{ formatNumber(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-for="country in topCountries" :key="country.code" :label="country.name" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.countries[country.code]">{{ row.countries[country.code] }}</span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="其他国家" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.other_countries > 0" style="color: #909399">{{ row.other_countries }}</span>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="detailPagination.current"
        v-model:page-size="detailPagination.size"
        :total="detailPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="loadData"
        style="margin-top: 16px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts" name="SalesStatistics">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, Download, ShoppingCart, Money, Box, Location } from "@element-plus/icons-vue";
import http from "@/api";

// 筛选表单
const filterForm = reactive({
  dateRange: [] as string[],
  productType: "",
  country: ""
});

// 国家列表
const countryList = [
  { code: "JA", name: "日本" },
  { code: "JP", name: "日本" },
  { code: "ZH", name: "中国" },
  { code: "CN", name: "中国" },
  { code: "EN", name: "英国" },
  { code: "SK", name: "斯洛伐克" },
  { code: "SI", name: "斯洛文尼亚" },
  { code: "PL", name: "波兰" },
  { code: "PT", name: "葡萄牙" },
  { code: "HU", name: "匈牙利" },
  { code: "ES", name: "西班牙" },
  { code: "IT", name: "意大利" },
  { code: "CZ", name: "捷克" },
  { code: "LT", name: "立陶宛" },
  { code: "LV", name: "拉脱维亚" },
  { code: "HR", name: "克罗地亚" },
  { code: "DE", name: "德国" },
  { code: "AT", name: "奥地利" },
  { code: "RO", name: "罗马尼亚" },
  { code: "FR", name: "法国" },
  { code: "BE", name: "比利时" },
  { code: "NL", name: "荷兰" },
  { code: "GR", name: "希腊" },
  { code: "BG", name: "保加利亚" },
  { code: "SE", name: "瑞典" },
  { code: "FI", name: "芬兰" },
  { code: "DK", name: "丹麦" },
  { code: "NO", name: "挪威" },
  { code: "IE", name: "爱尔兰" },
  { code: "CH", name: "瑞士" },
  { code: "EE", name: "爱沙尼亚" },
  { code: "RS", name: "塞尔维亚" },
  { code: "BA", name: "波黑" },
  { code: "ME", name: "黑山" },
  { code: "MK", name: "北马其顿" },
  { code: "AL", name: "阿尔巴尼亚" }
];

// 加载状态
const loading = ref(false);

// 排序类型
const productRankType = ref("quantity");
const countryRankType = ref("quantity");

// 概览统计
const overviewStats = reactive({
  totalOrders: 0,
  totalQuantity: 0,
  totalRevenue: 0,
  avgOrderValue: 0,
  totalProducts: 0,
  activeProducts: 0,
  totalCountries: 0,
  topCountry: "-"
});

// 商品排行
const productRanking = ref<any[]>([]);

// 国家排行
const countryRanking = ref<any[]>([]);

// 详细数据
const detailData = ref<any[]>([]);
const detailSearch = ref("");
const detailPagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// 前5个国家（用于交叉表格）
const topCountries = computed(() => {
  return countryRanking.value.slice(0, 5).map(item => ({
    code: item.country_code,
    name: item.country_name
  }));
});

// 过滤后的详细数据
const filteredDetailData = computed(() => {
  let filtered = detailData.value;

  // 搜索过滤
  if (detailSearch.value) {
    const search = detailSearch.value.toLowerCase();
    filtered = filtered.filter(item => item.title.toLowerCase().includes(search));
  }

  return filtered;
});

// 显示的详细数据（分页+搜索）
const displayDetailData = computed(() => {
  const filtered = filteredDetailData.value;
  const start = (detailPagination.current - 1) * detailPagination.size;
  const end = start + detailPagination.size;
  return filtered.slice(start, end);
});

// 监听过滤数据变化，更新总数
watch(filteredDetailData, newData => {
  detailPagination.total = newData.length;
});

// 格式化数字
const formatNumber = (num: number) => {
  if (!num) return "0.00";
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// 详细数据搜索
const handleDetailSearch = () => {
  detailPagination.current = 1;
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: any = {};

    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.start_date = filterForm.dateRange[0];
      params.end_date = filterForm.dateRange[1];
    }
    if (filterForm.productType) {
      params.product_type = filterForm.productType;
    }
    if (filterForm.country) {
      params.country = filterForm.country;
    }

    // 调用后端API获取销售统计数据
    const { data } = await http.get("/admin/statistics/sales", params);

    // 更新概览统计
    Object.assign(overviewStats, data.overview);

    // 更新商品排行
    productRanking.value = data.product_ranking.map((item: any) => ({
      ...item,
      percentage: Math.round((item.quantity / data.overview.totalQuantity) * 100)
    }));

    // 更新国家排行
    countryRanking.value = data.country_ranking.map((item: any) => ({
      ...item,
      percentage: Math.round((item.quantity / data.overview.totalQuantity) * 100)
    }));

    // 更新详细数据
    detailData.value = data.detail_data;
    detailPagination.current = 1;
  } catch (error: any) {
    console.error("加载销售统计失败:", error);
    ElMessage.error(error.message || "加载销售统计数据失败");
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const handleReset = () => {
  filterForm.dateRange = [];
  filterForm.productType = "";
  filterForm.country = "";
  loadData();
};

// 导出数据
const handleExport = () => {
  ElMessage.success("导出功能开发中...");
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.sales-statistics {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin-bottom: 0;
}

/* 概览统计卡片 */
.overview-stats {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 28px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.products {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon.countries {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 商品单元格 */
.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-id {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 数值样式 */
.quantity {
  color: #409eff;
  font-weight: 500;
}

.amount {
  color: #67c23a;
  font-weight: 500;
}

.total-quantity {
  color: #e6a23c;
  font-weight: 600;
}

.total-amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
