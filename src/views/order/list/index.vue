<template>
  <div class="order-management">
    <!-- 搜索卡片 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.order_number"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input
            v-model="searchForm.customer_name"
            placeholder="请输入客户姓名"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option v-for="(label, status) in OrderStatusLabels" :key="status" :label="label" :value="status" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="商品筛选">
          <el-input
            v-model="selectedProductName"
            placeholder="点击选择商品"
            readonly
            style="width: 200px"
            @click="openProductDialog"
          >
            <template #suffix>
              <el-icon v-if="searchForm.product_id" @click.stop="clearProduct" style="cursor: pointer"><Close /></el-icon>
              <el-icon v-else><Search /></el-icon>
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
            <span>订单列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" @click="handleExportDialog" :loading="exportLoading">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="商品信息" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="product-info">
              <el-avatar :size="40" class="product-avatar" v-if="row.product_images && row.product_images[0]">
                <img :src="row.product_images[0]" :alt="row.product_title" style="width: 100%; height: 100%; object-fit: cover" />
              </el-avatar>
              <el-avatar :size="40" class="product-avatar" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-details">
                <div class="product-title">{{ row.product_title || "商品已删除" }}</div>
                <div class="product-subtitle">数量: {{ row.quantity }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="客户信息" width="180">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="customer-name">{{ row.customer_name }}</div>
              <div class="customer-phone">{{ row.phone }}</div>
              <div v-if="row.email" class="customer-email">{{ row.email }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货地址" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="address-info">
              <div class="address-line">
                <span class="address-label">省市区:</span>
                <span class="address-value">{{ getAddressString(row.province, row.city, row.district) }}</span>
              </div>
              <div class="address-line" v-if="row.postal_code">
                <span class="address-label">邮编:</span>
                <span class="address-value">{{ row.postal_code }}</span>
              </div>
              <div class="address-line" v-if="row.address">
                <span class="address-label">详细:</span>
                <span class="address-value">{{ row.address }}</span>
              </div>
              <div class="address-line" v-if="row.comments && row.comments.trim()">
                <span class="address-label">备注:</span>
                <span class="address-value comments-value">{{ row.comments }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付信息" width="220" align="center">
          <template #default="{ row }">
            <div class="payment-info-combined">
              <div class="amount-info">
                <span class="amount">{{ row.total_amount || row.product_price * row.quantity }}</span>
                <span class="currency">{{ row.currency || "JPY" }}</span>
              </div>
              <div class="payment-method-info">
                <el-tag size="small" type="info">{{ row.payment_method || "COD" }}</el-tag>
                <el-tag
                  v-if="row.product_type"
                  size="small"
                  :type="getProductTypeColor(row.product_type)"
                  style="margin-left: 4px"
                >
                  {{ getProductTypeLabel(row.product_type) }}
                </el-tag>
              </div>
              <div class="status-info">
                <el-tag :type="OrderStatusColors[row.status]" size="small">
                  {{ OrderStatusLabels[row.status] || row.status }}
                </el-tag>
                <!-- 发货邮件状态标识 -->
                <el-tooltip v-if="row.shipped_email_sent" content="已发送发货邮件" placement="top">
                  <el-tag type="success" size="small" style="margin-left: 4px" class="email-sent-tag">
                    <el-icon><Message /></el-icon>
                    已发货邮件
                  </el-tag>
                </el-tooltip>
              </div>
              <div class="time-info">
                <el-icon class="time-icon"><Calendar /></el-icon>
                <span>{{ row.created_at }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="IP/来源" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="ip-url-info">
              <div class="ip-sk-row" v-if="row.ip_address">
                <div class="ip-address">
                  <el-tag size="small" type="info" style="cursor: pointer" @click="handleViewIPInfo(row.ip_address)">
                    {{ row.ip_address }}
                  </el-tag>
                </div>
                <div class="sk-info" v-if="row.product_type">
                  <el-tag size="small" :type="getProductTypeColor(row.product_type)">
                    {{ getProductTypeLabel(row.product_type) }}
                  </el-tag>
                </div>
                <!-- 显示订单国家 -->
                <div class="order-country">
                  <el-tag size="small" type="success" v-if="row.language_code">
                    {{ countryCodeMap[row.language_code.toUpperCase()] || row.language_code }}
                  </el-tag>
                  <el-tag size="small" type="success" v-else-if="row.province && provinceToCountryMap[row.province]">
                    {{ countryCodeMap[provinceToCountryMap[row.province]] }}
                  </el-tag>
                </div>
              </div>
              <div class="url-section" v-if="row.from_url">
                <div class="url-info">
                  <el-link :href="row.from_url" target="_blank" type="primary" size="small">
                    {{ row.from_url.length > 60 ? row.from_url.substring(0, 60) + "..." : row.from_url }}
                  </el-link>
                </div>
                <!-- 显示em参数（谷歌账号） -->
                <div class="em-param" v-if="extractEmParameter(row.from_url)">
                  <el-tag size="small" class="em-tag" effect="dark">
                    <el-icon><User /></el-icon>
                    {{ extractEmParameter(row.from_url) }}
                  </el-tag>
                </div>
              </div>
              <div v-if="!row.ip_address && !row.from_url" class="no-data">--</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button size="small" type="primary" link @click="handleViewDetail(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-dropdown @command="command => handleStatusChange(row, command)">
                <el-button size="small" type="success" link>
                  <el-icon><Edit /></el-icon>
                  状态
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="(label, status) in OrderStatusLabels"
                      :key="status"
                      :command="status"
                      :disabled="row.status === status"
                    >
                      <el-tag :type="OrderStatusColors[status]" size="small">{{ label }}</el-tag>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-dropdown v-if="row.email" @command="command => handleEmailAction(row, command)">
                <el-button size="small" type="warning" link>
                  <el-icon><Message /></el-icon>
                  邮件
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="picking">📦 拣货通知</el-dropdown-item>
                    <el-dropdown-item command="shipped">🚚 发货通知</el-dropdown-item>
                    <el-dropdown-item command="arrival" divided>📍 到达提醒</el-dropdown-item>
                    <el-dropdown-item command="reshipment">🔄 补发通知</el-dropdown-item>
                    <el-dropdown-item command="custom" divided>✉️ 自定义邮件</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-dropdown @command="command => handleSingleExport(row, command)">
                <el-button size="small" type="primary" link>
                  <el-icon><Download /></el-icon>
                  导出
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="kuasuoda">📦 跨速达</el-dropdown-item>
                    <el-dropdown-item command="huaxi">🚚 华熙</el-dropdown-item>
                    <el-dropdown-item command="yingpai">✈️ 盈派</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button size="small" type="danger" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div v-if="selectedOrders.length > 0" class="batch-actions">
        <el-alert :title="`已选择 ${selectedOrders.length} 个订单`" type="info" show-icon :closable="false">
          <template #default>
            <div class="batch-buttons">
              <el-button size="small" type="danger" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
            </div>
          </template>
        </el-alert>
      </div>

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

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px" :close-on-click-modal="false" destroy-on-close>
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-descriptions title="订单信息" :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_number }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="OrderStatusColors[currentOrder.status]" size="small">
              {{ OrderStatusLabels[currentOrder.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentOrder.updated_at }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentOrder.payment_method }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">
            {{ currentOrder.total_amount || currentOrder.product_price * currentOrder.quantity }} {{ currentOrder.currency }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 客户信息 -->
        <el-descriptions title="客户信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="客户姓名">{{ currentOrder.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱地址" :span="2">{{ currentOrder.email || "未填写" }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            <div class="address-detail">
              <div class="address-line">
                <span class="address-label">省市区:</span>
                <span class="address-value">{{
                  getAddressString(currentOrder.province, currentOrder.city, currentOrder.district)
                }}</span>
              </div>
              <div class="address-line" v-if="currentOrder.postal_code">
                <span class="address-label">邮编:</span>
                <span class="address-value">{{ currentOrder.postal_code }}</span>
              </div>
              <div class="address-line" v-if="currentOrder.address">
                <span class="address-label">详细地址:</span>
                <span class="address-value">{{ currentOrder.address }}</span>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.comments && currentOrder.comments.trim()" label="客户备注" :span="2">
            {{ currentOrder.comments }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品信息 -->
        <el-descriptions title="商品信息" :column="1" border style="margin-top: 20px">
          <el-descriptions-item label="商品">
            <div class="product-detail-info">
              <el-avatar :size="60" v-if="currentOrder.product_images && currentOrder.product_images[0]">
                <img
                  :src="currentOrder.product_images[0]"
                  :alt="currentOrder.product_title"
                  style="width: 100%; height: 100%; object-fit: cover"
                />
              </el-avatar>
              <el-avatar :size="60" v-else>
                <el-icon><Box /></el-icon>
              </el-avatar>
              <div class="product-detail-text">
                <div class="product-title">{{ currentOrder.product_title || "商品已删除" }}</div>
                <div class="product-price">单价: {{ currentOrder.product_price }} {{ currentOrder.currency }}</div>
                <div class="product-quantity">数量: {{ currentOrder.quantity }}</div>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 技术信息 -->
        <el-descriptions title="技术信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="下单IP">
            <el-tag v-if="currentOrder.ip_address" type="info" size="small">{{ currentOrder.ip_address }}</el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="语言代码">
            <el-tag v-if="currentOrder.language_code" type="success" size="small">
              {{ currentOrder.language_code.toUpperCase() }}
            </el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="页面追踪标识" :span="2">
            <el-tag v-if="currentOrder.pd_val" type="warning" size="small">{{ currentOrder.pd_val }}</el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="来源URL" :span="2">
            <div v-if="currentOrder.from_url" class="url-with-em">
              <el-link :href="currentOrder.from_url" target="_blank" type="primary" size="small">
                {{ currentOrder.from_url }}
              </el-link>
              <!-- 显示em参数（谷歌账号） -->
              <el-tag
                v-if="extractEmParameter(currentOrder.from_url)"
                size="small"
                class="em-tag"
                effect="dark"
                style="margin-left: 10px"
              >
                <el-icon><User /></el-icon>
                谷歌账号: {{ extractEmParameter(currentOrder.from_url) }}
              </el-tag>
            </div>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="浏览器信息" :span="2">
            <div v-if="currentOrder.user_agent" class="user-agent-info">
              <el-text size="small" type="info">{{ currentOrder.user_agent }}</el-text>
            </div>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="发货邮件状态" :span="2">
            <el-tag v-if="currentOrder.shipped_email_sent" type="success" size="small">
              <el-icon><Message /></el-icon>
              已发送发货邮件
            </el-tag>
            <el-tag v-else type="info" size="small">
              <el-icon><Close /></el-icon>
              未发送发货邮件
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- IP详情对话框 -->
    <el-dialog v-model="ipInfoDialogVisible" title="IP详细信息" width="700px" :close-on-click-modal="false" destroy-on-close>
      <div v-loading="ipInfoLoading" class="ip-info-content">
        <el-descriptions v-if="currentIPInfo" :column="2" border>
          <el-descriptions-item label="IP地址" :span="2">
            <el-tag type="primary">{{ currentIPInfo.ip }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="国家">
            {{ currentIPInfo.country || "--" }}
          </el-descriptions-item>
          <el-descriptions-item label="城市">
            {{ currentIPInfo.city || "--" }}
          </el-descriptions-item>

          <el-descriptions-item label="地区">
            {{ currentIPInfo.region || "--" }}
          </el-descriptions-item>
          <el-descriptions-item label="邮编">
            {{ currentIPInfo.postal || "--" }}
          </el-descriptions-item>

          <el-descriptions-item label="时区" :span="2">
            {{ currentIPInfo.timezone || "--" }}
          </el-descriptions-item>

          <el-descriptions-item label="位置坐标" :span="2">
            {{ currentIPInfo.loc || "--" }}
          </el-descriptions-item>

          <el-descriptions-item label="主机名" :span="2">
            {{ currentIPInfo.hostname || "--" }}
          </el-descriptions-item>

          <el-descriptions-item label="组织" :span="2">
            {{ currentIPInfo.org || "--" }}
          </el-descriptions-item>

          <el-descriptions-item v-if="currentIPInfo.asn" label="ASN信息" :span="2">
            <div>
              <div v-if="currentIPInfo.asn.asn">ASN: {{ currentIPInfo.asn.asn }}</div>
              <div v-if="currentIPInfo.asn.name">名称: {{ currentIPInfo.asn.name }}</div>
              <div v-if="currentIPInfo.asn.domain">域名: {{ currentIPInfo.asn.domain }}</div>
              <div v-if="currentIPInfo.asn.route">路由: {{ currentIPInfo.asn.route }}</div>
              <div v-if="currentIPInfo.asn.type">类型: {{ currentIPInfo.asn.type }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item v-if="currentIPInfo.company" label="公司信息" :span="2">
            <div>
              <div v-if="currentIPInfo.company.name">名称: {{ currentIPInfo.company.name }}</div>
              <div v-if="currentIPInfo.company.domain">域名: {{ currentIPInfo.company.domain }}</div>
              <div v-if="currentIPInfo.company.type">类型: {{ currentIPInfo.company.type }}</div>
            </div>
          </el-descriptions-item>

          <el-descriptions-item v-if="currentIPInfo.privacy" label="隐私信息" :span="2">
            <div style="display: flex; gap: 8px; flex-wrap: wrap">
              <el-tag v-if="currentIPInfo.privacy.vpn" type="danger">VPN</el-tag>
              <el-tag v-if="currentIPInfo.privacy.proxy" type="danger">代理</el-tag>
              <el-tag v-if="currentIPInfo.privacy.tor" type="danger">Tor</el-tag>
              <el-tag v-if="currentIPInfo.privacy.relay" type="warning">中继</el-tag>
              <el-tag v-if="currentIPInfo.privacy.hosting" type="warning">托管</el-tag>
              <span
                v-if="
                  !currentIPInfo.privacy.vpn &&
                  !currentIPInfo.privacy.proxy &&
                  !currentIPInfo.privacy.tor &&
                  !currentIPInfo.privacy.relay &&
                  !currentIPInfo.privacy.hosting
                "
              >
                --
              </span>
            </div>
          </el-descriptions-item>

          <el-descriptions-item v-if="currentIPInfo.abuse" label="滥用联系" :span="2">
            <div>
              <div v-if="currentIPInfo.abuse.email">邮箱: {{ currentIPInfo.abuse.email }}</div>
              <div v-if="currentIPInfo.abuse.phone">电话: {{ currentIPInfo.abuse.phone }}</div>
              <div v-if="currentIPInfo.abuse.name">名称: {{ currentIPInfo.abuse.name }}</div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无IP信息" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ipInfoDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导出字段选择对话框 -->
    <!-- 物流公司导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      :title="
        exportConfig.logisticsCompany === 'huaxi'
          ? '导出华熙订单'
          : exportConfig.logisticsCompany === 'yingpai'
            ? '导出盈派订单'
            : '导出跨速达订单'
      "
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="export-config">
        <el-form :model="exportConfig" label-width="120px">
          <el-form-item label="物流公司">
            <el-select v-model="exportConfig.logisticsCompany" placeholder="请选择物流公司" style="width: 300px">
              <el-option label="跨速达（匈牙利发货）" value="kuasuoda" />
              <el-option label="华熙（波兰COD）" value="huaxi" />
              <el-option label="盈派" value="yingpai" />
            </el-select>
          </el-form-item>

          <el-form-item label="导出筛选" v-if="!singleOrderExportMode">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <el-checkbox v-model="exportConfig.onlyUnshipped">只导出未发货的订单</el-checkbox>
              <el-checkbox v-model="exportConfig.filterByCountry">按国家筛选</el-checkbox>
            </div>
            <div class="form-tip">
              当前页未发货：<el-tag type="warning" size="small">{{ getUnshippedCountInCurrentPage() }} 条</el-tag>， 全部订单：{{
                pagination.total
              }}
              条
            </div>
          </el-form-item>

          <el-form-item v-if="exportConfig.filterByCountry" label="选择国家">
            <el-select v-model="exportConfig.selectedCountry" placeholder="请选择国家" style="width: 300px">
              <el-option label="斯洛伐克 (SK)" value="SK" />
              <el-option label="捷克 (CZ)" value="CZ" />
              <el-option label="波兰 (PL)" value="PL" />
              <el-option label="匈牙利 (HU)" value="HU" />
              <el-option label="斯洛文尼亚 (SI)" value="SI" />
              <el-option label="克罗地亚 (HR)" value="HR" />
              <el-option label="拉脱维亚 (LV)" value="LV" />
              <el-option label="立陶宛 (LT)" value="LT" />
              <el-option label="西班牙 (ES)" value="ES" />
              <el-option label="日本 (JP)" value="JP" />
            </el-select>
            <div class="form-tip">
              只导出 <el-tag type="success" size="small">{{ countryCodeMap[exportConfig.selectedCountry] }}</el-tag> 的订单
            </div>
          </el-form-item>

          <el-form-item label="导出数量">
            <el-input-number
              v-model="exportConfig.exportLimit"
              :min="1"
              :max="10000"
              :step="10"
              :disabled="singleOrderExportMode"
              placeholder="请输入导出数量"
              style="width: 200px"
            />
            <div class="form-tip" v-if="singleOrderExportMode">单个订单导出：1 条</div>
            <div class="form-tip" v-else>最多可导出 10000 条</div>
          </el-form-item>

          <el-form-item label="导出后操作">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <el-checkbox v-model="exportConfig.updateShippedStatus">更新订单状态为"已发货"</el-checkbox>
              <el-checkbox v-model="exportConfig.sendShippedEmail">发送发货通知邮件给客户</el-checkbox>
            </div>
            <div class="form-tip" style="color: #e6a23c">
              <el-icon><Warning /></el-icon>
              这些操作将在导出成功后异步执行
            </div>
          </el-form-item>

          <!-- 跨速达专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'kuasuoda'">
            <el-form-item label="规格信息">
              <el-input v-model="exportConfig.specification" placeholder="请输入规格信息" style="width: 300px" />
            </el-form-item>

            <el-form-item label="SKU">
              <el-input v-model="exportConfig.sku" placeholder="请输入SKU" style="width: 300px" />
            </el-form-item>
          </template>

          <!-- 华熙专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'huaxi'">
            <el-form-item label="运输方式">
              <el-input v-model="exportConfig.huaxiTransportMethod" placeholder="请输入运输方式" style="width: 300px" />
            </el-form-item>

            <el-form-item label="重量(KG)">
              <el-input v-model="exportConfig.huaxiWeight" placeholder="请输入重量" style="width: 300px" />
            </el-form-item>

            <el-form-item label="海关报关品名">
              <el-input v-model="exportConfig.huaxiCustomsName" placeholder="请输入海关报关品名" style="width: 300px" />
            </el-form-item>

            <el-form-item label="中文品名">
              <el-input v-model="exportConfig.huaxiChineseName" placeholder="请输入中文品名" style="width: 300px" />
            </el-form-item>

            <el-form-item label="配货信息">
              <el-input v-model="exportConfig.huaxiProductInfo" placeholder="请输入配货信息" style="width: 300px" />
            </el-form-item>
          </template>

          <!-- 盈派专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'yingpai'">
            <el-form-item label="快递物流商">
              <el-input v-model="exportConfig.yingpaiLogistics" placeholder="请输入快递物流商名称" style="width: 300px" />
              <div class="form-tip">快递物流商默认：欧洲小包特货</div>
            </el-form-item>

            <el-form-item label="SKU">
              <el-input v-model="exportConfig.yingpaiSku" placeholder="请输入SKU" style="width: 300px" />
              <div class="form-tip">SKU默认：15000W</div>
            </el-form-item>
          </template>
        </el-form>

        <el-alert title="导出说明" type="info" show-icon :closable="false" style="margin-top: 20px">
          <template #default>
            <div class="export-description">
              <p v-if="singleOrderExportMode">
                单个订单导出模式
                <span v-if="exportConfig.logisticsCompany === 'kuasuoda'">：将按照跨速达（匈牙利发货）模板格式导出</span>
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi'">：将按照华熙（波兰COD）模板格式导出</span>
                <span v-else-if="exportConfig.logisticsCompany === 'yingpai'">：将按照盈派批量上传模板格式导出</span>
              </p>
              <p v-else>
                <span v-if="exportConfig.logisticsCompany === 'kuasuoda'">将按照跨速达（匈牙利发货）模板格式导出订单数据</span>
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi'">将按照华熙（波兰COD）模板格式导出订单数据</span>
                <span v-else-if="exportConfig.logisticsCompany === 'yingpai'">将按照盈派批量上传模板格式导出订单数据</span>
              </p>
              <ul>
                <li v-if="singleOrderExportMode">📦 本次导出：1 条订单（订单号：{{ singleOrderToExport?.order_number }}）</li>
                <li v-else>
                  📦 本次导出：最多 {{ exportConfig.exportLimit }} 条订单
                  <el-tag v-if="exportConfig.onlyUnshipped" type="warning" size="small" style="margin-left: 8px">
                    仅未发货订单
                  </el-tag>
                  <el-tag v-if="exportConfig.filterByCountry" type="success" size="small" style="margin-left: 8px">
                    仅 {{ countryCodeMap[exportConfig.selectedCountry] }}
                  </el-tag>
                </li>
                <li v-if="!singleOrderExportMode">✅ 可选择只导出未发货的订单</li>
                <li v-if="!singleOrderExportMode">✅ 可按国家筛选导出（例如：只导出斯洛伐克或捷克订单）</li>
                <li>
                  ✅ 导出后可选操作：
                  <span v-if="exportConfig.updateShippedStatus" style="color: #67c23a; margin-left: 8px">更新为已发货</span>
                  <span v-if="exportConfig.sendShippedEmail" style="color: #67c23a; margin-left: 8px">发送邮件通知</span>
                </li>
                <li>✅ 国家代码自动映射（SK→斯洛伐克等）</li>
                <li>✅ 运输方式自动填充</li>
                <li>✅ 配货名称和配货信息自动去除表情和特殊字符</li>
                <li>✅ 订单号使用系统订单号</li>
                <li>✅ 邮箱为空时自动填充 test1@gmail.com, test2@gmail.com...</li>
                <li>✅ 收件人信息（姓名、邮箱、地址、电话等）</li>
                <li>✅ 财务信息（代收货款币种、金额等）</li>
                <li>✅ 商品信息（配货信息、货物类型、数量等）</li>
              </ul>
            </div>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancelExport">取消</el-button>
          <el-button type="primary" :loading="exportLoading" @click="handleExportByCompany">
            <el-icon><Download /></el-icon>
            确认导出
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 邮件预览对话框 -->
    <el-dialog v-model="emailPreviewDialogVisible" title="邮件预览" width="700px" :close-on-click-modal="false">
      <div v-if="currentEmailPreview" class="email-preview">
        <el-descriptions :column="1" border style="margin-bottom: 20px">
          <el-descriptions-item label="收件人">{{ currentEmailPreview.to }}</el-descriptions-item>
          <el-descriptions-item label="主题">{{ currentEmailPreview.subject }}</el-descriptions-item>
          <el-descriptions-item label="邮件类型">
            <el-tag :type="currentEmailPreview.type === 'picking' ? 'warning' : 'success'">
              {{ currentEmailPreview.typeName }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">邮件内容预览</el-divider>

        <div class="email-content-preview" v-html="currentEmailPreview.htmlContent"></div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="emailPreviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSendEmail" :loading="emailSending">
            <el-icon><Promotion /></el-icon>
            确认发送
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 自定义邮件对话框 -->
    <el-dialog v-model="customEmailDialogVisible" title="发送自定义邮件" width="800px" :close-on-click-modal="false">
      <el-form :model="customEmailForm" label-width="100px">
        <el-form-item label="收件人">
          <el-input v-model="customEmailForm.email_to" placeholder="收件人邮箱" disabled></el-input>
        </el-form-item>
        <el-form-item label="邮件主题">
          <el-input v-model="customEmailForm.subject" placeholder="请输入邮件主题" clearable></el-input>
        </el-form-item>
        <el-form-item label="邮件内容">
          <el-input
            v-model="customEmailForm.html_content"
            type="textarea"
            :rows="12"
            placeholder="请输入邮件内容（支持HTML格式）"
          ></el-input>
          <div class="form-tip">支持HTML格式，可以使用简单的HTML标签如 &lt;b&gt;粗体&lt;/b&gt;、&lt;br/&gt;换行等</div>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">邮件预览</el-divider>
      <div class="email-content-preview" v-html="customEmailForm.html_content || '暂无内容'"></div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customEmailDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSendCustomEmail" :loading="customEmailSending">
            <el-icon><Promotion /></el-icon>
            发送邮件
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 商品选择对话框 -->
    <el-dialog v-model="productDialogVisible" title="选择商品" width="800px" :close-on-click-modal="false">
      <div class="product-selector">
        <div class="product-search">
          <el-input
            v-model="productSearchKeyword"
            placeholder="搜索商品名称"
            clearable
            @input="searchProducts"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-table
          :data="productList"
          v-loading="productLoading"
          @selection-change="handleProductSelectionChange"
          style="width: 100%; margin-top: 16px"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="title" label="商品名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="sell_price" label="价格" width="100" align="center">
            <template #default="{ row }">
              <span>¥{{ row.sell_price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="product_type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getProductTypeColor(row.product_type)" size="small">
                {{ getProductTypeLabel(row.product_type) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="product-pagination">
          <el-pagination
            v-model:current-page="productPagination.current"
            v-model:page-size="productPagination.size"
            :page-sizes="[10, 20, 50]"
            :total="productPagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleProductSizeChange"
            @current-change="handleProductCurrentChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="productDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmProductSelection" :disabled="selectedProducts.length === 0">
            确定选择 ({{ selectedProducts.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="OrderList">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Box,
  Search,
  Refresh,
  Calendar,
  Edit,
  Delete,
  View,
  Download,
  ArrowDown,
  Close,
  Message,
  Promotion,
  Warning,
  User
} from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  getOrderListApi,
  getOrderDetailApi,
  updateOrderStatusApi,
  deleteOrderApi,
  batchDeleteOrdersApi,
  sendPickingNotificationEmailApi,
  sendShippedNotificationEmailApi,
  getIPInfoApi,
  type Order,
  type OrderListParams,
  OrderStatus,
  OrderStatusLabels,
  OrderStatusColors
} from "@/api/modules/order";
import { sendArrivalReminderApi, sendReshipmentNoticeApi, sendCustomEmailApi, type CustomEmailParams } from "@/api/modules/email";
import { getProductListApi, type Product } from "@/api/modules/product";

// 响应式数据
const loading = ref(false);
const exportLoading = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);

// IP详情相关
const ipInfoDialogVisible = ref(false);
const ipInfoLoading = ref(false);
const currentIPInfo = ref<any>(null);

// 单个订单导出相关
const singleOrderExportMode = ref(false);
const singleOrderToExport = ref<Order | null>(null);
const singleOrderLogisticsCompany = ref<string>("");

// 邮件预览相关
const emailPreviewDialogVisible = ref(false);
const emailSending = ref(false);
const currentEmailPreview = ref<{
  to: string;
  subject: string;
  type: string;
  typeName: string;
  htmlContent: string;
  orderId: number;
  action: string;
} | null>(null);

// 自定义邮件相关
const customEmailDialogVisible = ref(false);
const customEmailSending = ref(false);
const customEmailForm = reactive({
  order_id: 0,
  email_to: "",
  subject: "",
  html_content: ""
});

// 国家代码映射
const countryCodeMap: { [key: string]: string } = {
  SK: "斯洛伐克",
  CZ: "捷克",
  PL: "波兰",
  HU: "匈牙利",
  SI: "斯洛文尼亚",
  HR: "克罗地亚",
  LV: "拉脱维亚",
  LT: "立陶宛",
  ES: "西班牙",
  JA: "日本",
  JP: "日本"
};

// 华熙导出专用国家映射（捷克显示为"捷克共和国"）
const huaxiCountryCodeMap: { [key: string]: string } = {
  SK: "斯洛伐克",
  CZ: "捷克共和国", // 华熙要求捷克显示为"捷克共和国"
  PL: "波兰",
  HU: "匈牙利",
  SI: "斯洛文尼亚",
  HR: "克罗地亚",
  LV: "拉脱维亚",
  LT: "立陶宛",
  ES: "西班牙",
  JA: "日本",
  JP: "日本"
};

// 省份到国家代码的映射（用于从province反推country）
const provinceToCountryMap: { [key: string]: string } = {
  // 斯洛伐克的州
  "Bratislavský kraj": "SK",
  "Trnavský kraj": "SK",
  "Trenčiansky kraj": "SK",
  "Nitriansky kraj": "SK",
  "Žilinský kraj": "SK",
  "Banskobystrický kraj": "SK",
  "Prešovský kraj": "SK",
  "Košický kraj": "SK",

  // 捷克的州
  Praha: "CZ",
  "Středočeský kraj": "CZ",
  "Jihočeský kraj": "CZ",
  "Plzeňský kraj": "CZ",
  "Karlovarský kraj": "CZ",
  "Ústecký kraj": "CZ",
  "Liberecký kraj": "CZ",
  "Královéhradecký kraj": "CZ",
  "Pardubický kraj": "CZ",
  Vysočina: "CZ",
  "Jihomoravský kraj": "CZ",
  "Olomoucký kraj": "CZ",
  "Zlínský kraj": "CZ",
  "Moravskoslezský kraj": "CZ",

  // 日本的都道府县
  北海道: "JP",
  青森県: "JP",
  岩手県: "JP",
  宮城県: "JP",
  秋田県: "JP",
  山形県: "JP",
  福島県: "JP",
  茨城県: "JP",
  栃木県: "JP",
  群馬県: "JP",
  埼玉県: "JP",
  千葉県: "JP",
  東京都: "JP",
  神奈川県: "JP",
  新潟県: "JP",
  富山県: "JP",
  石川県: "JP",
  福井県: "JP",
  山梨県: "JP",
  長野県: "JP",
  岐阜県: "JP",
  静岡県: "JP",
  愛知県: "JP",
  三重県: "JP",
  滋賀県: "JP",
  京都府: "JP",
  大阪府: "JP",
  兵庫県: "JP",
  奈良県: "JP",
  和歌山県: "JP",
  鳥取県: "JP",
  島根県: "JP",
  岡山県: "JP",
  広島県: "JP",
  山口県: "JP",
  徳島県: "JP",
  香川県: "JP",
  愛媛県: "JP",
  高知県: "JP",
  福岡県: "JP",
  佐賀県: "JP",
  長崎県: "JP",
  熊本県: "JP",
  大分県: "JP",
  宮崎県: "JP",
  鹿児島県: "JP",
  沖縄県: "JP"
};

// 从订单数据中获取国家代码
// 从URL中提取em参数（谷歌账号）
const extractEmParameter = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("em");
  } catch (e) {
    return null;
  }
};

const getCountryCode = (order: Order): string => {
  // 优先使用language_code字段（如果存在且是有效的国家代码）
  if (order.language_code) {
    const upperCode = order.language_code.toUpperCase();
    if (countryCodeMap[upperCode]) {
      return upperCode;
    }
  }

  // 如果language_code不可用，尝试从province反推
  if (order.province && provinceToCountryMap[order.province]) {
    return provinceToCountryMap[order.province];
  }

  // 默认返回SK
  return "SK";
};

// 根据国家获取运输方式
const getTransportMethod = (countryCode: string): string => {
  if (countryCode === "SK") {
    return "欧洲备货-30HU";
  }
  return "欧洲备货-25HU";
};

// 清理表情和特殊字符的函数
const removeEmojiAndSpecialChars = (text: string): string => {
  if (!text) return "";
  // 移除表情符号（emoji）
  let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ""); // 表情符号
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ""); // 各种符号
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ""); // 交通和地图符号
  cleaned = cleaned.replace(/[\u{1F700}-\u{1F77F}]/gu, ""); // 炼金术符号
  cleaned = cleaned.replace(/[\u{1F780}-\u{1F7FF}]/gu, ""); // 几何形状
  cleaned = cleaned.replace(/[\u{1F800}-\u{1F8FF}]/gu, ""); // 补充箭头
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ""); // 补充符号和象形文字
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ""); // 扩展-A
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ""); // 扩展-B
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ""); // 杂项符号
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ""); // 装饰符号
  cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, ""); // 变体选择器
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ""); // 国旗
  // 移除其他特殊字符，但保留常用标点符号、空格、字母、数字和中文
  cleaned = cleaned.replace(/[^\w\s\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef.,，。、;；:：!！?？()（）\[\]【】\-_]/g, "");
  return cleaned.trim();
};

// 导出配置
const exportConfig = reactive({
  logisticsCompany: "kuasuoda", // 物流公司：kuasuoda(跨速达) 或 huaxi(华熙)
  customerNumberStart: "A1150",
  transportMethod: "欧洲备货-30HU",
  country: "斯洛伐克",
  specification: "welding gun",
  sku: "DH20251006*1",
  exportLimit: 100, // 默认导出100条
  onlyUnshipped: false, // 只导出未发货的订单
  filterByCountry: false, // 是否按国家筛选
  selectedCountry: "SK", // 选择的国家代码
  updateShippedStatus: false, // 导出后更新为已发货状态
  sendShippedEmail: false, // 导出后发送发货通知邮件
  // 华熙专用配置
  huaxiTransportMethod: "波兰COD海外仓一件代发-DHL",
  huaxiWeight: "0.5",
  huaxiCustomsName: "welding gun",
  huaxiChineseName: "焊枪",
  huaxiProductInfo: "焊枪套装",
  // 盈派专用配置
  yingpaiLogistics: "欧洲小包特货",
  yingpaiSku: "15000W"
});

// 从本地缓存加载导出配置
const loadExportConfigFromCache = () => {
  try {
    const cached = localStorage.getItem("hungaryExportConfig");
    if (cached) {
      const config = JSON.parse(cached);
      // 只更新存在的字段
      if (config.logisticsCompany) exportConfig.logisticsCompany = config.logisticsCompany;
      if (config.customerNumberStart) exportConfig.customerNumberStart = config.customerNumberStart;
      if (config.transportMethod) exportConfig.transportMethod = config.transportMethod;
      if (config.country) exportConfig.country = config.country;
      if (config.specification) exportConfig.specification = config.specification;
      if (config.sku) exportConfig.sku = config.sku;
      if (config.exportLimit) exportConfig.exportLimit = config.exportLimit;
      if (config.onlyUnshipped !== undefined) exportConfig.onlyUnshipped = config.onlyUnshipped;
      if (config.filterByCountry !== undefined) exportConfig.filterByCountry = config.filterByCountry;
      if (config.selectedCountry) exportConfig.selectedCountry = config.selectedCountry;
      if (config.updateShippedStatus !== undefined) exportConfig.updateShippedStatus = config.updateShippedStatus;
      if (config.sendShippedEmail !== undefined) exportConfig.sendShippedEmail = config.sendShippedEmail;
      // 华熙配置
      if (config.huaxiTransportMethod) exportConfig.huaxiTransportMethod = config.huaxiTransportMethod;
      if (config.huaxiWeight) exportConfig.huaxiWeight = config.huaxiWeight;
      if (config.huaxiCustomsName) exportConfig.huaxiCustomsName = config.huaxiCustomsName;
      if (config.huaxiChineseName) exportConfig.huaxiChineseName = config.huaxiChineseName;
      if (config.huaxiProductInfo) exportConfig.huaxiProductInfo = config.huaxiProductInfo;
      // 盈派配置
      if (config.yingpaiLogistics !== undefined) exportConfig.yingpaiLogistics = config.yingpaiLogistics;
      if (config.yingpaiSku !== undefined) exportConfig.yingpaiSku = config.yingpaiSku;
    }
  } catch (error) {
    console.error("加载导出配置失败:", error);
  }
};

// 保存导出配置到本地缓存
const saveExportConfigToCache = () => {
  try {
    // 不再自动递增客户单号，因为现在使用系统订单号
    const configToSave = {
      logisticsCompany: exportConfig.logisticsCompany,
      customerNumberStart: exportConfig.customerNumberStart,
      transportMethod: exportConfig.transportMethod,
      country: exportConfig.country,
      specification: exportConfig.specification,
      sku: exportConfig.sku,
      exportLimit: exportConfig.exportLimit,
      onlyUnshipped: exportConfig.onlyUnshipped,
      filterByCountry: exportConfig.filterByCountry,
      selectedCountry: exportConfig.selectedCountry,
      updateShippedStatus: exportConfig.updateShippedStatus,
      sendShippedEmail: exportConfig.sendShippedEmail,
      // 华熙配置
      huaxiTransportMethod: exportConfig.huaxiTransportMethod,
      huaxiWeight: exportConfig.huaxiWeight,
      huaxiCustomsName: exportConfig.huaxiCustomsName,
      huaxiChineseName: exportConfig.huaxiChineseName,
      huaxiProductInfo: exportConfig.huaxiProductInfo
    };

    localStorage.setItem("hungaryExportConfig", JSON.stringify(configToSave));
  } catch (error) {
    console.error("保存导出配置失败:", error);
  }
};
const selectedOrders = ref<Order[]>([]);

// 搜索表单
const searchForm = reactive({
  order_number: "",
  customer_name: "",
  phone: "",
  status: "",
  start_date: "",
  end_date: "",
  product_id: ""
});

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页数据
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<Order[]>([]);

// 商品筛选相关
const productDialogVisible = ref(false);
const productList = ref<Product[]>([]);
const productLoading = ref(false);
const productSearchKeyword = ref("");
const selectedProducts = ref<Product[]>([]);
const selectedProductName = ref("");
const productPagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

// 搜索
const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    order_number: "",
    customer_name: "",
    phone: "",
    status: "",
    start_date: "",
    end_date: "",
    product_id: ""
  });
  dateRange.value = null;
  selectedProductName.value = "";
  handleSearch();
};

