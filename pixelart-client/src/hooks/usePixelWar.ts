import * as signalR from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";

const WAR_HUB_URL = import.meta.env.VITE_WAR_HUB_URL as string;

export type WarTeam = "Red" | "Blue" | "None";

export interface WarPixel {
  x: number;
  y: number;
  team: WarTeam;
  paintedBy?: string;
}

export interface WarState {
  isRunning: boolean;
  secondsLeft: number;
  redCount: number;
  blueCount: number;
  totalPixels: number;
  winner?: WarTeam | null;
  players: Record<string, WarTeam>;
}

const BOARD_SIZE = Number(import.meta.env.VITE_BOARD_SIZE) || 32;

function createEmptyWarBoard(): WarPixel[][] {
  return Array.from({ length: BOARD_SIZE }, (_, y) =>
    Array.from({ length: BOARD_SIZE }, (_, x) => ({ x, y, team: "None" as WarTeam }))
  );
}

export function usePixelWar(username: string) {
  const [board, setBoard] = useState<WarPixel[][]>(createEmptyWarBoard);
  const [state, setState] = useState<WarState>({
    isRunning: false,
    secondsLeft: 0,
    redCount: 0,
    blueCount: 0,
    totalPixels: BOARD_SIZE * BOARD_SIZE,
    winner: null,
    players: {},
  });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!username) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(WAR_HUB_URL)
      .withAutomaticReconnect()
      .build();

    connection.on("WarStateUpdated", (s: WarState) => setState(s));

    connection.on("WarBoardLoaded", (incoming: WarPixel[][]) => setBoard(incoming));

    connection.on("WarStarted", (s: WarState, newBoard: WarPixel[][]) => {
      setState(s);
      setBoard(newBoard);
    });

    connection.on("WarPixelUpdated", (pixel: WarPixel) => {
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        next[pixel.y][pixel.x] = pixel;
        return next;
      });
    });

    connection.on("WarScoreUpdated", (red: number, blue: number, total: number) => {
      setState((prev) => ({ ...prev, redCount: red, blueCount: blue, totalPixels: total }));
    });

    connection.on("WarTick", (secondsLeft: number, red: number, blue: number) => {
      setState((prev) => ({ ...prev, secondsLeft, redCount: red, blueCount: blue }));
    });

    connection.on("WarEnded", (s: WarState) => setState(s));

    connection.on("WarReset", () => {
      setBoard(createEmptyWarBoard());
    });

    connection.on("WarError", (msg: string) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    connection
      .start()
      .then(() => {
        setConnected(true);
        connection.invoke("RegisterWarUser", username).catch(console.error);
      })
      .catch(console.error);

    connRef.current = connection;
    return () => { connection.stop(); };
  }, [username]);

  const joinTeam = useCallback((team: WarTeam) => {
    connRef.current?.invoke("JoinTeam", username, team).catch(console.error);
  }, [username]);

  const startWar = useCallback((durationSeconds = 180) => {
    connRef.current?.invoke("StartWar", durationSeconds).catch(console.error);
  }, []);

  const paintPixel = useCallback((x: number, y: number) => {
    connRef.current?.invoke("WarPaintPixel", username, x, y).catch(console.error);
  }, [username]);

  const resetWar = useCallback(() => {
    connRef.current?.invoke("ResetWar").catch(console.error);
  }, []);

  const myTeam: WarTeam = state.players[username] ?? "None";

  return { board, state, connected, myTeam, error, joinTeam, startWar, paintPixel, resetWar };
}
