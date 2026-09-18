<template>
  <div class="publishing-channel-rhythm card">
    <div class="rhythm-header">
      <div>
        <h3 class="rhythm-title">NHỊP ĐĂNG THEO KÊNH</h3>
        <p class="rhythm-sub">
          Khoảng cách trung vị và tần suất xuất bản video thực tế của từng kênh đối thủ.
        </p>
      </div>

      <!-- Sorting Controls -->
      <div class="sort-controls">
        <span class="sort-label">Sắp xếp:</span>
        <select v-model="sortBy" class="sort-select">
          <option value="count_desc">Nhiều video trong khoảng</option>
          <option value="recent_desc">Đăng gần nhất</option>
          <option value="median_asc">Khoảng cách trung vị thấp nhất</option>
          <option value="name_asc">Tên kênh A–Z</option>
        </select>
      </div>
    </div>

    <!-- 1. Grid Cards Mode (for channels view mode) -->
    <div v-if="asCards" class="channel-cards-grid">
      <div
        v-for="ch in sortedChannels"
        :key="'card-' + ch.channelId"
        class="channel-rhythm-card"
      >
        <div class="card-head">
          <div class="channel-identity">
            <div class="avatar-wrap">
              <img
                v-if="ch.channelAvatarUrl && !avatarErrors[ch.channelId]"
                :src="ch.channelAvatarUrl"
                :alt="ch.channelName"
                class="ch-avatar"
                @error="avatarErrors[ch.channelId] = true"
              />
              <div v-else class="avatar-fallback" :style="{ backgroundColor: getAvatarColor(ch.channelName) }">
                {{ ch.channelName.charAt(0).toUpperCase() }}
              </div>
            </div>
            <div class="ch-text-info">
              <router-link :to="'/kenh-theo-doi/' + ch.channelId" class="ch-title-link">
                {{ ch.channelName }}
              </router-link>
              <span v-if="ch.channelHandle" class="ch-handle">{{ ch.channelHandle }}</span>
            </div>
          </div>
          <span class="status-badge" :class="`status-${ch.channelStatus}`">
            {{ ch.channelStatus === 'active' ? 'Đang theo dõi' : 'Tạm dừng' }}
          </span>
        </div>

        <div class="card-stats-matrix">
          <div class="matrix-item">
            <span class="m-lbl">Trong khoảng:</span>
            <span class="m-val mono font-bold">{{ ch.videoCountInRange }} video</span>
          </div>
          <div class="matrix-item">
            <span class="m-lbl">Đăng gần nhất:</span>
            <span class="m-val">{{ formatRelativeTime(ch.latestPublishedAt) }}</span>
          </div>
          <div class="matrix-item">
            <span class="m-lbl">Khoảng cách trung vị:</span>
            <span class="m-val mono text-highlight">{{ formatInterval(ch.medianIntervalHours) }}</span>
          </div>
          <div class="matrix-item">
            <span class="m-lbl">Khoảng cách TB:</span>
            <span class="m-val mono">{{ formatInterval(ch.avgIntervalHours) }}</span>
          </div>
          <div class="matrix-item">
            <span class="m-lbl">7 ngày / 30 ngày:</span>
            <span class="m-val mono">{{ ch.videoCount7d }} / {{ ch.videoCount30d }}</span>
          </div>
          <div class="matrix-item">
            <span class="m-lbl">Ngày ghi nhận nhiều:</span>
            <span class="m-val" :class="{ 'text-muted': ch.peakWeekday === 'Chưa đủ dữ liệu' || ch.peakWeekday === '—' }">
              {{ ch.peakWeekday }}
            </span>
          </div>
          <div class="matrix-item full-width">
            <span class="m-lbl">Giờ ghi nhận nhiều:</span>
            <span class="m-val mono" :class="{ 'text-muted': ch.peakHour === 'Chưa đủ dữ liệu' || ch.peakHour === '—' }">
              {{ ch.peakHour }}
            </span>
          </div>
        </div>

        <div class="card-footer-action">
          <router-link :to="'/kenh-theo-doi/' + ch.channelId" class="btn-profile-link">
            <span>Xem hồ sơ đối thủ</span>
            <AppIcon name="arrow-right" :size="12" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- 2. Dense Table Mode (Default) -->
    <div v-else class="table-responsive">
      <table class="rhythm-table">
        <thead>
          <tr>
            <th class="th-channel">Kênh</th>
            <th class="text-right">Trong khoảng</th>
            <th class="text-right">7 ngày</th>
            <th class="text-right">30 ngày</th>
            <th>Đăng gần nhất</th>
            <th>Khoảng cách TB</th>
            <th>Khoảng cách trung vị</th>
            <th>Ngày ghi nhận nhiều nhất</th>
            <th>Giờ ghi nhận nhiều nhất</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ch in sortedChannels" :key="ch.channelId">
            <!-- Channel Info -->
            <td>
              <router-link :to="'/kenh-theo-doi/' + ch.channelId" class="ch-table-link">
                <div class="avatar-wrap-sm">
                  <img
                    v-if="ch.channelAvatarUrl && !avatarErrors[ch.channelId]"
                    :src="ch.channelAvatarUrl"
                    :alt="ch.channelName"
                    class="ch-avatar-sm"
                    @error="avatarErrors[ch.channelId] = true"
                  />
                  <div v-else class="avatar-fallback-sm" :style="{ backgroundColor: getAvatarColor(ch.channelName) }">
                    {{ ch.channelName.charAt(0).toUpperCase() }}
                  </div>
                </div>
                <div class="ch-text-sm">
                  <span class="ch-name-text">{{ ch.channelName }}</span>
                  <span v-if="ch.channelHandle" class="ch-handle-text">{{ ch.channelHandle }}</span>
                </div>
              </router-link>
            </td>

            <!-- Video Counts -->
            <td class="text-right mono font-bold">{{ ch.videoCountInRange }}</td>
            <td class="text-right mono text-muted">{{ ch.videoCount7d }}</td>
            <td class="text-right mono text-muted">{{ ch.videoCount30d }}</td>

            <!-- Last Publish -->
            <td>{{ formatRelativeTime(ch.latestPublishedAt) }}</td>

            <!-- Intervals -->
            <td class="mono">
              <span :title="'Tính từ khoảng cách giữa các video trong khoảng thời gian đã chọn.'">
                {{ formatInterval(ch.avgIntervalHours) }}
              </span>
            </td>
            <td class="mono font-semibold text-highlight">
              <span :title="'Tính từ khoảng cách giữa các video trong khoảng thời gian đã chọn.'">
                {{ formatInterval(ch.medianIntervalHours) }}
              </span>
            </td>

            <!-- Peaks -->
            <td>
              <span :class="{ 'text-muted': ch.peakWeekday === 'Chưa đủ dữ liệu' || ch.peakWeekday === '—' }">
                {{ ch.peakWeekday }}
              </span>
            </td>
            <td class="mono">
              <span :class="{ 'text-muted': ch.peakHour === 'Chưa đủ dữ liệu' || ch.peakHour === '—' }">
                {{ ch.peakHour }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { ChannelPublishingStats } from '@/types/publishing-schedule';
import { formatInterval, formatRelativeTime } from '@/services/publishing-schedule-service';

const props = withDefaults(
  defineProps<{
    channels: ChannelPublishingStats[];
    asCards?: boolean;
  }>(),
  {
    asCards: false,
  }
);

const sortBy = ref<'count_desc' | 'recent_desc' | 'median_asc' | 'name_asc'>('count_desc');
const avatarErrors = ref<Record<string, boolean>>({});

const avatarColors = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#4f46e5'];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

const sortedChannels = computed(() => {
  const list = [...props.channels];
  switch (sortBy.value) {
    case 'recent_desc':
      return list.sort((a, b) => {
        const timeA = a.latestPublishedAt ? new Date(a.latestPublishedAt).getTime() : 0;
        const timeB = b.latestPublishedAt ? new Date(b.latestPublishedAt).getTime() : 0;
        return timeB - timeA;
      });
    case 'median_asc':
      return list.sort((a, b) => {
        if (a.medianIntervalHours === null && b.medianIntervalHours !== null) return 1;
        if (a.medianIntervalHours !== null && b.medianIntervalHours === null) return -1;
        if (a.medianIntervalHours !== null && b.medianIntervalHours !== null) {
          return a.medianIntervalHours - b.medianIntervalHours;
        }
        return b.videoCountInRange - a.videoCountInRange;
      });
    case 'name_asc':
      return list.sort((a, b) => a.channelName.localeCompare(b.channelName));
    case 'count_desc':
    default:
      return list.sort((a, b) => {
        if (b.videoCountInRange !== a.videoCountInRange) {
          return b.videoCountInRange - a.videoCountInRange;
        }
        return a.channelName.localeCompare(b.channelName);
      });
  }
});
</script>

<style scoped>
.publishing-channel-rhythm {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 24px;
}

.rhythm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rhythm-title {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.rhythm-sub {
  font-size: 0.82rem;
  color: #64748b;
  margin: 0;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 0.82rem;
  color: #64748b;
  font-weight: 600;
}

.sort-select {
  appearance: none;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  cursor: pointer;
}

.sort-select:focus {
  border-color: #2563eb;
}

/* Table styling */
.table-responsive {
  overflow-x: auto;
}

.rhythm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  text-align: left;
}

.rhythm-table th {
  padding: 10px 14px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  background: #f8fafc;
  white-space: nowrap;
}

.rhythm-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
  white-space: nowrap;
}

