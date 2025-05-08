"use client";

export default function GlobalError({ 
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h2>
            <p className="text-gray-700 mb-6">
              An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
            </p>
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded text-left text-sm mb-6 overflow-auto max-h-40">
              <p><strong>Error:</strong> {error.message}</p>
              {error.digest && <p className="mt-1"><strong>Digest:</strong> {error.digest}</p>}
            </div>
            <button 
              onClick={() => reset()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 