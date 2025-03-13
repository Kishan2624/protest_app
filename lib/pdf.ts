import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePetitionPDF(petitionData: any) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  
  // Add header
  pdf.setFontSize(20);
  pdf.text('DSEU Student Petition for AICTE Approval', width / 2, 20, { align: 'center' });
  
  // Add petition details
  pdf.setFontSize(12);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  pdf.text('To,', 20, 50);
  pdf.text('The Chairman', 20, 60);
  pdf.text('All India Council for Technical Education (AICTE)', 20, 70);
  pdf.text('Nelson Mandela Marg, Vasant Kunj', 20, 80);
  pdf.text('New Delhi - 110070', 20, 90);
  
  pdf.text('Subject: Request for AICTE Approval for DSEU Diploma Programs', 20, 110);
  
  // Add petition content
  pdf.setFontSize(11);
  let y = 130;
  const text = `We, the undersigned students of Delhi Skill and Entrepreneurship University (DSEU), 
  are writing to express our urgent concern regarding the lack of AICTE approval for our diploma programs. 
  This situation significantly impacts our educational and career prospects.`;
  
  const splitText = pdf.splitTextToSize(text, width - 40);
  pdf.text(splitText, 20, y);
  
  // Add statistics
  y += splitText.length * 7 + 20;
  pdf.text(`Total Signatures: ${petitionData.totalSignatures}`, 20, y);
  y += 10;
  pdf.text(`Verified Signatures: ${petitionData.verifiedSignatures}`, 20, y);
  y += 10;
  pdf.text(`Colleges Represented: ${petitionData.collegeCount}`, 20, y);
  
  // Add footer
  pdf.setFontSize(10);
  pdf.text('Generated via DSEU Student Voice Platform', width / 2, 280, { align: 'center' });
  
  return pdf;
}