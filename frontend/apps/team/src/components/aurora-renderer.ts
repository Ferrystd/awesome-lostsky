// Original shader: layered value-noise curtains, inspired by the visual direction of React Bits Aurora.
// No React Bits source or dependency is included.
const vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0., 1.); }`
const fragmentSource = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
float folds(vec2 p) { return noise(p) * .57 + noise(p * 2.03) * .28 + noise(p * 4.07) * .15; }
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float x = uv.x * 3.6;
  float t = time * .14;
  vec3 light = vec3(0.);
  for (int layer = 0; layer < 2; layer++) {
    float l = float(layer);
    float bend = folds(vec2(x + l * 3.8 + t * .2, t + l * 2.));
    float crest = .59 + .24 * (bend - .5) + .09 * sin(x * 1.8 + t + l * 2.2) + l * .12;
    float distance = uv.y - crest;
    float rays = .45 + .55 * folds(vec2(x * 30. + bend * 8., t * .7 + l));
    float curtain = exp(-max(distance, 0.) * 6.) * smoothstep(-.012, .035, distance);
    float edge = exp(-abs(distance) * 100.);
    float halo = exp(-abs(distance) * 14.);
    vec3 color = mix(vec3(.12, 1., .62), vec3(.16, .72, 1.), smoothstep(.2, .75, uv.x + bend * .2));
    color = mix(color, vec3(.6, .38, 1.), smoothstep(.72, 1.1, uv.x + l * .14));
    light += color * (curtain * rays * .9 + edge * .6 + halo * .18) * (1. - l * .4);
  }
  light *= smoothstep(0., .16, uv.y) * (.65 + .35 * sin(uv.x * 3.14159));
  vec3 night = vec3(.0196, .0392, .075);
  gl_FragColor = vec4(night + light, 1.);
}`

export function createAuroraRenderer(canvas: HTMLCanvasElement, ready: (value: boolean) => void) {
  let gl: WebGLRenderingContext | null = null
  try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' }) } catch { /* Static fallback remains visible. */ }
  if (!gl) return { setPaused: (_paused: boolean) => {}, destroy: () => {} }
  const context = gl
  const shaders: WebGLShader[] = []
  const program = context.createProgram()
  const buffer = context.createBuffer()
  const release = () => { shaders.forEach(shader => context.deleteShader(shader)); context.deleteBuffer(buffer); context.deleteProgram(program) }
  try {
    if (!program || !buffer) throw new Error('WebGL allocation failed')
    for (const [type, source] of [[context.VERTEX_SHADER, vertexSource], [context.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = context.createShader(type)
      if (!shader) throw new Error('WebGL shader allocation failed')
      shaders.push(shader)
      context.shaderSource(shader, source); context.compileShader(shader)
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error('WebGL shader compilation failed')
      context.attachShader(program, shader)
    }
    context.linkProgram(program)
    if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error('WebGL linking failed')
    context.useProgram(program)
    context.bindBuffer(context.ARRAY_BUFFER, buffer)
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW)
    const position = context.getAttribLocation(program, 'position')
    context.enableVertexAttribArray(position); context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0)
  } catch { release(); return { setPaused: (_paused: boolean) => {}, destroy: () => {} } }

  const timeLocation = context.getUniformLocation(program!, 'time')
  const resolutionLocation = context.getUniformLocation(program!, 'resolution')
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let frame = 0, last = 0, elapsed = 8, inView = false, paused = false, disposed = false, lost = false
  const canAnimate = () => !disposed && !lost && !paused && !motion.matches && inView && !document.hidden
  let rendered = false
  const draw = () => {
    if (disposed || lost) return
    context.uniform2f(resolutionLocation, canvas.width, canvas.height)
    context.uniform1f(timeLocation, elapsed)
    context.drawArrays(context.TRIANGLES, 0, 3)
    if (!rendered) { ready(true); rendered = true }
  }
  const tick = (now: number) => {
    frame = 0
    if (!canAnimate()) return
    if (!last || now - last >= 1000 / 24) {
      elapsed += last ? Math.min((now - last) / 1000, .1) : 0
      last = now; draw()
    }
    frame = requestAnimationFrame(tick)
  }
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0; last = 0
    if (canAnimate()) frame = requestAnimationFrame(tick)
  }
  const resize = () => {
    const bounds = canvas.getBoundingClientRect()
    // A viewport-bounded decoration, never the full scroll height; at most 260k pixels.
    const scale = Math.min(devicePixelRatio || 1, bounds.width < 640 ? .85 : 1, Math.sqrt(260000 / Math.max(1, bounds.width * bounds.height)))
    canvas.width = Math.max(1, Math.round(bounds.width * scale)); canvas.height = Math.max(1, Math.round(bounds.height * scale))
    context.viewport(0, 0, canvas.width, canvas.height); draw()
  }
  const lostContext = (event: Event) => { event.preventDefault(); lost = true; ready(false); sync() }
  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync() })
  resizeObserver.observe(canvas); visibilityObserver.observe(canvas)
  document.addEventListener('visibilitychange', sync)
  motion.addEventListener('change', sync)
  canvas.addEventListener('webglcontextlost', lostContext)
  resize()
  return {
    setPaused(value: boolean) { paused = value; sync() },
    destroy() {
      disposed = true; cancelAnimationFrame(frame)
      resizeObserver.disconnect(); visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', lostContext)
      release(); context.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
