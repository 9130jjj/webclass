'use strict';
document.documentElement.classList.add('js-enabled');

/* Mac-style responsive navigation */
const menuButton = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
if (menuButton && primaryNav) {
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? '메뉴 닫기' : '메뉴 열기');
    primaryNav.classList.toggle('is-open', opening);
  });
  primaryNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
    primaryNav.classList.remove('is-open');
  }));
}

/* Original full-screen 3D folder interaction — intentionally kept in the hero. */
const hero = document.querySelector('.hero');
const megaFolder = document.querySelector('.mega-folder');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (hero && megaFolder && !prefersReducedMotion) {
  let frame = null;
  const poseClasses = ['pointer-left', 'pointer-center', 'pointer-right', 'pointer-top', 'pointer-middle', 'pointer-bottom'];
  const setScenePosition = (clientX, clientY) => {
    const rect = hero.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      megaFolder.classList.remove(...poseClasses);
      megaFolder.classList.add(nx < -0.34 ? 'pointer-left' : nx > 0.34 ? 'pointer-right' : 'pointer-center');
      megaFolder.classList.add(ny < -0.34 ? 'pointer-top' : ny > 0.34 ? 'pointer-bottom' : 'pointer-middle');
    });
  };
  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') setScenePosition(event.clientX, event.clientY);
  });
  hero.addEventListener('pointerleave', () => {
    megaFolder.classList.remove(...poseClasses);
  });
  hero.addEventListener('touchmove', (event) => {
    if (event.touches.length) setScenePosition(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });
  megaFolder.addEventListener('click', () => {
    const opening = megaFolder.getAttribute('aria-pressed') !== 'true';
    megaFolder.setAttribute('aria-pressed', String(opening));
    megaFolder.classList.toggle('is-open', opening);
  });
}

/* Weekly card links: paste a real URL into href and the card becomes blue/clickable automatically.
   No manual class edit is needed; placeholders remain muted and cannot navigate accidentally. */
(() => {
  const cards = [...document.querySelectorAll('#class-links .week-card')];
  const linkIsReady = (card) => {
    const href = (card.getAttribute('href') || '').trim();
    if (!href || href === '#' || /^YOUR_WEEK_/i.test(href)) return false;
    try {
      const target = new URL(href, document.baseURI);
      return ['http:', 'https:', 'file:'].includes(target.protocol);
    } catch (_) {
      return false;
    }
  };

  cards.forEach((card) => {
    const week = card.querySelector('.week-top span:last-child')?.textContent?.trim() || '';
    const status = card.querySelector('.week-status');
    const arrow = card.querySelector('.week-arrow-mark');
    const ready = linkIsReady(card);
    card.classList.toggle('is-done', ready);
    card.classList.toggle('is-upcoming', !ready);
    card.dataset.practiceReady = String(ready);
    card.setAttribute('aria-disabled', String(!ready));
    card.tabIndex = ready ? 0 : -1;
    card.setAttribute('aria-label', `${week}주차 ${ready ? '실습 링크 열기' : '예정 · 실습 링크 없음'}`);
    if (status) status.textContent = ready ? 'PRACTICE LINK' : '예정';
    if (arrow) arrow.textContent = ready ? '↗' : '···';

    card.addEventListener('click', (event) => {
      if (card.dataset.practiceReady !== 'true') {
        event.preventDefault();
        card.classList.add('needs-url');
      }
    });
  });
})();

