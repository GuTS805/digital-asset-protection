const TOKEN_KEY = "shieldsync_token";
const USER_KEY = "shieldsync_user";

function setCookie(name: string, value: string, days = 1) {
  document.cookie = `${name}=${value}; path=/; max-age=${days * 86400}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export const auth = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setSession: (token: string, username: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
    setCookie(TOKEN_KEY, token);
  },
  getUser: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(USER_KEY);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    deleteCookie(TOKEN_KEY);
  },
  isAuthenticated: (): boolean => !!auth.getToken(),
};
