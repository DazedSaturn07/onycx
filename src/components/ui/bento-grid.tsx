import { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
    children: ReactNode;
    className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
    name: string;
    className?: string;
    background?: ReactNode;
    Icon?: React.ElementType;
    description?: string;
    children?: ReactNode;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
    return (
        <div
            className={cn(
                "grid w-full auto-rows-auto md:auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const BentoCard = ({
    name,
    className,
    background,
    Icon,
    description,
    children,
    ...props
}: BentoCardProps) => (
    <div
        className={cn(
            "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl",
            // Dark theme glassmorphism
            "transform-gpu backdrop-blur-xl",
            "[background:rgba(255,255,255,0.03)]",
            "[box-shadow:0_-20px_80px_-20px_rgba(255,255,255,0.06)_inset,0_8px_32px_rgba(0,0,0,0.3)]",
            "[border:1px_solid_rgba(255,255,255,0.07)]",
            "transition-all duration-500 hover:[border:1px_solid_rgba(255,255,255,0.14)]",
            className
        )}
        {...props}
    >
        {/* Background slot (animated patterns, images, etc) */}
        <div>{background}</div>

        {/* Custom children OR default Icon/name/description layout */}
        {children ? (
            children
        ) : (
            <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
                {Icon && (
                    <Icon className="h-12 w-12 origin-left transform-gpu text-white/60 transition-all duration-300 ease-in-out group-hover:scale-90 group-hover:text-white/80" />
                )}
                <h3 className="text-xl font-headline font-bold text-white/90">
                    {name}
                </h3>
                <p className="max-w-lg text-white/40">{description}</p>
            </div>
        )}

        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-white/[0.02]" />
    </div>
);

export { BentoCard, BentoGrid };
