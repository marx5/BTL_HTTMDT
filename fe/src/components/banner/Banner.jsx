import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

const Banner = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const bannerRef = useRef(null);

  // Wrap bannerList trong useMemo
  const bannerList = useMemo(() => {
    return Array.isArray(banners) ? banners : [];
  }, [banners]);

  // Hàm xử lý vuốt
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % bannerList.length);
    } else if (isRightSwipe) {
      setCurrentSlide(
        (prev) => (prev - 1 + bannerList.length) % bannerList.length
      );
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    if (bannerList.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerList.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [bannerList]);

  if (!bannerList || bannerList.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full h-[400px] overflow-hidden"
      ref={bannerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerList.map((banner, index) => {
          return (
            <div key={banner.id} className="w-full flex-shrink-0">
              <Link to={`/product/${banner.Product.id}`}>
                <img
                  src={banner.imageUrl}
                  alt={banner.Product.name}
                  className="w-full h-[400px] object-cover"
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Navigation dots */}
      {bannerList.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {bannerList.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Navigation arrows */}
      {bannerList.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"
            onClick={() =>
              setCurrentSlide(
                (prev) => (prev - 1 + bannerList.length) % bannerList.length
              )
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition"
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % bannerList.length)
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

export default Banner;
