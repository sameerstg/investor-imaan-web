// components/AuthProvider.tsx

"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: AuthProviderProps) => {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
