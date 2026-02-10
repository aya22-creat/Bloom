// Simple database utility using localStorage
// In production, this would connect to a real backend API

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // In production, this should be hashed
  userType: "fighter" | "survivor" | "wellness";
  createdAt: string;
  language?: "ar" | "en"; // User's preferred language
  profile?: {
    age?: number;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    medicalHistory?: string;
    [key: string]: string | number | undefined;
  };
}

const DB_KEY = "hopebloom_users";
const CURRENT_USER_KEY = "hopebloom_current_user";
const AUTH_USER_KEY = "hopebloom_auth"; // fallback to new auth storage

// Get all users
export const getAllUsers = (): User[] => {
  const users = localStorage.getItem(DB_KEY);
  return users ? JSON.parse(users) : [];
};

// Save all users
const saveUsers = (users: User[]): void => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

// Create a new user
export const createUser = (userData: Omit<User, "id" | "createdAt">): User => {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some(u => u.email === userData.email)) {
    throw new Error("Email already registered");
  }

  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Find user by email
export const findUserByEmail = (email: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.email === email);
};

// Find user by ID
export const findUserById = (id: string): User | undefined => {
  const users = getAllUsers();
  return users.find(u => u.id === id);
};

// Update user
export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
};

// Set current logged-in user
export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Get current logged-in user
export const getCurrentUser = (): User | null => {
  const REQUIRE_LOGIN_ALWAYS = String(import.meta.env.VITE_REQUIRE_LOGIN_ALWAYS || '').toLowerCase() === 'true';
  // Primary: legacy current user
  const userLegacy = localStorage.getItem(CURRENT_USER_KEY);
  if (userLegacy) return JSON.parse(userLegacy);

  // New auth storage: check sessionStorage first when REQUIRE_LOGIN_ALWAYS, else localStorage
  try {
    const authSession = sessionStorage.getItem(AUTH_USER_KEY);
    const authLocal = localStorage.getItem(AUTH_USER_KEY);
    const auth = REQUIRE_LOGIN_ALWAYS ? authSession : (authLocal || authSession);
    if (auth) {
      const parsed = JSON.parse(auth);
      return {
        id: String(parsed.id ?? ""),
        name: parsed.username || parsed.email || "User",
        email: parsed.email || "",
        password: "",
        userType: parsed.userType || "wellness",
        createdAt: new Date().toISOString(),
        language: parsed.language,
      } as User;
    }
  } catch (error) {
    console.error("Failed to parse auth user:", error);
  }

  return null;
};

// Login user
export const loginUser = (email: string, password: string): User | null => {
  const user = findUserByEmail(email);
  if (user && user.password === password) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

// Logout user
export const logoutUser = (): void => {
  setCurrentUser(null);
};

