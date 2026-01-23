<template>
  <div class="pixel-config">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>全局像素配置</h2>
      <p>配置网站的像素跟踪代码，支持多个 Google Ads 账户，可为每个账户指定商品范围</p>
    </div>

    <!-- Google Ads 账户管理 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">Google Ads 账户管理</span>
          <el-button type="primary" @click="handleAddAccount">
            <el-icon><Plus /></el-icon>
            添加账户
          </el-button>
        </div>
      </template>

      <el-table :data="displayedGoogleAdsAccounts" stripe border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="账户名称" min-width="150">
          <template #default="{ row }">
            <el-tag>{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="conversion_id" label="转化ID" min-width="150">
          <template #default="{ row }">
            <el-text type="primary">AW-{{ row.conversion_id }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="conversion_label" label="转化标签" min-width="180">
          <template #default="{ row }">
            <el-text type="info">{{ row.conversion_label }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="product_ids" label="应用商品" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="!row.product_ids || row.product_ids.length === 0" type="success">全部商品</el-tag>
            <el-tag v-else type="warning">指定 {{ row.product_ids.length }} 个商品</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="em_params" label="em参数" min-width="180">
          <template #default="{ row }">
            <div v-if="row.em_params && row.em_params.length > 0" style="display: flex; flex-wrap: wrap; gap: 4px">
              <el-tag v-for="em in row.em_params" :key="em" type="primary" size="small">{{ em }}</el-tag>
            </div>
            <el-tag v-else type="info" size="small">全部加载</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="handleStatusChange" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEditAccount(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDeleteAccount(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="displayedGoogleAdsAccounts.length === 0" description="暂无 Google Ads 账户，点击右上角添加" />
    </el-card>

    <!-- Facebook & TikTok 像素 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="config-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="platform-icon facebook"><Share /></el-icon>
              <span class="card-title">Facebook 像素</span>
            </div>
          </template>
          <el-form label-width="100px">
            <el-form-item label="启用">
              <el-switch v-model="config.facebook_enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="像素ID" v-if="config.facebook_enabled">
              <el-input v-model="config.facebook_pixel_id" placeholder="例如: 123456789012345" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="config-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="platform-icon tiktok"><VideoCamera /></el-icon>
              <span class="card-title">TikTok 像素</span>
            </div>
          </template>
          <el-form label-width="100px">
            <el-form-item label="启用">
              <el-switch v-model="config.tiktok_enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
            <el-form-item label="像素ID" v-if="config.tiktok_enabled">
              <el-input v-model="config.tiktok_pixel_id" placeholder="例如: C1234567890ABCDEF" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 自定义像素 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">自定义像素</span>
          <el-button type="primary" @click="addCustomPixel">
            <el-icon><Plus /></el-icon>
            添加自定义像素
          </el-button>
        </div>
      </template>

      <div v-for="(custom, index) in customPixels" :key="index" class="custom-pixel-item">
        <el-form label-width="100px">
          <el-form-item label="像素名称">
            <el-input v-model="custom.name" placeholder="例如: 第三方统计代码" />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch v-model="custom.enabled" />
          </el-form-item>
          <el-form-item label="像素代码">
            <el-input v-model="custom.code" type="textarea" :rows="4" placeholder="粘贴像素代码..." />
          </el-form-item>
          <el-form-item>
            <el-button type="danger" @click="removeCustomPixel(index)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-empty v-if="customPixels.length === 0" description="暂无自定义像素" />
    </el-card>

    <!-- 保存按钮 -->
    <div class="action-bar">
      <el-button type="primary" size="large" @click="handleSave" :loading="saveLoading">
        <el-icon><Check /></el-icon>
        保存所有配置
      </el-button>
      <el-button size="large" @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>

    <!-- 添加/编辑 Google Ads 账户对话框 -->
    <el-dialog v-model="accountDialogVisible" :title="accountDialogTitle" width="700px">
      <el-form ref="accountFormRef" :model="accountForm" :rules="accountRules" label-width="120px">
        <el-form-item label="账户名称" prop="name">
          <el-input v-model="accountForm.name" placeholder="例如: 主投账户" />
        </el-form-item>
        <el-form-item label="转化ID" prop="conversion_id">
          <el-input v-model="accountForm.conversion_id" placeholder="例如: 17612844136">
            <template #prepend>AW-</template>
          </el-input>
          <div class="form-tip">在 Google Ads 后台创建转化操作后获取</div>
        </el-form-item>
        <el-form-item label="转化标签" prop="conversion_label">
          <el-input v-model="accountForm.conversion_label" placeholder="例如: REXpCP2e1aUbEOjYus5B" />
          <div class="form-tip">转化操作对应的标签代码</div>
        </el-form-item>
        <el-form-item label="应用商品">
          <el-input
            v-model="selectedProductsText"
            placeholder="点击选择商品（不选择则应用到全部商品）"
            readonly
            style="width: 100%; cursor: pointer"
            @click="openProductSelectDialog"
          >
            <template #suffix>
              <el-icon v-if="accountForm.product_ids.length > 0" @click.stop="clearSelectedProducts" style="cursor: pointer">
                <Close />
              </el-icon>
              <el-icon v-else><Search /></el-icon>
            </template>
          </el-input>
          <div v-if="accountForm.product_ids.length > 0" style="margin-top: 8px">
            <el-tag
              v-for="productId in accountForm.product_ids"
              :key="productId"
              closable
              @close="removeSelectedProduct(productId)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ getProductName(productId) }}
            </el-tag>
          </div>
          <div class="form-tip">不选择任何商品时，此像素将应用到全部商品页面</div>
        </el-form-item>
        <el-form-item label="em参数绑定">
          <el-select
            v-model="accountForm.em_params"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入em参数值（可多个）"
            style="width: 100%"
          >
            <el-option v-for="em in allEmParams" :key="em" :label="em" :value="em" />
          </el-select>
          <div class="form-tip">
            绑定em参数后，只有URL包含对应em参数时才会加载此像素<br />
            例如：绑定"account1"，则访问 ?em=account1 时加载此像素<br />
            不绑定则加载到所有页面（兼容旧逻辑）
          </div>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="accountForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAccount">确定</el-button>
      </template>
    </el-dialog>

    <!-- 商品选择弹窗 -->
    <el-dialog v-model="productSelectDialogVisible" title="选择商品" width="900px" :close-on-click-modal="false">
      <el-alert
        title="快速搜索"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
        description="输入商品标题即可快速搜索，支持按国家筛选"
      />

      <el-form :model="productSearchForm" inline style="margin-bottom: 16px">
        <el-form-item label="快速搜索">
          <el-input
            v-model="productSearchForm.title"
            placeholder="输入商品标题搜索"
            clearable
            style="width: 250px"
            @input="onSearchInput"
            @clear="resetProductSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="国家筛选">
          <el-select
            v-model="productSearchForm.country"
            placeholder="全部国家"
            clearable
            style="width: 180px"
            @change="searchProducts"
          >
            <el-option
              v-for="country in sortedCountryOptions.withProducts"
              :key="country.code"
              :label="`${country.name} (${country.count}条)`"
              :value="country.code"
            />
            <el-option v-if="sortedCountryOptions.withProducts.length > 0" disabled value="">
              <span style="color: #dcdfe6">──────────</span>
            </el-option>
            <el-option
              v-for="country in sortedCountryOptions.withoutProducts"
              :key="country.code"
              :label="country.name"
              :value="country.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetProductSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center">
        <div style="color: #606266; font-size: 14px">
          <el-icon><List /></el-icon>
          共找到 <el-text type="primary" style="font-weight: 600">{{ productDialogPagination.total }}</el-text> 个商品
          <span v-if="productSearchForm.title || productSearchForm.country" style="color: #909399"> （已筛选） </span>
        </div>
        <div>
          <el-button size="small" @click="selectAllCurrentPage">
            <el-icon><Select /></el-icon>
            全选当前页
          </el-button>
          <el-button size="small" @click="clearAllSelection">
            <el-icon><Close /></el-icon>
            清空选择
          </el-button>
        </div>
      </div>

      <el-table
        :data="productDialogList"
        v-loading="productDialogLoading"
        max-height="400px"
        @selection-change="handleProductSelectionChange"
        :row-key="row => row.id"
        ref="productTableRef"
      >
        <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column label="商品图片" width="80">
          <template #default="{ row }">
            <el-avatar :size="50" v-if="row.image_urls && row.image_urls[0]">
              <img :src="row.image_urls[0]" style="width: 100%; height: 100%; object-fit: cover" />
            </el-avatar>
            <el-avatar :size="50" v-else>
              <el-icon><Picture /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="商品标题" show-overflow-tooltip min-width="200" />
        <el-table-column label="国家" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.country" type="success" size="small">{{
              countryCodeMap[row.country.toUpperCase()] || row.country
            }}</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="sell_price" label="价格" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.sell_price">{{ row.sell_price }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === "active" ? "上架" : row.status === "inactive" ? "下架" : "草稿" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="productDialogPagination.current"
        v-model:page-size="productDialogPagination.size"
        :total="productDialogPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadProductDialog"
        @size-change="loadProductDialog"
        style="margin-top: 16px; justify-content: center"
      />

      <template #footer>
        <div style="text-align: left; margin-bottom: 12px">
          <el-text>已选择 {{ accountForm.product_ids.length }} 个商品</el-text>
        </div>
        <el-button @click="productSelectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProductSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="PixelConfig">
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Delete,
  Edit,
  Check,
  Refresh,
  Share,
  VideoCamera,
  Close,
  Search,
  Picture,
  List,
  Select
} from "@element-plus/icons-vue";
import { getGlobalPixelConfigApi, updateGlobalPixelConfigApi } from "@/api/modules/pixel";
import { getProductListApi } from "@/api/modules/product";

// 响应式数据
const saveLoading = ref(false);
const accountDialogVisible = ref(false);
const accountDialogTitle = ref("添加 Google Ads 账户");
const accountFormRef = ref();
const editingIndex = ref(-1);
const productLoading = ref(false);
const productList = ref<Array<{ id: string; title: string; country?: string }>>([]);

// 商品选择弹窗
const productSelectDialogVisible = ref(false);
const productDialogLoading = ref(false);
const productDialogList = ref<any[]>([]);
const selectedProductsText = ref("");
const productTableRef = ref();
const productSearchForm = reactive({
  title: "",
  country: ""
});
const productDialogPagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// Google Ads 账户列表
const googleAdsAccounts = ref<
  Array<{ name: string; conversion_id: string; conversion_label: string; enabled: boolean; product_ids: string[] }>
>([]);

// 显示的账户列表（倒序并限制最新50条）
const displayedGoogleAdsAccounts = computed(() => {
  const accounts = [...googleAdsAccounts.value];
  // 倒序显示（最新添加的在最前面）
  accounts.reverse();
  // 只显示最新的50条
  return accounts.slice(0, 50);
});

// 账户表单
const accountForm = reactive({
  name: "",
  conversion_id: "",
  conversion_label: "",
  enabled: true,
  product_ids: [] as string[],
  em_params: [] as string[]
});

// 所有em参数列表（用于下拉选择）
const allEmParams = ref<string[]>([]);

// 表单验证规则
const accountRules = {
  conversion_id: [
    { required: true, message: "请输入转化ID", trigger: "blur" },
    { pattern: /^\d+$/, message: "转化ID只能包含数字", trigger: "blur" }
  ],
  conversion_label: [{ required: true, message: "请输入转化标签", trigger: "blur" }]
};

// 其他平台配置
const config = reactive({
  facebook_enabled: 0,
  facebook_pixel_id: "",
  tiktok_enabled: 0,
  tiktok_pixel_id: ""
});

// 自定义像素
const customPixels = ref<Array<{ name: string; code: string; enabled: boolean }>>([]);

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

// 国家代码映射
const countryCodeMap: { [key: string]: string } = {
  SK: "斯洛伐克",
  CZ: "捷克",
  PL: "波兰",
  HU: "匈牙利",
  DE: "德国",
  AT: "奥地利",
  RO: "罗马尼亚",
  JP: "日本"
};

// 计算国家商品数量
const countryProductCounts = computed(() => {
  const counts: { [key: string]: number } = {};
  productDialogList.value.forEach(product => {
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

// 加载配置
const loadConfig = async () => {
  try {
    const { data } = await getGlobalPixelConfigApi();
    if (data) {
      // 加载 Google Ads 账户
      if (data.google_ads_accounts) {
        try {
          googleAdsAccounts.value =
            typeof data.google_ads_accounts === "string" ? JSON.parse(data.google_ads_accounts) : data.google_ads_accounts;

          // 收集所有em参数用于下拉选择
          const emSet = new Set<string>();
          googleAdsAccounts.value.forEach(account => {
            if (account.em_params && Array.isArray(account.em_params)) {
              account.em_params.forEach(em => emSet.add(em));
            }
          });
          allEmParams.value = Array.from(emSet);
        } catch (e) {
          googleAdsAccounts.value = [];
        }
      }

      // 加载 Facebook 配置
      config.facebook_enabled = data.facebook_enabled || false;
      config.facebook_pixel_id = data.facebook_pixel_id || "";

      // 加载 TikTok 配置
      config.tiktok_enabled = data.tiktok_enabled || false;
      config.tiktok_pixel_id = data.tiktok_pixel_id || "";

      // 加载自定义像素
      if (data.custom_pixels) {
        try {
          customPixels.value = typeof data.custom_pixels === "string" ? JSON.parse(data.custom_pixels) : data.custom_pixels;
        } catch (e) {
          customPixels.value = [];
        }
      }
    } else {
      // 如果没有配置，设置默认值
      config.facebook_enabled = false;
      config.facebook_pixel_id = "";
      config.tiktok_enabled = false;
      config.tiktok_pixel_id = "";
      customPixels.value = [];
      googleAdsAccounts.value = [];
    }
  } catch (error) {
    ElMessage.error("加载配置失败");
    console.error(error);
  }
};

// 添加账户
const handleAddAccount = () => {
  accountDialogTitle.value = "添加 Google Ads 账户";
  editingIndex.value = -1;
  Object.assign(accountForm, {
    name: "",
    conversion_id: "",
    conversion_label: "",
    enabled: true,
    product_ids: [],
    em_params: []
  });
  selectedProductsText.value = "";
  accountDialogVisible.value = true;
};

// 编辑账户
const handleEditAccount = (row: any) => {
  accountDialogTitle.value = "编辑 Google Ads 账户";
  // 在原始数组中查找真实索引（因为显示的是倒序数组）
  const realIndex = googleAdsAccounts.value.findIndex(
    account => account.conversion_id === row.conversion_id && account.conversion_label === row.conversion_label
  );
  editingIndex.value = realIndex;
  Object.assign(accountForm, {
    ...row,
    product_ids: row.product_ids || [],
    em_params: row.em_params || []
  });
  // 更新选中商品显示文本
  updateSelectedProductsText();
  accountDialogVisible.value = true;
};

// 保存账户
const handleSaveAccount = async () => {
  if (!accountFormRef.value) return;

  try {
    await accountFormRef.value.validate();

    const accountData = {
      name: accountForm.name,
      conversion_id: accountForm.conversion_id,
      conversion_label: accountForm.conversion_label,
      enabled: accountForm.enabled,
      product_ids: accountForm.product_ids || [],
      em_params: accountForm.em_params || []
    };

    if (editingIndex.value >= 0) {
      // 编辑
      googleAdsAccounts.value[editingIndex.value] = accountData;
    } else {
      // 添加
      googleAdsAccounts.value.push(accountData);
    }

    // 立即保存到后端
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });

    accountDialogVisible.value = false;
    ElMessage.success(editingIndex.value >= 0 ? "账户更新成功" : "账户添加成功");
  } catch (error) {
    console.error(error);
    ElMessage.error("保存失败，请重试");
  }
};

// 删除账户
const handleDeleteAccount = async (row: any) => {
  try {
    await ElMessageBox.confirm("确定要删除这个 Google Ads 账户吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    // 在原始数组中查找真实索引（因为显示的是倒序数组）
    const realIndex = googleAdsAccounts.value.findIndex(
      account => account.conversion_id === row.conversion_id && account.conversion_label === row.conversion_label
    );

    if (realIndex === -1) {
      ElMessage.error("找不到要删除的账户");
      return;
    }

    googleAdsAccounts.value.splice(realIndex, 1);

    // 立即保存到后端
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });

    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error(error);
      ElMessage.error("删除失败，请重试");
    }
  }
};

// 状态变更
const handleStatusChange = async () => {
  try {
    // 立即保存状态变更
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });
    ElMessage.success("状态已更新");
  } catch (error) {
    console.error(error);
    ElMessage.error("状态更新失败，请重试");
  }
};

