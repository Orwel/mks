import Image from "next/image";

import { canUseNextImage } from "@/shared/lib/next-image-remote";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Usa `next/image` solo para orígenes permitidos; `<img>` para URLs externas del admin. */
export function RemoteImage({ src, alt, fill, className, sizes, priority }: Props) {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
      />
    );
  }

  const imgClass = fill
    ? ["absolute inset-0 h-full w-full object-cover", className].filter(Boolean).join(" ")
    : className;

  // eslint-disable-next-line @next/next/no-img-element -- dominios arbitrarios del panel admin
  return <img src={src} alt={alt} className={imgClass} />;
}