// 日期范围变化
const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    searchForm.start_date = dates[0];
    searchForm.end_date = dates[1];
  } else {
    searchForm.start_date = "";
    searchForm.end_date = "";
  }
};

// 查看详情
const handleViewDetail = async (row: Order) => {
  try {
    const { data } = await getOrderDetailApi(row.id);
    currentOrder.value = data;
    detailDialogVisible.value = true;
  } catch (error) {
    ElMessage.error("获取订单详情失败");
  }
};

// 查看IP详情
const handleViewIPInfo = async (ip: string) => {
  try {
    ipInfoLoading.value = true;
    ipInfoDialogVisible.value = true;
    currentIPInfo.value = null;

    const { data } = await getIPInfoApi(ip);
    currentIPInfo.value = data;
  } catch (error) {
    ElMessage.error("获取IP信息失败");
    ipInfoDialogVisible.value = false;
  } finally {
    ipInfoLoading.value = false;
  }
};

// 状态变更
const handleStatusChange = async (row: Order, newStatus: OrderStatus) => {
  try {
    await updateOrderStatusApi(row.id, { status: newStatus });
    ElMessage.success("订单状态更新成功");
    loadData();
  } catch (error) {
    ElMessage.error("订单状态更新失败");
  }
};

// 删除
const handleDelete = (row: Order) => {
  ElMessageBox.confirm(`确定要删除订单 "${row.order_number}" 吗？删除后无法恢复！`, "删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await deleteOrderApi(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch (error) {
      ElMessage.error("删除失败");
    }
  });
};

