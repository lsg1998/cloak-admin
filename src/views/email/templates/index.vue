<template>
  <div class="email-templates">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="模板代码">
          <el-select v-model="searchForm.template_code" placeholder="请选择模板" clearable style="width: 200px">
            <el-option
              v-for="item in templateCodes"
              :key="item.template_code"
              :label="item.description || item.template_code"
              :value="item.template_code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="国家">
          <el-select v-model="searchForm.country_code" placeholder="请选择国家" clearable style="width: 150px">
            <el-option v-for="item in countryCodes" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索模板名称或主题"
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
            <span>邮件模板</span>
            <el-tag type="info" size="small">{{ pagination.total }} 个模板</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="primary" size="small" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新建模板
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
        <el-table-column prop="template_code" label="模板代码" width="180" />
        <el-table-column prop="country_code" label="国家" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.country_code.toUpperCase() }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="template_name" label="模板名称" min-width="200" />
        <el-table-column prop="subject" label="邮件主题" min-width="250" show-overflow-tooltip />
        <el-table-column label="内容大小" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ formatBytes(row.content_length) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.is_active" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
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
      width="80%"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板代码" prop="template_code">
              <el-input v-model="formData.template_code" placeholder="如：picking_notification" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国家代码" prop="country_code">
              <el-select v-model="formData.country_code" placeholder="请选择国家" :disabled="isEdit">
                <el-option v-for="item in countryCodes" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="template_name">
              <el-input v-model="formData.template_name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否启用" prop="is_active">
              <el-switch v-model="formData.is_active" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="邮件主题" prop="subject">
          <el-input v-model="formData.subject" placeholder="请输入邮件主题" />
        </el-form-item>

        <el-form-item label="可用变量">
          <el-tag
            v-for="variable in defaultVariables"
            :key="variable"
            size="small"
            style="margin-right: 8px; margin-bottom: 8px"
            @click="insertVariable(variable)"
          >
            {{ "{" + variable + "}" }}
          </el-tag>
          <el-text type="info" size="small" style="display: block; margin-top: 5px"> 点击变量可插入到光标位置 </el-text>
        </el-form-item>

        <el-form-item label="HTML内容" prop="html_content">
          <el-input
            v-model="formData.html_content"
            type="textarea"
            :rows="20"
            placeholder="请输入邮件HTML内容，可使用变量，如：order_number、customer_name 等，需用花括号包裹"
            style="font-family: monospace"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewVisible" title="邮件预览" width="60%">
      <div v-if="previewData">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板代码">{{ previewData.template_code }}</el-descriptions-item>
          <el-descriptions-item label="国家">{{ previewData.country_code }}</el-descriptions-item>
          <el-descriptions-item label="模板名称" :span="2">{{ previewData.template_name }}</el-descriptions-item>
          <el-descriptions-item label="邮件主题" :span="2">{{ previewData.subject }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="previewData.is_active ? 'success' : 'danger'">
              {{ previewData.is_active ? "启用" : "禁用" }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ previewData.updated_at }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>邮件内容预览</el-divider>
        <div class="email-preview" v-html="previewData.html_content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="EmailTemplates">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, Plus, Edit, Delete, View } from "@element-plus/icons-vue";
import { useHandleData } from "@/hooks/useHandleData";
import {
  getEmailTemplatesApi,
  getEmailTemplateApi,
  createEmailTemplateApi,
  updateEmailTemplateApi,
  deleteEmailTemplateApi,
  getTemplateCodesApi,
  getCountryCodesApi,
  type EmailTemplate,
  type EmailTemplateListParams
} from "@/api/modules/email";

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
const tableData = ref([]);
const loading = ref(false);

// 模板代码列表
const templateCodes = ref([]);
// 国家代码列表
const countryCodes = ref([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("新建模板");
const isEdit = ref(false);
const formRef = ref();
const submitLoading = ref(false);

const formData = reactive({
  id: null,
  template_code: "",
  country_code: "en",
  template_name: "",
  subject: "",
  html_content: "",
  is_active: true
});

// 默认可用变量
const defaultVariables = [
  "order_number",
  "customer_name",
  "product_title",
  "quantity",
  "total_amount",
  "currency",
  "address",
  "city",
  "country",
  "product_image"
];

// 表单验证规则
const formRules = {
  template_code: [{ required: true, message: "请输入模板代码", trigger: "blur" }],
  country_code: [{ required: true, message: "请选择国家代码", trigger: "change" }],
  template_name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  subject: [{ required: true, message: "请输入邮件主题", trigger: "blur" }],
  html_content: [{ required: true, message: "请输入HTML内容", trigger: "blur" }]
};

// 预览相关
const previewVisible = ref(false);
const previewData = ref(null);

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: EmailTemplateListParams = {
      page: pagination.page,
      page_size: pagination.page_size,
      ...searchForm
    };
    const { data } = await getEmailTemplatesApi(params);
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
    const { data } = await getTemplateCodesApi();
    templateCodes.value = data;
  } catch (error) {
    console.error("加载模板代码失败:", error);
  }
};

// 加载国家代码列表
const loadCountryCodes = async () => {
  try {
    const { data } = await getCountryCodesApi();
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

// 状态切换
const handleStatusChange = async (row: EmailTemplate) => {
  try {
    await updateEmailTemplateApi(row.id, {
      template_code: row.template_code,
      country_code: row.country_code,
      template_name: row.template_name,
      subject: row.subject,
      html_content: row.html_content,
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
  dialogTitle.value = "新建邮件模板";
  dialogVisible.value = true;
};

// 编辑
const handleEdit = async (row: EmailTemplate) => {
  isEdit.value = true;
  dialogTitle.value = "编辑邮件模板";

  try {
    const { data } = await getEmailTemplateApi(row.id);
    Object.assign(formData, data);
    dialogVisible.value = true;
  } catch (error) {
    console.error("加载模板详情失败:", error);
    ElMessage.error("加载模板详情失败");
  }
};

// 预览
const handlePreview = async (row: EmailTemplate) => {
  try {
    const { data } = await getEmailTemplateApi(row.id);
    previewData.value = data;
    previewVisible.value = true;
  } catch (error) {
    console.error("加载模板详情失败:", error);
    ElMessage.error("加载模板详情失败");
  }
};

// 删除
const handleDelete = async (row: EmailTemplate) => {
  await useHandleData(() => deleteEmailTemplateApi(row.id), `确定要删除模板 "${row.template_name}" 吗？`, "删除成功");
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
      if (isEdit.value) {
        await updateEmailTemplateApi(data.id!, data);
        ElMessage.success("更新成功");
      } else {
        await createEmailTemplateApi(data);
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
    template_code: "",
    country_code: "en",
    template_name: "",
    subject: "",
    html_content: "",
    is_active: true
  });
};

// 插入变量
const insertVariable = (variable: string) => {
  // 这里简单实现，实际可以根据光标位置插入
  formData.html_content += `{${variable}}`;
};

// 格式化字节
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

onMounted(() => {
  loadData();
  loadTemplateCodes();
  loadCountryCodes();
});
</script>

<style scoped lang="scss">
.email-templates {
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

  .email-preview {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 20px;
    background: #f5f7fa;
    max-height: 600px;
    overflow-y: auto;
  }
}
</style>
