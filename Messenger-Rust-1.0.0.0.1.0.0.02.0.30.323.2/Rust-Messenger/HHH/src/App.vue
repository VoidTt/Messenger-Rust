<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import Database from "@tauri-apps/plugin-sql";

import {
  BaseDirectory,
  mkdir,
  readFile,
  writeFile,
} from "@tauri-apps/plugin-fs";

import MessageList from "./components/MessageList.vue";
// import { Message } from "./types/message";
import AppHeader from "./components/AppHeader.vue";
import MessageComposer from "./components/MessageComposer.vue";
import ProfileModal from "./components/ProfileModal.vue";
import SettingsModal from "./components/SettingsModal.vue";
import ChatSidebar from "./components/ChatSidebar.vue";
import CreateChatModal from "./components/CreateChatModal.vue";

import type { Message, User, Chat } from "./types/message.ts";

const status = ref("Подключение...");

const messages = ref<Message[]>([]);
const users = ref<User[]>([]);

const showCreateChat = ref(false);

const currentUserId = ref(0);

const chats = ref<Chat[]>([]);
const currentChatId = ref<number | null>(null);

type Theme = "dark" | "light";

const theme = ref<Theme>("dark");

const showProfile = ref(false);
const showSettings = ref(false);

const currentChat = computed(() => {
  return chats.value.find(
      chat => chat.id === currentChatId.value
  );
});

let db: Database | null = null;
let initializing = false;

//===========================

const userName1 = "Main";
const userName2 = "A2";
const userName3 = "A3";

async function loadMessages() {
  if (!db) return;

  if (currentChatId.value === null) {
    messages.value = [];
    return;
  }

  try {
    const result = await db.select<Message[]>(
        `
          SELECT
            message.id,
            message.chat_id,
            message.author_id,
            users.name AS author,
            message.body
          FROM message
                 JOIN users
                      ON users.id = message.author_id
          WHERE message.chat_id = $1
          ORDER BY message.id ASC
        `,
        [currentChatId.value]
    );

    messages.value = result;

  } catch (err) {
    console.error(
        "Ошибка загрузки сообщений:",
        err
    );
  }
}

async function selectChat(id: number) {
  currentChatId.value = id;
  await loadMessages();
}
async function createChat(
    name: string,
    userIds: number[]
) {
  if (!db) return;

  try {
    const result = await db.execute(
        `
      INSERT INTO chats (
        name,
        created_by
      )
      VALUES ($1, $2)
      `,
        [
          name,
          currentUserId.value
        ]
    );

    const chatId = result.lastInsertId;

    if (!chatId) {
      throw new Error(
          "Не удалось получить ID нового чата"
      );
    }

    for (const userId of userIds) {
      await db.execute(
          `
        INSERT OR IGNORE INTO chat_members (
          chat_id,
          user_id
        )
        VALUES ($1, $2)
        `,
          [
            chatId,
            userId
          ]
      );
    }

    showCreateChat.value = false;

    await loadChats();

    currentChatId.value = chatId;

    await loadMessages();

  } catch (err) {
    console.error(
        "Ошибка создания чата:",
        err
    );
  }
}
async function loadChats() {
  if (!db) return;

  try {
    const result = await db.select<Chat[]>(
        `
      SELECT
        chats.id,
        chats.name,
        chats.created_by
      FROM chats
      JOIN chat_members
        ON chat_members.chat_id = chats.id
      WHERE chat_members.user_id = $1
      ORDER BY chats.id DESC
      `,
        [currentUserId.value]
    );

    chats.value = result;

    if (
        currentChatId.value === null ||
        !chats.value.some(
            chat => chat.id === currentChatId.value
        )
    ) {
      currentChatId.value =
          chats.value[0]?.id ?? null;
    }

  } catch (err) {
    console.error(
        "Ошибка загрузки чатов:",
        err
    );
  }
}
//===========================

async function initDatabase() {
  if (initializing || db) return;
  initializing = true;
  status.value = "Подключение...";

  try {
    db = await Database.load("sqlite:messenge.db");

    await initDatabaseSchema();
    await loadUsers();
    await loadChats();
    await loadMessages();

    await loadTheme();

    console.log("SQLite подключен");
    status.value = "Подключено";
  } catch (err) {
  console.error("ОШИБКА DATABASE:", err);
  console.error("Полная ошибка:", JSON.stringify(err, null, 2));

  status.value = "Ошибка базы данных";
} finally {
    initializing = false;
  }
}


//===================================Таблица Пользователей===================================



async function initDatabaseSchema() {
  if (!db) return;


  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    avatar_path TEXT
    )
  `);
  try {
    await db.execute(`
    ALTER TABLE users
    ADD COLUMN avatar_path TEXT
  `);
  } catch {
  }

  await db.execute(
      "INSERT OR IGNORE INTO users (id, name) VALUES ($1, $2)",
      [0, userName1]
  );

  await db.execute(
      "INSERT OR IGNORE INTO users (id, name) VALUES ($1, $2)",
      [1, userName2]
  );

  await db.execute(
      "INSERT OR IGNORE INTO users (id, name) VALUES ($1, $2)",
      [2, userName3]
  );


  await db.execute(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);
  await db.execute(`
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by INTEGER NOT NULL
  )
