import { Lora } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  weight: "700",
  fallback: ["Times New Roman", "Times", "serif"],
});

export default function FooterWordmark() {
  return (
    <div className="bg-black w-full flex justify-center items-center py-24 overflow-hidden">
      <h2
        className={`text-[15vw] leading-none ${lora.className} font-bold tracking-tighter select-none`}
        style={{
          backgroundImage: "url('/grain.svg'), linear-gradient(to bottom, #9ca3af 0%, #000000 80%)",
          backgroundSize: "160px 160px, 100% 100%",
          backgroundBlendMode: "soft-light, normal",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent"
        }}
      >
        PRASHANT
      </h2>
    </div>
  );
}
