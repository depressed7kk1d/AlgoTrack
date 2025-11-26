import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const PDF_DIR = process.env.PDF_DIR || path.join(__dirname, '../../uploads/pdfs');

// Ensure directory exists
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

export async function generatePdf(html: string, reportId: string): Promise<string> {
  console.log(`📄 Generating PDF for report ${reportId}...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(PDF_DIR, `${reportId}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Return URL path (in production, this would be a public URL)
    const pdfUrl = `/uploads/pdfs/${reportId}.pdf`;
    console.log(`✅ PDF generated: ${pdfUrl}`);

    return pdfUrl;
  } catch (error: any) {
    await browser.close();
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}



