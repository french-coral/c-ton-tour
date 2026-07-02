

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const LEGAL_DIR = path.join(process.cwd(), "src/content/legal");

// Get a legal document by filename (without extension)
// Example: "privacy-policy"

export function getLegalDocument(slug) {
    const filePath = path.join(LEGAL_DIR, `${slug}.md`);

    const fileContent = fs.readFileSync(filePath, "utf8");

    const { data, content } = matter(fileContent);

    return {
        meta: data,
        content
    };
}


// Convenience mapper (optional but clean)
export const LEGAL_DOCS = {
    terms: "terms-of-use",
    privacy: "privacy-policy",
    cookies: "cookie-policy",
    acceptableUse: "acceptable-use-policy",
    legalNotice: "legal-notice",
    openSource: "open-source-and-branding",
    cookieBanner: "cookie-banner"
};


// Get document using logical key
export function getLegalDocumentByKey(key) {
    const slug = LEGAL_DOCS[key];
    if (!slug) throw new Error(`Unknown legal document: ${key}`);
    return getLegalDocument(slug);
}