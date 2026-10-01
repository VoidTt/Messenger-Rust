<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import MessageBubble from "./MessageBubble.vue";
import type { Message } from "../types/message";

const props = defineProps<{
  messages: Message[];
  currentUserId: number;
}>();
const emit = defineEmits<{
  edit: [id: number, body: string];
  delete: [id: number];
}>();

const messagesContainer = ref<HTMLElement | null>(null);

function handleEdit(id: number, body: string) {
  emit("edit", id, body);
}

function handleDelete(id: number) {
  emit("delete", id);
}

async function scrollToBottom() {
  await nextTick();

  const container = messagesContainer.value;
  if (!container) return;

  container.scrollTop = container.scrollHeight;

  requestAnimationFrame(() => {
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  });

  setTimeout(() => {
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, 100);
}

watch(
    () => props.messages.length,
    () => {
      scrollToBottom();
    },
    { immediate: true }
);
</script>

<template>
  <div
      ref="messagesContainer"
      class="messages"
  >
    <div
        v-if="messages.length === 0"
        class="empty"
    >
    </div>

    <<MessageBubble
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :current-user-id="currentUserId"
      @image-loaded="scrollToBottom"
      @edit="handleEdit"
      @delete="handleDelete"
  />
  </div>
</template>

<style scoped>

.messages {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  scroll-behavior: smooth;
}

.empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  color: #858c98;
}

</style>