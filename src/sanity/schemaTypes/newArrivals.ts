import { defineField, defineType } from "sanity";

export const newArrivalsType = defineType({
  name: "newArrivals",
  title: "New Arrivals Page",
  type: "document",
  fields: [
    defineField({
      name: "images",
      title: "Banner Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      description: "Upload banner images to display on the New Arrivals page. If this list is empty, the page will be disabled and the header link hidden.",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "New Arrivals Configuration",
      };
    },
  },
});
