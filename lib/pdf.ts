import { jsPDF } from 'jspdf';


interface PetitionData {
  fullName: string;
  collegeName: string;
  rollNumber: string;
  email: string;
  phoneNumber: string;
  problemDescription: string;
  profileUrl: string;
  signatureUrl: string;
  aadharUrl: string;
  createdAt: string;
}

export async function generatePetitionPDF(data: PetitionData) {
  console.log(data);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const startY = margin + 15; // Ensure both sections start at the same height
  let yPosition = startY;
  const headingY = margin; // Position of heading

   // **Heading - Centered at the Top**
  const headingText = 'DSEU STUDENT PETITION';
  pdf.setFontSize(20);
  pdf.text(headingText, pageWidth / 2, headingY, { align: 'center' });

  // **Underline the Heading**
  const textWidth = pdf.getTextWidth(headingText);
  const underlineY = headingY + 2; // Small gap below text
  pdf.line((pageWidth - textWidth) / 2, underlineY, (pageWidth + textWidth) / 2, underlineY);

  // **Right Side - Profile Image (Aligned with Left-Side Content)**
  try {
    const img = new Image();
    img.src = data.profileUrl;
    await new Promise((resolve) => (img.onload = resolve));
    // Detect image format from URL extension
const imageType = data.aadharUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';

    const imgWidth = 40;
    const imgHeight = (img.height * imgWidth) / img.width;
    pdf.addImage(img.src, imageType, pageWidth - margin - imgWidth, startY, imgWidth, imgHeight);
  } catch (error) {
    console.error('Error loading profile image:', error);
  }

  // **Left Side - Student Details & Problems (Same yPosition as Profile)**
  pdf.setFontSize(12);
  const details = [
    `Name: ${data.fullName}`,
    `College: ${data.collegeName}`,
    `Roll Number: ${data.rollNumber}`,
    `Email: ${data.email}`,
    `Phone: ${data.phoneNumber}`,
    `Date: ${new Date(data.createdAt).toLocaleDateString()}`,
  ];

  details.forEach(detail => {
    pdf.text(detail, margin, yPosition);
    yPosition += 8;
  });

  yPosition += 10;
  pdf.setFontSize(14);
  pdf.text('Problem Description:', margin, yPosition);
  yPosition += 10;
  pdf.setFontSize(12);

  const addWrappedText = (text: string, y: number) => {
    const splitText = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    pdf.text(splitText, margin, y);
    return y + (splitText.length * 7);
  };

  yPosition = addWrappedText(data.problemDescription, yPosition);

  // **Signature Image Below Details**
  yPosition += 10;
  try {
    const signatureImg = new Image();
    signatureImg.src = data.signatureUrl;
    await new Promise((resolve) => (signatureImg.onload = resolve));
    // Detect image format from URL extension
    const imageType = data.aadharUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';

    const signWidth = 60;
    const signHeight = (signatureImg.height * signWidth) / signatureImg.width;
    
    pdf.addImage(signatureImg.src, imageType, margin, yPosition, signWidth, signHeight);
    
    // Adjust yPosition to place the text below the signature image
    yPosition += signHeight + 10; // Adding 10mm spacing after image

    pdf.text('Signature', margin + signWidth / 3, yPosition);
  } catch (error) {
    console.error('Error loading signature:', error);
  } 

  // **Next Page - Aadhar Card**
  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text('Identity Verification Document', pageWidth / 2, margin, { align: 'center' });

  try {
    const aadharImg = new Image();
      aadharImg.src = data.aadharUrl;
      await new Promise((resolve) => (aadharImg.onload = resolve));

      // Detect image format from URL extension
      const imageType = data.aadharUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';

      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = pageHeight - 3 * margin;
      let imgWidth = aadharImg.width;
      let imgHeight = aadharImg.height;

      if (imgWidth > maxWidth) {
        const ratio = maxWidth / imgWidth;
        imgWidth *= ratio;
        imgHeight *= ratio;
      }
      if (imgHeight > maxHeight) {
        const ratio = maxHeight / imgHeight;
        imgWidth *= ratio;
        imgHeight *= ratio;
      }

      const xPos = (pageWidth - imgWidth) / 2;
      pdf.addImage(aadharImg.src, imageType, xPos, margin + 20, imgWidth, imgHeight);
    
  } catch (error) {
    console.error('Error loading Aadhar card:', error);
    pdf.text('Error loading identity document', margin, margin + 40);
  }

  return pdf;
}


