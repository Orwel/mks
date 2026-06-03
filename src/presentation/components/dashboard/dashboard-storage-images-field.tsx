type Props = {
  label?: string;
  name?: string;
  multiple?: boolean;
  required?: boolean;
  hint?: string;
};

export function DashboardStorageImagesField({
  label = "Imágenes",
  name = "images",
  multiple = true,
  required = false,
  hint = "Sube JPG, PNG o WebP (máx. 5 MB por archivo). Puedes seleccionar varias; el total del envío no debe superar ~12 MB.",
}: Props) {
  return (
    <label className="text-xs font-black uppercase text-neutral-600 md:col-span-2">
      {label}
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        required={required}
        className="mt-1 block w-full text-sm font-medium file:mr-3 file:rounded-lg file:border-4 file:border-[var(--mks-ink)] file:bg-[var(--mks-cyan)] file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:text-[var(--mks-ink)]"
      />
      <span className="mt-1 block text-[0.65rem] font-medium normal-case text-neutral-500">
        {hint}
      </span>
    </label>
  );
}
