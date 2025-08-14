import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import apiClient from '../api/apiClient.js';
import { AxiosError } from 'axios';

type Props = {
  setView: (view: 'welcome' | 'login') => void;
};

const RegisterScreen = ({ setView }: Props) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeField, setActiveField] = useState<'username' | 'email' | 'password' | 'submit'>('username');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.post('/users/register', { username, email, password });
      // On success, navigate to the login screen
      setView('login');
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response) {
        setError((axiosError.response.data as any).message || 'Registration failed.');
      } else {
        setError('Could not connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- THIS HOOK IS CORRECTED ---
  useInput((input, key) => {
    if (isLoading) return;

    // Handle Tab and Shift+Tab for cycling focus
    if (key.tab) {
      if (key.shift) { // Shift+Tab (move backwards)
        if (activeField === 'submit') setActiveField('password');
        else if (activeField === 'password') setActiveField('email');
        else if (activeField === 'email') setActiveField('username');
      } else { // Tab (move forwards)
        if (activeField === 'username') setActiveField('email');
        else if (activeField === 'email') setActiveField('password');
        else if (activeField === 'password') setActiveField('submit');
        else if (activeField === 'submit') setActiveField('username');
      }
      return; // Stop processing after handling tab
    }

    // Handle Up/Down arrows
    if (key.upArrow) {
      if (activeField === 'email') setActiveField('username');
      else if (activeField === 'password') setActiveField('email');
      else if (activeField === 'submit') setActiveField('password');
    }
    if (key.downArrow) {
      if (activeField === 'username') setActiveField('email');
      else if (activeField === 'email') setActiveField('password');
      else if (activeField === 'password') setActiveField('submit');
    }

    // Handle Enter/Escape
    if (key.return) { // Enter key
      if (activeField === 'username') setActiveField('email');
      else if (activeField === 'email') setActiveField('password');
      else if (activeField === 'password') setActiveField('submit');
      else if (activeField === 'submit') handleRegister();
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
          <Text bold>Register New Account</Text>
        </Box>

        <Box marginTop={1}>
          <Box width={11}>
            <Text color={activeField === 'username' ? 'cyan' : 'white'}>Username: </Text>
          </Box>
          <TextInput
            value={username}
            onChange={setUsername}
            onSubmit={() => setActiveField('email')}
            focus={activeField === 'username'}
          />
        </Box>

        <Box>
          <Box width={11}>
            <Text color={activeField === 'email' ? 'cyan' : 'white'}>Email: </Text>
          </Box>
          <TextInput
            value={email}
            onChange={setEmail}
            onSubmit={() => setActiveField('password')}
            focus={activeField === 'email'}
          />
        </Box>

        <Box>
          <Box width={11}>
            <Text color={activeField === 'password' ? 'cyan' : 'white'}>Password: </Text>
          </Box>
          <TextInput
            value={password}
            onChange={setPassword}
            onSubmit={handleRegister}
            focus={activeField === 'password'}
            mask="*"
          />
        </Box>

        <Box marginTop={1} width="100%" justifyContent="center">
          <Text
            color={activeField === 'submit' ? 'green' : 'gray'}
            bold={activeField === 'submit'}
          >
            {isLoading ? 'Registering...' : 'Submit'}
          </Text>
        </Box>

        {error && (
          <Box marginTop={1} width="100%" justifyContent="center">
            <Text color="red">{error}</Text>
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>⚠️ Account recovery is not possible. Store your username and password securely.</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use Up/Down/Tab to navigate, Enter to submit, Esc to go back.</Text>
      </Box>
    </Box>
  );
};

export default RegisterScreen;
