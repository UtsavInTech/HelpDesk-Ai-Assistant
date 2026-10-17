import { PDFParse } from "pdf-parse";

//keep a lid on how much of a document we are willing to carry into every prompt
export const MAX_DOC_CHARS = 12000;

/**
 * Pull the plain text out of a PDF buffer.
 * Throws a readable message for the cases users actually hit
 * (password protected, corrupt, or a scan with no text layer).
 */
export const extractPdfText = async (buffer) => {
    let parser;

    try {
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();

        const text = (result.text || "")
            //drop the "-- 1 of 3 --" page separators pdf-parse adds
            .replace(/^--\s*\d+\s+of\s+\d+\s*--$/gm, "")
            .replace(/[ \t]+\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        if(!text) {
            throw new Error("No readable text found in this PDF. Scanned or image-only PDFs are not supported yet.");
        }

        return {
            text: text.slice(0, MAX_DOC_CHARS),
            pages: result.total ?? 0,
            truncated: text.length > MAX_DOC_CHARS
        };
    } catch(err) {
        if(err?.name === "PasswordException") {
            throw new Error("This PDF is password protected.");
        }
        if(err?.name === "InvalidPDFException") {
            throw new Error("This file is not a valid PDF.");
        }
        throw err;
    } finally {
        await parser?.destroy?.();
    }
};
