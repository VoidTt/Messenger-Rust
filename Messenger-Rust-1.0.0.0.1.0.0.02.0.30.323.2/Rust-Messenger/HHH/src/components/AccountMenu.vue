<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import type { User } from "../types/message";

const props = defineProps<{
  users: User[];
  currentUserId: number;
}>();

const emit = defineEmits<{
  "update:currentUserId": [id: number];
  settings: [];
  profile: [];
}>();

const opened = ref(false);

const currentUser = computed(() => {
  return props.users.find(
      user => user.id === props.currentUserId
  );
});

const avatarUrl = ref("");

async function loadAvatar() {
  avatarUrl.value = "";

  const user = currentUser.value;

  if (!user?.avatar_path) {
    return;
  }

  try {
    const basePath = await appLocalDataDir();

    const fullPath = await join(
        basePath,
        user.avatar_path
    );

    avatarUrl.value = convertFileSrc(
        fullPath,
        "asset"
    );
  } catch (err) {
    console.error("Ошибка загрузки аватара:", err);
  }
}

watch(
    currentUser,
    () => {
      loadAvatar();
    },
    { immediate: true }
);

function selectUser(id: number) {
  emit("update:currentUserId", id);
  opened.value = false;
}
</script>

<template>
  <div class="account-menu">

    <button
        class="account-button"
        type="button"
        @click="opened = !opened"
    >
      <img
          v-if="avatarUrl"
          :src="avatarUrl"
          class="avatar"
          alt=""
      />

      <div
          v-else
          class="avatar placeholder"
      >
        {{ currentUser?.name?.charAt(0) }}
      </div>

      <span>
        {{ currentUser?.name }}
      </span>

      <span>⌄</span>
    </button>

    <div
        v-if="opened"
        class="account-dropdown"
    >

      <div class="account-current">
        <strong>
          {{ currentUser?.name }}
        </strong>
      </div>

      <div class="account-list">
        <button
            v-for="user in users"
            :key="user.id"
            type="button"
            @click="selectUser(user.id)"
        >
          {{ user.name }}
        </button>
      </div>

      <div class="menu-divider"></div>

      <button
          type="button"
          @click="emit('profile')"
      >
        👤 Настроить аккаунт
      </button>

      <button
          type="button"
          @click="emit('settings')"
      >
        ⚙ Настройки
      </button>

    </div>

  </div>
</template>

<style scoped>
.account-menu {
  position: relative;
}

.account-button {
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 10px;

  border: 1px solid #343842;
  border-radius: 8px;

  background: #20232a;
  color: white;

  cursor: pointer;
}

.avatar {
  width: 30px;
  height: 30px;

  border-radius: 50%;

  object-fit: cover;
}

.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  background: #386be0;
  font-weight: 700;
}

.account-dropdown {
  position: absolute;

  top: calc(100% + 8px);
  right: 0;

  width: 240px;

  padding: 8px;

  border: 1px solid #343842;
  border-radius: 10px;

  background: #17191f;

  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);

  z-index: 100;
}

.account-dropdown button {
  width: 100%;

  padding: 9px 10px;

  border: none;
  border-radius: 7px;

  background: transparent;
  color: #f2f3f5;

  text-align: left;

  cursor: pointer;
}

.account-dropdown button:hover {
  background: #252830;
}

.menu-divider {
  height: 1px;

  margin: 8px 0;

  background: #343842;
}
</style>