.rhythm-table tr:hover td {
  background: #f8fafc;
}

.ch-table-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.avatar-wrap-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.ch-avatar-sm {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback-sm {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.85rem;
}

.ch-text-sm {
  display: flex;
  flex-direction: column;
}

.ch-name-text {
  font-weight: 700;
  color: #0f172a;
}

.ch-handle-text {
  font-size: 0.75rem;
  color: #64748b;
}

.text-right {
  text-align: right;
}

.text-highlight {
  color: #2563eb;
}

.text-muted {
  color: #94a3b8;
}

/* Cards Grid */
.channel-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.channel-rhythm-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.channel-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.avatar-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.ch-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
  font-size: 1rem;
}

.ch-text-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ch-title-link {
  font-size: 0.92rem;
  font-weight: 800;
  color: #0f172a;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ch-title-link:hover {
  color: #2563eb;
}

.ch-handle {
  font-size: 0.75rem;
  color: #64748b;
}

.status-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  white-space: nowrap;
}

.status-active {
  background: #ecfdf5;
  color: #059669;
}

.status-paused {
  background: #f1f5f9;
  color: #64748b;
}

.card-stats-matrix {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
  background: #ffffff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.matrix-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.matrix-item.full-width {
  grid-column: span 2;
}

.m-lbl {
  font-size: 0.68rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.m-val {
  font-size: 0.82rem;
  color: #1e293b;
  font-weight: 600;
}

.card-footer-action {
  display: flex;
  justify-content: flex-end;
}

.btn-profile-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2563eb;
  text-decoration: none;
}

.btn-profile-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .channel-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .channel-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
