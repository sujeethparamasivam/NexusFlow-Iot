import { useCallback, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export function useWebSocket(url: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [url]);

  const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  }, []);

  const unsubscribe = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
      return;
    }
    socketRef.current?.off(event);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { subscribe, unsubscribe, emit };
}
