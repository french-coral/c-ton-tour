
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                    <p className="text-gray-800 leading-relaxed mb-4" {...props} />
                ),
                ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-4" {...props} />
                ),
                li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                ),
                a: ({ node, ...props }) => (
                    <a className="text-blue-600 underline" {...props} />
                ),
                code: ({ node, ...props }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />
                )
            }}
        >
            {content}
        </ReactMarkdown>
    );
}