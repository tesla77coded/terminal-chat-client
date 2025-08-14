import WebSocket from 'ws';
import { state } from '../state.js';

let ws: WebSocket | null = null;
let onMessageReceived: ((message: any) => void) | null = null;
let onChatListUpdate: (() => void ) | null = null;

export function connectWebSocket() {
  if (ws || !state.token) return;
  ws = new WebSocket('ws://127.0.0.1:9090'); // Use your correct port

  ws.on('open', () => {
    if (ws) ws.send(JSON.stringify({ type: 'auth', token: state.token }));
  });

  ws.on('message', (data: WebSocket.Data) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'message') {
      if (onMessageReceived) {
        onMessageReceived(message);
      } else {
        const senderId = message.senderId;
        const currentCount = state.unreadCounts.get(senderId) || 0;
        state.unreadCounts.set(senderId, currentCount + 1);

        if(onChatListUpdate){
          onChatListUpdate();
        }

      }
    }
  });

  ws.on('close', () => { ws = null; });
  ws.on('error', () => { ws = null; });
}

// --- NEW: Function to cleanly close the connection ---
export function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

export function sendMessage(payload: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function setOnMessageReceived(handler: (message: any) => void) {
  onMessageReceived = handler;
}

export function clearOnMessageReceived() {
  onMessageReceived = null;
}

export function setOnChatListUpdate(handler: () => void) {
    onChatListUpdate = handler;
}

export function clearOnChatListUpdate() {
    onChatListUpdate = null;
};
