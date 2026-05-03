import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DistributionResult } from '../types';
import { PARTS_MAP } from '../constants/parts';

/**
 * Generate an HTML card for a single customer's distribution result
 */
function generateCustomerCardHtml(result: DistributionResult): string {
  const receivedParts = result.parts.filter(p => p.received);
  
  const receivedPartsByCow = receivedParts.reduce((acc, part) => {
    let sourceCow = result.cowName;
    let displayNote = part.note;
    
    if (part.note && part.note.startsWith('من ')) {
      sourceCow = part.note.replace('من ', '');
      displayNote = undefined;
    }
    
    if (!acc[sourceCow]) {
      acc[sourceCow] = [];
    }
    acc[sourceCow].push({ ...part, note: displayNote });
    return acc;
  }, {} as Record<string, typeof receivedParts>);

  const cowSectionsHtml = Object.entries(receivedPartsByCow).map(([cowName, parts]) => `
    <div style="margin-bottom: 16px;">
      <h3 style="color: #059669; border-bottom: 2px solid #D1FAE5; padding-bottom: 8px;">✅ استلم من: ${cowName}</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${parts.map(p => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px; font-size: 16px; width: 50%;">${PARTS_MAP[p.partKey]?.icon || ''} ${p.label}</td>
            <td style="padding: 8px; text-align: left; color: #059669; font-weight: bold; width: 25%;">
              ${p.weight ? `${p.weight} كجم` : 'نعم'}
            </td>
            <td style="padding: 8px; text-align: left; color: #6B7280; font-size: 12px; width: 25%;">
              ${p.note || ''}
            </td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('');

  return `
    <div style="page-break-after: always; padding: 20px; font-family: 'Arial', sans-serif; direction: rtl;">
      <div style="border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #059669; margin: 0; font-size: 24px;">🐄 بطاقة حصة الأضحية</h1>
          <p style="color: #666; margin-top: 8px; font-size: 14px;">عيد الأضحى المبارك ${new Date().getFullYear()}</p>
        </div>
        
        <!-- Customer Info -->
        <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="margin: 0 0 8px; color: #064E3B; font-size: 18px;">👤 ${result.customerName}</h2>
          <p style="margin: 4px 0; color: #065F46;">🐄 البقرة المخصصة: ${result.cowName}</p>
        </div>
        
        <!-- Received Parts Grouped By Cow -->
        ${cowSectionsHtml}
        
        <!-- Footer -->
        <div style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #D1D5DB;">
          <p>تم التوزيع بتاريخ: ${new Date(result.createdAt).toLocaleDateString('ar-EG')}</p>
          <p>تقبل الله منا ومنكم 🤲</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generate full PDF HTML with all customer cards
 */
function generateFullPdfHtml(results: DistributionResult[]): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; direction: rtl; }
        @media print {
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      ${results.map(r => generateCustomerCardHtml(r)).join('')}
    </body>
    </html>
  `;
}

/**
 * Export distribution results to PDF and share
 */
export async function exportToPdf(results: DistributionResult[]): Promise<void> {
  const html = generateFullPdfHtml(results);
  
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'تصدير نتائج التوزيع',
    UTI: 'com.adobe.pdf',
  });
}

/**
 * Export a single customer's card to PDF
 */
export async function exportCustomerCard(result: DistributionResult): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; direction: rtl; }
      </style>
    </head>
    <body>
      ${generateCustomerCardHtml(result)}
    </body>
    </html>
  `;
  
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `بطاقة ${result.customerName}`,
    UTI: 'com.adobe.pdf',
  });
}

/**
 * Generate cow summary HTML
 */
