export type ShippingAddress = {
  country_code: string;
  country_name: string;
  city: string;
  street: string;
  apartment?: string | null;
  building?: string | null;
  postal_code?: string | null;
  notes?: string | null;
};

export type ShippingAddressInput = {
  city: string;
  street: string;
  apartment?: string;
  building?: string;
  postal_code?: string;
  notes?: string;
};

export function validateShippingAddressInput(
  input: ShippingAddressInput,
): { ok: true; data: ShippingAddressInput } | { ok: false; error: string } {
  const city = input.city.trim();
  const street = input.street.trim();

  if (city.length < 2) {
    return { ok: false, error: "Indica la ciudad de envío." };
  }
  if (street.length < 5) {
    return { ok: false, error: "Indica una dirección de envío válida." };
  }

  return {
    ok: true,
    data: {
      city,
      street,
      apartment: input.apartment?.trim() || undefined,
      building: input.building?.trim() || undefined,
      postal_code: input.postal_code?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
    },
  };
}

export function buildShippingAddress(
  marketCode: string,
  marketName: string,
  input: ShippingAddressInput,
): ShippingAddress {
  return {
    country_code: marketCode,
    country_name: marketName,
    city: input.city,
    street: input.street,
    apartment: input.apartment ?? null,
    building: input.building ?? null,
    postal_code: input.postal_code ?? null,
    notes: input.notes ?? null,
  };
}

export function formatShippingAddress(addr: ShippingAddress): string {
  const parts = [
    addr.street,
    addr.apartment ? `Apto. ${addr.apartment}` : null,
    addr.building ? `Torre/edificio ${addr.building}` : null,
    addr.postal_code ? `CP ${addr.postal_code}` : null,
    addr.city,
    addr.country_name,
  ].filter(Boolean);
  return parts.join(", ");
}
