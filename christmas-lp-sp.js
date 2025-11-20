document.addEventListener("DOMContentLoaded", () => {
    initSeoMetadata();
    initThemeSwitcher();
    initHeroSlider();
    initImageSlider();
    initAccordions();
    initSnow();
    initScrollAnimations();
});

function initSeoMetadata() {
    try {
        const head = document.head || document.getElementsByTagName("head")[0];
        const canonicalLink = document.querySelector('link[rel="canonical"]');
        const rawCanonical = canonicalLink?.href || window.location.href;
        const pageUrl = stripHash(rawCanonical);
        const siteRootUrl = deriveSiteRoot(pageUrl);
        const siteName = document.querySelector('meta[property="og:site_name"]')?.content?.trim() || "LOSE FORD";
        const pageTitle = document.title.trim();
        const description = document.querySelector('meta[name="description"]')?.content?.trim() || "";

        const heroImageElement = document.querySelector(".hero__slide img") || document.querySelector(".image-slide img");
        const ogImageContent = document.querySelector('meta[property="og:image"]')?.getAttribute("content")?.trim() || "";
        const ogImageAltContent = document.querySelector('meta[property="og:image:alt"]')?.getAttribute("content")?.trim() || "";
        const heroImageSrc = heroImageElement
            ? makeAbsolute(heroImageElement.getAttribute("src"), pageUrl)
            : makeAbsolute(ogImageContent, pageUrl);
        const heroImageAlt = heroImageElement?.getAttribute("alt")?.trim() || ogImageAltContent || pageTitle;

        setMeta("property", "og:url", pageUrl, head);
        setMeta("name", "twitter:url", pageUrl, head);
        setMeta("property", "og:title", pageTitle, head);
        setMeta("name", "twitter:title", pageTitle, head);

        if (description) {
            setMeta("property", "og:description", description, head);
            setMeta("name", "twitter:description", description, head);
        }

        if (heroImageSrc) {
            setMeta("property", "og:image", heroImageSrc, head);
            setMeta("name", "twitter:image", heroImageSrc, head);
        }

        if (heroImageAlt) {
            setMeta("property", "og:image:alt", heroImageAlt, head);
        }

        const rankingProducts = Array.from(document.querySelectorAll("#products .ranking-card"));
        const itemListElements = rankingProducts.map((card, index) => {
            const name = card.querySelector("h3")?.textContent?.trim() || `Product ${index + 1}`;
            const imgElement = card.querySelector("img");
            const imageUrl = imgElement ? makeAbsolute(imgElement.getAttribute("src"), pageUrl) : "";
            const productUrl = card.getAttribute("href") || pageUrl;

            const product = {
                "@type": "Product",
                name,
                brand: {
                    "@type": "Brand",
                    name: "LOSE FORD"
                },
                url: productUrl
            };

            if (imageUrl) {
                product.image = imageUrl;
            }

            return {
                "@type": "ListItem",
                position: index + 1,
                item: product,
                url: productUrl
            };
        });

        const breadcrumbName = extractBreadcrumbTitle(pageTitle);
        const breadcrumbList = {
            "@type": "BreadcrumbList",
            "@id": `${pageUrl}#breadcrumb`,
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: `${siteName} 楽天市場店`,
                    item: siteRootUrl
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: breadcrumbName,
                    item: pageUrl
                }
            ]
        };

        const graph = [];

        const organization = {
            "@type": "Organization",
            "@id": `${siteRootUrl}#organization`,
            name: siteName,
            url: siteRootUrl
        };

        if (heroImageSrc) {
            organization.logo = {
                "@type": "ImageObject",
                url: heroImageSrc
            };
        }

        graph.push(organization);

        const website = {
            "@type": "WebSite",
            "@id": `${siteRootUrl}#website`,
            url: siteRootUrl,
            name: siteName,
            publisher: {
                "@id": `${siteRootUrl}#organization`
            }
        };

        graph.push(website);

        const webpage = {
            "@type": "WebPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name: pageTitle,
            description,
            isPartOf: {
                "@id": `${siteRootUrl}#website`
            },
            breadcrumb: {
                "@id": `${pageUrl}#breadcrumb`
            }
        };

        if (heroImageSrc) {
            webpage.primaryImageOfPage = {
                "@type": "ImageObject",
                url: heroImageSrc
            };
        }

        graph.push(webpage);
        graph.push(breadcrumbList);

        if (itemListElements.length > 0) {
            graph.push({
                "@type": "ItemList",
                "@id": `${pageUrl}#christmas-best-sellers`,
                name: "クリスマスギフト人気ランキング",
                itemListOrder: "https://schema.org/ItemListOrderAscending",
                numberOfItems: itemListElements.length,
                url: `${pageUrl}#products`,
                itemListElement: itemListElements
            });
        }

        appendStructuredData(graph, head);
    } catch (error) {
        console.warn("SEO metadata initialization failed:", error);
    }
}

