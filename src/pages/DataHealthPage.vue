<template>
  <div class="data-health-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-text">
        <h1 class="page-title">Tình Trạng Dữ Liệu</h1>
        <p class="page-description">
          Giám sát hoạt động thu thập dữ liệu tự động, độ mới của video và trạng thái gửi cảnh báo Discord.
        </p>
      </div>

      <div class="page-header-actions">
        <div v-if="summary" class="last-fetched-meta">
          Trang cập nhật lúc: <span class="mono">{{ summary.lastFetchedAt }}</span>
        </div>
        <button
          class="btn btn-secondary"
          :disabled="loading"
          @click="loadData"
          title="Tải lại dữ liệu tình trạng mới nhất"
        >
          <AppIcon name="refresh" size="16" :class="{ 'spin-anim': loading }" />
          <span>{{ loading ? 'Đang tải...' : 'Làm Mới' }}</span>
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="error-alert">
      <div class="error-alert-content">
        <AppIcon name="alert" size="18" />
        <span>{{ error }}</span>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadData">
        <AppIcon name="refresh" size="14" />
        <span>Thử Lại</span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !summary" class="skeleton-wrap">
      <div class="skeleton-banner"></div>
      <div class="skeleton-stats">
        <div v-for="n in 4" :key="n" class="skeleton-card"></div>
      </div>
      <div class="skeleton-panel"></div>
      <div class="skeleton-table"></div>
    </div>

    <!-- Main Content -->
    <template v-else-if="summary">
      <!-- 1. System Status Banner -->
      <div class="system-status-banner" :class="`banner-tone-${summary.systemStatus.tone}`">
        <div class="banner-icon-col">
          <AppIcon
            v-if="summary.systemStatus.code === 'normal'"
            name="shield-check"
            size="26"
            class="status-svg-icon"
          />
          <AppIcon
            v-else-if="summary.systemStatus.code === 'running'"
            name="clock"
            size="26"
            class="status-svg-icon"
          />
          <AppIcon
            v-else
            name="alert"
            size="26"
            class="status-svg-icon"
          />
        </div>
        <div class="banner-body">
          <div class="banner-title-row">
            <h2 class="banner-title">{{ summary.systemStatus.label }}</h2>
            <span v-if="summary.systemStatus.isStuckRunning" class="badge-alert-warning">
              Chạy lâu (>30 phút)
            </span>
          </div>
          <p class="banner-desc">{{ summary.systemStatus.description }}</p>
        </div>
      </div>

      <!-- 2. 4 Stat Cards -->
      <div class="stats-grid">
        <!-- Lần quét gần nhất -->
        <div class="stat-card">
          <div class="stat-label">Lần quét gần nhất</div>
          <div class="stat-val-row">
            <span
              v-if="summary.latestScan"
              class="badge-status"
              :class="`status-${summary.latestScan.status}`"
            >
              {{ summary.latestScan.statusLabel }}
            </span>
            <span v-else class="stat-val-empty">Chưa có</span>
          </div>
          <div class="stat-desc">
            {{ summary.latestScan ? `${summary.latestScan.triggerLabel} • ${summary.latestScan.relativeTime}` : 'Hệ thống chưa ghi nhận lần quét nào' }}
          </div>
        </div>

        <!-- Kênh cần chú ý -->
        <div class="stat-card">
          <div class="stat-label">Kênh cần chú ý</div>
          <div
            class="stat-val mono"
            :class="summary.channelsNeedAttentionCount > 0 ? 'stat-warning' : 'stat-normal'"
          >
            {{ summary.channelsNeedAttentionCount }}
          </div>
          <div class="stat-desc">Kênh chưa quét hoặc quét hơn 2 giờ trước</div>
        </div>

        <!-- Video dữ liệu cũ -->
        <div class="stat-card">
          <div class="stat-label">Video dữ liệu cũ</div>
          <div
            class="stat-val mono"
            :class="summary.staleVideosCount > 0 ? 'stat-warning' : 'stat-normal'"
          >
            {{ summary.staleVideosCount }}
          </div>
          <div class="stat-desc">Video chưa có snapshot hoặc snapshot hơn 2 giờ trước</div>
        </div>

        <!-- Cảnh báo gửi lỗi -->
        <div class="stat-card">
          <div class="stat-label">Cảnh báo gửi lỗi</div>
          <div
            class="stat-val mono"
            :class="summary.failedAlertsCount > 0 ? 'stat-danger' : 'stat-normal'"
          >
            {{ summary.failedAlertsCount }}
          </div>
          <div class="stat-desc">Cảnh báo Discord gửi thất bại</div>
        </div>
      </div>

      <!-- 3. Quét Tự Động Gần Nhất -->
      <div class="card-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Quét Tự Động Gần Nhất</h2>
            <p class="section-subtitle">
              Chi tiết về lần thu thập dữ liệu định kỳ gần nhất được kích hoạt tự động theo lịch.
            </p>
          </div>
        </div>

        <div v-if="summary.latestScheduledScan" class="schedule-details-grid">
          <div class="schedule-item">
            <span class="schedule-item-label">Trạng thái</span>
            <span
              class="badge-status"
              :class="`status-${summary.latestScheduledScan.status}`"
            >
              {{ summary.latestScheduledScan.statusLabel }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Bắt đầu lúc</span>
            <span class="schedule-item-val mono">
              {{ formatDateTime(summary.latestScheduledScan.startedAt) }}
            </span>
            <span class="schedule-item-sub">({{ summary.latestScheduledScan.relativeTime }})</span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Thời lượng</span>
            <span class="schedule-item-val mono">
              {{ summary.latestScheduledScan.durationText }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Tổng kênh quét</span>
            <span class="schedule-item-val mono">
              {{ summary.latestScheduledScan.channelsTotal }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Kênh thành công</span>
            <span class="schedule-item-val mono stat-normal">
              {{ summary.latestScheduledScan.channelsSuccess }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Kênh gặp lỗi</span>
            <span
              class="schedule-item-val mono"
              :class="summary.latestScheduledScan.channelsFailed > 0 ? 'stat-danger' : 'stat-normal'"
            >
              {{ summary.latestScheduledScan.channelsFailed }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Video phát hiện</span>
            <span class="schedule-item-val mono">
              {{ summary.latestScheduledScan.videosFound }}
            </span>
          </div>

          <div class="schedule-item">
            <span class="schedule-item-label">Snapshot tạo mới</span>
            <span class="schedule-item-val mono">
              {{ summary.latestScheduledScan.snapshotsCreated }}
            </span>
          </div>
        </div>

        <div v-else class="empty-placeholder">
          Chưa có thông tin lần quét tự động nào trong hệ thống.
        </div>
      </div>

      <!-- 4. Lịch Sử Quét (20 lần gần nhất) -->
      <div class="card-section">
        <div class="section-header-flex">
          <div>
            <h2 class="section-title">Lịch Sử Quét (20 lần gần nhất)</h2>
            <p class="section-subtitle">
              Danh sách các lần quét dữ liệu YouTube tự động và thủ công gần đây.
            </p>
          </div>

          <!-- Bộ lọc -->
          <div class="filter-bar">
            <!-- Kiểu chạy -->
            <div class="filter-group">
              <label class="filter-label">Kiểu:</label>
              <select v-model="scanTypeFilter" class="filter-select">
                <option value="all">Tất cả kiểu</option>
                <option value="schedule">Tự động</option>
                <option value="manual">Thủ công</option>
              </select>
            </div>

            <!-- Trạng thái -->
            <div class="filter-group">
              <label class="filter-label">Trạng thái:</label>
              <select v-model="scanStatusFilter" class="filter-select">
                <option value="all">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="partial">Một phần</option>
                <option value="failed">Thất bại</option>
                <option value="running">Đang chạy</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Scans Desktop Table -->
        <div v-if="filteredScans.length > 0" class="table-container desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thời Gian</th>
                <th>Kiểu Chạy</th>
                <th>Trạng Thái</th>
                <th>Thời Lượng</th>
                <th>Kênh Quét</th>
                <th>Video</th>
                <th>Snapshot</th>
                <th>Cảnh Báo</th>
                <th>Ghi Chú</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="scan in filteredScans" :key="scan.id">
                <td class="cell-nowrap">
                  <div class="scan-time-main mono">{{ formatDateTime(scan.startedAt) }}</div>
                  <div class="scan-time-sub">{{ scan.relativeTime }}</div>
                </td>
                <td>
                  <span class="badge-trigger" :class="`trigger-${scan.triggerSource}`">
                    {{ scan.triggerLabel }}
                  </span>
                </td>
                <td>
                  <span class="badge-status" :class="`status-${scan.status}`">
                    {{ scan.statusLabel }}
                  </span>
                </td>
                <td class="mono cell-nowrap">{{ scan.durationText }}</td>
                <td class="mono">
                  <span>{{ scan.channelsSuccess }}/{{ scan.channelsTotal }}</span>
                  <span v-if="scan.channelsFailed > 0" class="text-danger-sm"> ({{ scan.channelsFailed }} lỗi)</span>
                </td>
                <td class="mono">{{ scan.videosFound }}</td>
                <td class="mono">{{ scan.snapshotsCreated }}</td>
                <td class="mono">
                  <span>{{ scan.alertsSent }} gửi</span>
                  <span v-if="scan.alertsFailed > 0" class="text-danger-sm"> ({{ scan.alertsFailed }} lỗi)</span>
                </td>
                <td>
                  <button
                    v-if="scan.sanitizedError"
                    class="btn-text-danger"
                    @click="openScanError(scan)"
                    title="Xem chi tiết thông báo lỗi"
                  >
                    Xem lỗi
                  </button>
                  <span v-else class="text-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Scans Mobile Card List -->
        <div v-if="filteredScans.length > 0" class="mobile-cards-list mobile-only">
          <div v-for="scan in filteredScans" :key="scan.id" class="mobile-item-card">
            <div class="card-top-row">
              <div>
                <div class="scan-time-main mono">{{ formatDateTime(scan.startedAt) }}</div>
                <div class="scan-time-sub">{{ scan.relativeTime }}</div>
              </div>
              <div class="badges-row">
                <span class="badge-trigger" :class="`trigger-${scan.triggerSource}`">
                  {{ scan.triggerLabel }}
                </span>
                <span class="badge-status" :class="`status-${scan.status}`">
                  {{ scan.statusLabel }}
                </span>
              </div>
            </div>

            <div class="card-metrics-grid">
              <div class="metric-block">
                <span class="metric-label">Thời lượng</span>
                <span class="metric-val mono">{{ scan.durationText }}</span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Kênh quét</span>
                <span class="metric-val mono">{{ scan.channelsSuccess }}/{{ scan.channelsTotal }}</span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Video / Snapshot</span>
                <span class="metric-val mono">{{ scan.videosFound }} / {{ scan.snapshotsCreated }}</span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Cảnh báo</span>
                <span class="metric-val mono">{{ scan.alertsSent }} gửi</span>
              </div>
            </div>

            <div v-if="scan.sanitizedError" class="card-action-row">
              <button class="btn-text-danger" @click="openScanError(scan)">
                Xem thông tin lỗi
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-placeholder">
          Không có lần quét nào phù hợp với bộ lọc được chọn.
        </div>
      </div>

      <!-- 5. Tình Trạng Kênh Theo Dõi -->
      <div class="card-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Tình Trạng Kênh Theo Dõi</h2>
            <p class="section-subtitle">
              Sắp xếp theo độ mới của dữ liệu (kênh chưa quét hoặc chậm quét hiển thị trước).
            </p>
          </div>
        </div>

        <!-- Channel Desktop Table -->
        <div v-if="summary.channels.length > 0" class="table-container desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kênh Đối Thủ</th>
                <th>Lần Quét Cuối</th>
                <th>Tình Trạng Độ Mới</th>
                <th>Giới Hạn Quét</th>
                <th>Ngưỡng Cảnh Báo</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ch in summary.channels" :key="ch.id">
                <td>
                  <div class="channel-cell">
                    <img
                      v-if="ch.avatarUrl"
                      :src="ch.avatarUrl"
                      :alt="ch.name"
                      class="channel-avatar"
                      loading="lazy"
                    />
                    <div v-else class="channel-avatar-placeholder">
                      {{ ch.name.charAt(0) }}
                    </div>
                    <div class="channel-info">
                      <div class="channel-name">{{ ch.name }}</div>
                      <div v-if="ch.handle" class="channel-handle">{{ ch.handle }}</div>
                    </div>
                  </div>
                </td>
                <td class="cell-nowrap">
                  <div class="scan-time-main">{{ ch.relativeScanTime }}</div>
                  <div v-if="ch.lastScanAt" class="scan-time-sub mono">
                    {{ formatDateTime(ch.lastScanAt) }}
                  </div>
                </td>
                <td>
                  <span
                    class="badge-freshness"
                    :class="`freshness-${ch.freshnessCategory}`"
                  >
                    {{ ch.freshnessLabel }}
                  </span>
                </td>
                <td class="mono">{{ ch.scanLimit }} video</td>
                <td class="mono">{{ formatNumber(ch.alertVphThreshold) }} VPH</td>
                <td>
                  <router-link :to="`/kenh-theo-doi/${ch.id}`" class="table-link">
                    Chi tiết
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Channel Mobile Cards -->
        <div v-if="summary.channels.length > 0" class="mobile-cards-list mobile-only">
          <div v-for="ch in summary.channels" :key="ch.id" class="mobile-item-card">
            <div class="card-top-row">
              <div class="channel-cell">
                <img
                  v-if="ch.avatarUrl"
                  :src="ch.avatarUrl"
                  :alt="ch.name"
                  class="channel-avatar"
                  loading="lazy"
                />
                <div v-else class="channel-avatar-placeholder">
                  {{ ch.name.charAt(0) }}
                </div>
                <div class="channel-info">
                  <div class="channel-name">{{ ch.name }}</div>
                  <div v-if="ch.handle" class="channel-handle">{{ ch.handle }}</div>
                </div>
              </div>
              <span
                class="badge-freshness"
                :class="`freshness-${ch.freshnessCategory}`"
              >
                {{ ch.freshnessLabel }}
              </span>
            </div>

            <div class="card-metrics-grid">
              <div class="metric-block">
                <span class="metric-label">Lần quét cuối</span>
                <span class="metric-val">{{ ch.relativeScanTime }}</span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Giới hạn / Ngưỡng</span>
                <span class="metric-val mono">{{ ch.scanLimit }} vid • {{ formatNumber(ch.alertVphThreshold) }} VPH</span>
              </div>
            </div>

            <div class="card-action-row">
              <router-link :to="`/kenh-theo-doi/${ch.id}`" class="table-link">
                Xem phân tích kênh →
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-placeholder">
          Chưa có kênh đối thủ nào đang được theo dõi trong hệ thống.
        </div>
      </div>

      <!-- 6. Video Cần Cập Nhật -->
      <div class="card-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Video Cần Cập Nhật</h2>
            <p class="section-subtitle">
              Danh sách 20 video có snapshot cập nhật lâu nhất hoặc chưa có snapshot từ các kênh đang theo dõi.
            </p>
          </div>
        </div>

        <!-- Video Desktop Table -->
        <div v-if="summary.staleVideos.length > 0" class="table-container desktop-only">
          <table class="data-table">
            <thead>
              <tr>
                <th>Video</th>
                <th>Kênh Đối Thủ</th>
                <th>Snapshot Cuối</th>
                <th>Tình Trạng</th>
                <th>Lượt Xem</th>
                <th>VPH Đo Được</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="video in summary.staleVideos" :key="video.id">
                <td>
                  <div class="video-cell">
                    <img
                      v-if="video.thumbnailUrl"
                      :src="video.thumbnailUrl"
                      :alt="video.title"
                      class="video-thumb"
                      loading="lazy"
                    />
                    <span class="video-title" :title="video.title">{{ video.title }}</span>
                  </div>
                </td>
                <td class="cell-nowrap">{{ video.channelName }}</td>
                <td class="cell-nowrap">
                  <div class="scan-time-main">{{ video.relativeSnapshotTime }}</div>
                  <div v-if="video.latestSnapshotAt" class="scan-time-sub mono">
                    {{ formatDateTime(video.latestSnapshotAt) }}
                  </div>
                </td>
                <td>
                  <span
                    class="badge-freshness"
                    :class="`freshness-${video.freshnessCategory}`"
                  >
                    {{ video.freshnessLabel }}
                  </span>
                </td>
                <td class="mono cell-nowrap">
                  {{ video.latestViewCount !== null ? formatNumber(video.latestViewCount) : '—' }}
                </td>
                <td class="mono cell-nowrap">
                  <span
                    v-if="video.latestMeasuredVph !== null && video.latestMeasuredVph > 0"
                    class="stat-normal"
                  >
                    {{ formatNumber(video.latestMeasuredVph) }}
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <router-link :to="`/videos/${video.id}`" class="table-link">
                    Chi tiết
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Video Mobile Cards -->
        <div v-if="summary.staleVideos.length > 0" class="mobile-cards-list mobile-only">
          <div v-for="video in summary.staleVideos" :key="video.id" class="mobile-item-card">
            <div class="card-top-row">
              <div class="video-cell">
                <img
                  v-if="video.thumbnailUrl"
                  :src="video.thumbnailUrl"
                  :alt="video.title"
                  class="video-thumb"
                  loading="lazy"
                />
                <div class="video-meta-block">
                  <span class="video-title" :title="video.title">{{ video.title }}</span>
                  <span class="video-channel-sub">{{ video.channelName }}</span>
                </div>
              </div>
            </div>

            <div class="card-metrics-grid">
              <div class="metric-block">
                <span class="metric-label">Snapshot cuối</span>
                <span class="metric-val">{{ video.relativeSnapshotTime }}</span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Tình trạng</span>
                <span
                  class="badge-freshness inline-badge"
                  :class="`freshness-${video.freshnessCategory}`"
                >
                  {{ video.freshnessLabel }}
                </span>
              </div>
              <div class="metric-block">
                <span class="metric-label">Lượt xem</span>
                <span class="metric-val mono">
                  {{ video.latestViewCount !== null ? formatNumber(video.latestViewCount) : '—' }}
                </span>
              </div>
              <div class="metric-block">
                <span class="metric-label">VPH hiện tại</span>
                <span class="metric-val mono">
                  {{ video.latestMeasuredVph !== null ? formatNumber(video.latestMeasuredVph) : '—' }}
                </span>
              </div>
            </div>

            <div class="card-action-row">
              <router-link :to="`/videos/${video.id}`" class="table-link">
                Xem chi tiết video →
              </router-link>
            </div>
          </div>
        </div>

        <div v-else class="empty-placeholder">
          Tất cả video đều có snapshot mới và đầy đủ dữ liệu.
        </div>
      </div>

      <!-- 7. Tình Trạng Cảnh Báo Discord -->
      <div class="card-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Tình Trạng Cảnh Báo Discord</h2>
            <p class="section-subtitle">
              Theo dõi quá trình gửi webhook cảnh báo khi video vượt ngưỡng VPH đã thiết lập.
            </p>
          </div>
        </div>

        <!-- Alert Summary Stats -->
        <div class="alert-stats-grid">
          <div class="alert-stat-box">
            <span class="alert-stat-label">Tổng cảnh báo</span>
            <span class="alert-stat-num mono">{{ summary.alertSummary.total }}</span>
          </div>
          <div class="alert-stat-box">
            <span class="alert-stat-label">Đã gửi thành công</span>
            <span class="alert-stat-num mono stat-normal">{{ summary.alertSummary.sent }}</span>
          </div>
          <div class="alert-stat-box">
            <span class="alert-stat-label">Chờ gửi</span>
            <span class="alert-stat-num mono">{{ summary.alertSummary.pending }}</span>
          </div>
          <div class="alert-stat-box">
            <span class="alert-stat-label">Đang gửi</span>
            <span class="alert-stat-num mono">{{ summary.alertSummary.sending }}</span>
          </div>
          <div class="alert-stat-box">
            <span class="alert-stat-label">Gửi thất bại</span>
            <span
              class="alert-stat-num mono"
              :class="summary.alertSummary.failed > 0 ? 'stat-danger' : 'stat-normal'"
            >
              {{ summary.alertSummary.failed }}
            </span>
          </div>
        </div>

        <!-- Cảnh báo bị kẹt gửi -->
        <div v-if="summary.alertSummary.stuckSendingCount > 0" class="stuck-sending-alert">
          <AppIcon name="alert" size="18" />
          <span>
            Có <strong>{{ summary.alertSummary.stuckSendingCount }}</strong> cảnh báo đang ở trạng thái gửi lâu hơn 15 phút. Hệ thống sẽ thử lại tự động ở lần chạy tiếp theo.
          </span>
        </div>

        <!-- Danh sách cảnh báo lỗi -->
        <div v-if="summary.alertSummary.failedAlerts.length > 0" class="failed-alerts-container">
          <h3 class="subsection-title">Danh sách 10 cảnh báo lỗi gần nhất</h3>

          <!-- Desktop Table -->
          <div class="table-container desktop-only">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Kênh Đối Thủ</th>
                  <th>VPH Ghi Nhận</th>
                  <th>Số Lần Thử</th>
                  <th>Thời Gian</th>
                  <th>Chi Tiết Lỗi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alert in summary.alertSummary.failedAlerts" :key="alert.id">
                  <td>
                    <router-link :to="`/videos/${alert.videoId}`" class="table-link">
                      {{ alert.videoTitle }}
                    </router-link>
                  </td>
                  <td class="cell-nowrap">{{ alert.channelName }}</td>
                  <td class="mono cell-nowrap">
                    {{ alert.measuredVph !== null ? formatNumber(alert.measuredVph) : '—' }}
                  </td>
                  <td class="mono">{{ alert.attempts }}</td>
                  <td class="mono cell-nowrap">{{ formatDateTime(alert.updatedAt) }}</td>
                  <td>
                    <button class="btn-text-danger" @click="openAlertError(alert)">
                      Xem lỗi
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-cards-list mobile-only">
            <div v-for="alert in summary.alertSummary.failedAlerts" :key="alert.id" class="mobile-item-card">
              <div class="card-top-row">
                <router-link :to="`/videos/${alert.videoId}`" class="table-link font-medium">
                  {{ alert.videoTitle }}
                </router-link>
              </div>
              <div class="card-metrics-grid">
                <div class="metric-block">
                  <span class="metric-label">Kênh</span>
                  <span class="metric-val">{{ alert.channelName }}</span>
                </div>
                <div class="metric-block">
                  <span class="metric-label">VPH / Thử</span>
                  <span class="metric-val mono">
                    {{ alert.measuredVph !== null ? formatNumber(alert.measuredVph) : '—' }} ({{ alert.attempts }} lần)
                  </span>
                </div>
              </div>
              <div class="card-action-row">
                <button class="btn-text-danger" @click="openAlertError(alert)">
                  Xem chi tiết lỗi
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="alert-success-note">
          <AppIcon name="shield-check" size="18" />
          <span>Tất cả cảnh báo Discord đều gửi thành công hoặc đang chờ xử lý. Không có cảnh báo nào gặp lỗi.</span>
        </div>
      </div>
    </template>

    <!-- Modal Chi Tiết Lỗi Scan -->
    <div v-if="selectedErrorScan" class="modal-backdrop" @click="closeScanError">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <AppIcon name="alert" size="20" class="text-danger" />
            <h3 class="modal-title">Chi Tiết Lỗi Lần Quét</h3>
          </div>
          <button class="btn-close" @click="closeScanError" aria-label="Đóng">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-meta-row">
            <div>
              <span class="meta-label">Bắt đầu:</span>
              <span class="meta-val mono">{{ formatDateTime(selectedErrorScan.startedAt) }}</span>
            </div>
            <div>
              <span class="meta-label">Kiểu chạy:</span>
              <span class="meta-val">{{ selectedErrorScan.triggerLabel }}</span>
            </div>
            <div>
              <span class="meta-label">Trạng thái:</span>
              <span class="meta-val">{{ selectedErrorScan.statusLabel }}</span>
            </div>
          </div>

          <div class="error-box-wrap">
            <label class="error-box-label">Thông báo lỗi (đã ẩn thông tin bảo mật):</label>
            <pre class="error-pre">{{ selectedErrorScan.sanitizedError || 'Không có chi tiết lỗi ghi nhận.' }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeScanError">Đóng</button>
        </div>
      </div>
    </div>

    <!-- Modal Chi Tiết Lỗi Discord Alert -->
    <div v-if="selectedFailedAlert" class="modal-backdrop" @click="closeAlertError">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-wrap">
            <AppIcon name="alert" size="20" class="text-danger" />
            <h3 class="modal-title">Chi Tiết Lỗi Gửi Cảnh Báo Discord</h3>
          </div>
          <button class="btn-close" @click="closeAlertError" aria-label="Đóng">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-meta-row">
            <div>
              <span class="meta-label">Video:</span>
              <span class="meta-val font-medium">{{ selectedFailedAlert.videoTitle }}</span>
            </div>
            <div>
              <span class="meta-label">Kênh:</span>
              <span class="meta-val">{{ selectedFailedAlert.channelName }}</span>
            </div>
            <div>
              <span class="meta-label">Số lần thử:</span>
              <span class="meta-val mono">{{ selectedFailedAlert.attempts }}</span>
            </div>
          </div>

          <div class="error-box-wrap">
            <label class="error-box-label">Thông báo lỗi (đã ẩn thông tin bảo mật):</label>
            <pre class="error-pre">{{ selectedFailedAlert.sanitizedError || 'Không có chi tiết lỗi ghi nhận.' }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAlertError">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { dataHealthService } from '@/services/data-health-service';
import type {
  DataHealthSummary,
  DataHealthScan,
  FailedAlertItem,
  ScanStatus,
} from '@/types/data-health';

const loading = ref(true);
const error = ref<string | null>(null);
const summary = ref<DataHealthSummary | null>(null);

const scanTypeFilter = ref<'all' | 'schedule' | 'manual'>('all');
const scanStatusFilter = ref<'all' | ScanStatus>('all');

const selectedErrorScan = ref<DataHealthScan | null>(null);
const selectedFailedAlert = ref<FailedAlertItem | null>(null);

let refreshInterval: number | undefined;

const filteredScans = computed(() => {
  if (!summary.value) return [];
  let list = summary.value.recentScans;

  if (scanTypeFilter.value !== 'all') {
    list = list.filter(s => s.triggerSource === scanTypeFilter.value);
  }

  if (scanStatusFilter.value !== 'all') {
    list = list.filter(s => s.status === scanStatusFilter.value);
  }

  return list;
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    summary.value = await dataHealthService.fetchDataHealthSummary();
  } catch (err: any) {
    error.value = err?.message || 'Không thể tải dữ liệu tình trạng hệ thống. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
}

function openScanError(scan: DataHealthScan) {
  selectedErrorScan.value = scan;
}

function closeScanError() {
  selectedErrorScan.value = null;
}

function openAlertError(alert: FailedAlertItem) {
  selectedFailedAlert.value = alert;
}

function closeAlertError() {
  selectedFailedAlert.value = null;
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0';
  return n.toLocaleString('vi-VN');
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} ${date}`;
  } catch {
    return iso;
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    loadData();
  }
}

onMounted(() => {
  loadData();
  document.addEventListener('visibilitychange', handleVisibilityChange);
  // Auto refresh every 60s if active
  refreshInterval = window.setInterval(() => {
    if (document.visibilityState === 'visible' && !loading.value) {
      loadData();
    }
  }, 60000);
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.data-health-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header-text {
  flex: 1;
  min-width: 260px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0 0 6px 0;
}

.page-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.last-fetched-meta {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 6px 12px;
  border-radius: 6px;
}

/* System Status Banner */
.system-status-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.banner-tone-success {
  background-color: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.25);
  color: #10b981;
}

.banner-tone-warning {
  background-color: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.banner-tone-danger {
  background-color: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.banner-tone-info {
  background-color: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.3);
  color: #38bdf8;
}

.banner-icon-col {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.status-svg-icon {
  color: currentColor;
}

.banner-body {
  flex: 1;
}

.banner-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.banner-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.badge-alert-warning {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.banner-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* 4 Stat Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-val-row {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.stat-val {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-val-empty {
  font-size: 14px;
  color: var(--text-muted);
}

.stat-normal {
  color: var(--text-primary);
}

.stat-warning {
  color: #f59e0b;
}

.stat-danger {
  color: #ef4444;
}

.stat-desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
  margin-top: auto;
}

/* Card Sections */
.card-section {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.section-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* Schedule Details Grid */
.schedule-details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 16px;
}

.schedule-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.schedule-item-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.schedule-item-val {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.schedule-item-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.filter-select {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 6px 10px;
  cursor: pointer;
  outline: none;
}

.filter-select:focus {
  border-color: var(--accent);
}

/* Tables */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: rgba(255, 255, 255, 0.02);
}

.cell-nowrap {
  white-space: nowrap;
}

.scan-time-main {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.scan-time-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

/* Badges */
.badge-status {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  white-space: nowrap;
}

.status-success {
  background-color: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.status-partial {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.status-failed {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.status-running {
  background-color: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.badge-trigger {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
}

.trigger-schedule {
  background-color: var(--bg-surface-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.trigger-manual {
  background-color: rgba(168, 85, 247, 0.1);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.25);
}

.badge-freshness {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  white-space: nowrap;
}

.freshness-fresh {
  background-color: rgba(16, 185, 129, 0.12);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.freshness-warning {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.freshness-stale {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.freshness-never {
  background-color: var(--bg-surface-elevated);
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
}

/* Channel Cell */
.channel-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.channel-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
}

.channel-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--accent-subtle);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.channel-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.channel-name {
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.channel-handle {
  font-size: 11px;
  color: var(--text-muted);
}

/* Video Cell */
.video-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 320px;
}

.video-thumb {
  width: 54px;
  height: 30px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
}

.video-title {
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.video-meta-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.video-channel-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.table-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.15s ease;
}

.table-link:hover {
  text-decoration: underline;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.btn-text-danger:hover {
  color: #dc2626;
}

.text-danger-sm {
  font-size: 11px;
  color: #ef4444;
}

/* Discord Alert Health */
.alert-stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
}

.alert-stat-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-stat-label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.alert-stat-num {
  font-size: 18px;
  font-weight: 700;
}

.stuck-sending-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #f59e0b;
  font-size: 13px;
}

.failed-alerts-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.alert-success-note {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 8px;
  background-color: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  font-size: 13px;
}

/* Empty Placeholder */
.empty-placeholder {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 13px;
  background-color: var(--bg-surface-elevated);
  border-radius: 8px;
  border: 1px dashed var(--border-subtle);
}

/* Mobile Cards List */
.mobile-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-item-card {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.card-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--border-subtle);
}

.metric-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.metric-val {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.card-action-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
  border-top: 1px dashed var(--border-subtle);
}

.inline-badge {
  align-self: flex-start;
}

/* Modal Dialog */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  box-sizing: border-box;
}

.modal-dialog {
  background-color: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.btn-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-meta-row {
  display: flex;
  gap: 16px;
  font-size: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.meta-label {
  color: var(--text-muted);
  margin-right: 4px;
}

.meta-val {
  color: var(--text-primary);
}

.error-box-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-box-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.error-pre {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  color: #f87171;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 240px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px;
  border-top: 1px solid var(--border-subtle);
}

/* Visibility toggles */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* Skeleton Loading */
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.skeleton-banner {
  height: 72px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-card {
  height: 90px;
  background-color: var(--bg-surface);
  border-radius: 10px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-panel {
  height: 120px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-table {
  height: 200px;
  background-color: var(--bg-surface);
  border-radius: 12px;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Media Queries */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .schedule-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .alert-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .schedule-details-grid {
    grid-template-columns: 1fr;
  }

  .alert-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header-actions {
    justify-content: space-between;
  }
}
</style>
