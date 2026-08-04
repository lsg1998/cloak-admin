<template>
  <div class="category-page-container">
    <!-- 搜索 -->
    <el-card class="search-card" shadow="never">
      <div class="toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称 / slug / 标题"
          clearable
          style="width: 260px"
          @keyup.enter="loadData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>新建落地页
        </el-button>
        <div class="toolbar-right">
          <el-button :type="marketing.enabled ? 'warning' : 'danger'" plain @click="openMarketing">
            <el-icon><Setting /></el-icon>
            营销元素{{ marketing.enabled ? "（已开启）" : "（已全部关闭）" }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 营销元素开关 -->
    <el-dialog v-model="marketingVisible" title="分类落地页 营销元素开关" width="560px">
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
        <template #title>分类落地页对所有访客显示同一份内容</template>
        <div style="font-size: 12px; line-height: 1.6">
          广告审核员看到的就是这个页面。过度的紧迫感元素有时会被判定为"误导性内容"，
          审核出问题时可在这里一键关闭，无需改代码或下线页面。 关闭后商品图、标题、价格、折扣和订购按钮不受影响。
        </div>
      </el-alert>

      <el-form label-width="120px">
        <el-form-item label="总开关">
          <el-switch
            v-model="marketing.enabled"
            :active-value="1"
            :inactive-value="0"
            active-text="开启"
            inactive-text="全部关闭"
          />
          <div class="form-tip">关闭后，下面所有项一律不显示</div>
        </el-form-item>

        <el-divider content-position="left">单项控制</el-divider>

        <el-form-item v-for="opt in marketingOptions" :key="opt.key" :label="opt.label">
          <el-switch v-model="marketing[opt.key]" :active-value="1" :inactive-value="0" :disabled="!marketing.enabled" />
          <span class="form-tip" style="margin-left: 10px">{{ opt.tip }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="marketingVisible = false">取消</el-button>
        <el-button type="danger" plain @click="disableAllMarketing">一键全部关闭</el-button>
        <el-button type="primary" :loading="marketingSaving" @click="saveMarketing">保存</el-button>
      </template>
    </el-dialog>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="公开链接" min-width="240">
          <template #default="{ row }">
            <div class="link-cell">
              <span class="link-text">/c/{{ row.slug }}</span>
              <el-button size="small" type="primary" link @click="previewLink(row.slug)">预览</el-button>
              <el-button size="small" type="primary" link @click="copyLink(row.slug)">复制</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品数" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.item_count ?? (row.items ? row.items.length : 0) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访客(UV)" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.stats">{{ row.stats.uv }}</span>
            <span v-else class="stats-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="点击人数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.stats">{{ row.stats.click_uv }}</span>
            <span v-else class="stats-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="点击率" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.stats && row.stats.uv > 0"
              size="small"
              :type="clickRateColor(row.stats.uv_click_rate)"
              :title="statsTitle(row.stats)"
            >
              {{ row.stats.uv_click_rate }}%
            </el-tag>
            <span v-else class="stats-empty">暂无数据</span>
          </template>
        </el-table-column>
        <el-table-column label="点击后看到正品" width="130" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.stats && row.stats.clicks > 0"
              size="small"
              :type="row.stats.pass_rate >= 80 ? 'success' : row.stats.pass_rate >= 50 ? 'warning' : 'danger'"
              :title="`跳真实商品 ${row.stats.to_product} 次 / 被斗篷打回首页 ${row.stats.to_home} 次`"
            >
              {{ row.stats.pass_rate }}%
            </el-tag>
            <span v-else class="stats-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === "active" ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" link @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑分类落地页' : '新建分类落地页'"
      width="960px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="内部名称，便于识别" />
        </el-form-item>
        <el-form-item label="slug（链接）" required>
          <el-input v-model="form.slug" placeholder="仅字母数字和连字符，如 hot-sale">
            <template #prepend>/c/</template>
          </el-input>
        </el-form-item>
        <el-form-item label="页面标题">
          <el-input v-model="form.title" placeholder="合集标题，同时作为页眉品牌名" />
        </el-form-item>
        <el-form-item label="促销横幅">
          <el-input v-model="form.banner_text" placeholder="顶部橙色促销条文案，留空则用默认；如：夏季特惠 · 全场8折" />
        </el-form-item>
        <el-form-item label="斗篷规则" required>
          <el-select
            v-model="form.cloak_rule_id"
            placeholder="选择整页统一使用的斗篷规则（如西班牙规则）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option v-for="r in cloakRules" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <div class="form-tip">整页用这条规则判断地区/机器人等；未选则回退到每个真实商品各自的规则</div>
        </el-form-item>
        <el-form-item label="页面语言">
          <el-select
            v-model="form.language"
            placeholder="用于页面语言标记，每个国家建独立页"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option v-for="l in languageOptions" :key="l.value" :label="l.label" :value="l.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="仿品跳转URL">
          <el-input v-model="form.home_redirect_url" placeholder="判定为仿品流量时跳转的地址，留空则回本站根 /" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>

        <el-divider content-position="left">商品项（真人点击跳对应真实商品，仿品跳首页）</el-divider>

        <div class="items-editor">
          <div v-for="(item, index) in form.items" :key="index" class="item-row">
            <div class="item-index">{{ index + 1 }}</div>

            <!-- 自定义展示图片 -->
            <div class="item-img-col">
              <el-upload
                class="item-uploader"
                :show-file-list="false"
                :http-request="(opt: any) => handleItemUpload(opt, item)"
                accept="image/*"
              >
                <img v-if="item.image" :src="item.image" class="item-img" />
                <div v-else class="item-img-placeholder">
                  <el-icon><Plus /></el-icon>
                  <span>上传图片</span>
                </div>
              </el-upload>
            </div>

            <div class="item-fields">
              <!-- 绑定的真实商品：标题/价格/折扣前台自动取该商品，无需手填 -->
              <div class="bound-product">
                <template v-if="item.target_product_id">
                  <el-tag type="success" size="small">
                    真实商品 #{{ item.target_product_id }}
                    <template v-if="item.product_title">· {{ item.product_title }}</template>
                  </el-tag>
                  <el-button size="small" type="primary" link @click="openProductPicker(index)">更换商品</el-button>
                </template>
                <template v-else>
                  <el-button size="small" type="primary" @click="openProductPicker(index)">
                    <el-icon><Search /></el-icon>从商品列表选择真实商品
                  </el-button>
                </template>
              </div>
              <div class="form-tip">标题、价格、折扣自动取自该真实商品；图片不上传则用商品主图</div>
            </div>

            <div class="item-actions">
              <el-button size="small" :disabled="index === 0" circle @click="moveItem(index, -1)">
                <el-icon><ArrowUp /></el-icon>
              </el-button>
              <el-button size="small" :disabled="index === form.items.length - 1" circle @click="moveItem(index, 1)">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <el-button size="small" type="danger" circle @click="removeItem(index)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <el-button class="add-item-btn" @click="addItem">
            <el-icon><Plus /></el-icon>添加商品
          </el-button>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 商品选择器 -->
    <el-dialog v-model="pickerVisible" title="选择真实商品" width="800px" append-to-body destroy-on-close>
      <div class="picker-toolbar">
        <el-input
          v-model="pickerSearch"
          placeholder="搜索商品标题"
          clearable
          style="width: 220px"
          @keyup.enter="handlePickerSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="pickerCountry"
          placeholder="全部国家"
          clearable
          filterable
          style="width: 180px"
          @change="handlePickerSearch"
        >
          <el-option v-for="c in countryOptions" :key="c.country" :label="`${c.country} (${c.count})`" :value="c.country" />
        </el-select>
        <el-button type="primary" @click="handlePickerSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
      </div>

      <div v-loading="pickerLoading" class="picker-grid">
        <div v-for="p in pickerProducts" :key="p.id" class="picker-card" @click="selectProduct(p)">
          <img v-if="p.image_urls && p.image_urls[0]" :src="p.image_urls[0]" class="picker-img" />
          <div v-else class="picker-img picker-img-empty">
            <el-icon><Box /></el-icon>
          </div>
          <div class="picker-info">
            <div class="picker-title">{{ p.title }}</div>
            <div class="picker-meta">
              <span class="picker-price">¥{{ p.sell_price }}</span>
              <span class="picker-id">#{{ p.id }}</span>
            </div>
          </div>
        </div>
        <el-empty v-if="!pickerLoading && pickerProducts.length === 0" description="没有找到商品" />
      </div>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pickerPagination.current"
          v-model:page-size="pickerPagination.size"
          layout="total, prev, pager, next"
          :total="pickerPagination.total"
          @current-change="loadPickerProducts"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus, Edit, Delete, ArrowUp, ArrowDown, Box, Setting } from "@element-plus/icons-vue";
import { uploadImg } from "@/api/modules/upload";
import { getProductListApi, getProductCountryStatsApi, type Product } from "@/api/modules/product";
import { cloakRuleApi, type CloakRule } from "@/api/modules/cloakRule";
import {
  getCategoryPageListApi,
  getCategoryPageApi,
  createCategoryPageApi,
  updateCategoryPageApi,
  deleteCategoryPageApi,
  getMarketingSettingsApi,
  updateMarketingSettingsApi,
  type CategoryPage,
  type CategoryPageItem,
  type MarketingSettings
} from "@/api/modules/categoryPage";

// ==================== 营销元素开关 ====================
// 分类页对所有访客一致，广告审核员看到的就是这个页面。
// 出问题时在这里一键关闭，不用改代码、不用下线页面。
const marketingVisible = ref(false);
const marketingSaving = ref(false);
const marketing = reactive<MarketingSettings>({
  enabled: 1,
  countdown: 1,
  toast: 1,
  viewers: 1,
  hot_badge: 1,
  scarcity: 1,
  rating: 1,
  trust: 1
});

const marketingOptions: { key: keyof MarketingSettings; label: string; tip: string }[] = [
  { key: "toast", label: "最近购买弹窗", tip: "风险最高，审核有异议先关这个" },
  { key: "countdown", label: "顶部倒计时", tip: "每位访客15分钟的限时优惠" },
  { key: "viewers", label: "正在浏览人数", tip: "卡片上的“N人正在浏览”" },
  { key: "scarcity", label: "库存与今日已售", tip: "“仅剩X件”和库存进度条" },
  { key: "hot_badge", label: "热销角标", tip: "图片右上角的 🔥 最热销" },
  { key: "rating", label: "评分与评价数", tip: "★★★★★ 4.8 (1243)" },
  { key: "trust", label: "货到付款 / 免费配送", tip: "信任标签，风险最低，建议保留" }
];

const loadMarketing = async () => {
  try {
    const res = await getMarketingSettingsApi();
    if (res.code === 200 && res.data) Object.assign(marketing, res.data);
  } catch (e) {
    console.error("获取营销开关失败:", e);
  }
};

const openMarketing = async () => {
  await loadMarketing();
  marketingVisible.value = true;
};

const disableAllMarketing = () => {
  (Object.keys(marketing) as (keyof MarketingSettings)[]).forEach(k => {
    marketing[k] = 0;
  });
};

const saveMarketing = async () => {
  marketingSaving.value = true;
  try {
    const res = await updateMarketingSettingsApi({ ...marketing });
    if (res.code === 200) {
      if (res.data) Object.assign(marketing, res.data);
      ElMessage.success(marketing.enabled ? "已保存" : "已关闭全部营销元素");
      marketingVisible.value = false;
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (e) {
    console.error("保存营销开关失败:", e);
    ElMessage.error("保存失败");
  } finally {
    marketingSaving.value = false;
  }
};

// 商品卡点击率配色：越高说明落地页越吸引人
const clickRateColor = (rate: number): "success" | "warning" | "info" | "danger" => {
  if (rate >= 20) return "success";
  if (rate >= 10) return "warning";
  if (rate > 0) return "info";
  return "danger";
};

// 悬停显示统计明细
const statsTitle = (s: any) => {
  if (!s) return "";
  return [
    `统计范围：最近 ${s.days} 天`,
    `落地页访问 ${s.views} 次 / 去重访客 ${s.uv} 人`,
    `商品卡点击 ${s.clicks} 次 / 点击人数 ${s.click_uv} 人`,
    `点击率(按人) ${s.uv_click_rate}%  点击率(按次) ${s.click_rate}%`,
    `点击后：跳真实商品 ${s.to_product} 次，被斗篷打回首页 ${s.to_home} 次`
  ].join("\n");
};

// 页面语言选项（每个国家/语言建独立分类页）
const languageOptions = [
  { label: "西班牙语 (es)", value: "es" },
  { label: "意大利语 (it)", value: "it" },
  { label: "德语 (de)", value: "de" },
  { label: "法语 (fr)", value: "fr" },
  { label: "葡萄牙语 (pt)", value: "pt" },
  { label: "英语 (en)", value: "en" },
  { label: "波兰语 (pl)", value: "pl" },
  { label: "捷克语 (cs)", value: "cs" },
  { label: "斯洛伐克语 (sk)", value: "sk" },
  { label: "匈牙利语 (hu)", value: "hu" },
  { label: "荷兰语 (nl)", value: "nl" },
  { label: "日语 (ja)", value: "ja" }
];

const cloakRules = ref<CloakRule[]>([]);
const loadCloakRules = async () => {
  try {
    const { data } = await cloakRuleApi.getCloakRules({ page: 1, size: 200, is_active: 1 });
    cloakRules.value = (data as any).list || [];
  } catch (e) {
    // 忽略，下拉为空不影响其他操作
  }
};

const loading = ref(false);
const submitLoading = ref(false);
const tableData = ref<CategoryPage[]>([]);
const searchKeyword = ref("");
const dialogVisible = ref(false);

const pagination = reactive({ current: 1, size: 20, total: 0 });

type EditItem = CategoryPageItem & { product_title?: string };
type EditForm = Omit<CategoryPage, "items"> & { id: number | null; items: EditItem[] };

const defaultForm = (): EditForm => ({
  id: null,
  name: "",
  slug: "",
  title: "",
  banner_text: "",
  home_redirect_url: "",
  cloak_rule_id: null,
  language: "",
  items: [],
  status: "active"
});
const form = reactive<EditForm>(defaultForm());

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getCategoryPageListApi({
      page: pagination.current,
      size: pagination.size,
      keyword: searchKeyword.value || undefined
    });
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (e) {
    ElMessage.error("获取列表失败");
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, defaultForm());
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = async (row: CategoryPage) => {
  try {
    const { data } = await getCategoryPageApi(row.id!);
    Object.assign(form, {
      id: data.id,
      name: data.name,
      slug: data.slug,
      title: data.title || "",
      banner_text: data.banner_text || "",
      home_redirect_url: data.home_redirect_url || "",
      cloak_rule_id: data.cloak_rule_id ?? null,
      language: data.language || "",
      items: Array.isArray(data.items) ? (data.items as EditItem[]) : [],
      status: data.status || "active"
    });
    dialogVisible.value = true;
  } catch (e) {
    ElMessage.error("获取详情失败");
  }
};

const handleDelete = (row: CategoryPage) => {
  ElMessageBox.confirm(`确定删除落地页 "${row.name}" 吗？`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteCategoryPageApi(row.id!);
      ElMessage.success("删除成功");
      loadData();
    } catch (e) {
      ElMessage.error("删除失败");
    }
  });
};

const addItem = () => {
  form.items.push({ image: "", target_product_id: "", sort: form.items.length });
};

const removeItem = (index: number) => {
  form.items.splice(index, 1);
};

const moveItem = (index: number, dir: number) => {
  const target = index + dir;
  if (target < 0 || target >= form.items.length) return;
  const arr = form.items;
  [arr[index], arr[target]] = [arr[target], arr[index]];
};

const handleItemUpload = async (options: any, item: EditItem) => {
  const fd = new FormData();
  fd.append("file", options.file);
  try {
    const res: any = await uploadImg(fd);
    if (res.code === 200 && res.data?.url) {
      item.image = res.data.url;
      ElMessage.success("图片上传成功");
    } else {
      ElMessage.error("图片上传失败");
    }
  } catch (e) {
    ElMessage.error("图片上传失败");
  }
};

// ============ 商品选择器 ============
const pickerVisible = ref(false);
const pickerLoading = ref(false);
const pickerProducts = ref<Product[]>([]);
const pickerSearch = ref("");
const pickerCountry = ref("");
const pickerPagination = reactive({ current: 1, size: 12, total: 0 });
const currentItemIndex = ref(-1);
const countryOptions = ref<{ country: string; count: number }[]>([]);

const loadCountryOptions = async () => {
  if (countryOptions.value.length) return;
  try {
    const { data } = await getProductCountryStatsApi();
    countryOptions.value = (data as any).stats || [];
  } catch (e) {
    // 忽略，国家下拉为空不影响选品
  }
};

const openProductPicker = (index: number) => {
  currentItemIndex.value = index;
  pickerSearch.value = "";
  pickerCountry.value = "";
  pickerPagination.current = 1;
  pickerVisible.value = true;
  loadCountryOptions();
  loadPickerProducts();
};

const handlePickerSearch = () => {
  pickerPagination.current = 1;
  loadPickerProducts();
};

const loadPickerProducts = async () => {
  pickerLoading.value = true;
  try {
    const { data } = await getProductListApi({
      page: pickerPagination.current,
      size: pickerPagination.size,
      title: pickerSearch.value || undefined,
      country: pickerCountry.value || undefined,
      product_type: "original"
    });
    pickerProducts.value = data.list;
    pickerPagination.total = data.total;
  } catch (e) {
    ElMessage.error("加载商品失败");
  } finally {
    pickerLoading.value = false;
  }
};

const selectProduct = (p: Product) => {
  const item = form.items[currentItemIndex.value];
  if (!item) return;
  // 只绑定商品ID；标题/价格/折扣前台自动取真实商品，图片不上传则用商品主图
  item.target_product_id = String(p.id);
  item.product_title = p.title;
  pickerVisible.value = false;
  ElMessage.success("已选择商品");
};

const handleSubmit = async () => {
  if (!form.name.trim() || !form.slug.trim()) {
    ElMessage.warning("名称和 slug 不能为空");
    return;
  }
  if (!form.cloak_rule_id) {
    ElMessage.warning("请选择斗篷规则（决定整页的地区等判断）");
    return;
  }
  if (form.items.some(it => !it.target_product_id)) {
    ElMessage.warning("每个商品项都要选择一个真实商品");
    return;
  }
  form.items.forEach((it, i) => (it.sort = i));

  submitLoading.value = true;
  try {
    const payload = {
      name: form.name,
      slug: form.slug,
      title: form.title,
      banner_text: form.banner_text,
      home_redirect_url: form.home_redirect_url,
      cloak_rule_id: form.cloak_rule_id,
      language: form.language,
      items: form.items,
      status: form.status
    };
    if (form.id) {
      await updateCategoryPageApi(form.id, payload);
      ElMessage.success("更新成功");
    } else {
      await createCategoryPageApi(payload);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  } finally {
    submitLoading.value = false;
  }
};

const previewLink = (slug: string) => {
  window.open(`${location.origin}/c/${slug}`, "_blank");
};

const copyLink = (slug: string) => {
  const url = `${location.origin}/c/${slug}`;
  navigator.clipboard
    .writeText(url)
    .then(() => ElMessage.success(`已复制：${url}`))
    .catch(() => ElMessage.warning(url));
};

onMounted(() => {
  loadData();
  loadCloakRules();
  loadMarketing(); // 工具栏按钮要显示当前是开启还是已关闭
});
</script>

<style scoped>
.category-page-container {
  padding: 0;
}
.stats-empty {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.toolbar-right {
  margin-left: auto;
}
.search-card {
  margin-bottom: 12px;
}
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.link-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.link-text {
  color: #409eff;
  font-family: monospace;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.items-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.item-index {
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  flex-shrink: 0;
}
.item-img-col {
  flex-shrink: 0;
}
.item-img,
.item-img-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px dashed #dcdfe6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  cursor: pointer;
  background: #fff;
}
.item-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bound-product {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}
.add-item-btn {
  align-self: flex-start;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
  margin-top: 4px;
}
.picker-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  min-height: 200px;
}
.picker-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}
.picker-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}
.picker-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  background: #f0f0f0;
  display: block;
}
.picker-img-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 28px;
}
.picker-info {
  padding: 8px;
}
.picker-title {
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}
.picker-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.picker-price {
  color: #e4393c;
  font-weight: 700;
}
.picker-id {
  color: #909399;
  font-size: 11px;
}
</style>
