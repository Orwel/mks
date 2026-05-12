type Props = { params: Promise<{ slug: string }> };

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Categoría: {slug}</h1>
      <p className="mt-2 text-muted-foreground">Productos filtrados por categoría próximamente.</p>
    </div>
  );
}
