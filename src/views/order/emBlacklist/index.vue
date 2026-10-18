<template>
  <div class="em-blacklist">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="em参数">
          <el-input
            v-model="searchForm.em"
            placeholder="请输入em参数"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
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

    <!-- 说明 -->
    <el-alert
      class="tip-alert"
      title="被拉黑的 em 参数，访问时将永久只看到仿品页面（与谷歌/机器人同口径）。可随时添加或移除。"
      type="info"
      :closable="false"
      show-icon
    />

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <span>EM黑名单</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加em
            </el-button>
            <el-button @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="em_param" label="em参数" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag type="danger">{{ row.em_param }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="拉黑原因" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reason || "--" }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="拉黑时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" link @click="handleRemove(row)">
              <el-icon><Delete /></el-icon>
              移除
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

    <!-- 添加em对话框 -->
    <el-dialog v-model="addDialogVisible" title="添加em到黑名单" width="500px" :close-on-click-modal="false">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="90px">
        <el-form-item label="em参数" prop="em_param">
          <el-input v-model="addForm.em_param" placeholder="请输入要拉黑的em参数" clearable />
        </el-form-item>
        <el-form-item label="拉黑原因" prop="reason">
          <el-input v-model="addForm.reason" type="textarea" :rows="3" placeholder="请输入拉黑原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit" :loading="addLoading">确定添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { Search, Refresh, Plus, Delete } from "@element-plus/icons-vue";
import { getEmBlacklistApi, addEmBlacklistApi, removeEmBlacklistApi, type EmBlacklistItem } from "@/api/modules/emBlacklist";

// 响应式数据
const loading = ref(false);
const addLoading = ref(false);
const addDialogVisible = ref(false);
const addFormRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive({
  em: ""
});

// 添加表单
const addForm = reactive({
  em_param: "",
  reason: ""
});

// 添加表单校验规则
const addRules = {
  em_param: [{ required: true, message: "请输入em参数", trigger: "blur" }]
};

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<EmBlacklistItem[]>([]);

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getEmBlacklistApi({
      em: searchForm.em,
      page: pagination.current,
      size: pagination.size
    });
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取EM黑名单列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.em = "";
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

// 打开添加对话框
const handleAdd = () => {
  addForm.em_param = "";
  addForm.reason = "";
  addDialogVisible.value = true;
};

// 提交添加
const handleAddSubmit = async () => {
  if (!addFormRef.value) return;

  await addFormRef.value.validate(async valid => {
    if (!valid) return;

    addLoading.value = true;
    try {
      await addEmBlacklistApi({
        em_param: addForm.em_param.trim(),
        reason: addForm.reason || "手动添加"
      });
      ElMessage.success("em已加入黑名单");
      addDialogVisible.value = false;
      loadData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "添加失败";
      ElMessage.error(errorMsg);
    } finally {
      addLoading.value = false;
    }
  });
};

// 移除em
const handleRemove = (row: EmBlacklistItem) => {
  ElMessageBox.confirm(
    `确定要将 em "${row.em_param}" 从黑名单中移除吗？\n\n移除后，该 em 将恢复正常的斗篷判断（真人可看到正品页）。`,
    "移除确认",
    {
      confirmButtonText: "确定移除",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      await removeEmBlacklistApi({ em_param: row.em_param });
      ElMessage.success("em已从黑名单移除");
      loadData();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "移除失败";
      ElMessage.error(errorMsg);
    }
  });
};

// 组件挂载
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.em-blacklist {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.tip-alert {
  margin-bottom: 20px;
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
</style>
