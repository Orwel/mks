import { CartView } from "@/presentation/components/cart/cart-view";

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--mks-cyan)]">Compra</p>
      <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl">
        Carrito
      </h1>
      <p className="mt-2 text-sm font-medium text-neutral-600">
        Cada línea dispara una reserva atómica en la base de datos (RPC <code className="font-mono text-xs">reserve_stock</code>
        ). Si abandonas el carrito, el stock se libera al vencer el TTL o con la limpieza programada.
      </p>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
