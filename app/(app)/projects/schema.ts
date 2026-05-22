import { z } from "zod";

export const projectSchema = z.object({
    name: z.string().trim()
        .min(1, "Name is required")
        .max(100, "Name must be 100 characters or less"),

    description: z.string().trim()
        .max(1000, "Description must be 1000 characters or less")
        .optional()
        .transform((val) => (val === "" ? undefined : val)), // transforms empty strings into undefined to keep descriptions null within the database
    
    status: z.enum(["draft", "active", "archived"], {
        message: "Status must be draft, active, or archived",
    }),
});

export type ProjectInput = z.infer<typeof projectSchema>;