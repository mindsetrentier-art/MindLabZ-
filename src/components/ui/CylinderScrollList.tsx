import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react';

interface RegisteredCylinderItem {
  wrapper: HTMLElement;
  shade: HTMLElement | null;
}

interface CylinderScrollContextValue {
  register: (id: string, entry: RegisteredCylinderItem) => void;
  unregister: (id: string) => void;
  scheduleUpdate: () => void;
  tone: 'light' | 'dark';
}

const CylinderScrollContext = createContext<CylinderScrollContextValue | null>(null);

const MAX_ROTATE_DEG = 31;
const CYLINDER_RADIUS_PX = 580;
const PERSPECTIVE_PX = 1100;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function setElementMask(el: HTMLElement, value: string) {
  const style = el.style as CSSStyleDeclaration & { webkitMaskImage?: string };
  style.maskImage = value;
  style.webkitMaskImage = value;
}

interface CylinderScrollListProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
  /** Focal vertical ratio of the viewport (0.5 = vertical center) */
  focalViewportRatio?: number;
}

/**
 * Coordinates GPU-composited 3D cylindrical scroll transforms, inertial scroll momentum physics,
 * depth shadow transitions, distance-driven scale/opacity gradients, and smooth top/bottom
 * viewport-edge gradient masking as items enter or leave the visible scroll region.
 */
