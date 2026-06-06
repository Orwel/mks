export type CategoryTreeRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
};

export type CategoryTree = {
  roots: CategoryTreeRow[];
  subcategories: CategoryTreeRow[];
};

export function buildCategoryTree(rows: CategoryTreeRow[]): CategoryTree {
  const roots = rows
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"));
  const subcategories = rows
    .filter((c) => c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "es"));
  return { roots, subcategories };
}

export function subsForParent(tree: CategoryTree, parentId: string): CategoryTreeRow[] {
  return tree.subcategories.filter((s) => s.parent_id === parentId);
}

export function parentForSub(tree: CategoryTree, subcategoryId: string): CategoryTreeRow | null {
  const sub = tree.subcategories.find((s) => s.id === subcategoryId);
  if (!sub?.parent_id) return null;
  return tree.roots.find((r) => r.id === sub.parent_id) ?? null;
}

export function categoryPathLabel(
  tree: CategoryTree,
  subcategoryId: string,
): { parentName: string; subcategoryName: string } {
  const sub = tree.subcategories.find((s) => s.id === subcategoryId);
  if (!sub) return { parentName: "—", subcategoryName: "—" };
  const parent = sub.parent_id ? tree.roots.find((r) => r.id === sub.parent_id) : null;
  return {
    parentName: parent?.name ?? "—",
    subcategoryName: sub.name,
  };
}

export function productMatchesCategoryFilter(
  categoryId: string,
  parentFilter: string,
  subcategoryFilter: string,
  tree: CategoryTree,
): boolean {
  if (subcategoryFilter !== "all") {
    return categoryId === subcategoryFilter;
  }
  if (parentFilter !== "all") {
    const sub = tree.subcategories.find((s) => s.id === categoryId);
    return sub?.parent_id === parentFilter;
  }
  return true;
}
