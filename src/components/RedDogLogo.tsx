interface RedDogLogoProps {
  dark?: boolean;
}

export const RedDogLogo = ({ dark = false }: RedDogLogoProps) => {
  const titleCls = dark
    ? "text-neutral-50"
    : "text-black";
  const taglineCls = dark
    ? "text-[#b8bcc4] [text-wrap:balance]"
    : "text-[#6b7280] [text-wrap:balance]";

  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#ef3e34] shadow-[0px_4px_6px_-4px_#c6102e33,0px_10px_15px_-3px_#c6102e33]">
        <span className="[font-family:'Oswald',Helvetica] text-xl font-bold tracking-[1px] text-white">
          RD
        </span>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <span
          className={`[font-family:'Oswald',Helvetica] text-base font-bold uppercase leading-none tracking-[0.5px] sm:text-lg ${titleCls}`}
        >
          RED DOG RADIOS
        </span>
        <span
          className={`[font-family:'Montserrat',Helvetica] text-[11px] font-medium leading-snug tracking-[0.02em] sm:text-xs sm:leading-relaxed ${taglineCls}`}
        >
          Grant Intelligence for Public Safety
        </span>
      </div>
    </div>
  );
};
