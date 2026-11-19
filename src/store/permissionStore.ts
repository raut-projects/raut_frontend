import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RbacAccessSnapshot } from "@/types/rbac";

type PermissionState = {
  access: RbacAccessSnapshot | null;
  hydrated: boolean;
  setAccess: (access: RbacAccessSnapshot) => void;
  clear: () => void;
};

type PersistedPermissions = Pick<PermissionState, "access">;

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
      access: null,
      hydrated: false,
      setAccess: (access) => set({ access, hydrated: true }),
      clear: () => {
        set({ access: null, hydrated: true });
        usePermissionStore.persist.clearStorage();
      },
    }),
    {
      name: "raut-permission-storage",
      storage: createJSONStorage<PersistedPermissions>(() => window.localStorage),
      partialize: (state) => ({ access: state.access }),
      skipHydration: true,
      version: 1,
    },
  ),
);

export async function hydratePermissions() {
  if (typeof window === "undefined") return;

  await usePermissionStore.persist.rehydrate();
  usePermissionStore.setState({ hydrated: true });
}
