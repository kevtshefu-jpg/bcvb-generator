import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { memberDirectory, sanitizeEmail, type MemberRecord, type MemberRole } from "../../../data/memberDirectory";

type AuthMember = Omit<MemberRecord, "password">;

type AuthContextValue = {
  user: AuthMember | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; message?: string };
  logout: () => void;
  hasRole: (roles: MemberRole[]) => boolean;
  availableDemoAccounts: Array<Pick<MemberRecord, "email" | "password" | "role">>;
};

const AUTH_STORAGE_KEY = "bcvb.member.session.v2";

const AuthContext = createContext<AuthContextValue | null>(null);

function toPublicMember(member: MemberRecord): AuthMember {
  const { password: _password, ...safeMember } = member;
  return safeMember;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthMember | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as AuthMember;
      if (parsed?.email) {
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  function login(email: string, password: string) {
    const match = memberDirectory.find(
      (member) =>
        sanitizeEmail(member.email) === sanitizeEmail(email) && member.password === password
    );

    if (!match) {
      return { ok: false, message: "Identifiants invalides. Vérifie l’adresse et le mot de passe." };
    }

    const safeMember = toPublicMember(match);
    setUser(safeMember);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeMember));
    return { ok: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  function hasRole(roles: MemberRole[]) {
    if (!user) return false;
    return roles.includes(user.role);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      hasRole,
      availableDemoAccounts: memberDirectory.map(({ email, password, role }) => ({ email, password, role }))
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
