
import { useCurrency } from '@/hooks/useCurrency';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { Contact } from '@/types/contact';
import { Team } from '@/types/team';
import html2pdf from 'html2pdf.js';
import { loadImageAsBase64 } from '@/utils/imageUtils';
import { generateInvoicePDFTemplate } from './PDFTemplates/InvoicePDFTemplate';

interface PDFGeneratorOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  contact: Contact | undefined;
  company: Team | undefined;
}

export const useInvoicePDFGenerator = () => {
  const { formatCurrency } = useCurrency();

  const generatePDF = async ({ invoice, items, contact, company }: PDFGeneratorOptions) => {
    console.log('Generating PDF for invoice:', invoice.invoice_number);
    console.log('Company data:', company);
    
    // Load company logo as base64 if available
    let logoBase64 = null;
    if (company?.logo_url) {
      console.log('Company has logo URL:', company.logo_url);
      logoBase64 = await loadImageAsBase64(company.logo_url);
      if (logoBase64) {
        console.log('Logo successfully loaded as base64');
      } else {
        console.log('Failed to load logo as base64');
      }
    } else {
      console.log('No logo URL found for company');
    }

    // Create a temporary div element for the PDF content
    const element = document.createElement('div');
    element.innerHTML = generateInvoicePDFTemplate({
      invoice,
      items,
      contact,
      company,
      logoBase64,
      formatCurrency
    });

    // Configure html2pdf options
    const options = {
      margin: 0.5,
      filename: `Invoice-${invoice.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      },
      jsPDF: { 
        unit: 'in', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    console.log('Starting PDF generation with options:', options);

    // Generate and download PDF
    await html2pdf().set(options).from(element).save();
    
    console.log('PDF generation completed');
  };

  return { generatePDF };
};
