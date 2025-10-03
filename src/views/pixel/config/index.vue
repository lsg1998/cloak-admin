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

      <el-table :data="googleAdsAccounts" stripe border style="width: 100%">
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
        <el-table-column prop="product_ids" label="应用商品" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="!row.product_ids || row.product_ids.length === 0" type="success">全部商品</el-tag>
            <el-tag v-else type="warning">指定 {{ row.product_ids.length }} 个商品</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="handleStatusChange" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" size="small" link @click="handleEditAccount(row, $index)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDeleteAccount($index)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="googleAdsAccounts.length === 0" description="暂无 Google Ads 账户，点击右上角添加" />
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
          <el-select
            v-model="accountForm.product_ids"
            multiple
            filterable
            placeholder="不选择则应用到全部商品"
            style="width: 100%"
            :loading="productLoading"
          >
            <el-option v-for="product in productList" :key="product.id" :label="product.title" :value="product.id" />
          </el-select>
          <div class="form-tip">不选择任何商品时，此像素将应用到全部商品页面</div>
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
  </div>
</template>

<script setup lang="ts" name="PixelConfig">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Delete, Edit, Check, Refresh, Share, VideoCamera } from "@element-plus/icons-vue";
import { getGlobalPixelConfigApi, updateGlobalPixelConfigApi } from "@/api/modules/pixel";
import { getProductListApi } from "@/api/modules/product";

// 响应式数据
const saveLoading = ref(false);
const accountDialogVisible = ref(false);
const accountDialogTitle = ref("添加 Google Ads 账户");
const accountFormRef = ref();
const editingIndex = ref(-1);
const productLoading = ref(false);
const productList = ref<Array<{ id: string; title: string }>>([]);

// Google Ads 账户列表
const googleAdsAccounts = ref<
  Array<{ name: string; conversion_id: string; conversion_label: string; enabled: boolean; product_ids: string[] }>
>([]);

// 账户表单
const accountForm = reactive({
  name: "",
  conversion_id: "",
  conversion_label: "",
  enabled: true,
  product_ids: [] as string[]
});

// 表单验证规则
const accountRules = {
  name: [{ required: true, message: "请输入账户名称", trigger: "blur" }],
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

// 加载商品列表
const loadProductList = async () => {
  productLoading.value = true;
  try {
    const { data } = await getProductListApi({});
    productList.value = data.list.map((item: any) => ({
      id: item.id,
      title: item.title
    }));
  } catch (error) {
    console.error("加载商品列表失败", error);
  } finally {
    productLoading.value = false;
  }
};

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
        } catch (e) {
          googleAdsAccounts.value = [];
        }
      }

      // 加载 Facebook 配置
      config.facebook_enabled = data.facebook_enabled || 0;
      config.facebook_pixel_id = data.facebook_pixel_id || "";

      // 加载 TikTok 配置
      config.tiktok_enabled = data.tiktok_enabled || 0;
      config.tiktok_pixel_id = data.tiktok_pixel_id || "";

      // 加载自定义像素
      if (data.custom_pixels) {
        try {
          customPixels.value = typeof data.custom_pixels === "string" ? JSON.parse(data.custom_pixels) : data.custom_pixels;
        } catch (e) {
          customPixels.value = [];
        }
      }
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
    product_ids: []
  });
  accountDialogVisible.value = true;
};

// 编辑账户
const handleEditAccount = (row: any, index: number) => {
  accountDialogTitle.value = "编辑 Google Ads 账户";
  editingIndex.value = index;
  Object.assign(accountForm, {
    ...row,
    product_ids: row.product_ids || []
  });
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
      product_ids: accountForm.product_ids || []
    };

    if (editingIndex.value >= 0) {
      // 编辑
      googleAdsAccounts.value[editingIndex.value] = accountData;
      ElMessage.success("账户更新成功");
    } else {
      // 添加
      googleAdsAccounts.value.push(accountData);
      ElMessage.success("账户添加成功");
    }

    accountDialogVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};

// 删除账户
const handleDeleteAccount = async (index: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个 Google Ads 账户吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    googleAdsAccounts.value.splice(index, 1);
    ElMessage.success("删除成功");
  } catch (error) {
    // 用户取消
  }
};

// 状态变更
const handleStatusChange = () => {
  ElMessage.info("请点击下方保存按钮保存修改");
};

// 添加自定义像素
const addCustomPixel = () => {
  customPixels.value.push({
    name: "",
    code: "",
    enabled: true
  });
};

// 删除自定义像素
const removeCustomPixel = (index: number) => {
  customPixels.value.splice(index, 1);
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
    await loadConfig();
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