// 添加自定义像素
const addCustomPixel = async () => {
  customPixels.value.push({
    name: "",
    code: "",
    enabled: true
  });

  try {
    // 立即保存
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });
    ElMessage.success("自定义像素已添加");
  } catch (error) {
    console.error(error);
    ElMessage.error("添加失败，请重试");
  }
};

// 删除自定义像素
const removeCustomPixel = async (index: number) => {
  customPixels.value.splice(index, 1);

  try {
    // 立即保存
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });
    ElMessage.success("自定义像素已删除");
  } catch (error) {
    console.error(error);
    ElMessage.error("删除失败，请重试");
  }
};

// 保存所有配置
const handleSave = async () => {
  saveLoading.value = true;
  try {
    await updateGlobalPixelConfigApi({
      google_ads_accounts: JSON.stringify(googleAdsAccounts.value),
      facebook_enabled: config.facebook_enabled,
      facebook_pixel_id: config.facebook_pixel_id,
      tiktok_enabled: config.tiktok_enabled,
      tiktok_pixel_id: config.tiktok_pixel_id,
      custom_pixels: JSON.stringify(customPixels.value)
    });
    ElMessage.success("配置保存成功，所有商品页面已生效");
  } catch (error) {
    ElMessage.error("保存配置失败");
    console.error(error);
  } finally {
    saveLoading.value = false;
  }
};

