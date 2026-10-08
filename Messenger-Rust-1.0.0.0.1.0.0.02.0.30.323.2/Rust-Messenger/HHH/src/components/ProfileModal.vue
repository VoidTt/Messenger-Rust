<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import type { User } from "../types/message";

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  close: [];
  save: [name: string, avatarSourcePath: string | null];
}>();

const name = ref(props.user.name);
const avatarSourcePath = ref<string | null>(null);
const previewUrl = ref("");

watch(
    () => props.user,
    () => {
      name.value = props.user.name;
    }
);

async function selectAvatar() {
  try {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: "Изображения",
          extensions: [
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif",
            "bmp"
          ]
        }
      ]
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    avatarSourcePath.value = selected;

    const data = await readFile(selected);

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }

    const blob = new Blob([data]);
    previewUrl.value = URL.createObjectURL(blob);

  } catch (err) {
    console.error("Ошибка выбора аватара:", err);
  }
}

function save() {
  const trimmedName = name.value.trim();

  if (!trimmedName) {
    return;
  }

  emit(
      "save",
      trimmedName,
      avatarSourcePath.value
  );
}

function close() {
  emit("close");
}

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <Teleport to="body">
    <div
        class="modal-overlay"
        @click.self="close"
    >
      <div class="modal">

        <div class="modal-header">
          <h2>Настройка аккаунта</h2>

          <button
              type="button"
              class="close"
              @click="close"
          >
            ✕
          </button>
        </div>

        <div class="profile-content">

          <div class="avatar-section">

            <div
                v-if="previewUrl"
                class="avatar-big"
            >
              <img
                  :src="previewUrl"
                  alt=""
              />
            </div>

            <div
                v-else-if="props.user.avatar_path"
                class="avatar-big"
            >
              <span>
                {{ props.user.name.charAt(0).toUpperCase() }}
              </span>
            </div>

            <div
                v-else
                class="avatar-big placeholder"
            >
              {{ props.user.name.charAt(0).toUpperCase() }}
            </div>

            <button
                type="button"
                class="avatar-button"
                @click="selectAvatar"
            >
              Выбрать аватар
            </button>

          </div>

          <label class="field">
            <span>Никнейм</span>

            <input
                v-model="name"
                type="text"
                maxlength="32"
                placeholder="Введите никнейм"
            />
          </label>

        </div>

        <div class="modal-footer">

          <button
              type="button"
              class="cancel"
              @click="close"
          >
            Отмена
          </button>

          <button
              type="button"
              class="save"
              :disabled="!name.trim()"
              @click="save"
          >
            Сохранить
          </button>

        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;

  z-index: 10000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
}

.modal {
  width: 100%;
  max-width: 420px;

  border: 1px solid var(--border);
  border-radius: 14px;

  background: var(--panel);
  color: var(--text);

  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 18px 20px;

  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;

  font-size: 18px;
}

.close {
  width: 32px;
  height: 32px;

  border: none;
  border-radius: 7px;

  background: transparent;
  color: var(--muted);

  cursor: pointer;
}

.close:hover {
  background: var(--input);
  color: var(--text);
}

.profile-content {
  padding: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 12px;

  margin-bottom: 24px;
}

.avatar-big {
  width: 100px;
  height: 100px;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  border-radius: 50%;

  background: var(--primary);

  color: white;

  font-size: 36px;
  font-weight: 700;
}

.avatar-big img {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.avatar-button {
  padding: 8px 12px;

  border: 1px solid var(--border);
  border-radius: 7px;

  background: var(--input);
  color: var(--text);

  cursor: pointer;
}

.avatar-button:hover {
  border-color: var(--primary);
}

.field {
  display: flex;
  flex-direction: column;

  gap: 7px;
}

.field span {
  font-size: 13px;
  color: var(--muted);
}

.field input {
  width: 100%;

  padding: 11px 12px;

  border: 1px solid var(--border);
  border-radius: 8px;

  outline: none;

  background: var(--input);
  color: var(--text);

  font: inherit;
}

.field input:focus {
  border-color: var(--primary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;

  gap: 8px;

  padding: 14px 20px;

  border-top: 1px solid var(--border);
}

.cancel,
.save {
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

.save {
  border: none;

  background: var(--primary);
  color: white;
}

.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>