export async function exportCowSummary(
  cowName: string,
  results: DistributionResult[]
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; direction: rtl; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 8px; border: 1px solid #D1D5DB; text-align: right; }
        th { background: #059669; color: white; }
      </style>
    </head>
    <body>
      <h1 style="color: #059669; text-align: center; margin-bottom: 20px;">
        🐄 ملخص توزيع: ${cowName}
      </h1>
      <table>
        <thead>
          <tr>
            <th>المشترك</th>
            <th>الأجزاء المستلمة</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td><strong>${r.customerName}</strong></td>
              <td>${r.parts.filter(p => p.received).map(p => 
                `${p.label}${p.weight ? ` (${p.weight} كجم)` : ''}`
              ).join('، ')}</td>
              <td>${r.parts.filter(p => p.note).map(p => p.note).join('، ') || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="text-align: center; color: #9CA3AF; margin-top: 20px;">
        تم التوزيع بتاريخ: ${new Date().toLocaleDateString('ar-EG')}
      </p>
    </body>
    </html>
  `;
  
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `ملخص ${cowName}`,
    UTI: 'com.adobe.pdf',
  });
}

/**
 * Export delivery report as PDF and share it
 */
export async function exportDeliveryCard(result: DistributionResult): Promise<void> {
  try {
    const receivedParts = result.parts.filter(p => p.received);
    const receivedPartsByCow = receivedParts.reduce((acc, part) => {
      let sourceCow = result.cowName;
      let displayNote = part.note;
      
      if (part.note && part.note.startsWith('من ')) {
        sourceCow = part.note.replace('من ', '');
        displayNote = undefined;
      }
      
      if (!acc[sourceCow]) {
        acc[sourceCow] = [];
      }
      acc[sourceCow].push({ ...part, note: displayNote });
      return acc;
    }, {} as Record<string, typeof receivedParts>);

    const cowSectionsHtml = Object.entries(receivedPartsByCow).map(([cowName, parts]) => `
      <div style="margin-bottom: 16px;">
        <h3 style="color: #059669; border-bottom: 2px solid #D1FAE5; padding-bottom: 8px;">🐄 استلم من: ${cowName}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${parts.map(p => `
            <tr style="border-bottom: 1px solid #E5E7EB; background-color: ${p.delivered ? '#F0FDF4' : '#FFFBEB'};">
              <td style="padding: 10px; font-size: 16px; width: 40%;">${PARTS_MAP[p.partKey]?.icon || ''} ${p.label}</td>
              <td style="padding: 10px; text-align: center; font-weight: bold; width: 30%; color: ${p.delivered ? '#059669' : '#D97706'};">
                ${p.delivered ? '✅ تم التسليم' : '⏳ لسة بيجهز'}
              </td>
              <td style="padding: 10px; text-align: left; color: #6B7280; font-size: 12px; width: 30%;">
                ${p.weight ? `${p.weight} كجم` : ''}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `).join('');

    const html = `
      <div style="padding: 20px; font-family: 'Arial', sans-serif; direction: rtl;">
        <div style="border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #059669; margin: 0; font-size: 24px;">🚚 تقرير التوصيل</h1>
            <p style="color: #666; margin-top: 8px; font-size: 14px;">متابعة حالة الأجزاء</p>
          </div>
          
          <!-- Customer Info -->
          <div style="background: #F3F4F6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h2 style="margin: 0 0 8px; color: #1F2937; font-size: 18px;">👤 ${result.customerName}</h2>
            <p style="margin: 4px 0; color: #4B5563;">🐄 البقرة المخصصة: ${result.cowName}</p>
          </div>
          
          <!-- Parts Status -->
          ${cowSectionsHtml}
          
          <!-- Footer -->
          <div style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px; padding-top: 16px; border-top: 1px dashed #D1D5DB;">
            <p>تم الإنشاء بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            <p>تقبل الله منا ومنكم 🤲</p>
          </div>
        </div>
      </div>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'مشاركة تقرير التوصيل',
    });
  } catch (error) {
    console.error('Error exporting delivery card to PDF:', error);
    throw error;
  }
}

/**
 * Export customer-facing delivery receipt (no cow name, includes phone/address)
 */
export async function exportCustomerReceiptPdf(result: DistributionResult, customer: any): Promise<void> {
  try {
    const receivedParts = result.parts.filter(p => p.received);
    
    const partsHtml = receivedParts.map(p => `
      <tr style="border-bottom: 1px solid #E5E7EB; background-color: ${p.delivered ? '#F0FDF4' : '#FFFBEB'};">
        <td style="padding: 12px; font-size: 16px; width: 40%;">${PARTS_MAP[p.partKey]?.icon || ''} ${p.label}</td>
        <td style="padding: 12px; text-align: center; font-weight: bold; width: 30%; color: ${p.delivered ? '#059669' : '#D97706'};">
          ${p.delivered ? '✅ استلمت' : '⏳ يجهز'}
        </td>
        <td style="padding: 12px; text-align: left; color: #6B7280; font-size: 14px; width: 30%;">
          ${p.weight ? `${p.weight} كجم` : ''}
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="padding: 20px; font-family: 'Arial', sans-serif; direction: rtl;">
        <div style="border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #059669; margin: 0; font-size: 26px;">🧾 إيصال الأضحية</h1>
            <p style="color: #666; margin-top: 8px; font-size: 15px;">عيد الأضحى المبارك ${new Date().getFullYear()}</p>
          </div>
          
          <!-- Customer Info -->
          <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #E2E8F0;">
            <h2 style="margin: 0 0 12px; color: #1E293B; font-size: 20px;">👤 ${customer.name}</h2>
            ${customer.phone ? `<p style="margin: 6px 0; color: #475569; font-size: 15px;">📱 رقم الهاتف: ${customer.phone}</p>` : ''}
            ${customer.address ? `<p style="margin: 6px 0; color: #475569; font-size: 15px;">📍 العنوان: ${customer.address}</p>` : ''}
          </div>
          
          <!-- Parts Status -->
          <div style="margin-bottom: 24px;">
            <h3 style="color: #059669; border-bottom: 2px solid #D1FAE5; padding-bottom: 8px; margin-bottom: 12px;">🥩 تفاصيل الأجزاء</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${partsHtml}
            </table>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; color: #9CA3AF; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #E5E7EB;">
            <p style="margin-bottom: 8px;">تاريخ الإيصال: ${new Date().toLocaleDateString('ar-EG')}</p>
            <p style="font-weight: bold; color: #059669; font-size: 16px;">تقبل الله منا ومنكم صالح الأعمال 🤲</p>
          </div>
        </div>
      </div>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'إرسال للمشترك',
    });
  } catch (error) {
    console.error('Error exporting customer receipt to PDF:', error);
    throw error;
  }
}