// 重置配置
const handleReset = () => {
  loadConfig();
  ElMessage.info("已重置为当前保存的配置");
};

// 加载商品列表
const loadProductList = async () => {
  productLoading.value = true;
  try {
    const { data } = await getProductListApi({
      page: 1,
      size: 1000,
      product_type: "original" // 只获取正品商品
    });
    productList.value = data.list.map((item: any) => ({
      id: item.id,
      title: item.title,
      country: item.country
    }));
  } catch (error) {
    console.error("加载商品列表失败", error);
  } finally {
    productLoading.value = false;
  }
};

// 打开商品选择弹窗
const openProductSelectDialog = () => {
  // 重置搜索条件
  productSearchForm.title = "";
  productSearchForm.country = "";
  productDialogPagination.current = 1;
  productDialogPagination.size = 10;
  productSelectDialogVisible.value = true;
  loadProductDialog();
};

// 加载商品弹窗数据
const loadProductDialog = async () => {
  productDialogLoading.value = true;
  try {
    const { data } = await getProductListApi({
      page: productDialogPagination.current,
      size: productDialogPagination.size,
      title: productSearchForm.title || undefined,
      country: productSearchForm.country || undefined,
      product_type: "original" // 只获取正品商品
    });
    productDialogList.value = data.list;
    productDialogPagination.total = data.total;

    // 恢复已选中状态
    await nextTick();
    if (productTableRef.value && accountForm.product_ids.length > 0) {
      productDialogList.value.forEach(product => {
        if (accountForm.product_ids.includes(product.id)) {
          productTableRef.value.toggleRowSelection(product, true);
        }
      });
    }
  } catch (error) {
    console.error("加载商品列表失败:", error);
    ElMessage.error("加载商品列表失败");
  } finally {
    productDialogLoading.value = false;
  }
};

