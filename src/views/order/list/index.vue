<template>
  <div class="order-management">
    <!-- 国家导航栏 -->
    <div class="country-nav-bar">
      <div class="country-nav-title">
        <el-icon><Location /></el-icon>
        <span>国家筛选</span>
      </div>
      <div class="country-nav-list">
        <div class="country-nav-item" :class="{ active: searchForm.country === '' }" @click="handleCountryFilter('')">
          <span class="country-name">全部</span>
          <span class="country-count">{{ totalOrderCount }}</span>
        </div>
        <div
          v-for="country in sortedCountryOptions.withOrders"
          :key="country.code"
          class="country-nav-item"
          :class="{ active: searchForm.country === country.code }"
          @click="handleCountryFilter(country.code)"
        >
          <span class="country-flag">{{ getCountryFlag(country.code) }}</span>
          <span class="country-name">{{ country.name }}</span>
          <span class="country-count">{{ country.count }}</span>
        </div>
      </div>
    </div>

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
        <el-form-item label="国家筛选">
          <el-select v-model="searchForm.country" placeholder="请选择国家" clearable style="width: 200px">
            <!-- 有订单的国家 -->
            <el-option
              v-for="country in sortedCountryOptions.withOrders"
              :key="country.code"
              :label="`${country.name} (${country.count}条)`"
              :value="country.code"
            />
            <!-- 分隔线 -->
            <el-option v-if="sortedCountryOptions.withOrders.length > 0" disabled value="">
              <span style="color: #dcdfe6">──────────</span>
            </el-option>
            <!-- 无订单的国家 -->
            <el-option
              v-for="country in sortedCountryOptions.withoutOrders"
              :key="country.code"
              :label="country.name"
              :value="country.code"
            />
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
            <span>订单列表</span>
            <el-tag type="info" size="small">{{ pagination.total }} 条记录</el-tag>
          </div>
          <div class="table-actions">
            <el-button size="small" @click="handleExportDialog" :loading="exportLoading">
              <el-icon><Download /></el-icon>
              导出订单
            </el-button>
            <el-button size="small" type="primary" @click="handleExportIPs" :loading="exportIPLoading">
              <el-icon><Download /></el-icon>
              导出IP
            </el-button>
            <el-button size="small" type="success" @click="handleExportCustomerMatch" :loading="exportCustomerMatchLoading">
              <el-icon><Download /></el-icon>
              导出Google受众
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
        <el-table-column label="客户信息" width="200">
          <template #default="{ row }">
            <div class="customer-info">
              <div class="customer-name">{{ row.customer_name }}</div>
              <div class="customer-phone" :class="{ 'duplicate-phone': isPhoneDuplicate(row) }">
                {{ row.phone }}
                <span
                  v-if="isPhoneDuplicate(row)"
                  class="duplicate-badge"
                  :title="`相同手机号有 ${getPhoneDuplicateCount(row)} 个其他订单`"
                >
                  (重复{{ getPhoneDuplicateCount(row) }})
                </span>
              </div>
              <div
                v-if="row.email"
                class="customer-email"
                :class="{ 'invalid-email': !isEmailValid(row.email), 'duplicate-email': isEmailDuplicate(row) }"
              >
                {{ row.email }}
                <span
                  v-if="isEmailDuplicate(row)"
                  class="duplicate-badge"
                  :title="`相同邮箱有 ${getEmailDuplicateCount(row)} 个其他订单`"
                >
                  (重复{{ getEmailDuplicateCount(row) }})
                </span>
                <el-tooltip v-if="!isEmailValid(row.email)" content="邮箱格式不正确" placement="top">
                  <el-tag type="warning" size="small" class="email-invalid-tag" style="margin-left: 4px">
                    <el-icon><Warning /></el-icon>
                    邮箱有误
                  </el-tag>
                </el-tooltip>
              </div>
              <div v-if="row.gender || row.age" class="customer-extra">
                <span v-if="row.gender" class="gender-tag">
                  {{ formatGender(row.gender) }}
                </span>
                <span v-if="row.age" class="age-tag"> {{ row.age }}岁 </span>
              </div>
              <div v-if="!row.gender && !row.age" class="customer-extra">
                <span class="not-filled">未完善</span>
              </div>
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
                <el-tag type="success" size="small" class="complaint-tag" style="margin-left: 4px">备注疑是客诉订单</el-tag>
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
                <el-tag v-if="row.product_template" size="small" type="primary" style="margin-left: 4px">
                  {{ row.product_template }}
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
                <!-- 短信发送状态标识 -->
                <el-tooltip v-if="row.sms_sent" :content="`已发送${row.sms_sent_count}条短信`" placement="top">
                  <el-tag type="success" size="small" style="margin-left: 4px" class="sms-sent-tag">
                    <el-icon><Iphone /></el-icon>
                    已发短信
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
                  <el-tag
                    size="small"
                    :type="isIPDuplicate(row) ? 'danger' : 'info'"
                    style="cursor: pointer"
                    :class="{ 'duplicate-ip': isIPDuplicate(row) }"
                    :title="isIPDuplicate(row) ? `相同IP地址有 ${getIPDuplicateCount(row)} 个其他订单` : ''"
                    @click="handleViewIPInfo(row.ip_address)"
                  >
                    {{ row.ip_address }}
                  </el-tag>
                  <el-button
                    size="small"
                    type="danger"
                    link
                    style="margin-left: 4px"
                    @click="handleBlacklistIP(row)"
                    title="拉黑此IP，该IP只能看到仿品页面"
                  >
                    <el-icon><CircleClose /></el-icon>
                  </el-button>
                </div>
                <div class="fingerprint-info" v-if="row.fingerprint">
                  <el-tag
                    size="small"
                    :type="isFingerprintDuplicate(row) ? 'danger' : 'warning'"
                    style="cursor: pointer"
                    :class="{ 'duplicate-fingerprint': isFingerprintDuplicate(row) }"
                    :title="isFingerprintDuplicate(row) ? `相同指纹有 ${getFingerprintDuplicateCount(row)} 个其他订单` : ''"
                    @click="handleViewFingerprintHistory(row)"
                  >
                    FP: {{ row.fingerprint }}
                  </el-tag>
                </div>
                <div class="sk-info" v-if="row.product_template">
                  <el-tag size="small" type="primary">
                    {{ row.product_template }}
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
              <div v-if="!row.ip_address && !row.fingerprint && !row.from_url" class="no-data">--</div>
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
              <el-dropdown v-if="row.phone" @command="command => handleSmsAction(row, command)">
                <el-button size="small" type="success" link>
                  <el-icon><Iphone /></el-icon>
                  短信
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="picking">📦 拣货通知</el-dropdown-item>
                    <el-dropdown-item command="shipped">🚚 发货通知</el-dropdown-item>
                    <el-dropdown-item command="arrival" divided>📍 到达提醒</el-dropdown-item>
                    <el-dropdown-item command="reshipment">🔄 补发通知</el-dropdown-item>
                    <el-dropdown-item command="custom" divided>📝 自定义短信</el-dropdown-item>
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
                    <el-dropdown-item command="kuasuoda">📦 跨速达(匈牙利)</el-dropdown-item>
                    <el-dropdown-item command="kuasuoda_spain">📦 跨速达(西班牙)</el-dropdown-item>
                    <el-dropdown-item command="huaxi">🚚 华熙</el-dropdown-item>
                    <el-dropdown-item command="huaxi_lingxing">🚚 华熙-领星</el-dropdown-item>
                    <el-dropdown-item command="yingpai">✈️ 盈派</el-dropdown-item>
                    <el-dropdown-item command="shenghong">🌲 森鸿(奥地利)</el-dropdown-item>
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
              <el-dropdown @command="handleBatchExport">
                <el-button size="small" type="primary">
                  <el-icon><Download /></el-icon>
                  批量导出
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="kuasuoda">📦 跨速达(匈牙利)</el-dropdown-item>
                    <el-dropdown-item command="kuasuoda_spain">📦 跨速达(西班牙)</el-dropdown-item>
                    <el-dropdown-item command="huaxi">🚚 华熙</el-dropdown-item>
                    <el-dropdown-item command="huaxi_lingxing">🚚 华熙-领星</el-dropdown-item>
                    <el-dropdown-item command="yingpai">✈️ 盈派</el-dropdown-item>
                    <el-dropdown-item command="shenghong">🌲 森鸿(奥地利)</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
          <el-descriptions-item label="性别">
            {{ currentOrder.gender ? formatGender(currentOrder.gender) : "未填写" }}
          </el-descriptions-item>
          <el-descriptions-item label="年龄">
            {{ currentOrder.age ? currentOrder.age + "岁" : "未填写" }}
          </el-descriptions-item>
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
        <el-descriptions title="商品信息" :column="2" border style="margin-top: 20px">
          <el-descriptions-item label="商品" :span="2">
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
          <el-descriptions-item label="商品国家">
            <el-tag v-if="currentOrder.product_country" type="success" size="small">
              {{ getCountryName(currentOrder.product_country) }}
            </el-tag>
            <span v-else class="no-data">--</span>
          </el-descriptions-item>
          <el-descriptions-item label="商品模版">
            <el-tag v-if="currentOrder.product_template" type="primary" size="small">
              {{ currentOrder.product_template }}
            </el-tag>
            <span v-else class="no-data">--</span>
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
          <el-descriptions-item label="发货邮件状态">
            <el-tag v-if="currentOrder.shipped_email_sent" type="success" size="small">
              <el-icon><Message /></el-icon>
              已发送
            </el-tag>
            <el-tag v-else type="info" size="small">
              <el-icon><Close /></el-icon>
              未发送
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="短信发送状态">
            <el-tag v-if="currentOrder.sms_sent" type="success" size="small">
              <el-icon><Iphone /></el-icon>
              已发送 {{ currentOrder.sms_sent_count }} 条
            </el-tag>
            <el-tag v-else type="info" size="small">
              <el-icon><Close /></el-icon>
              未发送
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
    <el-dialog v-model="ipInfoDialogVisible" title="IP详细信息" width="900px" :close-on-click-modal="false" destroy-on-close>
      <div v-loading="ipInfoLoading" class="ip-info-content">
        <!-- 推荐追踪信息 -->
        <el-alert
          v-if="currentRecommendData && Object.keys(currentRecommendData).length > 0"
          type="success"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #title>
            <div style="display: flex; align-items: center; gap: 8px">
              <el-icon><Star /></el-icon>
              <span>推荐产品追踪</span>
            </div>
          </template>
          <div style="margin-top: 12px">
            <div
              v-for="(trackData, productId) in currentRecommendData"
              :key="productId"
              style="margin-bottom: 12px; padding: 12px; background: #f0f9ff; border-radius: 6px"
            >
              <div style="font-weight: 600; margin-bottom: 8px; color: #333">产品ID: {{ productId }}</div>
              <div style="display: flex; gap: 16px; font-size: 13px">
                <div>
                  <el-tag type="success" size="small">展示</el-tag>
                  <span style="margin-left: 4px">{{ trackData.show ? "是" : "否" }}</span>
                  <span v-if="trackData.show_time" style="margin-left: 4px; color: #999">
                    ({{ formatTimestamp(trackData.show_time) }})
                  </span>
                </div>
                <div v-if="trackData.clicks && trackData.clicks.length > 0">
                  <el-tag type="warning" size="small">点击</el-tag>
                  <span style="margin-left: 4px">{{ trackData.clicks.length }} 个推荐</span>
                  <div style="margin-top: 4px; color: #666">
                    <span v-for="(clickId, idx) in trackData.clicks" :key="idx" style="margin-right: 8px"> → {{ clickId }} </span>
                  </div>
                </div>
                <div v-else>
                  <el-tag type="info" size="small">点击</el-tag>
                  <span style="margin-left: 4px">未点击</span>
                </div>
              </div>
            </div>
          </div>
        </el-alert>

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

        <!-- 该IP下的订单列表 -->
        <div v-if="ipOrders.length > 0" class="ip-orders-section" style="margin-top: 24px">
          <div class="section-title" style="font-weight: 600; margin-bottom: 12px; font-size: 15px">
            <el-icon><List /></el-icon>
            该IP下的订单 (共 {{ ipOrders.length }} 个)
          </div>
          <el-table :data="ipOrders" border size="small" max-height="300">
            <el-table-column label="订单号" prop="order_number" width="140" show-overflow-tooltip />
            <el-table-column label="客户" min-width="100">
              <template #default="{ row }">{{ row.customer_name }}</template>
            </el-table-column>
            <el-table-column label="商品" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ row.product_title || "--" }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="OrderStatusColors[row.status]" size="small">
                  {{ OrderStatusLabels[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                {{ row.total_amount || row.product_price * row.quantity }} {{ row.currency }}
              </template>
            </el-table-column>
            <el-table-column label="下单时间" width="160">
              <template #default="{ row }">{{ row.created_at }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else-if="!ipInfoLoading && currentViewingIP" description="该IP暂无订单记录" style="margin-top: 16px" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ipInfoDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 指纹历史订单对话框 -->
    <el-dialog
      v-model="fingerprintDialogVisible"
      title="浏览器指纹历史订单"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-loading="fingerprintLoading" class="ip-info-content">
        <el-descriptions :column="1" border style="margin-bottom: 16px">
          <el-descriptions-item label="指纹ID">
            <el-tag type="warning">{{ currentViewingFingerprint || "--" }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="fingerprintOrders.length > 0" class="ip-orders-section" style="margin-top: 24px">
          <div class="section-title" style="font-weight: 600; margin-bottom: 12px; font-size: 15px">
            <el-icon><List /></el-icon>
            该指纹下的订单 (共 {{ fingerprintOrders.length }} 个)
          </div>
          <el-table :data="fingerprintOrders" border size="small" max-height="360">
            <el-table-column label="订单号" prop="order_number" width="140" show-overflow-tooltip />
            <el-table-column label="客户" min-width="100">
              <template #default="{ row }">{{ row.customer_name }}</template>
            </el-table-column>
            <el-table-column label="电话" prop="phone" min-width="120" show-overflow-tooltip />
            <el-table-column label="商品" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">{{ row.product_title || "--" }}</template>
            </el-table-column>
            <el-table-column label="IP" prop="ip_address" width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="OrderStatusColors[row.status]" size="small">
                  {{ OrderStatusLabels[row.status] || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">
                {{ row.total_amount || row.product_price * row.quantity }} {{ row.currency }}
              </template>
            </el-table-column>
            <el-table-column label="下单时间" width="160">
              <template #default="{ row }">{{ row.created_at }}</template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewDetail(row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else-if="!fingerprintLoading && currentViewingFingerprint" description="该指纹暂无订单记录" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="fingerprintDialogVisible = false">关闭</el-button>
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
          : exportConfig.logisticsCompany === 'huaxi_lingxing'
            ? '导出华熙-领星订单'
            : exportConfig.logisticsCompany === 'yingpai'
              ? '导出盈派订单'
              : exportConfig.logisticsCompany === 'shenghong'
                ? '导出森鸿订单（奥地利）'
                : exportConfig.logisticsCompany === 'kuasuoda_spain'
                  ? '导出跨速达订单（西班牙）'
                  : '导出跨速达订单（匈牙利）'
      "
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="export-config">
        <el-form :model="exportConfig" label-width="120px">
          <el-form-item label="物流公司">
            <el-select v-model="exportConfig.logisticsCompany" placeholder="请选择物流公司" style="width: 300px">
              <el-option label="跨速达（匈牙利发货）" value="kuasuoda" />
              <el-option label="跨速达（西班牙发货）" value="kuasuoda_spain" />
              <el-option label="华熙（波兰COD）" value="huaxi" />
              <el-option label="华熙-领星（领星WMS）" value="huaxi_lingxing" />
              <el-option label="盈派" value="yingpai" />
              <el-option label="森鸿（奥地利WMS）" value="shenghong" />
            </el-select>
          </el-form-item>

          <!-- 盈派订单类型选择（放在前面） -->
          <el-form-item v-if="exportConfig.logisticsCompany === 'yingpai'" label="订单类型">
            <el-radio-group v-model="exportConfig.yingpaiOrderType" style="display: flex; gap: 12px">
              <el-radio-button label="normal">普通订单</el-radio-button>
              <el-radio-button label="forward">转寄订单</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="导出筛选" v-if="!singleOrderExportMode">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <el-checkbox v-model="exportConfig.onlyUnshipped">只导出未发货的订单</el-checkbox>
              <el-checkbox v-model="exportConfig.filterByCountry" :disabled="!!searchForm.country">按国家筛选</el-checkbox>
            </div>
            <div class="form-tip">
              当前页未发货：<el-tag type="warning" size="small">{{ getUnshippedCountInCurrentPage() }} 条</el-tag>， 全部订单：{{
                pagination.total
              }}
              条
              <el-tag v-if="searchForm.country" type="success" size="small" style="margin-left: 8px">
                {{ countryCodeMap[searchForm.country] }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item v-if="exportConfig.filterByCountry && !searchForm.country" label="选择国家">
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
          <template v-if="exportConfig.logisticsCompany === 'kuasuoda' || exportConfig.logisticsCompany === 'kuasuoda_spain'">
            <el-form-item label="货物类型">
              <el-select v-model="exportConfig.kuasuodaCargoType" placeholder="请选择货物类型" style="width: 300px">
                <el-option label="P" value="P" />
                <el-option label="T" value="T" />
              </el-select>
              <div class="form-tip">默认为T，可根据实际货物类型选择P或T</div>
            </el-form-item>

            <el-form-item label="规格信息">
              <el-input v-model="exportConfig.specification" placeholder="请输入规格信息" style="width: 300px" />
            </el-form-item>

            <el-form-item label="SKU">
              <el-autocomplete
                v-model="exportConfig.sku"
                :fetch-suggestions="(queryString, cb) => cb(querySkuHistory(queryString, 'kuasuoda'))"
                placeholder="请输入SKU或从历史记录中选择"
                style="width: 300px"
                clearable
                @select="item => saveSkuToHistory(item.value, 'kuasuoda')"
                @blur="() => exportConfig.sku && saveSkuToHistory(exportConfig.sku, 'kuasuoda')"
              />
              <div class="form-tip">支持手动输入或从历史记录中选择，使用过的SKU会自动保存</div>
            </el-form-item>

            <el-form-item label="配货信息" required>
              <el-input
                v-model="exportConfig.kuasuodaProductInfo"
                placeholder="请输入配货信息（必填）"
                style="width: 300px"
                clearable
              />
              <div class="form-tip">导出时将使用该配货信息，而不是产品名称</div>
            </el-form-item>

            <el-form-item label="配货名称" required>
              <el-input
                v-model="exportConfig.kuasuodaProductName"
                placeholder="请输入配货名称（必填）"
                style="width: 300px"
                clearable
              />
              <div class="form-tip">导出时将使用该配货名称，而不是产品名称</div>
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

          <!-- 华熙-领星专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'huaxi_lingxing'">
            <el-form-item label="仓库代码">
              <el-input v-model="exportConfig.lingxingWarehouseCode" placeholder="如：ZXGJ001" style="width: 300px" />
            </el-form-item>

            <el-form-item label="物流渠道">
              <el-select v-model="exportConfig.lingxingShippingService" style="width: 300px" @change="syncLingxingCarrier">
                <el-option label="DHLcod-泛欧 (International)" value="DHLcod-泛欧 (International)" />
                <el-option label="GLS-cod (GLS)" value="GLS-cod (GLS)" />
                <el-option label="DHL本土cod (DHL-domestic)" value="DHL本土cod (DHL-domestic)" />
                <el-option label="自提柜 (DHL-locker)" value="自提柜 (DHL-locker)" />
                <el-option label="上传物流面单 (Upload_Shipping_Label)" value="上传物流面单 (Upload_Shipping_Label)" />
                <el-option label="无需物流服务 (No_Shipping_Service)" value="无需物流服务 (No_Shipping_Service)" />
              </el-select>
            </el-form-item>

            <el-form-item label="承运商">
              <el-input v-model="exportConfig.lingxingCarrier" style="width: 300px" readonly />
            </el-form-item>

            <el-form-item label="店铺">
              <el-input v-model="exportConfig.lingxingStore" placeholder="请输入店铺名称（可选）" style="width: 300px" />
            </el-form-item>

            <el-form-item label="SKU">
              <el-input v-model="exportConfig.lingxingSku" placeholder="请输入SKU" style="width: 300px" />
            </el-form-item>

            <el-form-item label="填写省/州">
              <el-checkbox v-model="exportConfig.lingxingIncludeState">填写省/州字段</el-checkbox>
              <div class="form-tip">欧洲大多数国家用邮编+城市即可寻址，无需填写省/州</div>
            </el-form-item>
          </template>

          <!-- 盈派专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'yingpai'">
            <el-form-item v-if="exportConfig.yingpaiOrderType === 'forward'" label="退单单号" required>
              <el-input
                v-model="exportConfig.yingpaiReturnOrderNumber"
                type="textarea"
                :rows="5"
                placeholder="请输入退单单号，每行一个（必填）&#10;例如：&#10;a1&#10;a2&#10;a3"
                style="width: 300px"
                clearable
              />
              <div class="form-tip">转寄订单需要填写退单单号，每行一个，将按顺序对应到每个订单</div>
            </el-form-item>

            <el-form-item v-if="exportConfig.yingpaiOrderType === 'forward'" label="单号1品名" required>
              <el-input
                v-model="exportConfig.yingpaiReturnOrderProductName"
                placeholder="请输入单号1品名（必填）"
                style="width: 300px"
                clearable
              />
              <div class="form-tip">转寄订单的单号1品名（必填）</div>
            </el-form-item>

            <el-form-item v-if="exportConfig.yingpaiOrderType === 'forward'" label="仓库" required>
              <el-input v-model="exportConfig.yingpaiWarehouse" placeholder="请输入仓库（必填）" style="width: 300px" clearable />
              <div class="form-tip">转寄订单的仓库信息（必填）</div>
            </el-form-item>

            <el-form-item label="快递物流商">
              <el-input v-model="exportConfig.yingpaiLogistics" placeholder="请输入快递物流商名称" style="width: 300px" />
              <div class="form-tip">快递物流商默认：欧洲小包特货</div>
            </el-form-item>

            <el-form-item v-if="exportConfig.yingpaiOrderType === 'normal'" label="SKU">
              <el-autocomplete
                v-model="exportConfig.yingpaiSku"
                :fetch-suggestions="(queryString, cb) => cb(querySkuHistory(queryString, 'yingpai'))"
                placeholder="请输入SKU或从历史记录中选择"
                style="width: 300px"
                clearable
                @select="item => saveSkuToHistory(item.value, 'yingpai')"
                @blur="() => exportConfig.yingpaiSku && saveSkuToHistory(exportConfig.yingpaiSku, 'yingpai')"
              />
              <div class="form-tip">SKU默认：15000W（转寄订单不需要填写SKU），支持手动输入或从历史记录中选择</div>
            </el-form-item>
          </template>

          <!-- 森鸿专用配置 -->
          <template v-if="exportConfig.logisticsCompany === 'shenghong'">
            <el-form-item label="中文品名">
              <el-input
                v-model="exportConfig.shenghongChineseName"
                placeholder="请输入中文品名（用于清关）"
                style="width: 300px"
              />
              <div class="form-tip">中文品名，用于清关，尽量简短</div>
            </el-form-item>

            <el-form-item label="英文品名">
              <el-input
                v-model="exportConfig.shenghongEnglishName"
                placeholder="请输入英文品名（用于清关）"
                style="width: 300px"
              />
              <div class="form-tip">英文品名，用于清关，尽量简短</div>
            </el-form-item>

            <el-form-item label="货物类型">
              <el-select v-model="exportConfig.shenghongCargoType" placeholder="请选择货物类型" style="width: 300px">
                <el-option label="GC (General Cargo普货)" value="GC" />
                <el-option label="SC (Special Cargo特货)" value="SC" />
                <el-option label="IC (Inspection Cargo商检货)" value="IC" />
              </el-select>
              <div class="form-tip">货物类型：普货/特货/商检货</div>
            </el-form-item>

            <el-form-item label="运费付款方式">
              <el-select v-model="exportConfig.shenghongPaymentMethod" placeholder="请选择运费付款方式" style="width: 300px">
                <el-option label="PP (月结)" value="PP" />
                <el-option label="CA (票结)" value="CA" />
                <el-option label="CC (到付)" value="CC" />
              </el-select>
              <div class="form-tip">运费付款方式</div>
            </el-form-item>

            <el-form-item label="预报重量(KG)">
              <el-input v-model="exportConfig.shenghongWeight" placeholder="请输入重量（默认KG）" style="width: 300px" />
              <div class="form-tip">包裹预报重量，单位KG</div>
            </el-form-item>

            <el-form-item label="客户SKU">
              <el-autocomplete
                v-model="exportConfig.shenghongSku"
                :fetch-suggestions="(queryString, cb) => cb(querySkuHistory(queryString, 'shenghong'))"
                placeholder="请输入客户SKU或从历史记录中选择"
                style="width: 300px"
                clearable
                @select="item => saveSkuToHistory(item.value, 'shenghong')"
                @blur="() => exportConfig.shenghongSku && saveSkuToHistory(exportConfig.shenghongSku, 'shenghong')"
              />
              <div class="form-tip">客户自定义SKU编码，支持手动输入或从历史记录中选择，使用过的SKU会自动保存</div>
            </el-form-item>

            <el-form-item label="发货人税号">
              <el-input v-model="exportConfig.shenghongTaxNumber" placeholder="请输入发货人税号" style="width: 300px" />
              <div class="form-tip">发货人税号号码（可选）</div>
            </el-form-item>
          </template>
        </el-form>

        <el-alert title="导出说明" type="info" show-icon :closable="false" style="margin-top: 20px">
          <template #default>
            <div class="export-description">
              <p v-if="singleOrderExportMode">
                单个订单导出模式
                <span v-if="exportConfig.logisticsCompany === 'kuasuoda'">：将按照跨速达（匈牙利发货）模板格式导出</span>
                <span v-else-if="exportConfig.logisticsCompany === 'kuasuoda_spain'">
                  ：将按照跨速达（西班牙发货）模板格式导出，仅PT/ES订单
                </span>
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi'">：将按照华熙（波兰COD）模板格式导出</span>
                <!-- prettier-ignore -->
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi_lingxing'">：将按照华熙-领星（领星WMS）模板格式导出</span>
                <span v-else-if="exportConfig.logisticsCompany === 'shenghong'">：将按照森鸿（奥地利WMS）模板格式导出</span>
                <span v-else-if="exportConfig.logisticsCompany === 'yingpai'">
                  <span v-if="exportConfig.yingpaiOrderType === 'forward'">：将按照盈派转寄订单模板格式导出</span>
                  <span v-else>：将按照盈派批量上传模板格式导出</span>
                </span>
              </p>
              <p v-else>
                <span v-if="exportConfig.logisticsCompany === 'kuasuoda'">将按照跨速达（匈牙利发货）模板格式导出订单数据</span>
                <span v-else-if="exportConfig.logisticsCompany === 'kuasuoda_spain'">
                  将按照跨速达（西班牙发货）模板格式导出订单数据，仅PT/ES订单
                </span>
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi'">将按照华熙（波兰COD）模板格式导出订单数据</span>
                <!-- prettier-ignore -->
                <span v-else-if="exportConfig.logisticsCompany === 'huaxi_lingxing'">将按照华熙-领星（领星WMS）模板格式导出订单数据</span>
                <span v-else-if="exportConfig.logisticsCompany === 'shenghong'">将按照森鸿（奥地利WMS）模板格式导出订单数据</span>
                <span v-else-if="exportConfig.logisticsCompany === 'yingpai'">
                  <span v-if="exportConfig.yingpaiOrderType === 'forward'">将按照盈派转寄订单模板格式导出订单数据</span>
                  <span v-else>将按照盈派批量上传模板格式导出订单数据</span>
                </span>
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

    <!-- 自定义短信对话框 -->
    <el-dialog v-model="customSmsDialogVisible" title="发送自定义短信" width="600px" :close-on-click-modal="false">
      <el-form :model="customSmsForm" label-width="100px">
        <el-form-item label="收件人">
          <el-input v-model="customSmsForm.phone" placeholder="收件人手机号" disabled>
            <template #prefix>
              <el-icon><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="短信内容">
          <el-input
            v-model="customSmsForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入短信内容"
            maxlength="1000"
            show-word-limit
          ></el-input>
          <div class="form-tip">
            <el-icon><Warning /></el-icon>
            短信内容最多1000个字符，国际短信按实际字符数计费
          </div>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">发送说明</el-divider>
      <div class="sms-tips">
        <ul>
          <li>短信将通过牛信云国际短信通道发送</li>
          <li>请确保手机号格式正确（需包含国际区号）</li>
          <li>发送成功后可在短信记录中查看状态</li>
        </ul>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customSmsDialogVisible = false">取消</el-button>
          <el-button type="success" @click="confirmSendCustomSms" :loading="customSmsSending">
            <el-icon><Iphone /></el-icon>
            发送短信
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
import { ref, reactive, onMounted, computed } from "vue";
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
  User,
  Iphone,
  Location,
  CircleClose,
  Star,
  List
} from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import {
  getOrderListApi,
  getOrderDetailApi,
  updateOrderStatusApi,
  batchUpdateOrderStatusApi,
  deleteOrderApi,
  batchDeleteOrdersApi,
  sendPickingNotificationEmailApi,
  sendShippedNotificationEmailApi,
  getIPInfoApi,
  getOrderHistoryApi,
  exportOrderIPsUrl,
  exportCustomerMatchUrl,
  getOrderCountryStatsApi,
  blacklistIPApi,
  type Order,
  type OrderListParams,
  OrderStatus,
  OrderStatusLabels,
  OrderStatusColors
} from "@/api/modules/order";
import { sendArrivalReminderApi, sendReshipmentNoticeApi, sendCustomEmailApi, type CustomEmailParams } from "@/api/modules/email";
import {
  sendPickingSmsApi,
  sendShippedSmsApi,
  sendArrivalSmsApi,
  sendReshipmentSmsApi,
  sendCustomSmsApi,
  type CustomSmsParams
} from "@/api/modules/sms";
import { getProductListApi, type Product } from "@/api/modules/product";
import http from "@/api";

// 响应式数据
const loading = ref(false);
const exportLoading = ref(false);
const exportIPLoading = ref(false);
const exportCustomerMatchLoading = ref(false);
const detailDialogVisible = ref(false);
const exportDialogVisible = ref(false);
const currentOrder = ref<Order | null>(null);

// IP详情相关
const ipInfoDialogVisible = ref(false);
const ipInfoLoading = ref(false);
const currentIPInfo = ref<any>(null);
const currentRecommendData = ref<any>(null);
const ipOrders = ref<Order[]>([]); // 该IP下的订单列表
const currentViewingIP = ref<string>(""); // 当前查看的IP
const fingerprintDialogVisible = ref(false);
const fingerprintLoading = ref(false);
const currentViewingFingerprint = ref<string>("");
const fingerprintOrders = ref<Order[]>([]);

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
  order: Order;
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

// 自定义短信相关
const customSmsDialogVisible = ref(false);
const customSmsSending = ref(false);
const customSmsForm = reactive({
  order_id: 0,
  phone: "",
  content: ""
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
  PT: "葡萄牙",
  IT: "意大利",
  FR: "法国",
  DE: "德国",
  GB: "英国",
  UK: "英国",
  NL: "荷兰",
  BE: "比利时",
  AT: "奥地利",
  CH: "瑞士",
  SE: "瑞典",
  NO: "挪威",
  DK: "丹麦",
  FI: "芬兰",
  IE: "爱尔兰",
  GR: "希腊",
  RO: "罗马尼亚",
  BG: "保加利亚",
  EE: "爱沙尼亚",
  LU: "卢森堡",
  MT: "马耳他",
  CY: "塞浦路斯",
  JA: "日本",
  JP: "日本"
};

// 根据国家代码获取国家名称
const getCountryName = (code: string | undefined | null): string => {
  if (!code) return "";
  const upperCode = code.toUpperCase();
  return countryCodeMap[upperCode] || code;
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
  PT: "葡萄牙",
  IT: "意大利",
  FR: "法国",
  DE: "德国",
  GB: "英国",
  UK: "英国",
  NL: "荷兰",
  BE: "比利时",
  AT: "奥地利",
  CH: "瑞士",
  SE: "瑞典",
  NO: "挪威",
  DK: "丹麦",
  FI: "芬兰",
  IE: "爱尔兰",
  GR: "希腊",
  RO: "罗马尼亚",
  BG: "保加利亚",
  EE: "爱沙尼亚",
  LU: "卢森堡",
  MT: "马耳他",
  CY: "塞浦路斯",
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

// SKU历史记录
const skuHistory = {
  kuasuoda: ref<string[]>([]), // 跨速达SKU历史
  yingpai: ref<string[]>([]), // 盈派SKU历史
  shenghong: ref<string[]>([]) // 森鸿SKU历史
};

// 加载SKU历史记录
const loadSkuHistory = () => {
  try {
    const kuasuodaHistory = localStorage.getItem("skuHistory_kuasuoda");
    if (kuasuodaHistory) {
      skuHistory.kuasuoda.value = JSON.parse(kuasuodaHistory);
    }
    const yingpaiHistory = localStorage.getItem("skuHistory_yingpai");
    if (yingpaiHistory) {
      skuHistory.yingpai.value = JSON.parse(yingpaiHistory);
    }
    const shenghongHistory = localStorage.getItem("skuHistory_shenghong");
    if (shenghongHistory) {
      skuHistory.shenghong.value = JSON.parse(shenghongHistory);
    }
  } catch (error) {
    console.error("加载SKU历史记录失败:", error);
  }
};

// 保存SKU到历史记录
const saveSkuToHistory = (sku: string, type: "kuasuoda" | "yingpai" | "shenghong") => {
  if (!sku || !sku.trim()) return;

  const trimmedSku = sku.trim();
  const history = skuHistory[type].value;

  // 如果已存在，先移除
  const index = history.indexOf(trimmedSku);
  if (index > -1) {
    history.splice(index, 1);
  }

  // 添加到最前面
  history.unshift(trimmedSku);

  // 限制最多保存50条历史记录
  if (history.length > 50) {
    history.splice(50);
  }

  // 保存到localStorage
  try {
    localStorage.setItem(`skuHistory_${type}`, JSON.stringify(history));
  } catch (error) {
    console.error(`保存SKU历史记录失败(${type}):`, error);
  }
};

// SKU自动完成查询函数
const querySkuHistory = (queryString: string, type: "kuasuoda" | "yingpai" | "shenghong") => {
  const history = skuHistory[type].value;
  if (!queryString) {
    return history.map(sku => ({ value: sku }));
  }
  return history.filter(sku => sku.toLowerCase().includes(queryString.toLowerCase())).map(sku => ({ value: sku }));
};

// 导出配置
const exportConfig = reactive({
  logisticsCompany: "kuasuoda", // 物流公司：kuasuoda(跨速达) 或 huaxi(华熙)
  customerNumberStart: "A1150",
  transportMethod: "欧洲备货-30HU",
  country: "斯洛伐克",
  specification: "welding gun",
  sku: "DH20251006*1",
  kuasuodaCargoType: "T", // 跨速达货物类型：P或T，默认为T
  kuasuodaProductInfo: "", // 跨速达配货信息
  kuasuodaProductName: "", // 跨速达配货名称
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
  // 华熙-领星专用配置
  lingxingWarehouseCode: "ZXGJ001",
  lingxingShippingService: "DHLcod-泛欧 (International)",
  lingxingCarrier: "DHL",
  lingxingStore: "",
  lingxingSku: "",
  lingxingIncludeState: false,
  // 盈派专用配置
  yingpaiLogistics: "欧洲小包特货",
  yingpaiSku: "15000W",
  yingpaiOrderType: "normal", // 订单类型：normal(普通订单) 或 forward(转寄订单)
  yingpaiReturnOrderNumber: "", // 退单单号（转寄订单必填）
  yingpaiReturnOrderProductName: "", // 单号1品名（转寄订单可选）
  yingpaiWarehouse: "", // 仓库（转寄订单可选）
  // 森鸿专用配置
  shenghongChineseName: "", // 中文品名
  shenghongEnglishName: "", // 英文品名
  shenghongCargoType: "GC", // 货物类型：GC/SC/IC
  shenghongPaymentMethod: "PP", // 运费付款方式：PP/CA/CC
  shenghongWeight: "0.5", // 预报重量(KG)
  shenghongSku: "", // 客户SKU
  shenghongTaxNumber: "" // 发货人税号
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
      if (config.kuasuodaCargoType) exportConfig.kuasuodaCargoType = config.kuasuodaCargoType;
      if (config.kuasuodaProductInfo) exportConfig.kuasuodaProductInfo = config.kuasuodaProductInfo;
      if (config.kuasuodaProductName) exportConfig.kuasuodaProductName = config.kuasuodaProductName;
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
      // 华熙-领星配置
      if (config.lingxingWarehouseCode !== undefined) exportConfig.lingxingWarehouseCode = config.lingxingWarehouseCode;
      if (config.lingxingShippingService !== undefined) exportConfig.lingxingShippingService = config.lingxingShippingService;
      if (config.lingxingCarrier !== undefined) exportConfig.lingxingCarrier = config.lingxingCarrier;
      if (config.lingxingStore !== undefined) exportConfig.lingxingStore = config.lingxingStore;
      if (config.lingxingSku !== undefined) exportConfig.lingxingSku = config.lingxingSku;
      if (config.lingxingIncludeState !== undefined) exportConfig.lingxingIncludeState = config.lingxingIncludeState;
      // 盈派配置
      if (config.yingpaiLogistics !== undefined) exportConfig.yingpaiLogistics = config.yingpaiLogistics;
      if (config.yingpaiSku !== undefined) exportConfig.yingpaiSku = config.yingpaiSku;
      if (config.yingpaiOrderType !== undefined) exportConfig.yingpaiOrderType = config.yingpaiOrderType;
      if (config.yingpaiReturnOrderNumber !== undefined) exportConfig.yingpaiReturnOrderNumber = config.yingpaiReturnOrderNumber;
      if (config.yingpaiReturnOrderProductName !== undefined)
        exportConfig.yingpaiReturnOrderProductName = config.yingpaiReturnOrderProductName;
      if (config.yingpaiWarehouse !== undefined) exportConfig.yingpaiWarehouse = config.yingpaiWarehouse;
      // 森鸿配置
      if (config.shenghongChineseName !== undefined) exportConfig.shenghongChineseName = config.shenghongChineseName;
      if (config.shenghongEnglishName !== undefined) exportConfig.shenghongEnglishName = config.shenghongEnglishName;
      if (config.shenghongCargoType !== undefined) exportConfig.shenghongCargoType = config.shenghongCargoType;
      if (config.shenghongPaymentMethod !== undefined) exportConfig.shenghongPaymentMethod = config.shenghongPaymentMethod;
      if (config.shenghongWeight !== undefined) exportConfig.shenghongWeight = config.shenghongWeight;
      if (config.shenghongSku !== undefined) exportConfig.shenghongSku = config.shenghongSku;
      if (config.shenghongTaxNumber !== undefined) exportConfig.shenghongTaxNumber = config.shenghongTaxNumber;
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
      kuasuodaCargoType: exportConfig.kuasuodaCargoType,
      kuasuodaProductInfo: exportConfig.kuasuodaProductInfo,
      kuasuodaProductName: exportConfig.kuasuodaProductName,
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
      huaxiProductInfo: exportConfig.huaxiProductInfo,
      // 华熙-领星配置
      lingxingWarehouseCode: exportConfig.lingxingWarehouseCode,
      lingxingShippingService: exportConfig.lingxingShippingService,
      lingxingCarrier: exportConfig.lingxingCarrier,
      lingxingStore: exportConfig.lingxingStore,
      lingxingSku: exportConfig.lingxingSku,
      lingxingIncludeState: exportConfig.lingxingIncludeState,
      // 盈派配置
      yingpaiLogistics: exportConfig.yingpaiLogistics,
      yingpaiSku: exportConfig.yingpaiSku,
      yingpaiOrderType: exportConfig.yingpaiOrderType,
      yingpaiReturnOrderNumber: exportConfig.yingpaiReturnOrderNumber,
      yingpaiReturnOrderProductName: exportConfig.yingpaiReturnOrderProductName,
      yingpaiWarehouse: exportConfig.yingpaiWarehouse,
      // 森鸿配置
      shenghongChineseName: exportConfig.shenghongChineseName,
      shenghongEnglishName: exportConfig.shenghongEnglishName,
      shenghongCargoType: exportConfig.shenghongCargoType,
      shenghongPaymentMethod: exportConfig.shenghongPaymentMethod,
      shenghongWeight: exportConfig.shenghongWeight,
      shenghongSku: exportConfig.shenghongSku,
      shenghongTaxNumber: exportConfig.shenghongTaxNumber
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
  product_id: "",
  country: "" // 国家筛选
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

// 所有可选国家列表（与商品列表和斗篷规则保持一致）
const allCountries = [
  { code: "JA", name: "日本" }, // 语言代码
  { code: "JP", name: "日本" }, // 国家代码（兼容）
  { code: "ZH", name: "中国" },
  { code: "EN", name: "英国" },
  { code: "SK", name: "斯洛伐克" },
  { code: "SI", name: "斯洛文尼亚" },
  { code: "PL", name: "波兰" },
  { code: "PT", name: "葡萄牙" },
  { code: "HU", name: "匈牙利" },
  { code: "IT", name: "意大利" },
  { code: "ES", name: "西班牙" },
  { code: "CZ", name: "捷克" },
  { code: "LT", name: "立陶宛" },
  { code: "LV", name: "拉脱维亚" },
  { code: "HR", name: "克罗地亚" },
  { code: "AT", name: "奥地利" },
  { code: "DE", name: "德国" },
  { code: "RO", name: "罗马尼亚" } // 保留原有国家
];

// 国家统计数据（从后端获取）
const countryStats = ref<{ [key: string]: number }>({});
const totalOrderCount = ref(0);

// 加载国家统计数据
const loadCountryStats = async () => {
  try {
    const { data } = await getOrderCountryStatsApi();
    const stats: { [key: string]: number } = {};

    // 更新总订单数
    totalOrderCount.value = data.total || 0;

    // 将后端返回的统计数据转换为对象
    data.stats.forEach((item: { country: string; count: number }) => {
      // 兼容语言代码和国家代码
      const countryCode = item.country.toUpperCase();
      stats[countryCode] = item.count;

      // 特殊处理：JA 和 JP 都代表日本
      if (countryCode === "JA" || countryCode === "JP") {
        stats["JA"] = (stats["JA"] || 0) + item.count;
        stats["JP"] = (stats["JP"] || 0) + item.count;
      }
    });

    countryStats.value = stats;
  } catch (error) {
    console.error("获取订单国家统计失败:", error);
  }
};

// 格式化性别显示
const formatGender = (gender: string): string => {
  const genderMap: Record<string, string> = {
    male: "👨 男",
    female: "👩 女",
    other: "⚧ 其他"
  };
  return genderMap[gender] || gender;
};

// 计算排序后的国家列表（有订单的在前面）
const sortedCountryOptions = computed(() => {
  const counts = countryStats.value;

  // 分为有订单和无订单两组
  const withOrders: { code: string; name: string; count: number }[] = [];
  const withoutOrders: { code: string; name: string }[] = [];

  allCountries.forEach(country => {
    const count = counts[country.code] || 0;
    if (count > 0) {
      withOrders.push({ ...country, count });
    } else {
      withoutOrders.push(country);
    }
  });

  // 有订单的按数量降序排列
  withOrders.sort((a, b) => b.count - a.count);

  return {
    withOrders,
    withoutOrders
  };
});

// 国家导航快速筛选
const handleCountryFilter = (countryCode: string) => {
  searchForm.country = countryCode;
  pagination.current = 1;
  loadData();
};

// 获取国家旗帜 emoji
const getCountryFlag = (code: string): string => {
  const flags: { [key: string]: string } = {
    SK: "🇸🇰",
    CZ: "🇨🇿",
    PL: "🇵🇱",
    HU: "🇭🇺",
    DE: "🇩🇪",
    AT: "🇦🇹",
    RO: "🇷🇴",
    JP: "🇯🇵",
    IT: "🇮🇹",
    ES: "🇪🇸",
    PT: "🇵🇹",
    LT: "🇱🇹",
    LV: "🇱🇻",
    HR: "🇭🇷",
    SI: "🇸🇮",
    EN: "🇬🇧",
    ZH: "🇨🇳",
    JA: "🇯🇵"
  };
  return flags[code] || "🌍";
};

// 判断手机号是否重复（使用后端返回的标识，不管什么状态只要有重复就标记）
const isPhoneDuplicate = (order: any) => {
  return order?.is_duplicate_phone === true || (order?.duplicate_phone_count ?? 0) > 0;
};

// 判断IP是否重复（使用后端返回的标识，不管什么状态只要有重复就标记）
const isIPDuplicate = (order: any) => {
  return order?.is_duplicate_ip === true || (order?.duplicate_ip_count ?? 0) > 0;
};

// 判断指纹是否重复（使用后端返回的标识）
const isFingerprintDuplicate = (order: any) => {
  return order?.is_duplicate_fingerprint === true || (order?.duplicate_fingerprint_count ?? 0) > 0;
};

// 判断邮箱是否重复（使用后端返回的标识，不管什么状态只要有重复就标记）
const isEmailDuplicate = (order: any) => {
  return order?.is_duplicate_email === true || (order?.duplicate_email_count ?? 0) > 0;
};

// 获取手机号重复次数
const getPhoneDuplicateCount = (order: any) => {
  return order?.duplicate_phone_count ?? 0;
};

// 获取邮箱重复次数
const getEmailDuplicateCount = (order: any) => {
  return order?.duplicate_email_count ?? 0;
};

// 获取IP重复次数
const getIPDuplicateCount = (order: any) => {
  return order?.duplicate_ip_count ?? 0;
};

// 获取指纹重复次数
const getFingerprintDuplicateCount = (order: any) => {
  return order?.duplicate_fingerprint_count ?? 0;
};

// 验证邮箱格式
const isEmailValid = (email: string) => {
  if (!email || !email.trim()) {
    return false;
  }
  // 使用标准的邮箱正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

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
    product_id: "",
    country: "" // 重置国家筛选
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
    currentRecommendData.value = null;
    ipOrders.value = [];
    currentViewingIP.value = ip;

    // 并行获取IP信息和该IP下的订单
    const [ipInfoRes, ordersRes] = await Promise.all([getIPInfoApi(ip), getOrderListApi({ ip, page: 1, size: 100 })]);

    currentIPInfo.value = ipInfoRes.data;
    ipOrders.value = ordersRes.data?.list ?? [];

    // 获取推荐追踪数据
    try {
      const recommendRes = await http.get(`/api/recommend/visitor-data?ip=${encodeURIComponent(ip)}`);
      if (recommendRes.data && recommendRes.code === 200) {
        currentRecommendData.value = recommendRes.data;
      }
    } catch (err) {
      console.log("获取推荐数据失败:", err);
    }
  } catch (error) {
    ElMessage.error("获取IP信息失败");
    ipInfoDialogVisible.value = false;
  } finally {
    ipInfoLoading.value = false;
  }
};

// 查看指纹历史订单
const handleViewFingerprintHistory = async (row: Order) => {
  const fingerprint = row.fingerprint?.trim();
  if (!fingerprint) {
    ElMessage.warning("该订单没有指纹ID");
    return;
  }

  try {
    fingerprintLoading.value = true;
    fingerprintDialogVisible.value = true;
    currentViewingFingerprint.value = fingerprint;
    fingerprintOrders.value = [];

    const { data } = await getOrderHistoryApi({
      type: "fingerprint",
      value: fingerprint,
      exclude_order_id: row.id,
      limit: 100
    });

    fingerprintOrders.value = data?.list ?? [];
  } catch (error) {
    ElMessage.error("获取指纹历史订单失败");
    fingerprintDialogVisible.value = false;
  } finally {
    fingerprintLoading.value = false;
  }
};

// 拉黑IP
const handleBlacklistIP = (row: Order) => {
  if (!row.ip_address) {
    ElMessage.warning("该订单没有IP地址");
    return;
  }

  ElMessageBox.confirm(`确定要拉黑IP "${row.ip_address}" 吗？\n\n拉黑后，该IP地址的用户将只能访问到仿品页面。`, "拉黑IP确认", {
    confirmButtonText: "确定拉黑",
    cancelButtonText: "取消",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  }).then(async () => {
    try {
      await blacklistIPApi({
        ip_address: row.ip_address!,
        reason: `从订单 ${row.order_number} 拉黑`,
        order_id: row.id
      });
      ElMessage.success(`IP ${row.ip_address} 已加入黑名单`);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "拉黑IP失败";
      ElMessage.error(errorMsg);
    }
  });
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

// 批量导出
const batchExportMode = ref(false); // 是否为批量导出模式
const batchExportOrders = ref<Order[]>([]); // 批量导出的订单列表

const handleBatchExport = (logisticsCompany: string) => {
  if (selectedOrders.value.length === 0) {
    ElMessage.warning("请先选择要导出的订单");
    return;
  }

  // 设置为批量导出模式
  batchExportMode.value = true;
  batchExportOrders.value = [...selectedOrders.value];

  // 设置物流公司
  exportConfig.logisticsCompany = logisticsCompany;

  // 打开导出配置对话框
  exportDialogVisible.value = true;

  console.log(`准备批量导出 ${selectedOrders.value.length} 个订单, 物流公司: ${logisticsCompany}`);
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
    action: action,
    order: row
  };

  console.log("4. 显示邮件预览对话框");
  emailPreviewDialogVisible.value = true;
};

// 确认发送邮件
const confirmSendEmail = async () => {
  if (!currentEmailPreview.value) return;

  const { orderId, action, typeName, order } = currentEmailPreview.value;

  // 再次验证邮箱地址
  if (!order?.email || !order.email.trim()) {
    ElMessage.warning("该订单没有邮箱地址，无法发送邮件");
    emailPreviewDialogVisible.value = false;
    return;
  }

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
  // 验证邮箱地址
  if (!customEmailForm.email_to || !customEmailForm.email_to.trim()) {
    ElMessage.warning("收件人邮箱地址不能为空");
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customEmailForm.email_to.trim())) {
    ElMessage.warning("请输入有效的邮箱地址");
    return;
  }

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

// ==================== 短信发送相关方法 ====================

// 处理短信发送操作
const handleSmsAction = async (row: Order, action: string) => {
  console.log("=== 短信发送开始 ===");
  console.log("1. handleSmsAction 被调用");
  console.log("   - 订单ID:", row.id);
  console.log("   - 短信类型:", action);
  console.log("   - 手机号:", row.phone);

  if (!row.phone) {
    console.log("2. ❌ 没有手机号，退出");
    ElMessage.warning("该订单没有手机号，无法发送短信");
    return;
  }

  // 处理自定义短信
  if (action === "custom") {
    console.log("2. 打开自定义短信对话框");
    customSmsForm.order_id = row.id;
    customSmsForm.phone = row.phone;
    customSmsForm.content = "";
    customSmsDialogVisible.value = true;
    return;
  }

  const smsTypes: Record<string, { name: string; api: (id: number) => Promise<any> }> = {
    picking: { name: "拣货通知", api: sendPickingSmsApi },
    shipped: { name: "发货通知", api: sendShippedSmsApi },
    arrival: { name: "到达提醒", api: sendArrivalSmsApi },
    reshipment: { name: "补发通知", api: sendReshipmentSmsApi }
  };

  const smsType = smsTypes[action];
  if (!smsType) {
    console.log("3. ❌ 未知的短信类型:", action);
    return;
  }

  console.log("3. ✓ 找到短信类型:", smsType.name);

  // 确认发送
  try {
    await ElMessageBox.confirm(`确定要向 ${row.phone} 发送${smsType.name}短信吗？`, "发送确认", {
      confirmButtonText: "确定发送",
      cancelButtonText: "取消",
      type: "info"
    });

    console.log("4. ✓ 用户确认发送");
    console.log("5. 开始调用 API...");

    const response = await smsType.api(row.id);
    console.log("6. ✓ API 调用成功");
    console.log("   - 完整响应:", response);

    if (response.data?.test_mode) {
      ElMessage.warning(`${smsType.name}短信已记录（测试模式，未实际发送）`);
    } else {
      ElMessage.success(`${smsType.name}短信发送成功！`);
    }
  } catch (error: any) {
    if (error === "cancel") {
      console.log("4. 用户取消发送");
      return;
    }
    console.error("6. ❌ API 调用失败");
    console.error("   - 错误对象:", error);
    ElMessage.error(error.response?.data?.message || error.message || `${smsType.name}短信发送失败`);
  }

  console.log("=== 短信发送结束 ===\n");
};

// 确认发送自定义短信
const confirmSendCustomSms = async () => {
  // 验证手机号
  if (!customSmsForm.phone || !customSmsForm.phone.trim()) {
    ElMessage.warning("手机号不能为空");
    return;
  }

  if (!customSmsForm.content.trim()) {
    ElMessage.warning("请输入短信内容");
    return;
  }

  // 短信内容长度限制
  if (customSmsForm.content.length > 1000) {
    ElMessage.warning("短信内容不能超过1000个字符");
    return;
  }

  customSmsSending.value = true;

  try {
    const params: CustomSmsParams = {
      order_id: customSmsForm.order_id,
      phone: customSmsForm.phone,
      content: customSmsForm.content
    };

    const response = await sendCustomSmsApi(params);

    if (response.data?.test_mode) {
      ElMessage.warning("自定义短信已记录（测试模式，未实际发送）");
    } else {
      ElMessage.success("自定义短信发送成功！");
    }

    customSmsDialogVisible.value = false;

    // 清空表单
    customSmsForm.order_id = 0;
    customSmsForm.phone = "";
    customSmsForm.content = "";
  } catch (error: any) {
    console.error("自定义短信发送失败:", error);
    ElMessage.error(error.response?.data?.message || error.message || "自定义短信发送失败");
  } finally {
    customSmsSending.value = false;
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

// 导出所有订单IP（按国家分组）
const handleExportIPs = async () => {
  try {
    exportIPLoading.value = true;

    // 获取导出URL
    const exportUrl = exportOrderIPsUrl();

    // 创建一个隐藏的a标签来触发下载
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = `order_ips_by_country_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success("IP导出已开始，请稍候...");
  } catch (error) {
    console.error("导出IP失败:", error);
    ElMessage.error("导出IP失败");
  } finally {
    exportIPLoading.value = false;
  }
};

// 导出Google Customer Match受众
const handleExportCustomerMatch = async () => {
  try {
    exportCustomerMatchLoading.value = true;

    // 构建导出参数（使用当前搜索条件）
    const exportParams: any = {};

    if (searchForm.start_date) exportParams.start_date = searchForm.start_date;
    if (searchForm.end_date) exportParams.end_date = searchForm.end_date;
    if (searchForm.country) exportParams.country = searchForm.country;
    if (searchForm.status) exportParams.status = searchForm.status;

    // 获取导出URL
    const exportUrl = exportCustomerMatchUrl(exportParams);

    // 创建一个隐藏的a标签来触发下载
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = `customer_match_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success({
      message: "Google受众数据导出成功！CSV文件可直接上传到Google Ads Customer Match",
      duration: 3000
    });
  } catch (error) {
    console.error("导出Google受众失败:", error);
    ElMessage.error("导出Google受众失败");
  } finally {
    exportCustomerMatchLoading.value = false;
  }
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
  // 盈派转寄订单验证
  if (exportConfig.logisticsCompany === "yingpai" && exportConfig.yingpaiOrderType === "forward") {
    if (!exportConfig.yingpaiReturnOrderNumber || !exportConfig.yingpaiReturnOrderNumber.trim()) {
      ElMessage.error("转寄订单需要填写退单单号");
      return;
    }

    // 验证仓库（必填）
    if (!exportConfig.yingpaiWarehouse || !exportConfig.yingpaiWarehouse.trim()) {
      ElMessage.error("转寄订单需要填写仓库");
      return;
    }

    // 验证单号1品名（必填）
    if (!exportConfig.yingpaiReturnOrderProductName || !exportConfig.yingpaiReturnOrderProductName.trim()) {
      ElMessage.error("转寄订单需要填写单号1品名");
      return;
    }

    // 检测退单单号重复
    const returnOrderNumbers = exportConfig.yingpaiReturnOrderNumber
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const duplicates = returnOrderNumbers.filter((item, index) => returnOrderNumbers.indexOf(item) !== index);

    if (duplicates.length > 0) {
      ElMessage.error(`退单单号有重复：${[...new Set(duplicates)].join(", ")}`);
      return;
    }
  }

  if (exportConfig.logisticsCompany === "huaxi") {
    await handleHuaxiExport();
  } else if (exportConfig.logisticsCompany === "huaxi_lingxing") {
    await handleHuaxiLingxingExport();
  } else if (exportConfig.logisticsCompany === "yingpai") {
    if (exportConfig.yingpaiOrderType === "forward") {
      await handleYingpaiForwardExport();
    } else {
      await handleYingpaiExport();
      // 保存盈派SKU到历史记录
      if (exportConfig.yingpaiSku) {
        saveSkuToHistory(exportConfig.yingpaiSku, "yingpai");
      }
    }
  } else if (exportConfig.logisticsCompany === "shenghong") {
    await handleShenghongExport();
    // 保存森鸿SKU到历史记录
    if (exportConfig.shenghongSku) {
      saveSkuToHistory(exportConfig.shenghongSku, "shenghong");
    }
  } else if (exportConfig.logisticsCompany === "kuasuoda_spain") {
    await handleKuasuodaSpainExport();
    // 保存跨速达SKU到历史记录
    if (exportConfig.sku) {
      saveSkuToHistory(exportConfig.sku, "kuasuoda");
    }
  } else {
    await handleKuasuodaExport();
    // 保存跨速达SKU到历史记录
    if (exportConfig.sku) {
      saveSkuToHistory(exportConfig.sku, "kuasuoda");
    }
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

  let statusUpdateSuccess = false;
  let emailSuccessCount = 0;
  let emailFailCount = 0;
  const errors: string[] = [];

  try {
    // 批量更新订单状态为已发货
    if (exportConfig.updateShippedStatus) {
      const orderIds = orders.map(order => order.id);
      await batchUpdateOrderStatusApi({
        ids: orderIds,
        status: OrderStatus.SHIPPED
      });
      statusUpdateSuccess = true;
    }
  } catch (error: any) {
    errors.push(`批量更新订单状态失败: ${error.message || "操作失败"}`);
    console.error("批量更新订单状态失败:", error);
  }

  // 发送发货通知邮件（仅发送给有邮箱的订单）
  let noEmailCount = 0;
  if (exportConfig.sendShippedEmail) {
    for (const order of orders) {
      if (order.email && order.email.trim()) {
        try {
          await sendShippedNotificationEmailApi(order.id);
          emailSuccessCount++;
        } catch (error: any) {
          emailFailCount++;
          errors.push(`订单 ${order.order_number} 邮件发送失败: ${error.message || "操作失败"}`);
          console.error(`订单 ${order.order_number} 邮件发送失败:`, error);
        }
      } else {
        noEmailCount++;
        console.log(`订单 ${order.order_number} 没有邮箱地址，跳过发送邮件`);
      }
    }
  }

  // 显示处理结果
  const messages: string[] = [];
  if (exportConfig.updateShippedStatus) {
    if (statusUpdateSuccess) {
      messages.push(`成功批量更新 ${orders.length} 个订单状态`);
    } else {
      messages.push(`订单状态更新失败`);
    }
  }
  if (exportConfig.sendShippedEmail) {
    const emailParts: string[] = [];
    if (emailSuccessCount > 0) {
      emailParts.push(`成功 ${emailSuccessCount} 个`);
    }
    if (emailFailCount > 0) {
      emailParts.push(`失败 ${emailFailCount} 个`);
    }
    if (noEmailCount > 0) {
      emailParts.push(`无邮箱 ${noEmailCount} 个`);
    }
    if (emailParts.length > 0) {
      messages.push(`邮件: ${emailParts.join("，")}`);
    }
  }

  if (errors.length === 0) {
    ElMessage.success(messages.join("，"));
  } else if (statusUpdateSuccess || emailSuccessCount > 0) {
    ElMessage.warning({
      message: messages.join("，") + "。部分操作失败，请查看控制台了解详情。",
      duration: 5000
    });
    console.error("错误详情:", errors);
  } else {
    ElMessage.error(`所有操作失败！请查看控制台了解详情。`);
    console.error("错误详情:", errors);
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

// 跨速达（西班牙发货）模板导出
const handleKuasuodaSpainExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      orders = [singleOrderToExport.value];
      console.log(`西班牙模板单个订单导出模式: ${orders[0].order_number}`);
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      orders = [...batchExportOrders.value];
      console.log(`西班牙模板批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
      };

      if (exportConfig.onlyUnshipped) {
        params.status = undefined;
      }

      console.log("西班牙模板获取订单数据参数:", params);

      const { data } = await getOrderListApi(params);
      orders = data.list;

      // 过滤未发货订单
      if (exportConfig.onlyUnshipped) {
        orders = orders.filter(order => {
          return (
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.CONFIRMED ||
            order.status === OrderStatus.PROCESSING
          );
        });
      }
    }

    if (!orders || orders.length === 0) {
      ElMessage.warning("没有找到符合条件的订单数据");
      return;
    }

    // 西班牙模板专用：只导出葡萄牙(PT)和西班牙(ES)的订单
    const originalCount = orders.length;
    orders = orders.filter(order => {
      const countryCode = getCountryCode(order);
      return countryCode === "PT" || countryCode === "ES";
    });
    console.log(`西班牙模板国家筛选：原 ${originalCount} 条，筛选后 ${orders.length} 条（仅PT和ES）`);

    if (orders.length === 0) {
      ElMessage.warning("没有找到葡萄牙或西班牙的订单数据");
      return;
    }

    // 去重：根据手机号去重
    const uniqueOrders = new Map<string, Order>();
    orders.forEach(order => {
      const phone = order.phone || "";
      if (!uniqueOrders.has(phone)) {
        uniqueOrders.set(phone, order);
      } else {
        const existingOrder = uniqueOrders.get(phone)!;
        if (order.order_number < existingOrder.order_number) {
          uniqueOrders.set(phone, order);
        }
      }
    });
    orders = Array.from(uniqueOrders.values());

    console.log(`西班牙模板去重后订单数量: ${orders.length} 条，将要导出`);

    // 跨速达模板字段（与匈牙利相同）
    const templateFields = [
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

    const excelData: any[][] = [];
    excelData.push(templateFields);

    let emptyEmailCount = 0;

    orders.forEach(order => {
      const row: any[] = [];

      // 仓库编码 - 西班牙模板使用 ES06
      row.push("ES06");

      // 客户编码 - 固定值
      row.push("773");

      // 客户单号 - 使用系统订单号
      row.push(order.order_number || "");

      // 物流编码 - 空
      row.push("");

      // 物流网点 - 空
      row.push("");

      // 物流单号 - 空
      row.push("");

      // 物流单号2 - 空
      row.push("");

      // 运输方式 - 西班牙模板固定使用 "欧洲备货-11"
      row.push("欧洲备货-11");

      // 国家/地区 - 自动填充
      const countryCode = getCountryCode(order);
      const countryName = countryCodeMap[countryCode] || "";
      row.push(countryName);

      // 收件人姓名
      row.push(order.customer_name || "");

      // 邮箱 - 如果为空，自动填充
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

      // 处理联系地址
      let processedAddress = order.address || "";
      if (order.city && order.address) {
        if (order.address.startsWith(order.city)) {
          processedAddress = order.address.substring(order.city.length).trim();
          if (processedAddress) {
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

      // 地址备注1
      row.push(order.address || "");

      // 地址备注2
      row.push("");

      // 收件人电话
      row.push(order.phone || "");

      // 收件人邮编
      row.push(order.postal_code || "");

      // 代收货款币种
      row.push(order.currency || "EUR");

      // 代收款金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 订单备注
      row.push("");

      // 配货信息
      row.push(exportConfig.kuasuodaProductInfo || "");

      // 货物类型
      row.push(exportConfig.kuasuodaCargoType);

      // 规格信息
      row.push(exportConfig.specification);

      // 申报品数量
      row.push(order.quantity || 1);

      // SKU
      row.push(exportConfig.sku);

      // 配货名称
      row.push(exportConfig.kuasuodaProductName || "");

      // 申报币种
      row.push(order.currency || "EUR");

      // 申报金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 税号类型
      row.push("");

      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = templateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "西班牙发货订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `西班牙发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据（仅葡萄牙和西班牙），格式为跨速达西班牙模板`);

    // 保存配置到缓存
    saveExportConfigToCache();

    // 异步处理订单状态更新和发送邮件
    if (exportConfig.updateShippedStatus || exportConfig.sendShippedEmail) {
      setTimeout(() => {
        handlePostExportActions(orders);
      }, 100);
    }
  } catch (error) {
    console.error("西班牙模板导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
    if (singleOrderExportMode.value) {
      singleOrderExportMode.value = false;
      singleOrderToExport.value = null;
      singleOrderLogisticsCompany.value = "";
      exportConfig.exportLimit = 100;
    }
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      selectedOrders.value = [];
    }
  }
};

// 导出确认 - 匈牙利发货模板格式
const handleExportConfirm = async () => {
  // 跨速达导出前验证配货信息和配货名称
  if (exportConfig.logisticsCompany === "kuasuoda" || exportConfig.logisticsCompany === "kuasuoda_spain") {
    if (!exportConfig.kuasuodaProductInfo || !exportConfig.kuasuodaProductInfo.trim()) {
      ElMessage.error("请填写配货信息");
      return;
    }
    if (!exportConfig.kuasuodaProductName || !exportConfig.kuasuodaProductName.trim()) {
      ElMessage.error("请填写配货名称");
      return;
    }
  }

  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`单个订单导出模式: ${orders[0].order_number}`);
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      // 批量导出模式：使用选中的订单
      orders = [...batchExportOrders.value];
      console.log(`批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
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

      // 按国家筛选（仅当列表页面没有国家筛选时才使用导出配置的国家筛选）
      if (exportConfig.filterByCountry && !searchForm.country) {
        console.log(`开始按国家筛选，选择的国家: ${exportConfig.selectedCountry}`);
        orders = orders.filter(order => {
          const countryCode = getCountryCode(order);
          console.log(
            `订单 ${order.order_number}: language_code=${order.language_code}, 判断国家=${countryCode}, 匹配=${countryCode === exportConfig.selectedCountry}`
          );
          return countryCode === exportConfig.selectedCountry;
        });
        console.log(`按国家筛选后剩余: ${orders.length} 条`);
      } else if (searchForm.country) {
        console.log(`使用列表页面的国家筛选: ${searchForm.country}`);
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

      // 配货信息 - 使用用户输入的配货信息
      row.push(exportConfig.kuasuodaProductInfo || "");

      // 货物类型 - 使用配置的值（默认为T，可选P或T）
      row.push(exportConfig.kuasuodaCargoType);

      // 规格信息 - 使用配置的值
      row.push(exportConfig.specification);

      // 申报品数量
      row.push(order.quantity || 1);

      // SKU - 使用配置的值
      row.push(exportConfig.sku);

      // 配货名称 - 使用用户输入的配货名称
      row.push(exportConfig.kuasuodaProductName || "");

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
    // 重置批量导出模式
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      // 清空选中的订单
      selectedOrders.value = [];
    }
  }
};

// 盈派转寄订单导出
const handleYingpaiForwardExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`盈派转寄订单单个订单导出模式: ${orders[0].order_number}`);
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      // 批量导出模式：使用选中的订单
      orders = [...batchExportOrders.value];
      console.log(`盈派转寄订单批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
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

      // 按国家筛选（仅当列表页面没有国家筛选时才使用导出配置的国家筛选）
      if (exportConfig.filterByCountry && !searchForm.country) {
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

    console.log(`盈派转寄订单导出：获取到 ${orders.length} 条订单数据`);

    // 解析退单单号列表（按行分割，过滤空行）
    const returnOrderNumbers = exportConfig.yingpaiReturnOrderNumber
      ? exportConfig.yingpaiReturnOrderNumber
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
      : [];

    // 盈派转寄订单模板字段（根据实际Excel模板）
    const yingpaiForwardTemplateFields = [
      "快递单号",
      "仓库",
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
      "退件单号1",
      "单号1品名",
      "退件单号2",
      "单号2品名",
      "退件单号3",
      "单号3品名",
      "退件单号4",
      "单号4品名",
      "退件单号5",
      "单号5品名",
      "退件单号6",
      "单号6品名",
      "退件单号7",
      "单号7品名",
      "退件单号8",
      "单号8品名",
      "退件单号9",
      "单号9品名",
      "退件单号10",
      "单号10品名",
      "国家（二字代码）", // 必填
      "面单标题",
      "备注",
      "电商平台",
      "所属店铺",
      "订单总金额",
      "订单总金额币种",
      "独立站URL",
      "收件人门牌号码"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];
    excelData.push(yingpaiForwardTemplateFields);

    console.log(`开始处理 ${orders.length} 条订单，退单单号数量：${returnOrderNumbers.length}`);

    orders.forEach((order, index) => {
      console.log(`处理第 ${index + 1} 条订单：${order.order_number}`);
      const row: any[] = [];

      // 快递单号（请勿填写）- 留空
      row.push("");

      // 仓库 - 使用配置的仓库（转寄订单可选）
      row.push(exportConfig.yingpaiWarehouse || "");

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

      // 退件单号1 - 使用对应索引的退单单号（转寄订单必填）
      const returnOrderNumber = returnOrderNumbers[index] || "";
      row.push(returnOrderNumber);

      // 单号1品名 - 使用配置的单号1品名（转寄订单可选）
      row.push(exportConfig.yingpaiReturnOrderProductName || "");

      // 退件单号2-10（选填，留空）
      for (let i = 2; i <= 10; i++) {
        row.push(""); // 退件单号
        row.push(""); // 单号品名
      }

      // 国家（二字代码）（必填）
      const countryCode = getCountryCode(order);
      row.push(countryCode);

      // 面单标题（选填）
      row.push("");

      // 备注（选填）
      row.push(order.comments || "");

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
    const colWidths = yingpaiForwardTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "盈派转寄订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `盈派转寄订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为盈派转寄订单模板`);

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
    // 重置批量导出模式
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      // 清空选中的订单
      selectedOrders.value = [];
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
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      // 批量导出模式：使用选中的订单
      orders = [...batchExportOrders.value];
      console.log(`华熙批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
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

      // 按国家筛选（仅当列表页面没有国家筛选时才使用导出配置的国家筛选）
      if (exportConfig.filterByCountry && !searchForm.country) {
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
      exportConfig.exportLimit = 100;
    }
    // 重置批量导出模式
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      selectedOrders.value = [];
    }
  }
};

// 根据物流渠道自动同步承运商
const lingxingCarrierMap: { [key: string]: string } = {
  "DHLcod-泛欧 (International)": "DHL",
  "GLS-cod (GLS)": "GLS",
  "DHL本土cod (DHL-domestic)": "DHL",
  "自提柜 (DHL-locker)": "DHL",
  "上传物流面单 (Upload_Shipping_Label)": "",
  "无需物流服务 (No_Shipping_Service)": ""
};
const syncLingxingCarrier = (val: string) => {
  exportConfig.lingxingCarrier = lingxingCarrierMap[val] ?? "";
};

// 华熙-领星导出 - 领星WMS小包出库单模板格式
const handleHuaxiLingxingExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    if (singleOrderExportMode.value && singleOrderToExport.value) {
      orders = [singleOrderToExport.value];
      console.log(`华熙-领星单个订单导出模式: ${orders[0].order_number}`);
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      orders = [...batchExportOrders.value];
      console.log(`华熙-领星批量导出模式: 共 ${orders.length} 个订单`);
    } else {
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
      };

      if (exportConfig.onlyUnshipped) {
        params.status = undefined;
      }

      const { data } = await getOrderListApi(params);
      orders = data.list;

      if (exportConfig.onlyUnshipped) {
        orders = orders.filter(order => {
          return (
            order.status === OrderStatus.PENDING ||
            order.status === OrderStatus.CONFIRMED ||
            order.status === OrderStatus.PROCESSING
          );
        });
      }

      if (exportConfig.filterByCountry && !searchForm.country) {
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

    console.log(`华熙-领星导出：获取到 ${orders.length} 条订单数据`);

    // 领星WMS小包出库单模板字段（43列）
    const lingxingTemplateFields = [
      "Warehouse Code/仓库代码",
      "Sales Platform/销售平台",
      "Store/店铺",
      "Reference Number/参考单号",
      "Platform Number/平台单号",
      "Shipping Service/物流渠道",
      "Carrier/承运商",
      "Tracking No./物流跟踪号",
      "Signature Type/签名服务类型",
      "Insurance/保险金额",
      "RecipientName/收件人",
      "Recipient Phone/电话",
      "Recipient Email/邮箱",
      "Recipient Tax ID/收件人税号",
      "Recipient Company/公司名称",
      "Recipient Country/国家/地区简码",
      "Recipient State/省/州",
      "Recipient City/城市",
      "Recipient Zip Code/邮编",
      "Recipient House Number/门牌号",
      "Recipient AddressLine1/地址1",
      "Recipient AddressLine2/地址2",
      "Remark/备注",
      "SKU1/SKU1",
      "Quantity1/出库数量1",
      "SKU2/SKU2",
      "Quantity2/出库数量2",
      "SKU3/SKU3",
      "Quantity3/出库数量3",
      "SKU4/SKU4",
      "Quantity4/出库数量4",
      "SKU5/SKU5",
      "Quantity5/出库数量5",
      "SKU6/SKU6",
      "Quantity6/出库数量6",
      "SKU7/SKU7",
      "Quantity7/出库数量7",
      "SKU8/SKU8",
      "Quantity8/出库数量8",
      "SKU9/SKU9",
      "Quantity9/出库数量9",
      "SKU10/SKU10",
      "Quantity10/出库数量10"
    ];

    const excelData: any[][] = [];
    excelData.push(lingxingTemplateFields);

    orders.forEach(order => {
      const row: any[] = [];

      // Warehouse Code/仓库代码
      row.push(exportConfig.lingxingWarehouseCode || "");

      // Sales Platform/销售平台 - 固定Shopify
      row.push("Shopify");

      // Store/店铺
      row.push(exportConfig.lingxingStore || "");

      // Reference Number/参考单号 - 使用系统订单号
      row.push(order.order_number || "");

      // Platform Number/平台单号 - 留空
      row.push("");

      // Shipping Service/物流渠道
      // 物流渠道只取括号内的值，如 "GLS-cod (GLS)" → "GLS"
      const shippingServiceMatch = exportConfig.lingxingShippingService?.match(/\(([^)]+)\)/);
      row.push(shippingServiceMatch ? shippingServiceMatch[1] : exportConfig.lingxingShippingService || "");

      // Carrier/承运商
      row.push(exportConfig.lingxingCarrier || "");

      // Tracking No./物流跟踪号 - 留空
      row.push("");

      // Signature Type/签名服务类型 - 留空
      row.push("");

      // Insurance/保险金额 - 留空
      row.push("");

      // RecipientName/收件人
      row.push(order.customer_name || "");

      // Recipient Phone/电话 - 去除空格
      row.push((order.phone || "").replace(/\s+/g, ""));

      // Recipient Email/邮箱
      row.push(order.email || "");

      // Recipient Tax ID/收件人税号 - 留空
      row.push("");

      // Recipient Company/公司名称 - 留空
      row.push("");

      // Recipient Country/国家/地区简码 - 使用2位国家代码
      row.push(getCountryCode(order) || "");

      // Recipient State/省/州 - 欧洲用邮编+城市寻址，可选是否填写
      row.push(exportConfig.lingxingIncludeState ? order.province || "" : "");

      // Recipient City/城市
      row.push(order.city || "");

      // Recipient Zip Code/邮编 - 去除空格
      row.push((order.postal_code || "").replace(/\s+/g, ""));

      // Recipient House Number/门牌号 - 系统无单独门牌号字段，使用完整地址
      row.push(order.address || "");

      // Recipient AddressLine1/地址1
      row.push(order.address || "");

      // Recipient AddressLine2/地址2 - 留空
      row.push("");

      // Remark/备注 - COD [币种][金额]
      const remarkAmount = order.total_amount || order.product_price * order.quantity || 0;
      const remarkCurrency = order.currency || "EUR";
      row.push(`COD ${remarkCurrency}${remarkAmount}`);

      // SKU1/SKU1
      row.push(exportConfig.lingxingSku || "");

      // Quantity1/出库数量1
      row.push(order.quantity || 1);

      // SKU2~SKU10 及对应数量 - 全部留空
      for (let i = 2; i <= 10; i++) {
        row.push("");
        row.push("");
      }

      excelData.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    const colWidths = lingxingTemplateFields.map(() => ({ wch: 20 }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "小包出库单");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `华熙领星发货订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为华熙-领星模板`);

    saveExportConfigToCache();

    if (exportConfig.updateShippedStatus || exportConfig.sendShippedEmail) {
      setTimeout(() => {
        handlePostExportActions(orders);
      }, 100);
    }
  } catch (error) {
    console.error("导出失败:", error);
    ElMessage.error("导出失败：" + (error as Error).message);
  } finally {
    exportLoading.value = false;
    if (singleOrderExportMode.value) {
      singleOrderExportMode.value = false;
      singleOrderToExport.value = null;
      singleOrderLogisticsCompany.value = "";
      exportConfig.exportLimit = 100;
    }
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      selectedOrders.value = [];
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
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      // 批量导出模式：使用选中的订单
      orders = [...batchExportOrders.value];
      console.log(`盈派批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
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

      // 按国家筛选（仅当列表页面没有国家筛选时才使用导出配置的国家筛选）
      if (exportConfig.filterByCountry && !searchForm.country) {
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
      exportConfig.exportLimit = 100;
    }
    // 重置批量导出模式
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      selectedOrders.value = [];
    }
  }
};

// 森鸿导出 - 奥地利WMS出库订单模板格式
const handleShenghongExport = async () => {
  exportLoading.value = true;
  try {
    let orders: Order[] = [];

    // 检查是否是单个订单导出模式
    if (singleOrderExportMode.value && singleOrderToExport.value) {
      // 单个订单导出模式：直接使用保存的订单
      orders = [singleOrderToExport.value];
      console.log(`森鸿单个订单导出模式: ${orders[0].order_number}`);
    } else if (batchExportMode.value && batchExportOrders.value.length > 0) {
      // 批量导出模式：使用选中的订单
      orders = [...batchExportOrders.value];
      console.log(`森鸿批量导出模式: 共 ${orders.length} 个订单`);
    } else {
      // 普通批量导出模式：查询订单数据
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
        product_id: searchForm.product_id || undefined,
        country: searchForm.country || undefined
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

      // 按国家筛选（仅当列表页面没有国家筛选时才使用导出配置的国家筛选）
      if (exportConfig.filterByCountry && !searchForm.country) {
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

    console.log(`森鸿导出：获取到 ${orders.length} 条订单数据`);

    // 森鸿WMS模板字段（实际的28个字段）
    const shenghongTemplateFields = [
      "订单参考号()",
      "产品汇总数量()",
      "中文品名(中文品名，用于清关，尽量简短)",
      "英文品名(英文品名，用于清关，尽量简短)",
      "货物描述(更多产品明细，可包含SKU、用途或产品特别注意事项等等)",
      "申报金额()",
      "申报币别(三字母币种)",
      "收件人名称()",
      "收件电话()",
      "收件省()",
      "收件城市()",
      "收件区县()",
      "收件详细地址()",
      "收件邮编()",
      "备注(订单信息备注显示在物流面单上（对接渠道），但不显示在拣货单上)",
      "货物类型(填写二字母 GC (General Cargo普货) / SC (Special Cargo特货)/ IC (Inspection Cargo商检货))",
      "运费付款方式(填写二字母   PP(月结)/CA(票结)/CC(到付))",
      "包裹件数(系统默认为1)",
      "拣货单备注(拣货单上产品的备注信息)",
      "目的地二字码(国家二字代码,比如 英国填：GB)",
      "产品海关编码()",
      "代收款金额()",
      "代收款币种()",
      "收件人邮箱()",
      "发货人税号号码()",
      "收件人门牌号(一般由数字构成，5位字符内)",
      "预报重量(重量默认KG)",
      "客户SKU()"
    ];

    // 准备Excel数据
    const excelData: any[][] = [];
    excelData.push(shenghongTemplateFields);

    orders.forEach(order => {
      const row: any[] = [];

      // 1. 订单参考号
      row.push(order.order_number || "");

      // 2. 产品汇总数量
      row.push(order.quantity || 1);

      // 3. 中文品名（用于清关）
      row.push(exportConfig.shenghongChineseName || "");

      // 4. 英文品名（用于清关）
      row.push(exportConfig.shenghongEnglishName || "");

      // 5. 货物描述（产品明细）
      const productDesc = [
        exportConfig.shenghongSku ? `SKU: ${exportConfig.shenghongSku}` : "",
        order.comments ? `备注: ${order.comments}` : ""
      ]
        .filter(s => s)
        .join("; ");
      row.push(productDesc || "商品");

      // 6. 申报金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 7. 申报币别（三字母币种）
      row.push(order.currency || "EUR");

      // 8. 收件人名称
      row.push(order.customer_name || "");

      // 9. 收件电话
      row.push(order.phone || "");

      // 10. 收件省
      row.push(order.province || "");

      // 11. 收件城市
      row.push(order.city || "");

      // 12. 收件区县
      row.push(order.district || "");

      // 13. 收件详细地址
      row.push(order.address || "");

      // 14. 收件邮编
      row.push(order.postal_code || "");

      // 15. 备注（显示在物流面单上）
      row.push(order.comments || "");

      // 16. 货物类型（GC/SC/IC）
      row.push(exportConfig.shenghongCargoType || "GC");

      // 17. 运费付款方式（PP/CA/CC，小写）
      row.push((exportConfig.shenghongPaymentMethod || "PP").toLowerCase());

      // 18. 包裹件数（默认1）
      row.push(1);

      // 19. 拣货单备注
      row.push("");

      // 20. 目的地二字码（国家代码）
      const countryCode = getCountryCode(order);
      row.push(countryCode);

      // 21. 产品海关编码
      row.push("");

      // 22. 代收款金额
      row.push(order.total_amount || order.product_price * order.quantity || 0);

      // 23. 代收款币种
      row.push(order.currency || "EUR");

      // 24. 收件人邮箱
      row.push(order.email || "");

      // 25. 发货人税号号码
      row.push(exportConfig.shenghongTaxNumber || "");

      // 26. 收件人门牌号
      row.push("");

      // 27. 预报重量（KG）
      row.push(exportConfig.shenghongWeight || "0.5");

      // 28. 客户SKU（格式：SKU:1，数量固定为1）
      row.push(exportConfig.shenghongSku ? `${exportConfig.shenghongSku}:1` : "");

      excelData.push(row);
    });

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // 设置列宽
    const colWidths = shenghongTemplateFields.map(() => ({ wch: 15 }));
    ws["!cols"] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "森鸿出库订单");

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    // 创建Blob并下载
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `森鸿出库订单_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出成功！共导出 ${orders.length} 条订单数据，格式为森鸿WMS模板`);

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
      exportConfig.exportLimit = 100;
    }
    // 重置批量导出模式
    if (batchExportMode.value) {
      batchExportMode.value = false;
      batchExportOrders.value = [];
      selectedOrders.value = [];
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
      product_id: searchForm.product_id || undefined,
      country: searchForm.country || undefined
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

// 格式化时间戳
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
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
  loadCountryStats(); // 加载国家统计数据
  loadExportConfigFromCache(); // 加载导出配置缓存
  loadSkuHistory(); // 加载SKU历史记录
});
</script>

<style scoped>
.order-management {
  min-height: 100vh;
  padding: 20px;
  background: #f5f7fa;
}

/* 国家导航栏样式 */
.country-nav-bar {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
}

.country-nav-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
}

.country-nav-title .el-icon {
  font-size: 16px;
}

.country-nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.country-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f5f7fa;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.country-nav-item:hover {
  background: #ecf5ff;
  border-color: #409eff;
  transform: translateY(-2px);
}

.country-nav-item.active {
  background: linear-gradient(135deg, #67c23a 0%, #52b788 100%);
  border-color: #67c23a;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.country-nav-item.active .country-name {
  color: #fff;
  font-weight: 600;
}

.country-nav-item.active .country-count {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.country-nav-item.empty {
  opacity: 0.6;
}

.country-nav-item.empty:hover {
  opacity: 0.8;
}

.country-flag {
  font-size: 18px;
  line-height: 1;
}

.country-nav-item .country-name {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.country-nav-item .country-count {
  background: #e4e7ed;
  color: #606266;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.country-nav-divider {
  width: 1px;
  height: 24px;
  background: #dcdfe6;
  margin: 0 4px;
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
.customer-phone.duplicate-phone {
  color: #f56c6c;
  font-weight: 600;
}
.duplicate-badge {
  font-size: 11px;
  color: #f56c6c;
  margin-left: 4px;
  font-weight: normal;
}
.customer-email {
  font-size: 12px;
  color: #999;
}
.customer-email.invalid-email {
  color: #e6a23c;
}
.customer-email.duplicate-email {
  color: #f56c6c;
  font-weight: 600;
}
.email-invalid-tag {
  font-size: 11px;
}
.customer-extra {
  font-size: 12px;
  margin-top: 2px;
  display: flex;
  gap: 6px;
  align-items: center;
}
.gender-tag {
  color: #409eff;
  font-weight: 500;
}
.age-tag {
  color: #67c23a;
  font-weight: 500;
}
.not-filled {
  color: #c0c4cc;
  font-style: italic;
  font-size: 11px;
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

.ip-url-info .fingerprint-info {
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
.ip-orders-section {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.ip-orders-section .section-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ip-address {
  margin-bottom: 4px;
}

.duplicate-ip {
  font-weight: 600 !important;
}

.duplicate-fingerprint {
  font-weight: 600 !important;
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

/* 短信提示样式 */
.sms-tips {
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  padding: 16px;
}

.sms-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #67c23a;
}

.sms-tips li {
  margin-bottom: 8px;
  font-size: 13px;
}

.sms-tips li:last-child {
  margin-bottom: 0;
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
