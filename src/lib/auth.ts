export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
};

// Mock Authentication using LocalStorage
export const auth = {
  currentUser: null as User | null,
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    const savedUser = localStorage.getItem('akoma_mock_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    auth.currentUser = user;
    callback(user);
    return () => {};
  },
};

export const db = {};
export const googleProvider = {};

export const collection = (db: any, path: string) => path;
export const doc = (db: any, path: string, id: string) => `${path}/${id}`;

export const signOut = async () => {
  localStorage.removeItem('akoma_mock_user');
  window.location.reload();
};

export const signInWithPopup = async (authObj: any, provider: any) => {
  const mockUser: User = {
    uid: 'mock-user-123',
    displayName: 'Growth Partner',
    email: 'partner@akoma.systems',
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, password?: string) => {
  const mockUser: User = {
    uid: 'mock-user-123',
    displayName: email.split('@')[0],
    email: email,
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, password?: string) => {
  const mockUser: User = {
    uid: 'mock-user-123',
    displayName: email.split('@')[0],
    email: email,
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const sendPasswordResetEmail = async (authObj: any, email: string) => {
  return Promise.resolve();
};