// 搜索防抖定时器
let searchTimer: number | null = null;

// 输入搜索
const onSearchInput = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  // 设置新的定时器，500ms 后执行搜索
  searchTimer = window.setTimeout(() => {
    searchProducts();
  }, 500);
};

// 搜索商品
const searchProducts = () => {
  productDialogPagination.current = 1;
  loadProductDialog();
};

// 重置商品搜索
const resetProductSearch = () => {
  productSearchForm.title = "";
  productSearchForm.country = "";
  productDialogPagination.current = 1;
  loadProductDialog();
};

// 商品选择变化
const handleProductSelectionChange = (selection: any[]) => {
  // 保持所有选中的商品ID
  const currentPageIds = productDialogList.value.map(p => p.id);
  const otherPageIds = accountForm.product_ids.filter(id => !currentPageIds.includes(id));
  accountForm.product_ids = [...otherPageIds, ...selection.map(p => p.id)];
  updateSelectedProductsText();
};

// 确认商品选择
const confirmProductSelection = () => {
  productSelectDialogVisible.value = false;
  updateSelectedProductsText();
};

// 更新选中商品的显示文本
const updateSelectedProductsText = () => {
  if (accountForm.product_ids.length === 0) {
    selectedProductsText.value = "";
  } else {
    selectedProductsText.value = `已选择 ${accountForm.product_ids.length} 个商品`;
  }
};

