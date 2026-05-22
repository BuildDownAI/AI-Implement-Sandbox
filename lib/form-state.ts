import { z } from "zod";

export type FormState = {
    error?: string;
    fieldErrors?: Record<string, string>;
    message?: string;
};
export const emptyFormState: FormState = {};

export function toFieldErrors<T extends Record<string, unknown>>(
    error: z.ZodError<T>
): Record<string, string> {
    const flattenedError = z.flattenError(error)
    const out: Record<string, string> = {};

    for (const [key, msgs] of Object.entries(flattenedError.fieldErrors)) {
        if (msgs && msgs.length > 0) {
            out[key] = msgs[0];
        }
    }

    return out
}