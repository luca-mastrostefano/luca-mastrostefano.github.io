document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn[data-timeline]');
    const timelineSections = document.querySelectorAll('.timeline-section');
    const timelineSteps = document.querySelectorAll('.timeline-step');

    // Timeline Switching
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const timelineId = btn.getAttribute('data-timeline');

            // Update buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update sections
            timelineSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `timeline-${timelineId}`) {
                    section.classList.add('active');
                }
            });

            // Smooth scroll to the top of the timelines container
            const container = document.getElementById('timelines-container');
            const nav = document.querySelector('.timeline-nav');
            const offset = nav.offsetHeight + 24; // nav height + 1.5rem sticky top value

            window.scrollTo({
                top: window.scrollY + container.getBoundingClientRect().top - offset,
                behavior: 'smooth'
            });
        });
    });

    // Step Expansion
    timelineSteps.forEach(step => {
        step.addEventListener('click', (e) => {
            // Prevent toggling when clicking links or buttons inside the card
            if (e.target.closest('a, button')) return;

            const isExpanded = step.classList.contains('expanded');

            // When expanded, only clicks on the summary (step-header) should collapse.
            // Clicks inside step-details (content revealed by expansion) are ignored.
            if (isExpanded && !e.target.closest('.step-header')) return;

            if (isExpanded) {
                // CLOSING: Handle scroll anchoring to keep the next content in place
                const rectBefore = step.getBoundingClientRect();
                const nextStep = step.nextElementSibling;
                const initialPadding = document.body.style.paddingBottom;
                const initialScrollBehavior = document.documentElement.style.scrollBehavior;

                if (rectBefore.top < 0 && rectBefore.bottom < window.innerHeight && nextStep) {
                    // Scenario: Top is off-screen but bottom is in view. Anchor to the next card.
                    const initialNextTop = nextStep.getBoundingClientRect().top;
                    const startTime = performance.now();

                    document.documentElement.style.scrollBehavior = 'auto';
                    document.body.style.paddingBottom = '2000px';

                    step.classList.remove('expanded');

                    const anchorScroll = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        if (step.classList.contains('expanded') || elapsed > 600) {
                            document.body.style.paddingBottom = initialPadding;
                            document.documentElement.style.scrollBehavior = initialScrollBehavior;
                            return;
                        }

                        const currentNextTop = nextStep.getBoundingClientRect().top;
                        const diff = currentNextTop - initialNextTop;

                        if (Math.abs(diff) > 0.1) {
                            window.scrollBy(0, diff);
                        }
                        requestAnimationFrame(anchorScroll);
                    };
                    requestAnimationFrame(anchorScroll);
                } else if (rectBefore.top < 0 && rectBefore.bottom >= window.innerHeight) {
                    // Scenario: Middle of card (Top above, Bottom below). 
                    // Scroll to header so user sees what they just collapsed.
                    const scrollTarget = window.pageYOffset + rectBefore.top - 100;
                    window.scrollTo({
                        top: scrollTarget,
                        behavior: 'smooth'
                    });
                    step.classList.remove('expanded');
                } else if (rectBefore.top < 0 && !nextStep) {
                    // Last item, anchor to card top
                    const scrollTarget = window.pageYOffset + rectBefore.top - 20;
                    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                    step.classList.remove('expanded');
                } else {
                    step.classList.remove('expanded');
                }
            } else {
                // EXPANDING: Simple toggle
                step.classList.add('expanded');
            }
        });
    });

    // Horizontal Scroll with Mouse Drag (for desktop)
    const carousels = document.querySelectorAll('.media-carousel');
    carousels.forEach(carousel => {
        // Double the items for a seamless loop
        const originalContent = carousel.innerHTML;
        carousel.innerHTML += originalContent;

        let isDown = false;
        let startX;
        let scrollLeft;

        const baseSpeed = 0.5; // pixels per frame
        let targetSpeed = baseSpeed;
        let currentSpeed = baseSpeed;
        const transitionFactor = 0.02; // how quickly it accelerates/decelerates

        const step = () => {
            // Linear interpolation towards target speed
            if (currentSpeed < targetSpeed) {
                currentSpeed = Math.min(targetSpeed, currentSpeed + transitionFactor);
            } else if (currentSpeed > targetSpeed) {
                currentSpeed = Math.max(targetSpeed, currentSpeed - transitionFactor);
            }

            if (!isDown && currentSpeed > 0) {
                carousel.scrollLeft += currentSpeed;

                // Seamless reset when we reach the end of the first set of items
                if (carousel.scrollLeft >= (carousel.scrollWidth / 2)) {
                    carousel.scrollLeft = 0;
                }
            }
            requestAnimationFrame(step);
        };

        // Start auto-scroll
        requestAnimationFrame(step);

        carousel.addEventListener('mouseenter', () => {
            targetSpeed = 0;
        });

        carousel.addEventListener('mouseleave', () => {
            if (isDown) {
                isDown = false;
                carousel.style.cursor = 'grab';
            }
            targetSpeed = baseSpeed;
        });

        carousel.addEventListener('mousedown', (e) => {
            isDown = true;
            targetSpeed = 0;
            currentSpeed = 0; // Immediate stop when interacting
            carousel.style.cursor = 'grabbing';
            startX = e.pageX - carousel.offsetLeft;
            scrollLeft = carousel.scrollLeft;
        });

        carousel.addEventListener('mouseup', () => {
            isDown = false;
            carousel.style.cursor = 'grab';
            targetSpeed = baseSpeed;
        });

        carousel.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carousel.offsetLeft;
            const walk = (x - startX) * 2; // scroll speed multiplier
            carousel.scrollLeft = scrollLeft - walk;
        });
    });

    // In-page Video Playback
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card expansion toggle
            const videoId = card.getAttribute('data-video');
            if (videoId) {
                // Handling for file:// protocol which blocks origin parameters
                const isLocalFile = window.location.protocol === 'file:';
                const origin = isLocalFile ? '' : `&origin=${window.location.origin}`;

                card.innerHTML = `<iframe
                    src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0${origin}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    style="width: 100%; height: 100%; border-radius: 12px; background: black; display: block;"
                    title="Reproducible Simulation Video"
                    allowfullscreen></iframe>`;
                card.style.background = 'black';
                card.style.cursor = 'default';
            }
        });
    });

    // YouTube Overlay Player (inline text triggers like the "Josha" WarGames reference)
    const ytOverlay = document.getElementById('yt-overlay');
    if (ytOverlay) {
        const frame = ytOverlay.querySelector('.yt-overlay-frame');
        const closeBtn = ytOverlay.querySelector('.yt-overlay-close');
        let preconnected = false;

        // Warm up YouTube connections on first hover/focus so click-to-play feels instant
        // without paying the cost on initial page load.
        const preconnect = () => {
            if (preconnected) return;
            preconnected = true;
            ['https://www.youtube.com', 'https://i.ytimg.com', 'https://s.ytimg.com'].forEach(href => {
                const link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = href;
                link.crossOrigin = '';
                document.head.appendChild(link);
            });
        };

        const openOverlay = (videoId, start) => {
            const isLocalFile = window.location.protocol === 'file:';
            const origin = isLocalFile ? '' : `&origin=${window.location.origin}`;
            const startParam = start ? `&start=${encodeURIComponent(start)}` : '';
            frame.innerHTML = `<iframe
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0${startParam}${origin}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="YouTube video player"
                allowfullscreen></iframe>`;
            ytOverlay.hidden = false;
            // Force reflow so the transition runs from opacity 0.
            void ytOverlay.offsetWidth;
            ytOverlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        };

        const closeOverlay = () => {
            ytOverlay.classList.remove('is-open');
            document.body.style.overflow = '';
            // Unload iframe to stop playback and free resources.
            setTimeout(() => {
                frame.innerHTML = '';
                ytOverlay.hidden = true;
            }, 200);
        };

        document.querySelectorAll('.youtube-trigger').forEach(trigger => {
            trigger.addEventListener('mouseenter', preconnect, { once: true });
            trigger.addEventListener('focus', preconnect, { once: true });
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const videoId = trigger.getAttribute('data-video');
                const start = trigger.getAttribute('data-start');
                if (videoId) openOverlay(videoId, start);
            });
        });

        closeBtn.addEventListener('click', closeOverlay);
        ytOverlay.addEventListener('click', (e) => {
            if (e.target === ytOverlay) closeOverlay();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !ytOverlay.hidden) closeOverlay();
        });
    }

    // Theme Toggling
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');

    const setTheme = (theme, persist = false) => {
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) {
            localStorage.setItem('theme', theme);
        }

        // Use standard SVG icons for sun/moon
        if (theme === 'light') {
            themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        } else {
            themeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        }
    };

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Use saved theme if it exists, otherwise use system preference
    const initialTheme = savedTheme || (systemPrefersDark.matches ? 'dark' : 'light');
    setTheme(initialTheme, false); // Don't persist on init so we can still follow system changes

    // Update theme if system preference changes and no user override exists
    systemPrefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme, true); // Persist user choice
    });

    // Custom PDF Viewer to completely hide toolbars and fix mobile limitations
    const pdfIframes = document.querySelectorAll('iframe[src*=".pdf"]');
    const isLocalFile = window.location.protocol === 'file:';

    if (pdfIframes.length > 0 && !isLocalFile) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
        script.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

            pdfIframes.forEach(iframe => {
                const url = iframe.getAttribute('src').split('#')[0];

                const h = iframe.getAttribute('height') ? iframe.getAttribute('height') + 'px' : '500px';
                const container = document.createElement('div');
                container.style.width = '100%';
                container.style.height = h;
                container.style.maxHeight = h;
                container.style.overflowY = 'auto';
                container.style.webkitOverflowScrolling = 'touch';
                container.style.background = '#eee';
                container.style.borderRadius = iframe.style.borderRadius || '0';

                iframe.parentNode.replaceChild(container, iframe);

                let isPdfLoaded = false;
                const containerObserver = new IntersectionObserver(async (entries) => {
                    for (const entry of entries) {
                        if (entry.isIntersecting && !isPdfLoaded) {
                            isPdfLoaded = true;
                            containerObserver.unobserve(container);

                            try {
                                const pdf = await pdfjsLib.getDocument(url).promise;
                                const page1 = await pdf.getPage(1);
                                const vp = page1.getViewport({ scale: 1.0 });
                                const aspectRatio = vp.width / vp.height;

                                const pageObserver = new IntersectionObserver((pageEntries) => {
                                    pageEntries.forEach(pageEntry => {
                                        if (pageEntry.isIntersecting) {
                                            const canvas = pageEntry.target;
                                            if (!canvas.dataset.rendered) {
                                                canvas.dataset.rendered = "true";
                                                const pageNum = parseInt(canvas.dataset.page);
                                                pdf.getPage(pageNum).then(page => {
                                                    const viewport = page.getViewport({ scale: 1.5 });
                                                    canvas.width = viewport.width;
                                                    canvas.height = viewport.height;
                                                    const ctx = canvas.getContext('2d');
                                                    page.render({ canvasContext: ctx, viewport: viewport });
                                                });
                                            }
                                        }
                                    });
                                }, { rootMargin: '300px' });

                                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                                    const canvas = document.createElement('canvas');
                                    canvas.dataset.page = pageNum;
                                    canvas.style.width = '100%';
                                    canvas.style.aspectRatio = aspectRatio.toString();
                                    canvas.style.display = 'block';
                                    canvas.style.marginBottom = '8px';
                                    canvas.style.backgroundColor = 'white';
                                    container.appendChild(canvas);
                                    pageObserver.observe(canvas);
                                }
                            } catch (e) {
                                container.innerHTML = `<p style="color:#666; padding: 2rem; text-align:center;">Error loading document: <b>${e.message || e}</b><br><br><a href="${url}" target="_blank" style="color:var(--accent-color); text-decoration:none; font-weight:bold;">Download PDF</a></p>`;
                            }
                        }
                    }
                }, { rootMargin: '500px' });

                containerObserver.observe(container);
            });
        };
        document.head.appendChild(script);
    }

    // Lazy-play carousel video after page load to save initial bandwidth and maximize LCP
    window.addEventListener('load', () => {
        const carouselVideo = document.getElementById('hero-carousel-video');
        if (carouselVideo) {
            carouselVideo.play().catch(e => console.log('Autoplay prevented by browser data-saver policies', e));
        }
    });
});

