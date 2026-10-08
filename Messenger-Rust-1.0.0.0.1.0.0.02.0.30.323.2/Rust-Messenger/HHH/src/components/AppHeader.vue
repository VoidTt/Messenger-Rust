<script setup lang="ts">
import AccountMenu from "./AccountMenu.vue";
import type { User } from "../types/message";

defineProps<{
  status: string;
  users: User[];
  currentUserId: number;
}>();

const emit = defineEmits<{
  "update:currentUserId": [id: number];
  settings: [];
  profile: [];
}>();
</script>

<template>
  <header class="header">

    <div class="header-left">
      <div class="logo">
        Messenger
      </div>

      <div class="status">
        {{ status }}
      </div>
    </div>

    <div class="header-right">
      <AccountMenu
          :users="users"
          :current-user-id="currentUserId"
          @update:current-user-id="
          emit('update:currentUserId', $event)
        "
          @settings="emit('settings')"
          @profile="emit('profile')"
      />
    </div>

  </header>
</template>

<style scoped>
.header {
  height: 60px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 20px;

  border-bottom: 1px solid var(--border);

  background: var(--panel);
  color: var(--text);
}

.header-left {
  display: flex;
  align-items: center;

  gap: 12px;
}

.logo {
  font-size: 17px;
  font-weight: 700;
}

.status {
  color: var(--muted);
  font-size: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}
</style>