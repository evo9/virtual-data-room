import { api } from "@/lib/api";

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageParams {
  cursor?: string;
  limit?: number;
}

export interface FolderSummary {
  id: string;
  name: string;
  parentId: string | null;
  dataRoomId: string;
  createdAt: string;
}

export type FolderItem = {
  type: "folder";
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
};

export type FileItem = {
  type: "file";
  id: string;
  name: string;
  folderId: string | null;
  size: number;
  mimeType: string;
  createdAt: string;
};

export type ContentItem = FolderItem | FileItem;

export interface DataRoom {
  id: string;
  name: string;
  createdAt: string;
}

export interface BreadcrumbFolder {
  id: string;
  name: string;
}

export interface Breadcrumbs {
  dataRoom: { id: string; name: string };
  folders: BreadcrumbFolder[];
}

export interface DeletePreview {
  folderCount: number;
  fileCount: number;
  totalSize: number;
}

export async function fetchDataRooms(params: PageParams = {}): Promise<Page<DataRoom>> {
  const { data } = await api.get<Page<DataRoom>>("/data-rooms", { params });
  return data;
}

export async function fetchDataRoomContents(
  dataRoomId: string,
  params: PageParams = {}
): Promise<Page<ContentItem>> {
  const { data } = await api.get<Page<ContentItem>>(`/data-rooms/${dataRoomId}/contents`, { params });
  return data;
}

export async function fetchFolderContents(
  folderId: string,
  params: PageParams = {}
): Promise<Page<ContentItem>> {
  const { data } = await api.get<Page<ContentItem>>(`/folders/${folderId}/contents`, { params });
  return data;
}

export async function fetchBreadcrumbs(folderId: string): Promise<Breadcrumbs> {
  const { data } = await api.get<Breadcrumbs>(`/folders/${folderId}/breadcrumbs`);
  return data;
}

export async function fetchDeletePreview(folderId: string): Promise<DeletePreview> {
  const { data } = await api.get<DeletePreview>(`/folders/${folderId}/delete-preview`);
  return data;
}

export async function createDataRoom(name: string): Promise<DataRoom> {
  const { data } = await api.post<DataRoom>("/data-rooms", { name });
  return data;
}

export async function createFolder(input: {
  name: string;
  dataRoomId: string;
  parentId?: string;
}): Promise<FolderSummary> {
  const { data } = await api.post<FolderSummary>("/folders", input);
  return data;
}

export async function renameFolder(folderId: string, name: string): Promise<FolderSummary> {
  const { data } = await api.patch<FolderSummary>(`/folders/${folderId}`, { name });
  return data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  await api.delete(`/folders/${folderId}`);
}
