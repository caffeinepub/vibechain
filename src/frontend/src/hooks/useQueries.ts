import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CircleView, Profile, Vibe } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useAllVibes() {
  const { actor, isFetching } = useActor();
  return useQuery<Vibe[]>({
    queryKey: ["vibes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVibes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserVibes() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Vibe[]>({
    queryKey: ["userVibes", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserVibes(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<Profile | null>({
    queryKey: ["callerProfile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAllCircles() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, CircleView]>>({
    queryKey: ["circles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCircles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostVibe() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      mood: string;
      songTitle: string;
      artistName: string;
      message: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.postVibe(
        data.mood,
        data.songTitle,
        data.artistName,
        data.message,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vibes"] }),
  });
}

export function useDeleteVibe() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vibeId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteVibe(vibeId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vibes"] });
      qc.invalidateQueries({ queryKey: ["userVibes"] });
    },
  });
}

export function useJoinCircle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (circleName: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinCircle(circleName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circles"] }),
  });
}

export function useLeaveCircle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (circleName: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.leaveCircle(circleName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circles"] }),
  });
}

export function useCreateCircle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCircle(data.name, data.description);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["circles"] }),
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const { identity } = useInternetIdentity();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["callerProfile", identity?.getPrincipal().toString()],
      }),
  });
}
