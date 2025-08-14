import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { state } from './state.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import LoginScreen from './components/LoginScreen.js';
import ChatListScreen, { ChatContact } from './components/ChatListScreen.js';
import RegisterScreen from './components/RegistrationScreen.js';
import ChatWindowScreen from './components/ChatWindowScreen.js';
import apiClient from './api/apiClient.js';
import { connectWebSocket } from './socket/socketClient.js';
import { deleteSession } from './sessionsManager.js';


type View = 'welcome' | 'login' | 'register' | 'chatList' | 'chatWindow';

type AppProps = {
  sessionLoaded: boolean;
}

const App = ({ sessionLoaded }: AppProps) => {
  const [currentView, setCurrentView] = useState<View>(sessionLoaded ? 'chatList' : 'welcome');
  const [activeChat, setActiveChat] = useState<ChatContact | null>(null);
  const [isVerifying, setIsVerifying] = useState(sessionLoaded);

  useEffect(() => {
    if (sessionLoaded) {
      const verifyToken = async () => {
        try {
          await apiClient.get('users/me', {
            headers: { Authorization: `Bearer ${state.token}` },
          });
          connectWebSocket();
        } catch (error) {
          deleteSession();
          setCurrentView('welcome');
        } finally {
          setIsVerifying(false);
        }
      };
      verifyToken();
    }
  }, []);

  if (isVerifying) {
    return <Text>Verifying session....</Text>
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen setView={setCurrentView} />

      case 'register':
        return <RegisterScreen setView={setCurrentView} />

      case 'chatList':
        return <ChatListScreen setView={setCurrentView} setActiveChat={setActiveChat} />

      case 'chatWindow':
        if (activeChat) {
          return <ChatWindowScreen contact={activeChat} setView={setCurrentView} />;
        }
        return <Text>Error: No active chat selected.</Text>;

      case 'welcome':
      default:
        return <WelcomeScreen setView={setCurrentView} />
    }
  };

  return (

    <Box flexDirection="column" height="100%">
      <Box width="100%" height={process.stdout.rows}>
        {renderView()}
      </Box>
    </Box>
  );
};

export default App;
