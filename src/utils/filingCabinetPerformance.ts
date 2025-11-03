/**
 * Filing Cabinet Performance Monitoring Utility
 * 
 * Provides real-time performance monitoring and optimization
 * for the unified filing cabinet system.
 */

interface PerformanceMetrics {
  animationFrames: number;
  droppedFrames: number;
  memoryUsage: number;
  renderTime: number;
  interactionLatency: number;
  scrollPerformance: number;
}

interface PerformanceThresholds {
  maxDroppedFrameRate: number; // percentage
  maxMemoryUsage: number; // MB
  maxRenderTime: number; // ms
  maxInteractionLatency: number; // ms
}

export class FilingCabinetPerformanceMonitor {
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private observers: Map<string, PerformanceObserver>;
  private isMonitoring: boolean = false;
  private sessionCount: number = 0;

  constructor() {
    this.metrics = {
      animationFrames: 0,
      droppedFrames: 0,
      memoryUsage: 0,
      renderTime: 0,
      interactionLatency: 0,
      scrollPerformance: 0
    };

    this.thresholds = {
      maxDroppedFrameRate: 5, // 5% dropped frames
      maxMemoryUsage: 50, // 50MB
      maxRenderTime: 16.67, // 60fps
      maxInteractionLatency: 100 // 100ms
    };

    this.observers = new Map();
    this.setupPerformanceObservers();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('📊 Filing Cabinet Performance Monitoring Started');
    
    // Start frame rate monitoring
    this.startFrameRateMonitoring();
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Monitor paint and layout performance
    this.monitorRenderPerformance();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    console.log('📊 Filing Cabinet Performance Monitoring Stopped');
  }

  /**
   * Set session count for performance scaling
   */
  setSessionCount(count: number): void {
    this.sessionCount = count;
    
    // Apply performance optimizations based on session count
    this.applySessionCountOptimizations(count);
  }