`);

  await db.execute(`
  CREATE TABLE IF NOT EXISTS chat_members (
    chat_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (chat_id, user_id)
  )
`);

  await db.execute(`
  INSERT OR IGNORE INTO chats (
    id,
    name,
    created_by
  )
  VALUES (1, 'Чат 1', 0)
`);
  await db.execute(`
  INSERT OR IGNORE INTO chat_members (
    chat_id,
    user_id
  )
  VALUES (1, 0)
`);

  await db.execute(`
  INSERT OR IGNORE INTO chat_members (
    chat_id,
    user_id
  )
  VALUES (1, 1)
`);

  await db.execute(`
  INSERT OR IGNORE INTO chat_members (
    chat_id,
    user_id
  )
  VALUES (1, 2)
`);

  await db.execute(
      `
  INSERT OR IGNORE INTO app_settings (key, value)
  VALUES ($1, $2)
  `,
      ["theme", "dark"]
  );

// =========================
// MESSAGES
// =========================

  await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER,
    author TEXT,
    body TEXT NOT NULL
  )
`);

  try {
    await db.execute(`
      ALTER TABLE messages
        ADD COLUMN author_id INTEGER
    `);
  } catch {
    // author_id уже существует
  }
  try {
    await db.execute(`
    ALTER TABLE message
    ADD COLUMN chat_id INTEGER
  `);
  } catch {
    // chat_id уже существует
  }

  await db.execute(`
    UPDATE messages
    SET author_id = 0
    WHERE author_id IS NULL
  `);
}

//======================================================================

async function updateUserProfile(
    userId: number,
    name: string,
    avatarPath: string | null
) {
  if (!db) return;

  try {
    await db.execute(
        `
      UPDATE users
      SET name = $1,
          avatar_path = $2
      WHERE id = $3
      `,
        [name, avatarPath, userId]
    );

    await loadUsers();
    await loadMessages();

    status.value = "Профиль сохранён";
  } catch (err) {
    console.error("Ошибка сохранения профиля:", err);
    status.value = "Ошибка сохранения профиля";
  }
}

async function handleProfileSave(
    name: string,
    avatarSourcePath: string | null
) {
  try {
    const currentUser = users.value.find(
        user => user.id === currentUserId.value
    );

    if (!currentUser) {
      return;
    }

    let avatarPath = currentUser.avatar_path;

    if (avatarSourcePath) {
      avatarPath = await saveAvatar(
          avatarSourcePath,
          currentUserId.value
      );
    }

    await updateUserProfile(
        currentUserId.value,
        name,
        avatarPath
    );

    showProfile.value = false;

  } catch (err) {
    console.error("Ошибка сохранения профиля:", err);
  }
}

async function saveAvatar(
    sourcePath: string,
    userId: number
): Promise<string> {
  await mkdir("avatars", {
    baseDir: BaseDirectory.AppLocalData,
    recursive: true,
  });

  const originalName =
      sourcePath.split(/[\\/]/).pop() ?? "avatar";

  const extension =
      originalName.includes(".")
          ? "." + originalName.split(".").pop()
          : ".png";

  const fileName =
      `${userId}-${Date.now()}${extension}`;

  const data = await readFile(sourcePath);

  await writeFile(
      `avatars/${fileName}`,
      data,
      {
        baseDir: BaseDirectory.AppLocalData,
      }
  );

  return `avatars/${fileName}`;
}


