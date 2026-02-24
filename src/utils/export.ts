import * as XLSX from 'xlsx';
import { ProcessedImage } from '../types';

export function exportToExcel(images: ProcessedImage[], filename: string = 'Bus_Shelter_Light_Validation_Report.xlsx') {
  const data = images.map((img) => ({
    'Folder Name': img.folderName,
    'Image Name': img.name,
    'AI Result (On/Off)': img.aiResult ? (img.aiResult.lightsOn ? 'ON' : 'OFF') : 'N/A',
    'AI Confidence (%)': img.aiResult ? (img.aiResult.confidence * 100).toFixed(2) : 'N/A',
    'AI Explanation': img.aiResult ? img.aiResult.explanation : 'N/A',
    'Human Override': img.humanOverride !== null ? (img.humanOverride ? 'ON' : 'OFF') : 'N/A',
    'Final Status': img.finalStatus !== null ? (img.finalStatus ? 'ON' : 'OFF') : 'N/A',
    'Validation Status': img.validationStatus,
    'Image ID': img.id,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Report');

  // Auto-size columns
  const wscols = [
    { wch: 20 }, // Folder Name
    { wch: 30 }, // Image Name
    { wch: 15 }, // AI Result
    { wch: 15 }, // AI Confidence
    { wch: 50 }, // AI Explanation
    { wch: 15 }, // Human Override
    { wch: 15 }, // Final Status
    { wch: 15 }, // Validation Status
    { wch: 35 }, // Image ID
  ];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, filename);
}
