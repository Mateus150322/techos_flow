type BrandMarkProps = {
  className?: string;
  alt?: string;
};

export function BrandMark({
  className = "h-12 w-12 rounded-2xl shadow-sm",
  alt = "Icone do TechOS Flow",
}: BrandMarkProps) {
  return (
    <img
      src="/techos-icon.png"
      alt={alt}
      className={`object-cover ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
