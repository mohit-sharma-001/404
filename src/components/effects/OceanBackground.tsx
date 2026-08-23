import React, { useEffect, useRef } from 'react';
import type { SatelliteChannel } from '../../types/prediction';
import { THEMES } from '../../theme/themeSystem';

export interface OceanBackgroundProps {
  className?: string;
  activeChannel?: SatelliteChannel;
}

// Color lerp helper
function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export const OceanBackground: React.FC<OceanBackgroundProps> = ({
  className = '',
  activeChannel = 'IR',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const activeChannelRef = useRef<SatelliteChannel>(activeChannel);
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // Current interpolated values for smooth mode transitions (700-1200ms)
  const currentThemeRef = useRef({
    stop0: hexToRgb(THEMES.IR.bgColors.stop0),
    stop1: hexToRgb(THEMES.IR.bgColors.stop1),
    stop2: hexToRgb(THEMES.IR.bgColors.stop2),
    haze: THEMES.IR.bgColors.hazeRgb,
    modeWeightIR: 1,
    modeWeightVIS: 0,
    modeWeightWV: 0,
    modeWeightPMW: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseRef.current.targetX = (e.clientX - cx) / cx;
      mouseRef.current.targetY = (e.clientY - cy) / cy;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. IR Space Stars & Particles
    const irStars = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    // 2. VIS Orbital Aerosol Particles
    const visParticles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      orbitRadius: 180 + Math.random() * 250,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: 0.003 + Math.random() * 0.005,
    }));

    // 3. WV Moisture Droplets
    const wvDroplets = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedY: -0.2 - Math.random() * 0.4,
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    // 4. PMW Rain Drops & Lightning State
    const pmwRain = Array.from({ length: 75 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 18,
      speedY: 8 + Math.random() * 7,
      speedX: -1 - Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.3,
    }));

    let lightningAlpha = 0;
    let nextLightningTime = Date.now() + 5000 + Math.random() * 6000;
    let lightningBranch: Array<{ x: number; y: number }> = [];

    const generateLightningBolt = () => {
      const startX = width * (0.3 + Math.random() * 0.4);
      let currX = startX;
      let currY = 0;
      const branch = [{ x: currX, y: currY }];

      while (currY < height * 0.5) {
        currY += 20 + Math.random() * 30;
        currX += (Math.random() - 0.5) * 60;
        branch.push({ x: currX, y: currY });
      }

      return branch;
    };

    let step = 0;

    const lerp = (curr: number, target: number, speed = 0.04) => curr + (target - curr) * speed;

    const lerpColor = (
      curr: { r: number; g: number; b: number },
      targetHex: string,
      speed = 0.04
    ) => {
      const target = hexToRgb(targetHex);
      curr.r += (target.r - curr.r) * speed;
      curr.g += (target.g - curr.g) * speed;
      curr.b += (target.b - curr.b) * speed;
    };

    // Main Environment Render Loop
    const render = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.03;

      const px = mouseRef.current.x * 25;
      const py = mouseRef.current.y * 25;

      ctx.clearRect(0, 0, width, height);

      const targetTheme = THEMES[activeChannelRef.current] || THEMES.IR;
      const cur = currentThemeRef.current;

      // Smooth color lerp over ~800ms
      lerpColor(cur.stop0, targetTheme.bgColors.stop0, 0.04);
      lerpColor(cur.stop1, targetTheme.bgColors.stop1, 0.04);
      lerpColor(cur.stop2, targetTheme.bgColors.stop2, 0.04);
      cur.haze.r += (targetTheme.bgColors.hazeRgb.r - cur.haze.r) * 0.04;
      cur.haze.g += (targetTheme.bgColors.hazeRgb.g - cur.haze.g) * 0.04;
      cur.haze.b += (targetTheme.bgColors.hazeRgb.b - cur.haze.b) * 0.04;

      // Mode Weights Lerp
      cur.modeWeightIR = lerp(cur.modeWeightIR, activeChannelRef.current === 'IR' ? 1 : 0, 0.04);
      cur.modeWeightVIS = lerp(cur.modeWeightVIS, activeChannelRef.current === 'VIS' ? 1 : 0, 0.04);
      cur.modeWeightWV = lerp(cur.modeWeightWV, activeChannelRef.current === 'WV' ? 1 : 0, 0.04);
      cur.modeWeightPMW = lerp(cur.modeWeightPMW, activeChannelRef.current === 'PMW' ? 1 : 0, 0.04);

      let r0 = Math.round(cur.stop0.r), g0 = Math.round(cur.stop0.g), b0 = Math.round(cur.stop0.b);
      let r1 = Math.round(cur.stop1.r), g1 = Math.round(cur.stop1.g), b1 = Math.round(cur.stop1.b);
      let r2 = Math.round(cur.stop2.r), g2 = Math.round(cur.stop2.g), b2 = Math.round(cur.stop2.b);

      // Handle PMW Lightning Flash calculation
      if (cur.modeWeightPMW > 0.1) {
        const now = Date.now();
        if (now > nextLightningTime) {
          lightningAlpha = 0.22;
          lightningBranch = generateLightningBolt();
          nextLightningTime = now + 7000 + Math.random() * 8000;
        } else if (lightningAlpha > 0) {
          lightningAlpha *= 0.88;
          if (lightningAlpha < 0.01) lightningAlpha = 0;
        }
      } else {
        lightningAlpha = 0;
      }

      // Add lightning brightness boost to background stops when flashing
      if (lightningAlpha > 0.01) {
        const flashBoost = Math.round(lightningAlpha * 120);
        r0 = Math.min(255, r0 + flashBoost);
        g0 = Math.min(255, g0 + flashBoost);
        b0 = Math.min(255, b0 + flashBoost);
      }

      // Layer 0: Root Global Atmosphere Base Gradient
      const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
      baseGrad.addColorStop(0, `rgb(${r0}, ${g0}, ${b0})`);
      baseGrad.addColorStop(0.5, `rgb(${r1}, ${g1}, ${b1})`);
      baseGrad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);

      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        step += 0.012;
      }

      const centerX = width * 0.65 + px;
      const centerY = height * 0.42 + py;

      // -------------------------------------------------------------
      // ENVIRONMENT 1 — IR (Space / Satellite Orbit)
      // -------------------------------------------------------------
      if (cur.modeWeightIR > 0.01) {
        ctx.save();
        ctx.globalAlpha = cur.modeWeightIR;

        // Drifting Stars
        irStars.forEach((star) => {
          star.x += star.speedX;
          star.y += star.speedY;
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(244, 246, 248, ${star.alpha * 0.7})`;
          ctx.fill();
        });

        // Rotating Orbital Sensor Rings
        ctx.save();
        ctx.translate(centerX, centerY);
        [140, 280, 440, 620].forEach((radius, idx) => {
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(216, 220, 226, ${0.035 + idx * 0.015})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([8, 14]);
          ctx.stroke();
        });

        // Vertical Satellite Scan Line
        const scanY = ((Math.sin(step * 0.4) + 1) / 2) * height - centerY;
        ctx.strokeStyle = 'rgba(216, 220, 226, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(-centerX, scanY);
        ctx.lineTo(width - centerX, scanY);
        ctx.stroke();

        ctx.restore();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // ENVIRONMENT 2 — VIS (Earth Revolution)
      // -------------------------------------------------------------
      if (cur.modeWeightVIS > 0.01) {
        ctx.save();
        ctx.globalAlpha = cur.modeWeightVIS;

        // Stylized Earth Globe Off-Axis (Top-Right Background)
        const earthX = width * 0.78 + px * 0.5;
        const earthY = height * 0.35 + py * 0.5;
        const earthRadius = 140;

        // Earth Atmosphere Outer Halo Glow
        const earthHalo = ctx.createRadialGradient(
          earthX,
          earthY,
          earthRadius * 0.8,
          earthX,
          earthY,
          earthRadius * 1.8
        );
        earthHalo.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        earthHalo.addColorStop(0.3, 'rgba(0, 176, 255, 0.18)');
        earthHalo.addColorStop(0.6, 'rgba(124, 77, 255, 0.08)');
        earthHalo.addColorStop(1, 'rgba(2, 8, 23, 0)');

        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = earthHalo;
        ctx.fill();

        // Earth Body Sphere
        const earthGrad = ctx.createRadialGradient(
          earthX - 40,
          earthY - 40,
          10,
          earthX,
          earthY,
          earthRadius
        );
        earthGrad.addColorStop(0, '#00B0FF');
        earthGrad.addColorStop(0.5, '#023E8A');
        earthGrad.addColorStop(0.85, '#001845');
        earthGrad.addColorStop(1, '#000814');

        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.fillStyle = earthGrad;
        ctx.fill();

        // Rotating Continents / Atmospheric Clouds Simulation
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
        ctx.clip();

        const rotAngle = step * 0.15;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        ctx.lineWidth = 18;

        for (let c = -2; c <= 3; c++) {
          const cx = earthX + Math.sin(rotAngle + c * 1.2) * 90;
          const cy = earthY + (c * 45);
          ctx.beginPath();
          ctx.arc(cx, cy, 50, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
          ctx.fill();
        }
        ctx.restore();

        // Orbital Trajectory Arc & Particles
        ctx.beginPath();
        ctx.ellipse(earthX, earthY, earthRadius * 2.2, earthRadius * 1.2, Math.PI * -0.15, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 14]);
        ctx.stroke();

        visParticles.forEach((p) => {
          p.orbitAngle += p.orbitSpeed;
          const px = earthX + Math.cos(p.orbitAngle) * p.orbitRadius;
          const py = earthY + Math.sin(p.orbitAngle) * (p.orbitRadius * 0.55);

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
          ctx.fill();
        });

        ctx.restore();
      }

      // -------------------------------------------------------------
      // ENVIRONMENT 3 — WV (Atmospheric Waves)
      // -------------------------------------------------------------
      if (cur.modeWeightWV > 0.01) {
        ctx.save();
        ctx.globalAlpha = cur.modeWeightWV;

        // Volumetric Moisture Ribbons
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
          ctx.beginPath();
          const baseH = height * (0.35 + i * 0.18);
          const wavelength = 0.003 - i * 0.0005;
          const amp = 45 + i * 20;
          const phase = step * (0.8 + i * 0.25);

          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 20) {
            const y = baseH + Math.sin(x * wavelength + phase) * amp + py * (i + 1) * 0.25;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();

          const opacity = 0.15 - i * 0.03;
          ctx.fillStyle = i % 2 === 0 ? `rgba(0, 176, 255, ${opacity})` : `rgba(56, 189, 248, ${opacity})`;
          ctx.fill();
        }

        // Moisture Droplets Drifting
        wvDroplets.forEach((d) => {
          d.y += d.speedY;
          d.x += d.speedX;
          if (d.y < 0) d.y = height;
          if (d.x < 0) d.x = width;
          if (d.x > width) d.x = 0;

          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 176, 255, ${d.alpha * 0.6})`;
          ctx.fill();
        });

        ctx.restore();
      }

      // -------------------------------------------------------------
      // ENVIRONMENT 4 — PMW (Rain + Lightning Storm)
      // -------------------------------------------------------------
      if (cur.modeWeightPMW > 0.01) {
        ctx.save();
        ctx.globalAlpha = cur.modeWeightPMW;

        // Natural Falling Rain Drops
        ctx.strokeStyle = 'rgba(214, 168, 79, 0.28)';
        ctx.lineWidth = 1.2;

        pmwRain.forEach((r) => {
          r.y += r.speedY;
          r.x += r.speedX;
          if (r.y > height) {
            r.y = -20;
            r.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + r.speedX * 2, r.y + r.length);
          ctx.stroke();
        });

        // Rare Lightning Flash Branch Stroke
        if (lightningAlpha > 0.02 && lightningBranch.length > 1) {
          ctx.beginPath();
          ctx.moveTo(lightningBranch[0].x, lightningBranch[0].y);
          for (let b = 1; b < lightningBranch.length; b++) {
            ctx.lineTo(lightningBranch[b].x, lightningBranch[b].y);
          }
          ctx.strokeStyle = `rgba(242, 204, 114, ${lightningAlpha * 3.5})`;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#D6A84F';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Radar Range Rings
        ctx.save();
        ctx.translate(centerX, centerY);
        [120, 260, 420].forEach((ringR, idx) => {
          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(214, 168, 79, ${0.06 + idx * 0.02})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 8]);
          ctx.stroke();
        });
        ctx.restore();

        ctx.restore();
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-700 ${className}`}
      style={{ opacity: 0.98 }}
    />
  );
};
