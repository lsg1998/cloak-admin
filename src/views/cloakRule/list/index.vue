<template>
  <div class="cloak-rule-list">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="规则名称">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入规则名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="模式">
          <el-select v-model="searchForm.mode" placeholder="请选择模式" clearable style="width: 150px">
            <el-option label="斗篷" value="cloak" />
            <el-option label="绿色" value="green" />
            <el-option label="全开" value="open" />
            <el-option label="审核" value="audit" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.is_active" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">斗篷规则列表</div>
        <div class="table-actions">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="tableData" stripe style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="mode" label="模式" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getModeTagType(row.mode)">
              {{ getModeText(row.mode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="google_detection_mode"
          label="谷歌检测"
          width="120"
          align="center"
          v-if="tableData.some(row => row.mode === 'cloak')"
        >
          <template #default="{ row }">
            <el-tag v-if="row.mode === 'cloak'" :type="getGoogleDetectionTagType(row.google_detection_mode)">
              {{ getGoogleDetectionText(row.google_detection_mode) }}
            </el-tag>
            <span v-else class="text-gray-400">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="target_regions" label="投放地区" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.target_regions && row.target_regions.length > 0">
              {{ row.target_regions.join(", ") }}
            </span>
            <span v-else class="text-gray-400">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="blocked_organizations" label="屏蔽组织" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.blocked_organizations && row.blocked_organizations.length > 0">
              {{ row.blocked_organizations.join(", ") }}
            </span>
            <span v-else class="text-gray-400">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="warning" size="small" @click="handleViewProducts(row)"> 查看商品 </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="cloak-rule-form">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="规则名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入规则名称" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="模式" prop="mode">
              <el-radio-group v-model="formData.mode">
                <el-tooltip content="只有投放地区客户能访问真实链接" placement="top">
                  <el-radio value="cloak">斗篷</el-radio>
                </el-tooltip>
                <el-tooltip content="所有客户访问真实链接" placement="top">
                  <el-radio value="open">全开</el-radio>
                </el-tooltip>
                <el-tooltip content="所有客户访问重定向链接" placement="top">
                  <el-radio value="green">绿色</el-radio>
                </el-tooltip>
                <el-tooltip content="所有客户访问审核页面" placement="top">
                  <el-radio value="audit">审核</el-radio>
                </el-tooltip>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="投放地区">
              <el-select
                v-model="formData.target_regions"
                multiple
                placeholder="请选择投放地区"
                style="width: 100%"
                @change="handleCountryChange"
              >
                <el-option v-for="country in countryOptions" :key="country.value" :label="country.label" :value="country.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="允许时区">
              <el-select v-model="formData.allowed_timezones" multiple placeholder="请选择允许的时区" style="width: 100%">
                <el-option
                  v-for="timezone in timezoneOptions"
                  :key="timezone.value"
                  :label="timezone.label"
                  :value="timezone.value"
                />
              </el-select>
              <div class="form-tip">选择投放地区后会自动推荐对应时区，也可手动选择</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="Referer白名单">
              <el-select
                v-model="formData.allowed_referers"
                multiple
                filterable
                allow-create
                placeholder="请输入允许的Referer来源（支持手动输入）"
                style="width: 100%"
              >
                <el-option label="youtube.com" value="youtube.com" />
                <el-option label="youtu.be" value="youtu.be" />
                <el-option label="m.youtube.com" value="m.youtube.com" />
                <el-option
                  label="android-app://com.google.android.googlequicksearchbox"
                  value="android-app://com.google.android.googlequicksearchbox"
                />
                <el-option label="facebook.com" value="facebook.com" />
                <el-option label="instagram.com" value="instagram.com" />
                <el-option label="twitter.com" value="twitter.com" />
                <el-option label="tiktok.com" value="tiktok.com" />
              </el-select>
              <div class="form-tip">
                白名单内的来源将显示正品页面。留空则使用默认白名单（YouTube、Android Google App）。可手动输入自定义域名
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.is_active">
                <el-radio :label="1">启用</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="屏蔽组织">
          <el-select
            v-model="formData.blocked_organizations"
            multiple
            filterable
            allow-create
            placeholder="请输入要屏蔽的组织关键词"
            style="width: 100%"
          >
            <el-option label="Google" value="google" />
            <el-option label="Facebook" value="facebook" />
            <el-option label="Amazon" value="amazon" />
            <el-option label="Microsoft" value="microsoft" />
            <el-option label="Cloudflare" value="cloudflare" />
          </el-select>
        </el-form-item>

        <el-form-item label="谷歌检测模式" v-if="formData.mode === 'cloak'">
          <el-radio-group v-model="googleDetectionMode" @change="updateDescription">
            <el-tooltip content="系统默认严格模式：激进过滤谷歌爬虫、审核系统、数据中心IP等" placement="top">
              <el-radio value="DEFAULT">默认(严格)</el-radio>
            </el-tooltip>
            <el-tooltip content="明确使用严格模式：检测hostname、机器人标识、数据中心IP、AS号码、可疑组织" placement="top">
              <el-radio value="GOOGLE_STRICT">谷歌(严格)</el-radio>
            </el-tooltip>
            <el-tooltip content="较温和的过滤规则：只过滤明确的谷歌机器人，不检测数据中心IP和AS号码" placement="top">
              <el-radio value="GOOGLE_LENIENT">谷歌(宽松)</el-radio>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="屏蔽PC">
              <el-radio-group v-model="formData.block_pc">
                <el-radio :label="0">未开启</el-radio>
                <el-radio :label="1">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="屏蔽代理">
              <el-radio-group v-model="formData.block_proxy">
                <el-radio :label="0">未开启</el-radio>
                <el-radio :label="1">开启</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="屏蔽空Referer">
              <el-radio-group v-model="formData.block_empty_referer">
                <el-radio :label="0">未开启</el-radio>
                <el-radio :label="1">开启</el-radio>
              </el-radio-group>
              <div class="form-tip">开启后，无referer的访问将显示仿品</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="em访问次数限制">
          <el-input-number
            v-model="formData.em_visit_limit"
            :min="0"
            :max="1000"
            :step="1"
            placeholder="0表示不启用"
            style="width: 200px"
          />
          <div class="form-tip" style="color: #e6a23c; margin-top: 8px">
            <el-icon><InfoFilled /></el-icon>
            当URL包含em参数时，前N次访问强制显示仿品页。计数存储在Redis，10天过期。设置为0或留空则不启用此功能。
          </div>
          <div class="form-tip" style="color: #909399; margin-top: 4px">
            示例：设置为10，则 em=ChenmSonwBaol 的前10次访问都显示仿品页，第11次开始按正常斗篷规则判断。
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { cloakRuleApi, type CloakRule, type CloakRuleFormData } from "@/api/modules/cloakRule";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();

// 谷歌检测模式
const googleDetectionMode = ref("DEFAULT");

// 国家选项（与商品管理保持一致）
const countryOptions = [
  { label: "日本", value: "JA" },
  { label: "中国", value: "ZH" },
  { label: "英国", value: "EN" },
  { label: "斯洛伐克", value: "SK" },
  { label: "斯洛文尼亚", value: "SI" },
  { label: "波兰", value: "PL" },
  { label: "葡萄牙", value: "PT" },
  { label: "匈牙利", value: "HU" },
  { label: "意大利", value: "IT" },
  { label: "西班牙", value: "ES" },
  { label: "捷克", value: "CZ" },
  { label: "立陶宛", value: "LT" },
  { label: "拉脱维亚", value: "LV" },
  { label: "克罗地亚", value: "HR" }
];

// 时区选项
const timezoneOptions = [
  { label: "亚洲/东京 (日本)", value: "Asia/Tokyo" },
  { label: "亚洲/上海 (中国)", value: "Asia/Shanghai" },
  { label: "欧洲/伦敦 (英国)", value: "Europe/London" },
  { label: "欧洲/布拉迪斯拉发 (斯洛伐克)", value: "Europe/Bratislava" },
  { label: "欧洲/卢布尔雅那 (斯洛文尼亚)", value: "Europe/Ljubljana" },
  { label: "欧洲/华沙 (波兰)", value: "Europe/Warsaw" },
  { label: "欧洲/里斯本 (葡萄牙)", value: "Europe/Lisbon" },
  { label: "欧洲/布达佩斯 (匈牙利)", value: "Europe/Budapest" },
  { label: "欧洲/罗马 (意大利)", value: "Europe/Rome" },
  { label: "欧洲/马德里 (西班牙)", value: "Europe/Madrid" },
  { label: "欧洲/布拉格 (捷克)", value: "Europe/Prague" },
  { label: "欧洲/维尔纽斯 (立陶宛)", value: "Europe/Vilnius" },
  { label: "欧洲/里加 (拉脱维亚)", value: "Europe/Riga" },
  { label: "欧洲/萨格勒布 (克罗地亚)", value: "Europe/Zagreb" },
  { label: "美国/纽约 (美国东部)", value: "America/New_York" },
  { label: "美国/洛杉矶 (美国西部)", value: "America/Los_Angeles" },
  { label: "欧洲/巴黎 (法国)", value: "Europe/Paris" },
  { label: "欧洲/柏林 (德国)", value: "Europe/Berlin" },
  { label: "亚洲/首尔 (韩国)", value: "Asia/Seoul" },
  { label: "亚洲/新加坡 (新加坡)", value: "Asia/Singapore" },
  { label: "澳大利亚/悉尼 (澳大利亚)", value: "Australia/Sydney" }
];

// 国家到时区的映射
const countryToTimezoneMap = {
  JA: "Asia/Tokyo",
  ZH: "Asia/Shanghai",
  EN: "Europe/London",
  SK: "Europe/Bratislava",
  SI: "Europe/Ljubljana",
  PL: "Europe/Warsaw",
  PT: "Europe/Lisbon",
  HU: "Europe/Budapest",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  CZ: "Europe/Prague",
  LT: "Europe/Vilnius",
  LV: "Europe/Riga",
  HR: "Europe/Zagreb"
};

// 搜索表单
const searchForm = reactive({
  name: "",
  mode: "",
  is_active: undefined as number | undefined
});

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<CloakRule[]>([]);
const selectedRows = ref<CloakRule[]>([]);

// 表单数据
const formData = reactive<CloakRuleFormData>({
  name: "",
  target_regions: [],
  mode: "cloak",
  google_detection_mode: "DEFAULT",
  spider_whitelist: [],
  block_pc: 0,
  block_proxy: 0,
  block_empty_referer: 0,
  blocked_keywords: [],
  allowed_countries: [],
  blocked_countries: [],
  allowed_organizations: [],
  blocked_organizations: [],
  allowed_timezones: [],
  allowed_referers: [],
  description: "",
  em_visit_limit: 0,
  is_active: 1
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: "请输入规则名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  mode: [{ required: true, message: "请选择模式", trigger: "change" }]
};

// 获取模式标签类型
const getModeTagType = (mode: string) => {
  const typeMap = {
    cloak: "warning",
    green: "success",
    open: "info",
    audit: "danger"
  };
  return typeMap[mode] || "info";
};

// 获取模式文本
const getModeText = (mode: string) => {
  const textMap = {
    cloak: "斗篷",
    green: "绿色",
    open: "全开",
    audit: "审核"
  };
  return textMap[mode] || mode;
};

// 获取谷歌检测模式标签类型
const getGoogleDetectionTagType = (mode: string) => {
  const typeMap = {
    DEFAULT: "info",
    GOOGLE_STRICT: "danger",
    GOOGLE_LENIENT: "success"
  };
  return typeMap[mode] || "info";
};

// 获取谷歌检测模式文本
const getGoogleDetectionText = (mode: string) => {
  const textMap = {
    DEFAULT: "默认(严格)",
    GOOGLE_STRICT: "严格",
    GOOGLE_LENIENT: "宽松"
  };
  return textMap[mode] || mode;
};

// 更新description字段以包含谷歌检测模式
const updateDescription = () => {
  let description = formData.description || "";

  // 移除之前的谷歌检测模式标记
  description = description.replace(/\[GOOGLE_\w+\]/g, "");

  // 添加新的谷歌检测模式标记
  if (googleDetectionMode.value !== "DEFAULT") {
    description = `[${googleDetectionMode.value}] ${description}`.trim();
  }

  formData.description = description;
};

// 从description中解析谷歌检测模式
const parseGoogleDetectionMode = (description: string) => {
  if (description.includes("GOOGLE_STRICT")) {
    return "GOOGLE_STRICT";
  } else if (description.includes("GOOGLE_LENIENT")) {
    return "GOOGLE_LENIENT";
  }
  return "DEFAULT";
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取斗篷规则列表
const getCloakRules = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    };

    const response = await cloakRuleApi.getCloakRules(params);
    if (response.code === 200) {
      tableData.value = response.data.list;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error("获取斗篷规则列表失败:", error);
    ElMessage.error("获取斗篷规则列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  getCloakRules();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: "",
    mode: "",
    is_active: null
  });
  handleSearch();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
  getCloakRules();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  getCloakRules();
};

// 选择改变
const handleSelectionChange = (selection: CloakRule[]) => {
  selectedRows.value = selection;
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新增斗篷规则";
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: CloakRule) => {
  dialogTitle.value = "编辑斗篷规则";
  Object.assign(formData, {
    ...row,
    target_regions: row.target_regions || [],
    spider_whitelist: row.spider_whitelist || [],
    blocked_keywords: row.blocked_keywords || [],
    allowed_countries: row.allowed_countries || [],
    blocked_countries: row.blocked_countries || [],
    allowed_organizations: row.allowed_organizations || [],
    blocked_organizations: row.blocked_organizations || []
  });

  // 解析谷歌检测模式
  googleDetectionMode.value = parseGoogleDetectionMode(row.description || "");

  dialogVisible.value = true;
};

// 查看使用该规则的商品
const handleViewProducts = async (row: CloakRule) => {
  try {
    // 这里可以跳转到商品管理页面，并筛选使用该斗篷规则的商品
    // 或者打开一个对话框显示相关商品
    ElMessage.info(`查看使用规则"${row.name}"的商品功能待实现`);
  } catch (error) {
    console.error("查看商品失败:", error);
    ElMessage.error("查看商品失败");
  }
};

// 删除
const handleDelete = async (row: CloakRule) => {
  try {
    await ElMessageBox.confirm(`确定要删除规则"${row.name}"吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const response = await cloakRuleApi.deleteCloakRule(row.id);
    if (response.code === 200) {
      ElMessage.success("删除成功");
      getCloakRules();
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除斗篷规则失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 处理国家变化
const handleCountryChange = (selectedCountries: string[]) => {
  // 根据选择的国家自动推荐对应的时区
  const recommendedTimezones: string[] = [];

  selectedCountries.forEach(country => {
    const timezone = countryToTimezoneMap[country];
    if (timezone && !recommendedTimezones.includes(timezone)) {
      recommendedTimezones.push(timezone);
    }
  });

  // 如果当前时区列表为空，或者用户没有手动选择过时区，则自动设置推荐的时区
  if (formData.allowed_timezones.length === 0 || recommendedTimezones.length > 0) {
    formData.allowed_timezones = recommendedTimezones;
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: "",
    target_regions: [],
    mode: "cloak",
    spider_whitelist: [],
    block_pc: 0,
    block_proxy: 0,
    block_empty_referer: 0,
    blocked_keywords: [],
    allowed_countries: [],
    blocked_countries: [],
    allowed_organizations: [],
    blocked_organizations: [],
    allowed_timezones: [],
    allowed_referers: [],
    redirect_url: "",
    audit_url: "",
    description: "",
    em_visit_limit: 0,
    is_active: 1
  });

  // 重置谷歌检测模式
  googleDetectionMode.value = "DEFAULT";

  formRef.value?.clearValidate();
};

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    // 在提交前更新description以包含谷歌检测模式
    updateDescription();

    submitLoading.value = true;

    const isEdit = dialogTitle.value.includes("编辑");
    let response;

    if (isEdit) {
      const id = formData.id as number;
      response = await cloakRuleApi.updateCloakRule(id, formData);
    } else {
      response = await cloakRuleApi.createCloakRule(formData);
    }

    if (response.code === 200) {
      ElMessage.success(isEdit ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      getCloakRules();
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("提交失败");
  } finally {
    submitLoading.value = false;
  }
};

// 对话框关闭
const handleDialogClose = () => {
  resetForm();
};

// 组件挂载
onMounted(() => {
  getCloakRules();
});
</script>

<style scoped>
.cloak-rule-list {
  padding: 20px;
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
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.cloak-rule-form {
  max-height: 600px;
  overflow-y: auto;
}

.dialog-footer {
  text-align: right;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
