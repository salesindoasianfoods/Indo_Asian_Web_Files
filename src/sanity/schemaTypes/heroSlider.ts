import { defineField, defineType } from "sanity";

export const heroSliderType = defineType({
  name: "heroSlider",
  title: "Hero Slider Images",
  type: "document",
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [
        {
          type: "image",
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alternative text",
              description: "Important for SEO and accessibility.",
            },
          ],
          options: {
            hotspot: true,
          },
        },
      ],
      options: {
        layout: "grid",
      },
      description: "Upload and arrange slider images here. You can drag and drop to reorder.",
    }),
  ],
});