async function sendMessage(body: string) {
  if (!db) return;

  if (currentChatId.value === null) {
    console.warn("Чат не выбран");
    return;
  }

  try {
    const currentUser = users.value.find(
        user => user.id === currentUserId.value
    );

    if (!currentUser) {
      console.error(
          "Текущий пользователь не найден"
      );
      return;
    }

    await db.execute(
        `
          INSERT INTO message (
            chat_id,
            author_id,
            author,
            body
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          currentChatId.value,
          currentUser.id,
          currentUser.name,
          body
        ]
    );

    await loadMessages();

  } catch (err) {
    console.error(
        "Ошибка отправки сообщения:",
        err
    );
  }
}

async function switchUser(id: number) {
  currentUserId.value = id;

  currentChatId.value = null;

  await loadChats();
  await loadMessages();
}

async function loadUsers() {
  if (!db) return;

  try {
    const result = await db.select<User[]>(
        `
      SELECT
        id,
        name,
        avatar_path
      FROM users
      ORDER BY id ASC
      `
    );

    users.value = result;
  } catch (err) {
    console.error("Ошибка загрузки пользователей:", err);
  }
}

async function loadTheme() {
  if (!db) return;

  try {
    const result = await db.select<{ value: string }[]>(
        `
      SELECT value
      FROM app_settings
      WHERE key = 'theme'
      `
    );

    const savedTheme = result[0]?.value;

    if (
        savedTheme === "dark" ||
        savedTheme === "light"
    ) {
      theme.value = savedTheme;
    }

    applyTheme();
  } catch (err) {
    console.error("Ошибка загрузки темы:", err);
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = theme.value;
}


async function changeTheme(newTheme: Theme) {
  if (!db) return;

  theme.value = newTheme;

  try {
    await db.execute(
        `
      INSERT INTO app_settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT(key)
      DO UPDATE SET value = excluded.value
      `,
        [
          "theme",
          newTheme
        ]
    );

    applyTheme();
  } catch (err) {
    console.error("Ошибка сохранения темы:", err);
  }
}



async function editMessage(
    id: number,
    body: string
) {
  if (!db || currentChatId.value === null) {
    return;
  }

  try {
    const result = await db.execute(
        `
      UPDATE message
      SET body = $1
      WHERE id = $2
        AND chat_id = $3
        AND author_id = $4
      `,
        [
          body,
          id,
          currentChatId.value,
          currentUserId.value
        ]
    );

    if (result.rowsAffected === 0) {
      console.warn(
          "Нельзя редактировать это сообщение"
      );
      return;
    }

    await loadMessages();

  } catch (err) {
    console.error(
        "Ошибка редактирования:",
        err
    );
  }
}


async function deleteMessage(id: number) {
  if (!db || currentChatId.value === null) {
    return;
  }

  try {
    const result = await db.execute(
        `
          DELETE FROM message
          WHERE id = $1
            AND chat_id = $2
            AND author_id = $3
        `,
        [
          id,
          currentChatId.value,
          currentUserId.value
        ]
    );

    if (result.rowsAffected === 0) {
      console.warn(
          "Нельзя удалить это сообщение"
      );
      return;
    }

    await loadMessages();

  } catch (err) {
    console.error(
        "Ошибка удаления сообщения:",
        err
    );
  }
}


onMounted(() => {
  initDatabase();
});

</script>

<template>
  <main class="app">

    <AppHeader
        :status="status"
        :users="users"
        :current-user-id="currentUserId"
        @update:current-user-id="switchUser"
        @settings="showSettings = true"
        @profile="showProfile = true"
    />



    <section class="workspace">

      <section class="chat">

        <div class="chat-info">
          <h2>
            {{ currentChat?.name ?? "Выберите чат" }}
          </h2>

          <p>
            Вы вошли как:
            {{ users.find(
              user => user.id === currentUserId
          )?.name }}
          </p>
        </div>

        <MessageList
            :messages="messages"
            :current-user-id="currentUserId"
            @edit="editMessage"
            @delete="deleteMessage"
        />

        <MessageComposer
            @send="sendMessage"
        />

      </section>

      <CreateChatModal
          v-if="showCreateChat"
          :users="users"
          :current-user-id="currentUserId"
          @close="showCreateChat = false"
          @create="createChat"
      />
      <ChatSidebar
          :chats="chats"
          :users="users"
          :current-chat-id="currentChatId"
          @select="selectChat"
          @create="showCreateChat = true"
      />
      <ProfileModal
          v-if="showProfile"
          :user="users.find(user => user.id === currentUserId)!"
          @close="showProfile = false"
          @save="handleProfileSave"
      />

      <SettingsModal
          v-if="showSettings"
          :theme="theme"
          @close="showSettings = false"
          @change-theme="changeTheme"
      />

    </section>

  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(:root) {
  --app-bg: #111318;
  --panel: #17191f;
  --input: #20232a;
  --border: #343842;
  --text: #f2f3f5;
  --muted: #858c98;
  --primary: #386be0;

  color-scheme: dark;
}

:global(:root[data-theme="light"]) {
  --app-bg: #f4f5f7;
  --panel: #ffffff;
  --input: #eef0f3;
  --border: #d5d8de;
  --text: #20232a;
  --muted: #6e7480;
  --primary: #386be0;

  color-scheme: light;
}

:global(html) {
  background: var(--app-bg);
}

:global(body) {
  margin: 0;
  width: 100%;
  height: 100vh;
  background: var(--app-bg);
  color: var(--text);
  min-width: 320px;
  overflow: hidden;
  font-family:
      Inter,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
}

:global(#app) {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
.workspace {
  flex: 1;
  min-height: 0;
  min-width: 0;

  display: flex;
  flex-direction: row;

  overflow: hidden;
}
.app {
  height: 100vh;
  width: 100%;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background: var(--app-bg);
  color: var(--text);
}

.chat {
  flex: 1;
  min-width: 0;
  min-height: 0;

  display: flex;
  flex-direction: column;

  overflow: hidden;
}

.chat-info {
  flex-shrink: 0;

  padding: 20px 24px;

  border-bottom: 1px solid var(--border);
}

.chat-info h2 {
  margin: 0;
  font-size: 16px;
}

.chat-info p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 13px;
}
</style>