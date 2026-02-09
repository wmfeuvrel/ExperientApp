import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const API_BASE_URL = 'https://timetracker-api.experient.com';

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface MockResponse {
  ok: boolean;
  status: number;
  headers: {
    getSetCookie: () => string[];
  };
  json: () => Promise<{ user: User }>;
}

function createMockResponse(): MockResponse {
  return {
    ok: true,
    status: 200,
    headers: {
      getSetCookie: () => [
        'accessToken=abc123; Path=/; HttpOnly; Secure; SameSite=Lax',
        'refreshToken=xyz789; Path=/; HttpOnly; Secure; SameSite=Lax',
      ],
    },
    json: async () => ({
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
      }
    }),
  };
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`^${name}=([^;]+)`));
  return match ? match[1] : null;
}

function extractTokensFromCookies(setCookieHeaders: string[]): { accessToken: string | null; refreshToken: string | null } {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  for (const cookie of setCookieHeaders) {
    const access = parseCookieValue(cookie, 'accessToken');
    const refresh = parseCookieValue(cookie, 'refreshToken');
    if (access) accessToken = access;
    if (refresh) refreshToken = refresh;
  }

  return { accessToken, refreshToken };
}

async function mockFetch(_url: string, _options: RequestInit): Promise<MockResponse> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return createMockResponse();
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  // Per spec: "If both fields are non-empty, consider login successful"
  if (!username.trim() || !password.trim()) {
    throw new Error('Username and password are required');
  }

  // Simulate API request to /auth/login
  const response = await mockFetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  // Parse response body
  const body = await response.json();

  // Extract tokens from Set-Cookie headers
  const setCookieHeaders = response.headers.getSetCookie();
  const { accessToken, refreshToken } = extractTokensFromCookies(setCookieHeaders);

  if (!accessToken || !refreshToken) {
    throw new Error('Failed to extract tokens from response headers');
  }

  // Store tokens and user data
  await storeTokens(accessToken, refreshToken);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(body.user));

  return {
    user: body.user,
    accessToken,
    refreshToken,
  };
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
