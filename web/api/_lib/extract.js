/**
 * Extract plain text from PDF / DOCX uploads.
 *
 * .doc (legacy binary) is not supported on Vercel serverless — its
 * extractor (`word-extractor`) requires file-path I/O and reliable native
 * deps that don't bundle cleanly. Reject .doc and instruct the user to
 * save as .docx.
 */
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

const MIME_PDF = "application/pdf";
const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MIME_DOC = "application/msword";

export async function extractText(buffer, mimeType) {
  if (mimeType === MIME_PDF) {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimeType === MIME_DOCX) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (mimeType === MIME_DOC) {
    throw new Error("LEGACY_DOC");
  }
  throw new Error(`UNSUPPORTED_TYPE:${mimeType}`);
}

export const SUPPORTED_MIME_TYPES = [MIME_PDF, MIME_DOCX];
