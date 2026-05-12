/** Entidad mínima para arranque; se ampliará con casos de uso. */
export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
};

export interface ProductRepository {
  listActive(): Promise<ProductRecord[]>;
  getBySlug(slug: string): Promise<ProductRecord | null>;
}
