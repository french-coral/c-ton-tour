
export default function LegalLayout({ title, lastUpdated, children }) {

    const formattedDate =
        lastUpdated instanceof Date
            ? lastUpdated.toISOString().split("T")[0]
            : lastUpdated;

    return (
        <div className="min-h-screen bg-white text-gray-900 px-6 py-12">
            <div className="max-w-3xl mx-auto">

                <header className="mb-10 border-b pb-6">
                    <h1 className="text-3xl font-bold">{title}</h1>

                    {formattedDate && (
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {formattedDate}
                        </p>
                    )}
                </header>

                <article className="prose prose-gray max-w-none">
                    {children}
                </article>

                <footer className="mt-12 pt-6 border-t text-sm text-gray-500">
                    This document is part of the legal framework of C-Ton-Tour.
                </footer>

            </div>
        </div>
    );
}