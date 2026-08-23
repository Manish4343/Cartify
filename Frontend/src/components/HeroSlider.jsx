import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const slides = [
  {
    eyebrow: "NEW SEASON",
    title: "Style that moves with you.",
    text: "Discover premium everyday fashion curated for your Cartify wardrobe.",
    button: "Shop Collection",
    link: "#products",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=85&w=1800&auto=format&fit=crop",
  },

  {
    eyebrow: "MEN'S EDIT",
    title: "Sharp looks. Effortless comfort.",
    text: "Upgrade your everyday essentials with clean, modern styles.",
    button: "Explore Men's",
    link: "#products",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=85&w=1800&auto=format&fit=crop",
  },

  {
    eyebrow: "WOMEN'S EDIT",
    title: "Your style. Your statement.",
    text: "Fresh silhouettes and timeless pieces made for every moment.",
    button: "Explore Women's",
    link: "#products",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=85&w=1800&auto=format&fit=crop",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = setInterval(() => {
      setActive((current) =>
        current === slides.length - 1
          ? 0
          : current + 1
      );
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [paused]);

  const previous = () => {
    setActive((current) =>
      current === 0
        ? slides.length - 1
        : current - 1
    );
  };

  const next = () => {
    setActive((current) =>
      current === slides.length - 1
        ? 0
        : current + 1
    );
  };

  const slide = slides[active];

  return (
    <section
      className="relative overflow-hidden bg-gray-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-/[520px] md:min-h-/[620px]">

        {/* =================================================
            BACKGROUND SLIDES
        ================================================= */}

        {slides.map((item, index) => (
          <div
            key={item.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === active
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={item.image}
              alt={item.title}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-/[5000ms] ${
                index === active
                  ? "scale-105"
                  : "scale-100"
              }`}
            />

            <div className="absolute inset-0 .bg-gradient-to-r from-black/80 via-black/45 to-black/10" />

            <div className="absolute inset-0 bg-black/10" />
          </div>
        ))}

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="relative z-10 mx-auto flex min-h-/[520px] max-w-7xl items-center px-6 py-16 md:min-h-/[620px] md:px-10">

          <div className="max-w-2xl text-white">

            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-white/70">
              {slide.eyebrow}
            </p>

            <h1 className="text-5xl font-black leading-[0.95] tracking-/[-0.05em] sm:text-6xl md:text-7xl">
              {slide.title}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              {slide.text}
            </p>

            {/* =================================================
                HERO BUTTONS
            ================================================= */}

            <div className="mt-8 flex flex-wrap gap-3">

              {/* PRIMARY BUTTON */}

              <Link
                to={slide.link}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white
                  px-7
                  py-3.5
                  text-sm
                  font-bold
                  text-[#111827]
                  transition
                  duration-300
                  hover:-translate-y-1
                  hover:bg-gray-100
                  hover:text-[#111827]
                  hover:shadow-xl
                  active:translate-y-0
                  active:bg-white
                  active:!text-/[#111827]
                "
              >
                <span>
                  {slide.button}
                </span>

                <ArrowRight
                  size={17}
                  className="shrink-0"
                />
              </Link>

              {/* SECONDARY BUTTON */}

              <Link
                to="#products"
                className="
                  inline-flex
                  items-center
                  rounded-full
                  border
                  border-white/30
                  bg-white/10
                  px-7
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  backdrop-blur-md
                  transition
                  duration-300
                  hover:border-white/60
                  hover:bg-white/20
                  hover:text-white
                  active:bg-white/10
                  active:text-white
                "
              >
                View Products
              </Link>

            </div>
          </div>
        </div>

        {/* =================================================
            ARROWS
        ================================================= */}

        <div className="absolute bottom-8 right-6 z-20 flex gap-2 md:right-10">

          <button
            type="button"
            onClick={previous}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/20
              text-white
              backdrop-blur-md
              transition
              duration-300
              hover:bg-white
              hover:text-black
              active:bg-black/40
              active:text-white
            "
            aria-label="Previous slide"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            onClick={next}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/20
              text-white
              backdrop-blur-md
              transition
              duration-300
              hover:bg-white
              hover:text-black
              active:bg-black/40
              active:text-white
            "
            aria-label="Next slide"
          >
            <ChevronRight size={19} />
          </button>

        </div>

        {/* =================================================
            SLIDER DOTS
        ================================================= */}

        <div className="absolute bottom-10 left-6 z-20 flex gap-2 md:left-10">

          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === active
                  ? "w-10 bg-white"
                  : "w-5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}

        </div>

      </div>
    </section>
  );
}