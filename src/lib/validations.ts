import { z } from 'zod';

export const expenseSchema = z.object({
  text: z.string().min(1, "Description is required").max(100),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;