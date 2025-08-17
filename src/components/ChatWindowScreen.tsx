import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { ChatContact } from './ChatListScreen.js';
import wrapAnsi from 'wrap-ansi';
import fs from 'fs';
// --- Backend Integration ---
import apiClient from '../api/apiClient.js';
import { state } from '../state.js';
import { sendMessage, setOnMessageReceived, clearOnMessageReceived } from '../socket/socketClient.js';
import { hybridEncrypt, hybridDecrypt, HybridEncrypted } from '../crypto/crypto.js';

// Simple file logger
const debugLog = (message: string, data?: any) => {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
    fs.appendFileSync('/tmp/chat-debug.log', logEntry);
  } catch (e) {
    // Ignore logging errors
  }
};

// The Message type for data from the API
interface ApiMessage {
  id: string;
  senderId: string;
  content: HybridEncrypted; // History messages are always encrypted objects
  timestamp: string;
}

// Your existing local message type
type Message = {
  text: string;
  isMine: boolean;
};

type Props = {
  contact: ChatContact;
  setView: (view: 'chatList') => void;
};

const ChatWindowScreen = ({ contact, setView }: Props) => {
  const { stdout } = useStdout();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isMultilineMode, setIsMultilineMode] = useState(false);
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Backend Logic Integration ---
  useEffect(() => {
    const initialize = async () => {
      try {
        debugLog('=== INITIALIZING CHAT ===');
        debugLog('Contact ID', contact.id);
        debugLog('State user', state.user);
        debugLog('State token exists', !!state.token);
        debugLog('State keys exist', !!state.keys);

        const keyResponse = await apiClient.get<{ publicKey: string }>(`/users/${contact.id}/publicKey`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        debugLog('Got recipient public key', { success: true });
        setRecipientPublicKey(keyResponse.data.publicKey);

        const historyResponse = await apiClient.get<ApiMessage[]>(`/messages/${contact.id}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });

        debugLog('=== HISTORY RESPONSE ===');
        debugLog('Total messages', historyResponse.data.length);
        if (historyResponse.data.length > 0) {
          debugLog('First message sample', {
            id: historyResponse.data[0].id,
            senderId: historyResponse.data[0].senderId,
            contentType: typeof historyResponse.data[0].content,
            hasRequiredFields: !!(historyResponse.data[0].content &&
              typeof historyResponse.data[0].content === 'object' &&
              'iv' in historyResponse.data[0].content &&
              'encryptedKey' in historyResponse.data[0].content)
          });
        }

        const decryptedHistory = historyResponse.data.reverse().map((msg, index) => {
          try {
            debugLog(`Decrypting message ${index}`, { id: msg.id, senderId: msg.senderId });

            // Handle stringified content (temporary fallback for old data)
            const content = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;

            const decryptedText = hybridDecrypt(content, state.keys!.privateKey);
            debugLog(`Decryption success ${index}`, { text: decryptedText.substring(0, 50) + '...' });

            return {
              text: decryptedText,
              isMine: msg.senderId === state.user?.id
            };
          } catch (e) {
            debugLog(`Decryption error ${index}`, {
              error: (e as Error).message,
              msgId: msg.id,
              contentType: typeof msg.content
            });
            return { text: "Could not decrypt message.", isMine: false };
          }
        });

        debugLog('=== FINAL RESULTS ===');
        debugLog('Decrypted message count', decryptedHistory.length);
        debugLog('Successful decryptions', decryptedHistory.filter(m => m.text !== "Could not decrypt message.").length);

        setMessages(decryptedHistory);
      } catch (err) {
        debugLog('Initialize error', { error: (err as Error).message, stack: (err as Error).stack });
        setError('Could not initialize chat.');
      }
    };

    initialize();
  }, [contact.id]);

  useEffect(() => {
    setOnMessageReceived((incomingMessage: ApiMessage) => {
      if (incomingMessage.senderId === contact.id) {
        try {
          debugLog('=== REAL-TIME MESSAGE ===');
          debugLog('Incoming message', {
            id: incomingMessage.id,
            senderId: incomingMessage.senderId,
            contentType: typeof incomingMessage.content
          });

          const decryptedContent = hybridDecrypt(incomingMessage.content, state.keys!.privateKey);
          debugLog('Real-time decryption success', { text: decryptedContent.substring(0, 50) + '...' });

          setMessages(prev => {
            const newMessages = [...prev, { text: decryptedContent, isMine: false }];
            debugLog('Messages state updated', {
              previousCount: prev.length,
              newCount: newMessages.length
            });
            return newMessages;
          });
        } catch (e) {
          debugLog('Socket decryption error', {
            error: (e as Error).message,
            msgId: incomingMessage.id
          });
        }
      }
    });

    return () => clearOnMessageReceived();
  }, [contact.id]);

  const handleSubmit = () => {
    if (inputValue.trim() && recipientPublicKey && state.keys?.publicKey) {
      debugLog('=== SENDING MESSAGE ===', { text: inputValue.substring(0, 50) + '...' });

      // Encrypt once for the receiver
      const contentForReceiver = hybridEncrypt(inputValue, recipientPublicKey);
      // Encrypt a second time for the sender (using our own public key)
      const contentForSender = hybridEncrypt(inputValue, state.keys.publicKey);

      // Send both encrypted blobs to the server
      sendMessage({
        type: 'message',
        receiverId: contact.id,
        contentForSender,
        contentForReceiver
      });

      setMessages(prev => [...prev, { text: inputValue, isMine: true }]);
      setInputValue('');
      setScrollOffset(0);
      setIsMultilineMode(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      setView('chatList');
    }
    if (key.upArrow && !isMultilineMode) {
      setScrollOffset(prev => prev + 1);
    }
    if (key.downArrow && !isMultilineMode) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.return && !isMultilineMode) {
      handleSubmit();
    }
    if (key.ctrl && input === 'j') {
      const newValue = inputValue + '\n';
      setInputValue(newValue);
      setIsMultilineMode(true);
    }
    if (isMultilineMode) {
      if (key.ctrl && key.return) {
        handleSubmit();
      }
      if (key.upArrow || key.downArrow) {
        return;
      }
    }
  });

  const maxInputHeight = 12;
  const currentInputLines = inputValue.split('\n').length;
  const actualInputHeight = Math.min(currentInputLines, maxInputHeight) + 2;
  const messageListHeight = stdout.rows - 3 - actualInputHeight;

  const allMessageLines: string[] = [];
  messages.forEach(msg => {
    const wrappedText = wrapAnsi(msg.text, Math.floor(stdout.columns * 0.8));
    const lines = wrappedText.split('\n');
    lines.forEach(line => {
      allMessageLines.push(JSON.stringify({ text: line, isMine: msg.isMine }));
    });
  });

  const visibleLines = allMessageLines.slice(
    Math.max(0, allMessageLines.length - messageListHeight - scrollOffset),
    allMessageLines.length - scrollOffset
  );

  const inputLines = inputValue.split('\n');
  const shouldScroll = inputLines.length > maxInputHeight;
  const visibleInputLines = shouldScroll
    ? inputLines.slice(Math.max(0, inputLines.length - maxInputHeight), inputLines.length)
    : inputLines;

  return (
    <Box flexDirection="column" height="100%" width="100%">
      <Box paddingX={1} borderStyle="round" borderColor="black" height={3}>
        <Text>Chatting with: <Text bold color="blue">{contact.username}</Text> (Messages: {messages.length})</Text>
        <Box flexGrow={1} />
        <Text dimColor>
          [Esc] Back | {isMultilineMode ? 'Ctrl+Enter: Send' : 'Enter: Send'} | ↑↓ Scroll Messages
        </Text>
      </Box>

      <Box flexGrow={1} flexDirection="column" paddingX={1} borderStyle="round" overflow="hidden">
        {error && <Text color="red">{error}</Text>}
        {visibleLines.map((line, index) => {
          const msg = JSON.parse(line);
          return (
            <Box key={index} flexDirection="row" width="100%">
              {msg.isMine && <Box flexGrow={1} />}
              <Text color={msg.isMine ? 'white' : 'cyan'}>{msg.text}</Text>
            </Box>
          );
        })}
      </Box>

      <Box borderStyle="round" paddingX={1} borderColor="green" height={actualInputHeight}>
        <TextInput
          value={inputValue}
          onChange={setInputValue}
          placeholder="Type your message...                                                             ←→:cursor | ctrl+j:newline"
        />
      </Box>
    </Box>
  );
};

export default ChatWindowScreen;
