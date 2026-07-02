import LegalLayout from "@/components/legal/LegalLayout";
import MarkdownRenderer from "@/components/legal/MarkdownRenderer";
import { getLegalDocumentByKey } from "@/lib/legal";

export default function OpenSourcePage() {
    const { meta, content } = getLegalDocumentByKey("openSource");

    return (
        <LegalLayout
            title={meta.title}
            lastUpdated={meta.last_updated}
        >
            <MarkdownRenderer content={content} />
        </LegalLayout>
    );
}