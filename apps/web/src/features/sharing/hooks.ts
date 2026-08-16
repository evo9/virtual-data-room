import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createShare,
  fetchDataRoomDetail,
  fetchReceivedShares,
  listShares,
  revokeShare,
  type CreateShareInput,
  type ResourceType,
} from "@/features/sharing/api";

export function sharesKey(resourceType: ResourceType, resourceId: string) {
  return ["shares", resourceType, resourceId] as const;
}

export const receivedSharesKey = ["shares", "received"] as const;

export function dataRoomDetailKey(dataRoomId: string) {
  return ["data-room-detail", dataRoomId] as const;
}

export function useShares(resourceType: ResourceType, resourceId: string, enabled = true) {
  return useQuery({
    queryKey: sharesKey(resourceType, resourceId),
    queryFn: () => listShares(resourceType, resourceId),
    enabled,
  });
}

export function useCreateShare(resourceType: ResourceType, resourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CreateShareInput, "resourceType" | "resourceId">) =>
      createShare({ resourceType, resourceId, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharesKey(resourceType, resourceId) }),
  });
}

export function useRevokeShare(resourceType: ResourceType, resourceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => revokeShare(shareId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharesKey(resourceType, resourceId) }),
  });
}

export function useReceivedShares() {
  return useQuery({
    queryKey: receivedSharesKey,
    queryFn: fetchReceivedShares,
  });
}

export function useDataRoomDetail(dataRoomId: string) {
  return useQuery({
    queryKey: dataRoomDetailKey(dataRoomId),
    queryFn: () => fetchDataRoomDetail(dataRoomId),
    retry: false,
  });
}
