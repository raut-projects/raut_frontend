import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mapRbacAccess } from "@/services/mappers";
import type { RbacAccessSnapshot } from "@/types/rbac";

type PermissionState = {
  access: RbacAccessSnapshot | null;
  hydrated: boolean;
  setAccess: (access: RbacAccessSnapshot) => void;
  clear: () => void;
};

type PersistedPermissions = Pick<PermissionState, "access">;

const normalizeAccessSnapshot = (access: unknown): RbacAccessSnapshot | null =>
  access && typeof access === "object" ? mapRbacAccess(access) : null;

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set) => ({
      access: null,
      hydrated: false,
      setAccess: (access) =>
        set({ access: normalizeAccessSnapshot(access), hydrated: true }),
      clear: () => {
        set({ access: null, hydrated: true });
        usePermissionStore.persist.clearStorage();
      },
    }),
    {
      name: "raut-permission-storage",
      storage: createJSONStorage<PersistedPermissions>(() => window.localStorage),
      partialize: (state) => ({ access: state.access }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedPermissions> | undefined;

        return {
          ...currentState,
          access: normalizeAccessSnapshot(persisted?.access),
        };
      },
      skipHydration: true,
      version: 1,
    },
  ),
);

export async function hydratePermissions() {
  if (typeof window === "undefined") return;

  await usePermissionStore.persist.rehydrate();
  const access = usePermissionStore.getState().access;
  usePermissionStore.setState({
    access: normalizeAccessSnapshot(access),
    hydrated: true,
  });
}