// 批量删除
const handleBatchDelete = () => {
  const orderNumbers = selectedOrders.value.map(order => order.order_number).join("、");
  ElMessageBox.confirm(`确定要删除选中的 ${selectedOrders.value.length} 个订单吗？\n订单号：${orderNumbers}`, "批量删除确认", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      const ids = selectedOrders.value.map(order => order.id);
      await batchDeleteOrdersApi(ids);
      ElMessage.success("批量删除成功");
      selectedOrders.value = [];
      loadData();
    } catch (error) {
      ElMessage.error("批量删除失败");
    }
  });
};

// 生成邮件HTML内容
const generateEmailHtml = (row: Order, type: string): string => {
  const orderNumber = row.order_number;
  const customerName = row.customer_name;
  const productTitle = row.product_title || "Product";
  const quantity = row.quantity;
  const totalAmount = row.total_amount.toFixed(2);
  const currency = row.currency || "EUR";
  const productImage = row.product_images && row.product_images[0] ? row.product_images[0] : "";

  const productImageHtml = productImage
    ? `<img src="${productImage}" alt="Product" style="max-width: 200px; height: auto; border-radius: 8px; margin-top: 10px;" />`
    : "";

  if (type === "picking") {
    // 拣货通知邮件
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Great News!</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Your order is being prepared</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Hello ${customerName}! 👋</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                                We're excited to let you know that your order <strong style="color: #667eea;">#${orderNumber}</strong> 
                                is now being picked and packed with care by our warehouse team!
                            </p>
                            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📦 Order Details</h3>
                                <table width="100%" cellpadding="5" cellspacing="0">
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Order Number:</td>
                                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right;">#${orderNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Product:</td>
                                        <td style="color: #333; font-size: 14px; text-align: right;">${productTitle}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Quantity:</td>
                                        <td style="color: #333; font-size: 14px; text-align: right;">${quantity}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Total Amount:</td>
                                        <td style="color: #667eea; font-size: 16px; font-weight: bold; text-align: right;">${totalAmount} ${currency}</td>
                                    </tr>
                                </table>
                                ${productImageHtml}
                            </div>
                            <div style="background-color: #e8f5e9; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #2e7d32; font-size: 14px; text-align: center;">
                                    ✅ <strong>Next Step:</strong> Your order will be shipped soon!
                                </p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                                Thank you for choosing us! We'll notify you again once your order is shipped.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  } else if (type === "shipped") {
    // 发货通知邮件
    const address = row.address || "";
    const city = row.city || "";
    const country = row.province || "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📦 Shipped!</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Your order is on the way</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Hello ${customerName}! 🚚</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                                Exciting news! Your order <strong style="color: #11998e;">#${orderNumber}</strong> 
                                has been shipped and is now on its way to you!
                            </p>
                            <div style="background-color: #f8f9fa; border-left: 4px solid #11998e; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📦 Shipment Details</h3>
                                <table width="100%" cellpadding="5" cellspacing="0">
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Order Number:</td>
                                        <td style="color: #333; font-size: 14px; font-weight: bold; text-align: right;">#${orderNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Product:</td>
                                        <td style="color: #333; font-size: 14px; text-align: right;">${productTitle}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #666; font-size: 14px;">Quantity:</td>
                                        <td style="color: #333; font-size: 14px; text-align: right;">${quantity}</td>
                                    </tr>
                                </table>
                                ${productImageHtml}
                            </div>
                            <div style="background-color: #fff3cd; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">📍 Shipping Address</h4>
                                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                    ${address}<br/>
                                    ${city}, ${country}
                                </p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                                Thank you for your patience! Your package will arrive soon.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                            <p style="margin: 0; color: #999; font-size: 12px;">
                                This is an automated message, please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  } else if (type === "arrival") {
    // 到达提醒邮件
    const address = row.address || "";
    const city = row.city || "";
    const country = row.province || "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Reminder!</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Your package is waiting</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Hello ${customerName}!</h2>
                            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px;">
                                Your order <strong>#${orderNumber}</strong> has arrived at the pickup location!
                            </p>
                            <div style="background-color: #fff3cd; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 15px 0; color: #856404;">Important Information</h3>
                                <p><strong>Order Number:</strong> #${orderNumber}</p>
                                <p><strong>Product:</strong> ${productTitle}</p>
                                <p style="color: #d9534f; margin-top: 15px;"><strong>Please pick up as soon as possible!</strong></p>
                            </div>
                            <div style="background-color: #d4edda; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #155724;">Pickup Location</h4>
                                <p style="margin: 0; color: #155724;">${address}, ${city}, ${country}</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">This is an automated message</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  } else if (type === "reshipment") {
    // 补发通知邮件
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">We Sincerely Apologize!</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">We will make it right</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">Dear ${customerName},</h2>
                            <p style="margin: 0 0 15px 0; color: #666; font-size: 16px; line-height: 1.8;">
                                We sincerely apologize for the inconvenience regarding your order <strong>#${orderNumber}</strong>.
                            </p>
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 15px 0; color: #856404;">What Happened</h3>
                                <p style="margin: 5px 0; color: #856404; line-height: 1.6;">
                                    Due to an error by our warehouse staff, the <strong>wrong product was sent to you</strong>. We take full responsibility for this mistake.
                                </p>
                            </div>
                            <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px;">
                                <h3 style="margin: 0 0 15px 0; color: #155724;">Good News - We Have Already Taken Action!</h3>
                                <p style="color: #155724;"><strong>We have already arranged a reshipment for you!</strong></p>
                                <p><strong>Order Number:</strong> #${orderNumber}</p>
                                <p><strong>Correct Product:</strong> ${productTitle}</p>
                                <p><strong>Quantity:</strong> ${quantity}</p>
                                <p style="color: #155724; margin-top: 15px;"><strong>Express Delivery: Arriving within 7 days!</strong></p>
                            </div>
                            <div style="background-color: #e3f2fd; border-radius: 5px; padding: 20px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #1976d2;">What About the Wrong Item?</h4>
                                <p style="color: #666; font-size: 14px;">No need to return it. Keep it or dispose of it. This is our mistake.</p>
                            </div>
                            <div style="background-color: #f8f9fa; border-radius: 5px; padding: 15px; margin: 20px 0;">
                                <h4 style="margin: 0 0 10px 0; color: #333;">Need Help?</h4>
                                <p style="color: #666;">Contact us anytime:</p>
                                <p><strong>Support Email:</strong> <a href="mailto:hwt3432@gmail.com" style="color: #4facfe; font-weight: bold;">hwt3432@gmail.com</a></p>
                                <p style="color: #666; font-size: 13px;">We respond within 24 hours.</p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
                                Thank you for your patience. We value your business!
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 12px;">This is an automated message</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  return "";
};

// 处理邮件发送操作
const handleEmailAction = async (row: Order, action: string) => {
  console.log("=== 邮件发送开始 ===");
  console.log("1. handleEmailAction 被调用");
  console.log("   - 订单ID:", row.id);
  console.log("   - 邮件类型:", action);
  console.log("   - 邮箱地址:", row.email);
  console.log("   - 订单号:", row.order_number);

  if (!row.email) {
    console.log("2. ❌ 没有邮箱地址，退出");
    ElMessage.warning("该订单没有邮箱地址，无法发送邮件");
    return;
  }

  // 处理自定义邮件
  if (action === "custom") {
    console.log("2. 打开自定义邮件对话框");
    customEmailForm.order_id = row.id;
    customEmailForm.email_to = row.email;
    customEmailForm.subject = "";
    customEmailForm.html_content = "";
    customEmailDialogVisible.value = true;
    return;
  }

  const emailTypes = {
    picking: {
      name: "拣货通知",
      subject: "Good News! Your Order is Being Prepared for Shipment",
      api: sendPickingNotificationEmailApi
    },
    shipped: {
      name: "发货通知",
      subject: "Your Order Has Been Shipped!",
      api: sendShippedNotificationEmailApi
    },
    arrival: {
      name: "到达提醒",
      subject: "Package Arrival Reminder - Please Pick Up",
      api: sendArrivalReminderApi
    },
    reshipment: {
      name: "补发通知",
      subject: "We Will Reship Your Order - Support Available",
      api: sendReshipmentNoticeApi
    }
  };

  console.log("2. 邮件类型配置:", emailTypes);

  const emailType = emailTypes[action as keyof typeof emailTypes];
  if (!emailType) {
    console.log("3. ❌ 未知的邮件类型:", action);
    return;
  }

  console.log("3. ✓ 找到邮件类型:", emailType.name);

  // 生成邮件HTML内容
  const htmlContent = generateEmailHtml(row, action);

  // 设置预览数据
  currentEmailPreview.value = {
    to: row.email,
    subject: emailType.subject,
    type: action,
    typeName: emailType.name,
    htmlContent: htmlContent,
    orderId: row.id,
    action: action
  };

  console.log("4. 显示邮件预览对话框");
  emailPreviewDialogVisible.value = true;
};

// 确认发送邮件
const confirmSendEmail = async () => {
  if (!currentEmailPreview.value) return;

  const { orderId, action, typeName } = currentEmailPreview.value;

  const emailTypes = {
    picking: { name: "拣货通知", api: sendPickingNotificationEmailApi },
    shipped: { name: "发货通知", api: sendShippedNotificationEmailApi },
    arrival: { name: "到达提醒", api: sendArrivalReminderApi },
    reshipment: { name: "补发通知", api: sendReshipmentNoticeApi }
  };

  const emailType = emailTypes[action as keyof typeof emailTypes];
  if (!emailType) {
    console.error("未找到对应的邮件API:", action);
    return;
  }

  console.log("5. ✓ 用户确认发送");
  console.log("6. 准备调用API:", `/admin/orders/${orderId}/email/${action}-notification`);

  emailSending.value = true;

  try {
    console.log("7. 开始调用 API...");
    const response = await emailType.api(orderId);
    console.log("8. ✓ API 调用成功");
    console.log("   - 完整响应:", response);
    ElMessage.success(`${typeName}邮件发送成功！`);
    emailPreviewDialogVisible.value = false;
  } catch (error: any) {
    console.error("8. ❌ API 调用失败");
    console.error("   - 错误对象:", error);
    console.error("   - 错误消息:", error.message);
    console.error("   - 响应数据:", error.response?.data);
    console.error("   - 响应状态:", error.response?.status);
    ElMessage.error(error.response?.data?.message || error.message || `${typeName}邮件发送失败`);
  } finally {
    emailSending.value = false;
  }

  console.log("=== 邮件发送结束 ===\n");
};

// 确认发送自定义邮件
const confirmSendCustomEmail = async () => {
  if (!customEmailForm.subject.trim()) {
    ElMessage.warning("请输入邮件主题");
    return;
  }

  if (!customEmailForm.html_content.trim()) {
    ElMessage.warning("请输入邮件内容");
    return;
  }

  customEmailSending.value = true;

  try {
    const params: CustomEmailParams = {
      order_id: customEmailForm.order_id,
      email_to: customEmailForm.email_to,
      subject: customEmailForm.subject,
      html_content: customEmailForm.html_content
    };

    await sendCustomEmailApi(params);
    ElMessage.success("自定义邮件发送成功！");
    customEmailDialogVisible.value = false;

    // 清空表单
    customEmailForm.order_id = 0;
    customEmailForm.email_to = "";
    customEmailForm.subject = "";
    customEmailForm.html_content = "";
  } catch (error: any) {
    console.error("自定义邮件发送失败:", error);
    ElMessage.error(error.response?.data?.message || error.message || "自定义邮件发送失败");
  } finally {
    customEmailSending.value = false;
  }
};

// 计算当前页未发货订单数量
const getUnshippedCountInCurrentPage = (): number => {
  // 未发货状态：pending, confirmed, processing
  const unshippedStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
  return tableData.value.filter(order => unshippedStatuses.includes(order.status)).length;
};

// 打开导出对话框
const handleExportDialog = () => {
  // 从缓存加载上次的配置
  loadExportConfigFromCache();

  // 设置默认导出数量为当前页未发货的数量
  const unshippedCount = getUnshippedCountInCurrentPage();
  if (unshippedCount > 0) {
    exportConfig.exportLimit = unshippedCount;
  }

  exportDialogVisible.value = true;
};

// 取消导出，重置单个订单导出模式
const handleCancelExport = () => {
  exportDialogVisible.value = false;
  // 如果是单个订单导出模式，重置相关状态
  if (singleOrderExportMode.value) {
    singleOrderExportMode.value = false;
    singleOrderToExport.value = null;
    singleOrderLogisticsCompany.value = "";
    // 恢复默认导出数量
    exportConfig.exportLimit = 100;
  }
};

// 根据物流公司选择导出
const handleExportByCompany = async () => {
  if (exportConfig.logisticsCompany === "huaxi") {
    await handleHuaxiExport();
  } else if (exportConfig.logisticsCompany === "yingpai") {
    await handleYingpaiExport();
  } else {
    await handleKuasuodaExport();
  }
  exportDialogVisible.value = false;
};

// 异步处理订单状态更新和发送邮件
const handlePostExportActions = async (orders: Order[]) => {
  if (!exportConfig.updateShippedStatus && !exportConfig.sendShippedEmail) {
    return;
  }

  ElMessage.info({
    message: `正在后台处理 ${orders.length} 个订单的发货操作...`,
    duration: 3000
  });

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  // 异步处理每个订单
  for (const order of orders) {
    try {
      // 更新订单状态为已发货
      if (exportConfig.updateShippedStatus) {
        await updateOrderStatusApi(order.id, { status: OrderStatus.SHIPPED });
      }

      // 发送发货通知邮件
      if (exportConfig.sendShippedEmail && order.email) {
        await sendShippedNotificationEmailApi(order.id);
      }

      successCount++;
    } catch (error: any) {
      failCount++;
      errors.push(`订单 ${order.order_number}: ${error.message || "操作失败"}`);
      console.error(`处理订单 ${order.order_number} 失败:`, error);
    }
  }

  // 显示处理结果
  if (failCount === 0) {
    ElMessage.success(`成功处理 ${successCount} 个订单的发货操作`);
  } else if (successCount > 0) {
    ElMessage.warning({
      message: `成功: ${successCount} 个，失败: ${failCount} 个。请查看控制台了解详情。`,
      duration: 5000
    });
    console.error("失败的订单:", errors);
  } else {
    ElMessage.error(`所有订单处理失败！请查看控制台了解详情。`);
    console.error("失败的订单:", errors);
  }

  // 刷新订单列表
  loadData();
};

// 单个订单导出
const handleSingleExport = (order: Order, logisticsCompany: string) => {
  // 保存单个订单导出模式的信息
  singleOrderExportMode.value = true;
  singleOrderToExport.value = order;
  singleOrderLogisticsCompany.value = logisticsCompany;

  // 设置物流公司
  exportConfig.logisticsCompany = logisticsCompany;

  // 单个订单导出时，设置导出数量为1
  exportConfig.exportLimit = 1;

  // 打开导出配置对话框
  exportDialogVisible.value = true;

  console.log(`准备导出单个订单: ${order.order_number}, 物流公司: ${logisticsCompany}`);
};

// 跨速达（匈牙利发货）模板导出
const handleKuasuodaExport = async () => {
  await handleExportConfirm();
};

// 导出确认 - 匈牙利发货模板格式
const handleExportConfirm = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`单个订单导出模式: ${orders[0].order_number}`);
    } else {
      // 批量导出模式：查询订单数据
      const exportLimit = exportConfig.exportLimit || 100;
      const params: OrderListParams = {
        page: 1,
        size: exportLimit,
        order_number: searchForm.order_number || undefined,
        customer_name: searchForm.customer_name || undefined,
        phone: searchForm.phone || undefined,
        status: (searchForm.status as OrderStatus) || undefined,
        start_date: searchForm.start_date || undefined,
        end_date: searchForm.end_date || undefined,
        product_id: searchForm.product_id || undefined
      };

      // 功能1：如果选择只导出未发货的订单，添加状态筛选
      if (exportConfig.onlyUnshipped) {
        params.status = undefined; // 先获取所有状态
      }

      console.log("获取订单数据参数:", params);

      const { data } = await getOrderListApi(params);
      orders = data.list;

      // 功能1：前端过滤未发货订单
      if (exportConfig.onlyUnshipped) {
        orders = orders.filter(order => {
          return (
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.CONFIRMED ||
            order.status === OrderStatus.PROCESSING
          );
        });
      }

      // 按国家筛选
      if (exportConfig.filterByCountry) {
        console.log(`开始按国家筛选，选择的国家: ${exportConfig.selectedCountry}`);
        orders = orders.filter(order => {
          const countryCode = getCountryCode(order);
          console.log(
            `订单 ${order.order_number}: language_code=${order.language_code}, 判断国家=${countryCode}, 匹配=${countryCode === exportConfig.selectedCountry}`
          );
          return countryCode === exportConfig.selectedCountry;
        });
        console.log(`按国家筛选后剩余: ${orders.length} 条`);
      }
    }

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    console.log(`过滤前订单数量: ${orders.length} 条`);

    // 去重：根据手机号去重
    const uniqueOrders = new Map<string, Order>();
    orders.forEach(order => {
      const phone = order.phone || "";
      // 如果该手机号还不存在，或者当前订单更早，则保留
      if (!uniqueOrders.has(phone)) {
        uniqueOrders.set(phone, order);
      } else {
        // 保留订单号较小的（通常是较早的订单）
        const existingOrder = uniqueOrders.get(phone)!;
        if (order.order_number < existingOrder.order_number) {
          uniqueOrders.set(phone, order);
        }
      }
    });
    orders = Array.from(uniqueOrders.values());

    console.log(`去重后订单数量: ${orders.length} 条，将要导出`);

    // 匈牙利发货模板字段映射（使用原始模板的表头）
    const hungaryTemplateFields = [
      "仓库编码",
      "客户编码",
      "客户单号",
      "物流编码",
      "物流网点",
      "物流单号",
      "物流单号2",
      "运输方式",
      "国家/地区",
      "收件人姓名",
      "邮箱",
      "州,省",
      "城市",
      "联系地址",
      "地址备注1",
      "地址备注2",
      "收件人电话",
      "收件人邮编",
      "代收货款币种",
      "代收款金额",
      "订单备注",
      "配货信息",
      "货物类型",
      "规格信息",
      "申报品数量",
      "SKU",
      "配货名称",
      "申报币种",
      "申报金额",
      "税号类型"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];

    // 添加表头
    excelData.push(hungaryTemplateFields);

    // 功能6：统计空邮箱数量，用于自动填充
    let emptyEmailCount = 0;

    // 在模板基础上添加新的订单数据
    orders.forEach(order => {
      const row: any[] = [];

      // 仓库编码 - 固定值
      row.push("HU01");

      // 客户编码 - 固定值
      row.push("773");

      // 功能5：客户单号 - 使用系统订单号而不是配置的起始值递增
      row.push(order.order_number || "");

      // 物流编码 - 空
      row.push("");

      // 物流网点 - 空
      row.push("");

      // 物流单号 - 空
      row.push("");

      // 物流单号2 - 空
      row.push("");

      // 功能2和3：根据订单数据自动判断国家和运输方式
      const countryCode = getCountryCode(order);
      const countryName = countryCodeMap[countryCode] || "斯洛伐克";

      // 功能3：运输方式 - 根据国家代码自动填充
      const transportMethod = getTransportMethod(countryCode);
      row.push(transportMethod);

      // 功能2：国家/地区 - 自动填充（使用映射后的国家名称）
      row.push(countryName);

      // 收件人姓名
      row.push(order.customer_name || "");

      // 功能6：邮箱 - 如果为空，自动填充testN@gmail.com
      let email = order.email || "";
      if (!email || email.trim() === "") {
        emptyEmailCount++;
        email = `test${emptyEmailCount}@gmail.com`;
      }
      row.push(email);

      // 州,省
      row.push(order.province || "");

      // 城市
      row.push(order.city || "");

      // 处理联系地址规则：如果地址以城市名开头，去掉城市名部分
      let processedAddress = order.address || "";
      if (order.city && order.address) {
        // 如果联系地址以城市名开头，去掉城市名部分
        if (order.address.startsWith(order.city)) {
          processedAddress = order.address.substring(order.city.length).trim();
          // 如果去掉城市名后还有内容，使用处理后的地址；否则使用原地址
          if (processedAddress) {
            // 如果处理后的地址以逗号开头，去掉逗号
            if (processedAddress.startsWith(",")) {
              processedAddress = processedAddress.substring(1).trim();
            }
          } else {
            processedAddress = order.address;
          }
        }
      }

      // 联系地址
      row.push(processedAddress);

      // 地址备注1 - 默认填充原始联系地址
      row.push(order.address || "");

      // 地址备注2 - 空
      row.push("");

      // 收件人电话
      row.push(order.phone || "");

      // 收件人邮编
      row.push(order.postal_code || "");

      // 代收货款币种
      row.push(order.currency || "EUR");

      // 代收款金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 订单备注 - 空
      row.push("");

      // 功能4：配货信息 - 清理表情和特殊字符
      const cleanedProductInfo = removeEmojiAndSpecialChars(order.product_title || "");
      row.push(cleanedProductInfo);

      // 货物类型（默认为P，只有仿品才是R）
      // original = P (正品), fake = R (仿品), replica = R (仿品)
      row.push(order.product_type === "fake" || order.product_type === "replica" ? "R" : "P");

      // 规格信息 - 使用配置的值
      row.push(exportConfig.specification);

      // 申报品数量
      row.push(order.quantity || 1);

      // SKU - 使用配置的值
      row.push(exportConfig.sku);

      // 功能4：配货名称 - 清理表情和特殊字符
      const cleanedProductName = removeEmojiAndSpecialChars(order.product_title || "");
      row.push(cleanedProductName);

      // 申报币种
      row.push(order.currency || "EUR");

      // 申报金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 税号类型 - 空
      row.push("");

      // 添加到Excel数据中
      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = hungaryTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "匈牙利发货订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `匈牙利发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为跨速达模板`);

    // 保存配置到缓存
    saveExportConfigToCache();

    // 异步处理订单状态更新和发送邮件（不阻塞导出流程）
    if (exportConfig.updateShippedStatus || exportConfig.sendShippedEmail) {
      // 使用 setTimeout 确保异步执行，不影响导出流程
      setTimeout(() => {
        handlePostExportActions(orders);
      }, 100);
    }
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
    // 重置单个订单导出模式
    if (singleOrderExportMode.value) {
      singleOrderExportMode.value = false;
      singleOrderToExport.value = null;
      singleOrderLogisticsCompany.value = "";
      // 恢复默认导出数量
      exportConfig.exportLimit = 100;
    }
  }
};

