import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Terracotta3DCanvasProps {
  isDark?: boolean;
}

/**
 * Terracotta Sunset 3D Interactive WebGL Scene
 * Built with Three.js for ultra-smooth 60fps luxury aesthetic.
 * Features:
 * - Satin & Glassmorphic Torus Knot sculpture
 * - Floating ceramic and frosted glass satellite orbs
 * - Ambient delicate orbital rings
 * - Warm sunset dust particle field
 * - Interactive mouse parallax with smooth damping
 */
export const Terracotta3DCanvas: React.FC<Terracotta3DCanvasProps> = ({ isDark = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // 3. Lighting Setup (Terracotta Sunset Warm Glow)
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x2d1a16 : 0xfffaf6,
      isDark ? 0.9 : 1.4
    );
    scene.add(ambientLight);

    // Key Light (Sunset Amber)
    const keyLight = new THREE.DirectionalLight(0xd9794e, 3.4);
    keyLight.position.set(6, 7, 5);
    scene.add(keyLight);

    // Fill Light (Warm Clay)
    const fillLight = new THREE.DirectionalLight(0xb5523a, 2.0);
    fillLight.position.set(-6, -3, 3);
    scene.add(fillLight);

    // Back / Rim Light (Champagne Peach Glow)
    const rimLight = new THREE.DirectionalLight(0xf1c2a7, 2.8);
    rimLight.position.set(3, 5, -5);
    scene.add(rimLight);

    // Interactive Point Light (moves with mouse)
    const cursorLight = new THREE.PointLight(0xe7a27a, 2.6, 14);
    cursorLight.position.set(2, 0, 4);
    scene.add(cursorLight);

    // 4. Main Sculpture Group (Offset to right side on wide screens)
    const group = new THREE.Group();
    const isWide = width > 960;
    const baseOffsetX = isWide ? 2.3 : 0;
    const baseOffsetY = isWide ? 0 : 1.2;
    group.position.set(baseOffsetX, baseOffsetY, 0);
    if (!isWide) {
      group.scale.setScalar(0.78);
    }
    scene.add(group);

    // HERO MESH: Luxury Satin Terracotta Torus Knot
    const knotGeometry = new THREE.TorusKnotGeometry(1.45, 0.44, 160, 36, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(isDark ? 0xb5523a : 0xd9794e),
      emissive: new THREE.Color(isDark ? 0x4a1f16 : 0x7a3e2e),
      emissiveIntensity: 0.18,
      roughness: 0.26,
      metalness: 0.22,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
      reflectivity: 0.75,
    });
    const knotMesh = new THREE.Mesh(knotGeometry, knotMaterial);
    group.add(knotMesh);

    // INNER CORE: Glowing warm pearl / peach sphere
    const coreGeometry = new THREE.SphereGeometry(0.74, 48, 48);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf1c2a7),
      roughness: 0.38,
      metalness: 0.12,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // 5. Floating Satellite Elements
    const satellites: { mesh: THREE.Mesh; speed: number; radius: number; angle: number; yOffset: number }[] = [];

    // Glass & Ceramic Floating Spheres
    const orbConfigs = [
      { size: 0.42, color: 0xb5523a, radius: 2.8, speed: 0.007, yOffset: 0.7, glass: false },
      { size: 0.28, color: 0xf1c2a7, radius: 2.4, speed: -0.011, yOffset: -0.9, glass: true },
      { size: 0.48, color: 0xe7a27a, radius: 3.3, speed: 0.005, yOffset: -0.35, glass: false },
      { size: 0.24, color: 0xfffaf6, radius: 2.2, speed: -0.014, yOffset: 1.1, glass: true },
      { size: 0.34, color: 0x7a3e2e, radius: 2.9, speed: 0.009, yOffset: 0.25, glass: false },
    ];

    orbConfigs.forEach((cfg) => {
      const geo = new THREE.SphereGeometry(cfg.size, 32, 32);
      let mat: THREE.Material;

      if (cfg.glass) {
        mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(cfg.color),
          roughness: 0.12,
          metalness: 0.05,
          transmission: 0.78,
          ior: 1.45,
          thickness: 0.55,
          transparent: true,
          opacity: 0.9,
        });
      } else {
        mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(cfg.color),
          roughness: 0.32,
          metalness: 0.18,
        });
      }

      const orb = new THREE.Mesh(geo, mat);
      scene.add(orb);
      satellites.push({
        mesh: orb,
        speed: cfg.speed,
        radius: cfg.radius,
        angle: Math.random() * Math.PI * 2,
        yOffset: cfg.yOffset,
      });
    });

    // 6. Delicate Orbital Rings
    const ringGeo1 = new THREE.TorusGeometry(2.7, 0.02, 24, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xf7dbcc),
      transparent: true,
      opacity: isDark ? 0.25 : 0.45,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    ringMesh1.rotation.y = Math.PI / 6;
    group.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(3.1, 0.015, 24, 120);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xd9794e),
      transparent: true,
      opacity: isDark ? 0.2 : 0.35,
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.x = -Math.PI / 4;
    ringMesh2.rotation.y = Math.PI / 3;
    group.add(ringMesh2);

    // 7. Ambient Golden/Terracotta Dust Particles (Wide Fullscreen Spread)
    const particleCount = 160;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 18;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(0xf1c2a7),
      size: 0.055,
      transparent: true,
      opacity: isDark ? 0.45 : 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 8. Mouse Listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);

      const wideNow = newWidth > 960;
      group.position.x = wideNow ? 2.3 : 0;
      group.position.y = wideNow ? 0 : 1.2;
      group.scale.setScalar(wideNow ? 1 : 0.78);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse interpolation (Damping)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      const currentWide = container.clientWidth > 960;
      const targetBaseX = currentWide ? 2.3 : 0;
      const targetBaseY = currentWide ? 0 : 1.2;

      // Group Ambient Float + Mouse Tilt
      group.rotation.x = Math.sin(elapsedTime * 0.35) * 0.2 + mouseRef.current.y * 0.3;
      group.rotation.y = elapsedTime * 0.42 + mouseRef.current.x * 0.4;
      group.position.x = targetBaseX + mouseRef.current.x * 0.35;
      group.position.y = targetBaseY + Math.sin(elapsedTime * 0.8) * 0.16 + mouseRef.current.y * 0.2;

      // Camera subtle parallax
      camera.position.x = mouseRef.current.x * 0.5;
      camera.position.y = mouseRef.current.y * 0.35;
      camera.lookAt(currentWide ? 1.0 : 0, currentWide ? 0 : 0.5, 0);

      // Ring counter-rotations
      ringMesh1.rotation.z += 0.003;
      ringMesh2.rotation.z -= 0.0025;

      // Cursor light follow
      cursorLight.position.x = targetBaseX + mouseRef.current.x * 3;
      cursorLight.position.y = mouseRef.current.y * 3;

      // Satellite Orbits around group center
      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        sat.mesh.position.x = targetBaseX + Math.cos(sat.angle) * sat.radius + mouseRef.current.x * 0.3;
        sat.mesh.position.z = Math.sin(sat.angle) * sat.radius;
        sat.mesh.position.y = targetBaseY + sat.yOffset + Math.sin(elapsedTime * 1.2 + sat.angle) * 0.2 + mouseRef.current.y * 0.2;
        sat.mesh.rotation.y += 0.01;
      });

      // Particle Gentle Drift
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js resources
      renderer.dispose();
      knotGeometry.dispose();
      knotMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    />
  );
};