/* Weekly practice: same-size horizontal card carousel plus a real grid view toggle. */
const weekCarousel = document.querySelector('.week-carousel');
const weekViewport = document.querySelector('.week-viewport');
const weekTrack = document.querySelector('.week-track');
const previousWeekButton = document.querySelector('.week-prev');
const nextWeekButton = document.querySelector('.week-next');
const viewButtons = [...document.querySelectorAll('.week-view-button[data-view-mode]')];
const weekPageDots = [...document.querySelectorAll('.week-page-dot[data-page-index]')];
const reducedMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (weekCarousel && weekViewport && weekTrack) {
  const weekCards = [...weekTrack.querySelectorAll('.week-card')];
  let activeIndex = 0;
  let scrollFrame = null;
  let resizeTimer = null;

  weekCards.forEach((card, index) => {
    const label = card.querySelector('.week-top span:last-child')?.textContent?.trim() || String(index + 1).padStart(2, '0');
    card.dataset.week = label;
    card.draggable = false;
  });

  const setActive = (index) => {
    activeIndex = Math.max(0, Math.min(weekCards.length - 1, index));
    weekCards.forEach((card, cardIndex) => card.classList.toggle('is-active', cardIndex === activeIndex));
    weekPageDots.forEach((dot, dotIndex) => {
      const selected = dotIndex === activeIndex;
      dot.classList.toggle('is-active', selected);
      if (selected) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
  };

  const scrollToCard = (index, behavior = 'smooth') => {
    const safeIndex = Math.max(0, Math.min(weekCards.length - 1, index));
    const target = weekCards[safeIndex];
    if (!target) return;
    setActive(safeIndex);
    if (weekCarousel.dataset.layout === 'grid') return;
    const left = Math.max(0, target.offsetLeft - weekTrack.offsetLeft);
    weekViewport.scrollTo({ left, behavior: reducedMotionPreference ? 'auto' : behavior });
  };

  const closestCardIndex = () => {
    const leftEdge = weekViewport.getBoundingClientRect().left + 3;
    let bestIndex = activeIndex;
    let bestDistance = Infinity;
    weekCards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - leftEdge);
      if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
    });
    return bestIndex;
  };

  previousWeekButton?.addEventListener('click', () => scrollToCard(activeIndex - 1));
  nextWeekButton?.addEventListener('click', () => scrollToCard(activeIndex + 1));
  weekPageDots.forEach((dot) => dot.addEventListener('click', () => scrollToCard(Number(dot.dataset.pageIndex))));
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    const layout = button.dataset.viewMode === 'grid' ? 'grid' : 'carousel';
    weekCarousel.dataset.layout = layout;
    viewButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    if (layout === 'carousel') requestAnimationFrame(() => scrollToCard(activeIndex, 'auto'));
  }));

  /* Mouse drag, like a draggable work-gallery: click-and-pull the cards horizontally. */
  let pointerDrag = null;
  let suppressClickUntil = 0;
  weekViewport.addEventListener('dragstart', (event) => event.preventDefault());
  weekViewport.addEventListener('pointerdown', (event) => {
    if (weekCarousel.dataset.layout !== 'carousel' || event.pointerType !== 'mouse' || event.button !== 0) return;
    pointerDrag = { pointerId: event.pointerId, startX: event.clientX, startScroll: weekViewport.scrollLeft, moved: false, captured: false };
  });
  weekViewport.addEventListener('pointermove', (event) => {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
    const delta = event.clientX - pointerDrag.startX;
    if (!pointerDrag.moved && Math.abs(delta) < 4) return;
    pointerDrag.moved = true;
    if (!pointerDrag.captured && weekViewport.setPointerCapture) {
      try { weekViewport.setPointerCapture(event.pointerId); pointerDrag.captured = true; } catch (_) {}
    }
    weekViewport.classList.add('is-dragging');
    weekViewport.scrollLeft = pointerDrag.startScroll - delta;
    if (event.cancelable) event.preventDefault();
  });
  const finishPointerDrag = (event) => {
    if (!pointerDrag || (event && pointerDrag.pointerId !== event.pointerId)) return;
    const dragged = pointerDrag.moved;
    const pointerId = pointerDrag.pointerId;
    pointerDrag = null;
    weekViewport.classList.remove('is-dragging');
    if (dragged) {
      suppressClickUntil = performance.now() + 220;
      requestAnimationFrame(() => scrollToCard(closestCardIndex(), 'smooth'));
    }
    if (weekViewport.hasPointerCapture?.(pointerId)) {
      try { weekViewport.releasePointerCapture(pointerId); } catch (_) {}
    }
  };
  weekViewport.addEventListener('pointerup', finishPointerDrag);
  weekViewport.addEventListener('pointercancel', finishPointerDrag);
  weekViewport.addEventListener('lostpointercapture', (event) => {
    if (pointerDrag && pointerDrag.pointerId === event.pointerId) finishPointerDrag(event);
  });
  weekViewport.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      suppressClickUntil = 0;
    }
  }, true);

  weekViewport.addEventListener('scroll', () => {
    if (weekCarousel.dataset.layout === 'grid') return;
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => setActive(closestCardIndex()));
  }, { passive: true });
  weekViewport.addEventListener('keydown', (event) => {
    if (weekCarousel.dataset.layout === 'grid') return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToCard(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); scrollToCard(activeIndex + 1); }
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (weekCarousel.dataset.layout === 'carousel') scrollToCard(activeIndex, 'auto');
    }, 80);
  }, { passive: true });
  setActive(activeIndex);
  requestAnimationFrame(() => scrollToCard(activeIndex, 'auto'));
}

/* Scroll reveals for the layered log cards and the WebGL glass meshes. */
const workCards = [...document.querySelectorAll('.work-card')];
if ('IntersectionObserver' in window && workCards.length && !prefersReducedMotion) {
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  workCards.forEach((card) => cardObserver.observe(card));
} else {
  workCards.forEach((card) => card.classList.add('is-revealed'));
}

