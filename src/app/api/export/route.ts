import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function convertToCSV(data: Record<string, string | number>[], headers: string[]) {
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map((header) => {
      const key = header.toLowerCase().replace(/\s+/g, "_");
      const value = row[key] ?? "";
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "items";

  try {
    let csv = "";
    let filename = "";

    if (type === "items") {
      const items = await prisma.item.findMany({
        where: { isActive: true },
        include: { category: true },
      });
      
      const data: Record<string, string>[] = items.map((item: typeof items[0]) => ({
        name: item.name,
        description: item.description || "",
        serial_number: item.serialNumber || "",
        category: item.category.name,
        condition: item.condition,
        qr_code: item.qrCode,
        notes: item.notes || "",
      }));
      
      csv = convertToCSV(data, ["Name", "Description", "Serial Number", "Category", "Condition", "QR Code", "Notes"]);
      filename = "inventory_items.csv";
    } else if (type === "checkouts") {
      const checkouts = await prisma.checkout.findMany({
        include: {
          item: true,
          member: true,
        },
        orderBy: { checkedOutAt: "desc" },
      });
      
      const data: Record<string, string>[] = checkouts.map((checkout: typeof checkouts[0]) => ({
        item_name: checkout.item.name,
        member_name: checkout.member.name,
        checked_out_at: checkout.checkedOutAt.toISOString(),
        expected_return: checkout.expectedReturn.toISOString(),
        checked_in_at: checkout.checkedInAt?.toISOString() || "",
        condition_out: checkout.conditionOut,
        condition_in: checkout.conditionIn || "",
        status: checkout.checkedInAt ? "Returned" : "Active",
      }));
      
      csv = convertToCSV(data, ["Item Name", "Member Name", "Checked Out", "Expected Return", "Checked In", "Condition Out", "Condition In", "Status"]);
      filename = "checkout_history.csv";
    } else if (type === "overdue") {
      const checkouts = await prisma.checkout.findMany({
        where: {
          checkedInAt: null,
          expectedReturn: { lt: new Date() },
        },
        include: {
          item: true,
          member: true,
        },
        orderBy: { expectedReturn: "asc" },
      });
      
      const data: Record<string, string | number>[] = checkouts.map((checkout: typeof checkouts[0]) => ({
        item_name: checkout.item.name,
        member_name: checkout.member.name,
        member_email: checkout.member.email || "",
        checked_out_at: checkout.checkedOutAt.toISOString(),
        expected_return: checkout.expectedReturn.toISOString(),
        days_overdue: Math.floor((Date.now() - new Date(checkout.expectedReturn).getTime()) / (1000 * 60 * 60 * 24)),
      }));
      
      csv = convertToCSV(data, ["Item Name", "Member Name", "Member Email", "Checked Out", "Expected Return", "Days Overdue"]);
      filename = "overdue_items.csv";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV" },
      { status: 500 }
    );
  }
}
