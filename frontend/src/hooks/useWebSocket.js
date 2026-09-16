import { useCallback, useEffect, useRef } from 'react';
import io from 'socket.io-client';
export function useWebSocket(url) {
    const socketRef = useRef(null);
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
    const subscribe = useCallback((event, callback) => {
        socketRef.current?.on(event, callback);
    }, []);
    const unsubscribe = useCallback((event, callback) => {
        if (callback) {
            socketRef.current?.off(event, callback);
            return;
        }
        socketRef.current?.off(event);
    }, []);
    const emit = useCallback((event, data) => {
        socketRef.current?.emit(event, data);
    }, []);
    return { subscribe, unsubscribe, emit };
}