/* Toolbox cards expand in place without fighting the browser's scroll position. */
(() => {
  const stack = document.querySelector('#toolbox .works-stack');
  if (!stack) return;
  const cards = [...stack.querySelectorAll('[data-tool-card]')];
  const root = document.documentElement;
  const toolbox = stack.closest('#toolbox');
  const main = document.querySelector('#main');
  let snapReleaseTimer = 0;
  let stackHeightReleaseTimer = 0;
  let reservedStackHeight = 0;
  let expandedScrim = null;

  // Keep the normal document-flow footprint while the cards spring open/closed.
  // Without this reservation, switching sticky cards to the expanded layout shrinks
  // the stack by hundreds of pixels and can make the viewport appear to jump.
  const reserveStackHeight = () => {
    if (reservedStackHeight <= 0) {
      reservedStackHeight = stack.getBoundingClientRect().height;
    }
    // Fix both height and min-height: min-height alone still lets the stack grow
    // during the first spring frames, which makes the next section move down/up.
    stack.style.height = `${reservedStackHeight}px`;
    stack.style.minHeight = `${reservedStackHeight}px`;
  };

  const releaseStackHeightReserve = (delay = 620) => {
    window.clearTimeout(stackHeightReleaseTimer);
    stackHeightReleaseTimer = window.setTimeout(() => {
      if (stack.classList.contains('has-expanded-card')) return;
      stack.style.height = '';
      stack.style.minHeight = '';
      reservedStackHeight = 0;
      if (toolbox) toolbox.classList.remove('has-open-tool-card');
    }, delay);
  };

  const showExpandedScrim = () => {
    if (!toolbox) return;
    toolbox.classList.add('has-open-tool-card');
    if (!expandedScrim) {
      expandedScrim = document.createElement('div');
      expandedScrim.className = 'toolbox-expanded-scrim';
      expandedScrim.setAttribute('aria-hidden', 'true');
      (main || document.body).appendChild(expandedScrim);
    }
  };

  const hideExpandedScrim = ({ keepToolboxLayer = false } = {}) => {
    if (expandedScrim) {
      expandedScrim.remove();
      expandedScrim = null;
    }
    // During the closing spring, keep this section above the next one because the
    // cards briefly overflow their fixed-height stack while returning to full size.
    if (!keepToolboxLayer && toolbox) toolbox.classList.remove('has-open-tool-card');
  };

  const releaseTemporarySnapLock = (delay = 520) => {
    window.clearTimeout(snapReleaseTimer);
    snapReleaseTimer = window.setTimeout(() => {
      root.classList.remove('tool-scroll-anchor-lock');
    }, delay);
  };

  const collapseCard = (card) => {
    const button = card.querySelector('[data-tool-open]');
    const details = card.querySelector('[data-tool-details]');
    card.classList.remove('is-expanded');
    if (button) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', `${button.dataset.toolTitle || '도구'} 카드 펼치기`);
    }
    if (details) details.hidden = true;
  };

  cards.forEach((card) => {
    const button = card.querySelector('[data-tool-open]');
    const details = card.querySelector('[data-tool-details]');
    const template = document.getElementById(button?.dataset.toolTemplate || '');
    if (!button || !details || !template) return;

    button.addEventListener('click', () => {
      const wasExpanded = card.classList.contains('is-expanded');
      window.clearTimeout(snapReleaseTimer);
      window.clearTimeout(stackHeightReleaseTimer);
      snapReleaseTimer = 0;

      // Lock anchoring before any card dimensions change, then reserve the stack's
      // collapsed height. This keeps the following sections at the same document Y
      // while the spring animation changes the individual card heights.
      root.classList.add('tool-scroll-anchor-lock');
      reserveStackHeight();
      cards.forEach(collapseCard);
      stack.classList.remove('has-expanded-card');
      hideExpandedScrim({ keepToolboxLayer: wasExpanded });

      if (wasExpanded) {
        releaseStackHeightReserve(620);
        releaseTemporarySnapLock(620);
        return;
      }

      details.replaceChildren(template.content.cloneNode(true));
      details.hidden = false;
      card.classList.add('is-expanded');
      stack.classList.add('has-expanded-card');
      showExpandedScrim();
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-label', `${button.dataset.toolTitle || '도구'} 카드 접기`);
      // Do not use a timer to re-enable mandatory snapping while the panel remains open.
    });
  });

  // If the user scrolls completely away from an expanded sticky card, close it and
  // restore the normal chapter snapping so the rest of the page is never left unlocked.
  let closeFrame = 0;
  window.addEventListener('scroll', () => {
    if (closeFrame || !stack.classList.contains('has-expanded-card')) return;
    closeFrame = window.requestAnimationFrame(() => {
      closeFrame = 0;
      const expanded = cards.find((card) => card.classList.contains('is-expanded'));
      if (!expanded) return;
      const rect = expanded.getBoundingClientRect();
      if (rect.bottom < -2 || rect.top > window.innerHeight + 2) {
        cards.forEach(collapseCard);
        stack.classList.remove('has-expanded-card');
        hideExpandedScrim({ keepToolboxLayer: true });
        releaseStackHeightReserve(620);
        releaseTemporarySnapLock(620);
      }
    });
  }, { passive: true });
})();

