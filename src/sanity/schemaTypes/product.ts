import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "image",
      title: "Product Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "name",
      title: "Product Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      description: "Auto-generated from product name. Used for product URL.",
    }),
    defineField({
      name: "code",
      title: "Product Code",
      type: "string",
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
    }),
    defineField({
      name: "weight",
      title: "Weight",
      type: "string",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: "e.g. £ 300.00",
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      description: "Optional promotional badge e.g. '50% OFF'",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      description: "Select the category this product belongs to.",
    }),
    defineField({
      name: "outOfStock",
      title: "Out of Stock",
      type: "boolean",
      description: "Toggle on if the product is currently out of stock.",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "code",
      media: "image",
    },
  },
});
