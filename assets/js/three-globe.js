/**
 * AZAD GLOBAL TRADE — 3D WEBGL INTERACTIVE TRADE GLOBE & PRODUCT EXPORT ENGINE
 * Powered by Three.js (WebGL)
 * Features: High-density particle mesh, animated 3D quadratic bezier trade arcs,
 * glowing atmospheric aura, interactive drag/orbit rotation, and live product/port tooltip HUD.
 * Supports multiple instances (Hero section, Product section, and Catalogue pages).
 */

(function () {
  'use strict';

  function initGlobe() {
    const containers = document.querySelectorAll('.globe-3d-stage, #globe3d-container, #globe3d-product-container');
    if (!containers.length) return;

    // Check if Three.js is loaded, if not load dynamically
    if (typeof THREE === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        containers.forEach(container => build3DGlobe(container));
      };
      script.onerror = () => {
        containers.forEach(container => renderGlobeFallback(container));
      };
      document.head.appendChild(script);
    } else {
      containers.forEach(container => build3DGlobe(container));
    }
  }

  function build3DGlobe(container) {
    if (container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';

    try {
      const width = container.clientWidth || 500;
      const height = container.clientHeight || 460;

      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.z = 220;

      // 2. Renderer with Antialiasing & Alpha
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      const GLOBE_RADIUS = 75;

      // 3. Globe Inner Sphere (Dark Emerald / Obsidian Core)
      const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS - 0.5, 64, 64);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x06120c,
        transparent: true,
        opacity: 0.85
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      globeGroup.add(coreMesh);

      // 4. Globe Dot Matrix / Lat-Long Grid
      const gridGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 36, 18);
      const gridMat = new THREE.MeshBasicMaterial({
        color: 0x245038,
        wireframe: true,
        transparent: true,
        opacity: 0.22
      });
      const gridMesh = new THREE.Mesh(gridGeo, gridMat);
      globeGroup.add(gridMesh);

      // 5. Atmospheric Outer Glow Aura
      const auraGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 32, 32);
      const auraMat = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.29, 0.68, 0.46, 1.0) * intensity * 0.45;
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      globeGroup.add(auraMesh);

      // 6. Global Trade Hub Coordinates (Lat, Lon to 3D Sphere)
      function latLonToVector3(lat, lon, radius, alt = 0) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const r = radius + alt;
        return new THREE.Vector3(
          -(r * Math.sin(phi) * Math.cos(theta)),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
      }

      const hubs = [
        { id: 'kolkata', name: 'West Bengal Hub (Kolkata / Haldia)', lat: 22.5726, lon: 88.3639, isOrigin: true, details: 'Main Export Origin · Jute Mills & Direct Sourcing' },
        { id: 'london', name: 'Port of London / Felixstowe (UK)', lat: 51.5074, lon: -0.1278, isOrigin: false, details: '18-22 Days Transit · Wholesale Jute Bags & Totes' },
        { id: 'rotterdam', name: 'Port of Rotterdam (EU Hub)', lat: 51.9244, lon: 4.4777, isOrigin: false, details: '19-24 Days · Organic Spices & Eco Packaging' },
        { id: 'dubai', name: 'Jebel Ali Port (Dubai, UAE)', lat: 25.0112, lon: 55.0612, isOrigin: false, details: '7-10 Days Express · Agro Produce & Spices' },
        { id: 'hamburg', name: 'Port of Hamburg (Germany)', lat: 53.5511, lon: 9.9937, isOrigin: false, details: '21-26 Days · Certified Hessian Sacks' },
        { id: 'new_york', name: 'Port of NY & NJ (USA)', lat: 40.7128, lon: -74.0060, isOrigin: false, details: '28-34 Days · Indian Artisanship & Handicrafts' },
        { id: 'singapore', name: 'Port of Singapore (Asia Hub)', lat: 1.3521, lon: 103.8198, isOrigin: false, details: '5-8 Days · Direct Bay of Bengal Sea Route' }
      ];

      const originHub = hubs[0];
      const originVec = latLonToVector3(originHub.lat, originHub.lon, GLOBE_RADIUS);

      // 7. Add Hub Markers (Glowing Pulsing Pins)
      const markerGroup = new THREE.Group();
      globeGroup.add(markerGroup);

      const markerObjects = [];

      hubs.forEach((hub) => {
        const pos = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS);
        
        // Inner Dot
        const dotGeo = new THREE.SphereGeometry(hub.isOrigin ? 2.2 : 1.4, 16, 16);
        const dotMat = new THREE.MeshBasicMaterial({
          color: hub.isOrigin ? 0xdab565 : 0x4dae75
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.copy(pos);
        dot.userData = hub;
        markerGroup.add(dot);
        markerObjects.push(dot);

        // Ring Aura around Origin
        if (hub.isOrigin) {
          const ringGeo = new THREE.RingGeometry(2.8, 3.8, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xdab565,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(pos);
          ring.lookAt(new THREE.Vector3(0, 0, 0));
          markerGroup.add(ring);
        }
      });

      // 8. Generate 3D Animated Bezier Trade Arcs
      const arcMeshes = [];
      const pulseParticles = [];

      hubs.filter(h => !h.isOrigin).forEach((destHub) => {
        const destVec = latLonToVector3(destHub.lat, destHub.lon, GLOBE_RADIUS);
        
        // Compute midpoint arched out into 3D space
        const distance = originVec.distanceTo(destVec);
        const midVec = originVec.clone().lerp(destVec, 0.5);
        const midLength = midVec.length();
        midVec.normalize();
        midVec.multiplyScalar(midLength + distance * 0.32);

        const curve = new THREE.QuadraticBezierCurve3(originVec, midVec, destVec);
        const points = curve.getPoints(50);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

        const curveMat = new THREE.LineBasicMaterial({
          color: 0xc9a050,
          transparent: true,
          opacity: 0.45,
          linewidth: 1.5
        });

        const arcLine = new THREE.Line(curveGeo, curveMat);
        globeGroup.add(arcLine);
        arcMeshes.push(arcLine);

        // Glowing traveling particle
        const particleGeo = new THREE.SphereGeometry(1.0, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        globeGroup.add(particle);

        pulseParticles.push({
          mesh: particle,
          curve: curve,
          progress: Math.random()
        });
      });

      // 9. Floating Star Dust Particles
      const starGeo = new THREE.BufferGeometry();
      const starCount = 300;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 400;
        starPositions[i + 1] = (Math.random() - 0.5) * 400;
        starPositions[i + 2] = (Math.random() - 0.5) * 400;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xdab565,
        size: 1.2,
        transparent: true,
        opacity: 0.35
      });
      const starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);

      // Initial Globe Orientation (Focus on India / Middle East / Europe)
      globeGroup.rotation.y = -1.2;
      globeGroup.rotation.x = 0.25;

      // 10. Interactive Mouse / Touch Dragging & Orbit Physics
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let targetRotationY = globeGroup.rotation.y;
      let targetRotationX = globeGroup.rotation.x;
      let autoRotateSpeed = 0.0018;

      container.addEventListener('pointerdown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      });

      window.addEventListener('pointerup', () => {
        isDragging = false;
      });

      container.addEventListener('pointermove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - previousMousePosition.x;
          const deltaY = e.clientY - previousMousePosition.y;

          targetRotationY += deltaX * 0.008;
          targetRotationX += deltaY * 0.008;
          targetRotationX = Math.max(-0.8, Math.min(0.8, targetRotationX));

          previousMousePosition = { x: e.clientX, y: e.clientY };
        }
      });

      // 11. Raycaster for Interactive Tooltip
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const hudEl = container.parentElement.querySelector('.globe-hub-tooltip') || document.getElementById('globeHubTooltip');

      container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(markerObjects);

        if (intersects.length > 0) {
          const target = intersects[0].object.userData;
          if (hudEl && target) {
            hudEl.innerHTML = `
              <div class="glass-3d-panel-gold p-3 rounded text-left pointer-events-none animate-fade-in shadow-2xl">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${target.isOrigin ? 'bg-gold-400 animate-ping' : 'bg-sage-400'}"></span>
                  <p class="text-xs font-bold text-warm-100 uppercase tracking-wider">${target.name}</p>
                </div>
                <p class="text-[11px] text-warm-400 mt-1">${target.details}</p>
              </div>
            `;
            hudEl.style.opacity = '1';
          }
        }
      });

      // 12. Animation Loop
      function animate() {
        requestAnimationFrame(animate);

        // Auto rotate if not dragging
        if (!isDragging) {
          targetRotationY += autoRotateSpeed;
        }

        // Smooth damping
        globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.05;
        globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.05;

        // Animate traveling particles along bezier curves
        pulseParticles.forEach((p) => {
          p.progress += 0.007;
          if (p.progress > 1) p.progress = 0;
          const pt = p.curve.getPoint(p.progress);
          p.mesh.position.copy(pt);
        });

        // Twinkle stars
        starField.rotation.y += 0.0003;

        renderer.render(scene, camera);
      }

      animate();

      // Responsive Resize
      window.addEventListener('resize', () => {
        const newW = container.clientWidth;
        const newH = container.clientHeight || 460;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      });

    } catch (err) {
      console.warn('[3D Globe] WebGL initialization failed on container, fallback rendered.', err);
      renderGlobeFallback(container);
    }
  }

  function renderGlobeFallback(container) {
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center glass-3d-panel rounded-xl">
        <div class="w-20 h-20 rounded-full border-2 border-dashed border-gold-500/40 flex items-center justify-center mb-4 animate-spin" style="animation-duration: 20s;">
          <i data-lucide="globe-2" class="w-10 h-10 text-gold-400"></i>
        </div>
        <h3 class="text-base font-bold text-warm-100 uppercase tracking-widest">Global Export Gateway</h3>
        <p class="text-xs text-warm-400 max-w-xs mt-2">Connecting West Bengal directly with UK, European, Middle Eastern, and North American import ports.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
  } else {
    initGlobe();
  }
})();
