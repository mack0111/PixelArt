import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Pixel {
  x: number;
  y: number;
  color: string;
  paintedBy?: string;
  paintedAt?: string;
}

export interface CursorInfo {
  username: string;
  x: number;
  y: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  sentAt: string;
}

const BOARD_SIZE = Number(import.meta.env.VITE_BOARD_SIZE) || 32;
const MAX_COLOR_HISTORY = 5;
const HUB_URL = import.meta.env.VITE_HUB_URL as string;

function createEmptyBoard(): Pixel[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({ x, y, color: "#FFFFFF" }))
  );
}

export function usePixelBoard(username: string) {
  const [board, setBoard] = useState<Pixel[][]>(createEmptyBoard);
  const [connected, setConnected] = useState(false);
  const [colorHistory, setColorHistory] = useState<string[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorInfo>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.on("BoardLoaded", (incomingBoard: Pixel[][]) => {
      setBoard(incomingBoard);
    });

    connection.on("OnlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    connection.on("CursorMoved", (cursor: CursorInfo) => {
      setCursors((prev) => ({ ...prev, [cursor.username]: cursor }));
    });

    connection.on("UserLeft", (name: string) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    });

    connection.on("ChatHistory", (history: ChatMessage[]) => {
      setMessages(history);
    });

    connection.on("MessageReceived", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    connection.on("PixelUpdated", (pixel: Pixel) => {
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        next[pixel.y][pixel.x] = pixel;
        return next;
      });
    });

    connection
      .start()
      .then(() => {
        setConnected(true);
        connection.invoke("RegisterUser", username).catch(console.error);
      })
      .catch(console.error);

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const paintPixel = useCallback(
    (x: number, y: number, color: string) => {
      connectionRef.current
        ?.invoke("PaintPixel", x, y, color, username)
        .catch(console.error);

      // เก็บ color history (ไม่ซ้ำ, สูงสุด 5 สี)
      setColorHistory((prev) => {
        const filtered = prev.filter((c) => c !== color);
        return [color, ...filtered].slice(0, MAX_COLOR_HISTORY);
      });
    },
    [username]
  );

  const undoLastPixel = useCallback(() => {
    connectionRef.current?.invoke("UndoLastPixel").catch(console.error);
  }, []);

  const moveCursor = useCallback((x: number, y: number) => {
    connectionRef.current?.invoke("MoveCursor", x, y).catch(console.error);
  }, []);

  const sendMessage = useCallback((text: string) => {
    connectionRef.current?.invoke("SendMessage", text).catch(console.error);
  }, []);

  return { board, connected, paintPixel, undoLastPixel, colorHistory, onlineUsers, cursors, moveCursor, messages, sendMessage };
}
