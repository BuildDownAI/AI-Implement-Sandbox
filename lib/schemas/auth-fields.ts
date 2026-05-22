import { z } from "zod";

export const emailField = z.email("Must be a valid email address");
export const passwordField = z.string().min(8, "Password must be at least 8 characters");