// 华熙导出 - 波兰COD模板格式
const handleHuaxiExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`华熙单个订单导出模式: ${orders[0].order_number}`);
    } else {
      // 批量导出模式：查询订单数据
      const exportLimit = exportConfig.exportLimit || 100;
      const params: OrderListParams = {
        page: 1,
        size: exportLimit,
        order_number: searchForm.order_number || undefined,
        customer_name: searchForm.customer_name || undefined,
        phone: searchForm.phone || undefined,
        status: (searchForm.status as OrderStatus) || undefined,
        start_date: searchForm.start_date || undefined,
        end_date: searchForm.end_date || undefined,
        product_id: searchForm.product_id || undefined
      };

      // 如果选择只导出未发货的订单
      if (exportConfig.onlyUnshipped) {
        params.status = undefined;
      }

      const { data } = await getOrderListApi(params);
      orders = data.list;

      // 前端过滤未发货订单
      if (exportConfig.onlyUnshipped) {
        orders = orders.filter(order => {
          return (
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.CONFIRMED ||
            order.status === OrderStatus.PROCESSING
          );
        });
      }

      // 按国家筛选
      if (exportConfig.filterByCountry) {
        orders = orders.filter(order => {
          const countryCode = getCountryCode(order);
          return countryCode === exportConfig.selectedCountry;
        });
      }
    }

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    console.log(`华熙导出：获取到 ${orders.length} 条订单数据`);

    // 华熙模板字段（完整的22个字段）
    const huaxiTemplateFields = [
      "客户单号",
      "转单号",
      "运输方式",
      "目的国家",
      "收件人姓名",
      "州,省",
      "城市",
      "联系地址",
      "收件人门牌号",
      "收件人电话",
      "收件人邮箱",
      "收件人邮编",
      "重量",
      "海关报关品名1",
      "中文品名1",
      "配货信息1",
      "申报价值1",
      "申报品数量1",
      "代收货款",
      "代收币种",
      "IOSS税号",
      "保险金额"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];
    excelData.push(huaxiTemplateFields);

    // 统计空邮箱数量
    let emptyEmailCount = 0;

    orders.forEach(order => {
      const row: any[] = [];

      // 客户单号 - 使用系统订单号
      row.push(order.order_number || "");

      // 转单号 - 留空
      row.push("");

      // 运输方式 - 使用配置的值
      row.push(exportConfig.huaxiTransportMethod);

      // 目的国家 - 从订单获取国家代码并映射（使用华熙专用映射）
      const countryCode = getCountryCode(order);
      const countryName = huaxiCountryCodeMap[countryCode] || "";
      row.push(countryName);

      // 收件人姓名
      row.push(order.customer_name || "");

      // 州,省
      row.push(order.province || "");

      // 城市
      row.push(order.city || "");

      // 联系地址
      row.push(order.address || "");

      // 收件人门牌号 - 留空
      row.push("");

      // 收件人电话
      row.push(order.phone || "");

      // 收件人邮箱 - 如果为空，自动填充testN@gmail.com
      let email = order.email || "";
      if (!email || email.trim() === "") {
        emptyEmailCount++;
        email = `test${emptyEmailCount}@gmail.com`;
      }
      row.push(email);

      // 收件人邮编
      row.push(order.postal_code || "");

      // 重量
      row.push(exportConfig.huaxiWeight);

      // 海关报关品名1
      const cleanedCustomsName = removeEmojiAndSpecialChars(exportConfig.huaxiCustomsName);
      row.push(cleanedCustomsName);

      // 中文品名1
      const cleanedChineseName = removeEmojiAndSpecialChars(exportConfig.huaxiChineseName);
      row.push(cleanedChineseName);

      // 配货信息1
      const cleanedProductInfo = removeEmojiAndSpecialChars(exportConfig.huaxiProductInfo);
      row.push(cleanedProductInfo);

      // 申报价值1 - 固定10
      row.push("10");

      // 申报品数量1
      row.push(order.quantity || 1);

      // 代收货款
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 代收币种
      row.push(order.currency || "EUR");

      // IOSS税号 - 留空
      row.push("");

      // 保险金额 - 留空
      row.push("");

      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = huaxiTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "华熙发货订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `华熙发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为华熙模板`);

    // 保存配置到缓存
    saveExportConfigToCache();

    // 异步处理订单状态更新和发送邮件（不阻塞导出流程）
    if (exportConfig.updateShippedStatus || exportConfig.sendShippedEmail) {
      // 使用 setTimeout 确保异步执行，不影响导出流程
      setTimeout(() => {
        handlePostExportActions(orders);
      }, 100);
    }
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
    // 重置单个订单导出模式
    if (singleOrderExportMode.value) {
      singleOrderExportMode.value = false;
      singleOrderToExport.value = null;
      singleOrderLogisticsCompany.value = "";
      // 恢复默认导出数量
      exportConfig.exportLimit = 100;
    }
  }
};

