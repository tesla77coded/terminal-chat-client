import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

type Props = {
  setView: (view: 'login' | 'register') => void;
};

const WelcomeScreen = ({ setView }: Props) => {
  const [focused, setFocused] = useState<'login' | 'register'>('login');

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setFocused('login');
    }

    if (key.downArrow || input === 'j') {
      setFocused('register');
    }

    if (key.return) {
      if (focused === 'login') {
        setView('login');
      } else {
        setView('register');
      }
    }
  });


  return (
    <Box
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
      width='100%'
      height='100%'
    >
      <Box borderStyle='round' paddingX={4} paddingY={1} ><Text> Welcome to Terminal Chat</Text></Box>
      <Box flexDirection="column" alignItems="center" marginTop={1}>
        <Text color={focused === 'login' ? 'green' : 'gray'}>
          {focused === 'login' ? '> ' : '  '}Login
        </Text>
        <Text color={focused === 'register' ? 'green' : 'gray'}>
          {focused === 'register' ? '> ' : '  '}Register
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use Up/Down arrows to navigate, Enter to select/submit, Ctrl-C to exit.</Text>
      </Box>
    </Box >
  );
};

export default WelcomeScreen;
