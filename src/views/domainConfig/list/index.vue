<template>
  <div class="domain-config-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="域名名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入域名名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="域名地址">
          <el-input
            v-model="searchForm.domain"
            placeholder="请输入域名地址"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <div class="card-header">
          <div class="header-left">
            <span>域名配置列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增域名
            </el-button>
            <el-button size="small" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="name" label="域名名称" width="150" show-overflow-tooltip />
        <el-table-column prop="domain" label="域名地址" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="domain-info">
              <el-icon><Link /></el-icon>
              <span>{{ row.protocol }}://{{ row.domain }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="protocol" label="协议" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.protocol === 'https' ? 'success' : 'warning'" size="small">
              {{ row.protocol.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small" effect="light">
              {{ row.is_active ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_wildcard" label="通配符域名" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_wildcard ? 'warning' : 'info'" size="small" effect="light">
              {{ row.is_wildcard ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ row.created_at }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="域名名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入域名名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="协议" prop="protocol">
              <el-select v-model="form.protocol" placeholder="请选择协议" style="width: 100%">
                <el-option label="HTTPS" value="https" />
                <el-option label="HTTP" value="http" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="域名地址" prop="domain">
              <el-input v-model="form.domain" placeholder="请输入域名地址，如：example.com" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="is_active">
              <el-radio-group v-model="form.is_active">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort_order">
              <el-input-number v-model="form.sort_order" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="通配符域名" prop="is_wildcard">
              <el-checkbox v-model="form.is_wildcard" :true-value="1" :false-value="0">
                是否为通配符域名（查看时根据国家代码自动添加前缀，如：sk.goworldhub.shop）
              </el-checkbox>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入域名描述（可选）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DomainConfigList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search, Refresh, Edit, Delete, Link, Calendar } from "@element-plus/icons-vue";
import {
  getAllDomainConfigs,
  createDomainConfig,
  updateDomainConfig,
  deleteDomainConfig,
  type DomainConfig,
  type DomainConfigListParams,
  type CreateDomainConfigParams,
  type UpdateDomainConfigParams
} from "@/api/modules/domainConfig";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  name: "",
  domain: "",
  is_active: null as number | null
});

// 表格数据
const tableData = ref<DomainConfig[]>([]);
const selectedRows = ref<DomainConfig[]>([]);

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 表单数据
const form = reactive({
  id: null as number | null,
  name: "",
  domain: "",
  protocol: "https" as "http" | "https",
  is_active: 1,
  is_wildcard: 0,
  sort_order: 0,
  description: ""
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入域名名称", trigger: "blur" }],
  domain: [
    { required: true, message: "请输入域名地址", trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/,
      message: "请输入有效的域名格式",
      trigger: "blur"
    }
  ],
  protocol: [{ required: true, message: "请选择协议", trigger: "change" }],
  is_active: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: DomainConfigListParams = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    };

    const response = await getAllDomainConfigs(params);
    tableData.value = response.data;
    pagination.total = response.data.length;
  } catch (error) {
    console.error("加载域名配置失败:", error);
    ElMessage.error("加载域名配置失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: "",
    domain: "",
    is_active: null
  });
  handleSearch();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
  loadData();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadData();
};

// 选择改变
const handleSelectionChange = (selection: DomainConfig[]) => {
  selectedRows.value = selection;
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新增域名配置";
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: DomainConfig) => {
  dialogTitle.value = "编辑域名配置";
  Object.assign(form, {
    id: row.id,
    name: row.name,
    domain: row.domain,
    protocol: row.protocol,
    is_active: row.is_active,
    is_wildcard: row.is_wildcard || 0,
    sort_order: row.sort_order,
    description: row.description || ""
  });
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: DomainConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除域名配置"${row.name}"吗？`, "确认删除", {
      type: "warning"
    });

    await deleteDomainConfig(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除域名配置失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    if (form.id) {
      // 编辑
      const updateData: UpdateDomainConfigParams = {
        id: form.id,
        name: form.name,
        domain: form.domain,
        protocol: form.protocol,
        is_active: form.is_active,
        is_wildcard: form.is_wildcard,
        sort_order: form.sort_order,
        description: form.description
      };
      await updateDomainConfig(updateData);
      ElMessage.success("更新成功");
    } else {
      // 新增
      const createData: CreateDomainConfigParams = {
        name: form.name,
        domain: form.domain,
        protocol: form.protocol,
        is_active: form.is_active,
        is_wildcard: form.is_wildcard,
        sort_order: form.sort_order,
        description: form.description
      };
      await createDomainConfig(createData);
      ElMessage.success("创建成功");
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: "",
    domain: "",
    protocol: "https",
    is_active: 1,
    is_wildcard: 0,
    sort_order: 0,
    description: ""
  });
};

// 页面加载时获取数据
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.domain-config-management {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.domain-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.domain-info .el-icon {
  color: #409eff;
  font-size: 14px;
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

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
