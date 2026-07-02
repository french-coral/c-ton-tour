import LegalLayout from "@/components/legal/LegalLayout";
import MarkdownRenderer from "@/components/legal/MarkdownRenderer";
import { getLegalDocumentByKey } from "@/lib/legal";

export default function CookiesPage() {
    const { meta, content } = getLegalDocumentByKey("cookies");

    return (
        <LegalLayout
            title={meta.title}
            lastUpdated={meta.last_updated}
        >
            <MarkdownRenderer content={content} />
        </LegalLayout>
    );
}