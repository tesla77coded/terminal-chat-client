import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import apiClient from '../api/apiClient.js';
import { state } from '../state.js';
import { disconnectWebSocket, setOnChatListUpdate, clearOnChatListUpdate } from '../socket/socketClient.js';
import { deleteSession } from '../sessionsManager.js';

export interface ChatContact {
  id: string;
  username: string;
  unreadCount?: number;
  lastMessageTimestamp?: string;
}

type Props = {
  setView: (view: 'welcome' | 'chatWindow') => void;
  setActiveChat: (contact: ChatContact) => void;
};

const ChatListScreen = ({ setView, setActiveChat }: Props) => {
  const { exit } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeComponent, setActiveComponent] = useState<'search' | 'list' | 'logout'>('list');

  const fetchChats = async () => {
    try {
      const response = await apiClient.get<ChatContact[]>('/messages', {
        headers: { Authorization: `Bearer ${state.token}` },
      });

      // Populate unread counts from the initial fetch
      state.unreadCounts.clear();
      response.data.forEach(chat => {
        if (chat.unreadCount && chat.unreadCount > 0) {
          state.unreadCounts.set(chat.id, chat.unreadCount);
        }
      });

      // Sort by the timestamp of the last message, newest first
      const sortedChats = response.data.sort((a, b) =>
        new Date(b.lastMessageTimestamp!).getTime() - new Date(a.lastMessageTimestamp!).getTime()
      );

      setContacts(sortedChats);
    } catch (err) {
      setError('Could not load chats.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats(); // Initial fetch

    setOnChatListUpdate(() => {
      fetchChats();
    });

    return () => {
      clearOnChatListUpdate();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchTerm) {
      fetchChats();
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get<ChatContact[]>(`/users/search?username=${searchTerm}`, {
        headers: { Authorization: `Bearer ${state.token}` }
      });
      setContacts(response.data);
      setSelectedIndex(0);
    } catch (err) {
      setError('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    // ... (input handling remains the same)
    if (key.tab) {
      if (activeComponent === 'search') setActiveComponent('list');
      else if (activeComponent === 'list') setActiveComponent('logout');
      else if (activeComponent === 'logout') setActiveComponent('search');
    }
    if (activeComponent === 'list') {
      if (key.upArrow) setSelectedIndex(prev => Math.max(0, prev - 1));
      if (key.downArrow) setSelectedIndex(prev => Math.min(contacts.length - 1, prev + 1));
      if (key.return && contacts[selectedIndex]) {
        setActiveChat(contacts[selectedIndex]);
        setView('chatWindow');
      }
    }
    if (activeComponent === 'logout' && key.return) {
      disconnectWebSocket();
      deleteSession();
      setView('welcome');
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      <Box borderStyle="round" paddingX={1} borderColor={activeComponent === 'search' ? 'cyan' : 'white'}>
        <Text color={activeComponent === 'search' ? 'cyan' : 'white'}>Search: </Text>
        <TextInput
          value={searchTerm}
          onChange={setSearchTerm}
          onSubmit={handleSearch}
          focus={activeComponent === 'search'}
          placeholder="Search for contacts/friends..."
        />
      </Box>

      <Box borderStyle="round" marginTop={1} flexGrow={1} flexDirection="column" borderColor={activeComponent === 'list' ? 'green' : 'white'}>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text color="red">{error}</Text>
        ) : (
          contacts.map((contact, index) => {
            const unreadCount = state.unreadCounts.get(contact.id);
            const isSelected = selectedIndex === index && activeComponent === 'list';
            const displayName = unreadCount && unreadCount > 0
              ? `${contact.username} (${unreadCount})`
              : contact.username;

            return (
              <Text key={contact.id} color={isSelected ? 'green' : 'white'} bold={!!unreadCount}>
                {isSelected ? '> ' : '  '}
                {displayName}
              </Text>
            );
          })
        )}
      </Box>

      <Box justifyContent="center" marginTop={1}>
        <Text color={activeComponent === 'logout' ? 'red' : 'gray'} bold={activeComponent === 'logout'}>
          Logout
        </Text>
      </Box>
      <Box justifyContent="center" marginTop={1}>
        <Text dimColor>Use Tab to cycle focus, Up/Down to navigate list, Enter to select.</Text>
      </Box>
    </Box>
  );
};

export default ChatListScreen;