// 盈派导出
const handleYingpaiExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`盈派单个订单导出模式: ${orders[0].order_number}`);
    } else {
      // 批量导出模式：查询订单数据
      const exportLimit = exportConfig.exportLimit || 100;
      const params: OrderListParams = {
        page: 1,
        size: exportLimit,
        order_number: searchForm.order_number || undefined,
        customer_name: searchForm.customer_name || undefined,
        phone: searchForm.phone || undefined,
        status: (searchForm.status as OrderStatus) || undefined,
        start_date: searchForm.start_date || undefined,
        end_date: searchForm.end_date || undefined,
        product_id: searchForm.product_id || undefined
      };

      // 如果选择只导出未发货的订单
      if (exportConfig.onlyUnshipped) {
        params.status = undefined;
      }

      const { data } = await getOrderListApi(params);
      orders = data.list;

      // 前端过滤未发货订单
      if (exportConfig.onlyUnshipped) {
        orders = orders.filter(order => {
          return (
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.CONFIRMED ||
            order.status === OrderStatus.PROCESSING
          );
        });
      }

      // 按国家筛选
      if (exportConfig.filterByCountry) {
        orders = orders.filter(order => {
          const countryCode = getCountryCode(order);
          return countryCode === exportConfig.selectedCountry;
        });
      }
    }

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    console.log(`盈派导出：获取到 ${orders.length} 条订单数据`);

    // 盈派模板字段（完整44个字段）
    const yingpaiTemplateFields = [
      "快递单号（请勿填写）",
      "参考单号", // 必填
      "快递物流商", // 必填
      "代收货款", // 必填
      "收件人姓名", // 必填
      "收件人公司",
      "收件人邮箱",
      "收件人地址", // 必填
      "收件人电话", // 必填
      "收件人邮编", // 必填
      "收件人手机", // 必填
      "收件人省",
      "收件人城市", // 必填
      "收件人区", // 必填
      "SKU1", // 必填
      "SKU1件数", // 必填
      "SKU2",
      "SKU2件数",
      "SKU3",
      "SKU3件数",
      "SKU4",
      "SKU4件数",
      "SKU5",
      "SKU5件数",
      "SKU6",
      "SKU6件数",
      "SKU7",
      "SKU7件数",
      "SKU8",
      "SKU8件数",
      "SKU9",
      "SKU9件数",
      "SKU10",
      "SKU10件数",
      "国家（二字代码）", // 必填
      "备注",
      "面单标题（现在在面单上）",
      "订单标题",
      "电商平台",
      "所属店铺",
      "订单总金额",
      "订单总金额币种",
      "独立站URL",
      "收件人门牌号码"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];
    excelData.push(yingpaiTemplateFields);

    orders.forEach(order => {
      const row: any[] = [];

      // 快递单号（请勿填写）- 留空
      row.push("");

      // 参考单号 - 使用系统订单号（必填）
      row.push(order.order_number || "");

      // 快递物流商 - 使用配置的值（必填）
      row.push(exportConfig.yingpaiLogistics || "欧洲小包特货");

      // 代收货款（必填）
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 收件人姓名（必填）
      row.push(order.customer_name || "");

      // 收件人公司（选填）
      row.push("");

      // 收件人邮箱（选填）
      row.push(order.email || "");

      // 收件人地址（必填）
      row.push(order.address || "");

      // 收件人电话（必填）
      row.push(order.phone || "");

      // 收件人邮编（必填）
      row.push(order.postal_code || "");

      // 收件人手机（必填）
      row.push(order.phone || "");

      // 收件人省（选填）
      row.push(order.province || "");

      // 收件人城市（必填）
      row.push(order.city || "");

      // 收件人区（必填）
      row.push(order.district || "");

      // SKU1 - 使用配置的值（必填）
      row.push(exportConfig.yingpaiSku || "15000W");

      // SKU1件数 - 默认1件（必填）
      row.push(1);

      // SKU2（选填）
      row.push("");

      // SKU2件数（选填）
      row.push("");

      // SKU3（选填）
      row.push("");

      // SKU3件数（选填）
      row.push("");

      // SKU4（选填）
      row.push("");

      // SKU4件数（选填）
      row.push("");

      // SKU5（选填）
      row.push("");

      // SKU5件数（选填）
      row.push("");

      // SKU6（选填）
      row.push("");

      // SKU6件数（选填）
      row.push("");

      // SKU7（选填）
      row.push("");

      // SKU7件数（选填）
      row.push("");

      // SKU8（选填）
      row.push("");

      // SKU8件数（选填）
      row.push("");

      // SKU9（选填）
      row.push("");

      // SKU9件数（选填）
      row.push("");

      // SKU10（选填）
      row.push("");

      // SKU10件数（选填）
      row.push("");

      // 国家（二字代码）（必填）
      const countryCode = getCountryCode(order);
      row.push(countryCode);

      // 备注（选填）
      row.push(order.comments || "");

      // 面单标题（现在在面单上）（选填）
      row.push("");

      // 订单标题（选填）
      row.push("");

      // 电商平台（选填）
      row.push("");

      // 所属店铺（选填）
      row.push("");

      // 订单总金额（选填）
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 订单总金额币种（选填）
      row.push(order.currency || "EUR");

      // 独立站URL（选填）
      row.push("");

      // 收件人门牌号码（选填）
      row.push("");

      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = yingpaiTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "盈派发货订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `盈派发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为盈派模板`);

    // 保存配置到缓存
    saveExportConfigToCache();

    // 异步处理订单状态更新和发送邮件（不阻塞导出流程）
    if (exportConfig.updateShippedStatus || exportConfig.sendShippedEmail) {
      // 使用 setTimeout 确保异步执行，不影响导出流程
      setTimeout(() => {
        handlePostExportActions(orders);
      }, 100);
    }
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
    // 重置单个订单导出模式
    if (singleOrderExportMode.value) {
      singleOrderExportMode.value = false;
      singleOrderToExport.value = null;
      singleOrderLogisticsCompany.value = "";
      // 恢复默认导出数量
      exportConfig.exportLimit = 100;
    }
  }
};