function setMeta(attribute, key, value, head) {
    if (!value) {
        return;
    }
    const selector = attribute === "property"
        ? `meta[property="${key}"]`
        : `meta[name="${key}"]`;
    let tag = document.querySelector(selector);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, key);
        head.appendChild(tag);
    }
    tag.setAttribute("content", value);
}

function appendStructuredData(graph, head) {
    if (!graph || !graph.length) {
        return;
    }
    const scriptId = "structured-data-graph";
    const existingScript = document.getElementById(scriptId);
    if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
    }
    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.id = scriptId;
    ldScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph
    }, null, 2);
    head.appendChild(ldScript);
}

function makeAbsolute(url, baseUrl) {
    if (!url) {
        return "";
    }
    try {
        return new URL(url, baseUrl).href;
    } catch (error) {
        return url;
    }
}

function stripHash(url) {
    if (!url) {
        return "";
    }
    const hashIndex = url.indexOf("#");
    return hashIndex >= 0 ? url.substring(0, hashIndex) : url;
}

function deriveSiteRoot(pageUrl) {
    try {
        const page = new URL(pageUrl);
        const pathSegments = page.pathname.split("/");
        if (pathSegments[pathSegments.length - 1]?.includes(".")) {
            pathSegments.pop();
        }
        if (pathSegments[pathSegments.length - 1] !== "") {
            pathSegments.push("");
        }
        const normalizedPath = pathSegments.join("/");
        return `${page.origin}${normalizedPath}`;
    } catch (error) {
        const lastSlash = pageUrl.lastIndexOf("/");
        return lastSlash > -1 ? pageUrl.substring(0, lastSlash + 1) : pageUrl;
    }
}

function extractBreadcrumbTitle(title) {
    if (!title) {
        return "特集ページ";
    }
    const split = title.split("｜");
    return split[0]?.trim() || title;
}

function initThemeSwitcher() {
    const storageKey = "lf-theme";
    const root = document.documentElement;
    const toggle = document.querySelector("[data-theme-toggle]");

    if (!toggle) {
        return;
    }

    let storageAvailable = true;
    let storedTheme = null;
    try {
        storedTheme = localStorage.getItem(storageKey);
    } catch (error) {
        storageAvailable = false;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    let hasStoredPreference = storedTheme === "light" || storedTheme === "dark";
    let currentTheme = hasStoredPreference ? storedTheme : prefersDark.matches ? "dark" : "light";

    applyTheme(currentTheme);

    toggle.addEventListener("click", () => {
        currentTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(currentTheme);
        hasStoredPreference = true;
        if (storageAvailable) {
            try {
                localStorage.setItem(storageKey, currentTheme);
            } catch (error) {
                storageAvailable = false;
            }
        }
    });

    const handlePreferenceChange = (event) => {
        if (hasStoredPreference) {
            return;
        }
        currentTheme = event.matches ? "dark" : "light";
        applyTheme(currentTheme);
    };

    if (typeof prefersDark.addEventListener === "function") {
        prefersDark.addEventListener("change", handlePreferenceChange);
    } else if (typeof prefersDark.addListener === "function") {
        prefersDark.addListener(handlePreferenceChange);
    }

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        toggle.dataset.currentTheme = theme;
        toggle.setAttribute("data-current-theme", theme);
        const isDark = theme === "dark";
        toggle.setAttribute("aria-pressed", String(isDark));
        const label = toggle.querySelector(".theme-toggle__label");
        if (label) {
            label.textContent = isDark ? "ダークテーマ" : "ライトテーマ";
        }
    }
}

