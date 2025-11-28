"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeInitializer } from "./theme-initializer";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="ncs-theme"
      disableTransitionOnChange
      {...props}
    >
      <ThemeInitializer />
      {children}
    </NextThemesProvider>
  );
}
