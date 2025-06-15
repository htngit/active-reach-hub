
import { Invoice, InvoiceItem } from '@/types/invoice';
import { Contact } from '@/types/contact';
import { Team } from '@/types/team';
import { format } from 'date-fns';

interface TemplateData {
  invoice: Invoice;
  items: InvoiceItem[];
  contact: Contact | undefined;
  company: Team | undefined;
  logoBase64: string | null;
  formatCurrency: (amount: number | null) => string;
}

export const generateInvoicePDFTemplate = ({
  invoice,
  items,
  contact,
  company,
  logoBase64,
  formatCurrency
}: TemplateData): string => {
  return `
    <div style="font-family: 'Arial', sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; background: white; color: #333;">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
        <!-- Company Info with Logo and Name Side by Side, Additional Info Below -->
        <div style="flex: 1;">
          <!-- Logo and Company Name Row -->
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
            ${logoBase64 ? `
              <div style="flex-shrink: 0;">
                <img src="${logoBase64}" alt="Company Logo" style="max-height: 50px; max-width: 70px; object-fit: contain;">
              </div>
            ` : ''}
            <div>
              <h1 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: bold;">${company?.company_legal_name || company?.name || 'Company Name'}</h1>
            </div>
          </div>
          
          <!-- Additional Company Information Below Logo and Name -->
          <div style="color: #6b7280; font-size: 11px; line-height: 1.4; margin-left: 0;">
            ${company?.company_address ? `<div>${company.company_address}</div>` : ''}
            ${company?.city ? `<div>${company.city}${company.state ? `, ${company.state}` : ''} ${company.postal_code || ''}</div>` : ''}
            ${company?.country ? `<div>${company.country}</div>` : ''}
            ${company?.company_phone ? `<div>Phone: ${company.company_phone}</div>` : ''}
            ${company?.company_email ? `<div>Email: ${company.company_email}</div>` : ''}
            ${company?.website ? `<div>Website: ${company.website}</div>` : ''}
            ${company?.tax_id ? `<div>Tax ID: ${company.tax_id}</div>` : ''}
          </div>
        </div>
        
        <!-- Invoice Title & Number -->
        <div style="text-align: right; flex-shrink: 0;">
          <h2 style="color: #2563eb; margin: 0 0 8px 0; font-size: 32px; font-weight: bold;">INVOICE</h2>
          <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; min-width: 180px;">
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Invoice Number</div>
            <div style="font-size: 16px; font-weight: bold; color: #1f2937;">${invoice.invoice_number}</div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
        <!-- Bill To Section -->
        <div style="flex: 1; margin-right: 30px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bill To</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
            <div style="font-weight: bold; font-size: 15px; color: #1f2937; margin-bottom: 6px;">${contact?.name || 'N/A'}</div>
            ${contact?.company ? `<div style="color: #6b7280; margin-bottom: 3px; font-size: 13px;">${contact.company}</div>` : ''}
            ${contact?.address ? `<div style="color: #6b7280; margin-bottom: 3px; font-size: 13px;">${contact.address}</div>` : ''}
            ${contact?.phone_number ? `<div style="color: #6b7280; margin-bottom: 3px; font-size: 13px;">Phone: ${contact.phone_number}</div>` : ''}
            ${contact?.email ? `<div style="color: #6b7280; font-size: 13px;">${contact.email}</div>` : ''}
          </div>
        </div>

        <!-- Invoice Info -->
        <div style="flex: 0 0 180px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Invoice Details</h3>
          <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #6b7280; font-size: 13px;">Created:</span>
              <span style="color: #1f2937; font-weight: 500; font-size: 13px;">${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
            </div>
            ${invoice.due_date ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="color: #6b7280; font-size: 13px;">Due Date:</span>
                <span style="color: #dc2626; font-weight: 500; font-size: 13px;">${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280; font-size: 13px;">Status:</span>
              <span style="color: #059669; font-weight: 500; background: #d1fae5; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${invoice.status}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Invoice Items</h3>
        <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white;">
              <th style="padding: 12px; text-align: left; font-weight: 600; font-size: 13px;">Description</th>
              <th style="padding: 12px; text-align: center; font-weight: 600; font-size: 13px; width: 70px;">Qty</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 13px; width: 100px;">Unit Price</th>
              <th style="padding: 12px; text-align: right; font-weight: 600; font-size: 13px; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 12px; color: #1f2937; font-size: 13px;">${item.description}</td>
                <td style="padding: 10px 12px; text-align: center; color: #6b7280; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 10px 12px; text-align: right; color: #6b7280; font-size: 13px;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 10px 12px; text-align: right; color: #1f2937; font-weight: 600; font-size: 13px;">${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Summary Section -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
        <div style="width: 280px; background: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px;">
            <span style="color: #6b7280; font-size: 13px;">Subtotal:</span>
            <span style="color: #1f2937; font-weight: 500; font-size: 13px;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${invoice.tax_rate && invoice.tax_rate > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 6px;">
              <span style="color: #6b7280; font-size: 13px;">Tax (${invoice.tax_rate}%):</span>
              <span style="color: #1f2937; font-weight: 500; font-size: 13px;">${formatCurrency(invoice.tax_amount || 0)}</span>
            </div>
          ` : ''}
          <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #1f2937; font-weight: bold; font-size: 16px;">Total:</span>
              <span style="color: #2563eb; font-weight: bold; font-size: 18px;">${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <!-- Notes Section -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Notes</h3>
          <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; line-height: 1.5; font-size: 13px;">${invoice.notes}</p>
          </div>
        </div>
      ` : ''}

      ${company?.bank_name ? `
        <!-- Payment Information -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Payment Information</h3>
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; color: #065f46; font-size: 13px;">
              <div><strong>Bank:</strong> ${company.bank_name}</div>
              ${company.bank_account ? `<div><strong>Account:</strong> ${company.bank_account}</div>` : ''}
              ${company.bank_account_holder ? `<div><strong>Account Holder:</strong> ${company.bank_account_holder}</div>` : ''}
              ${company.swift_code ? `<div><strong>SWIFT:</strong> ${company.swift_code}</div>` : ''}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 11px;">
        <p style="margin: 0;">Thank you for your business!</p>
        <p style="margin: 3px 0 0 0;">This invoice was generated on ${format(new Date(), 'MMM dd, yyyy')} at ${format(new Date(), 'HH:mm')}</p>
      </div>
    </div>
  `;
};
