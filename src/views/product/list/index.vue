<template>
  <div class="product-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="商品标题">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入商品标题"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="上架" value="active" />
            <el-option label="下架" value="inactive" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品类型">
          <el-select v-model="searchForm.product_type" placeholder="请选择类型" clearable style="width: 120px">
            <el-option label="全部" value="">
              <el-tag type="info" size="small">全部</el-tag>
            </el-option>
            <el-option label="正品" value="original">
              <el-tag type="success" size="small">正品</el-tag>
            </el-option>
            <el-option label="仿品" value="fake">
              <el-tag type="warning" size="small">仿品</el-tag>
            </el-option>
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

    <!-- 数据表格卡片 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
            <span>商品列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        :header-cell-style="{ background: '#f8f9fa', color: '#606266' }"
      >
        <el-table-column prop="title" label="商品标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar :size="40" class="product-avatar" v-if="row.image_urls && row.image_urls[0]">
                <img :src="row.image_urls[0]" :alt="row.title" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="40" class="product-avatar" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-details">
                <div class="product-title">{{ row.title }}</div>
                <div class="product-subtitle">{{ row.sell_price ? "¥" + row.sell_price : "暂未定价" }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sell_price" label="销售价" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.sell_price" style="font-weight: bold; color: #ef3f52"> ¥{{ row.sell_price }} </span>
            <span v-else style="color: #999999">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="origin_price" label="原价" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.origin_price && row.origin_price > 0" style="color: #666666; text-decoration: line-through">
              ¥{{ row.origin_price }}
            </span>
            <span v-else style="color: #999999">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.discount && row.discount > 0" type="success" size="small"> {{ row.discount }}% OFF </el-tag>
            <span v-else style="color: #999999">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="product_type" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.product_type === 'original' ? 'success' : 'warning'" size="small">
              {{ row.product_type === "original" ? "正品" : "仿品" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联关系" width="150" align="center">
          <template #default="{ row }">
            <!-- 正品显示关联的仿品 -->
            <div v-if="row.product_type === 'original'">
              <div v-if="getFakeProductsForOriginal(row.id).length > 0">
                <el-tooltip
                  v-for="fakeProduct in getFakeProductsForOriginal(row.id)"
                  :key="fakeProduct.id"
                  :content="`仿品: ${fakeProduct.title}`"
                  placement="top"
                >
                  <el-tag type="warning" size="small" style="margin: 2px; cursor: pointer" @click="handleView(fakeProduct)">
                    仿品
                  </el-tag>
                </el-tooltip>
              </div>
              <span v-else style="color: #999999">-</span>
            </div>
            <!-- 仿品显示关联的正品 -->
            <div v-else-if="row.b_page_product_id">
              <el-tooltip :content="`关联正品: ${getOriginalProductTitle(row.b_page_product_id)}`" placement="top">
                <el-tag type="info" size="small" style="cursor: pointer" @click="handleViewOriginal(row.b_page_product_id)">
                  已关联
                </el-tag>
              </el-tooltip>
            </div>
            <span v-else style="color: #f56c6c">未关联</span>
          </template>
        </el-table-column>
        <el-table-column prop="country" label="国家" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.country || "JA" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cloak_rule_name" label="斗篷规则" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.cloak_rule_name">
              <el-tooltip :content="`规则: ${row.cloak_rule_name}`" placement="top">
                <el-tag :type="getModeTagType(row.cloak_rule_mode)" size="small">
                  {{ row.cloak_rule_name }}
                </el-tag>
              </el-tooltip>
            </div>
            <span v-else style="color: #999999">未设置</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="100" align="center">
          <template #default="{ row }">
            <div class="count-info">
              <el-icon class="count-icon"><View /></el-icon>
              <span>{{ row.view_count || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sale_count" label="销量" width="100" align="center">
          <template #default="{ row }">
            <div class="count-info">
              <el-icon class="count-icon"><ShoppingCart /></el-icon>
              <span>{{ row.sale_count || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="time-info">
              <el-icon class="time-icon"><Calendar /></el-icon>
              <span>{{ row.created_at }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button size="small" type="success" link @click="handleManageSkus(row)">
                <el-icon><Setting /></el-icon>
                SKU管理
              </el-button>
              <el-button v-if="row.product_type === 'original'" size="small" type="info" link @click="handleSetFakeProduct(row)">
                <el-icon><Plus /></el-icon>
                关联仿品
              </el-button>
              <el-button size="small" type="warning" link @click="handleEdit(row)">
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
      :title="dialogTitle"
      :fullscreen="true"
      :close-on-click-modal="false"
      destroy-on-close
      class="product-dialog"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="product-form">
        <el-form-item label="SPU ID">
          <el-input v-model="form.spu_id" placeholder="保存后生成" readonly />
          <div class="form-tip">SPU ID由后端自动生成，创建商品后自动显示</div>
        </el-form-item>
        <el-form-item label="商品标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入商品标题" />
        </el-form-item>

        <!-- 价格信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="sell_price">
              <el-input-number
                v-model="form.sell_price"
                :precision="2"
                :min="0"
                placeholder="请输入销售价格"
                style="width: 100%"
                @change="calculateProductDiscount"
              >
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="origin_price">
              <el-input-number
                v-model="form.origin_price"
                :precision="2"
                :min="0"
                placeholder="请输入原价"
                style="width: 100%"
                @change="calculateProductDiscount"
              >
                <template #append>元</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣(%)" prop="discount">
              <el-input-number
                v-model="form.discount"
                :precision="0"
                :min="0"
                :max="100"
                placeholder="自动计算"
                style="width: 100%"
                @change="calculateProductPrice"
              >
                <template #append>%</template>
              </el-input-number>
              <div class="form-tip">输入销售价和原价后自动计算，或手动输入折扣</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="上架" value="active">
                  <el-tag type="success" size="small">上架</el-tag>
                </el-option>
                <el-option label="下架" value="inactive">
                  <el-tag type="danger" size="small">下架</el-tag>
                </el-option>
                <el-option label="草稿" value="draft">
                  <el-tag type="warning" size="small">草稿</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 商品类型和关联设置 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品类型" prop="product_type">
              <el-radio-group v-model="form.product_type" @change="handleProductTypeChange">
                <el-radio value="original">
                  <el-tag type="success" size="small">正品</el-tag>
                  正品商品
                </el-radio>
                <el-radio value="fake">
                  <el-tag type="warning" size="small">仿品</el-tag>
                  仿品商品
                </el-radio>
              </el-radio-group>
              <div class="form-tip">正品：用户默认看到的商品；仿品：替代展示的商品</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.product_type === 'fake'" label="关联正品" prop="b_page_product_id">
              <el-select
                v-model="form.b_page_product_id"
                placeholder="请选择对应的正品商品"
                filterable
                remote
                :remote-method="searchOriginalProducts"
                :loading="originalProductsLoading"
                style="width: 100%"
              >
                <el-option
                  v-for="product in originalProducts"
                  :key="product.id"
                  :label="`${product.title} - ¥${product.sell_price}`"
                  :value="product.id"
                >
                  <div style="display: flex; align-items: center; justify-content: space-between">
                    <span>{{ product.title }}</span>
                    <span style="font-size: 12px; color: #999999">¥{{ product.sell_price }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="form-tip">选择这个仿品对应的正品商品</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 国家选择和斗篷规则 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标国家" prop="country">
              <el-select v-model="form.country" placeholder="请选择目标国家" style="width: 100%">
                <el-option v-for="country in countryOptions" :key="country.value" :label="country.label" :value="country.value" />
              </el-select>
              <div class="form-tip">选择商品投放的目标国家/地区</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="斗篷规则" prop="cloak_rule_id">
              <el-select
                v-model="form.cloak_rule_id"
                placeholder="请选择斗篷规则"
                clearable
                filterable
                style="width: 100%"
                @change="handleCloakRuleChange"
                :loading="cloakRulesLoading"
              >
                <el-option
                  v-for="rule in cloakRules"
                  :key="rule.id"
                  :label="`${rule.name} (${getModeText(rule.mode)})`"
                  :value="rule.id"
                >
                  <div style="display: flex; align-items: center; justify-content: space-between">
                    <span>{{ rule.name }}</span>
                    <el-tag :type="getModeTagType(rule.mode)" size="small">
                      {{ getModeText(rule.mode) }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
              <div class="form-tip">选择商品使用的斗篷规则，控制不同用户看到的内容</div>
              <div class="form-tip" style="color: #909399; font-size: 12px">当前加载了 {{ cloakRules.length }} 个斗篷规则</div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 商品图片 -->
        <el-form-item label="商品图片" prop="image_urls">
          <el-upload
            class="upload-demo"
            drag
            :action="uploadUrl"
            multiple
            :file-list="imageFiles"
            :before-upload="beforeImageUpload"
            :on-success="handleImageUploadSuccess"
            :on-remove="handleImageRemove"
            :on-error="handleImageUploadError"
            list-type="picture-card"
            accept="image/*"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <!-- 商品描述富文本编辑器 -->
        <el-form-item label="商品描述" prop="rich_text_content">
          <div :class="['wang-editor-wrapper', isEditorFullscreen ? 'fullscreen' : '']">
            <WangEditor
              :value="form.rich_text_content || ''"
              :height="editorHeight"
              :editor-config="wangEditorConfig"
              @update:value="handleWangEditorChange"
            />
            <div class="editor-controls">
              <el-button size="small" @click="toggleEditorSize" title="调整编辑器大小">
                <el-icon><ScaleToOriginal v-if="isEditorFullscreen" /><FullScreen v-else /></el-icon>
                {{ isEditorFullscreen ? "恢复" : "全屏编辑" }}
              </el-button>
              <el-button size="small" @click="clearRichTextContent" title="清空内容">
                <el-icon><Delete /></el-icon>
                清空内容
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- SKU管理对话框 -->
    <el-dialog v-model="skuDialogVisible" title="SKU管理" width="1200px" :close-on-click-modal="false" destroy-on-close>
      <div class="sku-management">
        <!-- SKU列表 -->
        <div class="sku-list-section">
          <div class="section-header">
            <h3>SKU列表</h3>
            <el-button type="primary" @click="handleAddSku">
              <el-icon><Plus /></el-icon>
              添加SKU
            </el-button>
          </div>

          <el-table :data="skuList" v-loading="skuLoading" stripe border style="width: 100%">
            <el-table-column label="图片" width="80" align="center">
              <template #default="{ row }">
                <el-avatar :size="50" class="sku-avatar" v-if="row.main_image">
                  <img :src="row.main_image" :alt="row.sku_name" style="width: 100%; height: 100%; object-fit: cover" />
                </el-avatar>
                <el-avatar :size="50" class="sku-avatar" v-else>
                  <el-icon><Box /></el-icon>
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="sku_code" label="SKU编码" width="120" />
            <el-table-column prop="sku_name" label="SKU名称" width="150" />
            <el-table-column label="属性组合" min-width="200">
              <template #default="{ row }">
                <div class="sku-attributes">
                  <el-tag v-for="attr in row.attributes" :key="attr.attribute_name" size="small" class="attr-tag">
                    {{ attr.display_name }}: {{ attr.display_value }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="sell_price" label="销售价格" width="100" align="center">
              <template #default="{ row }">
                <span class="price">¥{{ row.sell_price }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="discount_percent" label="折扣" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.discount_percent && row.discount_percent > 0" type="success" size="small">
                  {{ row.discount_percent }}%
                </el-tag>
                <span v-else style="color: #999999">--</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock_quantity" label="库存" width="80" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getSkuStatusType(row.status)" size="small">
                  {{ getSkuStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="handleEditSku(row)">编辑</el-button>
                <el-button size="small" type="danger" link @click="handleDeleteSku(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 添加/编辑SKU对话框 -->
    <el-dialog v-model="skuFormDialogVisible" :title="skuFormTitle" width="800px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="skuForm" :rules="skuRules" ref="skuFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="SKU编码" prop="sku_code">
              <el-input v-model="skuForm.sku_code" placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SKU名称" prop="sku_name">
              <el-input v-model="skuForm.sku_name" placeholder="请输入SKU名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="sell_price">
              <el-input-number
                v-model="skuForm.sell_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateSkuDiscount"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="原价" prop="origin_price">
              <el-input-number
                v-model="skuForm.origin_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateSkuDiscount"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="折扣(%)" prop="discount_percent">
              <el-input-number
                v-model="skuForm.discount_percent"
                :min="0"
                :max="100"
                :precision="0"
                style="width: 100%"
                @change="calculateSkuPrice"
              >
                <template #append>%</template>
              </el-input-number>
              <div class="form-tip">输入销售价和原价后自动计算，或手动输入折扣</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本价" prop="cost_price">
              <el-input-number v-model="skuForm.cost_price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="库存数量" prop="stock_quantity">
              <el-input-number v-model="skuForm.stock_quantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警库存" prop="warning_stock">
              <el-input-number v-model="skuForm.warning_stock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="SKU图片" prop="main_image">
          <ProductImg
            v-model:image-url="skuForm.main_image"
            :file-size="2"
            :file-type="['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']"
            :drag="true"
            width="120px"
            height="120px"
          />
        </el-form-item>

        <el-form-item label="SKU规格" prop="attributes">
          <div class="sku-specs">
            <!-- 规格说明 -->
            <el-alert title="规格设置说明" type="info" :closable="false" show-icon style="margin-bottom: 16px">
              <template #default>
                <div>
                  <p>• 每个SKU的同一属性只能设置一个值（如：颜色只能是红色或蓝色，不能同时是两种）</p>
                  <p>• 不同的属性值组合应该创建不同的SKU</p>
                  <p>• 示例：颜色=红色，尺寸=L 为一个SKU；颜色=蓝色，尺寸=L 为另一个SKU</p>
                </div>
              </template>
            </el-alert>

            <!-- 添加新规格 -->
            <div class="add-spec-form">
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input v-model="newSpecName" placeholder="规格名称，如：颜色" :maxlength="20" show-word-limit />
                </el-col>
                <el-col :span="12">
                  <el-input v-model="newSpecValue" placeholder="规格值，如：红色" :maxlength="50" show-word-limit />
                </el-col>
                <el-col :span="4">
                  <el-button type="primary" @click="addSkuSpec" :disabled="!newSpecName || !newSpecValue">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </el-col>
              </el-row>
            </div>

            <!-- 显示已有规格 -->
            <div v-if="skuSpecs.length > 0" class="specs-list">
              <el-divider content-position="left">已添加的规格</el-divider>
              <div class="specs-grid">
                <div v-for="(spec, index) in skuSpecs" :key="index" class="spec-item">
                  <div class="spec-content">
                    <span class="spec-name">{{ spec.name }}</span>
                    <el-tag type="primary" size="small">{{ spec.value }}</el-tag>
                  </div>
                  <el-button size="small" type="danger" link @click="removeSkuSpec(index)" icon="Delete"> 删除 </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="主图设置" prop="main_image">
          <div class="image-input-section">
            <!-- 图片输入方式选择 -->
            <div class="input-mode-selector">
              <el-radio-group v-model="imageInputMode" @change="handleImageInputModeChange">
                <el-radio value="url">
                  <el-icon><Link /></el-icon>
                  URL输入
                </el-radio>
                <el-radio value="upload">
                  <el-icon><UploadFilled /></el-icon>
                  文件上传
                </el-radio>
              </el-radio-group>
            </div>

            <!-- URL输入模式 -->
            <div v-if="imageInputMode === 'url'" class="url-input-mode">
              <el-input v-model="skuForm.main_image" placeholder="请输入图片URL地址" clearable>
                <template #prepend>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <!-- URL预览 -->
              <div v-if="skuForm.main_image" class="url-preview">
                <el-image
                  :src="skuForm.main_image"
                  fit="cover"
                  style="width: 80px; height: 80px; border-radius: 4px"
                  :preview-src-list="[skuForm.main_image]"
                  preview-teleported
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>

            <!-- 文件上传模式 -->
            <div v-if="imageInputMode === 'upload'" class="upload-mode">
              <ProductImg
                v-model:image-url="skuForm.main_image"
                :height="'120px'"
                :width="'120px'"
                :file-size="2"
                :file-type="['image/jpeg', 'image/png', 'image/gif', 'image/webp']"
              >
                <template #tip>
                  <div class="upload-tip">支持 JPG、PNG、GIF、WebP 格式，文件大小不超过 2MB</div>
                </template>
              </ProductImg>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="skuFormDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitSku" :loading="skuSubmitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 关联仿品对话框 -->
    <el-dialog
      v-model="fakeProductDialogVisible"
      title="选择关联仿品"
      width="1000px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="fake-product-selection">
        <!-- 当前正品信息 -->
        <el-card class="current-product-card" shadow="never">
          <template #header>
            <span style="font-weight: 600; color: #409eff">当前正品商品</span>
          </template>
          <div v-if="currentOriginalProduct" class="product-summary">
            <el-avatar :size="60" v-if="currentOriginalProduct.image_urls && currentOriginalProduct.image_urls[0]">
              <img
                :src="currentOriginalProduct.image_urls[0]"
                :alt="currentOriginalProduct.title"
                style="width: 100%; height: 100%; object-fit: cover"
              />
            </el-avatar>
            <el-avatar :size="60" v-else>
              <el-icon><Box /></el-icon>
            </el-avatar>
            <div class="product-info">
              <div class="product-title">{{ currentOriginalProduct.title }}</div>
              <div class="product-price">¥{{ currentOriginalProduct.sell_price }}</div>
              <el-tag type="success" size="small">正品</el-tag>
            </div>
          </div>
        </el-card>

        <!-- 仿品选择区域 -->
        <el-card class="fake-selection-card" shadow="never">
          <template #header>
            <div style="display: flex; align-items: center; justify-content: space-between">
              <span style="font-weight: 600">选择要关联的仿品</span>
              <el-button type="primary" size="small" @click="handleCreateNewFake">
                <el-icon><Plus /></el-icon>
                创建新仿品
              </el-button>
            </div>
          </template>

          <!-- 搜索框 -->
          <div class="search-section">
            <el-input
              v-model="fakeSearchKeyword"
              placeholder="搜索仿品商品..."
              clearable
              @input="searchFakeProducts"
              style="width: 300px"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 仿品列表 -->
          <div v-loading="fakeProductsLoading" class="fake-products-grid">
            <div
              v-for="product in fakeProducts"
              :key="product.id"
              :class="['fake-product-card', { active: selectedFakeProductId === product.id }]"
              @click="selectedFakeProductId = product.id"
            >
              <el-avatar :size="28" v-if="product.image_urls && product.image_urls[0]">
                <img :src="product.image_urls[0]" :alt="product.title" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="28" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="card-content">
                <div class="card-title">{{ product.title }}</div>
                <div class="card-price">¥{{ product.sell_price }}</div>
                <el-tag type="warning" size="small" style="padding: 1px 4px; font-size: 10px">仿品</el-tag>
              </div>
              <div class="card-check">
                <el-radio :value="product.id" v-model="selectedFakeProductId"></el-radio>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!fakeProductsLoading && fakeProducts.length === 0" class="empty-state">
              <el-empty description="暂无可关联的仿品商品" />
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="fakeProducts.length > 0" class="fake-pagination">
            <el-pagination
              v-model:current-page="fakePagination.current"
              v-model:page-size="fakePagination.size"
              :page-sizes="[12, 24, 48]"
              :total="fakePagination.total"
              layout="total, sizes, prev, pager, next"
              @size-change="handleFakeSizeChange"
              @current-change="handleFakeCurrentChange"
              small
            />
          </div>
        </el-card>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="fakeProductDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmFakeLink" :disabled="!selectedFakeProductId"> 确定关联 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="ProductList">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Box,
  Search,
  Refresh,
  Calendar,
  Edit,
  Delete,
  View,
  ShoppingCart,
  Setting,
  FullScreen,
  ScaleToOriginal,
  UploadFilled,
  Link,
  Picture
} from "@element-plus/icons-vue";
import {
  getProductListApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
  getOriginalProductsApi,
  updateFakeProductLinkApi,
  type Product,
  type ProductListParams
} from "@/api/modules/product";
import { getProductSkusApi, createSkuApi, updateSkuApi, deleteSkuApi, type ProductSku } from "@/api/modules/productSku";
import { cloakRuleApi, type CloakRule } from "@/api/modules/cloakRule";
import WangEditor from "@/components/WangEditor/index.vue";
import ProductImg from "@/components/Upload/ProductImg.vue";

// 响应式数据
const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref();

// SKU相关数据
const skuDialogVisible = ref(false);
const skuFormDialogVisible = ref(false);
const skuFormTitle = ref("");
const skuLoading = ref(false);
const skuSubmitLoading = ref(false);
const skuFormRef = ref();
const currentProduct = ref<Product | null>(null);
const skuList = ref<ProductSku[]>([]);
// 简化的SKU规格数据
const newSpecName = ref("");
const newSpecValue = ref("");
const skuSpecs = ref<Array<{ name: string; value: string }>>([]);
// 图片输入模式
const imageInputMode = ref("url");

// 搜索表单
const searchForm = reactive({
  title: "",
  status: null,
  product_type: "" // 默认显示全部
});

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<Product[]>([]);

// 斗篷规则数据
const cloakRules = ref<CloakRule[]>([]);
const cloakRulesLoading = ref(false);

// 表单数据
const form = reactive({
  id: null,
  spu_id: "",
  title: "",
  sell_price: 0,
  origin_price: 0,
  discount: 0,
  image_urls: [] as string[],
  rich_text_content: "",
  specification_list: [] as any[],
  variants: [] as any[],
  status: "active",
  product_type: "original" as "original" | "fake",
  b_page_product_id: "",
  cloak_rule_id: null as number | null,
  country: "JA"
});

// 辅助输入字段
const imageFiles = ref([]);

// 正品商品列表（供仿品选择）
const originalProducts = ref<Product[]>([]);
const originalProductsLoading = ref(false);

// 仿品关联对话框相关
const fakeProductDialogVisible = ref(false);
const currentOriginalProduct = ref<Product | null>(null);
const fakeProducts = ref<Product[]>([]);
const fakeProductsLoading = ref(false);
const selectedFakeProductId = ref("");
const fakeSearchKeyword = ref("");

// 仿品列表分页
const fakePagination = reactive({
  current: 1,
  size: 12,
  total: 0
});

// 富文本编辑器状态
const isEditorFullscreen = ref(false);

// 国家选项（基于language.php配置）
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
  { label: "捷克", value: "CZ" }
];

// 富文本编辑器配置
const editorHeight = computed(() => {
  return isEditorFullscreen.value ? "calc(100vh - 200px)" : "500px";
});

const wangEditorConfig = computed(() => ({
  placeholder: "请输入商品描述内容...",
  MENU_CONF: {
    uploadImage: {
      server: uploadUrl.value,
      fieldName: "file",
      maxFileSize: 2 * 1024 * 1024, // 2M
      allowedFileTypes: ["image/*"]
    }
  }
}));

// 上传配置 - 动态获取上传URL
const uploadUrl = computed(() => {
  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  return `${baseURL}/admin/upload/image`;
});

// SKU表单数据
const skuForm = reactive({
  id: null,
  product_id: "",
  sku_code: "",
  sku_name: "",
  sell_price: 0,
  origin_price: 0,
  cost_price: 0,
  discount_percent: 0,
  stock_quantity: 0,
  warning_stock: 10,
  main_image: "",
  status: "active",
  attributes: [] as { attribute_id: number; attribute_value_id: number }[]
});

// 表单验证规则
const rules = {
  title: [
    { required: true, message: "请输入商品标题", trigger: "blur" },
    { min: 2, max: 500, message: "商品标题长度在 2 到 500 个字符", trigger: "blur" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// SKU表单验证规则
const skuRules = {
  sku_name: [{ required: true, message: "请输入SKU名称", trigger: "blur" }],
  sell_price: [{ required: true, message: "请输入销售价格", trigger: "blur" }],
  stock_quantity: [{ required: true, message: "请输入库存数量", trigger: "blur" }]
};

// 自动计算折扣百分比
const calculateDiscount = () => {
  if (skuForm.origin_price > 0 && skuForm.sell_price > 0) {
    const discount = Math.round(((skuForm.origin_price - skuForm.sell_price) / skuForm.origin_price) * 100);
    skuForm.discount_percent = Math.max(0, Math.min(100, discount));
  } else {
    skuForm.discount_percent = 0;
  }
};

// 监听价格变化自动计算折扣
watch(
  () => [skuForm.sell_price, skuForm.origin_price],
  () => {
    calculateDiscount();
  },
  { deep: true }
);

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    active: "success",
    inactive: "danger",
    draft: "warning",
    deleted: "info"
  };
  return types[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    active: "上架",
    inactive: "下架",
    draft: "草稿",
    deleted: "已删除"
  };
  return texts[status] || status;
};

// 获取SKU状态类型
const getSkuStatusType = (status: string) => {
  const types = {
    active: "success",
    inactive: "danger",
    out_of_stock: "warning"
  };
  return types[status] || "info";
};

// 获取SKU状态文本
const getSkuStatusText = (status: string) => {
  const texts = {
    active: "正常",
    inactive: "禁用",
    out_of_stock: "缺货"
  };
  return texts[status] || status;
};

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    title: "",
    status: null,
    product_type: "" // 重置时显示全部
  });
  handleSearch();
};

// 添加
const handleAdd = () => {
  dialogTitle.value = "添加商品";

  Object.assign(form, {
    id: null,
    spu_id: "", // 后端自动生成
    title: "",
    sell_price: 0,
    origin_price: 0,
    discount: 0,
    image_urls: [],
    rich_text_content: "",
    specification_list: [],
    variants: [],
    status: "active",
    product_type: "original",
    b_page_product_id: "",
    cloak_rule_id: null, // 重置斗篷规则
    country: "JA"
  });

  // 重置相关状态
  imageFiles.value = [];
  originalProducts.value = [];

  // 确保斗篷规则已加载（避免重复加载）
  if (cloakRules.value.length === 0 && !cloakRulesLoading.value) {
    console.log("斗篷规则为空，重新加载...");
    loadCloakRules();
  }

  console.log("添加商品时斗篷规则数量:", cloakRules.value.length);
  console.log("斗篷规则列表:", cloakRules.value);

  dialogVisible.value = true;
};

// 查看
const handleView = (row: Product) => {
  const frontendUrl = import.meta.env.VITE_FRONTEND_URL || "https://gammtt.shop";
  const viewUrl = `${frontendUrl}/product/${row.id}`;

  // 在新标签页中打开
  window.open(viewUrl, "_blank");

  ElMessage.success(`正在跳转到商品页面...`);
};

// 编辑
const handleEdit = (row: Product) => {
  dialogTitle.value = "编辑商品";

  // 调试：打印原始商品数据
  console.log("编辑商品原始数据:", row);
  console.log("原始cloak_rule_id:", row.cloak_rule_id);
  console.log("原始cloak_rule_id类型:", typeof row.cloak_rule_id);

  // 转换数字字段类型
  const editData = {
    ...row,
    sell_price: parseFloat(row.sell_price) || 0,
    origin_price: parseFloat(row.origin_price) || 0,
    discount: parseFloat(row.discount) || 0,
    product_type: row.product_type || "original",
    b_page_product_id: row.b_page_product_id || "",
    country: row.country || "JA",
    cloak_rule_id: row.cloak_rule_id || null // 确保斗篷规则ID被正确设置
  };

  console.log("处理后的编辑数据:", editData);
  console.log("处理后的cloak_rule_id:", editData.cloak_rule_id);

  Object.assign(form, editData);

  // 初始化图片文件列表以显示已上传的图片
  imageFiles.value = (row.image_urls || []).map((url, index) => ({
    name: `image_${index}.jpg`,
    url: url,
    response: {
      success: true,
      data: {
        url: url,
        file_name: `image_${index}.jpg`
      }
    }
  }));

  // 确保斗篷规则已加载（避免重复加载）
  if (cloakRules.value.length === 0 && !cloakRulesLoading.value) {
    console.log("编辑商品时斗篷规则为空，重新加载...");
    loadCloakRules();
  }

  console.log("编辑商品时斗篷规则数量:", cloakRules.value.length);
  console.log("编辑商品时斗篷规则ID:", form.cloak_rule_id);
  console.log("斗篷规则列表:", cloakRules.value);

  dialogVisible.value = true;
};

// 删除
const handleDelete = (row: Product) => {
  ElMessageBox.confirm(`确定要删除商品 "${row.title}" 吗？删除后无法恢复！`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteProductApi(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true;
      try {
        // 调试：打印提交的数据
        console.log("提交表单数据:", form);
        console.log("斗篷规则ID:", form.cloak_rule_id);
        console.log("斗篷规则ID类型:", typeof form.cloak_rule_id);

        if (form.id) {
          console.log("更新商品，ID:", form.id);
          await updateProductApi(form.id, form);
          ElMessage.success("更新成功");
        } else {
          console.log("创建新商品");
          await createProductApi(form);
          ElMessage.success("添加成功");
        }
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        console.error("提交失败:", error);
        ElMessage.error(form.id ? "更新失败" : "添加失败");
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  loadData();
};

// 当前页改变
const handleCurrentChange = (current: number) => {
  pagination.current = current;
  loadData();
};

// 处理图片URL的初始化（保留兼容性）

// 图片上传相关方法
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isLt2M) {
    ElMessage.error("图片大小不能超过 2MB!");
    return false;
  }
  return true;
};

const handleImageUploadSuccess = (response: any, file: any) => {
  // 处理后端返回的数据
  if (response && response.success && response.data && response.data.url) {
    form.image_urls.push(response.data.url);

    // 保存文件名用于删除时使用
    file.fileName = response.data.file_name;

    ElMessage.success("图片上传成功");
  } else {
    ElMessage.error("图片上传失败: " + (response.error || "未知错误"));
  }
};

const handleImageRemove = (file: any) => {
  // 从图片列表中移除
  if (file.response && file.response.url) {
    const index = form.image_urls.indexOf(file.response.url);
    if (index > -1) {
      form.image_urls.splice(index, 1);
    }
  }
};

const handleImageUploadError = () => {
  ElMessage.error("图片上传失败");
};

const toggleEditorSize = () => {
  isEditorFullscreen.value = !isEditorFullscreen.value;
};

const handleWangEditorChange = (value: string) => {
  form.rich_text_content = value;
};

const clearRichTextContent = () => {
  ElMessageBox.confirm("确定要清空商品描述内容吗？", "清空确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    form.rich_text_content = "";
    ElMessage.success("内容已清空");
  });
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: ProductListParams = {
      page: pagination.current,
      size: pagination.size,
      title: searchForm.title || undefined,
      status: searchForm.status || undefined,
      product_type: searchForm.product_type || undefined
    };

    const { data } = await getProductListApi(params);
    console.log("商品列表API响应:", data);
    console.log("第一个商品数据:", data.list[0]);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取商品列表失败");
  } finally {
    loading.value = false;
  }
};

// SKU管理
const handleManageSkus = async (row: Product) => {
  currentProduct.value = row;
  skuDialogVisible.value = true;
  await loadSkuData(row.id); // 加载SKU数据
};

// 加载SKU数据
const loadSkuData = async (productId: string) => {
  skuLoading.value = true;
  try {
    const { data } = await getProductSkusApi(productId);
    skuList.value = data;
  } catch (error) {
    ElMessage.error("获取SKU列表失败");
  } finally {
    skuLoading.value = false;
  }
};

// 简化的SKU规格管理方法
const addSkuSpec = () => {
  if (!newSpecName.value.trim() || !newSpecValue.value.trim()) {
    ElMessage.warning("请输入规格名称和值");
    return;
  }

  const newSpecName_trimmed = newSpecName.value.trim();
  const newSpecValue_trimmed = newSpecValue.value.trim();

  // 检查是否已存在相同的属性名和值的组合
  const existingSpec = skuSpecs.value.find(spec => spec.name === newSpecName_trimmed && spec.value === newSpecValue_trimmed);

  if (existingSpec) {
    ElMessage.warning(`规格 "${newSpecName_trimmed}: ${newSpecValue_trimmed}" 已存在，请勿重复添加`);
    return;
  }

  // 检查是否已存在相同的属性名（一个SKU的同一属性只能有一个值）
  const existingAttr = skuSpecs.value.find(spec => spec.name === newSpecName_trimmed);
  if (existingAttr) {
    ElMessage.warning(
      `属性 "${newSpecName_trimmed}" 已存在值 "${existingAttr.value}"，一个SKU的同一属性只能设置一个值。如需修改，请先删除现有规格。`
    );
    return;
  }

  const newSpec = {
    name: newSpecName_trimmed,
    value: newSpecValue_trimmed
  };

  skuSpecs.value.push(newSpec);

  // 清空输入
  newSpecName.value = "";
  newSpecValue.value = "";

  ElMessage.success("规格添加成功");
};

const removeSkuSpec = (index: number) => {
  skuSpecs.value.splice(index, 1);
  ElMessage.success("规格删除成功");
};

// 添加SKU
const handleAddSku = () => {
  skuFormTitle.value = "添加SKU";
  // 生成SKU编码
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const skuCode = `SKU${timestamp}${random}`;

  Object.assign(skuForm, {
    id: null,
    product_id: currentProduct.value?.id || "",
    sku_code: skuCode,
    sku_name: "",
    sell_price: 0,
    origin_price: 0,
    cost_price: 0,
    discount_percent: 0,
    stock_quantity: 0,
    warning_stock: 10,
    main_image: "",
    status: "active",
    attributes: []
  });

  // 清空规格数据
  skuSpecs.value = [];
  newSpecName.value = "";
  newSpecValue.value = "";

  skuFormDialogVisible.value = true;
};

// 编辑SKU
const handleEditSku = (row: ProductSku) => {
  skuFormTitle.value = "编辑SKU";

  // 转换数字字段类型
  const skuEditData = {
    ...row,
    sell_price: parseFloat(row.sell_price) || 0,
    origin_price: parseFloat(row.origin_price) || 0,
    cost_price: parseFloat(row.cost_price) || 0,
    discount_percent: parseFloat(row.discount_percent) || 0,
    stock_quantity: parseInt(row.stock_quantity) || 0,
    warning_stock: parseInt(row.warning_stock) || 10
  };

  Object.assign(skuForm, skuEditData);

  // 改进的规格数据处理：保持属性ID信息
  skuSpecs.value = row.attributes.map(attr => ({
    name: attr.attribute_name || attr.display_name || "",
    value: attr.value || attr.display_value || "",
    attribute_id: attr.attribute_id || null,
    attribute_value_id: attr.attribute_value_id || null
  }));

  skuFormDialogVisible.value = true;
};

// 删除SKU
const handleDeleteSku = (row: ProductSku) => {
  ElMessageBox.confirm(`确定要删除SKU "${row.sku_name}" 吗？`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteSkuApi(row.id);
      ElMessage.success("删除成功");
      await loadSkuData(currentProduct.value?.id || "");
    } catch (error: any) {
      console.error("删除SKU失败:", error);

      // 处理不同类型的错误
      let errorMessage = "删除失败";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      ElMessage.error(errorMessage);
    }
  });
};

// 简化SKU属性转换 - 改进版本，保持属性ID信息
const convertSpecsToAttributes = () => {
  // 检查是否有重复的属性名
  const attributeNames = skuSpecs.value.map(spec => spec.name);
  const duplicateNames = attributeNames.filter((name, index) => attributeNames.indexOf(name) !== index);

  if (duplicateNames.length > 0) {
    ElMessage.error(`检测到重复的属性名: ${duplicateNames.join(", ")}，请检查规格设置`);
    throw new Error("存在重复的属性名");
  }

  return skuSpecs.value.map(spec => {
    // 如果有属性ID信息，优先使用ID格式
    if (spec.attribute_id && spec.attribute_value_id) {
      return {
        attribute_id: spec.attribute_id,
        attribute_value_id: spec.attribute_value_id
      };
    }
    // 否则使用名称格式（向后兼容）
    return {
      attribute_name: spec.name,
      value: spec.value
    };
  });
};

// 提交SKU
const handleSubmitSku = async () => {
  if (!skuFormRef.value) return;

  skuFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      skuSubmitLoading.value = true;
      try {
        // 将简化的规格转换为后端期望的格式
        const skuData = {
          ...skuForm,
          attributes: convertSpecsToAttributes()
        };

        if (skuForm.id) {
          await updateSkuApi(skuForm.id, skuData);
          ElMessage.success("更新成功");
        } else {
          await createSkuApi(skuData);
          ElMessage.success("添加成功");
        }
        skuFormDialogVisible.value = false;
        await loadSkuData(currentProduct.value?.id || "");
      } catch (error: any) {
        // 检查是否是属性重复错误
        if (error.message === "存在重复的属性名") {
          // 错误已经在convertSpecsToAttributes中显示了
          return;
        }
        ElMessage.error(skuForm.id ? "更新失败" : "添加失败");
      } finally {
        skuSubmitLoading.value = false;
      }
    }
  });
};

// 图片输入模式切换处理
const handleImageInputModeChange = (mode: string) => {
  // 切换模式时清空当前图片
  if (mode !== imageInputMode.value) {
    skuForm.main_image = "";
  }
};

// 商品类型变化处理
const handleProductTypeChange = (value: string) => {
  if (value === "original") {
    // 如果改为正品，清空关联的正品ID
    form.b_page_product_id = "";
  } else if (value === "fake") {
    // 如果改为仿品，且当前没有关联的正品，才加载正品商品列表
    if (!form.b_page_product_id) {
      loadOriginalProducts();
    }
  }
};

// 商品折扣自动计算
const calculateProductDiscount = () => {
  const sellPrice = form.sell_price || 0;
  const originPrice = form.origin_price || 0;

  if (originPrice > 0 && sellPrice > 0) {
    const discount = Math.round(((originPrice - sellPrice) / originPrice) * 100);
    form.discount = Math.max(0, Math.min(100, discount));
  } else if (originPrice === 0 || sellPrice === 0) {
    form.discount = 0;
  }
};

// 商品价格自动计算（根据折扣）
const calculateProductPrice = () => {
  const originPrice = form.origin_price || 0;
  const discount = form.discount || 0;

  if (originPrice > 0 && discount >= 0) {
    form.sell_price = Math.round(originPrice * (1 - discount / 100) * 100) / 100;
  }
};

// SKU折扣自动计算
const calculateSkuDiscount = () => {
  const sellPrice = skuForm.sell_price || 0;
  const originPrice = skuForm.origin_price || 0;

  if (originPrice > 0 && sellPrice > 0) {
    const discount = Math.round(((originPrice - sellPrice) / originPrice) * 100);
    skuForm.discount_percent = Math.max(0, Math.min(100, discount));
  } else if (originPrice === 0 || sellPrice === 0) {
    skuForm.discount_percent = 0;
  }
};

// SKU价格自动计算（根据折扣）
const calculateSkuPrice = () => {
  const originPrice = skuForm.origin_price || 0;
  const discount = skuForm.discount_percent || 0;

  if (originPrice > 0 && discount >= 0) {
    skuForm.sell_price = Math.round(originPrice * (1 - discount / 100) * 100) / 100;
  }
};

// 搜索正品商品
const searchOriginalProducts = async (query: string) => {
  if (!query) {
    await loadOriginalProducts();
    return;
  }

  originalProductsLoading.value = true;
  try {
    const { data } = await getOriginalProductsApi(query);
    originalProducts.value = data;
  } catch (error) {
    ElMessage.error("搜索正品商品失败");
  } finally {
    originalProductsLoading.value = false;
  }
};

// 加载正品商品列表
const loadOriginalProducts = async () => {
  originalProductsLoading.value = true;
  try {
    const { data } = await getOriginalProductsApi();
    originalProducts.value = data;
  } catch (error) {
    ElMessage.error("加载正品商品列表失败");
  } finally {
    originalProductsLoading.value = false;
  }
};

// 获取正品商品标题
const getOriginalProductTitle = (productId: string) => {
  const product = tableData.value.find(p => p.id === productId);
  return product ? product.title : "未知商品";
};

// 获取正品关联的所有仿品
const getFakeProductsForOriginal = (originalProductId: string) => {
  return tableData.value.filter(p => p.product_type === "fake" && p.b_page_product_id === originalProductId);
};

// 查看正品详情
const handleViewOriginal = (originalProductId: string) => {
  const originalProduct = tableData.value.find(p => p.id === originalProductId);
  if (originalProduct) {
    handleView(originalProduct);
  }
};

// 关联仿品商品
const handleSetFakeProduct = (originalProduct: Product) => {
  currentOriginalProduct.value = originalProduct;
  selectedFakeProductId.value = "";
  fakeSearchKeyword.value = "";
  fakePagination.current = 1;
  fakeProductDialogVisible.value = true;
  loadFakeProducts(); // 加载可选的仿品商品
};

// 加载仿品商品列表
const loadFakeProducts = async () => {
  fakeProductsLoading.value = true;
  try {
    const params = {
      page: fakePagination.current,
      size: fakePagination.size,
      product_type: "fake",
      title: fakeSearchKeyword.value || undefined
    };

    const { data } = await getProductListApi(params);
    // 过滤掉已经关联其他正品的仿品
    fakeProducts.value = data.list.filter(product => !product.b_page_product_id);
    fakePagination.total = data.total;
  } catch (error) {
    ElMessage.error("加载仿品商品列表失败");
  } finally {
    fakeProductsLoading.value = false;
  }
};

// 搜索仿品商品
const searchFakeProducts = () => {
  fakePagination.current = 1;
  loadFakeProducts();
};

// 仿品分页大小改变
const handleFakeSizeChange = (size: number) => {
  fakePagination.size = size;
  loadFakeProducts();
};

// 仿品当前页改变
const handleFakeCurrentChange = (current: number) => {
  fakePagination.current = current;
  loadFakeProducts();
};

// 确认仿品关联
const handleConfirmFakeLink = async () => {
  if (!selectedFakeProductId.value || !currentOriginalProduct.value) {
    return;
  }

  try {
    await updateFakeProductLinkApi(selectedFakeProductId.value, currentOriginalProduct.value.id);
    ElMessage.success("仿品关联成功");
    fakeProductDialogVisible.value = false;
    loadData(); // 刷新列表
  } catch (error) {
    ElMessage.error("仿品关联失败");
  }
};

// 创建新仿品（从关联对话框触发）
const handleCreateNewFake = () => {
  if (!currentOriginalProduct.value) return;

  fakeProductDialogVisible.value = false;

  // 使用原来的快速创建仿品逻辑
  dialogTitle.value = "基于正品创建仿品";

  Object.assign(form, {
    id: null,
    spu_id: "", // 后端自动生成
    title: `${currentOriginalProduct.value.title} - 仿品版`,
    sell_price: Math.round((currentOriginalProduct.value.sell_price || 0) * 0.6), // 默认60%的价格
    origin_price: currentOriginalProduct.value.sell_price || 0,
    discount: 40, // 默认40%折扣
    image_urls: [...(currentOriginalProduct.value.image_urls || [])], // 复制图片
    rich_text_content: currentOriginalProduct.value.rich_text_content || "",
    specification_list: [...(currentOriginalProduct.value.specification_list || [])],
    variants: [...(currentOriginalProduct.value.variants || [])],
    status: "draft", // 默认草稿状态
    product_type: "fake",
    b_page_product_id: currentOriginalProduct.value.id,
    cloak_rule_id: null, // 重置斗篷规则
    country: currentOriginalProduct.value.country || "JA" // 继承正品的国家设置
  });

  // 重置相关状态
  imageFiles.value = (currentOriginalProduct.value.image_urls || []).map((url, index) => ({
    name: `image_${index}.jpg`,
    url: url,
    response: {
      success: true,
      data: {
        url: url,
        file_name: `image_${index}.jpg`
      }
    }
  }));

  // 加载正品商品列表（用于显示选择框）
  loadOriginalProducts();

  dialogVisible.value = true;

  ElMessage.success(`已基于正品"${currentOriginalProduct.value.title}"创建仿品，请修改相关信息后保存`);
};

// 斗篷规则相关方法
const loadCloakRules = async () => {
  // 防止重复加载
  if (cloakRulesLoading.value) {
    console.log("斗篷规则正在加载中，跳过重复请求");
    return;
  }

  try {
    cloakRulesLoading.value = true;
    const response = await cloakRuleApi.getCloakRules({ page: 1, size: 1000 });
    console.log("斗篷规则API响应:", response);

    // 修复响应结构判断：后端返回的是 {success: true, code: 200, message: '操作成功', data: {...}}
    if (response.code === 200) {
      const allRules = response.data.list;
      const activeRules = allRules.filter((rule: CloakRule) => rule.is_active === 1);
      console.log("所有规则:", allRules);
      console.log("活跃规则:", activeRules);

      cloakRules.value = activeRules;
      console.log("设置后的cloakRules:", cloakRules.value);
    } else {
      console.error("斗篷规则API返回错误:", response);
    }
  } catch (error) {
    console.error("加载斗篷规则失败:", error);
    ElMessage.error("加载斗篷规则失败");
  } finally {
    cloakRulesLoading.value = false;
  }
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

// 斗篷规则改变处理
const handleCloakRuleChange = (ruleId: number | null) => {
  console.log("斗篷规则改变:", ruleId);
  console.log("斗篷规则ID类型:", typeof ruleId);
  form.cloak_rule_id = ruleId;

  if (ruleId) {
    const rule = cloakRules.value.find(r => r.id === ruleId);
    if (rule) {
      console.log("选择的斗篷规则:", rule);
    } else {
      console.warn("未找到对应的斗篷规则，ID:", ruleId);
    }
  } else {
    console.log("清空斗篷规则选择");
  }
};

// 初始化
onMounted(() => {
  loadData();
  loadCloakRules();
});
</script>

<style scoped>
/* 图片输入方式选择样式 */
.image-input-section {
  .input-mode-selector {
    margin-bottom: 16px;
  }

  .input-mode-selector .el-radio-group {
    display: flex;
    gap: 16px;
  }

  .input-mode-selector .el-radio {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    transition: all 0.3s;
  }

  .input-mode-selector .el-radio:hover {
    border-color: #409eff;
    background-color: #f0f8ff;
  }

  .input-mode-selector .el-radio.is-checked {
    border-color: #409eff;
    background-color: #f0f8ff;
    color: #409eff;
  }

  .url-preview {
    margin-top: 12px;
  }

  .image-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background-color: #f5f7fa;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    color: #909399;
    font-size: 12px;
  }

  .image-error .el-icon {
    font-size: 24px;
    margin-bottom: 4px;
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
    text-align: center;
  }
}

.product-management {
  min-height: 100vh;
  padding: 20px;
  background: #f5f7fa;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}
.search-form {
  margin: 0;
}
.search-form .el-form-item {
  margin-bottom: 0;
}

/* 表格卡片 */
.table-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
}
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-title {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.table-title .el-button {
  margin-right: 8px;
}
.table-actions {
  display: flex;
  gap: 8px;
}

/* 商品信息 */
.product-info {
  display: flex;
  gap: 12px;
  align-items: center;
}
.product-avatar {
  flex-shrink: 0;
  color: white;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
.product-details {
  flex: 1;
  min-width: 0;
}
.product-title {
  margin-bottom: 4px;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.product-subtitle {
  overflow: hidden;
  font-size: 12px;
  color: #909399;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.count-info {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}
.count-icon {
  font-size: 14px;
  color: #909399;
}
.time-info {
  display: flex;
  gap: 6px;
  align-items: center;
}
.time-icon {
  font-size: 14px;
  color: #909399;
}
.text-gray {
  color: #c0c4cc;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 对话框 */
.product-form {
  padding: 0 20px;
}
.dialog-footer {
  text-align: right;
}

/* SKU管理样式 */
.sku-management {
  padding: 20px 0;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.sku-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.attr-tag {
  margin: 2px;
}
.price {
  font-weight: 600;
  color: #e6a23c;
}
.attribute-selection {
  padding: 16px;
  background: #fafafa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.attribute-group {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.attribute-group:last-child {
  margin-bottom: 0;
}
.attribute-label {
  min-width: 80px;
  font-weight: 500;
  color: #606266;
}
.no-attributes {
  padding: 20px;
  text-align: center;
}
.selected-attributes {
  padding: 15px;
  margin-top: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}
.selected-attributes h4 {
  margin-bottom: 10px;
  color: #409eff;
}
.attribute-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 响应式设计 */
@media (width <= 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  .search-form {
    flex-direction: column;
  }
  .search-form .el-form-item {
    width: 100%;
  }
  .action-buttons {
    flex-direction: column;
  }
  .product-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .attribute-group {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  .attribute-label {
    min-width: auto;
  }
}

/* SKU规格样式 */
.sku-specs {
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}
.add-spec-form {
  margin-bottom: 16px;
}
.specs-list {
  margin-top: 16px;
}
.specs-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.spec-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 200px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}
.spec-content {
  display: flex;
  gap: 8px;
  align-items: center;
}
.spec-name {
  font-weight: 500;
  color: #606266;
}

/* 表单提示样式 */
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  font-style: italic;
  color: #909399;
}

/* 图片上传样式 */
.upload-demo .el-upload {
  position: relative;
  width: 200px !important;
  height: 80px !important;
  overflow: hidden;
  cursor: pointer;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}
.upload-demo .el-upload:hover {
  border-color: #409eff;
}
.upload-demo .el-upload-list--picture-card .el-upload-list__item {
  width: 200px !important;
  height: 80px !important;
  border: 1px solid #d9d9d9;
}
.upload-demo .el-upload__text {
  margin-top: 8px;
  font-size: 12px;
}
.upload-demo .el-icon--upload {
  font-size: 20px;
}

/* 富文本编辑器样式 */
.rich-editor-wrapper {
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.simple-textarea:hover {
  border-color: #c0c4cc;
}
.rich-text-editor {
  border-top: 1px solid #dcdfe6;
}

/* 分割线样式 */
.el-divider {
  margin: 16px 0;
}

/* 全屏对话框样式 */
.product-dialog.el-dialog__wrapper {
  padding: 0;
}
.product-dialog .el-dialog {
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  margin: 0;
  border-radius: 0;
}
.product-dialog .el-dialog__header {
  padding: 20px 24px;
  background: #f8f9fa;
  border-bottom: 1px solid #dcdfe6;
}
.product-dialog .el-dialog__body {
  max-height: calc(100vh - 120px);
  padding: 24px;
  overflow-y: auto;
}
.product-dialog .el-dialog__footer {
  padding: 20px 24px;
  background: #f8f9fa;
  border-top: 1px solid #dcdfe6;
}

/* 富文本编辑器样式优化 */
.wang-editor-wrapper {
  transition: all 0.3s ease;
}
.wang-editor-wrapper.fullscreen {
  position: fixed;
  inset: 80px 20px 20px;
  z-index: 2000;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgb(0 0 0 / 20%);
}
.editor-controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #dcdfe6;
}

/* 仿品关联对话框样式 */
.fake-product-selection {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.current-product-card {
  border: 1px solid #e9ecef;
}
.product-summary {
  display: flex;
  gap: 16px;
  align-items: center;
}
.fake-selection-card {
  border: 1px solid #e9ecef;
}
.search-section {
  margin-bottom: 20px;
}
.fake-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  min-height: 300px;
  max-height: 400px;
  padding: 8px;
  overflow-y: auto;
}
.fake-product-card {
  position: relative;
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 45px;
  padding: 6px;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  transition: all 0.3s;
}
.fake-product-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgb(64 158 255 / 20%);
}
.fake-product-card.active {
  background: #f0f8ff;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgb(64 158 255 / 30%);
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}
.card-content {
  flex: 1;
  min-width: 0;
}
.card-title {
  margin-bottom: 2px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-price {
  margin-bottom: 2px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: #e6a23c;
}
.card-check {
  position: absolute;
  top: 4px;
  right: 4px;
}
.empty-state {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.fake-pagination {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e9ecef;
}
.product-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}
.product-price {
  font-weight: 600;
  color: #e6a23c;
}
</style>
