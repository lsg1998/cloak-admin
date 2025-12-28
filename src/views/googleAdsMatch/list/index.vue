<template>
  <div class="google-ads-match">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total">
              <el-icon :size="28"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon enabled">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.enabled }}</div>
              <div class="stat-label">已启用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon disabled">
              <el-icon :size="28"><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.disabled }}</div>
              <div class="stat-label">已禁用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon countries">
              <el-icon :size="28"><Location /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.country_stats?.length || 0 }}</div>
              <div class="stat-label">覆盖国家</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="邮箱">
          <el-input
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="国家">
          <el-select v-model="searchForm.country_code" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in countryCodes" :key="item.code" :label="item.name_zh" :value="item.code">
              <span>{{ item.code }} - {{ item.name_zh }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="searchForm.source" placeholder="全部" clearable style="width: 120px">
            <el-option label="手动添加" value="manual" />
            <el-option label="批量导入" value="import" />
            <el-option label="订单同步" value="order" />
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
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <span>种子名单</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加记录
            </el-button>
            <el-button type="success" @click="handleImport">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button type="warning" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
            <el-button @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="email-cell">
              <div class="email-info">
                <span>{{ row.email }}</span>
                <div v-if="row.normalized_email && row.normalized_email !== row.email" class="normalized-value">
                  <el-icon><Right /></el-icon>
                  <span class="normalized-text">{{ row.normalized_email }}</span>
                </div>
              </div>
              <el-tooltip content="复制哈希值" placement="top">
                <el-button type="primary" link size="small" @click="copyHash(row.hashed_email)">
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="180">
          <template #default="{ row }">
            <div v-if="row.phone">
              <span>{{ row.phone }}</span>
              <div v-if="row.normalized_phone && row.normalized_phone !== row.phone" class="normalized-value">
                <el-icon><Right /></el-icon>
                <span class="normalized-text">{{ row.normalized_phone }}</span>
              </div>
            </div>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="country_code" label="国家" width="120" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ getCountryName(row.country_code) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="postal_code" label="邮编" width="100" align="center">
          <template #default="{ row }">
            {{ row.postal_code || "--" }}
          </template>
        </el-table-column>
        <el-table-column label="合规状态" width="160" align="center">
          <template #default="{ row }">
            <div class="consent-status">
              <el-tag :type="row.ad_user_data === 'GRANTED' ? 'success' : 'danger'" size="small">
                数据: {{ row.ad_user_data === "GRANTED" ? "✓" : "✗" }}
              </el-tag>
              <el-tag :type="row.ad_personalization === 'GRANTED' ? 'success' : 'danger'" size="small">
                个性化: {{ row.ad_personalization === "GRANTED" ? "✓" : "✗" }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getSourceTagType(row.source)" size="small">
              {{ SourceLabels[row.source] || row.source }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加记录' : '编辑记录'"
      width="550px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号（可选）" />
        </el-form-item>
        <el-form-item label="国家" prop="country_code">
          <el-select v-model="formData.country_code" placeholder="请选择国家" style="width: 100%">
            <el-option
              v-for="item in countryCodes"
              :key="item.code"
              :label="`${item.code} - ${item.name_zh}`"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮编" prop="postal_code">
          <el-input v-model="formData.postal_code" placeholder="请输入邮编（可选）" />
        </el-form-item>
        <el-form-item label="数据同意" prop="ad_user_data">
          <el-radio-group v-model="formData.ad_user_data">
            <el-radio value="GRANTED">已授权</el-radio>
            <el-radio value="DENIED">已拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="个性化同意" prop="ad_personalization">
          <el-radio-group v-model="formData.ad_personalization">
            <el-radio value="GRANTED">已授权</el-radio>
            <el-radio value="DENIED">已拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="备注信息（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入" width="700px" :close-on-click-modal="false">
      <el-alert type="info" :closable="false" style="margin-bottom: 20px">
        <template #title>
          <div>
            <p>请按以下格式填写数据，每行一条记录，字段用制表符或逗号分隔：</p>
            <p><strong>格式：邮箱, 手机号, 国家代码, 邮编</strong></p>
            <p>示例：example@email.com, +421912345678, SK, 81102</p>
          </div>
        </template>
      </el-alert>
      <el-form-item label="默认国家">
        <el-select v-model="importDefaultCountry" placeholder="请选择默认国家" style="width: 200px">
          <el-option v-for="item in countryCodes" :key="item.code" :label="`${item.code} - ${item.name_zh}`" :value="item.code" />
        </el-select>
        <span style="margin-left: 10px; color: #909399">（未指定国家时使用）</span>
      </el-form-item>
      <el-input
        v-model="importText"
        type="textarea"
        :rows="12"
        placeholder="请输入要导入的数据，每行一条记录..."
        style="font-family: monospace"
      />
      <div style="margin-top: 10px; color: #909399">
        <span>已解析: {{ parsedImportData.length }} 条记录</span>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :loading="importLoading" :disabled="parsedImportData.length === 0">
          导入 ({{ parsedImportData.length }} 条)
        </el-button>
      </template>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出数据" width="450px">
      <el-form label-width="100px">
        <el-form-item label="导出国家">
          <el-select v-model="exportCountry" placeholder="全部国家" clearable style="width: 100%">
            <el-option label="全部国家" value="" />
            <el-option
              v-for="item in countryCodes"
              :key="item.code"
              :label="`${item.code} - ${item.name_zh}`"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="csv">CSV 文件（手动上传）</el-radio>
            <el-radio value="json">JSON 格式（API调用）</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExportSubmit">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import {
  Search,
  Refresh,
  Plus,
  Delete,
  Edit,
  Upload,
  Download,
  User,
  CircleCheck,
  CircleClose,
  Location,
  CopyDocument,
  Right
} from "@element-plus/icons-vue";
import {
  getGoogleAdsMatchListApi,
  getGoogleAdsMatchStatisticsApi,
  getCountryCodesApi,
  createGoogleAdsMatchApi,
  updateGoogleAdsMatchApi,
  deleteGoogleAdsMatchApi,
  batchDeleteGoogleAdsMatchApi,
  batchImportGoogleAdsMatchApi,
  getExportGoogleAdsMatchUrl,
  SourceLabels,
  type GoogleAdsMatchItem,
  type CountryCode,
  type GoogleAdsMatchFormData,
  type GoogleAdsMatchStatistics
} from "@/api/modules/googleAdsMatch";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const importLoading = ref(false);
const dialogVisible = ref(false);
const importDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const formRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive({
  email: "",
  phone: "",
  country_code: "",
  status: "" as number | string,
  source: ""
});

// 表单数据
const formData = reactive<GoogleAdsMatchFormData>({
  email: "",
  phone: "",
  postal_code: "",
  country_code: "SK",
  ad_user_data: "GRANTED",
  ad_personalization: "GRANTED",
  remark: ""
});

// 当前编辑的ID
const editingId = ref<number | null>(null);

// 表单校验规则
const formRules = {
  email: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" }
  ],
  country_code: [{ required: true, message: "请选择国家", trigger: "change" }]
};

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<GoogleAdsMatchItem[]>([]);

// 选中的ID
const selectedIds = ref<number[]>([]);

// 国家代码列表
const countryCodes = ref<CountryCode[]>([]);

// 统计数据
const statistics = ref<GoogleAdsMatchStatistics>({
  total: 0,
  enabled: 0,
  disabled: 0,
  country_stats: [],
  source_stats: []
});

// 导入相关
const importText = ref("");
const importDefaultCountry = ref("SK");

// 导出相关
const exportCountry = ref("");
const exportFormat = ref<"csv" | "json">("csv");

// 解析导入数据
const parsedImportData = computed(() => {
  if (!importText.value.trim()) return [];
  const lines = importText.value.trim().split("\n");
  return lines
    .map(line => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (!parts[0]) return null;
      return {
        email: parts[0],
        phone: parts[1] || "",
        country_code: parts[2] || importDefaultCountry.value,
        postal_code: parts[3] || ""
      };
    })
    .filter(Boolean);
});

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取国家名称
const getCountryName = (code: string) => {
  const country = countryCodes.value.find(c => c.code === code);
  return country ? country.name_zh : code;
};

