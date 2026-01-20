'use client';

export default function Error({ error, reset }: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold">Something went wrong!</h2>
                <button onClick={reset}>Try again</button>
            </div>
        </div>
    );
}