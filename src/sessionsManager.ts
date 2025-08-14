import fs from 'fs';
import path from 'path';
import os from 'os';
import { state } from './state.js';

// Define the path for the session file in our app's hidden directory
const keyDirectory = path.join(os.homedir(), '.terminal-chat');
const sessionPath = path.join(keyDirectory, 'session.json');

interface SessionData {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

/**
 * Saves the current session (token and user) to a local file.
 */
export function saveSession() {
  if (state.token && state.user) {
    // Ensure the directory exists
    if (!fs.existsSync(keyDirectory)) {
      fs.mkdirSync(keyDirectory);
    }
    const sessionData: SessionData = {
      token: state.token,
      user: state.user,
    };
    fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2));
  }
}

/**
 * Loads a session from the local file into the global state.
 * @returns {boolean} - True if a session was successfully loaded, false otherwise.
 */
export function loadSession(): boolean {
  if (fs.existsSync(sessionPath)) {
    try {
      const fileContent = fs.readFileSync(sessionPath, 'utf-8');
      const sessionData: SessionData = JSON.parse(fileContent);
      if (sessionData.token && sessionData.user) {
        state.token = sessionData.token;
        state.user = sessionData.user;
        return true;
      }
    } catch (error) {
      // If file is corrupted or invalid, delete it
      deleteSession();
      return false;
    }
  }
  return false;
}

/**
 * Deletes the session file to log the user out.
 */
export function deleteSession() {
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
}
