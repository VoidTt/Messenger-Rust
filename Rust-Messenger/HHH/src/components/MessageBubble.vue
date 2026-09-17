<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import type { Message } from "../types/message";

const props = defineProps<{
  message: Message;
}>();

const emit = defineEmits<{
  imageLoaded: [];
}>();

const imagePath = ref("");

const isImage = computed(() => {
  return props.message.body.startsWith("__IMAGE__:");
});

async function loadImagePath() {
  if (!isImage.value) return;

  const relativePath =
      props.message.body.substring("__IMAGE__:".length);

  const appData = await appLocalDataDir();

  const fullPath =
      await join(appData, relativePath);

  imagePath.value =
      convertFileSrc(fullPath, "asset");
}

onMounted(() => {
  loadImagePath();
});
</script>

<template>
  <article class="message">
    <template v-if="isImage">
      <img
          class="message-image"
          :src="imagePath"
          alt="Чёткая фотка"
          @load="emit('imageLoaded')"
      />
    </template>
    <p v-else>
      {{ message.body }}
    </p>
  </article>
</template>

<style scoped>

.message {
  align-self: flex-end;
  max-width: 70%;
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #386be0;
}

.message p {
  margin: 0;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.message footer {
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 6px;
  color: #ccd8f7;
  font-size: 10px;
}

.message-image {
  display: block;

  max-width: 320px;
  max-height: 320px;

  width: auto;
  height: auto;

  border-radius: 8px;

  object-fit: contain;
}
</style>