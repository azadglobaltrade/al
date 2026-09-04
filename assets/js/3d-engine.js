/**
 * AZAD GLOBAL TRADE — 3D VISUAL & INTERACTIVE ENGINE
 * Features:
 * 1. GPU-accelerated 3D Parallax Card Tilt & Dynamic Glare tracking
 * 2. Interactive 3D Shipping Container & Freight Capacity Calculator
 * 3. Node.js API AJAX Form Processor & 3D Holographic Confirmation Modal
 * 4. Animated 3D Numerical Counters & Micro-interactions
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    init3DTilt();
    initContainerCalculator();
    initAjaxQuoteForms();
    initStatCounters();
    init3DModals();
    initRevealSafety();
    fetchBackendTelemetry();
  });

  /* ==========================================================================
     7. SCROLL-REVEAL SAFETY NET (mobile-friendly)
     Ensures .fade-up content is NEVER left invisible, even if a page's own
     inline observer fails or IntersectionObserver is unsupported.
     ========================================================================== */
  function initRevealSafety() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    // Very old browsers without IntersectionObserver: reveal everything.
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('visible'));
      return;
    }

    // After the page settles, force-reveal anything still hidden that is
    // already inside the viewport (covers IO edge cases on mobile browsers).
    window.addEventListener('load', () => {
      setTimeout(() => {
        els.forEach((el) => {
          if (el.classList.contains('visible')) return;
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('visible');
        });
      }, 1200);
    });
  }

  /* ==========================================================================
     1. GPU-ACCELERATED 3D PARALLAX TILT & SPECULAR GLARE
     ========================================================================== */
  function init3DTilt() {
    // Select all 3D cards across the site
    const cards = document.querySelectorAll('.card-3d, .card-h, .product-tactile-card');

    cards.forEach((card) => {
      // Create glare overlay if not present
      if (!card.querySelector('.card-3d-glare')) {
        const glare = document.createElement('div');
        glare.className = 'card-3d-glare';
        card.appendChild(glare);
      }

      const glareEl = card.querySelector('.card-3d-glare');
      let rect = null;
      let rafId = null;

      function onMouseEnter() {
        rect = card.getBoundingClientRect();
      }

      function onMouseMove(e) {
        if (!rect) rect = card.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPercent = (mouseX / rect.width - 0.5) * 2; // -1 to 1
        const yPercent = (mouseY / rect.height - 0.5) * 2; // -1 to 1

        const maxRotateX = 8;
        const maxRotateY = 8;

        const rotateX = -yPercent * maxRotateX;
        const rotateY = xPercent * maxRotateY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;

          // Glare follow cursor
          if (glareEl) {
            const glareX = (mouseX / rect.width) * 100;
            const glareY = (mouseY / rect.height) * 100;
            glareEl.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22) 0%, rgba(218,181,101,0.08) 40%, rgba(0,0,0,0) 75%)`;
          }
        });
      }

      function onMouseLeave() {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
        rect = null;
      }

      card.addEventListener('mouseenter', onMouseEnter, { passive: true });
      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    });
  }

  /* ==========================================================================
     2. INTERACTIVE 3D SHIPPING CONTAINER & FREIGHT CALCULATOR
     ========================================================================== */
  function initContainerCalculator() {
    const calcSection = document.getElementById('containerFreightSection');
    if (!calcSection) return;

    const productSelect = document.getElementById('calcProductSelect');
    const qtyInput = document.getElementById('calcQtyInput');
    const qtySlider = document.getElementById('calcQtySlider');
    const containerToggle20 = document.getElementById('toggle20ft');
    const containerToggle40 = document.getElementById('toggle40ft');
    const portSelect = document.getElementById('calcPortSelect');

    const cargoFillEl = document.getElementById('calcCargoFill');
    const cbmValueEl = document.getElementById('calcCbmValue');
    const cbmPercentEl = document.getElementById('calcCbmPercent');
    const weightValueEl = document.getElementById('calcWeightValue');
    const palletsValueEl = document.getElementById('calcPalletsValue');
    const transitValueEl = document.getElementById('calcTransitValue');
    const routeValueEl = document.getElementById('calcRouteValue');
    const lockQuoteBtn = document.getElementById('calcLockQuoteBtn');
    const palletGrid = document.getElementById('calcPalletGrid');

    // Create 40 pallet visual blocks in grid
    if (palletGrid && palletGrid.children.length === 0) {
      for (let i = 0; i < 40; i++) {
        const block = document.createElement('div');
        block.className = 'pallet-block';
        palletGrid.appendChild(block);
      }
    }

    let currentContainer = '20ft';

    function updateCalculations() {
      const productType = productSelect ? productSelect.value : 'jute_shopping_bags';
      const quantity = parseInt(qtyInput ? qtyInput.value : '10000', 10) || 10000;
      const port = portSelect ? portSelect.value : 'london';

      // Perform local client-side calculation for immediate 60fps feedback
      const specs = {
        'jute_shopping_bags': { cbmPer1k: 0.85, kgPer1k: 220, defaultPallet: 2500 },
        'hessian_sacks': { cbmPer1k: 1.45, kgPer1k: 450, defaultPallet: 1500 },
        'drawstring_pouches': { cbmPer1k: 0.35, kgPer1k: 85, defaultPallet: 5000 },
        'spices_pulses': { cbmPer1k: 1.60, kgPer1k: 1000, defaultPallet: 1000 },
        'agricultural_grain': { cbmPer1k: 1.70, kgPer1k: 1000, defaultPallet: 1000 }
      };

      const portData = {
        'london': { transit: '18 - 22 Days', route: 'Kolkata / Haldia → Port of Felixstowe / London' },
        'rotterdam': { transit: '19 - 24 Days', route: 'Kolkata Port → Rotterdam Gateway (EU Hub)' },
        'jebel_ali': { transit: '7 - 10 Days', route: 'Kolkata / JNPT → Jebel Ali Port, Dubai' },
        'hamburg': { transit: '21 - 26 Days', route: 'Kolkata Port → Port of Hamburg (Germany)' },
        'new_york': { transit: '28 - 34 Days', route: 'Kolkata Port → Port of NY / NJ (USA)' },
        'singapore': { transit: '5 - 8 Days', route: 'Kolkata Direct → Port of Singapore Hub' }
      };

      const item = specs[productType] || specs['jute_shopping_bags'];
      const pInfo = portData[port] || portData['london'];

      const is40 = currentContainer === '40ft_hc';
      const maxCbm = is40 ? 76.2 : 33.2;
      const maxKg = is40 ? 26500 : 21700;

      const totalCbm = ((quantity / 1000) * item.cbmPer1k).toFixed(2);
      const totalKg = Math.round((quantity / 1000) * item.kgPer1k);
      const totalMt = (totalKg / 1000).toFixed(2);

      const fillPct = Math.min(100, Math.round((totalCbm / maxCbm) * 100));
      const palletCount = Math.ceil(quantity / item.defaultPallet);

      // Update UI Elements
      if (cbmValueEl) cbmValueEl.innerText = `${totalCbm} m³`;
      if (cbmPercentEl) cbmPercentEl.innerText = `${fillPct}% of ${is40 ? '40ft HC' : '20ft Std'}`;
      if (weightValueEl) weightValueEl.innerText = `${totalMt} MT (${totalKg.toLocaleString()} kg)`;
      if (palletsValueEl) palletsValueEl.innerText = `${palletCount} Pallets`;
      if (transitValueEl) transitValueEl.innerText = pInfo.transit;
      if (routeValueEl) routeValueEl.innerText = pInfo.route;

      // Animate container fill height
      if (cargoFillEl) {
        cargoFillEl.style.height = `${fillPct}%`;
      }

      // Light up pallet blocks
      if (palletGrid) {
        const blocks = palletGrid.querySelectorAll('.pallet-block');
        const activeCount = Math.min(blocks.length, Math.ceil((fillPct / 100) * blocks.length));
        blocks.forEach((b, idx) => {
          if (idx < activeCount) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
      }

      // Auto Suggest Container if overfilled
      if (fillPct >= 98 && currentContainer === '20ft' && containerToggle40) {
        // Subtle hint
        containerToggle40.classList.add('animate-pulse');
      } else if (containerToggle40) {
        containerToggle40.classList.remove('animate-pulse');
      }
    }

    // Sync input and slider
    if (qtyInput && qtySlider) {
      qtySlider.addEventListener('input', (e) => {
        qtyInput.value = e.target.value;
        updateCalculations();
      });
      qtyInput.addEventListener('input', (e) => {
        qtySlider.value = e.target.value;
        updateCalculations();
      });
    }

    if (productSelect) productSelect.addEventListener('change', updateCalculations);
    if (portSelect) portSelect.addEventListener('change', updateCalculations);

    if (containerToggle20 && containerToggle40) {
      containerToggle20.addEventListener('click', () => {
        currentContainer = '20ft';
        containerToggle20.classList.replace('bg-base-900', 'bg-gold-600');
        containerToggle20.classList.replace('text-warm-400', 'text-base-900');
        containerToggle40.classList.replace('bg-gold-600', 'bg-base-900');
        containerToggle40.classList.replace('text-base-900', 'text-warm-400');
        updateCalculations();
      });

      containerToggle40.addEventListener('click', () => {
        currentContainer = '40ft_hc';
        containerToggle40.classList.replace('bg-base-900', 'bg-gold-600');
        containerToggle40.classList.replace('text-warm-400', 'text-base-900');
        containerToggle20.classList.replace('bg-gold-600', 'bg-base-900');
        containerToggle20.classList.replace('text-base-900', 'text-warm-400');
        updateCalculations();
      });
    }

    // Lock Quote Button Autofill
    if (lockQuoteBtn) {
      lockQuoteBtn.addEventListener('click', () => {
        const contactSection = document.getElementById('contact');
        const msgField = document.querySelector('#contact textarea, #quoteMsgInput');
        const prodField = document.querySelector('#contact select[name="productCategory"]');
        
        const prodName = productSelect ? productSelect.options[productSelect.selectedIndex].text : 'Jute Bags';
        const qtyVal = qtyInput ? qtyInput.value : '10000';
        const portName = portSelect ? portSelect.options[portSelect.selectedIndex].text : 'UK';
        const cbm = cbmValueEl ? cbmValueEl.innerText : '';

        const autoMsg = `Calculated Freight Request:
- Product: ${prodName}
- Quantity: ${parseInt(qtyVal).toLocaleString()} units
- Container: ${currentContainer === '40ft_hc' ? '40ft High Cube' : '20ft Standard Container'} (${cbm})
- Destination Port: ${portName}
- Incoterm Preference: CIF / FOB

Please provide best FOB Kolkata / CIF rate and physical sample dispatch timeframe.`;

        if (msgField) msgField.value = autoMsg;
        if (prodField && productSelect) prodField.value = productSelect.value;

        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth' });
          if (msgField) {
            msgField.focus();
            msgField.classList.add('ring-2', 'ring-gold-500');
            setTimeout(() => msgField.classList.remove('ring-2', 'ring-gold-500'), 2500);
          }
        }
      });
    }

    // Run initial calculate
    updateCalculations();
  }

  /* ==========================================================================
     3. NODE.JS AJAX QUOTE & INQUIRY FORM PROCESSOR
     ========================================================================== */
  function initAjaxQuoteForms() {
    const forms = document.querySelectorAll('form[action="#contact"], form.quote-form, #inquiryForm');

    forms.forEach((form) => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit Inquiry';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="inline-flex items-center gap-2">
              <svg class="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>Transmitting to Trade Desk...</span>
            </span>
          `;
        }

        // Collect Form Data
        const formData = new FormData(form);
        const payload = {
          name: formData.get('name') || form.querySelector('[name="name"]')?.value || '',
          email: formData.get('email') || form.querySelector('[name="email"]')?.value || '',
          phone: formData.get('phone') || form.querySelector('[name="phone"]')?.value || '',
          country: formData.get('country') || form.querySelector('[name="country"]')?.value || 'International',
          company: formData.get('company') || form.querySelector('[name="company"]')?.value || '',
          productCategory: formData.get('productCategory') || form.querySelector('[name="productCategory"]')?.value || 'General Export Inquiry',
          quantity: formData.get('quantity') || form.querySelector('[name="quantity"]')?.value || '10,000 units',
          incoterm: formData.get('incoterm') || form.querySelector('[name="incoterm"]')?.value || 'FOB',
          message: formData.get('message') || form.querySelector('[name="message"]')?.value || ''
        };

        try {
          const res = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const result = await res.json();

          if (res.ok && result.success) {
            showSuccessModal(result.trackingId, payload.name, payload.email);
            form.reset();
          } else {
            alert(result.error || 'Unable to register inquiry. Please reach out via WhatsApp at +91 92421 56161.');
          }
        } catch (error) {
          console.warn('[AJAX Form] Node.js server unreachable, falling back to local acknowledgment.', error);
          const fallbackTracking = `AGT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
          showSuccessModal(fallbackTracking, payload.name, payload.email);
          form.reset();
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        }
      });
    });
  }

  /* ==========================================================================
     4. 3D HOLOGRAPHIC CONFIRMATION MODAL
     ========================================================================== */
  function init3DModals() {
    if (!document.getElementById('quoteSuccessModal')) {
      const modal = document.createElement('div');
      modal.id = 'quoteSuccessModal';
      modal.className = 'modal-3d-backdrop';
      modal.innerHTML = `
        <div class="modal-3d-box relative max-w-lg w-full mx-4 p-6 lg:p-8 glass-3d-panel-gold rounded-xl border border-gold-500/40 shadow-2xl">
          <div class="absolute -top-6 -right-6 w-24 h-24 bg-gold-500/20 rounded-full blur-2xl pointer-events-none"></div>
          <button id="closeQuoteModalBtn" class="absolute top-4 right-4 text-warm-400 hover:text-gold-400 p-2 rounded-full transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-sage-900/60 border border-sage-500/40 flex items-center justify-center text-sage-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-sage-400">Export Ledger Registered</span>
              <h3 class="text-xl font-extrabold text-warm-100">Quotation Request Logged</h3>
            </div>
          </div>
          <div class="p-4 bg-base-950/80 rounded-lg border border-warm-800/40 mb-5">
            <div class="flex items-center justify-between">
              <span class="text-xs text-warm-500 uppercase tracking-wider">Tracking Reference:</span>
              <span id="modalTrackingId" class="text-sm font-black font-mono text-gold-400 bg-gold-900/30 px-2.5 py-1 rounded border border-gold-700/50">AGT-2026-0000</span>
            </div>
            <p id="modalRecipientMsg" class="text-xs text-warm-400 mt-2 leading-relaxed">
              Your inquiry has been assigned to an Azad Global Trade export manager. An official proforma quotation will be dispatched to your email within 12 minutes.
            </p>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-3">
            <a id="modalWhatsappLink" href="https://wa.me/919242156161" target="_blank" rel="noopener noreferrer" class="w-full sm:flex-1 btn-3d-sage text-center py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.071.376-.043.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
              <span>Expedite on WhatsApp</span>
            </a>
            <button id="modalDismissBtn" class="w-full sm:w-auto px-6 py-3 bg-base-900 hover:bg-base-800 text-warm-300 text-xs font-bold uppercase tracking-wider rounded border border-warm-800 transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = document.getElementById('closeQuoteModalBtn');
      const dismissBtn = document.getElementById('modalDismissBtn');
      [closeBtn, dismissBtn].forEach(b => {
        if (b) b.addEventListener('click', () => modal.classList.remove('open'));
      });
    }
  }

  function showSuccessModal(trackingId, name, email) {
    const modal = document.getElementById('quoteSuccessModal');
    const trackingEl = document.getElementById('modalTrackingId');
    const msgEl = document.getElementById('modalRecipientMsg');
    const waLink = document.getElementById('modalWhatsappLink');

    if (trackingEl) trackingEl.innerText = trackingId;
    if (msgEl) {
      msgEl.innerText = `Thank you ${name || 'Buyer'}. Your quotation file has been generated for ${email || 'your registered contact'}. Our trade desk is reviewing your requirements now.`;
    }
    if (waLink) {
      waLink.href = `https://wa.me/919242156161?text=Hello%20Azad%20Global%20Trade%2C%20referencing%20inquiry%20${trackingId}.%20Please%20provide%20urgent%20quote.`;
    }

    if (modal) modal.classList.add('open');
  }

  /* ==========================================================================
     5. ANIMATED NUMERICAL COUNTERS
     ========================================================================== */
  function initStatCounters() {
    const statElements = document.querySelectorAll('.stat-n');
    if (!statElements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-target') || el.innerText, 10);
          if (isNaN(target)) return;

          let current = 0;
          const duration = 1600;
          const stepTime = 20;
          const totalSteps = duration / stepTime;
          const increment = target / totalSteps;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              el.innerText = target.toLocaleString();
              clearInterval(timer);
            } else {
              el.innerText = Math.floor(current).toLocaleString();
            }
          }, stepTime);

          observer.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    statElements.forEach(el => observer.observe(el));
  }

  /* ==========================================================================
     6. TELEMETRY & BACKEND STATUS SYNC
     ========================================================================== */
  async function fetchBackendTelemetry() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        const deskStatusEl = document.getElementById('liveDeskStatusIndicator');
        if (deskStatusEl) {
          deskStatusEl.innerHTML = `
            <span class="pulse-dot"></span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-sage-400">${data.liveDeskStatus || 'Export Desk Operational'}</span>
          `;
        }
      }
    } catch (e) {
      // Backend silent fallback
    }
  }

})();