  /**
   * Setup performance observers
   */
  private setupPerformanceObservers(): void {
    // Paint observer
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'paint') {
              this.metrics.renderTime = entry.startTime;
            }
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported:', error);
      }

      // Layout shift observer
      try {
        const layoutObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              console.warn('Layout shift detected in filing cabinet:', entry);
            }
          });
        });
        
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout', layoutObserver);
      } catch (error) {
        console.warn('Layout shift observer not supported:', error);
      }
    }
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    let frameCount = 0;
    let lastTime = performance.now();
    let droppedFrames = 0;

    const measureFrames = (currentTime: number) => {
      if (!this.isMonitoring) return;

      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 16.67) { // Dropped frame (60fps = 16.67ms)
        droppedFrames++;
      }
      
      frameCount++;
      
      // Update metrics every second
      if (frameCount % 60 === 0) {
        const dropRate = (droppedFrames / frameCount) * 100;
        this.metrics.animationFrames = frameCount;
        this.metrics.droppedFrames = droppedFrames;
        
        if (dropRate > this.thresholds.maxDroppedFrameRate) {
          this.handlePerformanceIssue('frame-drops', dropRate);
        }
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measureFrames);
    };

    requestAnimationFrame(measureFrames);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return;

      if (performance.memory) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        this.metrics.memoryUsage = memoryMB;
        
        if (memoryMB > this.thresholds.maxMemoryUsage) {
          this.handlePerformanceIssue('memory-usage', memoryMB);
        }
      }
      
      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  /**
   * Monitor render performance
   */
  private monitorRenderPerformance(): void {
    // Monitor glassmorphism render performance
    const testElement = document.createElement('div');
    testElement.className = 'unified-filing-cabinet-glass';
    testElement.style.cssText = `
      position: fixed;
      top: -100px;
      left: -100px;
      width: 50px;
      height: 50px;
      opacity: 0;
      pointer-events: none;
    `;
    
    document.body.appendChild(testElement);
    
    const measureRender = () => {
      if (!this.isMonitoring) return;

      const start = performance.now();
      
      // Force style recalculation
      testElement.style.transform = 'translateY(-1px)';
      void testElement.offsetHeight; // Force reflow
      testElement.style.transform = 'translateY(0px)';
      
      const end = performance.now();
      const renderTime = end - start;
      
      this.metrics.renderTime = renderTime;
      
      if (renderTime > this.thresholds.maxRenderTime) {
        this.handlePerformanceIssue('render-time', renderTime);
      }
      
      setTimeout(measureRender, 1000);
    };

    measureRender();
    
    // Cleanup on stop
    const originalStop = this.stopMonitoring.bind(this);
    this.stopMonitoring = () => {
      document.body.removeChild(testElement);
      originalStop();
    };
  }

  /**
   * Apply optimizations based on session count
   */
  private applySessionCountOptimizations(count: number): void {
    const panels = document.querySelectorAll('.filing-cabinet-panel');
    
    panels.forEach(panel => {
      if (count > 100) {
        // High session count optimizations
        panel.setAttribute('data-session-count-high', 'true');
        
        // Disable expensive animations
        const sessionItems = panel.querySelectorAll('.session-item');
        sessionItems.forEach(item => {
          (item as HTMLElement).style.transition = 'background-color 100ms ease-out';
        });
        
        console.log('🔧 Applied high session count optimizations');
      } else {
        // Normal session count
        panel.removeAttribute('data-session-count-high');
        console.log('🔧 Using normal performance settings');
      }
    });
  }

  /**
   * Handle performance issues
   */
  private handlePerformanceIssue(type: string, value: number): void {
    console.warn(`⚠️ Performance issue detected: ${type} = ${value.toFixed(2)}`);
    
    switch (type) {
      case 'frame-drops':
        this.optimizeForFrameDrops();
        break;
      case 'memory-usage':
        this.optimizeForMemoryUsage();
        break;
      case 'render-time':
        this.optimizeForRenderTime();
        break;
    }
  }

  /**
   * Optimize for frame drops
   */
  private optimizeForFrameDrops(): void {
    console.log('🔧 Applying frame drop optimizations...');
    
    // Reduce glassmorphism complexity
    const elements = document.querySelectorAll('.unified-filing-cabinet-glass');
    elements.forEach(element => {
      (element as HTMLElement).style.backdropFilter = 'blur(5px)';
      (element as HTMLElement).style.webkitBackdropFilter = 'blur(5px)';
    });
    
    // Reduce transition duration
    document.documentElement.style.setProperty('--filing-cabinet-transition-normal', '250ms');
  }

  /**
   * Optimize for memory usage
   */
  private optimizeForMemoryUsage(): void {
    console.log('🔧 Applying memory optimizations...');
    
    // Reset will-change properties
    const elements = document.querySelectorAll('.filing-cabinet-tab, .filing-cabinet-panel');
    elements.forEach(element => {
      (element as HTMLElement).style.willChange = 'auto';
    });
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Optimize for render time
   */
  private optimizeForRenderTime(): void {
    console.log('🔧 Applying render time optimizations...');
    
    // Disable expensive effects
    const elements = document.querySelectorAll('.unified-filing-cabinet-glass');
    elements.forEach(element => {
      (element as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
    });
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const report = `
Filing Cabinet Performance Report
================================
Animation Frames: ${this.metrics.animationFrames}
Dropped Frames: ${this.metrics.droppedFrames} (${((this.metrics.droppedFrames / this.metrics.animationFrames) * 100).toFixed(1)}%)
Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB
Render Time: ${this.metrics.renderTime.toFixed(2)}ms
Session Count: ${this.sessionCount}

Performance Status: ${this.getPerformanceStatus()}
    `;
    
    return report;
  }

  /**
   * Get overall performance status
   */
  private getPerformanceStatus(): string {
    const dropRate = (this.metrics.droppedFrames / this.metrics.animationFrames) * 100;
    
    if (dropRate > this.thresholds.maxDroppedFrameRate ||
        this.metrics.memoryUsage > this.thresholds.maxMemoryUsage ||
        this.metrics.renderTime > this.thresholds.maxRenderTime) {
      return 'POOR - Optimizations Applied';
    } else if (dropRate > 2 || this.metrics.memoryUsage > 25) {
      return 'GOOD - Minor Issues Detected';
    } else {
      return 'EXCELLENT - Optimal Performance';
    }
  }
}

// Global performance monitor instance
export const filingCabinetPerformanceMonitor = new FilingCabinetPerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  filingCabinetPerformanceMonitor.startMonitoring();
}

// Export for manual control
(window as any).filingCabinetPerformance = filingCabinetPerformanceMonitor;
