(function () {
  const DEFAULT_OPTIONS = {
    allowClose: true,
    showStepDots: true,
    highlightPadding: 12,
    labels: {
      next: 'Suivant',
      prev: 'Précédent',
      close: 'Fermer',
      finish: 'Terminer'
    }
  };

  const FRAME_DELAY = 2;

  const cloneLabels = (labels) => {
    if (!labels || typeof labels !== 'object') {
      return { ...DEFAULT_OPTIONS.labels };
    }

    return {
      next: typeof labels.next === 'string' ? labels.next : DEFAULT_OPTIONS.labels.next,
      prev: typeof labels.prev === 'string' ? labels.prev : DEFAULT_OPTIONS.labels.prev,
      close: typeof labels.close === 'string' ? labels.close : DEFAULT_OPTIONS.labels.close,
      finish: typeof labels.finish === 'string' ? labels.finish : DEFAULT_OPTIONS.labels.finish
    };
  };

  const getStepOrder = (step, index) => {
    if (step && typeof step.order === 'number') {
      return step.order;
    }
    return index;
  };

  class TourGuideClient {
    constructor(options = {}) {
      const mergedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        labels: cloneLabels(options.labels)
      };

      this.options = mergedOptions;
      this.steps = Array.isArray(options.steps)
        ? options.steps.map((step, index) => ({
            id: step && step.id ? String(step.id) : `step-${index + 1}`,
            order: getStepOrder(step, index),
            title: step && step.title ? String(step.title) : '',
            content: step && step.content ? String(step.content) : '',
            target: step ? step.target : null,
            placement: step && step.placement ? step.placement : 'auto',
            highlightPadding:
              typeof step?.highlightPadding === 'number'
                ? step.highlightPadding
                : undefined,
            onBeforeStep: typeof step?.onBeforeStep === 'function' ? step.onBeforeStep : null,
            onAfterStep: typeof step?.onAfterStep === 'function' ? step.onAfterStep : null
          })
        ).sort((a, b) => getStepOrder(a, 0) - getStepOrder(b, 0))
        : [];

      this.currentStepIndex = -1;
      this.isActive = false;
      this.container = null;
      this.highlightElement = null;
      this.tooltipElement = null;
      this.titleElement = null;
      this.contentElement = null;
      this.prevButton = null;
      this.nextButton = null;
      this.closeButton = null;
      this.dotsElement = null;
      this.stepIndicator = null;
      this.currentTarget = null;
      this.pendingFrame = null;
      this.listeners = new Map();
      this.boundHandleWindowChange = this.handleWindowChange.bind(this);
      this.boundHandleKeydown = this.handleKeydown.bind(this);
    }

    on(eventName, callback) {
      if (typeof callback !== 'function') {
        return () => {};
      }

      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }

      const set = this.listeners.get(eventName);
      set.add(callback);

      return () => {
        set.delete(callback);
      };
    }

    emit(eventName, payload) {
      const listeners = this.listeners.get(eventName);
      if (!listeners || listeners.size === 0) {
        return;
      }

      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('[TourGuide] Listener error:', error);
          }
        }
      });
    }

    start() {
      if (this.isActive) {
        this.goTo(0);
        return;
      }

      if (!Array.isArray(this.steps) || this.steps.length === 0) {
        return;
      }

      this.isActive = true;
      this.createElements();
      this.attachGlobalListeners();
      this.goTo(0);
    }

    stop() {
      if (!this.isActive) {
        return;
      }

      this.detachGlobalListeners();
      this.isActive = false;
      this.currentStepIndex = -1;
      this.currentTarget = null;

      if (this.pendingFrame) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.pendingFrame);
        }
        this.pendingFrame = null;
      }

      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      this.highlightElement = null;
      this.tooltipElement = null;
      this.titleElement = null;
      this.contentElement = null;
      this.prevButton = null;
      this.nextButton = null;
      this.closeButton = null;
      this.dotsElement = null;
      this.stepIndicator = null;

      if (typeof document !== 'undefined' && document.body) {
        document.body.classList.remove('tgjs-open');
      }
    }

    close() {
      if (!this.isActive) {
        return;
      }
      this.stop();
      this.emit('close');
    }

    finish() {
      if (!this.isActive) {
        return;
      }
      this.stop();
      this.emit('finish');
    }

    goTo(index) {
      if (!this.isActive || !Array.isArray(this.steps)) {
        return;
      }

      const boundedIndex = Math.max(0, Math.min(index, this.steps.length - 1));
      this.showStep(boundedIndex);
    }

    next() {
      if (!this.isActive) {
        return;
      }

      const nextIndex = this.currentStepIndex + 1;
      if (nextIndex >= this.steps.length) {
        this.finish();
        return;
      }

      this.showStep(nextIndex);
    }

    prev() {
      if (!this.isActive) {
        return;
      }

      const prevIndex = this.currentStepIndex - 1;
      if (prevIndex < 0) {
        return;
      }

      this.showStep(prevIndex);
    }

    createElements() {
      if (typeof document === 'undefined') {
        return;
      }

      const container = document.createElement('div');
      container.className = 'tgjs-container';

      const highlight = document.createElement('div');
      highlight.className = 'tgjs-highlight';

      const tooltip = document.createElement('div');
      tooltip.className = 'tgjs-tooltip';

      const header = document.createElement('div');
      header.className = 'tgjs-tooltip__header';

      const title = document.createElement('h3');
      title.className = 'tgjs-title';
      header.appendChild(title);

      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'tgjs-close';
      closeButton.textContent = this.options.labels.close;
      closeButton.addEventListener('click', () => {
        if (this.options.allowClose) {
          this.close();
        }
      });
      header.appendChild(closeButton);

      const body = document.createElement('div');
      body.className = 'tgjs-tooltip__body';

      const content = document.createElement('p');
      content.className = 'tgjs-content';
      body.appendChild(content);

      const footer = document.createElement('div');
      footer.className = 'tgjs-tooltip__footer';

      const prevButton = document.createElement('button');
      prevButton.type = 'button';
      prevButton.className = 'tgjs-button tgjs-button--ghost';
      prevButton.textContent = this.options.labels.prev;
      prevButton.addEventListener('click', () => this.prev());

      const stepIndicator = document.createElement('div');
      stepIndicator.className = 'tgjs-step-indicator';

      const nextButton = document.createElement('button');
      nextButton.type = 'button';
      nextButton.className = 'tgjs-button tgjs-button--primary';
      nextButton.textContent = this.options.labels.next;
      nextButton.addEventListener('click', () => this.next());

      footer.appendChild(prevButton);
      footer.appendChild(stepIndicator);
      footer.appendChild(nextButton);

      if (this.options.showStepDots) {
        const dots = document.createElement('div');
        dots.className = 'tgjs-dots';
        this.dotsElement = dots;
        body.appendChild(dots);
      }

      tooltip.appendChild(header);
      tooltip.appendChild(body);
      tooltip.appendChild(footer);

      container.appendChild(highlight);
      container.appendChild(tooltip);

      document.body.appendChild(container);
      document.body.classList.add('tgjs-open');

      this.container = container;
      this.highlightElement = highlight;
      this.tooltipElement = tooltip;
      this.titleElement = title;
      this.contentElement = content;
      this.prevButton = prevButton;
      this.nextButton = nextButton;
      this.closeButton = closeButton;
      this.stepIndicator = stepIndicator;
    }

    attachGlobalListeners() {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', this.boundHandleWindowChange, true);
        window.addEventListener('scroll', this.boundHandleWindowChange, true);
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', this.boundHandleKeydown, true);
      }
    }

    detachGlobalListeners() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.boundHandleWindowChange, true);
        window.removeEventListener('scroll', this.boundHandleWindowChange, true);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', this.boundHandleKeydown, true);
      }
    }

    handleKeydown(event) {
      if (!this.isActive) {
        return;
      }

      if (event.key === 'Escape' && this.options.allowClose) {
        event.preventDefault();
        this.close();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.next();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.prev();
      }
    }

    handleWindowChange() {
      if (!this.isActive) {
        return;
      }

      this.scheduleRender(this.steps[this.currentStepIndex]);
    }

    showStep(index) {
      if (!Array.isArray(this.steps)) {
        return;
      }

      const previousIndex = this.currentStepIndex;
      const previousStep = previousIndex >= 0 ? this.steps[previousIndex] : null;

      if (previousStep && typeof previousStep.onAfterStep === 'function') {
        try {
          previousStep.onAfterStep({
            step: previousStep,
            index: previousIndex,
            total: this.steps.length
          });
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('[TourGuide] onAfterStep error:', error);
          }
        }
      }

      this.currentStepIndex = index;
      const step = this.steps[index];
      if (!step) {
        return;
      }

      const context = {
        step,
        index,
        total: this.steps.length,
        previousStep,
        previousIndex
      };

      if (typeof step.onBeforeStep === 'function') {
        try {
          step.onBeforeStep(context);
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error('[TourGuide] onBeforeStep error:', error);
          }
        }
      }

      this.emit('stepChange', context);
      this.scheduleRender(step);
    }

    scheduleRender(step) {
      if (!this.isActive || !step) {
        return;
      }

      if (this.pendingFrame) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.pendingFrame);
        }
        this.pendingFrame = null;
      }

      let remaining = FRAME_DELAY;
      const tick = () => {
        if (!this.isActive) {
          return;
        }
        if (remaining > 0) {
          remaining -= 1;
          this.pendingFrame = requestAnimationFrame(tick);
          return;
        }
        this.renderStep(step);
      };

      if (typeof requestAnimationFrame === 'function') {
        this.pendingFrame = requestAnimationFrame(tick);
      } else {
        setTimeout(() => this.renderStep(step), 16);
      }
    }

    resolveTarget(step) {
      if (!step) {
        return null;
      }

      if (step.target && typeof step.target === 'object' && typeof step.target.getBoundingClientRect === 'function') {
        return step.target;
      }

      if (typeof document === 'undefined') {
        return null;
      }

      if (typeof step.target === 'string' && step.target.trim().length > 0) {
        try {
          const element = document.querySelector(step.target);
          if (element) {
            return element;
          }
        } catch (error) {
          if (typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn('[TourGuide] Invalid selector for target:', step.target);
          }
        }
      }

      return null;
    }

    renderStep(step) {
      if (!this.isActive || !this.container || !this.highlightElement || !this.tooltipElement) {
        return;
      }

      const target = this.resolveTarget(step);
      this.currentTarget = target;

      if (this.titleElement) {
        this.titleElement.textContent = step.title || '';
      }

      if (this.contentElement) {
        this.contentElement.textContent = step.content || '';
      }

      if (this.prevButton) {
        this.prevButton.disabled = this.currentStepIndex === 0;
      }

      if (this.nextButton) {
        const isLast = this.currentStepIndex === this.steps.length - 1;
        this.nextButton.textContent = isLast ? this.options.labels.finish : this.options.labels.next;
      }

      if (this.closeButton) {
        this.closeButton.style.display = this.options.allowClose ? 'inline-flex' : 'none';
      }

      if (this.stepIndicator) {
        this.stepIndicator.textContent = `${this.currentStepIndex + 1}/${this.steps.length}`;
      }

      if (this.dotsElement) {
        this.renderDots();
      }

      this.updateHighlightPosition(step, target);
      this.updateTooltipPosition(step, target);
    }

    renderDots() {
      if (!this.dotsElement) {
        return;
      }

      this.dotsElement.innerHTML = '';
      for (let index = 0; index < this.steps.length; index += 1) {
        const dot = document.createElement('span');
        dot.className = 'tgjs-dot';
        if (index === this.currentStepIndex) {
          dot.classList.add('tgjs-dot--active');
        }
        this.dotsElement.appendChild(dot);
      }
    }

    updateHighlightPosition(step, target) {
      if (!this.highlightElement) {
        return;
      }

      let rect;
      if (target && typeof target.getBoundingClientRect === 'function') {
        rect = target.getBoundingClientRect();
      } else {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        rect = {
          top: centerY - 40,
          left: centerX - 40,
          width: 80,
          height: 80
        };
      }

      const padding = typeof step.highlightPadding === 'number'
        ? step.highlightPadding
        : this.options.highlightPadding;

      const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;

      const top = rect.top + scrollY - padding;
      const left = rect.left + scrollX - padding;
      const width = rect.width + padding * 2;
      const height = rect.height + padding * 2;

      this.highlightElement.style.top = `${Math.max(0, top)}px`;
      this.highlightElement.style.left = `${Math.max(0, left)}px`;
      this.highlightElement.style.width = `${Math.max(0, width)}px`;
      this.highlightElement.style.height = `${Math.max(0, height)}px`;

      if (target && typeof target.scrollIntoView === 'function') {
        try {
          target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } catch (error) {
          target.scrollIntoView(true);
        }
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: Math.max(0, top - 120), behavior: 'smooth' });
      }
    }

    updateTooltipPosition(step, target) {
      if (!this.tooltipElement) {
        return;
      }

      const tooltip = this.tooltipElement;

      tooltip.style.top = '0px';
      tooltip.style.left = '0px';

      const padding = typeof step.highlightPadding === 'number'
        ? step.highlightPadding
        : this.options.highlightPadding;

      let rect;
      if (target && typeof target.getBoundingClientRect === 'function') {
        rect = target.getBoundingClientRect();
      } else {
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
        rect = {
          top: viewportHeight / 2 - 40,
          left: viewportWidth / 2 - 40,
          width: 80,
          height: 80
        };
      }

      const scrollX = typeof window !== 'undefined' ? window.scrollX : 0;
      const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      const tooltipRect = tooltip.getBoundingClientRect();

      const availableWidth = typeof window !== 'undefined' ? window.innerWidth : tooltipRect.width;
      const availableHeight = typeof window !== 'undefined' ? window.innerHeight : tooltipRect.height;

      let top = rect.bottom + scrollY + padding + 16;
      let left = rect.left + scrollX;

      const placement = (step.placement || 'auto').toLowerCase();

      if (placement === 'top') {
        top = rect.top + scrollY - tooltipRect.height - padding - 16;
      } else if (placement === 'left') {
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left + scrollX - tooltipRect.width - padding - 16;
      } else if (placement === 'right') {
        top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + scrollX + padding + 16;
      } else if (placement === 'center') {
        top = scrollY + (availableHeight - tooltipRect.height) / 2;
        left = scrollX + (availableWidth - tooltipRect.width) / 2;
      } else {
        if (top + tooltipRect.height > scrollY + availableHeight - 16) {
          top = rect.top + scrollY - tooltipRect.height - padding - 16;
        }
      }

      if (left + tooltipRect.width > scrollX + availableWidth - 16) {
        left = scrollX + availableWidth - tooltipRect.width - 16;
      }
      if (left < scrollX + 16) {
        left = scrollX + 16;
      }

      if (top < scrollY + 16) {
        top = scrollY + 16;
      }

      tooltip.style.top = `${Math.round(top)}px`;
      tooltip.style.left = `${Math.round(left)}px`;
    }
  }

  if (typeof window !== 'undefined') {
    window.TourGuideClient = TourGuideClient;
  }
})();
