import React from 'react';
import { render } from 'ink';
import App from './App.js';
import { initializeKeys } from './crypto/crypto.js';
import { state } from './state.js';
import { loadSession } from './sessionsManager.js';

state.keys = initializeKeys();

const sessionLoaded = loadSession();

render(React.createElement(App));
