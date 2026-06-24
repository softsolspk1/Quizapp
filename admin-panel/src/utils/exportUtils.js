import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF
 * @param {string} title - Title of the document
 * @param {Array<string>} headers - Array of column headers
 * @param {Array<Array<any>>} data - Array of data rows (each row is an array of values)
 */
export const exportToPDF = (title, headers, data) => {
  const doc = new jsPDF();
  
  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add timestamp
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Create table
  doc.autoTable({
    startY: 36,
    head: [headers],
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] } // primary-600 color
  });
  
  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

/**
 * Export data to Excel
 * @param {string} title - Title of the document
 * @param {Array<string>} headers - Array of column headers
 * @param {Array<Array<any>>} data - Array of data rows (each row is an array of values)
 */
export const exportToExcel = (title, headers, data) => {
  // Combine headers and data
  const worksheetData = [headers, ...data];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
};
