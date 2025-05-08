import { PrismaClient } from '@prisma/client';
import { TaxFormCreate, TaxFormResponse, TaxFormType } from '@/lib/schemas/taxForm';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

/**
 * Service for managing tax forms
 */
export class TaxFormService {
  /**
   * Create a new tax form record
   */
  static async createTaxForm(data: TaxFormCreate): Promise<TaxFormResponse> {
    const taxForm = await prisma.taxForm.create({
      data: {
        userId: data.userId,
        year: data.year,
        type: data.type as any, // Cast to match Prisma enum
      },
    });

    return {
      id: taxForm.id,
      userId: taxForm.userId,
      year: taxForm.year,
      type: taxForm.type as TaxFormType,
      pdfUrl: taxForm.pdfUrl,
      generatedAt: taxForm.generatedAt,
    };
  }

  /**
   * List tax forms matching the query criteria
   */
  static async listTaxForms(userId: string, year?: number, type?: TaxFormType) {
    const taxForms = await prisma.taxForm.findMany({
      where: {
        userId,
        ...(year && { year }),
        ...(type && { type }),
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    return taxForms.map((form) => ({
      id: form.id,
      userId: form.userId,
      year: form.year,
      type: form.type as TaxFormType,
      pdfUrl: form.pdfUrl,
      generatedAt: form.generatedAt,
    }));
  }

  /**
   * Get a tax form by ID
   */
  static async getTaxForm(id: string) {
    const taxForm = await prisma.taxForm.findUnique({
      where: { id },
    });

    if (!taxForm) {
      throw new Error('Tax form not found');
    }

    return {
      id: taxForm.id,
      userId: taxForm.userId,
      year: taxForm.year,
      type: taxForm.type as TaxFormType,
      pdfUrl: taxForm.pdfUrl,
      generatedAt: taxForm.generatedAt,
    };
  }

  /**
   * Generate a PDF for a tax form
   */
  static async generatePdf(taxFormId: string, data: Record<string, any>): Promise<string> {
    // Get the tax form record
    const taxForm = await prisma.taxForm.findUnique({
      where: { id: taxFormId },
      include: {
        user: true,
      },
    });

    if (!taxForm) {
      throw new Error('Tax form not found');
    }

    // Create directory for tax forms if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'tax-forms');
    await mkdir(uploadDir, { recursive: true });

    // Define the output file path
    const fileName = `${taxForm.id}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const publicUrl = `/tax-forms/${fileName}`;

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);

    // Generate PDF based on tax form type
    this.generateTaxFormContent(doc, taxForm, data);

    // Finalize the PDF and close the stream
    doc.end();

    // Update the tax form with the PDF URL
    await prisma.taxForm.update({
      where: { id: taxFormId },
      data: { pdfUrl: publicUrl },
    });

    return publicUrl;
  }

  /**
   * Generate content for different tax form types
   */
  private static generateTaxFormContent(
    doc: PDFKit.PDFDocument, 
    taxForm: any, 
    data: Record<string, any>
  ) {
    // Add header with logo and title
    doc.fontSize(20).text(`${taxForm.type} - ${taxForm.year}`, { align: 'center' });
    doc.moveDown();
    
    // Add timestamp
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Add user information
    doc.fontSize(12).text(`Name: ${taxForm.user.name || 'N/A'}`);
    doc.text(`Email: ${taxForm.user.email || 'N/A'}`);
    doc.moveDown();

    // Add section divider
    doc.moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();
    doc.moveDown();

    // Add content based on tax form type
    switch (taxForm.type) {
      case 'US_1099':
        this.generate1099Content(doc, data);
        break;
      case 'EU_VAT':
        this.generateEuVatContent(doc, data);
        break;
      case 'OTHER':
        this.generateOtherContent(doc, data);
        break;
      default:
        doc.text('This tax form type is not supported.');
    }

    // Add footer
    doc.fontSize(10);
    const footerY = doc.page.height - 50;
    doc.text('This is an automatically generated document.', 50, footerY, { align: 'center' });
  }

  /**
   * Generate content for US 1099 tax forms
   */
  private static generate1099Content(doc: PDFKit.PDFDocument, data: Record<string, any>) {
    doc.fontSize(16).text('1099 MISC Form', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Payer Information:');
    doc.fontSize(10);
    doc.text(`Name: ${data.payerName || 'OFAuto Inc.'}`);
    doc.text(`Address: ${data.payerAddress || '123 Creator Street, San Francisco, CA 94103'}`);
    doc.text(`Tax ID: ${data.payerTaxId || '12-3456789'}`);
    doc.moveDown();

    doc.fontSize(12).text('Recipient Information:');
    doc.fontSize(10);
    doc.text(`Name: ${data.recipientName || 'N/A'}`);
    doc.text(`Address: ${data.recipientAddress || 'N/A'}`);
    doc.text(`Tax ID: ${data.recipientTaxId || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(12).text('Payment Information:');
    doc.fontSize(10);
    doc.text(`Box 1 - Rents: $${data.rents || '0.00'}`);
    doc.text(`Box 2 - Royalties: $${data.royalties || '0.00'}`);
    doc.text(`Box 3 - Other Income: $${data.otherIncome || '0.00'}`);
    doc.text(`Box 4 - Federal Tax Withheld: $${data.federalTax || '0.00'}`);
    doc.text(`Box 7 - Nonemployee Compensation: $${data.nonemployeeCompensation || '0.00'}`);
    doc.moveDown();

    // Add disclaimer
    doc.fontSize(9).text('This is an information document. These amounts should be reported on your income tax return.', { align: 'center' });
  }

  /**
   * Generate content for EU VAT tax forms
   */
  private static generateEuVatContent(doc: PDFKit.PDFDocument, data: Record<string, any>) {
    doc.fontSize(16).text('EU VAT Record', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Business Information:');
    doc.fontSize(10);
    doc.text(`Business Name: ${data.businessName || 'OFAuto Europe Ltd.'}`);
    doc.text(`VAT Number: ${data.vatNumber || 'N/A'}`);
    doc.text(`Address: ${data.businessAddress || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(12).text('VAT Summary:');
    doc.fontSize(10);
    doc.text(`Reporting Period: ${data.reportingPeriod || 'N/A'}`);
    doc.text(`Total Sales (Excl. VAT): €${data.totalSales || '0.00'}`);
    doc.text(`Total VAT Collected: €${data.totalVatCollected || '0.00'}`);
    doc.text(`Total VAT Paid on Purchases: €${data.totalVatPaid || '0.00'}`);
    doc.text(`Net VAT Payable: €${data.netVatPayable || '0.00'}`);
    doc.moveDown();

    // Add disclaimer
    doc.fontSize(9).text('This document is for informational purposes only and should be verified with your tax authority.', { align: 'center' });
  }

  /**
   * Generate content for other tax forms
   */
  private static generateOtherContent(doc: PDFKit.PDFDocument, data: Record<string, any>) {
    doc.fontSize(16).text('Tax Income Summary', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Income Information:');
    doc.fontSize(10);
    doc.text(`Total Income: ${data.currency || '$'}${data.totalIncome || '0.00'}`);
    doc.text(`Platform Fees: ${data.currency || '$'}${data.platformFees || '0.00'}`);
    doc.text(`Net Income: ${data.currency || '$'}${data.netIncome || '0.00'}`);
    doc.moveDown();

    if (data.incomeBreakdown && Array.isArray(data.incomeBreakdown)) {
      doc.fontSize(12).text('Income Breakdown:');
      doc.fontSize(10);
      
      data.incomeBreakdown.forEach((item: any) => {
        doc.text(`${item.category || 'Other'}: ${data.currency || '$'}${item.amount || '0.00'}`);
      });
      doc.moveDown();
    }

    // Add disclaimer
    doc.fontSize(9).text('This is a summary document. Please consult with a tax professional for guidance on reporting.', { align: 'center' });
  }
} 