import pdfParse from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return data.text;
}
