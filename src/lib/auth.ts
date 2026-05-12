// Mock Authentication using LocalStorage
export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (callback: (user: any) => void) => {
    const savedUser = localStorage.getItem('akoma_mock_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    auth.currentUser = user;
    callback(user);
    return () => {};
  },
};

export const db = {};
export const googleProvider = {};

export const signOut = async () => {
  localStorage.removeItem('akoma_mock_user');
  window.location.reload();
};

export const signInWithPopup = async () => {
  const mockUser = {
    uid: 'mock-user-123',
    displayName: 'Growth Partner',
    email: 'partner@akoma.systems',
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const signInWithEmailAndPassword = async (a: any, email: string) => {
  const mockUser = {
    uid: 'mock-user-123',
    displayName: email.split('@')[0],
    email: email,
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const createUserWithEmailAndPassword = async (a: any, email: string) => {
  const mockUser = {
    uid: 'mock-user-123',
    displayName: email.split('@')[0],
    email: email,
    emailVerified: true
  };
  localStorage.setItem('akoma_mock_user', JSON.stringify(mockUser));
  window.location.reload();
};

export const sendPasswordResetEmail = async () => {
  return Promise.resolve();
};
