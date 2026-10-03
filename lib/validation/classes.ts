import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120, "Keep it under 120 characters"),
  description: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;
