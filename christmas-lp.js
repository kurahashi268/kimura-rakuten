/**
 * LOSE FORD - クリスマスランディングページ
 * インタラクティブなJavaScript機能
 */

(function() {
    'use strict';

    // ============================================
    // SEO メタデータ & 構造化データ
    // ============================================
    function initSeoMetadata() {
        try {
            const head = document.head || document.getElementsByTagName('head')[0];
            const canonicalLink = document.querySelector('link[rel="canonical"]');
            const rawCanonical = canonicalLink?.href || window.location.href;
            const pageUrl = stripHash(rawCanonical);
            const siteRootUrl = deriveSiteRoot(pageUrl);
            const siteName = document.querySelector('meta[property="og:site_name"]')?.content?.trim() || 'LOSE FORD';
            const pageTitle = document.title.trim();
            const description = document.querySelector('meta[name="description"]')?.content?.trim() || '';

            const heroImageElement = document.querySelector('.hero-slide img');
            const ogImageContent = document.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';
            const ogImageAltContent = document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')?.trim() || '';
            const heroImageSrc = heroImageElement
                ? makeAbsolute(heroImageElement.getAttribute('src'), pageUrl)
                : makeAbsolute(ogImageContent, pageUrl);
            const heroImageAlt = heroImageElement?.getAttribute('alt')?.trim()
                || ogImageAltContent
                || pageTitle;

            setMeta('property', 'og:url', pageUrl, head);
            setMeta('name', 'twitter:url', pageUrl, head);
            setMeta('property', 'og:title', pageTitle, head);
            setMeta('name', 'twitter:title', pageTitle, head);
            if (description) {
                setMeta('property', 'og:description', description, head);
                setMeta('name', 'twitter:description', description, head);
            }
            if (heroImageSrc) {
                setMeta('property', 'og:image', heroImageSrc, head);
                setMeta('name', 'twitter:image', heroImageSrc, head);
            }
            if (heroImageAlt) {
                setMeta('property', 'og:image:alt', heroImageAlt, head);
            }

            const products = Array.from(document.querySelectorAll('#products .product-item'));
            const itemListElements = products.map((anchor, index) => {
                const name = anchor.querySelector('.product-name')?.textContent?.trim() || `Product ${index + 1}`;
                const imgElement = anchor.querySelector('img');
                const imageUrl = imgElement ? makeAbsolute(imgElement.getAttribute('src'), pageUrl) : '';

                const product = {
                    '@type': 'Product',
                    'name': name,
                    'brand': {
                        '@type': 'Brand',
                        'name': 'LOSE FORD'
                    },
                    'url': anchor.href
                };

                if (imageUrl) {
                    product.image = imageUrl;
                }

                return {
                    '@type': 'ListItem',
                    'position': index + 1,
                    'item': product,
                    'url': anchor.href
                };
            });

            const breadcrumbName = extractBreadcrumbTitle(pageTitle);
            const breadcrumbList = {
                '@type': 'BreadcrumbList',
                '@id': `${pageUrl}#breadcrumb`,
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': `${siteName} 楽天市場店`,
                        'item': siteRootUrl
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': breadcrumbName,
                        'item': pageUrl
                    }
                ]
            };

            const graph = [];

            const organization = {
                '@type': 'Organization',
                '@id': `${siteRootUrl}#organization`,
                'name': siteName,
                'url': siteRootUrl
            };

            if (heroImageSrc) {
                organization.logo = {
                    '@type': 'ImageObject',
                    'url': heroImageSrc
                };
            }

            graph.push(organization);

            const website = {
                '@type': 'WebSite',
                '@id': `${siteRootUrl}#website`,
                'url': siteRootUrl,
                'name': siteName,
                'publisher': {
                    '@id': `${siteRootUrl}#organization`
                }
            };

            graph.push(website);

            const webpage = {
                '@type': 'WebPage',
                '@id': `${pageUrl}#webpage`,
                'url': pageUrl,
                'name': pageTitle,
                'description': description,
                'isPartOf': {
                    '@id': `${siteRootUrl}#website`
                },
                'breadcrumb': {
                    '@id': `${pageUrl}#breadcrumb`
                }
            };

            if (heroImageSrc) {
                webpage.primaryImageOfPage = {
                    '@type': 'ImageObject',
                    'url': heroImageSrc
                };
            }

            graph.push(webpage);

            graph.push(breadcrumbList);

            if (itemListElements.length > 0) {
                graph.push({
                    '@type': 'ItemList',
                    '@id': `${pageUrl}#christmas-best-sellers`,
                    'name': 'クリスマスギフト人気ランキング',
                    'itemListOrder': 'https://schema.org/ItemListOrderAscending',
                    'numberOfItems': itemListElements.length,
                    'url': `${pageUrl}#products`,
                    'itemListElement': itemListElements
                });
            }

            appendStructuredData(graph, head);
        } catch (error) {
            console.warn('SEO metadata initialization failed:', error);
        }
    }

    function setMeta(attribute, key, value, head) {
        if (!value) return;
        const selector = attribute === 'property'
            ? `meta[property="${key}"]`
            : `meta[name="${key}"]`;
        let tag = document.querySelector(selector);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attribute, key);
            head.appendChild(tag);
        }
        tag.setAttribute('content', value);
    }

    function appendStructuredData(graph, head) {
        if (!graph || graph.length === 0) return;
        const scriptId = 'structured-data-graph';
        const existingScript = document.getElementById(scriptId);
        if (existingScript && existingScript.parentNode) {
            existingScript.parentNode.removeChild(existingScript);
        }
        const ldScript = document.createElement('script');
        ldScript.type = 'application/ld+json';
        ldScript.id = scriptId;
        ldScript.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': graph
        }, null, 2);
        head.appendChild(ldScript);
    }

    function makeAbsolute(url, baseUrl) {
        if (!url) return '';
        try {
            return new URL(url, baseUrl).href;
        } catch (error) {
            return url;
        }
    }

    function stripHash(url) {
        if (!url) return '';
        const hashIndex = url.indexOf('#');
        return hashIndex >= 0 ? url.substring(0, hashIndex) : url;
    }

    function deriveSiteRoot(pageUrl) {
        try {
            const page = new URL(pageUrl);
            const pathSegments = page.pathname.split('/');
            if (pathSegments[pathSegments.length - 1]?.includes('.')) {
                pathSegments.pop();
            }
            if (pathSegments[pathSegments.length - 1] !== '') {
                pathSegments.push('');
            }
            const normalizedPath = pathSegments.join('/');
            return `${page.origin}${normalizedPath}`;
        } catch (error) {
            const lastSlash = pageUrl.lastIndexOf('/');
            return lastSlash > -1 ? pageUrl.substring(0, lastSlash + 1) : pageUrl;
        }
    }

    function extractBreadcrumbTitle(title) {
        if (!title) return '特集ページ';
        const split = title.split('｜');
        return split[0]?.trim() || title;
    }

    // ============================================
    // ヒーロースライダー
    // ============================================
    function initHeroSlider() {
        const hero = document.querySelector('.hero');
        const slides = document.querySelectorAll('.hero-slide');
        const dotsContainer = document.querySelector('.hero-dots');
        const prevBtn = document.querySelector('.hero-prev');
        const nextBtn = document.querySelector('.hero-next');

        // Hero slider is now only for video, no auto-slide needed
        if (!hero || slides.length <= 1) return;

        let current = 0;
        let timer = null;
        const INTERVAL_MS = 5000;

        // ドットを構築
        slides.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `スライド ${idx + 1}`);
            dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => goTo(idx, true));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('button');

        function goTo(index, userInitiated = false) {
            if (index === current) return;
            slides[current].classList.remove('active');
            dots[current].setAttribute('aria-selected', 'false');
            current = (index + slides.length) % slides.length;
            slides[current].classList.add('active');
            dots[current].setAttribute('aria-selected', 'true');
            if (userInitiated) restartAutoplay();
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        function startAutoplay() {
            stopAutoplay();
            timer = setInterval(next, INTERVAL_MS);
        }

        function stopAutoplay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        // ボタン
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

        // ホバー/フォーカス時に一時停止
        hero.addEventListener('mouseenter', stopAutoplay);
        hero.addEventListener('mouseleave', startAutoplay);
        hero.addEventListener('focusin', stopAutoplay);
        hero.addEventListener('focusout', startAutoplay);

        // スワイプ対応
        let touchStartX = 0;
        let touchEndX = 0;
        const SWIPE_THRESHOLD = 40;
        hero.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        hero.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) > SWIPE_THRESHOLD) {
                if (delta > 0) {
                    prev();
                } else {
                    next();
                }
                restartAutoplay();
            }
        }, { passive: true });

        // 開始
        startAutoplay();
    }

    // ============================================
    // イメージスライダー（Christmas 2025以降）
    // ============================================
    function initImageSlider() {
        const sliderSection = document.querySelector('.image-slider-section');
        if (!sliderSection) return;

        const slides = document.querySelectorAll('.image-slide');
        const textElements = document.querySelectorAll('.image-slide-text');
        const dotsContainer = document.querySelector('.image-slider-dots');
        const prevBtn = document.querySelector('.image-slider-prev');
        const nextBtn = document.querySelector('.image-slider-next');

        if (!slides.length || slides.length <= 1 || !dotsContainer) return;

        let current = 0;
        let timer = null;
        const INTERVAL_MS = 5000;
        const TEXT_ANIMATION_DURATION = 600;
        const TEXT_INACTIVE_TRANSFORM = 'translate(-50%, calc(-50% + 20px))';
        const TEXT_ACTIVE_TRANSFORM = 'translate(-50%, -50%)';
        const prefersReducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let prefersReducedMotion = prefersReducedMotionQuery.matches;

        // ドットを構築
        slides.forEach((_, idx) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `スライド ${idx + 1}`);
            dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => goTo(idx, true));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('button');

        // テキストアニメーション: フェードアウト
        function fadeOutText(textElement, callback) {
            if (!textElement) {
                if (callback) callback();
                return;
            }
            textElement.style.opacity = '0';
            textElement.style.transform = TEXT_INACTIVE_TRANSFORM;
            setTimeout(() => {
                textElement.classList.remove('active');
                if (callback) callback();
            }, TEXT_ANIMATION_DURATION / 2);
        }

        // テキストアニメーション: フェードイン
        function fadeInText(textElement) {
            if (!textElement) return;
            textElement.classList.add('active');
            // 次のフレームでアニメーション開始
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    textElement.style.opacity = '1';
                    textElement.style.transform = TEXT_ACTIVE_TRANSFORM;
                });
            });
        }

        function goTo(index, userInitiated = false) {
            if (index === current) return;
            
            const oldSlide = slides[current];
            const oldText = textElements[current];
            const newIndex = (index + slides.length) % slides.length;
            const newSlide = slides[newIndex];
            const newText = textElements[newIndex];

            // 現在のスライドとテキストを非表示
            fadeOutText(oldText, () => {
                oldSlide.classList.remove('active');
                dots[current].setAttribute('aria-selected', 'false');
                
                // 新しいスライドを表示
                current = newIndex;
                newSlide.classList.add('active');
                dots[current].setAttribute('aria-selected', 'true');
                
                // 新しいテキストを表示
                fadeInText(newText);
            });

            if (userInitiated) restartAutoplay();
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        function startAutoplay() {
            if (prefersReducedMotion) {
                stopAutoplay();
                return;
            }
            stopAutoplay();
            timer = setInterval(next, INTERVAL_MS);
        }

        function stopAutoplay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        // ボタン
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restartAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartAutoplay(); });

        // ホバー/フォーカス時に一時停止
        sliderSection.addEventListener('mouseenter', stopAutoplay);
        sliderSection.addEventListener('mouseleave', startAutoplay);
        sliderSection.addEventListener('focusin', stopAutoplay);
        sliderSection.addEventListener('focusout', startAutoplay);

        // スワイプ対応
        let touchStartX = 0;
        let touchEndX = 0;
        const SWIPE_THRESHOLD = 40;
        sliderSection.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        sliderSection.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) > SWIPE_THRESHOLD) {
                if (delta > 0) {
                    prev();
                } else {
                    next();
                }
                restartAutoplay();
            }
        }, { passive: true });

        // 初期テキストを表示
        if (textElements[0]) {
            fadeInText(textElements[0]);
        }

        const handleReducedMotionChange = (event) => {
            prefersReducedMotion = event.matches;
            if (prefersReducedMotion) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        };

        if (typeof prefersReducedMotionQuery.addEventListener === 'function') {
            prefersReducedMotionQuery.addEventListener('change', handleReducedMotionChange);
        } else if (typeof prefersReducedMotionQuery.addListener === 'function') {
            prefersReducedMotionQuery.addListener(handleReducedMotionChange);
        }

        // 開始
        startAutoplay();
    }

    // ============================================
    // カテゴリーバッジのインタラクション
    // ============================================
    function initCategoryBadges() {
        const categoryBadges = document.querySelectorAll('.category-badge-item');

        categoryBadges.forEach(badge => {
            badge.addEventListener('click', function(e) {
                const badgeText = this.querySelector('.badge-text')?.textContent;
                console.log('Category badge clicked:', badgeText);
                // ここに追加のインタラクションを追加できます
            });
        });
    }

    // ============================================
    // アンカーリンクのスムーズスクロール
    // ============================================
    function initSmoothScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // hrefが単に"#"の場合はスキップ
                if (href === '#') {
                    e.preventDefault();
                    return;
                }

                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    e.preventDefault();
                    const offset = 20;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
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
            // { selector: '.showcase-item', animation: 'fragment', stagger: 0.08 },
            // { selector: '.gift-guide-card', animation: 'ripple', stagger: 0.09 },
            // { selector: '.category-badge-item', animation: 'charge', stagger: 0.06 },
            // { selector: '.product-grid .product-item', animation: 'shard', stagger: 0.07 },
            // { selector: '.featured-detail-item', animation: 'spiral', stagger: 0.1 },
            // { selector: '.benefit-card', animation: 'pulse', stagger: 0.08 },
            // { selector: '.guide-card', animation: 'draft', stagger: 0.09 },
            // { selector: '.price-group', animation: 'column', stagger: 0.12 }
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
    // 画像の遅延読み込み
    // ============================================
    function initLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('loading' in HTMLImageElement.prototype) {
            // ブラウザがネイティブの遅延読み込みをサポート
            images.forEach(img => {
                img.addEventListener('load', function() {
                    this.classList.add('loaded');
                });
            });
        } else if ('IntersectionObserver' in window) {
            // 遅延読み込みをサポートしないブラウザ用のフォールバック
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            images.forEach(img => {
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
            });
        }
    }

    // ============================================
    // ページトップへ戻るボタン（オプション）
    // ============================================
    function initScrollToTop() {
        let scrollToTopBtn = document.getElementById('scrollToTop');
        
        // ボタンが存在しない場合は作成
        if (!scrollToTopBtn) {
            scrollToTopBtn = document.createElement('button');
            scrollToTopBtn.id = 'scrollToTop';
            scrollToTopBtn.innerHTML = '↑';
            scrollToTopBtn.setAttribute('aria-label', 'ページトップへ戻る');
            scrollToTopBtn.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #2C5F2D;
                color: #fff;
                border: none;
                font-size: 24px;
                cursor: pointer;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            `;
            document.body.appendChild(scrollToTopBtn);
        }

        // スクロール位置に基づいてボタンを表示/非表示
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.style.opacity = '1';
                scrollToTopBtn.style.visibility = 'visible';
            } else {
                scrollToTopBtn.style.opacity = '0';
                scrollToTopBtn.style.visibility = 'hidden';
            }
        });

        // クリック時にページトップへスクロール
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // ホバー効果
        scrollToTopBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
        });

        scrollToTopBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
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
    // ボタンのリップルフィードバック
    // ============================================
    function initButtonRipples() {
        function addRipple(e) {
            const target = e.currentTarget;
            const ripple = document.createElement('span');
            const diameter = Math.max(target.clientWidth, target.clientHeight);
            const radius = diameter / 2;

            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.pointerEvents = 'none';
            ripple.style.width = ripple.style.height = `${diameter}px`;
            ripple.style.left = `${e.offsetX - radius}px`;
            ripple.style.top = `${e.offsetY - radius}px`;
            ripple.style.background = 'rgba(255,255,255,0.35)';
            ripple.style.transform = 'scale(0)';
            ripple.style.transition = 'transform 400ms ease, opacity 500ms ease';

            target.style.position = 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);

            requestAnimationFrame(() => {
                ripple.style.transform = 'scale(2.5)';
                ripple.style.opacity = '0';
            });

            setTimeout(() => ripple.remove(), 520);
        }

        const clickable = document.querySelectorAll('.btn, .product-item');
        clickable.forEach(el => el.addEventListener('click', addRipple));
    }

    // ============================================
    // ユーザーインタラクションの追跡（分析用）
    // ============================================
    function initAnalytics() {
        // カテゴリーバッジのクリックを追跡
        const categoryBadges = document.querySelectorAll('.category-badge-item');
        categoryBadges.forEach(badge => {
            badge.addEventListener('click', function() {
                const badgeText = this.querySelector('.badge-text')?.textContent;
                console.log('Category badge clicked:', badgeText);
                // ここで分析サービスにデータを送信できます
                // 例: ga('send', 'event', 'Category', 'Click', badgeText);
            });
        });

        // 商品アイテムのクリックを追跡
        const productItems = document.querySelectorAll('.product-item');
        productItems.forEach(item => {
            item.addEventListener('click', function(e) {
                const productName = this.querySelector('.product-name')?.textContent;
                console.log('Product clicked:', productName);
                // 例: ga('send', 'event', 'Product', 'Click', productName);
            });
        });

        // おすすめ商品のクリックを追跡
        const featuredButtons = document.querySelectorAll('.featured-detail-item .btn');
        featuredButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                const featuredItem = this.closest('.featured-detail-item');
                if (featuredItem) {
                    const productTitle = featuredItem.querySelector('.featured-detail-title')?.textContent;
                    console.log('Featured product clicked:', productTitle);
                    // 例: ga('send', 'event', 'Featured', 'Click', productTitle);
                }
            });
        });
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

    // ============================================
    // レスポンシブ画像の処理
    // ============================================
    function handleResponsiveImages() {
        const handleResize = debounce(() => {
            const images = document.querySelectorAll('img[data-src-mobile][data-src-desktop]');
            const isMobile = window.innerWidth < 768;
            
            images.forEach(img => {
                const newSrc = isMobile ? img.dataset.srcMobile : img.dataset.srcDesktop;
                if (img.src !== newSrc) {
                    img.src = newSrc;
                }
            });
        }, 250);

        window.addEventListener('resize', handleResize);
        handleResize(); // 初期呼び出し
    }

    // ============================================
    // DOM準備完了時にすべての関数を初期化
    // ============================================
    function init() {
        // コア機能
        initSeoMetadata();
        initCategoryBadges();
        initSmoothScroll();
        initHeroSlider();
        initImageSlider();
        
        // 視覚的強化
        initScrollAnimations();
        initLazyLoading();
        initScrollToTop();
        initSnow();
        initButtonRipples();
        
        // 追跡
        initAnalytics();
        
        // パフォーマンス
        handleResponsiveImages();

        // 初期化ログ
        console.log('LOSE FORD LP initialized successfully');
    }

    // DOMの準備完了を待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================
    // 楽天固有の最適化
    // ============================================
    // 必要に応じて楽天の特定環境を処理
    window.addEventListener('load', () => {
        // すべての画像が読み込まれたことを確認
        const allImages = document.querySelectorAll('img');
        let loadedImages = 0;

        allImages.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    if (loadedImages === allImages.length) {
                        console.log('All images loaded');
                    }
                });
            }
        });

        // ページパフォーマンスの追跡
        if (window.performance && window.performance.timing) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log('Page load time:', pageLoadTime + 'ms');
        }
    });

})();

