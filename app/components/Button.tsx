type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = "", ...props }: Props) {
    return (
        <button
            className={`
                h-11 px-6
                rounded-lg
                bg-black text-white
                text-sm font-medium
                hover:bg-neutral-800
                active:scale-[0.99]
                transition
                ${className}
            `}
            {...props}
        />
    );
}
