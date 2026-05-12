type Props = { params: Promise<{ orderNumber: string }> };

export default async function PedidoInvitadoPage({ params }: Props) {
  const { orderNumber } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Pedido {orderNumber}</h1>
      <p className="mt-2 text-muted-foreground">
        Seguimiento para invitados (validación por email) próximamente.
      </p>
    </div>
  );
}
