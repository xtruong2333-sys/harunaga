// Pinia Store: channel-store.ts
// Quản lý trạng thái danh sách kênh theo dõi

import { defineStore } from 'pinia';
import { Channel, CreateChannelInput, UpdateChannelInput } from '@/types/channel';
import { channelService, DatabaseNotConfiguredError } from '@/services/channel-service';

export interface ChannelState {
  channels: Channel[];
  loading: boolean;
  error: string | null;
  notConfigured: boolean;
}

export const useChannelStore = defineStore('channels', {
  state: (): ChannelState => ({
    channels: [],
    loading: false,
    error: null,
    notConfigured: false,
  }),

  getters: {
    totalCount: (state): number => state.channels.length,
    activeCount: (state): number => state.channels.filter(c => c.status === 'active').length,
    pausedCount: (state): number => state.channels.filter(c => c.status === 'paused').length,
    archivedCount: (state): number => state.channels.filter(c => c.status === 'archived').length,
  },

  actions: {
    async fetchChannels() {
      this.loading = true;
      this.error = null;
      this.notConfigured = false;
      try {
        this.channels = await channelService.listChannels();
      } catch (err: any) {
        if (err instanceof DatabaseNotConfiguredError) {
          this.notConfigured = true;
          this.error = err.message;
        } else {
          this.error = err.message || 'Không thể kết nối dữ liệu. Vui lòng thử lại sau.';
        }
      } finally {
        this.loading = false;
      }
    },

    async addChannel(input: CreateChannelInput): Promise<Channel> {
      const created = await channelService.createChannel(input);
      this.channels.unshift(created);
      return created;
    },

    async pauseChannel(id: string): Promise<Channel> {
      const updated = await channelService.pauseChannel(id);
      this._updateLocalChannel(updated);
      return updated;
    },

    async resumeChannel(id: string): Promise<Channel> {
      const updated = await channelService.resumeChannel(id);
      this._updateLocalChannel(updated);
      return updated;
    },

    async archiveChannel(id: string): Promise<Channel> {
      const updated = await channelService.archiveChannel(id);
      this._updateLocalChannel(updated);
      return updated;
    },

    async restoreChannel(id: string): Promise<Channel> {
      const updated = await channelService.restoreChannel(id);
      this._updateLocalChannel(updated);
      return updated;
    },

    async updateChannel(id: string, input: UpdateChannelInput): Promise<Channel> {
      const updated = await channelService.updateChannel(id, input);
      this._updateLocalChannel(updated);
      return updated;
    },

    _updateLocalChannel(updated: Channel) {
      const index = this.channels.findIndex(c => c.id === updated.id);
      if (index !== -1) {
        this.channels[index] = updated;
      }
    },
  },
});
