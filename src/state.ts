interface User {
  id: string;
  username: string;
  email: string;
}

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface Appstate {
  token: string | null;
  user: User | null;
  keys: KeyPair | null;
  unreadCounts: Map<string, number>;
}

export const state: Appstate = {
  token: null,
  user: null,
  keys: null,
  unreadCounts: new Map(),
};
