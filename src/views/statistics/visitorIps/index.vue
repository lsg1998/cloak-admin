<template>
  <div class="visitor-ip-list">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="IP地址">
          <el-input
            v-model="searchForm.ip"
            placeholder="请输入IP地址"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="时间筛选">
          <el-select v-model="searchForm.timeRange" placeholder="请选择时间范围" style="width: 150px">
            <el-option label="当天" value="today" />
            <el-option label="昨天" value="yesterday" />
            <el-option label="本周" value="week" />
            <el-option label="本月" value="month" />
            <el-option label="全部" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item label="访客类型">
          <el-select v-model="searchForm.visitorType" placeholder="请选择类型" clearable style="width: 150px">
            <el-option label="访客" value="visitor" />
            <el-option label="爬虫" value="bot" />
            <el-option label="代理" value="proxy" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品筛选">
          <el-input
            v-model="selectedProductName"
            placeholder="点击选择商品"
            readonly
            style="width: 200px"
            @click="productDialogVisible = true"
          >
            <template #suffix>
              <el-icon v-if="searchForm.productId" @click.stop="clearProduct" style="cursor: pointer"><Close /></el-icon>
              <el-icon v-else><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="推广参数">
          <el-input
            v-model="searchForm.emParam"
            placeholder="请输入em参数"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="warning" @click="handleClearAllCache" :loading="clearCacheLoading">
            <el-icon><Delete /></el-icon>
            一键清空缓存
          </el-button>
          <!-- 一键同步轨迹 - 暂时隐藏 -->
          <!-- <el-button type="success" @click="handleSyncBehaviorData" :loading="syncLoading">
            <el-icon><Connection /></el-icon>
            一键同步轨迹
          </el-button> -->
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计信息卡片 -->
    <div class="statistics-title">
      <h3>统计数据（{{ getTimeRangeLabel() }}）</h3>
    </div>
    <el-row :gutter="20" class="statistics-cards">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalIps }}</div>
            <div class="stat-label">总IP数</div>
          </div>
          <div class="stat-icon">
            <el-icon><Monitor /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.todayIps }}</div>
            <div class="stat-label">今日新增</div>
          </div>
          <div class="stat-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card genuine">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.genuineCount }}</div>
            <div class="stat-label">访问正品</div>
          </div>
          <div class="stat-icon">
            <el-icon><Checked /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card fake">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.fakeCount }}</div>
            <div class="stat-label">访问仿品</div>
          </div>
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalBots }}</div>
            <div class="stat-label">访问爬虫</div>
          </div>
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ statistics.totalProxies }}</div>
            <div class="stat-label">访问代理</div>
          </div>
          <div class="stat-icon">
            <el-icon><Connection /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 来源统计和设备统计卡片 -->
    <el-row :gutter="20" class="statistics-cards" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="source-stats-card">
          <div class="card-header">
            <h3>访问来源统计</h3>
          </div>
          <div class="source-stats-list">
            <div v-for="item in statistics.sourceStats" :key="item.source" class="source-item">
              <div class="source-name">
                <el-tag :type="getSourceTagType(item.source)" size="default">
                  {{ item.source }}
                </el-tag>
              </div>
              <div class="source-count">
                <span class="count-value">{{ item.count }}</span>
                <span class="count-label">次</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="source-stats-card">
          <div class="card-header">
            <h3>设备统计</h3>
          </div>
          <div class="source-stats-list">
            <div v-for="item in statistics.deviceStats" :key="item.device" class="source-item">
              <div class="source-name">
                <el-tag type="info" size="default">
                  {{ item.device }}
                </el-tag>
              </div>
              <div class="source-count">
                <span class="count-value">{{ item.count }}</span>
                <span class="count-label">次</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <el-card class="table-card" shadow="never">
      <div class="table-header">
        <div class="table-title">访客IP列表</div>
        <div class="table-actions">
          <el-button type="primary" @click="showExportDialog" :loading="exportIPLoading">
            <el-icon><Download /></el-icon>
            导出IP
          </el-button>
          <el-button @click="loadStatistics">
            <el-icon><Refresh /></el-icon>
            刷新统计
          </el-button>
        </div>
      </div>

      <!-- IP列表 -->
      <div v-loading="loading" class="ip-list">
        <div
          v-for="(row, index) in tableData"
          :key="row.id"
          class="ip-item"
          :class="{ 'last-item': index === tableData.length - 1 }"
        >
          <div class="ip-header">
            <div class="ip-address">{{ row.ip_address }}</div>
            <div class="ip-actions">
              <el-button type="success" size="small" @click="handleRefreshIp(row)">
                <el-icon><RefreshRight /></el-icon>
                重新识别
              </el-button>
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <!-- <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button> -->
            </div>
          </div>

          <div class="ip-content">
            <div class="ip-section">
              <div class="section-title">地理位置</div>
              <div class="address-info">
                <div class="address-line">
                  <span class="label">城市:</span>
                  <span class="value">{{ row.city || "-" }}</span>
                </div>
                <div class="address-line">
                  <span class="label">地区:</span>
                  <span class="value">
                    {{ row.region || "-" }}
                    <el-tag v-if="row.region_code" size="small" type="info" style="margin-left: 4px">
                      {{ row.region_code }}
                    </el-tag>
                  </span>
                </div>
                <div class="address-line">
                  <span class="label">国家:</span>
                  <span class="value">
                    {{ row.country_name || row.country || "-" }}
                    <el-tag v-if="row.country_code || row.country" size="small" type="info" style="margin-left: 4px">
                      {{ row.country_code || row.country }}
                    </el-tag>
                  </span>
                </div>
                <div class="address-line" v-if="row.continent">
                  <span class="label">大洲:</span>
                  <span class="value">
                    {{ row.continent }}
                    <el-tag v-if="row.continent_code" size="small" type="info" style="margin-left: 4px">
                      {{ row.continent_code }}
                    </el-tag>
                  </span>
                </div>
                <div class="address-line" v-if="row.postal_code">
                  <span class="label">邮编:</span>
                  <span class="value">{{ row.postal_code }}</span>
                </div>
                <div class="address-line" v-if="row.timezone">
                  <span class="label">时区:</span>
                  <span class="value">{{ row.timezone }}</span>
                </div>
                <div class="address-line" v-if="row.latitude && row.longitude">
                  <span class="label">坐标:</span>
                  <span class="value">{{ row.latitude }}, {{ row.longitude }}</span>
                </div>
                <div class="address-line" v-else-if="row.location">
                  <span class="label">坐标:</span>
                  <span class="value">{{ row.location }}</span>
                </div>
                <div class="address-line">
                  <span class="label">首次访问:</span>
                  <span class="value">{{ formatDate(row.first_visit) }}</span>
                </div>
                <div class="address-line">
                  <span class="label">最后访问:</span>
                  <span class="value">{{ formatDate(row.last_visit) }}</span>
                </div>
                <div class="address-line">
                  <span class="label">访问次数:</span>
                  <el-tag type="info" size="small">{{ row.visit_count }}</el-tag>
                </div>
              </div>
            </div>

            <div class="ip-section">
              <div class="section-title">网络与组织</div>
              <div class="organization-info">
                <div class="org-line">
                  <span class="label">主机名:</span>
                  <span class="value" :title="row.hostname || '-'">{{ row.hostname || "-" }}</span>
                </div>
                <div class="org-line">
                  <span class="label">ASN号码:</span>
                  <span class="value">{{ row.asn || "-" }}</span>
                </div>
                <div class="org-line">
                  <span class="label">AS组织名称:</span>
                  <span class="value" :title="row.as_name || '-'">{{ row.as_name || "-" }}</span>
                </div>
                <div class="org-line">
                  <span class="label">AS域名:</span>
                  <span class="value">{{ row.as_domain || "-" }}</span>
                </div>
                <div class="org-line">
                  <span class="label">AS类型:</span>
                  <span class="value">
                    <el-tag v-if="row.as_type" size="small" type="primary">{{ row.as_type }}</el-tag>
                    <span v-else>-</span>
                  </span>
                </div>
                <div class="org-line" v-if="row.organization && row.organization !== row.asn + ' ' + row.as_name">
                  <span class="label">组织信息:</span>
                  <span class="value" :title="row.organization">{{ row.organization }}</span>
                </div>
                <div class="org-tags">
                  <el-tag v-if="isProxy(row)" size="small" type="info">代理</el-tag>
                  <el-tag v-if="isDataCenter(row)" size="small" type="warning">机房</el-tag>
                </div>
              </div>
            </div>

            <div class="ip-section">
              <div class="section-title">访问信息</div>
              <div class="basic-type">
                <div class="type-line">
                  <span class="label">访问类型:</span>
                  <el-tag :type="getTypeColor(row)" size="small">{{ getTypeName(row) }}</el-tag>
                </div>
                <div class="type-line">
                  <span class="label">设备:</span>
                  <span class="value">{{ getDeviceInfo(row) || "-" }}</span>
                </div>
                <div class="type-line">
                  <span class="label">系统:</span>
                  <span class="value">{{ getSystemInfo(row) || "-" }}</span>
                </div>
                <div class="type-line">
                  <span class="label">商品ID:</span>
                  <el-tag v-if="row.product_id" size="small" type="success">{{ row.product_id }}</el-tag>
                  <span v-else class="value">-</span>
                </div>
                <div class="type-line">
                  <span class="label">推广参数:</span>
                  <el-tag v-if="row.em_param" size="small" type="warning">{{ row.em_param }}</el-tag>
                  <span v-else class="value">-</span>
                </div>
                <div class="type-line">
                  <span class="label">产品类型:</span>
                  <el-tag v-if="row.product_type" size="small" :type="getProductTypeColor(row.product_type)">
                    {{ getProductTypeLabel(row.product_type) }}
                  </el-tag>
                  <span v-else class="value">-</span>
                </div>
                <div class="type-line" v-if="row.cloak_reason">
                  <span class="label">判断原因:</span>
                  <el-tag size="small" :type="row.product_type === 'fake' ? 'danger' : 'success'">
                    {{ row.cloak_reason }}
                  </el-tag>
                </div>
                <div class="type-line">
                  <span class="label">访问页面:</span>
                  <span class="value referer" :title="row.access_address || '-'">
                    {{ row.access_address || "-" }}
                  </span>
                </div>
                <div class="type-line">
                  <span class="label">来源页面:</span>
                  <span class="value referer" :title="row.referer || '-'">
                    {{ row.referer || "-" }}
                  </span>
                </div>
                <div class="type-line">
                  <span class="label">User-Agent:</span>
                  <span class="value referer" :title="row.user_agent || '-'">
                    {{ row.user_agent || "-" }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 推荐产品追踪 -->
            <div class="ip-section" v-if="row.recommend_data && Object.keys(row.recommend_data).length > 0">
              <div class="section-title">📊 推荐追踪</div>
              <div class="recommend-tracking">
                <div v-for="(trackData, productId) in row.recommend_data" :key="productId" class="recommend-track-item">
                  <div class="track-product-id">产品: {{ productId }}</div>
                  <div class="track-info">
                    <el-tag :type="trackData.show ? 'success' : 'info'" size="small">
                      {{ trackData.show ? "✓ 已展示" : "未展示" }}
                    </el-tag>
                    <el-tag v-if="trackData.clicks && trackData.clicks.length > 0" type="warning" size="small">
                      点击: {{ trackData.clicks.length }}
                    </el-tag>
                    <el-tag v-else type="info" size="small">未点击</el-tag>
                  </div>
                  <div v-if="trackData.clicks && trackData.clicks.length > 0" class="track-clicks">
                    <div class="clicked-products">
                      <div v-for="(clickId, idx) in trackData.clicks" :key="idx" class="clicked-product">→ {{ clickId }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Privacy 隐私检测 -->
            <div class="ip-section">
              <div class="section-title">Privacy 隐私检测</div>
              <div class="privacy-tags">
                <span class="privacy-item">
                  <span class="privacy-label">VPN:</span>
                  <el-tag v-if="row.privacy_vpn || row.is_anonymous" type="danger" size="small">是</el-tag>
                  <el-tag v-else type="success" size="small">否</el-tag>
                </span>
                <span class="privacy-item">
                  <span class="privacy-label">Proxy:</span>
                  <el-tag v-if="row.privacy_proxy" type="danger" size="small">是</el-tag>
                  <el-tag v-else type="success" size="small">否</el-tag>
                </span>
                <span class="privacy-item">
                  <span class="privacy-label">Tor:</span>
                  <el-tag v-if="row.privacy_tor" type="danger" size="small">是</el-tag>
                  <el-tag v-else type="success" size="small">否</el-tag>
                </span>
                <span class="privacy-item">
                  <span class="privacy-label">托管:</span>
                  <el-tag v-if="row.privacy_hosting || row.is_hosting" type="warning" size="small">是</el-tag>
                  <el-tag v-else type="success" size="small">否</el-tag>
                </span>
                <span class="privacy-item">
                  <span class="privacy-label">移动:</span>
                  <el-tag v-if="row.is_mobile || row.carrier_name" type="primary" size="small">是</el-tag>
                  <el-tag v-else type="info" size="small">否</el-tag>
                </span>
              </div>
            </div>

            <div v-if="isBot(row) || isProxy(row)" class="ip-section">
              <div class="section-title">详细类型</div>
              <div class="detailed-type">
                <div class="type-line">
                  <span class="label">类型:</span>
                  <el-tag :type="getTypeColor(row)" size="small">{{ getTypeName(row) }}</el-tag>
                </div>
                <div class="type-line">
                  <span class="label">名称:</span>
                  <span class="value">{{ getBotName(row) || "-" }}</span>
                </div>
                <div class="type-line">
                  <span class="label">说明:</span>
                  <span class="value">{{ getBotDescription(row) || "-" }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

    <!-- 商品选择对话框 -->
    <el-dialog v-model="productDialogVisible" title="选择商品" width="800px" :close-on-click-modal="false">
      <div class="product-select-dialog">
        <el-input
          v-model="productSearchKeyword"
          placeholder="搜索商品标题或ID"
          clearable
          style="margin-bottom: 20px"
          @input="handleProductSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-table
          :data="filteredProductList"
          v-loading="productLoading"
          height="400"
          highlight-current-row
          @row-click="handleProductSelect"
        >
          <el-table-column prop="spu_id" label="商品ID" width="180" />
          <el-table-column prop="title" label="商品标题" show-overflow-tooltip />
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope">
              <el-button type="primary" size="small" @click.stop="handleProductSelect(scope.row)">选择</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="productPagination.page"
          v-model:page-size="productPagination.size"
          :total="productPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 20px"
          @size-change="loadProducts"
          @current-change="loadProducts"
        />
      </div>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="IP详情" width="800px" :close-on-click-modal="false">
      <div v-if="currentVisitorIp" class="ip-detail">
        <!-- 基础信息 -->
        <div class="detail-section">
          <h4 class="section-title">基础信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="IP地址">{{ currentVisitorIp.ip_address }}</el-descriptions-item>
            <el-descriptions-item label="主机名">
              <span v-if="currentVisitorIp.hostname">{{ currentVisitorIp.hostname }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="访问次数">
              <el-tag type="info">{{ currentVisitorIp.visit_count }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="产品类型">
              <el-tag
                v-if="currentVisitorIp.product_type"
                :type="getProductTypeColor(currentVisitorIp.product_type)"
                size="small"
              >
                {{ getProductTypeLabel(currentVisitorIp.product_type) }}
              </el-tag>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="首次访问">{{ formatDate(currentVisitorIp.first_visit) }}</el-descriptions-item>
            <el-descriptions-item label="最后访问">{{ formatDate(currentVisitorIp.last_visit) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 地理位置信息 -->
        <div class="detail-section">
          <h4 class="section-title">地理位置信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="城市">
              <span v-if="currentVisitorIp.city">{{ currentVisitorIp.city }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="地区">
              <span v-if="currentVisitorIp.region">{{ currentVisitorIp.region }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="国家代码">
              <span v-if="currentVisitorIp.country_code">{{ currentVisitorIp.country_code }}</span>
              <span v-else-if="currentVisitorIp.country">{{ currentVisitorIp.country }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="大洲">
              <span v-if="currentVisitorIp.continent">
                {{ currentVisitorIp.continent }} ({{ currentVisitorIp.continent_code }})
              </span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="邮编">
              <span v-if="currentVisitorIp.postal_code">{{ currentVisitorIp.postal_code }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="时区">
              <span v-if="currentVisitorIp.timezone">{{ currentVisitorIp.timezone }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="经纬度" :span="2">
              <span v-if="currentVisitorIp.latitude && currentVisitorIp.longitude">
                {{ currentVisitorIp.latitude }}, {{ currentVisitorIp.longitude }}
              </span>
              <span v-else-if="currentVisitorIp.location">{{ currentVisitorIp.location }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- AS (自治系统) 信息 -->
        <div class="detail-section">
          <h4 class="section-title">AS (自治系统) 信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="ASN">
              <span v-if="currentVisitorIp.asn">{{ currentVisitorIp.asn }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="AS 类型">
              <el-tag v-if="currentVisitorIp.as_type" size="small">{{ currentVisitorIp.as_type }}</el-tag>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="AS 组织名称" :span="2">
              <span v-if="currentVisitorIp.as_name">{{ currentVisitorIp.as_name }}</span>
              <span v-else-if="currentVisitorIp.organization">{{ currentVisitorIp.organization }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="AS 域名" :span="2">
              <span v-if="currentVisitorIp.as_domain">{{ currentVisitorIp.as_domain }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="AS 路由" :span="2">
              <span v-if="currentVisitorIp.asn_route">{{ currentVisitorIp.asn_route }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 隐私检测详情 (Premium API) -->
        <div
          v-if="currentVisitorIp.privacy_vpn !== undefined || currentVisitorIp.privacy_proxy !== undefined"
          class="detail-section"
        >
          <h4 class="section-title">隐私检测详情 (Premium)</h4>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="VPN">
              <el-tag v-if="currentVisitorIp.privacy_vpn" type="danger" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="代理">
              <el-tag v-if="currentVisitorIp.privacy_proxy" type="danger" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Tor">
              <el-tag v-if="currentVisitorIp.privacy_tor" type="danger" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="中继">
              <el-tag v-if="currentVisitorIp.privacy_relay" type="warning" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="托管服务">
              <el-tag v-if="currentVisitorIp.privacy_hosting" type="warning" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务类型">
              <span v-if="currentVisitorIp.privacy_service">{{ currentVisitorIp.privacy_service }}</span>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 公司/运营商信息 -->
        <div v-if="currentVisitorIp.company_name || currentVisitorIp.carrier_name" class="detail-section">
          <h4 class="section-title">公司/运营商信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item v-if="currentVisitorIp.company_name" label="公司名称">
              {{ currentVisitorIp.company_name }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.company_domain" label="公司域名">
              {{ currentVisitorIp.company_domain }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.company_type" label="公司类型">
              <el-tag size="small">{{ currentVisitorIp.company_type }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.carrier_name" label="运营商">
              {{ currentVisitorIp.carrier_name }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.carrier_mcc" label="MCC">
              {{ currentVisitorIp.carrier_mcc }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.carrier_mnc" label="MNC">
              {{ currentVisitorIp.carrier_mnc }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 滥用举报信息 -->
        <div v-if="currentVisitorIp.abuse_email" class="detail-section">
          <h4 class="section-title">滥用举报联系信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item v-if="currentVisitorIp.abuse_name" label="联系人">
              {{ currentVisitorIp.abuse_name }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.abuse_email" label="邮箱">
              <a :href="`mailto:${currentVisitorIp.abuse_email}`">{{ currentVisitorIp.abuse_email }}</a>
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.abuse_phone" label="电话">
              {{ currentVisitorIp.abuse_phone }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.abuse_country" label="国家">
              {{ currentVisitorIp.abuse_country }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.abuse_address" label="地址" :span="2">
              {{ currentVisitorIp.abuse_address }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentVisitorIp.abuse_network" label="网络范围" :span="2">
              {{ currentVisitorIp.abuse_network }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 其他信息 -->
        <div v-if="currentVisitorIp.domains_total" class="detail-section">
          <h4 class="section-title">其他信息</h4>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="关联域名总数">
              {{ currentVisitorIp.domains_total }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- IP 特征标识 -->
        <div class="detail-section">
          <h4 class="section-title">IP 特征标识</h4>
          <el-descriptions :column="3" border size="default">
            <el-descriptions-item label="匿名 IP">
              <el-tag v-if="currentVisitorIp.is_anonymous" type="danger" size="small">是 (VPN/Proxy)</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="托管 IP">
              <el-tag v-if="currentVisitorIp.is_hosting" type="warning" size="small">是 (数据中心)</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="移动网络">
              <el-tag v-if="currentVisitorIp.is_mobile" type="primary" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="任播 IP">
              <el-tag v-if="currentVisitorIp.is_anycast" type="info" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="卫星网络">
              <el-tag v-if="currentVisitorIp.is_satellite" type="info" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 访问信息 -->
        <div class="detail-section">
          <h4 class="section-title">访问信息</h4>
          <el-descriptions :column="1" border size="default">
            <el-descriptions-item label="访问页面">
              <div v-if="currentVisitorIp.access_address" class="referer-info">
                <el-link :href="currentVisitorIp.access_address" target="_blank" type="primary" size="small">
                  {{ currentVisitorIp.access_address }}
                </el-link>
              </div>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
            <el-descriptions-item label="来源页面">
              <div v-if="currentVisitorIp.referer" class="referer-info">
                <el-link :href="currentVisitorIp.referer" target="_blank" type="primary" size="small">
                  {{ currentVisitorIp.referer }}
                </el-link>
              </div>
              <span v-else class="text-gray-400">--</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

    <!-- 用户行为时间线弹窗 -->
    <el-dialog v-model="timelineDialogVisible" title="用户行为轨迹" width="800px" :close-on-click-modal="false">
      <div v-loading="timelineLoading" class="timeline-container">
        <div v-if="currentTimeline" class="timeline-content">
          <!-- 摘要信息 -->
          <div class="timeline-header">
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="Session ID">
                <el-text size="small" type="info">{{ currentTimeline.sessionId }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="数据来源">
                <el-tag :type="currentTimeline.source === 'redis' ? 'success' : 'info'" size="small">
                  {{ currentTimeline.source === "redis" ? "Redis (实时)" : "MySQL (历史)" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="进入时间">
                {{ currentTimeline.enterTime }}
              </el-descriptions-item>
              <el-descriptions-item label="离开时间">
                {{ currentTimeline.exitTime || "未离开" }}
              </el-descriptions-item>
              <el-descriptions-item label="停留时长">
                <el-text type="primary">{{ currentTimeline.durationText }}</el-text>
              </el-descriptions-item>
              <el-descriptions-item label="操作次数">
                <el-text type="warning">{{ currentTimeline.actions.length }} 次</el-text>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 时间线 -->
          <div class="timeline-list">
            <el-timeline>
              <el-timeline-item
                v-for="action in currentTimeline.actions"
                :key="action.sequence"
                :timestamp="action.time"
                :type="getActionType(action.type)"
                placement="top"
              >
                <div class="timeline-item-content">
                  <div class="action-description">
                    <el-tag :type="getActionTagType(action.type)" size="small">
                      {{ action.typeName }}
                    </el-tag>
                    <span class="action-text">{{ action.description }}</span>
                  </div>
                  <div v-if="action.detail" class="action-detail">
                    <el-text size="small" type="info"> 详情: {{ JSON.stringify(action.detail) }} </el-text>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
        <el-empty v-else description="暂无轨迹数据" />
      </div>
    </el-dialog>

    <!-- 导出IP对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出访客IP" width="400px">
      <el-form label-width="100px">
        <el-form-item label="时间范围">
          <el-select v-model="exportDays" placeholder="请选择天数" style="width: 100%">
            <el-option label="最近1天" :value="1" />
            <el-option label="最近3天" :value="3" />
            <el-option label="最近7天" :value="7" />
            <el-option label="最近15天" :value="15" />
            <el-option label="最近30天" :value="30" />
            <el-option label="最近60天" :value="60" />
            <el-option label="最近90天" :value="90" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExportIPs" :loading="exportIPLoading">确定导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
// import { ElMessageBox } from "element-plus"; // 暂时不用
import {
  Monitor,
  TrendCharts,
  Refresh,
  RefreshRight,
  Delete,
  // Clock, // 暂时不用
  // View, // 暂时不用
  Connection,
  Search,
  Close,
  Checked,
  Warning
} from "@element-plus/icons-vue";
import { visitorIpApi, exportVisitorIPsUrl, type VisitorIp, type IpStatistics } from "@/api/modules/visitorIp";
// import { userBehaviorApi, type UserBehaviorTimeline } from "@/api/modules/userBehavior"; // 暂时不用
import { getProductListApi } from "@/api/modules/product";

// 响应式数据
const loading = ref(false);
// const syncLoading = ref(false); // 暂时不用
const clearCacheLoading = ref(false);
const exportIPLoading = ref(false);
const exportDialogVisible = ref(false);
const exportDays = ref(7); // 默认7天
const detailDialogVisible = ref(false);
const currentVisitorIp = ref<VisitorIp | null>(null);

// 用户行为时间线相关 - 暂时不用
// const timelineDialogVisible = ref(false);
// const timelineLoading = ref(false);
// const currentTimeline = ref<UserBehaviorTimeline | null>(null);

// 搜索表单
const searchForm = reactive({
  ip: "",
  timeRange: "today", // 默认今天
  visitorType: "",
  productId: "",
  emParam: ""
});

// 商品选择相关
const productDialogVisible = ref(false);
const productLoading = ref(false);
const productList = ref<any[]>([]);
const filteredProductList = ref<any[]>([]);
const productSearchKeyword = ref("");
const selectedProductName = ref("");
const productPagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 分页数据
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 表格数据
const tableData = ref<VisitorIp[]>([]);
// const selectedRows = ref<VisitorIp[]>([]);

// 统计数据
const statistics = ref<IpStatistics>({
  totalIps: 0,
  todayIps: 0,
  totalBots: 0,
  totalProxies: 0,
  genuineCount: 0,
  fakeCount: 0,
  productTypeStats: [],
  sourceStats: [],
  deviceStats: []
});

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("zh-CN");
};

// 获取地理位置字符串 - 暂时不用（已改为分字段显示）
/* const getLocationString = (row: VisitorIp) => {
  const parts = [];
  if (row.country) parts.push(row.country);
  if (row.region) parts.push(row.region);
  if (row.city) parts.push(row.city);
  return parts.length > 0 ? parts.join(" - ") : null;
}; */

// 判断是否为代理
const isProxy = (row: VisitorIp) => {
  const proxyKeywords = ["proxy", "vpn", "tor", "anonymizer"];
  const org = (row.organization || "").toLowerCase();
  return proxyKeywords.some(keyword => org.includes(keyword));
};

// 判断是否为数据中心
const isDataCenter = (row: VisitorIp) => {
  const datacenterKeywords = [
    "amazon",
    "google",
    "microsoft",
    "cloudflare",
    "digitalocean",
    "linode",
    "vultr",
    "aws",
    "gcp",
    "azure"
  ];
  const org = (row.organization || "").toLowerCase();
  return datacenterKeywords.some(keyword => org.includes(keyword));
};

// 获取类型名称
const getTypeName = (row: VisitorIp) => {
  if (isBot(row)) return "爬虫";
  if (isProxy(row)) return "代理";
  return "访客";
};

// 获取类型颜色
const getTypeColor = (row: VisitorIp) => {
  if (isBot(row)) return "primary";
  if (isProxy(row)) return "warning";
  return "success";
};

// 判断是否为审核爬虫（来自大厂但UA异常）
const isAuditBot = (row: VisitorIp) => {
  const bigTechOrgs = ["google", "facebook", "twitter", "linkedin", "microsoft", "bytedance", "tiktok"];
  const org = (row.organization || "").toLowerCase();
  const userAgent = (row.user_agent || "").trim();

  // 检查是否来自大厂组织
  const isFromBigTech = bigTechOrgs.some(tech => org.includes(tech));

  // 检查UA是否异常（为空或过短）
  const hasAbnormalUA = !userAgent || userAgent.length < 20;

  return isFromBigTech && hasAbnormalUA;
};

// 判断是否为爬虫
const isBot = (row: VisitorIp) => {
  // 先检查是否为审核爬虫
  if (isAuditBot(row)) return true;

  const botKeywords = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "crawl",
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "facebook",
    "facebookexternalhit",
    "facebot",
    "twitter",
    "twitterbot",
    "linkedin",
    "linkedinbot",
    "whatsapp",
    "telegrambot",
    "bytedance",
    "bytespider",
    "semrush",
    "ahrefs",
    "mj12bot",
    "petalbot",
    "yandex",
    "baidu"
  ];
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();

  // 检查 user_agent 和 organization
  return botKeywords.some(keyword => userAgent.includes(keyword) || org.includes(keyword));
};

// 获取设备信息
const getDeviceInfo = (row: VisitorIp) => {
  const userAgent = row.user_agent || "";
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Desktop")) return "Desktop";
  return null;
};

// 获取系统信息
const getSystemInfo = (row: VisitorIp) => {
  const userAgent = row.user_agent || "";
  // 先检查移动设备，避免Android被识别为Linux
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  // 再检查桌面系统
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  return null;
};

// 获取爬虫名称
const getBotName = (row: VisitorIp) => {
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();

  // 优先检查审核爬虫
  if (isAuditBot(row)) {
    if (org.includes("google")) return "Google 审核爬虫";
    if (org.includes("facebook")) return "Facebook 审核爬虫";
    if (org.includes("twitter")) return "Twitter 审核爬虫";
    if (org.includes("linkedin")) return "LinkedIn 审核爬虫";
    if (org.includes("microsoft")) return "Microsoft 审核爬虫";
    if (org.includes("bytedance") || org.includes("tiktok")) return "TikTok 审核爬虫";
    return "审核爬虫";
  }

  if (userAgent.includes("googlebot") || (org.includes("google") && userAgent.includes("bot"))) return "Googlebot";
  if (userAgent.includes("bingbot") || (org.includes("microsoft") && userAgent.includes("bot"))) return "BingBot";
  if (userAgent.includes("facebook")) return "Facebook Crawler";
  if (userAgent.includes("twitter")) return "Twitter Bot";
  if (userAgent.includes("ahrefs") || org.includes("ahrefs")) return "aHrefs Bot";
  if (userAgent.includes("httpx")) return "httpx";
  if (userAgent.includes("barkrowler")) return "Barkrowler";
  if (isBot(row)) return "通用爬虫";
  return null;
};

// 获取爬虫说明
const getBotDescription = (row: VisitorIp) => {
  const userAgent = (row.user_agent || "").toLowerCase();
  const org = (row.organization || "").toLowerCase();

  // 审核爬虫说明
  if (isAuditBot(row)) {
    return "广告/内容合规审核（无UA或异常UA）";
  }

  if (userAgent.includes("googlebot") || (org.includes("google") && userAgent.includes("bot"))) return "搜索引擎蜘蛛";
  if (userAgent.includes("bingbot") || (org.includes("microsoft") && userAgent.includes("bot"))) return "搜索引擎蜘蛛";
  if (userAgent.includes("facebook")) return "社交媒体爬虫";
  if (userAgent.includes("twitter")) return "社交媒体爬虫";
  if (userAgent.includes("ahrefs") || org.includes("ahrefs")) return "SEO分析爬虫";
  if (isBot(row)) return "通用网络爬虫";
  return null;
};

// 获取产品类型标签颜色
const getProductTypeColor = (type: string): "success" | "warning" | "info" | "primary" | "danger" => {
  const colorMap: Record<string, "success" | "warning" | "info" | "primary" | "danger"> = {
    A: "primary",
    B: "success",
    C: "warning",
    D: "danger",
    E: "info"
  };
  return colorMap[type] || "info";
};

// 获取产品类型标签文本
const getProductTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    A: "A页",
    B: "B页",
    C: "C页",
    D: "D页",
    E: "E页"
  };
  return labelMap[type] || type;
};

// 获取来源标签类型
const getSourceTagType = (source: string): "success" | "warning" | "info" | "primary" | "danger" => {
  const typeMap: Record<string, "success" | "warning" | "info" | "primary" | "danger"> = {
    YouTube: "danger",
    "Android App": "success",
    Google: "primary",
    Facebook: "primary",
    Instagram: "warning",
    TikTok: "danger",
    "Twitter/X": "info",
    直接访问: "info",
    其他: "info"
  };
  return typeMap[source] || "info";
};

// 获取时间范围标签
const getTimeRangeLabel = () => {
  const labelMap: Record<string, string> = {
    today: "今天",
    yesterday: "昨天",
    week: "本周",
    month: "本月",
    all: "全部时间"
  };
  return labelMap[searchForm.timeRange] || "今天";
};

// 获取访客IP列表
const getVisitorIps = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    };

    const response = await visitorIpApi.getVisitorIps(params);
    if (response.code === 200) {
      tableData.value = response.data.list;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error("获取访客IP列表失败:", error);
    ElMessage.error("获取访客IP列表失败");
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const loadStatistics = async () => {
  try {
    const response = await visitorIpApi.getIpStatistics({
      timeRange: searchForm.timeRange || "today"
    });
    if (response.code === 200) {
      statistics.value = response.data;
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    ElMessage.error("获取统计数据失败");
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  getVisitorIps();
  loadStatistics(); // 同时更新统计数据
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    ip: "",
    timeRange: "today", // 重置为默认今天
    visitorType: "",
    productId: "",
    emParam: ""
  });
  selectedProductName.value = "";
  handleSearch();
};

// 加载商品列表
const loadProducts = async () => {
  try {
    productLoading.value = true;
    const { data } = await getProductListApi({
      page: productPagination.page,
      size: productPagination.size
    });
    productList.value = data.list || [];
    filteredProductList.value = data.list || [];
    productPagination.total = data.total || 0;
  } catch (error: any) {
    ElMessage.error("加载商品列表失败");
  } finally {
    productLoading.value = false;
  }
};

// 搜索商品
const handleProductSearch = () => {
  if (!productSearchKeyword.value) {
    filteredProductList.value = productList.value;
    return;
  }
  const keyword = productSearchKeyword.value.toLowerCase();
  filteredProductList.value = productList.value.filter(
    product => product.title?.toLowerCase().includes(keyword) || product.spu_id?.toLowerCase().includes(keyword)
  );
};

// 选择商品
const handleProductSelect = (product: any) => {
  searchForm.productId = product.spu_id;
  selectedProductName.value = product.title;
  productDialogVisible.value = false;
  ElMessage.success(`已选择商品: ${product.title}`);
};

// 清除商品筛选
const clearProduct = () => {
  searchForm.productId = "";
  selectedProductName.value = "";
};

// 一键同步用户轨迹 - 暂时不用
/* const handleSyncBehaviorData = async () => {
  try {
    await ElMessageBox.confirm("确定要同步Redis中的用户行为数据到MySQL吗？", "同步确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    syncLoading.value = true;
    const { data } = await visitorIpApi.syncBehaviorData();

    if (data.successCount > 0) {
      ElMessage.success(`同步完成！成功: ${data.successCount} 条，失败: ${data.failCount} 条`);
      // 刷新列表和统计
      await Promise.all([getVisitorIps(), loadStatistics()]);
    } else {
      ElMessage.info("没有数据需要同步");
    }
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "同步失败");
    }
  } finally {
    syncLoading.value = false;
  }
}; */

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
  getVisitorIps();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  getVisitorIps();
};

// 选择改变（暂时未使用，保留以备后用）
// const handleSelectionChange = (selection: VisitorIp[]) => {
//   selectedRows.value = selection;
// };

// 查看详情
const handleView = async (row: VisitorIp) => {
  try {
    const response = await visitorIpApi.getVisitorIp(row.ip_address);
    if (response.code === 200) {
      currentVisitorIp.value = response.data;
      detailDialogVisible.value = true;
    }
  } catch (error) {
    console.error("获取IP详情失败:", error);
    ElMessage.error("获取IP详情失败");
  }
};

// 删除（已隐藏）
// const handleDelete = async (row: VisitorIp) => {
//   try {
//     await ElMessageBox.confirm(`确定要删除IP"${row.ip_address}"的记录吗？`, "确认删除", {
//       confirmButtonText: "确定",
//       cancelButtonText: "取消",
//       type: "warning"
//     });

//     const response = await visitorIpApi.deleteVisitorIp(row.ip_address);
//     if (response.code === 200) {
//       ElMessage.success("删除成功");
//       getVisitorIps();
//       loadStatistics();
//     }
//   } catch (error) {
//     if (error !== "cancel") {
//       console.error("删除访客IP失败:", error);
//       ElMessage.error("删除失败");
//     }
//   }
// };

// 一键清空IP缓存
const handleClearAllCache = async () => {
  try {
    clearCacheLoading.value = true;
    const response = await visitorIpApi.clearAllIpCache();
    if (response.code === 200) {
      ElMessage.success(response.message || `成功清理 ${response.data?.count || 0} 个IP缓存`);
    } else {
      ElMessage.error(response.message || "清空缓存失败");
    }
  } catch (error) {
    console.error("清空IP缓存失败:", error);
    ElMessage.error("清空缓存失败");
  } finally {
    clearCacheLoading.value = false;
  }
};

// 显示导出对话框
const showExportDialog = () => {
  exportDialogVisible.value = true;
};

// 导出访客IP（按国家分组）
const handleExportIPs = async () => {
  try {
    exportIPLoading.value = true;

    // 获取导出URL（带天数参数）
    const exportUrl = exportVisitorIPsUrl(exportDays.value);

    // 创建一个隐藏的a标签来触发下载
    const link = document.createElement("a");
    link.href = exportUrl;
    link.download = `visitor_ips_last_${exportDays.value}_days_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    ElMessage.success(`访客IP导出已开始（最近${exportDays.value}天），请稍候...`);
    exportDialogVisible.value = false;
  } catch (error) {
    console.error("导出访客IP失败:", error);
    ElMessage.error("导出访客IP失败");
  } finally {
    exportIPLoading.value = false;
  }
};

// 重新识别单个IP
const handleRefreshIp = async (row: VisitorIp) => {
  try {
    ElMessage.info(`正在重新识别 IP: ${row.ip_address}...`);
    const response = await visitorIpApi.refreshIpInfo(row.ip_address);
    if (response.code === 200) {
      ElMessage.success("IP信息已重新识别并更新");
      // 刷新列表
      await getVisitorIps();
    } else {
      ElMessage.error(response.message || "重新识别失败");
    }
  } catch (error) {
    console.error("重新识别IP失败:", error);
    ElMessage.error("重新识别IP失败");
  }
};

// 手动从Redis获取用户行为数据 - 暂时不用
/* const handleFetchFromRedis = async (row: any) => {
  try {
    const response = await userBehaviorApi.fetchFromRedis(row.ip_address);
    if (response.code === 200) {
      if (response.data) {
        // 更新该行的数据
        row.behaviorSummary = response.data;
        ElMessage.success("获取成功（来自Redis）");
      } else {
        // 没有数据
        ElMessage.info("Redis中暂无该IP的轨迹数据");
      }
    }
  } catch (error: any) {
    console.error("从Redis获取数据失败:", error);
    ElMessage.error("获取失败");
  }
}; */

// 查看用户行为时间线 - 暂时不用
/* const handleViewTimeline = async (row: any) => {
  try {
    if (!row.behaviorSummary) {
      ElMessage.warning("该IP暂无行为轨迹数据");
      return;
    }

    timelineLoading.value = true;
    timelineDialogVisible.value = true;
    currentTimeline.value = null;

    const params = {
      sessionId: row.behaviorSummary.sessionId,
      ip: row.ip_address,
      productId: row.behaviorSummary.productId,
      date: row.behaviorSummary.visitDate.replace(/-/g, "")
    };

    const response = await userBehaviorApi.getTimeline(params);
    if (response.code === 200) {
      currentTimeline.value = response.data;
    }
  } catch (error) {
    console.error("获取用户行为轨迹失败:", error);
    ElMessage.error("获取用户行为轨迹失败");
  } finally {
    timelineLoading.value = false;
  }
}; */

// 获取操作类型对应的时间线类型 - 暂时不用
/* const getActionType = (actionType: string): "primary" | "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "danger" | "info"> = {
    enter: "success",
    leave: "info",
    scroll: "primary",
    click_sku: "warning",
    select_province: "warning",
    select_city: "warning",
    fill_name: "warning",
    fill_phone: "warning",
    submit_order: "danger",
    order_success: "success",
    order_fail: "danger"
  };
  return typeMap[actionType] || "info";
};

// 获取操作类型对应的标签类型 - 暂时不用
const getActionTagType = (actionType: string): "primary" | "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<string, "primary" | "success" | "warning" | "danger" | "info"> = {
    enter: "success",
    leave: "info",
    scroll: "",
    click_sku: "warning",
    select_province: "primary",
    select_city: "primary",
    fill_name: "warning",
    fill_phone: "warning",
    submit_order: "danger",
    order_success: "success",
    order_fail: "danger"
  };
  return typeMap[actionType] || "info";
}; */

// 组件挂载
onMounted(() => {
  getVisitorIps();
  loadStatistics();
  loadProducts();
});
</script>

<style scoped>
.visitor-ip-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.product-select-dialog {
  .el-table {
    cursor: pointer;
  }

  .el-table__row:hover {
    background-color: #f5f7fa;
  }
}

.search-form {
  margin-bottom: 0;
}

.statistics-title {
  margin: 20px 0 10px 0;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin: 0;
    padding-left: 10px;
    border-left: 4px solid #409eff;
  }
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card .stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #666;
}

.stat-card .stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  color: #409eff;
  opacity: 0.3;
}

.stat-card.genuine .stat-value {
  color: #67c23a;
}

.stat-card.genuine .stat-icon {
  color: #67c23a;
}

.stat-card.fake .stat-value {
  color: #f56c6c;
}

.stat-card.fake .stat-icon {
  color: #f56c6c;
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
  margin-top: 20px;
}

.text-gray-400 {
  color: #9ca3af;
}

.ip-detail {
  padding: 10px 0;
}

.location-info {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.location-info h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.location-info p {
  margin: 5px 0;
  color: #666;
}

.referer-info {
  word-break: break-all;
}

/* IP列表样式 */
.ip-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.ip-item {
  border-bottom: 1px solid #e4e7ed;
  padding: 20px;
  transition: background-color 0.3s;
}

.ip-item:hover {
  background-color: #f8f9fa;
}

.ip-item.last-item {
  border-bottom: none;
}

.ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ip-address {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  font-family: "Courier New", monospace;
}

.ip-actions {
  display: flex;
  gap: 8px;
}

.ip-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 20px;
}

.ip-section {
  min-height: 120px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}

.address-info,
.organization-info,
.basic-type,
.detailed-type,
.privacy-info,
.carrier-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.address-line,
.type-line,
.org-line,
.privacy-line,
.carrier-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: #909399;
  min-width: 40px;
}

.value {
  font-size: 13px;
  color: #303133;
  flex: 1;
}

.value.referer {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #409eff;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.org-line .value {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .ip-content {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .ip-content {
    grid-template-columns: 1fr;
  }

  .ip-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .ip-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* IP 详情对话框样式 */
.ip-detail {
  padding: 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

/* Privacy 隐私检测标签样式 */
.privacy-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.privacy-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  min-width: 50px;
}

/* 推荐追踪样式 */
.recommend-tracking {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommend-track-item {
  padding: 10px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.track-product-id {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 600;
}

.track-info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.track-clicks {
  margin-top: 6px;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.clicked-products {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clicked-product {
  font-size: 12px;
  color: #67c23a;
  font-family: "Courier New", monospace;
  padding: 2px 0;
}

.feature-item .el-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 50px;
  justify-content: center;
}

/* 用户轨迹样式 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.behavior-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.behavior-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.behavior-actions {
  display: flex;
  gap: 8px;
}

.duration-text {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.no-data-text {
  font-size: 14px;
  color: #999;
}

/* 时间线弹窗样式 */
.timeline-container {
  min-height: 300px;
  max-height: 70vh;
  overflow-y: auto;
}

.timeline-content {
  padding: 10px 0;
}

.timeline-header {
  margin-bottom: 24px;
}

.timeline-list {
  margin-top: 20px;
}

.timeline-item-content {
  padding: 8px 0;
}

.action-description {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.action-text {
  font-size: 14px;
  color: #303133;
}

.action-detail {
  margin-top: 6px;
  padding-left: 8px;
  border-left: 2px solid #e4e7ed;
}

/* Element Plus 时间线样式覆盖 */
:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: #909399;
}

:deep(.el-timeline-item__content) {
  padding-bottom: 16px;
}

/* 来源统计卡片样式 */
.source-stats-card {
  .card-header {
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .source-stats-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .source-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 180px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      background: #e9ecef;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  .source-name {
    flex: 1;
    margin-right: 12px;
  }

  .source-count {
    display: flex;
    align-items: baseline;
    gap: 4px;

    .count-value {
      font-size: 20px;
      font-weight: 600;
      color: #409eff;
    }

    .count-label {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
