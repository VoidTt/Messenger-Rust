<script setup lang="ts">
import type {
  Chat,
  User
} from "../types/message";

defineProps<{
  chats: Chat[];
  users: User[];
  currentChatId: number | null;
}>();

const emit = defineEmits<{
  select: [id: number];
  create: [];
}>();
</script>

<template>
  <aside class="sidebar">

    <div class="sidebar-header">
      <h2>Чаты</h2>

      <button
          type="button"
          title="Создать чат"
          @click="emit('create')"
      >
        +
      </button>
    </div>

    <div class="chat-list">

      <button
          v-for="chat in chats"
          :key="chat.id"
          type="button"
          class="chat-item"
          :class="{
          active: chat.id === currentChatId
        }"
          @click="emit('select', chat.id)"
      >
        <div class="chat-avatar">
          {{ chat.name.charAt(0).toUpperCase() }}
        </div>

        <div class="chat-info">
          <strong>{{ chat.name }}</strong>
          <span>
            Чат
          </span>
        </div>
      </button>

      <div
          v-if="chats.length === 0"
          class="empty"
      >
        У вас пока нет чатов
      </div>

    </div>

  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;

  border-left: 1px solid var(--border);

  background: var(--panel);
  color: var(--text);
}

.sidebar-header {
  height: 60px;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 14px;

  border-bottom: 1px solid var(--border);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 16px;
}

.sidebar-header button {
  width: 34px;
  height: 34px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: var(--input);
  color: var(--text);

  cursor: pointer;

  font-size: 20px;
}

.sidebar-header button:hover {
  border-color: var(--primary);
}

.chat-list {
  flex: 1;
  min-height: 0;

  overflow-y: auto;
}

.chat-item {
  width: 100%;

  display: flex;
  align-items: center;

  gap: 10px;

  padding: 10px 12px;

  border: none;
  border-bottom: 1px solid var(--border);

  background: transparent;
  color: var(--text);

  cursor: pointer;

  text-align: left;
}

.chat-item:hover {
  background: var(--input);
}

.chat-item.active {
  background: var(--input);
}

.chat-avatar {
  width: 42px;
  height: 42px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: var(--primary);
  color: white;

  font-weight: 700;
}

.chat-info {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 3px;
}

.chat-info strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-info span {
  color: var(--muted);
  font-size: 12px;
}

.empty {
  padding: 30px 15px;

  text-align: center;

  color: var(--muted);
  font-size: 13px;
}
</style>