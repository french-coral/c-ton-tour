import LegalLayout from "@/components/legal/LegalLayout";
import MarkdownRenderer from "@/components/legal/MarkdownRenderer";
import { getLegalDocumentByKey } from "@/lib/legal";

export default function AcceptableUsePage() {
    const { meta, content } = getLegalDocumentByKey("acceptableUse");

    return (
        <LegalLayout
            title={meta.title}
            lastUpdated={meta.last_updated}
        >
            <MarkdownRenderer content={content} />
        </LegalLayout>
    );
}