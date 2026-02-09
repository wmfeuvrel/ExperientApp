import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Per spec: "If both fields are non-empty, consider login successful"
  if (!username.trim() || !password.trim()) {
    throw new Error('Username and password are required');
  }

  // Hardcoded mock response - no actual fetch
  const response: LoginResponse = {
    user: {
      username: "VShah",
      active: true,
      roleId: 20,
      dateCreated: "2018-03-02T00:00:00.000Z",
      dateModified: "2018-03-02T00:00:00.000Z",
      lastName: "Shah",
      firstName: "Viraj",
      displayName: "Viraj Shah",
      jiraUsername: "viraj.shah",
      intacctUserId: "EE-00112",
      userId: 41,
      emailAddress: "vshah@experient.com",
      openAtCurWeeksTimesheet: true,
      activeInterviewer: true,
      createIntacctTimesheet: true,
      roleName: "Developer"
    },
    accessToken: "abc123",
    refreshToken: "xyz789"
  };

  // Store tokens and user data
  await storeTokens(response.accessToken, response.refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));

  return response;
}

export async function logout(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}

export async function getStoredTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}> {
  const [accessToken, refreshToken, userJson] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ]);

  let user: User | null = null;
  if (userJson[1]) {
    try {
      user = JSON.parse(userJson[1]);
    } catch {
      user = null;
    }
  }

  return {
    accessToken: accessToken[1],
    refreshToken: refreshToken[1],
    user,
  };
}

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}
