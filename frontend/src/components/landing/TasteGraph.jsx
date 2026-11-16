import { useEffect, useRef, useState } from "react";

// Constellation 3D : chaque point est un film, regroupé par genre autour de
// l'utilisateur (au centre). Toutes les quelques secondes, 10 liens partent
// de l'utilisateur vers les films recommandés.

const GENRE_TINTS = ["#818cf8", "#a78bfa", "#f0abfc", "#fda4af", "#fcd34d", "#67e8f9"];
const REC_COUNT = 10;
const CYCLE = 3.6; // secondes par recommandation
const GROW = 0.7; // durée de tracé des liens

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dotTexture(THREE) {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function TasteGraph({ className = "" }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("./three-parts.js");
      const mount = mountRef.current;
      if (disposed || !mount) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = window.matchMedia("(max-width: 768px)").matches;
      const rand = mulberry32(7);

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.75));
      renderer.setClearColor(0x000000, 0);
      // Taille CSS fixée au conteneur : sans ça, le canvas s'affiche à sa taille en pixels
      // physiques (× devicePixelRatio), élargit sa colonne, se redimensionne, etc. (boucle infinie
      // sur les écrans mis à l'échelle : Windows 125 %, téléphones).
      Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
      mount.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 7.2);
      const root = new THREE.Group();
      scene.add(root);

      // --- Films : nuages par genre, répartis sur une sphère ---------------
      const nodeCount = small ? 150 : 240;
      const clusters = GENRE_TINTS.map((tint, i) => {
        const y = 1 - (i + 0.5) * (2 / GENRE_TINTS.length);
        const r = Math.sqrt(1 - y * y);
        const phi = i * Math.PI * (3 - Math.sqrt(5));
        return { center: new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r).multiplyScalar(2.3), tint: new THREE.Color(tint) };
      });

      const positions = new Float32Array(nodeCount * 3);
      const colors = new Float32Array(nodeCount * 3);
      const baseColors = new Float32Array(nodeCount * 3);
      const nodeCluster = new Uint8Array(nodeCount);
      const gauss = () => (rand() + rand() + rand() - 1.5) * 0.9;
      const dim = new THREE.Color("#3b3b5c");

      for (let i = 0; i < nodeCount; i++) {
        const c = i % clusters.length;
        nodeCluster[i] = c;
        const p = clusters[c].center;
        positions.set([p.x + gauss(), p.y + gauss(), p.z + gauss()], i * 3);
        const col = dim.clone().lerp(clusters[c].tint, 0.35 + rand() * 0.25);
        baseColors.set([col.r, col.g, col.b], i * 3);
      }
      colors.set(baseColors);

      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const texture = dotTexture(THREE);
      const nodeMat = new THREE.PointsMaterial({
        size: small ? 0.11 : 0.095,
        map: texture,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      root.add(new THREE.Points(nodeGeo, nodeMat));

      // --- Liens de similarité (2 voisins dans le même genre) --------------
      const edgePos = [];
      const at = (i) => new THREE.Vector3().fromArray(positions, i * 3);
      for (let i = 0; i < nodeCount; i++) {
        const pi = at(i);
        const near = [];
        for (let j = 0; j < nodeCount; j++) {
          if (j !== i && nodeCluster[j] === nodeCluster[i]) near.push([pi.distanceToSquared(at(j)), j]);
        }
        near.sort((a, b) => a[0] - b[0]);
        for (const [, j] of near.slice(0, 2)) edgePos.push(...pi.toArray(), ...at(j).toArray());
      }
      const edgeGeo = new THREE.BufferGeometry();
      edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.07, depthWrite: false });
      root.add(new THREE.LineSegments(edgeGeo, edgeMat));

      // --- Utilisateur au centre -------------------------------------------
      const userGeo = new THREE.SphereGeometry(0.09, 24, 24);
      const userMat = new THREE.MeshBasicMaterial({ color: 0xffe4e6 });
      root.add(new THREE.Mesh(userGeo, userMat));
      const haloMat = new THREE.SpriteMaterial({ map: texture, color: 0xe11d48, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.setScalar(0.9);
      root.add(halo);

      // --- Liens de recommandation -----------------------------------------
      const linkPos = new Float32Array(REC_COUNT * 6);
      const linkGeo = new THREE.BufferGeometry();
      linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3));
      const linkMat = new THREE.LineBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      root.add(new THREE.LineSegments(linkGeo, linkMat));

      const highlight = new THREE.Color("#fff1f2");
      let recs = [];
      const pickRecs = () => {
        const a = Math.floor(rand() * clusters.length);
        const b = (a + 1 + Math.floor(rand() * (clusters.length - 1))) % clusters.length;
        const pool = [];
        for (let i = 0; i < nodeCount; i++) if (nodeCluster[i] === a || nodeCluster[i] === b) pool.push(i);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        recs = pool.slice(0, REC_COUNT);
      };

      const applyRecs = (grow, glow) => {
        colors.set(baseColors);
        recs.forEach((n, k) => {
          const t = Math.min(Math.max((grow - k * 0.04) / (1 - 0.36), 0), 1);
          const e = 1 - Math.pow(1 - t, 3);
          linkPos.set([0, 0, 0, positions[n * 3] * e, positions[n * 3 + 1] * e, positions[n * 3 + 2] * e], k * 6);
          const c = new THREE.Color().fromArray(baseColors, n * 3).lerp(highlight, glow * e);
          colors.set([c.r, c.g, c.b], n * 3);
        });
        linkGeo.attributes.position.needsUpdate = true;
        nodeGeo.attributes.color.needsUpdate = true;
      };

      // --- Taille, pointeur, boucle ----------------------------------------
      const resize = () => {
        const { clientWidth: w, clientHeight: h } = mount;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        if (reduced) renderer.render(scene, camera); // image fixe : redessiner après redimensionnement
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const pointer = { x: 0, y: 0 };
      const onPointer = (e) => {
        const r = mount.getBoundingClientRect();
        pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      pickRecs();
      if (reduced) {
        root.rotation.set(0.25, -0.5, 0);
        applyRecs(1, 1);
        linkMat.opacity = 0.55;
        renderer.render(scene, camera);
      }

      let raf = 0;
      let running = false;
      let last = performance.now();
      let cycleTime = 0;
      let spin = 0;

      const frame = (now) => {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        spin += dt * 0.06;
        root.rotation.y += (spin + pointer.x * 0.35 - root.rotation.y) * 0.05;
        root.rotation.x += (0.18 + pointer.y * 0.2 - root.rotation.x) * 0.05;

        cycleTime += dt;
        if (cycleTime > CYCLE) {
          cycleTime = 0;
          pickRecs();
        }
        const grow = Math.min(cycleTime / GROW, 1);
        const fadeOut = cycleTime > CYCLE - 0.6 ? (CYCLE - cycleTime) / 0.6 : 1;
        applyRecs(grow, fadeOut);
        linkMat.opacity = 0.6 * fadeOut;
        halo.scale.setScalar(0.85 + Math.sin(now / 600) * 0.06);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };

      const start = () => {
        if (running || reduced || document.hidden) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const stop = () => {
        running = false;
        cancelAnimationFrame(raf);
      };

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? start() : stop();
      });
      io.observe(mount);
      const onVisibility = () => (document.hidden || !visible ? stop() : start());
      document.addEventListener("visibilitychange", onVisibility);
      start();

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        [nodeGeo, edgeGeo, userGeo, linkGeo].forEach((g) => g.dispose());
        [nodeMat, edgeMat, userMat, haloMat, linkMat].forEach((m) => m.dispose());
        texture.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  if (failed) {
    return (
      <div className={`${className} grid place-items-center`} aria-hidden="true">
        <div className="size-64 rounded-full bg-[radial-gradient(circle,rgb(225_29_72/0.35),rgb(67_56_202/0.15)_45%,transparent_70%)] blur-2xl" />
      </div>
    );
  }
  return <div ref={mountRef} className={className} />;
}
