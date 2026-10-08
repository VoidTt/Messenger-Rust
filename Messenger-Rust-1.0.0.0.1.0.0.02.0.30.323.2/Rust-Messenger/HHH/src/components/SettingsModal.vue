<script setup lang="ts">
type Theme = "dark" | "light";

defineProps<{
  theme: Theme;
}>();

const emit = defineEmits<{
  close: [];
  changeTheme: [theme: Theme];
}>();
</script>

<template>
  <Teleport to="body">
    <div
        class="modal-overlay"
        @click.self="emit('close')"
    >
      <div class="modal">

        <div class="modal-header">
          <h2>Настройки</h2>

          <button
              type="button"
              class="close"
              @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <div class="settings-content">

          <h3>Тема</h3>

          <button
              type="button"
              class="theme-option"
              @click="emit('changeTheme', 'dark')"
          >
            <span class="theme-icon">🌙</span>

            <span class="theme-info">
              <strong>Тёмная</strong>
              <small>Тёмный интерфейс</small>
            </span>

            <span
                v-if="theme === 'dark'"
                class="check"
            >
              ✓
            </span>
          </button>

          <button
              type="button"
              class="theme-option"
              @click="emit('changeTheme', 'light')"
          >
            <span class="theme-icon">☀️</span>

            <span class="theme-info">
              <strong>Светлая</strong>
              <small>Светлый интерфейс</small>
            </span>

            <span
                v-if="theme === 'light'"
                class="check"
            >
              ✓
            </span>
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

.settings-content {
  padding: 20px;
}

.settings-content h3 {
  margin: 0 0 12px;

  font-size: 14px;
}

.theme-option {
  width: 100%;

  display: flex;
  align-items: center;

  gap: 12px;

  padding: 12px;

  margin-bottom: 8px;

  border: 1px solid var(--border);
  border-radius: 9px;

  background: var(--input);
  color: var(--text);

  cursor: pointer;

  text-align: left;
}

.theme-option:hover {
  border-color: var(--primary);
}

.theme-icon {
  font-size: 21px;
}

.theme-info {
  flex: 1;

  display: flex;
  flex-direction: column;

  gap: 2px;
}

.theme-info small {
  color: var(--muted);
}

.check {
  font-size: 18px;
  color: var(--primary);
}
</style>