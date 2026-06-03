import Link from "next/link";

export default function ProductoNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center md:px-8">
      <h1 className="font-heading text-3xl font-black text-[var(--mks-ink)]">Producto no encontrado</h1>
      <p className="mt-3 text-sm text-neutral-600">
        El producto no existe o ya no está disponible en la tienda.
      </p>
      <Link
        href="/catalogo"
        className="mt-8 inline-block rounded-xl border-4 border-[var(--mks-ink)] bg-[var(--mks-cyan)] px-6 py-3 text-sm font-black text-[var(--mks-ink)] shadow-[6px_6px_0_0_var(--mks-ink)]"
      >
        Volver al catálogo
      </Link>
    </div>
  );
}
