"use client";

import { useEffect, useRef, useState } from "react";
import { WebSocketClient } from "@/lib/websocket/client";

export type WsStatus = "connecting" | "connected" | "disconnected";

interface UseWebSocketOptions {
  url?: string;
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const url = options?.url ?? process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
  const clientRef = useRef<WebSocketClient | null>(null);
  const [status, setStatus] = useState<WsStatus>("disconnected");

  useEffect(() => {
    if (!url) return;

    const client = new WebSocketClient(url);
    clientRef.current = client;
    setStatus("connecting");

    client.connect()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("disconnected"));

    return () => {
      client.disconnect();
      clientRef.current = null;
      setStatus("disconnected");
    };
  }, [url]);

  return { clientRef, status };
}
