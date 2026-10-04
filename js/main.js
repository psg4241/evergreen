/**
 * Hotel Evergreen Restaurant & Rooms Dahanu
 * Interactive Script: WhatsApp Routing, Booking Forms, Lightbox, Dynamic Dates & Filters
 */

document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMBER = '9226422375'; // 9226422375 with India country code
  const GOOGLE_MAPS_LINK = 'https://share.google/4agrEP8nls6xT2bJB';

  // ===================================================================
  // 1. DATE PRE-FILL FOR BOOKING FORMS
  // ===================================================================
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const checkInInput = document.getElementById('barCheckIn');
  const checkOutInput = document.getElementById('barCheckOut');
  const modalCheckIn = document.getElementById('modalCheckIn');
  const modalCheckOut = document.getElementById('modalCheckOut');

  if (checkInInput && checkOutInput) {
    checkInInput.min = formatDate(today);
    checkInInput.value = formatDate(today);
    checkOutInput.min = formatDate(tomorrow);
    checkOutInput.value = formatDate(tomorrow);

    checkInInput.addEventListener('change', () => {
      const selected = new Date(checkInInput.value);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);
      checkOutInput.min = formatDate(nextDay);
      if (new Date(checkOutInput.value) <= selected) {
        checkOutInput.value = formatDate(nextDay);
      }
    });
  }

  if (modalCheckIn && modalCheckOut) {
    modalCheckIn.min = formatDate(today);
    modalCheckIn.value = formatDate(today);
    modalCheckOut.min = formatDate(tomorrow);
    modalCheckOut.value = formatDate(tomorrow);

    modalCheckIn.addEventListener('change', () => {
      const selected = new Date(modalCheckIn.value);
      const nextDay = new Date(selected);
      nextDay.setDate(selected.getDate() + 1);
      modalCheckOut.min = formatDate(nextDay);
      if (new Date(modalCheckOut.value) <= selected) {
        modalCheckOut.value = formatDate(nextDay);
      }
    });
  }

  // ===================================================================
  // 2. WHATSAPP URL BUILDER & SENDER
  // ===================================================================
  window.openWhatsApp = (message) => {
    const encoded = encodeURIComponent(message.trim());
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Quick Hero Booking Search Bar Handler
  const heroBookingForm = document.getElementById('heroBookingForm');
  if (heroBookingForm) {
    heroBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const checkIn = document.getElementById('barCheckIn')?.value || 'Not specified';
      const checkOut = document.getElementById('barCheckOut')?.value || 'Not specified';
      const experience = document.getElementById('barExperience')?.value || 'General Stay';
      const guests = document.getElementById('barGuests')?.value || '2 Adults';

      const msg = `🌿 *Hotel Evergreen Dahanu - Booking Inquiry*
────────────────────────
🏨 *Requirement:* ${experience}
📅 *Check-In:* ${checkIn}
📅 *Check-Out:* ${checkOut}
👥 *Guests:* ${guests}

Hello Evergreen team, please let me know availability and best pricing for these dates!`;

      window.openWhatsApp(msg);
    });
  }

  // Quick Room Specific Booking Trigger
  window.bookSpecificRoom = (roomName) => {
    const msg = `🌿 *Hotel Evergreen Dahanu - Room Reservation*
────────────────────────
🛏️ *Selected Room:* ${roomName}

Hello, I want to book this room at Hotel Evergreen Dahanu. Please share available dates and booking procedure!`;
    window.openWhatsApp(msg);
  };

  // Specific Feature Inquiries
  window.inquireFeature = (feature) => {
    let msg = '';
    switch (feature) {
      case 'wedding':
        msg = `🎪 *Hotel Evergreen Dahanu - Marriage Lawn & Banquet Inquiry*
────────────────────────
Hello Evergreen Team, I am planning a Wedding / Reception in Dahanu. 
Please share details regarding:
• Lawn & Banquet Hall Capacity
• Catering packages (Veg/Agri/Seafood)
• Stage decoration & lighting
• Guest room packages & available dates`;
        break;

      case 'parties':
        msg = `🎉 *Hotel Evergreen Dahanu - Event / Party Inquiry*
────────────────────────
Hello! I would like to organize a Private Celebration (Birthday / Anniversary / Corporate Outing) at Hotel Evergreen.
Please share your party packages, lawn/restaurant arrangements, and music/catering options.`;
        break;

      case 'pool':
        msg = `🏊‍♂️ *Hotel Evergreen Dahanu - Swimming Pool & Day Picnic*
────────────────────────
Hello! I would like to inquire about the Swimming Pool access, day picnic packages, and entry timings for family / friends.`;
        break;

      case 'camping':
        msg = `⛺ *Hotel Evergreen Dahanu - Night Camping & Bonfire Inquiry*
────────────────────────
Hello! I want to experience Night Camping & Bonfire under the stars at Hotel Evergreen Dahanu. 
Please share tent package rates, dinner/barbecue inclusions, and weekend availability.`;
        break;

      case 'chikoo_farm':
        msg = `🍈 *Hotel Evergreen Dahanu - Chikoo Farm Agro-Tourism*
────────────────────────
Hello! I would love to visit your lush Chikoo orchards in Dahanu for agro-tourism and purchase fresh farm-grown Chikoos. 
Please share visiting timings and guided farm tour details.`;
        break;

      case 'restaurant':
        msg = `🍽️ *Evergreen Restaurant Dahanu - Dining / Table Booking*
────────────────────────
Hello! I would like to reserve a table / order food at Evergreen Restaurant Dahanu. 
Please share your specialty menu (Coastal Seafood, Agri Thali, Veg & Dahanu Chikoo specials).`;
        break;

      default:
        msg = `🌿 *Hotel Evergreen Restaurant & Rooms Dahanu*
────────────────────────
Hello! I would like to make an inquiry regarding your rooms and resort amenities.`;
    }
    window.openWhatsApp(msg);
  };

  // ===================================================================
  // 3. BOOKING MODAL LOGIC
  // ===================================================================
  const modalOverlay = document.getElementById('bookingModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBookingForm = document.getElementById('modalBookingForm');
  const modalCategorySelect = document.getElementById('modalCategory');

  window.openBookingModal = (category = 'Deluxe AC Room') => {
    if (modalOverlay) {
      if (modalCategorySelect && category) {
        modalCategorySelect.value = category;
      }
      modalOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeBookingModal = () => {
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', window.closeBookingModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        window.closeBookingModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeBookingModal();
      window.closeLightbox();
    }
  });

  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modalName')?.value || 'Guest';
      const phone = document.getElementById('modalPhone')?.value || 'Not provided';
      const category = document.getElementById('modalCategory')?.value || 'Stay';
      const checkIn = document.getElementById('modalCheckIn')?.value || 'Today';
      const checkOut = document.getElementById('modalCheckOut')?.value || 'Tomorrow';
      const guests = document.getElementById('modalGuests')?.value || '2';
      const notes = document.getElementById('modalNotes')?.value || 'None';

      const msg = `🌿 *Hotel Evergreen Dahanu - Direct WhatsApp Reservation*
────────────────────────
👤 *Guest Name:* ${name}
📞 *Contact No:* ${phone}
🛎️ *Booking For:* ${category}
📅 *Check-In:* ${checkIn}
📅 *Check-Out:* ${checkOut}
👥 *Number of Guests:* ${guests}
📝 *Special Notes:* ${notes}

Kindly confirm availability and tariff on WhatsApp. Thank you!`;

      window.openWhatsApp(msg);
      window.closeBookingModal();
      modalBookingForm.reset();
    });
  }

  // ===================================================================
  // 4. ROOM FILTER TABS
  // ===================================================================
  const roomFilterBtns = document.querySelectorAll('.room-filter-btn');
  const roomCards = document.querySelectorAll('.room-card');

  roomFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roomFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      roomCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ===================================================================
  // 5. RESTAURANT MENU TABS
  // ===================================================================
  const menuTabBtns = document.querySelectorAll('.menu-tab-btn');
  const menuItemLists = document.querySelectorAll('.menu-items-group');

  menuTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      menuTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetCategory = btn.getAttribute('data-menu');
      menuItemLists.forEach(group => {
        if (group.id === `menu-${targetCategory}`) {
          group.style.display = 'grid';
        } else {
          group.style.display = 'none';
        }
      });
    });
  });

  // ===================================================================
  // 6. CURATED GALLERY FILTER & LIGHTBOX
  // ===================================================================
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-gallery');
      galleryItems.forEach(item => {
        const itemCat = item.getAttribute('data-category') || '';
        if (filter === 'all' || itemCat.includes(filter)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  window.openLightbox = (src, caption) => {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightboxCaption.textContent = caption || 'Hotel Evergreen Dahanu';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', window.closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        window.closeLightbox();
      }
    });
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-overlay span')?.textContent || '';
      if (img) {
        window.openLightbox(img.src, caption);
      }
    });
  });

  // ===================================================================
  // 7. FAQ ACCORDION
  // ===================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answerDiv = item.querySelector('.faq-answer');

    if (questionBtn && answerDiv) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Close other FAQs
        faqItems.forEach(other => {
          other.classList.remove('active');
          const otherAnswer = other.querySelector('.faq-answer');
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('active');
          answerDiv.style.maxHeight = answerDiv.scrollHeight + 40 + 'px';
        }
      });
    }
  });

  // ===================================================================
  // 8. MOBILE NAVBAR DRAWER TOGGLE
  // ===================================================================
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('active');
      menuToggle.setAttribute('aria-expanded', open);
      const icon = menuToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });

    // Close mobile nav when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars');
          icon.classList.remove('fa-times');
        }
      });
    });
  }

  // ===================================================================
  // 9. NAVBAR SCROLL EFFECT
  // ===================================================================
  const header = document.querySelector('.main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // Close drawer on outside click / Esc
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active') && !e.target.closest('.main-header')) {
      navLinks.classList.remove('active'); menuToggle?.setAttribute('aria-expanded', 'false');
      const ic = menuToggle?.querySelector('i'); if (ic) { ic.classList.add('fa-bars'); ic.classList.remove('fa-times'); }
    }
  });

  // Scroll-spy: highlight the nav link of the section in view
  const spyLinks = [...document.querySelectorAll('.nav-item')];
  const spyMap = spyLinks.map(a => {
    let el = document.querySelector(a.getAttribute('href'));
    return { a, el };
  }).filter(x => x.el);
  const spy = () => {
    const y = window.scrollY + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80) + 60;
    let cur = spyMap[0];
    spyMap.forEach(x => { if (x.el.getBoundingClientRect().top + window.scrollY <= y) cur = x; });
    // Experiences link covers pool, camping, chikoo, amenities
    const exp = spyMap.find(x => x.a.getAttribute('href') === '#pool');
    const camp = document.getElementById('amenities');
    if (exp && camp && cur === exp) { /* stay */ }
    spyLinks.forEach(a => a.classList.toggle('active', a === cur.a));
  };
  window.addEventListener('scroll', spy, { passive: true }); spy();

  // ===================================================================
  // 10. HERO BANNER BACKGROUND VIDEO & AUTOPLAY RECOVERY
  // ===================================================================
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    
    // Attempt playback cleanly
    const startPlay = () => {
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser restricts autoplay before user interaction:
          const unlockAutoplay = () => {
            heroVideo.play().catch(() => {});
            ['click', 'touchstart', 'scroll'].forEach(evt => {
              document.removeEventListener(evt, unlockAutoplay);
            });
          };
          ['click', 'touchstart', 'scroll'].forEach(evt => {
            document.addEventListener(evt, unlockAutoplay, { once: true, passive: true });
          });
        });
      }
    };

    startPlay();

    heroVideo.addEventListener('error', () => {
      console.warn('Hero video failed to load, falling back to background poster.');
    });
  }

  // ===================================================================
  // 11. HERO BANNER ANIMATED TEXT (SHOWING TEXT ONE AFTER ONE)
  // ===================================================================
  // A. Dynamic Typewriter Effect (One phrase after another)
  const typewriterEl = document.getElementById('heroTypewriterText');
  if (typewriterEl) {
    const typewriterPhrases = [
      'Lush Chikoo Orchards',
      'Crystal Swimming Pool',
      'Fresh Coastal Seafood',
      'Grand Marriage Lawn',
      'Deluxe AC & Family Suites',
      'Night Camping & Bonfire'
    ];

    let phraseIndex = 0;
    let charIndex = typewriterPhrases[0].length; // start with first complete text
    let isDeleting = false;
    let typingSpeed = 80;

    const typeStep = () => {
      const currentPhrase = typewriterPhrases[phraseIndex];

      if (isDeleting) {
        charIndex--;
        typewriterEl.textContent = currentPhrase.substring(0, charIndex);
        typingSpeed = 40;
      } else {
        charIndex++;
        typewriterEl.textContent = currentPhrase.substring(0, charIndex);
        typingSpeed = 85;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        // Finished typing current phrase, pause before deleting
        typingSpeed = 2400;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        // Finished deleting, move to next phrase
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % typewriterPhrases.length;
        typingSpeed = 400; // brief pause before typing next
      }

      setTimeout(typeStep, typingSpeed);
    };

    // Start after slight initial delay so visitor sees initial phrase
    setTimeout(typeStep, 2200);
  }

  // B. Highlights Rotator Pill with Dots & Hover Pause
  const rotatorSlides = document.querySelectorAll('#rotatorViewport .rotator-slide');
  const rotatorDots = document.querySelectorAll('#rotatorDots .rotator-dot');
  const rotatorPill = document.getElementById('heroRotatorPill');

  if (rotatorSlides.length > 0) {
    let currentSlide = 0;
    let rotatorInterval = null;
    const ROTATION_DELAY = 3600;

    const goToSlide = (nextIndex) => {
      if (nextIndex === currentSlide) return;

      const prevSlide = rotatorSlides[currentSlide];
      const targetSlide = rotatorSlides[nextIndex];

      if (prevSlide && targetSlide) {
        // Exit animation for current
        prevSlide.classList.remove('active');
        prevSlide.classList.add('exit');

        setTimeout(() => {
          prevSlide.classList.remove('exit');
        }, 550);

        // Entrance animation for next
        targetSlide.classList.add('active');

        // Update dots
        rotatorDots.forEach((dot, idx) => {
          dot.classList.toggle('active', idx === nextIndex);
        });

        currentSlide = nextIndex;
      }
    };

    const nextSlide = () => {
      const nextIndex = (currentSlide + 1) % rotatorSlides.length;
      goToSlide(nextIndex);
    };

    const startRotator = () => {
      if (!rotatorInterval) {
        rotatorInterval = setInterval(nextSlide, ROTATION_DELAY);
      }
    };

    const stopRotator = () => {
      if (rotatorInterval) {
        clearInterval(rotatorInterval);
        rotatorInterval = null;
      }
    };

    // Click on progress dots
    rotatorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10);
        if (!isNaN(slideIdx)) {
          stopRotator();
          goToSlide(slideIdx);
          startRotator();
        }
      });
    });

    // Pause on hover so user can read comfortably
    if (rotatorPill) {
      rotatorPill.addEventListener('mouseenter', stopRotator);
      rotatorPill.addEventListener('mouseleave', startRotator);
    }

    startRotator();
  }

  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