function initHeroSlider() {
    const slider = document.querySelector("[data-hero-slider]");
    if (!slider) {
        return;
    }

    const slides = [...slider.querySelectorAll(".hero__slide")];
    
    // Hero slider is now only for video, no auto-slide needed
    if (!slides.length || slides.length <= 1) {
        return;
    }

    const prevButton = document.querySelector("[data-hero-prev]");
    const nextButton = document.querySelector("[data-hero-next]");
    const dotsContainer = document.querySelector("[data-hero-dots]");

    if (!dotsContainer) {
        return;
    }

    let currentIndex = 0;
    let autoTimer = null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "hero__dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `スライド ${index + 1} に移動`);
        dot.addEventListener("click", () => {
            goToSlide(index);
            restartAutoPlay();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = [...dotsContainer.querySelectorAll(".hero__dot")];

    const goToSlide = (index) => {
        slides[currentIndex].classList.remove("is-active");
        dots[currentIndex].classList.remove("is-active");

        currentIndex = (index + slides.length) % slides.length;

        slides[currentIndex].classList.add("is-active");
        dots[currentIndex].classList.add("is-active");
    };

    const nextSlide = () => {
        goToSlide(currentIndex + 1);
    };

    const prevSlide = () => {
        goToSlide(currentIndex - 1);
    };

    const startAutoPlay = () => {
        if (prefersReducedMotion) {
            return;
        }
        autoTimer = window.setInterval(nextSlide, 5000);
    };

    const stopAutoPlay = () => {
        if (autoTimer) {
            window.clearInterval(autoTimer);
            autoTimer = null;
        }
    };

    const restartAutoPlay = () => {
        stopAutoPlay();
        startAutoPlay();
    };

    dotsContainer.addEventListener("mouseenter", stopAutoPlay);
    dotsContainer.addEventListener("mouseleave", startAutoPlay);

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            nextSlide();
            restartAutoPlay();
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            prevSlide();
            restartAutoPlay();
        });
    }

    slider.addEventListener("touchstart", handleTouchStart, { passive: true });
    slider.addEventListener("touchmove", handleTouchMove, { passive: true });

    let touchStartX = 0;
    let touchEndX = 0;

    function handleTouchStart(event) {
        touchStartX = event.changedTouches[0].clientX;
        touchEndX = touchStartX;
        stopAutoPlay();
    }

    function handleTouchMove(event) {
        touchEndX = event.changedTouches[0].clientX;
    }

    slider.addEventListener("touchend", () => {
        const swipeDistance = touchEndX - touchStartX;
        const threshold = 40;
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        restartAutoPlay();
    });

    // Initialise
    slides[0].classList.add("is-active");
    dots[0].classList.add("is-active");
    startAutoPlay();
}