// 获取来源标签类型
const getSourceTagType = (source: string) => {
  const types: Record<string, string> = {
    manual: "",
    import: "success",
    order: "warning"
  };
  return types[source] || "info";
};

// 复制哈希值
const copyHash = async (hash: string) => {
  try {
    await navigator.clipboard.writeText(hash);
    ElMessage.success("哈希值已复制");
  } catch {
    ElMessage.error("复制失败");
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getGoogleAdsMatchListApi({
      page: pagination.current,
      size: pagination.size,
      ...searchForm
    });
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取列表失败");
  } finally {
    loading.value = false;
  }
};

// 加载统计数据
const loadStatistics = async () => {
  try {
    const { data } = await getGoogleAdsMatchStatisticsApi();
    statistics.value = data;
  } catch (error) {
    console.error("获取统计数据失败", error);
  }
};

// 加载国家代码
const loadCountryCodes = async () => {
  try {
    const { data } = await getCountryCodesApi();
    countryCodes.value = data;
  } catch (error) {
    console.error("获取国家代码失败", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.email = "";
  searchForm.phone = "";
  searchForm.country_code = "";
  searchForm.status = "";
  searchForm.source = "";
  handleSearch();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.current = 1;
  loadData();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.current = page;
  loadData();
};

// 选择改变
const handleSelectionChange = (selection: GoogleAdsMatchItem[]) => {
  selectedIds.value = selection.map(item => item.id);
};

// 添加记录
const handleAdd = () => {
  dialogType.value = "add";
  editingId.value = null;
  formData.email = "";
  formData.phone = "";
  formData.postal_code = "";
  formData.country_code = "SK";
  formData.ad_user_data = "GRANTED";
  formData.ad_personalization = "GRANTED";
  formData.remark = "";
  dialogVisible.value = true;
};

// 编辑记录
const handleEdit = (row: GoogleAdsMatchItem) => {
  dialogType.value = "edit";
  editingId.value = row.id;
  formData.email = row.email;
  formData.phone = row.phone || "";
  formData.postal_code = row.postal_code || "";
  formData.country_code = row.country_code;
  formData.ad_user_data = row.ad_user_data;
  formData.ad_personalization = row.ad_personalization;
  formData.remark = row.remark || "";
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      if (dialogType.value === "add") {
        await createGoogleAdsMatchApi(formData);
        ElMessage.success("添加成功");
      } else {
        await updateGoogleAdsMatchApi(editingId.value!, formData);
        ElMessage.success("更新成功");
      }
      dialogVisible.value = false;
      loadData();
      loadStatistics();
    } catch (error: any) {
      const errorMsg = error?.message || (dialogType.value === "add" ? "添加失败" : "更新失败");
      ElMessage.error(errorMsg);
    } finally {
      submitLoading.value = false;
    }
  });
};

