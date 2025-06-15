
import { useCurrency } from '@/hooks/useCurrency';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { Contact } from '@/types/contact';
import { Team } from '@/types/team';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';

interface PDFGeneratorOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  contact: Contact | undefined;
  company: Team | undefined;
}

export const useInvoicePDFGenerator = () => {
  const { formatCurrency } = useCurrency();

  const generatePDF = async ({ invoice, items, contact, company }: PDFGeneratorOptions) => {
    // Create a temporary div element for the PDF content
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: 'Arial', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white; color: #333;">
        <!-- Header Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 30px;">
          <!-- Company Info -->
          <div style="flex: 1;">
            ${company?.logo_url ? `<img src="${company.logo_url}" alt="Company Logo" style="max-height: 60px; margin-bottom: 15px;">` : ''}
            <h1 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">${company?.company_legal_name || company?.name || 'Company Name'}</h1>
            <div style="color: #6b7280; font-size: 12px; line-height: 1.5;">
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
          <div style="text-align: right;">
            <h2 style="color: #2563eb; margin: 0 0 10px 0; font-size: 36px; font-weight: bold;">INVOICE</h2>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; min-width: 200px;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Invoice Number</div>
              <div style="font-size: 18px; font-weight: bold; color: #1f2937;">${invoice.invoice_number}</div>
            </div>
          </div>
        </div>

        <!-- Invoice Details -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <!-- Bill To Section -->
          <div style="flex: 1; margin-right: 40px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bill To</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <div style="font-weight: bold; font-size: 16px; color: #1f2937; margin-bottom: 8px;">${contact?.name || 'N/A'}</div>
              ${contact?.company ? `<div style="color: #6b7280; margin-bottom: 4px;">${contact.company}</div>` : ''}
              ${contact?.address ? `<div style="color: #6b7280; margin-bottom: 4px;">${contact.address}</div>` : ''}
              ${contact?.phone_number ? `<div style="color: #6b7280; margin-bottom: 4px;">Phone: ${contact.phone_number}</div>` : ''}
              ${contact?.email ? `<div style="color: #6b7280;">${contact.email}</div>` : ''}
            </div>
          </div>

          <!-- Invoice Info -->
          <div style="flex: 0 0 200px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Invoice Details</h3>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Created:</span>
                <span style="color: #1f2937; font-weight: 500;">${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</span>
              </div>
              ${invoice.due_date ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6b7280; font-size: 14px;">Due Date:</span>
                  <span style="color: #dc2626; font-weight: 500;">${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 14px;">Status:</span>
                <span style="color: #059669; font-weight: 500; background: #d1fae5; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 40px;">
          <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Invoice Items</h3>
          <table style="width: 100%; border-collapse: collapse; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white;">
                <th style="padding: 15px; text-align: left; font-weight: 600; font-size: 14px;">Description</th>
                <th style="padding: 15px; text-align: center; font-weight: 600; font-size: 14px; width: 80px;">Qty</th>
                <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px; width: 120px;">Unit Price</th>
                <th style="padding: 15px; text-align: right; font-weight: 600; font-size: 14px; width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, index) => `
                <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 15px; color: #1f2937; font-size: 14px;">${item.description}</td>
                  <td style="padding: 15px; text-align: center; color: #6b7280; font-size: 14px;">${item.quantity}</td>
                  <td style="padding: 15px; text-align: right; color: #6b7280; font-size: 14px;">${formatCurrency(item.unit_price)}</td>
                  <td style="padding: 15px; text-align: right; color: #1f2937; font-weight: 600; font-size: 14px;">${formatCurrency(item.total_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 300px; background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px;">
              <span style="color: #6b7280; font-size: 14px;">Subtotal:</span>
              <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.tax_rate && invoice.tax_rate > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px;">
                <span style="color: #6b7280; font-size: 14px;">Tax (${invoice.tax_rate}%):</span>
                <span style="color: #1f2937; font-weight: 500; font-size: 14px;">${formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            ` : ''}
            <div style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #1f2937; font-weight: bold; font-size: 18px;">Total:</span>
                <span style="color: #2563eb; font-weight: bold; font-size: 20px;">${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <!-- Notes Section -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Notes</h3>
            <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; line-height: 1.6; font-size: 14px;">${invoice.notes}</p>
            </div>
          </div>
        ` : ''}

        ${company?.bank_name ? `
          <!-- Payment Information -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Payment Information</h3>
            <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; border-left: 4px solid #059669;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; color: #065f46; font-size: 14px;">
                <div><strong>Bank:</strong> ${company.bank_name}</div>
                ${company.bank_account ? `<div><strong>Account:</strong> ${company.bank_account}</div>` : ''}
                ${company.bank_account_holder ? `<div><strong>Account Holder:</strong> ${company.bank_account_holder}</div>` : ''}
                ${company.swift_code ? `<div><strong>SWIFT:</strong> ${company.swift_code}</div>` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Thank you for your business!</p>
          <p style="margin: 5px 0 0 0;">This invoice was generated on ${format(new Date(), 'MMM dd, yyyy')} at ${format(new Date(), 'HH:mm')}</p>
        </div>
      </div>
    `;

    // Configure html2pdf options
    const options = {
      margin: 0.5,
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    // Generate and download PDF
    await html2pdf().set(options).from(element).save();
  };

  return { generatePDF };
};