function initImageSlider() {
    const sliderSection = document.querySelector(".image-slider-section");
    if (!sliderSection) return;

    const slides = [...document.querySelectorAll(".image-slide")];
    const textElements = [...document.querySelectorAll(".image-slide-text")];
    const dotsContainer = document.querySelector(".image-slider-dots");
    const prevButton = document.querySelector(".image-slider-prev");
    const nextButton = document.querySelector(".image-slider-next");

    if (!slides.length || slides.length <= 1 || !dotsContainer) {
        return;
    }

    let currentIndex = 0;
    let autoTimer = null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const TEXT_ANIMATION_DURATION = 600;

    slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "image-slider-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `スライド ${index + 1} に移動`);
        dot.addEventListener("click", () => {
            goToSlide(index);
            restartAutoPlay();
        });
        dotsContainer.appendChild(dot);
    });

    const dots = [...dotsContainer.querySelectorAll(".image-slider-dot")];

    function fadeOutText(textElement, callback) {
        if (!textElement) {
            if (callback) callback();
            return;
        }
        textElement.style.opacity = "0";
        textElement.style.transform = "translate(-50%, -30%)";
        setTimeout(() => {
            textElement.classList.remove("active");
            if (callback) callback();
        }, TEXT_ANIMATION_DURATION / 2);
    }

    function fadeInText(textElement) {
        if (!textElement) return;
        textElement.classList.add("active");
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                textElement.style.opacity = "1";
                textElement.style.transform = "translate(-50%, -50%)";
            });
        });
    }

    const goToSlide = (index) => {
        const oldSlide = slides[currentIndex];
        const oldText = textElements[currentIndex];
        const newIndex = (index + slides.length) % slides.length;
        const newSlide = slides[newIndex];
        const newText = textElements[newIndex];

        fadeOutText(oldText, () => {
            oldSlide.classList.remove("active");
            dots[currentIndex].classList.remove("is-active");
            dots[currentIndex].setAttribute("aria-selected", "false");

            currentIndex = newIndex;

            newSlide.classList.add("active");
            dots[currentIndex].classList.add("is-active");
            dots[currentIndex].setAttribute("aria-selected", "true");

            fadeInText(newText);
        });
    };

    const nextSlide = () => {
        goToSlide(currentIndex + 1);
    };

    const prevSlide = () => {
        goToSlide(currentIndex - 1);
    };

    const startAutoPlay = () => {
        if (prefersReducedMotion) {
            return;
        }
        autoTimer = window.setInterval(nextSlide, 5000);
    };

    const stopAutoPlay = () => {
        if (autoTimer) {
            window.clearInterval(autoTimer);
            autoTimer = null;
        }
    };

    const restartAutoPlay = () => {
        stopAutoPlay();
        startAutoPlay();
    };

    dotsContainer.addEventListener("mouseenter", stopAutoPlay);
    dotsContainer.addEventListener("mouseleave", startAutoPlay);

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            nextSlide();
            restartAutoPlay();
        });
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => {
            prevSlide();
            restartAutoPlay();
        });
    }

    let touchStartX = 0;
    let touchEndX = 0;

    sliderSection.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
        touchEndX = touchStartX;
        stopAutoPlay();
    }, { passive: true });

    sliderSection.addEventListener("touchmove", (event) => {
        touchEndX = event.changedTouches[0].clientX;
    }, { passive: true });

    sliderSection.addEventListener("touchend", () => {
        const swipeDistance = touchEndX - touchStartX;
        const threshold = 40;
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        restartAutoPlay();
    });

    // Initialise
    slides[0].classList.add("active");
    dots[0].classList.add("is-active");
    dots[0].setAttribute("aria-selected", "true");
    if (textElements[0]) {
        fadeInText(textElements[0]);
    }
    startAutoPlay();
}

function initAccordions() {
    const accordions = document.querySelectorAll("[data-accordion]");
    if (!accordions.length) {
        return;
    }

    accordions.forEach((accordion) => {
        const toggle = accordion.querySelector("[data-accordion-toggle]");
        const panel = accordion.querySelector("[data-accordion-panel]");
        if (!toggle || !panel) {
            return;
        }

        toggle.addEventListener("click", () => {
            const isOpen = panel.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));

            if (isOpen) {
                panel.style.maxHeight = `${panel.scrollHeight + 16}px`;
            } else {
                panel.style.maxHeight = "0";
            }

            const indicator = toggle.querySelector("span[aria-hidden='true']");
            if (indicator) {
                indicator.textContent = isOpen ? "－" : "＋";
            }
        });

        // Set default closed state
        toggle.setAttribute("aria-expanded", "false");
        panel.style.maxHeight = "0";
    });
}

// ============================================
// クリスマス雪エフェクト
// ============================================
function initSnow() {
    const container = document.getElementById('snow-overlay');
    if (!container) return;

    function createFlakes() {
        container.innerHTML = '';
        const isMobile = window.innerWidth < 768;
        const flakeCount = isMobile ? 25 : 60;

        for (let i = 0; i < flakeCount; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.textContent = Math.random() < 0.5 ? '❄' : '✻';

            const size = Math.random() * 12 + 6; // 6px - 18px
            const left = Math.random() * 100;    // vw
            const duration = Math.random() * 10 + 10; // 10s - 20s
            const delay = Math.random() * 10;    // 0s - 10s
            const swayDuration = 3 + Math.random() * 4; // 3s - 7s

            flake.style.left = left + 'vw';
            flake.style.fontSize = size + 'px';
            flake.style.opacity = (0.6 + Math.random() * 0.4).toString();
            flake.style.animationDuration = `${duration}s, ${swayDuration}s`;
            flake.style.animationDelay = `${delay}s, ${Math.random() * 2}s`;

            container.appendChild(flake);
        }
    }

    createFlakes();
    window.addEventListener('resize', debounce(createFlakes, 300));
}