// 选择变化
const handleSelectionChange = (selection: Order[]) => {
  selectedOrders.value = selection;
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

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params: OrderListParams = {
      page: pagination.current,
      size: pagination.size,
      order_number: searchForm.order_number || undefined,
      customer_name: searchForm.customer_name || undefined,
      phone: searchForm.phone || undefined,
      status: (searchForm.status as OrderStatus) || undefined,
      start_date: searchForm.start_date || undefined,
      end_date: searchForm.end_date || undefined,
      product_id: searchForm.product_id || undefined
    };

    const { data } = await getOrderListApi(params);
    tableData.value = data.list;
    pagination.total = data.total;
  } catch (error) {
    ElMessage.error("获取订单列表失败");
  } finally {
    loading.value = false;
  }
};

// 地址字符串处理函数
const getAddressString = (province: string, city: string, district: string): string => {
  return [province, city, district].filter(Boolean).join(" ") || "--";
};

// 商品类型标签
const getProductTypeLabel = (type: string): string => {
  const labels = {
    original: "正品",
    replica: "仿品"
  };
  return labels[type as keyof typeof labels] || type;
};

// 商品类型颜色
const getProductTypeColor = (type: string): string => {
  const colors = {
    original: "success",
    replica: "warning"
  };
  return colors[type as keyof typeof colors] || "info";
};

