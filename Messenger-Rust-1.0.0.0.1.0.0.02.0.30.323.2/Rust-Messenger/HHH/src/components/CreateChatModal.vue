<script setup lang="ts">
import { ref } from "vue";
import type { User } from "../types/message";

const props = defineProps<{
  users: User[];
  currentUserId: number;
}>();

const emit = defineEmits<{
  close: [];
  create: [
    name: string,
    userIds: number[]
  ];
}>();

const name = ref("");

const selectedUsers = ref<number[]>(
    [props.currentUserId]
);

function toggleUser(userId: number) {
  if (userId === props.currentUserId) {
    return;
  }

  if (selectedUsers.value.includes(userId)) {
    selectedUsers.value =
        selectedUsers.value.filter(
            id => id !== userId
        );
  } else {
    selectedUsers.value.push(userId);
  }
}

function create() {
  const chatName = name.value.trim();

  if (!chatName) return;

  if (selectedUsers.value.length < 2) {
    return;
  }

  emit(
      "create",
      chatName,
      selectedUsers.value
  );
}
</script>

<template>
  <Teleport to="body">
    <div
        class="overlay"
        @click.self="emit('close')"
    >
      <div class="modal">

        <div class="header">
          <h2>Новый чат</h2>

          <button
              type="button"
              @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="content">

          <label>
            <span>Название чата</span>

            <input
                v-model="name"
                type="text"
                maxlength="50"
                placeholder="Например: Друзья"
            />
          </label>

          <h3>Участники</h3>

          <div class="users">

            <button
                v-for="user in users"
                :key="user.id"
                type="button"
                class="user"
                :class="{
                selected:
                  selectedUsers.includes(user.id)
              }"
                @click="toggleUser(user.id)"
            >
              <div class="avatar">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>

              <span>
                {{ user.name }}
              </span>

              <span class="check">
                {{
                  selectedUsers.includes(user.id)
                      ? "✓"
                      : ""
                }}
              </span>
            </button>

          </div>

        </div>

        <div class="footer">

          <button
              type="button"
              class="cancel"
              @click="emit('close')"
          >
            Отмена
          </button>

          <button
              type="button"
              class="create"
              :disabled="
              !name.trim() ||
              selectedUsers.length < 2
            "
              @click="create"
          >
            Создать
          </button>

        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;

  z-index: 10000;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);

  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 430px;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--panel);
  color: var(--text);

  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 18px 20px;

  border-bottom: 1px solid var(--border);
}

.header h2 {
  margin: 0;
  font-size: 18px;
}

.header button {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.content {
  padding: 20px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

label span,
h3 {
  font-size: 13px;
}

input {
  width: 100%;

  padding: 11px 12px;

  border: 1px solid var(--border);
  border-radius: 8px;

  outline: none;

  background: var(--input);
  color: var(--text);

  font: inherit;
}

input:focus {
  border-color: var(--primary);
}

h3 {
  margin: 20px 0 10px;
}

.users {
  max-height: 240px;
  overflow-y: auto;
}

.user {
  width: 100%;

  display: flex;
  align-items: center;

  gap: 10px;

  padding: 9px;

  margin-bottom: 5px;

  border: 1px solid transparent;
  border-radius: 8px;

  background: transparent;
  color: var(--text);

  cursor: pointer;

  text-align: left;
}

.user:hover {
  background: var(--input);
}

.user.selected {
  border-color: var(--primary);
  background: var(--input);
}

.avatar {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: var(--primary);
  color: white;

  font-weight: 700;
}

.check {
  margin-left: auto;
  color: var(--primary);
  font-size: 18px;
}

.footer {
  display: flex;
  justify-content: flex-end;

  gap: 8px;

  padding: 14px 20px;

  border-top: 1px solid var(--border);
}

.cancel,
.create {
  padding: 9px 15px;

  border-radius: 8px;

  cursor: pointer;

  font: inherit;
}

.cancel {
  border: 1px solid var(--border);
  background: var(--input);
  color: var(--text);
}

.create {
  border: none;
  background: var(--primary);
  color: white;
}

.create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>