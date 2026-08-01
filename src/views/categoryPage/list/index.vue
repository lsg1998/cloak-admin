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
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="公开链接" min-width="240">
          <template #default="{ row }">
            <div class="link-cell">
              <span class="link-text">/c/{{ row.slug }}</span>
              <el-button size="small" type="primary" link @click="copyLink(row.slug)">复制</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="商品数" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.item_count ?? (row.items ? row.items.length : 0) }}</el-tag>
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
          <el-input v-model="form.title" placeholder="展示在页面顶部" />
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
              <!-- 绑定的真实商品 -->
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
              <el-input v-model="item.title" placeholder="展示标题（默认取商品标题，可自定义）" size="small" />
              <el-input v-model="item.price" placeholder="展示价格，如 ¥29.90（可自定义）" size="small" />
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
          style="width: 240px"
          @keyup.enter="loadPickerProducts"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadPickerProducts">
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
import { Search, Plus, Edit, Delete, ArrowUp, ArrowDown, Box } from "@element-plus/icons-vue";
import { uploadImg } from "@/api/modules/upload";
import { getProductListApi, type Product } from "@/api/modules/product";
import {
  getCategoryPageListApi,
  getCategoryPageApi,
  createCategoryPageApi,
  updateCategoryPageApi,
  deleteCategoryPageApi,
  type CategoryPage,
  type CategoryPageItem
} from "@/api/modules/categoryPage";

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
  home_redirect_url: "",
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
      home_redirect_url: data.home_redirect_url || "",
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
  form.items.push({ image: "", title: "", price: "", target_product_id: "", target_url: "", sort: form.items.length });
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
const pickerPagination = reactive({ current: 1, size: 12, total: 0 });
const currentItemIndex = ref(-1);

const openProductPicker = (index: number) => {
  currentItemIndex.value = index;
  pickerSearch.value = "";
  pickerPagination.current = 1;
  pickerVisible.value = true;
  loadPickerProducts();
};

const loadPickerProducts = async () => {
  pickerLoading.value = true;
  try {
    const { data } = await getProductListApi({
      page: pickerPagination.current,
      size: pickerPagination.size,
      title: pickerSearch.value || undefined,
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
  item.target_product_id = String(p.id);
  item.product_title = p.title;
  // 展示标题/价格默认取商品的（可再自定义）；图片仅在未自定义时带入商品图，保留用户上传的自定义图
  if (!item.title) item.title = p.title;
  if (!item.price && p.sell_price) item.price = `¥${p.sell_price}`;
  if (!item.image && p.image_urls && p.image_urls[0]) item.image = p.image_urls[0];
  pickerVisible.value = false;
  ElMessage.success("已选择商品");
};

const handleSubmit = async () => {
  if (!form.name.trim() || !form.slug.trim()) {
    ElMessage.warning("名称和 slug 不能为空");
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
      home_redirect_url: form.home_redirect_url,
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

const copyLink = (slug: string) => {
  const url = `${location.origin}/c/${slug}`;
  navigator.clipboard
    .writeText(url)
    .then(() => ElMessage.success(`已复制：${url}`))
    .catch(() => ElMessage.warning(url));
};

onMounted(loadData);
</script>

<style scoped>
.category-page-container {
  padding: 0;
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
