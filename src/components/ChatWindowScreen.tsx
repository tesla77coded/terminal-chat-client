import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { ChatContact } from './ChatListScreen.js';
import wrapAnsi from 'wrap-ansi';

// --- Backend Integration ---
import apiClient from '../api/apiClient.js';
import { state } from '../state.js';
import { sendMessage, setOnMessageReceived, clearOnMessageReceived } from '../socket/socketClient.js';
import { hybridEncrypt, hybridDecrypt, HybridEncrypted } from '../crypto/crypto.js';

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
        const keyResponse = await apiClient.get<{ publicKey: string }>(`/users/${contact.id}/publicKey`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        setRecipientPublicKey(keyResponse.data.publicKey);

        const historyResponse = await apiClient.get<ApiMessage[]>(`/messages/${contact.id}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });

        const decryptedHistory = historyResponse.data.reverse().map(msg => {
          try {
            return {
              text: hybridDecrypt(msg.content, state.keys!.privateKey),
              isMine: msg.senderId === state.user?.id
            };
          } catch (e) {
            return { text: "Could not decrypt message.", isMine: false };
          }
        });
        setMessages(decryptedHistory);

      } catch (err) {
        setError('Could not initialize chat.');
      }
    };
    initialize();
  }, [contact.id]);

  useEffect(() => {
    setOnMessageReceived((incomingMessage: ApiMessage) => {
      if (incomingMessage.senderId === contact.id) {
        try {
          const decryptedContent = hybridDecrypt(incomingMessage.content, state.keys!.privateKey);
          setMessages(prev => [...prev, { text: decryptedContent, isMine: false }]);
        } catch (e) { /* ignore */ }
      }
    });
    return () => clearOnMessageReceived();
  }, [contact.id]);
  // --------------------------------

  const handleSubmit = () => {
    if (inputValue.trim() && recipientPublicKey) {
      const encryptedPackage = hybridEncrypt(inputValue, recipientPublicKey);
      sendMessage({ type: 'message', receiverId: contact.id, content: encryptedPackage });

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
        <Text>Chatting with: <Text bold color="blue">{contact.username}</Text></Text>
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
