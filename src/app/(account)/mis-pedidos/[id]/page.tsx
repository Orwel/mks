type Props = { params: Promise<{ id: string }> };

export default async function PedidoDetalleClientePage({ params }: Props) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-semibold">Pedido {id}</h1>
      <p className="mt-2 text-muted-foreground">Detalle y timeline próximamente.</p>
    </div>
  );
}
