export function Container({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-w-md mx-auto px-6 py-12">
            {children}
        </div>
    );
}
