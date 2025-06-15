
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
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          ${company?.logo_url ? `<img src="${company.logo_url}" alt="Company Logo" style="max-height: 80px; margin-bottom: 10px;">` : ''}
          <h1 style="color: #333; margin-bottom: 5px; font-size: 28px;">${company?.company_legal_name || company?.name || 'Company Name'}</h1>
          ${company?.company_address ? `<p style="margin: 2px 0; font-size: 12px;">${company.company_address}</p>` : ''}
          ${company?.city ? `<p style="margin: 2px 0; font-size: 12px;">${company.city}${company.state ? `, ${company.state}` : ''} ${company.postal_code || ''}</p>` : ''}
          ${company?.country ? `<p style="margin: 2px 0; font-size: 12px;">${company.country}</p>` : ''}
          ${company?.company_phone ? `<p style="margin: 2px 0; font-size: 12px;">Phone: ${company.company_phone}</p>` : ''}
          ${company?.company_email ? `<p style="margin: 2px 0; font-size: 12px;">Email: ${company.company_email}</p>` : ''}
          ${company?.website ? `<p style="margin: 2px 0; font-size: 12px;">Website: ${company.website}</p>` : ''}
          ${company?.tax_id ? `<p style="margin: 2px 0; font-size: 12px;">Tax ID: ${company.tax_id}</p>` : ''}
        </div>

        <!-- Invoice Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 10px; font-size: 24px;">INVOICE</h2>
          <h3 style="color: #333; margin-bottom: 10px;">${invoice.invoice_number}</h3>
          <p style="margin: 5px 0;">Created: ${format(new Date(invoice.created_at), 'MMM dd, yyyy')}</p>
          ${invoice.due_date ? `<p style="margin: 5px 0;">Due: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Bill To:</h3>
          <div style="margin-top: 10px;">
            <p style="margin: 3px 0; font-weight: bold;">${contact?.name || 'N/A'}</p>
            ${contact?.phone_number ? `<p style="margin: 3px 0;">${contact.phone_number}</p>` : ''}
            ${contact?.email ? `<p style="margin: 3px 0;">${contact.email}</p>` : ''}
            ${contact?.company ? `<p style="margin: 3px 0;">${contact.company}</p>` : ''}
            ${contact?.address ? `<p style="margin: 3px 0;">${contact.address}</p>` : ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.unit_price)}</td>
                <td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <div style="display: inline-block; min-width: 200px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.tax_rate && invoice.tax_rate > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Tax (${invoice.tax_rate}%):</span>
                <span>${formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; font-size: 18px;">
              <span>Total:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Notes:</h3>
            <p style="line-height: 1.5;">${invoice.notes}</p>
          </div>
        ` : ''}

        ${company?.bank_name ? `
          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
            <h3 style="color: #333; margin-bottom: 10px;">Payment Information:</h3>
            <p style="margin: 3px 0;"><strong>Bank:</strong> ${company.bank_name}</p>
            ${company.bank_account ? `<p style="margin: 3px 0;"><strong>Account:</strong> ${company.bank_account}</p>` : ''}
            ${company.bank_account_holder ? `<p style="margin: 3px 0;"><strong>Account Holder:</strong> ${company.bank_account_holder}</p>` : ''}
            ${company.swift_code ? `<p style="margin: 3px 0;"><strong>SWIFT:</strong> ${company.swift_code}</p>` : ''}
          </div>
        ` : ''}
      </div>
    `;

    // Configure html2pdf options
    const options = {
      margin: 1,
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate and download PDF
    await html2pdf().set(options).from(element).save();
  };

  return { generatePDF };
};
