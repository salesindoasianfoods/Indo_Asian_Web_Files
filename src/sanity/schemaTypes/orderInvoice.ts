import { defineType, defineField } from "sanity";

export const orderInvoiceType = defineType({
  name: "orderInvoice",
  title: "Order Invoices",
  type: "document",
  fields: [
    defineField({
      name: "orderCode",
      title: "Order Code",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
    }),
    defineField({
      name: "businessName",
      title: "Business Name",
      type: "string",
    }),
    defineField({
      name: "totalAmount",
      title: "Total Amount",
      type: "number",
    }),
    defineField({
      name: "pdfFile",
      title: "Invoice PDF",
      type: "file",
      options: { accept: "application/pdf" },
    }),
    defineField({
      name: "greenApiSent",
      title: "Sent via Green API",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "orderedAt",
      title: "Ordered At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: "orderCode",
      subtitle: "customerName",
    },
  },
});