// 删除记录
const handleDelete = (row: GoogleAdsMatchItem) => {
  ElMessageBox.confirm(`确定要删除邮箱 "${row.email}" 的记录吗？`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteGoogleAdsMatchApi(row.id);
      ElMessage.success("删除成功");
      loadData();
      loadStatistics();
    } catch (error: any) {
      ElMessage.error(error?.message || "删除失败");
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, "批量删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await batchDeleteGoogleAdsMatchApi(selectedIds.value);
      ElMessage.success("批量删除成功");
      selectedIds.value = [];
      loadData();
      loadStatistics();
    } catch (error: any) {
      ElMessage.error(error?.message || "批量删除失败");
    }
  });
};

// 状态改变
const handleStatusChange = async (row: GoogleAdsMatchItem) => {
  try {
    await updateGoogleAdsMatchApi(row.id, { status: row.status });
    ElMessage.success("状态更新成功");
    loadStatistics();
  } catch (error: any) {
    // 恢复原状态
    row.status = row.status === 1 ? 0 : 1;
    ElMessage.error(error?.message || "状态更新失败");
  }
};

// 打开导入对话框
const handleImport = () => {
  importText.value = "";
  importDialogVisible.value = true;
};

// 提交导入
const handleImportSubmit = async () => {
  if (parsedImportData.value.length === 0) {
    ElMessage.warning("请输入要导入的数据");
    return;
  }

  importLoading.value = true;
  try {
    const { data } = await batchImportGoogleAdsMatchApi(parsedImportData.value as any);
    if (data.fail_count > 0) {
      ElMessage.warning(`导入完成: 成功 ${data.success_count} 条, 失败 ${data.fail_count} 条`);
      console.log("导入失败的记录:", data.failed_items);
    } else {
      ElMessage.success(`成功导入 ${data.success_count} 条记录`);
    }
    importDialogVisible.value = false;
    loadData();
    loadStatistics();
  } catch (error: any) {
    ElMessage.error(error?.message || "导入失败");
  } finally {
    importLoading.value = false;
  }
};

// 打开导出对话框
const handleExport = () => {
  exportCountry.value = "";
  exportFormat.value = "csv";
  exportDialogVisible.value = true;
};

// 执行导出
const handleExportSubmit = () => {
  const url = getExportGoogleAdsMatchUrl({
    country_code: exportCountry.value,
    format: exportFormat.value
  });

  if (exportFormat.value === "csv") {
    // 直接下载CSV
    window.open(url, "_blank");
  } else {
    // 复制JSON URL
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success("导出URL已复制到剪贴板");
    });
  }
  exportDialogVisible.value = false;
};

// 组件挂载
onMounted(() => {
  loadCountryCodes();
  loadData();
  loadStatistics();
});
</script>

<style scoped>
.google-ads-match {
  padding: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.enabled {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.disabled {
  background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.stat-icon.countries {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
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

.email-cell {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.email-info {
  flex: 1;
  min-width: 0;
}

.normalized-value {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 12px;
  color: #67c23a;
}

.normalized-value .el-icon {
  font-size: 10px;
}

.normalized-text {
  font-family: monospace;
  background: #f0f9eb;
  padding: 1px 4px;
  border-radius: 2px;
}

.consent-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