/* Keep achievements newest-first no matter where a new row is placed in the HTML.
   Accept YYYY-MM, YYYY, and ranges such as 2022~2025. Rows without a parseable date go last. */
(() => {
  const tbody = document.querySelector('#works-table-body');
  if (!tbody) return;

  const dateScore = (row) => {
    const text = (row.querySelector('td:first-child time[datetime]')?.getAttribute('datetime') || row.cells?.[0]?.textContent || '').trim();
    const matches = [...text.matchAll(/\b((?:19|20)\d{2})(?:[-/.](0?[1-9]|1[0-2]))?\b/g)];
    if (!matches.length) return Number.NEGATIVE_INFINITY;
    const last = matches[matches.length - 1];
    const year = Number(last[1]);
    const month = last[2] ? Number(last[2]) : (matches.length > 1 || /[~〜–—]/.test(text) ? 12 : 0);
    return year * 100 + month;
  };

  const sortRows = () => {
    const emptyRow = tbody.querySelector('.filter-empty-row');
    const rows = [...tbody.querySelectorAll('tr')].filter((row) => !row.classList.contains('filter-empty-row'));
    const sorted = rows.map((row, index) => ({ row, index, score: dateScore(row) }))
      .sort((a, b) => (b.score - a.score) || (a.index - b.index))
      .map((entry) => entry.row);
    if (rows.every((row, index) => row === sorted[index])) return;
    sorted.forEach((row) => tbody.insertBefore(row, emptyRow));
  };

  sortRows();
  // Also handle rows inserted by a future in-page editor; stop doing DOM moves once sorted.
  if ('MutationObserver' in window) {
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; sortRows(); });
    });
    observer.observe(tbody, { childList: true });
  }
})();

/* Filter semantic achievement rows by their category without rebuilding table markup. */
(() => {
  const section = document.querySelector('#works');
  if (!section) return;
  const buttons = [...section.querySelectorAll('[data-work-filter]')];
  const rows = [...section.querySelectorAll('#works-table-body tr[data-category]')];
  const emptyRow = section.querySelector('.filter-empty-row');
  const count = section.querySelector('.works-filter-count');
  const applyFilter = (filter) => {
    let visible = 0;
    rows.forEach((row) => {
      const show = filter === 'all' || row.dataset.category === filter;
      row.hidden = !show;
      if (show) visible += 1;
    });
    if (emptyRow) emptyRow.hidden = visible !== 0;
    if (count) count.textContent = `${String(visible).padStart(2, '0')} ENTRIES`;
    buttons.forEach((button) => {
      const selected = button.dataset.workFilter === filter;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };
  buttons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.workFilter || 'all')));
  applyFilter('all');
})();

/* Scroll-scrubbed archive movement: tilted entry, smooth settle, then a slight tilted exit. */
(() => {
  const stage = document.querySelector('[data-archive-reveal]');
  if (!stage) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    stage.dataset.archiveState = 'settled';
    return;
  }

  let frame = 0;
  let lastState = '';
  const updateArchiveState = () => {
    frame = 0;
    const rect = stage.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    // Enter/settle based on the visible edge rather than the stage center, so it responds sooner.
    let state;
    if (rect.top > viewportHeight * 0.58) state = 'entering';
    else if (rect.bottom < viewportHeight * 0.32) state = 'exiting';
    else state = 'settled';
    if (state !== lastState) {
      lastState = state;
      stage.dataset.archiveState = state;
    }
  };
  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(updateArchiveState);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  requestUpdate();
})();

