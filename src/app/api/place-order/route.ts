import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `IAF-${date}-${code}`;
}

function formatINR(n: number): string {
  return `£ ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildMessage(
  orderCode: string,
  customer: { name: string; businessName: string; address1: string; address2: string; zip: string; notes: string },
  items: Array<{ name: string; code: string; quantity: number; price?: string }>,
  total: number
): string {
  const lines: string[] = [];
  lines.push(`🛒 *New Order — ${orderCode}*`);
  lines.push("");
  lines.push("👤 *Customer Details*");
  lines.push(`Name: ${customer.name}`);
  if (customer.businessName) lines.push(`Business: ${customer.businessName}`);
  lines.push("");
  lines.push("📦 *Order Items*");
  items.forEach((item, i) => {
    const priceNum = parseFloat((item.price ?? "0").replace(/[^\d.]/g, ""));
    const lineTotal = isNaN(priceNum) ? "" : ` — £${(priceNum * item.quantity).toLocaleString("en-GB")}`;
    lines.push(`${i + 1}. ${item.name} (${item.code}) × ${item.quantity}${lineTotal}`);
  });
  lines.push("");
  lines.push(`💰 *Total: ${formatINR(total)}*`);
  lines.push("");
  lines.push("📍 *Shipping Address*");
  if (customer.address1) lines.push(customer.address1);
  if (customer.address2) lines.push(customer.address2);
  if (customer.zip) lines.push(`Zip: ${customer.zip}`);
  if (customer.notes) {
    lines.push("");
    lines.push(`📝 *Notes:* ${customer.notes}`);
  }
  return lines.join("\n");
}

// ─── Store Order in Sanity ───────────────────────────────────────────────────

async function storeOrderInSanity(
  orderCode: string,
  customer: { name: string; businessName: string; address1: string; address2: string; zip: string; notes: string },
  total: number,
  orderData: string
): Promise<void> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN;

  if (!projectId || !token) {
    console.warn("[place-order] Sanity credentials not set — skipping order storage.");
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2024-04-01",
    useCdn: false,
  });

  await client.create({
    _type: "orderInvoice",
    orderCode,
    customerName: customer.name,
    businessName: customer.businessName || undefined,
    totalAmount: total,
    orderData,
    greenApiSent: false,
    orderedAt: new Date().toISOString(),
  });

  console.log("[place-order] Order stored in Sanity:", orderCode);
}

// ─── POST /api/place-order ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderCode: clientOrderCode, customer, items, total } = body as {
      orderCode?: string;
      customer: { name: string; businessName: string; address1: string; address2: string; zip: string; notes: string };
      items: Array<{ name: string; code: string; quantity: number; price?: string }>;
      total: number;
    };

    // Server-side validation
    if (!customer?.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!items?.length)           return NextResponse.json({ error: "Cart is empty" },     { status: 400 });

    const orderCode = clientOrderCode && clientOrderCode.trim() ? clientOrderCode.trim() : generateOrderCode();
    const message = buildMessage(orderCode, customer, items, total);

    console.log(`\n📦 Order ${orderCode} | ${customer.name} | £${total}`);

    // Store order in Sanity (always)
    storeOrderInSanity(orderCode, customer, total, message).catch((e) =>
      console.error("[place-order] Failed to store order in Sanity:", e)
    );

    return NextResponse.json({ orderCode, message }, { status: 200 });
  } catch (err) {
    console.error("[place-order] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
