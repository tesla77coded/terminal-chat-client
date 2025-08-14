import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import apiClient from '../api/apiClient.js';
import { state } from '../state.js';
import { connectWebSocket } from '../socket/socketClient.js';
import { AxiosError } from 'axios';
import { stripPem } from '../crypto/crypto.js';

type Props = {
  setView: (view: 'welcome' | 'chatList') => void;
};

const LoginScreen = ({ setView }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'password' | 'submit'>('username');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Username and password cannot be empty.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/users/login', { username, password });
      state.token = response.data.token;
      state.user = { id: response.data.id, username: response.data.username, email: response.data.email };

      if (state.keys?.publicKey) {
        const strippedPublicKey = stripPem(state.keys.publicKey);
        apiClient.post('/users/publicKey',
          { publicKey: strippedPublicKey },
          { headers: { Authorization: `Bearer ${state.token}` } }
        ).catch(() => { }); // Fire-and-forget
      }

      connectWebSocket();
      setView('chatList');

    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        setError((axiosError.response.data as any).message || 'Invalid credentials.');
      } else {
        setError('Could not connect to the server.');
      }
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (isLoading) return; // Ignore input while loading

    if (key.upArrow || key.tab) {
      if (activeField === 'password') setActiveField('username');
      if (activeField === 'submit') setActiveField('password');
    }
    if (key.downArrow || key.tab) {
      if (activeField === 'username') setActiveField('password');
      if (activeField === 'password') setActiveField('submit');
    }
    if (key.tab) {
      if (activeField === 'submit') setActiveField('username');
    }
    if (key.return) { // Enter key
      if (activeField === 'username') setActiveField('password');
      if (activeField === 'password') setActiveField('submit');
      if (activeField === 'submit') handleLogin();
    }
    if (key.escape) {
      setView('welcome');
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      <Box
        borderStyle="round"
        paddingX={4}
        paddingY={1}
        flexDirection="column"
        width={50}
        alignItems="flex-start"
      >
        <Box width="100%" justifyContent="center">
          <Text bold>Login</Text>
        </Box>

        <Box marginTop={1}>
          <Box width={11}>
            <Text color={activeField === 'username' ? 'cyan' : 'white'}>Username: </Text>
          </Box>
          <TextInput
            value={username}
            onChange={setUsername}
            onSubmit={() => setActiveField('password')}
            focus={activeField === 'username'}
          />
        </Box>

        <Box>
          <Box width={11}>
            <Text color={activeField === 'password' ? 'cyan' : 'white'}>Password: </Text>
          </Box>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handleLogin}
            focus={activeField === 'password'}
            mask="*"
          />
        </Box>

        <Box marginTop={1} width="100%" justifyContent="center">
          <Text
            color={activeField === 'submit' ? 'green' : 'gray'}
            bold={activeField === 'submit'}
          >
            {isLoading ? 'Logging in...' : 'Submit'}
          </Text>
        </Box>

        {error && (
          <Box marginTop={1} width="100%" justifyContent="center">
            <Text color="red">{error}</Text>
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use Up/Down arrows to navigate, Enter to select/submit, Esc to go back.</Text>
      </Box>
    </Box>
  );
};

export default LoginScreen;