/* Real 3D floating glass gummy-bear meshes, shown only while the lower-page sections are in view. */
(() => {
  const stage = document.querySelector('.works-3d-stage');
  const canvas = stage?.querySelector('.works-glass-canvas');
  if (!stage || !canvas) return;

  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'default' });
  } catch (error) {
    gl = null;
  }
  if (!gl) { stage.classList.add('webgl-unavailable'); return; }

  const vertexSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform vec3 uPosition;
    uniform vec3 uRotation;
    uniform float uScale;
    uniform float uAspect;
    uniform float uTime;
    uniform float uPhase;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vLocalPosition;
    vec3 rotatePoint(vec3 p, vec3 r) {
      float cx=cos(r.x), sx=sin(r.x), cy=cos(r.y), sy=sin(r.y), cz=cos(r.z), sz=sin(r.z);
      p = vec3(p.x, p.y*cx-p.z*sx, p.y*sx+p.z*cx);
      p = vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
      return vec3(p.x*cz-p.y*sz, p.x*sz+p.y*cz, p.z);
    }
    void main() {
      vec3 local = rotatePoint(aPosition * uScale, uRotation);
      vec3 world = local + uPosition;
      float depth = 4.55 - world.z;
      float focal = 4.05;
      vWorldPosition = world;
      vNormal = normalize(rotatePoint(aNormal, uRotation));
      vLocalPosition = aPosition;
      float A = (10.0 + 1.0) / (1.0 - 10.0);
      float B = (2.0 * 10.0 * 1.0) / (1.0 - 10.0);
      gl_Position = vec4(world.x * focal / uAspect, world.y * focal, A * (-depth) + B, depth);
    }
  `;
  const fragmentSource = `
    precision highp float;
    uniform float uTime;
    uniform float uPhase;
    uniform vec3 uTint;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying vec3 vLocalPosition;
    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(vec3(0.0, 0.0, 4.55) - vWorldPosition);
      vec3 L = normalize(vec3(-0.48, 0.72, 0.83));
      float facing = max(dot(N, V), 0.0);
      float fresnel = pow(1.0 - facing, 2.35);
      float diffuse = 0.24 + 0.68 * max(dot(N, L), 0.0);
      vec3 reflected = reflect(-L, N);
      float specular = pow(max(dot(reflected, V), 0.0), 68.0);
      float broadSpec = pow(max(dot(reflected, V), 0.0), 11.0);
      float rim = pow(1.0 - facing, 1.15);
      float phase = fresnel * 0.92 + uPhase * 0.21 + uTime * 0.018 + vLocalPosition.y * 0.075;
      vec3 spectrum = 0.5 + 0.5 * cos(6.2831853 * (phase + vec3(0.04, 0.36, 0.69)));
      vec3 glassBase = mix(uTint, vec3(0.84, 0.87, 0.92), 0.17);
      vec3 color = glassBase * diffuse + uTint * (0.11 + fresnel * 0.2);
      color += vec3(0.98, 0.99, 1.0) * specular * 1.48;
      color += spectrum * (0.009 + fresnel * 0.034) + uTint * rim * 0.12;
      float eyeA = 1.0 - smoothstep(0.018, 0.035, length(vec2(abs(vLocalPosition.x) - 0.125, vLocalPosition.y - 0.565)));
      eyeA *= smoothstep(0.12, 0.22, vLocalPosition.z);
      float noseA = (1.0 - smoothstep(0.018, 0.032, length(vec2(vLocalPosition.x, vLocalPosition.y - 0.385)))) * smoothstep(0.30, 0.39, vLocalPosition.z);
      color = mix(color, vec3(0.22, 0.25, 0.34), eyeA * 0.62 + noseA * 0.48);
      float alpha = 0.22 + fresnel * 0.27 + specular * 0.32 + broadSpec * 0.025;
      alpha += max(eyeA, noseA) * 0.055;
      gl_FragColor = vec4(color, min(alpha, 0.72));
    }
  `;

  const compileShader = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || 'WebGL shader compile failed';
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  };
  let program;
  try {
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed');
  } catch (error) {
    console.warn('Jelix glass scene could not initialize:', error);
    stage.classList.add('webgl-unavailable');
    return;
  }

  /* A smooth 3D gummy-bear surface generated from a smooth union of ellipsoids. */
  const ellipsoidDistance = (p, c, r) => {
    const x = (p[0] - c[0]) / r[0];
    const y = (p[1] - c[1]) / r[1];
    const z = (p[2] - c[2]) / r[2];
    const k0 = Math.sqrt(x*x + y*y + z*z);
    const k1 = Math.sqrt(x*x/(r[0]*r[0]) + y*y/(r[1]*r[1]) + z*z/(r[2]*r[2]));
    return k0 * (k0 - 1.0) / Math.max(k1, 0.00001);
  };
  const smoothMin = (a, b, k = 0.13) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h*h*k*0.25;
  };
  const bearParts = [
    { c: [0, -0.13, 0], r: [0.405, 0.535, 0.29] },      // pear-shaped belly
    { c: [0, 0.48, 0.005], r: [0.335, 0.345, 0.285] },  // head
    { c: [-0.225, 0.755, 0.005], r: [0.135, 0.17, 0.135] },
    { c: [0.225, 0.755, 0.005], r: [0.135, 0.17, 0.135] },
    { c: [0, 0.375, 0.245], r: [0.195, 0.135, 0.145] }, // muzzle
    { c: [-0.37, 0.08, 0], r: [0.155, 0.315, 0.17] },
    { c: [0.37, 0.08, 0], r: [0.155, 0.315, 0.17] },
    { c: [-0.205, -0.53, 0.005], r: [0.17, 0.285, 0.19] },
    { c: [0.205, -0.53, 0.005], r: [0.17, 0.285, 0.19] },
    { c: [-0.22, -0.735, 0.055], r: [0.195, 0.145, 0.225] },
    { c: [0.22, -0.735, 0.055], r: [0.195, 0.145, 0.225] }
  ];
  const bearDistance = (p) => {
    let d = ellipsoidDistance(p, bearParts[0].c, bearParts[0].r);
    for (let i = 1; i < bearParts.length; i++) {
      const part = bearParts[i];
      d = smoothMin(d, ellipsoidDistance(p, part.c, part.r), i < 4 ? 0.12 : 0.15);
    }
    return d;
  };
  const makeGummyBear = () => {
    const bounds = { x0: -0.68, x1: 0.68, y0: -0.94, y1: 0.99, z0: -0.43, z1: 0.47 };
    const nx = 18, ny = 27, nz = 13;
    const dx = (bounds.x1 - bounds.x0) / nx;
    const dy = (bounds.y1 - bounds.y0) / ny;
    const dz = (bounds.z1 - bounds.z0) / nz;
    const point = (i,j,k) => [bounds.x0 + i*dx, bounds.y0 + j*dy, bounds.z0 + k*dz];
    const cellIndex = (i,j,k) => (i*(ny+1) + j)*(nz+1) + k;
    const field = new Float32Array((nx+1)*(ny+1)*(nz+1));
    for (let i=0;i<=nx;i++) for (let j=0;j<=ny;j++) for (let k=0;k<=nz;k++) field[cellIndex(i,j,k)] = bearDistance(point(i,j,k));

    const positions = [], normals = [], indices = [];
    const vertexMap = new Map();
    const normalAt = (p) => {
      const e = 0.003;
      const n = [
        bearDistance([p[0]+e,p[1],p[2]]) - bearDistance([p[0]-e,p[1],p[2]]),
        bearDistance([p[0],p[1]+e,p[2]]) - bearDistance([p[0],p[1]-e,p[2]]),
        bearDistance([p[0],p[1],p[2]+e]) - bearDistance([p[0],p[1],p[2]-e])
      ];
      const len = Math.hypot(...n) || 1;
      return n.map(v => v/len);
    };
    const addVertex = (p) => {
      const key = `${Math.round(p[0]*10000)},${Math.round(p[1]*10000)},${Math.round(p[2]*10000)}`;
      if (vertexMap.has(key)) return vertexMap.get(key);
      const id = positions.length/3;
      positions.push(p[0],p[1],p[2]);
      normals.push(...normalAt(p));
      vertexMap.set(key,id);
      return id;
    };
    const edgeVertex = (p0,p1,d0,d1) => {
      const t = Math.max(0,Math.min(1,d0/(d0-d1)));
      return addVertex([p0[0]+(p1[0]-p0[0])*t,p0[1]+(p1[1]-p0[1])*t,p0[2]+(p1[2]-p0[2])*t]);
    };
    const tetrahedra = [[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
    const cubeOffsets = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
    for (let i=0;i<nx;i++) for (let j=0;j<ny;j++) for (let k=0;k<nz;k++) {
      const cp = cubeOffsets.map(o => point(i+o[0],j+o[1],k+o[2]));
      const cd = cubeOffsets.map(o => field[cellIndex(i+o[0],j+o[1],k+o[2])]);
      for (const tet of tetrahedra) {
        const inside = [], outside = [];
        tet.forEach(v => (cd[v] < 0 ? inside : outside).push(v));
        if (inside.length === 0 || inside.length === 4) continue;
        if (inside.length === 1) {
          const a = inside[0];
          const tri = outside.map(b => edgeVertex(cp[a],cp[b],cd[a],cd[b]));
          indices.push(tri[0],tri[1],tri[2]);
        } else if (inside.length === 3) {
          const b = outside[0];
          const tri = inside.map(a => edgeVertex(cp[b],cp[a],cd[b],cd[a]));
          indices.push(tri[0],tri[1],tri[2]);
        } else {
          const a0=inside[0], a1=inside[1], b0=outside[0], b1=outside[1];
          const q0=edgeVertex(cp[a0],cp[b0],cd[a0],cd[b0]);
          const q1=edgeVertex(cp[a0],cp[b1],cd[a0],cd[b1]);
          const q2=edgeVertex(cp[a1],cp[b1],cd[a1],cd[b1]);
          const q3=edgeVertex(cp[a1],cp[b0],cd[a1],cd[b0]);
          indices.push(q0,q1,q2, q0,q2,q3);
        }
      }
    }
    return { positions, normals, indices };
  };
  const makeMesh = (geometry) => {
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
    return { vertexBuffer, normalBuffer, indexBuffer, count: geometry.indices.length };
  };

  const gummyBearMesh = makeMesh(makeGummyBear());
  const meshes = [
    { mesh: gummyBearMesh, pos: [-0.96, 0.06, -0.24], size: 0.305, rot: [0.07, -0.22, -0.16], speed: [0.13, 0.11, 0.07], drift: [0.075, 0.06], phase: 0.5, tint: [0.47, 0.96, 0.82] },
    { mesh: gummyBearMesh, pos: [0.87, -0.12, -0.35], size: 0.275, rot: [-0.12, 0.32, 0.19], speed: [-0.09, 0.14, -0.055], drift: [0.065, 0.075], phase: 1.8, tint: [0.67, 0.69, 1.0] },
    { mesh: gummyBearMesh, pos: [0.22, 0.53, -0.67], size: 0.225, rot: [0.18, -0.1, 0.12], speed: [0.08, 0.07, 0.08], drift: [0.055, 0.05], phase: 2.6, tint: [1.0, 0.62, 0.83] }
  ];
  // Mesh depth order is static; sort once rather than allocating and sorting every frame.
  const orderedMeshes = [...meshes].sort((a, b) => a.pos[2] - b.pos[2]);

  gl.useProgram(program);
  const attributes = {
    position: gl.getAttribLocation(program, 'aPosition'),
    normal: gl.getAttribLocation(program, 'aNormal')
  };
  const uniforms = {};
  ['uPosition', 'uRotation', 'uScale', 'uAspect', 'uTime', 'uPhase', 'uTint'].forEach((name) => { uniforms[name] = gl.getUniformLocation(program, name); });
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let width = 1, height = 1, visible = false, raf = 0;
  let scrollInfluence = (window.scrollY || 0) / Math.max(1, window.innerHeight);
  const updateScrollInfluence = () => {
    scrollInfluence = (window.scrollY || 0) / Math.max(1, window.innerHeight);
    if (visible) wake();
  };
  window.addEventListener('scroll', updateScrollInfluence, { passive: true });
  const resize = () => {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 0.95 : 1.08);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };
  const bindMesh = (mesh) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(attributes.position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.enableVertexAttribArray(attributes.normal);
    gl.vertexAttribPointer(attributes.normal, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
  };
  const draw = () => {
    // Render one frame per scroll/resize/visibility update instead of running a permanent loop.
    // The gummy bears remain still while idle and respond only to page scrolling.
    raf = 0;
    if (!visible || document.hidden) return;
    const time = 0; // Keep shader highlights static between scroll updates.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uniforms.uAspect, width / Math.max(1, height));
    gl.uniform1f(uniforms.uTime, time);
    // Depth-sort transparent objects so the closest glass surface is blended last.
    gl.depthMask(true);
    orderedMeshes.forEach((item) => {
      bindMesh(item.mesh);
      const pagePhase = scrollInfluence * 0.72 + item.phase;
      // Scroll-scrubbed transforms: no autonomous bobbing or rotation while the page is idle.
      const scrollX = prefersReducedMotion ? 0 : Math.sin(pagePhase) * 0.13;
      const scrollY = prefersReducedMotion ? 0 : Math.cos(scrollInfluence * 0.58 + item.phase * 1.35) * 0.105;
      const bobX = scrollX;
      const bobY = scrollY;
      const rx = item.rot[0] + (prefersReducedMotion ? 0 : scrollInfluence * 0.12);
      const ry = item.rot[1] + (prefersReducedMotion ? 0 : scrollInfluence * (0.16 + item.phase * 0.025));
      const rz = item.rot[2] + (prefersReducedMotion ? 0 : -scrollInfluence * 0.085);
      gl.uniform3f(uniforms.uPosition, item.pos[0] + bobX, item.pos[1] + bobY, item.pos[2]);
      gl.uniform3f(uniforms.uRotation, rx, ry, rz);
      gl.uniform1f(uniforms.uScale, item.size);
      gl.uniform1f(uniforms.uPhase, item.phase);
      gl.uniform3fv(uniforms.uTint, item.tint);
      gl.drawElements(gl.TRIANGLES, item.mesh.count, gl.UNSIGNED_SHORT, 0);
    });
    // No self-scheduling RAF loop. The scroll, resize and visibility handlers call wake().
  };
  const wake = () => {
    if (visible && !raf) raf = requestAnimationFrame(draw);
  };
  const activationSections = [...document.querySelectorAll('#toolbox, #works, #courses, #class-links')];
  const sectionVisibility = new Map(activationSections.map((section) => [section, 0]));
  const observer = ('IntersectionObserver' in window) ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => sectionVisibility.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
    visible = [...sectionVisibility.values()].some((ratio) => ratio > 0);
    stage.classList.toggle('is-in-view', visible);
    if (visible) { resize(); wake(); }
    else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '-8% 0px -8% 0px', threshold: [0, 0.04, 0.12] }) : null;
  if (observer) activationSections.forEach((section) => observer.observe(section));
  else { visible = true; stage.classList.add('is-in-view'); resize(); wake(); }
  if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); wake(); }).observe(stage);
  window.addEventListener('resize', () => { resize(); wake(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (visible) {
      resize();
      wake();
    }
  });
})();

/* Let the fixed ambient color field respond to whichever section is currently in view. */
const viewEntries = [
  ['hero', document.querySelector('.hero')],
  ['toolbox', document.querySelector('#toolbox')],
  ['works', document.querySelector('#works')],
  ['courses', document.querySelector('#courses')],
  ['class-links', document.querySelector('#class-links')],
  ['closing', document.querySelector('.closing-note')]
].filter((entry) => entry[1]);

if ('IntersectionObserver' in window && viewEntries.length) {
  const visibility = new Map(viewEntries.map(([name]) => [name, 0]));
  document.body.dataset.view = 'hero';
  const backgroundObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = viewEntries.find(([, element]) => element === entry.target);
      if (item) visibility.set(item[0], entry.isIntersecting ? entry.intersectionRatio : 0);
    });
    const activeView = [...visibility.entries()].sort((a, b) => b[1] - a[1])[0];
    if (activeView && activeView[1] > 0) document.body.dataset.view = activeView[0];
  }, { rootMargin: '-18% 0px -38% 0px', threshold: [0, 0.1, 0.25, 0.4, 0.6] });
  viewEntries.forEach(([, element]) => backgroundObserver.observe(element));
}

/* Kinetic course directory: reveal each editorial entry from alternating sides. */
(() => {
  const section = document.querySelector('#courses.course-editorial');
  if (!section) return;
  const entries = [...section.querySelectorAll('[data-course-item]')];
  const count = section.querySelector('.course-live-count');
  if (count) count.textContent = String(entries.length).padStart(2, '0');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('course-motion-ready');
    const revealObserver = new IntersectionObserver((items, observer) => {
      items.forEach((item) => {
        if (!item.isIntersecting) return;
        item.target.classList.add('is-revealed');
        observer.unobserve(item.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });
    entries.forEach((entry) => revealObserver.observe(entry));
  } else {
    entries.forEach((entry) => entry.classList.add('is-revealed'));
  }

  // Touch screens open one book-spine at a time; links inside still navigate normally.
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    entries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        const willOpen = !entry.classList.contains('is-open');
        entries.forEach((item) => item.classList.remove('is-open'));
        if (willOpen) entry.classList.add('is-open');
      });
    });
  }
})();

/* v11: explicit pointer/focus state guarantees that every course spine opens consistently. */
(() => {
  const entries = [...document.querySelectorAll('#courses [data-course-item]')];
  if (!entries.length) return;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const setActive = (entry) => entries.forEach((item) => item.classList.toggle('is-open', item === entry));

  if (finePointer) {
    entries.forEach((entry) => {
      // Desktop visual expansion is driven by CSS :hover to avoid flex-reflow/pointerenter jitter.
      // Clear any keyboard/click-open state as soon as the pointer leaves this spine.
      entry.addEventListener('pointerleave', () => {
        entry.classList.remove('is-open');
      });
    });
  }

  entries.forEach((entry) => {
    entry.addEventListener('focusin', () => setActive(entry));
    entry.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!entry.matches(':focus-within') && !entry.matches(':hover')) entry.classList.remove('is-open');
      }, 0);
    });
  });
})();
