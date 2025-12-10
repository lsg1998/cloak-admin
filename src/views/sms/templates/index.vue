<template>
  <div class="sms-templates">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="模板类型">
          <el-select v-model="searchForm.template_code" placeholder="请选择类型" clearable style="width: 180px">
            <el-option
              v-for="item in templateCodes"
              :key="item.template_code"
              :label="item.description"
              :value="item.template_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="国家/语言">
          <el-select v-model="searchForm.country_code" placeholder="请选择" clearable style="width: 180px">
            <el-option v-for="item in countryCodes" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable style="width: 100px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索模板名称或内容"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
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

    <!-- 数据表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon class="title-icon"><ChatDotRound /></el-icon>
            <span>短信模板管理</span>
            <el-tag type="info" size="small">{{ pagination.total }} 个模板</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="primary" size="small" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新建模板
            </el-button>
            <el-button type="success" size="small" @click="handleInitDefaults" :loading="initLoading">
              <el-icon><MagicStick /></el-icon>
              初始化默认模板
            </el-button>
            <el-button size="small" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="60" align="center" />
        <el-table-column prop="template_code" label="模板类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getTemplateTypeColor(row.template_code)" size="small">
              {{ getTemplateTypeName(row.template_code) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="country_code" label="国家/语言" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.country_code.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="template_name" label="模板名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="content" label="短信内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="字符数" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.content_length > 160 ? 'warning' : 'success'" size="small">
              {{ row.content_length }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.is_active" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="70" align="center" />
        <el-table-column prop="updated_at" label="更新时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handlePreview(row)">
              <el-icon><View /></el-icon>
              预览
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        class="pagination"
      />
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板类型" prop="template_code">
              <el-select v-model="formData.template_code" placeholder="请选择类型" :disabled="isEdit" style="width: 100%">
                <el-option
                  v-for="item in templateCodes"
                  :key="item.template_code"
                  :label="item.description"
                  :value="item.template_code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国家/语言" prop="country_code">
              <el-select v-model="formData.country_code" placeholder="请选择" :disabled="isEdit" style="width: 100%">
                <el-option v-for="item in countryCodes" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="模板名称" prop="template_name">
              <el-input v-model="formData.template_name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort_order">
              <el-input-number v-model="formData.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="模板说明">
          <el-input v-model="formData.description" placeholder="请输入模板说明（可选）" />
        </el-form-item>

        <el-form-item label="是否启用">
          <el-switch v-model="formData.is_active" />
        </el-form-item>

        <el-form-item label="可用变量">
          <div class="variables-container">
            <el-tag
              v-for="variable in defaultVariables"
              :key="variable"
              size="small"
              class="variable-tag"
              @click="insertVariable(variable)"
            >
              {{ "{" + variable + "}" }}
            </el-tag>
          </div>
          <el-text type="info" size="small" class="variable-tip">
            <el-icon><InfoFilled /></el-icon>
            点击变量可插入到短信内容末尾
          </el-text>
        </el-form-item>

        <el-form-item label="短信内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入短信内容，可使用变量如：{customer_name}、{order_number} 等"
            maxlength="1000"
            show-word-limit
          />
          <div class="content-info">
            <el-tag :type="formData.content.length > 160 ? 'warning' : 'success'" size="small">
              {{ formData.content.length }} 字符
            </el-tag>
            <el-text v-if="formData.content.length > 160" type="warning" size="small">
              超过160字符可能会被拆分成多条短信计费
            </el-text>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="短信模板预览" width="600px">
      <div v-if="previewData" class="preview-container">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板类型">
            <el-tag :type="getTemplateTypeColor(previewData.template_code)" size="small">
              {{ getTemplateTypeName(previewData.template_code) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="国家/语言">
            <el-tag size="small">{{ previewData.country_code.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模板名称" :span="2">{{ previewData.template_name }}</el-descriptions-item>
          <el-descriptions-item label="模板说明" :span="2">{{ previewData.description || "-" }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="previewData.is_active ? 'success' : 'danger'">
              {{ previewData.is_active ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ previewData.updated_at }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>短信内容预览</el-divider>
        <div class="sms-preview">
          <div class="sms-bubble">
            {{ previewData.content }}
          </div>
          <div class="sms-info">
            <span>字符数: {{ previewData.content.length }}</span>
            <span v-if="previewData.content.length > 160" class="warning">
              (可能拆分为 {{ Math.ceil(previewData.content.length / 160) }} 条)
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="SmsTemplates">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Refresh, Plus, Edit, Delete, View, ChatDotRound, MagicStick, InfoFilled } from "@element-plus/icons-vue";
import { useHandleData } from "@/hooks/useHandleData";
import {
  getSmsTemplatesApi,
  getSmsTemplateApi,
  createSmsTemplateApi,
  updateSmsTemplateApi,
  deleteSmsTemplateApi,
  getSmsTemplateCodesApi,
  getSmsCountryCodesApi,
  initDefaultSmsTemplatesApi,
  type SmsTemplate,
  type SmsTemplateListParams
} from "@/api/modules/sms";

// 搜索表单
const searchForm = reactive({
  template_code: "",
  country_code: "",
  is_active: "",
  keyword: ""
});

// 分页数据
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
});

// 表格数据
const tableData = ref<SmsTemplate[]>([]);
const loading = ref(false);
const initLoading = ref(false);

// 模板代码列表
const templateCodes = ref<any[]>([]);
// 国家代码列表
const countryCodes = ref<any[]>([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新建短信模板");
const isEdit = ref(false);
const formRef = ref();
const submitLoading = ref(false);

const formData = reactive({
  id: null as number | null,
  template_code: "picking",
  country_code: "en",
  template_name: "",
  content: "",
  description: "",
  is_active: true,
  sort_order: 0
});

// 默认可用变量
const defaultVariables = [
  "customer_name",
  "order_number",
  "product_title",
  "tracking_number",
  "quantity",
  "total_amount",
  "address",
  "city",
  "province"
];

// 表单验证规则
const formRules = {
  template_code: [{ required: true, message: "请选择模板类型", trigger: "change" }],
  country_code: [{ required: true, message: "请选择国家/语言", trigger: "change" }],
  template_name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  content: [
    { required: true, message: "请输入短信内容", trigger: "blur" },
    { max: 1000, message: "短信内容不能超过1000字符", trigger: "blur" }
  ]
};

// 预览相关
const previewVisible = ref(false);
const previewData = ref<SmsTemplate | null>(null);

// 模板类型名称映射
const templateTypeNames: Record<string, string> = {
  picking: "拣货通知",
  shipped: "发货通知",
  arrival: "到达提醒",
  reshipment: "补发通知"
};

// 模板类型颜色映射
const templateTypeColors: Record<string, string> = {
  picking: "warning",
  shipped: "success",
  arrival: "primary",
  reshipment: "danger"
};

const getTemplateTypeName = (code: string) => templateTypeNames[code] || code;
const getTemplateTypeColor = (code: string) => templateTypeColors[code] || "info";

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: SmsTemplateListParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...searchForm
    };
    const { data } = await getSmsTemplatesApi(params);
    tableData.value = data.list;
    pagination.total = data.pagination.total;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

// 加载模板代码列表
const loadTemplateCodes = async () => {
  try {
    const { data } = await getSmsTemplateCodesApi();
    templateCodes.value = data;
  } catch (error) {
    console.error("加载模板代码失败:", error);
  }
};

// 加载国家代码列表
const loadCountryCodes = async () => {
  try {
    const { data } = await getSmsCountryCodesApi();
    countryCodes.value = data;
  } catch (error) {
    console.error("加载国家代码失败:", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.template_code = "";
  searchForm.country_code = "";
  searchForm.is_active = "";
  searchForm.keyword = "";
  pagination.page = 1;
  loadData();
};

// 分页改变
const handlePageChange = (page: number) => {
  pagination.page = page;
  loadData();
};

const handleSizeChange = (size: number) => {
  pagination.page_size = size;
  pagination.page = 1;
  loadData();
};

// 初始化默认模板
const handleInitDefaults = async () => {
  try {
    await ElMessageBox.confirm("初始化默认模板将为所有国家/语言创建标准短信模板，确定要继续吗？", "初始化确认", {
      confirmButtonText: "确定初始化",
      cancelButtonText: "取消",
      type: "warning"
    });

    initLoading.value = true;
    await initDefaultSmsTemplatesApi();
    ElMessage.success("默认模板初始化成功");
    loadData();
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("初始化失败:", error);
      ElMessage.error(error.message || "初始化默认模板失败");
    }
  } finally {
    initLoading.value = false;
  }
};

// 状态切换
const handleStatusChange = async (row: SmsTemplate) => {
  try {
    await updateSmsTemplateApi(row.id, {
      template_code: row.template_code,
      country_code: row.country_code,
      template_name: row.template_name,
      content: row.content,
      is_active: row.is_active ? 1 : 0
    });
    ElMessage.success("状态更新成功");
  } catch (error) {
    console.error("状态更新失败:", error);
    ElMessage.error("状态更新失败");
    row.is_active = !row.is_active; // 恢复原状态
  }
};

// 新建
const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = "新建短信模板";
  dialogVisible.value = true;
};

// 编辑
const handleEdit = async (row: SmsTemplate) => {
  isEdit.value = true;
  dialogTitle.value = "编辑短信模板";

  try {
    const { data } = await getSmsTemplateApi(row.id);
    Object.assign(formData, data);
    dialogVisible.value = true;
  } catch (error) {
    console.error("加载模板详情失败:", error);
    ElMessage.error("加载模板详情失败");
  }
};

// 预览
const handlePreview = async (row: SmsTemplate) => {
  try {
    const { data } = await getSmsTemplateApi(row.id);
    previewData.value = data;
    previewVisible.value = true;
  } catch (error) {
    console.error("加载模板详情失败:", error);
    ElMessage.error("加载模板详情失败");
  }
};

// 删除
const handleDelete = async (row: SmsTemplate) => {
  await useHandleData(() => deleteSmsTemplateApi(row.id), `确定要删除模板 "${row.template_name}" 吗？`, "删除成功");
  loadData();
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      const data = { ...formData };
      if (isEdit.value && data.id) {
        await updateSmsTemplateApi(data.id, data);
        ElMessage.success("更新成功");
      } else {
        await createSmsTemplateApi(data);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      loadData();
    } catch (error: any) {
      console.error("提交失败:", error);
      ElMessage.error(error.message || "操作失败");
    } finally {
      submitLoading.value = false;
    }
  });
};

// 对话框关闭
const handleDialogClosed = () => {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: null,
    template_code: "picking",
    country_code: "en",
    template_name: "",
    content: "",
    description: "",
    is_active: true,
    sort_order: 0
  });
};

// 插入变量
const insertVariable = (variable: string) => {
  formData.content += `{${variable}}`;
};

onMounted(() => {
  loadData();
  loadTemplateCodes();
  loadCountryCodes();
});
</script>

<style scoped lang="scss">
.sms-templates {
  padding: 20px;

  .search-card {
    margin-bottom: 20px;
  }

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .table-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 500;

        .title-icon {
          font-size: 20px;
          color: #67c23a;
        }
      }

      .table-actions {
        display: flex;
        gap: 10px;
      }
    }

    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .variables-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;

    .variable-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .variable-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #909399;
  }

  .content-info {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .preview-container {
    .sms-preview {
      background: #f5f5f5;
      border-radius: 12px;
      padding: 20px;

      .sms-bubble {
        background: #67c23a;
        color: white;
        padding: 12px 16px;
        border-radius: 18px 18px 4px 18px;
        max-width: 80%;
        margin-bottom: 12px;
        line-height: 1.6;
        word-break: break-word;
      }

      .sms-info {
        font-size: 12px;
        color: #909399;

        .warning {
          color: #e6a23c;
          margin-left: 8px;
        }
      }
    }
  }
}
</style>
