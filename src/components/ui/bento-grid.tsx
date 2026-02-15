import { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlowingEffect } from "./glowing-effect";

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
                "grid w-full auto-rows-auto md:auto-rows-[26rem] grid-cols-1 md:grid-cols-3 gap-4",
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
            "group relative col-span-1 flex flex-col justify-between rounded-3xl",
            className
        )}
        {...props}
    >
        {/* ── Glowing Effect Wrapper ──
            This is the outer shell that the GlowingEffect paints on.
            It has padding (p-2) so the glow border is visible between
            the outer edge and the inner content card.
            It must NOT have overflow-hidden so the glow can render. */}
        <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-white/[0.08] p-2 md:rounded-[1.5rem] md:p-3">
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
            />

            {/* ── Inner Content Card ──
                This sits inside the padded wrapper and holds the actual content.
                It has its own background, border, and visual styles. */}
            <div
                className={cn(
                    "glass3d relative flex h-full flex-col justify-between overflow-hidden rounded-xl",
                    "transform-gpu",
                    "[border:0.75px_solid_rgba(255,255,255,0.07)]",
                    "transition-all duration-500 hover:[border:0.75px_solid_rgba(255,255,255,0.14)]"
                )}
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
        </div>
    </div>
);

export { BentoCard, BentoGrid };