// 获取商品名称
const getProductName = (productId: string) => {
  const product = productList.value.find(p => p.id === productId);
  return product ? product.title : productId;
};

// 移除单个商品
const removeSelectedProduct = (productId: string) => {
  accountForm.product_ids = accountForm.product_ids.filter((id: string) => id !== productId);
  updateSelectedProductsText();
};

// 清空商品选择
const clearSelectedProducts = () => {
  accountForm.product_ids = [];
  selectedProductsText.value = "";
};

// 全选当前页
const selectAllCurrentPage = () => {
  if (productTableRef.value) {
    productDialogList.value.forEach(row => {
      productTableRef.value.toggleRowSelection(row, true);
    });
  }
};

// 清空所有选择
const clearAllSelection = () => {
  accountForm.product_ids = [];
  if (productTableRef.value) {
    productTableRef.value.clearSelection();
  }
  updateSelectedProductsText();
};

// 初始化
onMounted(() => {
  loadConfig();
  loadProductList();
});
</script>

<style scoped lang="scss">
.pixel-config {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px 0;
    color: #303133;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}

.config-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.platform-icon {
  font-size: 20px;
  margin-right: 8px;

  &.facebook {
    color: #1877f2;
  }

  &.tiktok {
    color: #000000;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.custom-pixel-item {
  padding: 16px;
  margin-bottom: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 20px 0;
}
</style>
