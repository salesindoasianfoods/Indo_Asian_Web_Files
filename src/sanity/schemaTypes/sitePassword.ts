import { defineType, defineField } from "sanity";

export const sitePasswordType = defineType({
  name: "sitePassword",
  title: "Site Login Password",
  type: "document",
  // Limit to a single document
  // @ts-expect-error - Sanity v3 doesn't include this in types but it still works
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "password",
      title: "Password",
      type: "string",
      description: "The password customers must enter to access the site. Change this to update the site password.",
      validation: (Rule) =>
        Rule.required().min(4).error("Password must be at least 4 characters"),
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site Login Password" };
    },
  },
});
