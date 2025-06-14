
import * as z from 'zod';

export const invoiceSchema = z.object({
  contact_id: z.string().min(1, 'Contact is required'),
  team_id: z.string().min(1, 'Team is required'),
  due_date: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Unit price must be non-negative'),
  })).min(1, 'At least one item is required'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
