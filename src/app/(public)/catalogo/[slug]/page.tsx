type Props = { params: Promise<{ slug: string }> };

export default async function ProductoDetallePage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Producto: {slug}</h1>
      <p className="mt-2 text-muted-foreground">Vista detalle en construcción.</p>
    </div>
  );
}
