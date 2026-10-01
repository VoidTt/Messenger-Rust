<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import EmojiPicker from "./EmojiPicker.vue";
import { open } from "@tauri-apps/plugin-dialog";
import {
  BaseDirectory,
  mkdir,
  readDir,
  readFile,
  writeFile,
} from "@tauri-apps/plugin-fs";

const draft = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

const emj = ref(false);
const showAttachments = ref(false);

const attachments = ref<string[]>([]);

const emit = defineEmits<{
  send: [body: string];
}>();


function submitMessage() {
  const body = draft.value.trim();

  if (!body) return;

  emit("send", body);

  draft.value = "";
}


async function initAttachments() {
  try {
    await mkdir("attachments", {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });

    await loadAttachments();
  } catch (err) {
    console.error("Ошибка создания attachments:", err);
  }
}

async function loadAttachments() {
  try {
    const entries = await readDir("attachments", {
      baseDir: BaseDirectory.AppLocalData,
    });

    attachments.value = entries
        .filter(entry => {
          if (!entry.name || entry.isDirectory) {
            return false;
          }

          const name = entry.name.toLowerCase();

          return (
              name.endsWith(".png") ||
              name.endsWith(".jpg") ||
              name.endsWith(".jpeg") ||
              name.endsWith(".gif") ||
              name.endsWith(".webp") ||
              name.endsWith(".bmp")
          );
        })
        .map(entry => entry.name!)
        .reverse();

  } catch (err) {
    console.error("Ошибка загрузки attachments:", err);
  }
}

async function selectImage() {
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
            "gif",
            "webp",
            "bmp",
          ],
        },
      ],
    });

    if (!selected || Array.isArray(selected)) {
      return;
    }

    await saveAttachment(selected);

  } catch (err) {
    console.error("Ошибка выбора изображения:", err);
  }
}

async function saveAttachment(sourcePath: string) {
  try {
    const originalName =
        sourcePath.split(/[\\/]/).pop() ?? "image";

    const extension =
        originalName.includes(".")
            ? "." + originalName.split(".").pop()
            : "";

    const fileName =
        `${Date.now()}-${crypto.randomUUID()}${extension}`;

    const data = await readFile(sourcePath);

    await writeFile(
        `attachments/${fileName}`,
        data,
        {
          baseDir: BaseDirectory.AppLocalData,
        }
    );

    await loadAttachments();

    sendAttachment(fileName);

  } catch (err) {
    console.error("Ошибка сохранения изображения:", err);
  }
}

function sendAttachment(fileName: string) {
  emit(
      "send",
      `__IMAGE__:attachments/${fileName}`
  );

  showAttachments.value = false;
}


async function addEmoji(emoji: string) {
  const input = inputRef.value;

  if (!input) {
    draft.value += emoji;
    return;
  }

  const start =
      input.selectionStart ?? draft.value.length;

  const end =
      input.selectionEnd ?? draft.value.length;

  draft.value =
      draft.value.slice(0, start) +
      emoji +
      draft.value.slice(end);

  emj.value = false;

  await nextTick();

  const newCursorPosition =
      start + emoji.length;

  input.focus();

  input.setSelectionRange(
      newCursorPosition,
      newCursorPosition
  );
}

function toggleEmoji() {
  emj.value = !emj.value;
  showAttachments.value = false;
}

function toggleAttachments() {
  showAttachments.value = !showAttachments.value;
  emj.value = false;
}


onMounted(() => {
  initAttachments();
});
</script>


