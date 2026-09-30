/**
 * Evergreen: 360° Farm Tour + image swappers
 * - Full-farm view: TRUE 360 (WebGL equirectangular sphere): drag, pinch/wheel zoom, auto-rotate, GYRO.
 *   Falls back to the flat draggable panorama if WebGL/texture is unavailable (e.g. opened from file://)
 * - Other areas: photo viewer with arrows, thumbnails, keyboard & swipe
 * - [data-images] blocks (rooms, pool, camping): arrows + dots
 */
document.addEventListener('DOMContentLoaded', () => {
  const B = 'Images/';
  const P = (f) => encodeURI(B + f);           // handles the spaces in "Full farm 360 image"
  const FARM = P('Full farm 360 image/DJI_20260927133439_0019_D.JPG');

  // ---------- AREA DATA ----------
  const AREAS = [
    { key: 'farm', label: 'Full Farm 360°', icon: 'fa-vr-cardboard', pano: true, images: [FARM],
      title: 'Full Farm Aerial 360°', desc: 'See the whole Evergreen property from above: lawn, pool, restaurant, rooms and the surrounding chikoo orchards. Drag to look around.',
      perks: ['Drag, or tilt your phone (Gyro)', 'Pinch / scroll to zoom', 'Tap Auto to rotate'], wa: 'default' },
    { key: 'lawn', label: 'Marriage Lawn', icon: 'fa-champagne-glasses', images: ['lawn/LAWN1.jpg', 'lawn/LAWN2.JPG'].map(P),
      title: 'Grand Marriage Lawn', desc: 'Open-air green lawn for weddings, receptions and big celebrations, with space for 300 to 1,500+ guests.',
      perks: ['Stage & mandap setups', 'Catering for Veg, Jain & Non-Veg', 'Ample parking'], wa: 'wedding' },
    { key: 'pool', label: 'Swimming Pool', icon: 'fa-water-ladder', images: ['1.JPEG', '2.JPEG', '3.JPEG', '4.PNG'].map(f => P('Pool/' + f)),
      title: 'Swimming Pool', desc: 'Crystal-clear pool surrounded by palms and chikoo trees, with a shallow kids zone and poolside loungers.',
      perks: ['Kids shallow zone', 'Sunbeds & towels', 'Day picnic passes'], wa: 'pool' },
    { key: 'restaurant', label: 'Restaurant', icon: 'fa-utensils', images: ['RES1.JPEG', 'RES2.JPG', 'RES3.JPG', 'RES4.JPG', 'RES5.JPG'].map(f => P('restaurant/' + f)),
      title: 'Evergreen Restaurant', desc: 'Garden dining with fresh coastal seafood, Agri specialties, pure veg and Jain dishes.',
      perks: ['Fresh daily seafood catch', 'Pure veg & Jain menu', 'Chikoo milkshake & desserts'], wa: 'restaurant' },
    { key: 'menu', label: 'Menu Card', icon: 'fa-book-open', fit: 'contain', images: [P('Menu-card/menu-card.png')],
      title: 'Restaurant Menu Card', desc: 'Browse our full menu, then reserve a table or order straight on WhatsApp.',
      perks: ['Coastal seafood', 'Agri & desi non-veg', 'Veg, Jain & chikoo desserts'], wa: 'restaurant' },
    { key: 'rooms', label: 'Rooms', icon: 'fa-bed', images: [1, 2, 3, 4, 5, 6, 7, 8].map(n => P('Room/' + n + '.JPEG')),
      title: 'Rooms & Suites', desc: 'AC, Non-AC, Double bed and Family suites with garden and orchard views.',
      perks: ['AC, Non-AC & Double bed rooms', 'Family suites for 4 to 6', 'Wi-Fi & hot water'], wa: 'default' },
    { key: 'camping', label: 'Camping', icon: 'fa-campground', images: ['camp1.jpg', 'camp2.jpg'].map(f => P('Camping/' + f)),
      title: 'Night Camping & Bonfire', desc: 'Pitch a tent on green grounds, gather around the bonfire and sleep under the stars.',
      perks: ['Tents with bedding', 'Bonfire & barbecue', 'Safe, gated grounds'], wa: 'camping' },
    { key: 'chikoo', label: 'Chikoo Farm', icon: 'fa-tree', images: [P('Chikoo-farm/b1.png')],
      title: 'Chikoo Farm Agro-Tourism', desc: 'Walk through fragrant Dahanu chikoo orchards and pick fresh fruit in season.',
      perks: ['Guided orchard walks', 'Fruit plucking', 'Buy fresh at source'], wa: 'chikoo_farm' }
  ];


  // ---------- TRUE 360 SPHERE (WebGL2, equirectangular) ----------
  const Sphere = (() => {
    const cv = document.getElementById('tourSphere');
    let gl = null, prog = null, tex = null, U = {}, ok = false, raf = 0, running = false, loadId = 0;
    const S = { yaw: 0, pitch: 0, fov: 75, auto: false, gyro: false, yawOff: 0, hasGyro: false,
      fwd: [0, 0, -1], right: [1, 0, 0], up: [0, 1, 0], vspan: Math.PI, lastEv: null };
    const D2R = Math.PI / 180;

    const VS = `#version 300 es
in vec2 p; out vec2 v; void main(){ v = p; gl_Position = vec4(p,0.,1.); }`;
    const FS = `#version 300 es
precision highp float;
in vec2 v; out vec4 o;
uniform sampler2D t; uniform vec3 R,Up,F; uniform float tanH, aspect, vspan;
const float PI = 3.14159265359;
void main(){
  vec3 d = normalize(F + R*v.x*tanH*aspect + Up*v.y*tanH);
  float lon = atan(d.x, -d.z);
  float lat = asin(clamp(d.y,-1.,1.));
  float u = 0.5 + lon/(2.*PI);
  float w = 0.5 - lat/vspan;
  if (w < 0. || w > 1.) { o = vec4(0.04,0.13,0.11,1.); return; }
  float u2 = fract(u+0.5)-0.5;
  vec2 g1 = vec2(u ,w), g2 = vec2(u2,w);
  vec2 dx = length(dFdx(g1)) <= length(dFdx(g2)) ? dFdx(g1) : dFdx(g2);
  vec2 dy = length(dFdy(g1)) <= length(dFdy(g2)) ? dFdy(g1) : dFdy(g2);
  o = vec4(textureGrad(t, g1, dx, dy).rgb, 1.);
}`;

    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };

    function init() {
      if (gl) return true;
      try {
        gl = cv.getContext('webgl2', { antialias: false, alpha: false });
        if (!gl) return false;
        prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
        gl.useProgram(prog);
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['t','R','Up','F','tanH','aspect','vspan'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
        return true;
      } catch (e) { console.warn('360 init failed', e); gl = null; return false; }
    }

    // Load image into texture. Resolves true on success, false if not possible (fallback to flat view).
    function load(src) {
      const id = ++loadId; ok = false;
      return new Promise(res => {
        if (!init()) return res(false);
        const im = new Image();
        im.onload = () => {
          if (id !== loadId) return res(false);
          try {
            const max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192);
            let source = im, w = im.naturalWidth, h = im.naturalHeight;
            if (w > max) { const c = document.createElement('canvas'); c.width = max; c.height = Math.round(h * max / w);
              c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); source = c; w = c.width; h = c.height; }
            if (tex) gl.deleteTexture(tex);
            tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, source);   // throws SecurityError on file://
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const an = gl.getExtension('EXT_texture_filter_anisotropic');
            if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
            // full sphere is 2:1. Narrower (taller) ratios cover less than 180 deg vertically.
            S.vspan = Math.min(Math.PI, (2 * Math.PI) / (w / h));
            S.yaw = 0; S.pitch = 0; S.fov = 75; S.yawOff = 0;
            ok = true; resize(); res(true);
          } catch (e) { console.warn('360 texture failed, using flat panorama', e); res(false); }
        };
        im.onerror = () => res(false);
        im.src = src;
      });
    }

    function resize() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(r.width * dpr)), h = Math.max(2, Math.round(r.height * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }

    // ----- orientation -----
    const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
    const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
    const rotY = (v, a) => [v[0]*Math.cos(a) + v[2]*Math.sin(a), v[1], -v[0]*Math.sin(a) + v[2]*Math.cos(a)];

    function basisFromAngles() {
      const cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
      S.fwd = [sy*cp, sp, -cy*cp]; S.right = [cy, 0, sy]; S.up = cross(S.right, S.fwd);
    }
    // device (alpha,beta,gamma) -> basis. Device axes: x right, y top, z out of screen. World: E,N,U -> GL (x=E,y=U,z=-N)
    function basisFromDevice(e) {
      const a = (e.alpha || 0) * D2R, b = (e.beta || 0) * D2R, g = (e.gamma || 0) * D2R;
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
      // R = Rz(a) * Rx(b) * Ry(g), columns = device axes expressed in world (E,N,U)
      const m = [
        [ca*cg - sa*sb*sg, -sa*cb, ca*sg + sa*sb*cg],
        [sa*cg + ca*sb*sg,  ca*cb, sa*sg - ca*sb*cg],
        [-cb*sg,            sb,    cb*cg]
      ];
      const dev = (v) => [m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2]];
      const gl3 = (w) => [w[0], w[2], -w[1]];
      const so = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * D2R;
      const fwd = gl3(dev([0, 0, -1])), up = gl3(dev([Math.sin(so), Math.cos(so), 0])), right = gl3(dev([Math.cos(so), -Math.sin(so), 0]));
      return { fwd, up, right };
    }
    function applyDevice() {
      if (!S.lastEv) return;
      let { fwd, up, right } = basisFromDevice(S.lastEv);
      const dev = Math.atan2(fwd[0], -fwd[2]);
      if (S.needAlign) { S.yawOff = S.yaw - dev; S.needAlign = false; }
      fwd = rotY(fwd, -S.yawOff); up = rotY(up, -S.yawOff); right = rotY(right, -S.yawOff);
      S.fwd = norm(fwd); S.up = norm(up); S.right = norm(right);
    }

    function draw() {
      if (!ok) return;
      resize();
      if (S.gyro) applyDevice(); else basisFromAngles();
      gl.viewport(0, 0, cv.width, cv.height);
      gl.useProgram(prog); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.t, 0);
      gl.uniform3fv(U.R, S.right); gl.uniform3fv(U.Up, S.up); gl.uniform3fv(U.F, S.fwd);
      gl.uniform1f(U.tanH, Math.tan(S.fov * D2R / 2)); gl.uniform1f(U.aspect, cv.width / cv.height); gl.uniform1f(U.vspan, S.vspan);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function loop() {
      if (!running) return;
      if (S.auto && !S.gyro) S.yaw += 0.0022;
      draw(); raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    // clamp helpers
    const clampPitch = () => { const lim = Math.min(Math.PI/2 - 0.02, (S.vspan / 2)); S.pitch = Math.max(-lim, Math.min(lim, S.pitch)); };
    const look = (dx, dy) => {   // dx,dy in pixels
      const k = S.fov * D2R / (cv.clientHeight || 400);
      if (S.gyro) { S.yawOff += dx * k; return; }
      S.yaw -= dx * k; S.pitch += dy * k; clampPitch();
    };
    const turn = (deg) => { if (S.gyro) S.yawOff -= deg * D2R; else S.yaw += deg * D2R; };
    const zoom = (f) => { S.fov = Math.max(30, Math.min(100, S.fov + f)); };

    // ----- gyro -----
    const onDev = (e) => {
      if (e.alpha == null && e.beta == null) return;
      S.hasGyro = true; S.lastEv = e;
    };
    async function enableGyro() {
      if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported';
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const r = await DeviceOrientationEvent.requestPermission();
          if (r !== 'granted') return 'denied';
        }
      } catch (e) { return 'denied'; }
      S.hasGyro = false; S.lastEv = null;
      const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
      S._evt = evt; window.addEventListener(evt, onDev, true);
      await new Promise(r => setTimeout(r, 900));
      if (!S.hasGyro) { window.removeEventListener(evt, onDev, true); return 'nodata'; }
      S.auto = false; S.needAlign = true; S.gyro = true;
      return 'ok';
    }
    function disableGyro() {
      if (S._evt) window.removeEventListener(S._evt, onDev, true);
      if (S.gyro && S.lastEv) { S.yaw = Math.atan2(S.fwd[0], -S.fwd[2]); S.pitch = Math.asin(Math.max(-1, Math.min(1, S.fwd[1]))); clampPitch(); }
      S.gyro = false; S.lastEv = null;
    }

    return { S, load, start, stop, look, turn, zoom, resize, enableGyro, disableGyro, isOk: () => ok,
      setAuto: (v) => { S.auto = v; }, canvas: cv };
  })();

  // ---------- TOUR ----------
  const $ = (id) => document.getElementById(id);
  const stage = $('tourStage');
  if (stage) {
    const toast = $('tourToast'); let toastT = 0;
    const say = (m) => { toast.textContent = m; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 3200); };
    const pano = $('tourPano'), panoImg = $('tourPanoImg'), photo = $('tourPhoto');
    let area = AREAS[0], idx = 0, mode = 'flat';   // mode: 'sphere' (true 360) | 'flat' (fallback)
    const st = { x: 0, y: 0, zoom: 1, nw: 0, nh: 0, auto: false, dir: -1, raf: 0 };

    // chips
    $('tourChips').innerHTML = AREAS.map(a => `<button class="tour-chip" data-key="${a.key}" role="tab"><i class="fa-solid ${a.icon}"></i> ${a.label}</button>`).join('');
    $('tourChips').addEventListener('click', e => { const b = e.target.closest('.tour-chip'); if (b) selectArea(b.dataset.key); });

    // --- panorama maths ---
    const dims = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const scale = st.zoom * Math.max(W / st.nw, H / st.nh);
      return { W, H, w: st.nw * scale, h: st.nh * scale };
    };
    const apply = () => {
      const d = dims();
      st.x = Math.min(0, Math.max(d.W - d.w, st.x));
      st.y = Math.min(0, Math.max(d.H - d.h, st.y));
      panoImg.style.width = d.w + 'px'; panoImg.style.height = d.h + 'px';
      panoImg.style.transform = `translate(${st.x}px,${st.y}px)`;
    };
    const setZoom = (z) => {
      const d0 = dims(), cx = (d0.W / 2 - st.x) / d0.w, cy = (d0.H / 2 - st.y) / d0.h;
      st.zoom = Math.min(3, Math.max(1, z));
      const d = dims(); st.x = d.W / 2 - cx * d.w; st.y = d.H / 2 - cy * d.h; apply();
    };
    const setAuto = (on) => {
      st.auto = on; $('panAuto').classList.toggle('on', on); cancelAnimationFrame(st.raf);
      if (mode === 'sphere') { Sphere.setAuto(on); return; }
      if (!on) return;
      const tick = () => {
        const d = dims(), min = d.W - d.w;
        st.x += st.dir * 0.35;
        if (st.x <= min) { st.x = min; st.dir = 1; } else if (st.x >= 0) { st.x = 0; st.dir = -1; }
        apply(); st.raf = requestAnimationFrame(tick);
      };
      st.raf = requestAnimationFrame(tick);
    };
    const nudge = (dx) => { setAuto(false); if (mode === 'sphere') { Sphere.turn(-dx / 160 * 20); return; } st.x += dx; apply(); };

    // drag (mouse + touch via pointer events)
    let drag = null;
    const pts = new Map(); let pinch0 = 0, fov0 = 75;
    pano.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, lx: e.clientX, ly: e.clientY };
      pano.classList.add('dragging'); pano.setPointerCapture(e.pointerId);
      if (!(mode === 'sphere' && Sphere.S.gyro)) setAuto(false);
      $('tourHint').classList.add('hide');
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0]-b[0], a[1]-b[1]); fov0 = Sphere.S.fov; }
    });
    pano.addEventListener('pointermove', e => {
      if (!drag) return;
      if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (mode === 'sphere') {
        if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0]-b[0], a[1]-b[1]); if (pinch0) Sphere.S.fov = Math.max(30, Math.min(100, fov0 * pinch0 / d)); return; }
        Sphere.look(e.clientX - drag.lx, e.clientY - drag.ly); drag.lx = e.clientX; drag.ly = e.clientY; return;
      }
      st.x = drag.sx + e.clientX - drag.x; st.y = drag.sy + e.clientY - drag.y; apply();
    });
    ['pointerup', 'pointercancel'].forEach(t => pano.addEventListener(t, e => { pts.delete(e.pointerId); if (!pts.size) { drag = null; pano.classList.remove('dragging'); } else { const p = [...pts.values()][0]; drag = { ...drag, lx: p[0], ly: p[1] }; } }));
    pano.addEventListener('wheel', e => { if (mode !== 'sphere') return; e.preventDefault(); Sphere.zoom(e.deltaY * 0.04); }, { passive: false });
    $('panLeft').onclick = () => nudge(160); $('panRight').onclick = () => nudge(-160);
    $('zoomIn').onclick = () => mode === 'sphere' ? Sphere.zoom(-10) : setZoom(st.zoom + 0.35);
    $('zoomOut').onclick = () => mode === 'sphere' ? Sphere.zoom(10) : setZoom(st.zoom - 0.35);
    $('panAuto').onclick = () => setAuto(!st.auto);
    window.addEventListener('resize', () => { if (mode === 'sphere') Sphere.resize(); else if (area.pano && st.nw) apply(); });

    // --- gyro ---
    const gyroBtn = $('panGyro');
    const gyroSetUI = (on) => { gyroBtn.classList.toggle('on', on); };
    gyroBtn.onclick = async () => {
      if (mode !== 'sphere') return say('Gyro needs the 360° view. Host the site (or use a local server) so the full 360° loads.');
      if (Sphere.S.gyro) { Sphere.disableGyro(); gyroSetUI(false); $('tourHintText').textContent = 'Drag to look around'; return say('Gyro off'); }
      const r = await Sphere.enableGyro();
      if (r === 'ok') { gyroSetUI(true); setAuto(false); $('tourHint').classList.remove('hide'); $('tourHintText').textContent = 'Move your phone to look around'; say('Gyro on. Move your phone around, drag to adjust.'); }
      else if (r === 'denied') say('Motion access was blocked. Allow "Motion & Orientation" in browser/site settings and try again.');
      else if (r === 'nodata') say('No motion sensor detected. Gyro works on phones/tablets over HTTPS.');
      else say('Gyro is not supported on this device.');
    };
    if (typeof DeviceOrientationEvent === 'undefined') gyroBtn.style.display = 'none';

    // --- photo viewer ---
    const show = (i) => {
      idx = (i + area.images.length) % area.images.length;
      photo.style.opacity = 0;
      const src = area.images[idx];
      setTimeout(() => { photo.src = src; photo.alt = area.title; photo.style.opacity = 1; }, 150);
      $('tourCounter').textContent = `${idx + 1} / ${area.images.length}`;
      document.querySelectorAll('#tourThumbs button').forEach((b, n) => b.classList.toggle('active', n === idx));
    };

    function selectArea(key) {
      area = AREAS.find(a => a.key === key) || AREAS[0]; idx = 0;
      setAuto(false); if (Sphere.S.gyro) { Sphere.disableGyro(); gyroSetUI(false); }
      Sphere.stop(); pano.classList.remove('sphere'); mode = 'flat';
      document.querySelectorAll('.tour-chip').forEach(c => c.classList.toggle('active', c.dataset.key === area.key));
      stage.classList.toggle('is-pano', !!area.pano);
      stage.classList.toggle('single', area.images.length < 2);
      photo.classList.toggle('contain', area.fit === 'contain');
      $('tourBadge').innerHTML = `<i class="fa-solid ${area.icon}"></i> ${area.label}`;
      $('tourIcon').innerHTML = `<i class="fa-solid ${area.icon}"></i>`;
      $('tourTitle').textContent = area.title; $('tourDesc').textContent = area.desc;
      $('tourPerks').innerHTML = area.perks.map(p => `<li><i class="fa-solid fa-circle-check"></i>${p}</li>`).join('');
      $('tourCta').onclick = () => window.inquireFeature && window.inquireFeature(area.wa);
      $('tourThumbs').innerHTML = area.images.length > 1 ? area.images.map((s, n) => `<button aria-label="Photo ${n + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join('') : '';
      if (area.pano) {
        $('tourHint').classList.remove('hide'); $('tourHintText').textContent = 'Drag to look around';
        const key0 = area.key;
        Sphere.load(area.images[0]).then(okSphere => {
          if (area.key !== key0) return;                       // user already switched area
          if (okSphere) {                                      // TRUE 360
            mode = 'sphere'; pano.classList.add('sphere'); gyroBtn.disabled = false;
            Sphere.resize(); Sphere.start(); setAuto(true);
          } else {                                             // fallback: flat panorama
            mode = 'flat'; gyroBtn.disabled = true;
            const load = () => { st.nw = panoImg.naturalWidth; st.nh = panoImg.naturalHeight; st.zoom = 1; st.x = 0; st.y = 0; apply(); setAuto(true); };
            panoImg.onload = load; panoImg.src = area.images[0]; panoImg.alt = area.title;
            if (panoImg.complete && panoImg.naturalWidth) load();
          }
        });
      } else { show(0); }
    }
    $('tourThumbs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show([...b.parentNode.children].indexOf(b)); });
    $('tourPrev').onclick = () => show(idx - 1); $('tourNext').onclick = () => show(idx + 1);
    $('tourNextArea').onclick = () => selectArea(AREAS[(AREAS.indexOf(area) + 1) % AREAS.length].key);
    $('tourFs').onclick = () => document.fullscreenElement ? document.exitFullscreen() : (stage.requestFullscreen && stage.requestFullscreen());
    document.addEventListener('fullscreenchange', () => setTimeout(() => { if (mode === 'sphere') Sphere.resize(); else if (area.pano && st.nw) apply(); }, 60));
    // pause rendering when the tour is off-screen
    if ('IntersectionObserver' in window) new IntersectionObserver(en => { if (mode !== 'sphere') return; en[0].isIntersecting ? Sphere.start() : Sphere.stop(); }).observe(stage);
    // swipe + keyboard for photos
    let sx = null;
    photo.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    photo.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1)); sx = null; });
    photo.addEventListener('click', () => window.openLightbox && window.openLightbox(area.images[idx], area.title));
    document.addEventListener('keydown', e => {
      if (!stage.matches(':hover') && document.fullscreenElement !== stage) return;
      if (area.pano) { if (e.key === 'ArrowLeft') nudge(160); if (e.key === 'ArrowRight') nudge(-160); if (mode === 'sphere') { if (e.key === 'ArrowUp') Sphere.look(0, -40); if (e.key === 'ArrowDown') Sphere.look(0, 40); } }
      else { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); }
    });

    window.openTour = (key) => { selectArea(key); $('tour360').scrollIntoView({ behavior: 'smooth' }); };
    selectArea('farm');
  }

  // ---------- IMAGE SWAPPERS (rooms / pool / camping) ----------
  document.querySelectorAll('[data-images]').forEach(box => {
    const list = box.dataset.images.split('|').map(encodeURI), img = box.querySelector('img');
    if (!img || list.length < 2) return;
    let i = 0;
    box.insertAdjacentHTML('beforeend',
      '<button class="media-nav prev" aria-label="Previous"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button class="media-nav next" aria-label="Next"><i class="fa-solid fa-chevron-right"></i></button>' +
      '<div class="media-dots">' + list.map(() => '<span></span>').join('') + '</div>');
    const dots = box.querySelectorAll('.media-dots span');
    const go = (n) => {
      i = (n + list.length) % list.length; img.style.opacity = 0;
      setTimeout(() => { img.src = list[i]; img.style.opacity = 1; }, 180);
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    dots[0].classList.add('on');
    box.querySelector('.prev').onclick = (e) => { e.stopPropagation(); go(i - 1); };
    box.querySelector('.next').onclick = (e) => { e.stopPropagation(); go(i + 1); };
    dots.forEach((d, k) => d.onclick = (e) => { e.stopPropagation(); go(k); });
    img.addEventListener('click', () => window.openLightbox && window.openLightbox(img.src, img.alt));
  });

  // restaurant photos open in the lightbox
  document.querySelectorAll('.dining-img').forEach(im => im.addEventListener('click', () => window.openLightbox && window.openLightbox(im.src, im.alt)));
});