// 商品筛选相关方法
const openProductDialog = () => {
  productDialogVisible.value = true;
  productSearchKeyword.value = "";
  selectedProducts.value = [];
  productPagination.current = 1;
  loadProducts();
};

const loadProducts = async () => {
  productLoading.value = true;
  try {
    const params = {
      page: productPagination.current,
      size: productPagination.size,
      title: productSearchKeyword.value || undefined,
      product_type: "original" // 只显示正品，排除仿品
    };

    const response = await getProductListApi(params);

    if (response && response.data) {
      productList.value = response.data.list || [];
      productPagination.total = response.data.total || 0;
    } else {
      productList.value = [];
      productPagination.total = 0;
    }
  } catch (error) {
    console.error("加载商品列表失败:", error);
    ElMessage.error("加载商品列表失败");
    productList.value = [];
    productPagination.total = 0;
  } finally {
    productLoading.value = false;
  }
};

const searchProducts = () => {
  productPagination.current = 1;
  loadProducts();
};

const handleProductSelectionChange = (selection: Product[]) => {
  selectedProducts.value = selection;
};

const confirmProductSelection = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning("请选择商品");
    return;
  }

  if (selectedProducts.value.length > 1) {
    ElMessage.warning("只能选择一个商品");
    return;
  }

  const product = selectedProducts.value[0];
  searchForm.product_id = product.id;
  selectedProductName.value = product.title;
  productDialogVisible.value = false;
  handleSearch();
};

