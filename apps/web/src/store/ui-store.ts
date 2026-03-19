import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SettingsFormValues = {
  fullName: string;
  primaryGoal: string;
  riskProfile: "conservative" | "balanced" | "growth";
  telegram: string;
  dailyDigest: boolean;
};

type UiState = {
  sidebarCollapsed: boolean;
  settings: SettingsFormValues;
  toggleSidebar: () => void;
  saveSettings: (values: SettingsFormValues) => void;
};

const defaultSettings: SettingsFormValues = {
  fullName: "Valerii Investor",
  primaryGoal: "Собрать внятный инвест-кабинет для диплома",
  riskProfile: "balanced",
  telegram: "@invest_agent_demo",
  dailyDigest: true,
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      settings: defaultSettings,
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
      saveSettings: (values) =>
        set(() => ({
          settings: values,
        })),
    }),
    {
      name: "invest-agent-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        settings: state.settings,
      }),
    },
  ),
);
