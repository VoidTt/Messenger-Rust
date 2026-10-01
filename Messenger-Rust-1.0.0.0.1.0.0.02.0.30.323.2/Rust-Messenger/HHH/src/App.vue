<script setup lang="ts">
import { onMounted, ref } from "vue";

import Database from "@tauri-apps/plugin-sql";

import MessageList from "./components/MessageList.vue";
// import { Message } from "./types/message";
import AppHeader from "./components/AppHeader.vue";
import MessageComposer from "./components/MessageComposer.vue";
import type { Message, User } from "./types/message.ts";

const status = ref("Подключение...");

const messages = ref<Message[]>([]);
const users = ref<User[]>([]);

const currentUserId = ref(0);

let db: Database | null = null;
let initializing = false;

//===========================

const userName1 = "Main";
const userName2 = "A2";
const userName3 = "A3";

async function loadMessages() {
  if (!db) return;

  try {
    const result = await db.select<Message[]>(`
      SELECT
        messages.id,
        messages.author_id,
        users.name AS author,
        messages.body
      FROM messages
      JOIN users ON users.id = messages.author_id
      ORDER BY messages.id ASC
    `);
    messages.value = result;

  } catch (err) {
    console.error("Ошибка загрузки сообщений:", err);
  }
}


//===========================

async function initDatabase() {
  if (initializing || db) return;
  initializing = true;
  status.value = "Подключение...";

  try {
    db = await Database.load("sqlite:messenger.db");
    await loadMessages();
    await initDatabaseSchema();
    await loadUsers();

    console.log("SQLite подключен");
    status.value = "Подключено";
  } catch (err) {
    console.error("Ошибка подключения к БД:", err);
    db = null;
    status.value = "Ошибка подключения к БД";
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
      name TEXT NOT NULL
    )
  `);


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

  try {
    await db.execute(`
      ALTER TABLE messages
      ADD COLUMN author_id INTEGER
    `);
  } catch (err) {
  }


  await db.execute(`
    UPDATE messages
    SET author_id = 0
    WHERE author_id IS NULL
  `);
}

//======================================================================


async function sendMessage(body: string) {
  if (!db) {
    console.warn("БД данных ещё не подключена");
    return;
  }

  try {
    const currentUser = users.value.find(
        user => user.id === currentUserId.value
    );

    if (!currentUser) {
      console.error("Текущий пользователь не найден");
      return;
    }

    await db.execute(
        `
      INSERT INTO messages (author_id, author, body)
      VALUES ($1, $2, $3)
      `,
        [
          currentUser.id,
          currentUser.name,
          body
        ]
    );

    await loadMessages();
  } catch (err) {
    console.error("Ошибка отправки сообщения:", err);
    status.value = "Ошибка отправки сообщения";
  }
}

async function loadUsers() {
  if (!db) return;

  try {
    const result = await db.select<User[]>(
        "SELECT id, name FROM users ORDER BY id ASC"
    );

    users.value = result;
  } catch (err) {
    console.error("Ошибка загрузки пользователей:", err);
  }
}


async function editMessage(id: number, body: string) {
  if (!db) {
    console.warn("БД ещё не подключена");
    return;
  }

  try {
    const result = await db.execute(
        "UPDATE messages SET body = $1 WHERE id = $2 AND author_id = $3",
        [
          body,
          id,
          currentUserId.value
        ]
    );

    if (result.rowsAffected === 0) {
      console.warn("Не твоё сообщение броски");
      return;
    }

    await loadMessages();
  } catch (err) {
    console.error("Ошибка редактирования: ", err);
    status.value = "Ошибка редактирования: ";
  }
}


async function deleteMessage(id: number) {
  if (!db) {
    console.warn("БД ещё не подключена");
    return;
  }

  try {
    const result = await db.execute(
        "DELETE FROM messages WHERE id = $1",
        [id,currentUserId.value]
    );

    if (result.rowsAffected === 0) {
      console.warn("Не твоё сообщение броски");
      return;
    }

    await loadMessages();

  } catch (err) {
    console.error("Ошибка удаления сообщения:", err);
    status.value = "Ошибка удаления сообщения";
  }
}


onMounted(() => {
  initDatabase();
});

</script>

<template>
  <main class="app">

    <AppHeader :status="status"/>

    <div class="test-users">
      <button
          v-for="user in users"
          :key="user.id"
          type="button"
          @click="currentUserId = user.id"
      >
        {{ user.name }} (ID {{ user.id }})
      </button>
    </div>

    <section class="chat">
      <div class="chat-info">
        <h2>Первый чат</h2>
        <p>
          Вы вошли как:
          {{ users.find(user => user.id === currentUserId)?.name }}
        </p>
      </div>

      <MessageList
          :messages="messages"
          :current-user-id="currentUserId"
          @edit="editMessage"
          @delete="deleteMessage"
      />

      <MessageComposer @send="sendMessage"/>
    </section>

  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html) {
  background: #111318;
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  width: 100%;
  height: 100vh;
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

.app {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #111318;
  color: #f2f3f5;
}

.chat {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-info {
  flex-shrink: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #252830;
}

.chat-info h2 {
  margin: 0;
  font-size: 16px;
}

.chat-info p {
  margin: 5px 0 0;
  color: #858c98;
  font-size: 13px;
}
</style>