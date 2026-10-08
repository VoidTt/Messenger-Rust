export interface User {
    id: number;
    name: string;
    avatar_path: string | null;
}

export interface Message {
    id: number;
    author: string;
    author_id: number;
    body: string;
    createdAt: string;
}