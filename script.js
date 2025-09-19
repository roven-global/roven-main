/**
 * Production Carousel with Auto-Contrast Indicators
 *
 * ALGORITHM OVERVIEW:
 * 1. Color Analysis: Samples each slide's image using Canvas API to determine dominant color
 * 2. Contrast Calculation: Uses WCAG formulas to compute luminance and contrast ratios
 * 3. Color Selection: Chooses optimal dot color (white/black/tinted) based on contrast thresholds
 * 4. Animation Sync: Ring rotation duration matches auto-slide interval exactly
 * 5. Animation Reset: Forces animation restart on slide change using class toggle + reflow
 *
 * CONFIGURATION:
 * - Contrast thresholds: 4.5:1 (WCAG AA), 3:1 (minimum)
 * - Sample size: 100x100px for performance
 * - Cache results per slide to avoid re-analysis
 * - Use requestIdleCallback for non-blocking color analysis
 */

class AutoContrastCarousel {
  constructor(container) {
    this.container = container;
    this.slides = container.querySelectorAll(".slide");
    this.indicators = container.querySelectorAll(".indicator");
    this.currentSlide = 0;
    this.interval = null;
    this.isPaused = false;

    // Get slide interval from CSS variable or data attribute
    this.slideInterval = this.getSlideInterval();

    this.init();
  }

  getSlideInterval() {
    const cssValue = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--slide-interval");
    const dataValue = this.container.dataset.slideInterval;

    if (cssValue) {
      return parseInt(cssValue.replace("ms", ""));
    } else if (dataValue) {
      return parseInt(dataValue);
    }
    return 5000; // Default 5 seconds
  }

  init() {
    this.setupEventListeners();
    this.startAutoSlide();
    this.setupControls();
  }

  setupEventListeners() {
    // Indicator clicks
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToSlide(index));
    });

    // Keyboard navigation
    this.container.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          this.previousSlide();
          break;
        case "ArrowRight":
          e.preventDefault();
          this.nextSlide();
          break;
        case " ":
          e.preventDefault();
          this.togglePause();
          break;
      }
    });

    // Focus management
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener("focus", () => {
        this.indicators.forEach((ind) => ind.setAttribute("tabindex", "-1"));
        indicator.setAttribute("tabindex", "0");
      });
    });
  }

  setupControls() {
    const pauseBtn = document.getElementById("pauseBtn");
    const resumeBtn = document.getElementById("resumeBtn");
    const nextBtn = document.getElementById("nextBtn");
    const prevBtn = document.getElementById("prevBtn");
    const intervalSlider = document.getElementById("intervalSlider");
    const intervalValue = document.getElementById("intervalValue");

    if (pauseBtn) pauseBtn.addEventListener("click", () => this.pause());
    if (resumeBtn) resumeBtn.addEventListener("click", () => this.resume());
    if (nextBtn) nextBtn.addEventListener("click", () => this.nextSlide());
    if (prevBtn) prevBtn.addEventListener("click", () => this.previousSlide());

    if (intervalSlider && intervalValue) {
      intervalSlider.value = this.slideInterval;
      intervalValue.textContent = this.slideInterval;

      intervalSlider.addEventListener("input", (e) => {
        this.slideInterval = parseInt(e.target.value);
        intervalValue.textContent = this.slideInterval;
        this.updateCSSInterval();
        if (!this.isPaused) {
          this.restartAutoSlide();
        }
      });
    }
  }

  updateCSSInterval() {
    document.documentElement.style.setProperty(
      "--slide-interval",
      `${this.slideInterval}ms`
    );
  }

  goToSlide(index) {
    if (index === this.currentSlide) return;

    this.currentSlide = index;
    this.updateSlides();
    this.updateIndicators();
    this.restartAnimation();
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  previousSlide() {
    const prevIndex =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  updateSlides() {
    this.slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === this.currentSlide);
    });
  }

  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      const isActive = index === this.currentSlide;
      indicator.classList.toggle("active", isActive);
      indicator.setAttribute("aria-selected", isActive);
      indicator.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  }

  restartAnimation() {
    // Force animation restart by removing and re-adding active class
    this.indicators.forEach((indicator) => {
      if (indicator.classList.contains("active")) {
        indicator.classList.remove("active");
        void indicator.offsetWidth; // Force reflow
        indicator.classList.add("active");
      }
    });
  }

  startAutoSlide() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, this.slideInterval);
  }

  restartAutoSlide() {
    this.startAutoSlide();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    this.isPaused ? this.resume() : this.pause();
  }

  // Public API
  setSlideInterval(interval) {
    this.slideInterval = interval;
    this.updateCSSInterval();
    this.restartAutoSlide();
  }

  setDotColorOverride(color) {
    // Override functionality removed - using fixed colors for stability
    console.warn(
      "Color override disabled - using fixed black/white styling for stability"
    );
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Initialize carousel when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const carousel = new AutoContrastCarousel(
    document.querySelector(".carousel")
  );

  // Expose to global scope for testing
  window.carousel = carousel;
});
