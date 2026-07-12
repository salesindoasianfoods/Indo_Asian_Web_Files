import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Category Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Lower number = appears first in the sidebar. You can also drag to reorder in the list view.",
      initialValue: 0,
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "order",
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: `Order: ${subtitle ?? 0}`,
      };
    },
  },
});