const clearProduct = () => {
  searchForm.product_id = "";
  selectedProductName.value = "";
  selectedProducts.value = [];
  handleSearch();
};

const handleProductSizeChange = (size: number) => {
  productPagination.size = size;
  loadProducts();
};

const handleProductCurrentChange = (current: number) => {
  productPagination.current = current;
  loadProducts();
};

// 初始化
onMounted(() => {
  loadData();
  loadExportConfigFromCache(); // 加载导出配置缓存
});
</script>

<style scoped>
.order-management {
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
.table-actions {
  display: flex;
  gap: 8px;
}

/* 订单号 */
.order-number {
  font-family: "Courier New", monospace;
  font-weight: 500;
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

/* 客户信息 */
.customer-info {
  line-height: 1.5;
}
.customer-name {
  font-weight: 500;
  margin-bottom: 2px;
}
.customer-phone {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}
.customer-email {
  font-size: 12px;
  color: #999;
}

/* 地址信息 */
.address-info {
  line-height: 1.4;
  color: #666;
}

.address-line {
  display: flex;
  margin-bottom: 2px;
  font-size: 12px;
}

.address-label {
  color: #909399;
  margin-right: 4px;
  min-width: 30px;
  flex-shrink: 0;
}

.address-value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

/* 备注行特殊样式 - 只限制备注为一行 */
.comments-value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.address-detail {
  line-height: 1.6;
}

.address-detail .address-line {
  margin-bottom: 4px;
  font-size: 14px;
}

.address-detail .address-label {
  color: #909399;
  margin-right: 8px;
  min-width: 60px;
  flex-shrink: 0;
}

.address-detail .address-value {
  color: #606266;
  flex: 1;
}

/* 支付信息合并样式 */
.payment-info-combined {
  text-align: center;
  line-height: 1.5;
}

.payment-info-combined .amount-info {
  margin-bottom: 6px;
}

.payment-info-combined .amount {
  font-weight: 600;
  color: #e6a23c;
  margin-right: 4px;
}

.payment-info-combined .currency {
  font-size: 12px;
  color: #999;
}

.payment-info-combined .payment-method-info {
  margin-bottom: 6px;
}

.payment-info-combined .status-info {
  margin-bottom: 6px;
}

.payment-info-combined .time-info {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
}

.payment-info-combined .time-icon {
  font-size: 12px;
  color: #909399;
}

/* IP/来源合并样式 */
.ip-url-info {
  line-height: 1.5;
}

.ip-url-info .ip-sk-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ip-url-info .ip-address {
  flex-shrink: 0;
}

.ip-url-info .sk-info {
  flex-shrink: 0;
}

.ip-url-info .ip-location {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 4px;
}

.ip-url-info .ip-no-location {
  text-align: center;
  margin-bottom: 4px;
}

.ip-url-info .url-section {
  margin-top: 6px;
}

.ip-url-info .url-info {
  text-align: center;
  word-break: break-all;
}

.ip-url-info .em-param {
  margin-top: 6px;
  text-align: center;
}

/* em参数标签样式（金色显眼） */
.em-tag {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(253, 160, 133, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.em-tag .el-icon {
  margin-right: 4px;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(253, 160, 133, 0.4);
  }
  50% {
    box-shadow: 0 4px 16px rgba(253, 160, 133, 0.6);
  }
}

.url-with-em {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 邮件发送状态标签样式 */
.email-sent-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.email-sent-tag .el-icon {
  font-size: 12px;
}

.status-info {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

/* 时间信息 */
.time-info {
  display: flex;
  gap: 6px;
  align-items: center;
}
.time-icon {
  font-size: 14px;
  color: #909399;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 批量操作 */
.batch-actions {
  margin: 16px 0;
}
.batch-buttons {
  margin-top: 8px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

/* 订单详情 */
.order-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.product-detail-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.product-detail-text {
  flex: 1;
}

.product-detail-text .product-title {
  font-weight: 500;
  margin-bottom: 8px;
}

.product-detail-text .product-price,
.product-detail-text .product-quantity {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

/* 新增字段样式 */
.ip-info {
  text-align: center;
}

.ip-address {
  margin-bottom: 4px;
}

.ip-location {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
}

.ip-no-location {
  margin-top: 4px;
  text-align: center;
}

.url-info {
  word-break: break-all;
}

.user-agent-info {
  word-break: break-all;
  max-width: 300px;
}

.no-data {
  color: #999;
  font-size: 12px;
}

/* 对话框 */
.dialog-footer {
  text-align: right;
}

/* 商品选择对话框样式 */
.product-selector {
  max-height: 60vh;
  overflow-y: auto;
}

.product-search {
  margin-bottom: 16px;
}

.product-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 导出配置对话框样式 */
.export-config {
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .export-description {
    ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    li {
      margin: 4px 0;
      font-size: 13px;
    }
  }
}

/* 邮件预览对话框样式 */
.email-preview {
  max-height: 70vh;
  overflow-y: auto;
}

.email-content-preview {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background-color: #f5f5f5;
  max-height: 500px;
  overflow-y: auto;
}

.email-content-preview img {
  max-width: 100%;
  height: auto;
}

/* 响应式设计 */
@media (width <= 768px) {
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
  .table-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