<template>
  <form
      class="composer"
      @submit.prevent="submitMessage"
  >

    <button
        type="button"
        class="file-button"
        title="Вложения"
        @click="toggleAttachments"
    >
      👱🏿‍♂️
    </button>


    <div class="input-wrapper">

      <input
          ref="inputRef"
          v-model="draft"
          type="text"
          placeholder="Сообщение"
          autocomplete="off"
          @focus="emj = false"
      />


      <!-- Emoji -->
      <EmojiPicker
          v-if="emj"
          @select="addEmoji"
      />

      <div
          v-if="showAttachments"
          class="attachments-panel"
      >

        <div class="attachments-header">
          <span>Вложения</span>

          <button
              type="button"
              class="add-attachment"
              @click="selectImage"
          >
            + Добавить
          </button>
        </div>


        <div
            v-if="attachments.length"
            class="attachments-grid"
        >

          <button
              v-for="fileName in attachments"
              :key="fileName"
              type="button"
              class="attachment"
              @click="sendAttachment(fileName)"
          >
            {{ fileName }}
          </button>

        </div>


        <p
            v-else
            class="attachments-empty"
        >
          Сохранённых изображений пока нет
        </p>

      </div>

    </div>

    <button
        type="button"
        class="emoji-button"
        title="Эмодзи"
        @click="toggleEmoji"
    >
      ☺
    </button>


    <button
        type="submit"
        :disabled="!draft.trim()"
    >
      Отправить
    </button>

  </form>
</template>


<style scoped>

.composer {
  position: relative;

  flex: 0 0 auto;

  display: flex;
  gap: 10px;

  padding: 16px 20px;

  border-top: 1px solid #252830;

  background: #17191f;
}



.input-wrapper {
  position: relative;

  flex: 1;
  min-width: 0;
}

.input-wrapper input {
  width: 100%;
  min-width: 0;

  padding: 12px 14px;

  border: 1px solid #343842;
  border-radius: 6px;

  outline: none;

  color: #f2f3f5;
  background: #20232a;

  font: inherit;
}

.input-wrapper input::placeholder {
  color: #777e8b;
}

.input-wrapper input:focus {
  border-color: #4f7fea;
}


.file-button {
  width: 44px;

  flex-shrink: 0;

  padding: 0;

  border: 1px solid #343842;
  border-radius: 8px;

  background: #20232a;
  color: #f2f3f5;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 18px;

  transition:
      background 0.15s ease,
      border-color 0.15s ease;
}

.file-button:hover {
  background: #2a2d35;
  border-color: #4f7fea;
}

.file-button:active {
  transform: scale(0.95);
}


.emoji-button {
  width: 44px;

  flex-shrink: 0;

  padding: 0;

  border: 1px solid #343842;
  border-radius: 8px;

  background: #20232a;
  color: #f2f3f5;

  cursor: pointer;

  font-size: 20px;

  transition:
      background 0.15s ease,
      border-color 0.15s ease;
}

.emoji-button:hover {
  background: #2a2d35;
  border-color: #4f7fea;
}


.composer > button[type="submit"] {
  padding: 0 18px;

  border: none;
  border-radius: 8px;

  cursor: pointer;

  color: white;
  background: #386be0;

  font: inherit;
  font-weight: 600;

  transition: background 0.15s ease;
}

.composer > button[type="submit"]:hover:not(:disabled) {
  background: #4779e8;
}

.composer > button[type="submit"]:disabled {
  cursor: not-allowed;

  opacity: 0.5;
}


.attachments-panel {
  position: absolute;

  left: 0;
  right: 0;

  bottom: calc(100% + 8px);

  padding: 12px;

  border: 1px solid #343842;
  border-radius: 10px;

  background: #17191f;

  box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.35);

  z-index: 20;
}


.attachments-header {
  display: flex;

  align-items: center;
  justify-content: space-between;

  margin-bottom: 10px;

  font-size: 13px;
  font-weight: 600;
}


.add-attachment {
  padding: 6px 10px;

  border: 1px solid #343842;
  border-radius: 6px;

  background: #20232a;
  color: #f2f3f5;

  cursor: pointer;
}

.add-attachment:hover {
  background: #2a2d35;

  border-color: #4f7fea;
}


.attachments-grid {
  display: flex;

  flex-wrap: wrap;

  gap: 8px;

  max-height: 180px;

  overflow-y: auto;
}




.attachment {
  padding: 8px 10px;

  border: 1px solid #343842;
  border-radius: 6px;

  background: #20232a;
  color: #dfe3ea;

  cursor: pointer;

  font-size: 11px;

  transition:
      background 0.15s ease,
      border-color 0.15s ease;
}

.attachment:hover {
  background: #2a2d35;

  border-color: #4f7fea;
}




.attachments-empty {
  margin: 0;

  color: #777e8b;

  font-size: 12px;
}

</style>