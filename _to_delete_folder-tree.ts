import type { FolderTreeNode } from "@/features/data-room/api";

export interface FolderTreeRow {
  id: string | null;
  name: string;
  depth: number;
}

export function buildFolderTreeRows(folders: FolderTreeNode[]): FolderTreeRow[] {
  const childrenByParent = new Map<string | null, FolderTreeNode[]>();
  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parentId) ?? [];
    siblings.push(folder);
    childrenByParent.set(folder.parentId, siblings);
  }
  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const rows: FolderTreeRow[] = [{ id: null, name: "Root", depth: 0 }];

  function walk(parentId: string | null, depth: number) {
    for (const folder of childrenByParent.get(parentId) ?? []) {
      rows.push({ id: folder.id, name: folder.name, depth });
      walk(folder.id, depth + 1);
    }
  }
  walk(null, 1);

  return rows;
}
