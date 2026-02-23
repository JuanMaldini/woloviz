import { useEffect, useMemo, useState } from "react";

const Carousel = ({ images, intervalMs = 3500 }) => {
  const safeImages = useMemo(() => images || [], [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) {
      return undefined;
    }

    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % safeImages.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, safeImages.length]);

  if (safeImages.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[45vh] min-h-[260px] w-full overflow-hidden">
      {safeImages.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
          loading={index === activeIndex ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
};

export default Carousel;