// ============================================
// フェードインアニメーション用のIntersection Observer
// ============================================
function initScrollAnimations() {
    const root = document.documentElement;
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -15% 0px'
    };

    const animationGroups = [
        { selector: '.product-card', animation: 'fragment', stagger: 0.08 },
        { selector: '.guide-card', animation: 'ripple', stagger: 0.09 },
        { selector: '.category-card', animation: 'charge', stagger: 0.06 },
        { selector: '.ranking-card', animation: 'shard', stagger: 0.07 },
        { selector: '.featured-card', animation: 'spiral', stagger: 0.1 },
        { selector: '.benefit-card', animation: 'pulse', stagger: 0.08 },
        { selector: '.tips-card', animation: 'draft', stagger: 0.09 },
        { selector: '.price-group', animation: 'column', stagger: 0.12 }
    ];

    const sectionSlideElements = Array.from(document.querySelectorAll('[data-section-slide]'));
    animationGroups.forEach(({ selector, animation, stagger }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            if (!element.dataset.animate) {
                element.dataset.animate = animation;
            }

            if (!element.hasAttribute('data-animate-delay') && !element.style.getPropertyValue('--reveal-delay')) {
                const delayValue = Number((index * stagger).toFixed(2));
                element.style.setProperty('--reveal-delay', `${delayValue}s`);
            }
        });
    });

    const animatedElements = Array.from(document.querySelectorAll('[data-animate]'));

    animatedElements.forEach((element) => {
        if (element.dataset.animateDelay) {
            const delay = element.dataset.animateDelay.trim();
            const normalizedDelay = delay.endsWith('s') ? delay : `${parseFloat(delay) || 0}s`;
            element.style.setProperty('--reveal-delay', normalizedDelay);
        }
    });

    sectionSlideElements.forEach((element) => {
        if (element.dataset.sectionSlideDelay) {
            const delay = element.dataset.sectionSlideDelay.trim();
            const normalizedDelay = delay.endsWith('s') ? delay : `${parseFloat(delay) || 0}s`;
            element.style.setProperty('--section-slide-delay', normalizedDelay);
        }
        if (element.dataset.sectionSlideDuration) {
            const duration = element.dataset.sectionSlideDuration.trim();
            const normalized = duration.endsWith('s') ? duration : `${parseFloat(duration) || 0.9}s`;
            element.style.setProperty('--section-slide-duration', normalized);
        }
    });

    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    if (!supportsIntersectionObserver) {
        animatedElements.forEach(element => element.classList.add('is-visible'));
        sectionSlideElements.forEach(element => element.classList.add('is-section-visible'));
        root.classList.add('has-animations');
        return;
    }

    const isElementInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        return (
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= viewportHeight * 0.9 &&
            rect.left <= viewportWidth
        );
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                if (target.hasAttribute('data-animate')) {
                    target.classList.add('is-visible');
                }
                if (target.hasAttribute('data-section-slide')) {
                    target.classList.add('is-section-visible');
                }
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const observerTargets = new Set();

    animatedElements.forEach(element => {
        if (element.hasAttribute('data-animate-instant') || isElementInViewport(element)) {
            element.classList.add('is-visible');
        } else {
            observerTargets.add(element);
        }
    });

    sectionSlideElements.forEach(element => {
        if (element.hasAttribute('data-section-slide-instant') || isElementInViewport(element)) {
            element.classList.add('is-section-visible');
        } else {
            observerTargets.add(element);
        }
    });

    root.classList.add('has-animations');

    observerTargets.forEach(element => observer.observe(element));
}

// ============================================
// パフォーマンス: デバウンス関数
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

