import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Webhook Mercado Pago pendiente de implementación." },
    { status: 501 },
  );
}
