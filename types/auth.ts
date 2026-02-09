export interface User {
  username: string;
  active: boolean;
  roleId: number;
  dateCreated: string;
  dateModified: string;
  lastName: string;
  firstName: string;
  displayName: string;
  jiraUsername: string;
  intacctUserId: string;
  userId: number;
  emailAddress: string;
  openAtCurWeeksTimesheet: boolean;
  activeInterviewer: boolean;
  createIntacctTimesheet: boolean;
  roleName: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_TOKEN'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'SET_LOADING'; payload: boolean };