export const CylinderScrollList: React.FC<CylinderScrollListProps> = ({
  children,
  className = '',
  tone = 'light',
  focalViewportRatio = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Map<string, RegisteredCylinderItem>>(new Map());
  const rafRef = useRef<number | null>(null);
  const reducedMotionRef = useRef<boolean>(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Scroll momentum physics state (all in refs so 60/120fps updates cause zero React re-renders)
  const physicsRef = useRef({
    lastScrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    lastScrollTime: 0,
    lastFrameTime: 0,
    smoothedVelPxMs: 0,
    springPos: 0,
    springVel: 0,
  });

  const applyItemTransforms = useCallback(
    (momentumFactor: number) => {
      if (typeof window === 'undefined') return;

      const vh = Math.max(360, window.innerHeight || 800);
      const focalY = vh * focalViewportRatio;
      const halfSpan = vh * 0.52;
      const reduce = reducedMotionRef.current;

      // Viewport top & bottom gradient masking bounds so items leaving the scroll region fade smoothly
      const topEdge = clamp(vh * 0.065, 44, 70);
      const topFadeSpan = clamp(vh * 0.16, 86, 148);
      const topClear = topEdge + topFadeSpan;

      const bottomEdge = vh - clamp(vh * 0.065, 44, 70);
      const bottomFadeSpan = clamp(vh * 0.16, 86, 148);
      const bottomClear = bottomEdge - bottomFadeSpan;

      const kineticTiltDeg = -momentumFactor * 6.5;
      const kineticOffsetY = -momentumFactor * 12;

      itemsRef.current.forEach(({ wrapper, shade }) => {
        if (reduce) {
          wrapper.style.transform = '';
          wrapper.style.opacity = '';
          wrapper.style.boxShadow = '';
          wrapper.style.zIndex = '';
          setElementMask(wrapper, '');
          if (shade) {
            shade.style.opacity = '0';
          }
          return;
        }

        const rect = wrapper.getBoundingClientRect();
        // Skip off-screen elements far outside the viewport
        if (rect.bottom < -vh * 0.65 || rect.top > vh * 1.65) {
          return;
        }

        const itemCenterY = rect.top + rect.height * 0.5;
        const rawT = (itemCenterY - focalY) / halfSpan;
        const t = clamp(rawT, -1.25, 1.25);
        const absT = Math.abs(t);

        // Smooth cylindrical arc curve: crisp at focal band, accelerating curvature near top/bottom rims
        const curvedMag = absT * (0.45 + 0.55 * Math.min(1, absT));
        const signedCurve = (t < 0 ? -1 : 1) * curvedMag;

        // Upper items tilt backward at top (+rotateX); lower items tilt backward at bottom (-rotateX)
        // Combined with spring-damped inertial rotational lag from scroll momentum
        const rotateX = clamp(-signedCurve * MAX_ROTATE_DEG + kineticTiltDeg, -38, 38);
        const rad = (Math.abs(rotateX) * Math.PI) / 180;

        // Cylindrical Z recession + tangent arc tuck + inertial scroll lag
        const translateZ = (Math.cos(rad) - 1) * CYLINDER_RADIUS_PX;
        const translateY =
          -Math.sign(t) * Math.pow(Math.min(absT, 1.2), 2) * 14 + kineticOffsetY;

        // Enhanced distance-driven scale & opacity gradients
        const scale = clamp(1 - Math.pow(Math.max(0, absT - 0.08), 1.25) * 0.19, 0.76, 1);
        const opacity = clamp(1 - Math.pow(Math.max(0, absT - 0.1), 1.45) * 0.52, 0.34, 1);
        const zIndex = Math.max(1, Math.round(35 - absT * 24));

        wrapper.style.transform = `perspective(${PERSPECTIVE_PX}px) translate3d(0px, ${translateY.toFixed(
          2
        )}px, ${translateZ.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(
          4
        )})`;
        wrapper.style.opacity = opacity.toFixed(3);
        wrapper.style.zIndex = String(zIndex);

        // Smooth Top/Bottom Gradient Masking as items enter or leave the visible scroll region
        const cardH = Math.max(1, rect.height);
        const needsTopMask = rect.top < topClear;
        const needsBottomMask = rect.bottom > bottomClear;

        if (!needsTopMask && !needsBottomMask) {
          setElementMask(wrapper, 'none');
        } else if (needsTopMask && !needsBottomMask) {
          const zPct = ((topEdge - rect.top) / cardH) * 100;
          const mPct = ((topEdge + topFadeSpan * 0.45 - rect.top) / cardH) * 100;
          const oPct = ((topClear - rect.top) / cardH) * 100;
          setElementMask(
            wrapper,
            `linear-gradient(to bottom, rgba(0,0,0,0) ${zPct.toFixed(1)}%, rgba(0,0,0,0.44) ${mPct.toFixed(
              1
            )}%, rgba(0,0,0,1) ${oPct.toFixed(1)}%)`
          );
        } else if (!needsTopMask && needsBottomMask) {
          const oPct = ((bottomClear - rect.top) / cardH) * 100;
          const mPct = ((bottomEdge - bottomFadeSpan * 0.45 - rect.top) / cardH) * 100;
          const zPct = ((bottomEdge - rect.top) / cardH) * 100;
          setElementMask(
            wrapper,
            `linear-gradient(to bottom, rgba(0,0,0,1) ${oPct.toFixed(1)}%, rgba(0,0,0,0.44) ${mPct.toFixed(
              1
            )}%, rgba(0,0,0,0) ${zPct.toFixed(1)}%)`
          );
        } else {
          // Tall card bridging both top and bottom mask boundaries simultaneously
          const topZero = ((topEdge - rect.top) / cardH) * 100;
          const topOne = Math.min(48, ((topClear - rect.top) / cardH) * 100);
          const botOne = Math.max(52, ((bottomClear - rect.top) / cardH) * 100);
          const botZero = ((bottomEdge - rect.top) / cardH) * 100;
          setElementMask(
            wrapper,
            `linear-gradient(to bottom, rgba(0,0,0,0) ${topZero.toFixed(1)}%, rgba(0,0,0,1) ${topOne.toFixed(
              1
            )}%, rgba(0,0,0,1) ${botOne.toFixed(1)}%, rgba(0,0,0,0) ${botZero.toFixed(1)}%)`
          );
        }

        // Depth shadow transitions: elevated focal bloom -> directional recessed drum shadow
        const isFocalBand = absT < 0.28;
        const depthRatio = clamp((absT - 0.12) / 1.05, 0, 1);
        if (tone === 'dark') {
          const yOffset = Math.round(6 + depthRatio * 16) * (t <= 0 ? 1 : -1);
          const blur = Math.round(30 - depthRatio * 14);
          const alpha = (0.48 - depthRatio * 0.16).toFixed(2);
          wrapper.style.boxShadow = isFocalBand
            ? `0 22px 46px -12px rgba(0, 0, 0, 0.54), 0 0 0 1px rgba(255, 255, 255, 0.09)`
            : `0 ${yOffset}px ${blur}px -10px rgba(0, 0, 0, ${alpha})`;
        } else {
          const yOffset = Math.round(16 - depthRatio * 7) * (t <= 0 ? 1 : -1);
          const blur = Math.round(38 - depthRatio * 18);
          const ambientAlpha = (0.16 - depthRatio * 0.05).toFixed(3);
          const tintAlpha = (0.1 * (1 - depthRatio * 0.72)).toFixed(3);
          wrapper.style.boxShadow = isFocalBand
            ? `0 22px 44px -14px rgba(28, 25, 23, 0.16), 0 8px 18px -4px rgba(83, 44, 216, 0.09)`
            : `0 ${yOffset}px ${blur}px -10px rgba(28, 25, 23, ${ambientAlpha}), 0 2px 8px -2px rgba(83, 44, 216, ${tintAlpha})`;
        }

        // Directional curvature shading scrim simulating cylinder top/bottom shadow falloff
        if (shade) {
          const momentumBoost = Math.min(0.06, Math.abs(momentumFactor) * 0.06);
          const shadeAlpha = clamp(Math.max(0, absT - 0.14) * 0.28 + momentumBoost, 0, 0.36);
          if (shadeAlpha <= 0.005) {
            shade.style.opacity = '0';
          } else {
            const dir = t < 0 ? '180deg' : '0deg';
            const shadeRgb = tone === 'dark' ? '6, 8, 20' : '28, 25, 23';
            shade.style.background = `linear-gradient(${dir}, rgba(${shadeRgb}, ${shadeAlpha.toFixed(
              3
            )}) 0%, rgba(${shadeRgb}, ${(shadeAlpha * 0.38).toFixed(
              3
            )}) 55%, transparent 100%)`;
            shade.style.opacity = '1';
          }
        }
      });
    },
    [focalViewportRatio, tone]
  );

  const stepPhysics = useCallback(
    (now: number) => {
      const p = physicsRef.current;
      if (reducedMotionRef.current) {
        p.smoothedVelPxMs = 0;
        p.springPos = 0;
        p.springVel = 0;
        applyItemTransforms(0);
        rafRef.current = null;
        return;
      }

      const prevFrame = p.lastFrameTime || now - 16;
      const dtSec = clamp((now - prevFrame) / 1000, 0.004, 0.034);
      p.lastFrameTime = now;

      // Exponentially decay scroll velocity once active scrolling stops
      const msSinceScroll = now - p.lastScrollTime;
      if (msSinceScroll > 24) {
        p.smoothedVelPxMs *= Math.exp(-dtSec * 13);
      }

      // 2nd-order underdamped spring-damper for elastic momentum settle
      const targetMomentum = clamp(p.smoothedVelPxMs * 0.42, -1, 1);
      const stiffness = 195;
      const damping = 18.5;
      const accel = stiffness * (targetMomentum - p.springPos) - damping * p.springVel;
      p.springVel += accel * dtSec;
      p.springPos += p.springVel * dtSec;

      applyItemTransforms(p.springPos);

      const isSettled =
        msSinceScroll > 48 &&
        Math.abs(p.smoothedVelPxMs) < 0.008 &&
        Math.abs(p.springPos) < 0.002 &&
        Math.abs(p.springVel) < 0.005;

      if (isSettled) {
        p.smoothedVelPxMs = 0;
        p.springPos = 0;
        p.springVel = 0;
        p.lastFrameTime = 0;
        applyItemTransforms(0);
        rafRef.current = null;
      } else {
        rafRef.current = window.requestAnimationFrame(stepPhysics);
      }
    },
    [applyItemTransforms]
  );

  const startPhysicsLoop = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (rafRef.current !== null) return;
    physicsRef.current.lastFrameTime = performance.now();
    rafRef.current = window.requestAnimationFrame(stepPhysics);
  }, [stepPhysics]);

  const scheduleUpdate = useCallback(() => {
    startPhysicsLoop();
  }, [startPhysicsLoop]);

  const register = useCallback(
    (id: string, entry: RegisteredCylinderItem) => {
      itemsRef.current.set(id, entry);
      scheduleUpdate();
    },
    [scheduleUpdate]
  );

  const unregister = useCallback((id: string) => {
    itemsRef.current.delete(id);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const onMqChange = (ev: MediaQueryListEvent) => {
      reducedMotionRef.current = ev.matches;
      scheduleUpdate();
    };
    mq?.addEventListener?.('change', onMqChange);

    const onScroll = () => {
      const now = performance.now();
      const curY = window.scrollY;
      const p = physicsRef.current;
      const dt = clamp(now - (p.lastScrollTime || now - 16), 4, 64);
      const dy = curY - p.lastScrollY;
      const instantVel = clamp(dy / dt, -5.0, 5.0);

      p.smoothedVelPxMs = p.smoothedVelPxMs * 0.42 + instantVel * 0.58;
      p.lastScrollY = curY;
      p.lastScrollTime = now;
      startPhysicsLoop();
    };

    const onResize = () => startPhysicsLoop();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => startPhysicsLoop());
      resizeObserver.observe(containerRef.current);
    }

    startPhysicsLoop();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      mq?.removeEventListener?.('change', onMqChange);
      resizeObserver?.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [scheduleUpdate, startPhysicsLoop]);

  return (
    <CylinderScrollContext.Provider value={{ register, unregister, scheduleUpdate, tone }}>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </CylinderScrollContext.Provider>
  );
};

interface CylinderScrollItemProps {
  children: React.ReactNode;
  className?: string;
  radiusClass?: string;
}

/**
 * Individual list item slot inside CylinderScrollList.
 * Applies 3D cylindrical rotateX + Z-depth + curvature shadow overlay cleanly around its child card.
 */
export const CylinderScrollItem: React.FC<CylinderScrollItemProps> = ({
  children,
  className = '',
  radiusClass = 'rounded-2xl',
}) => {
  const ctx = useContext(CylinderScrollContext);
  const uid = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const shadeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!ctx || !wrapper) return;
    ctx.register(uid, { wrapper, shade: shadeRef.current });
    return () => {
      ctx.unregister(uid);
    };
  }, [ctx, uid]);

  return (
    <div
      ref={wrapperRef}
      className={`relative ${radiusClass} ${className}`}
      style={{
        transformOrigin: 'center center',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity, box-shadow',
      }}
    >
      {children}
      {/* Directional Cylinder Curvature Shadow Overlay */}
      <div
        ref={shadeRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${radiusClass} z-20`}
        style={{ opacity: 0 }}
      />
    </div>
  );
};
