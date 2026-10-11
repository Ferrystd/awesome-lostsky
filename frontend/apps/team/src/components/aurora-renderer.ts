// Original analytic shader: two sparse, smoothly deforming liquid lights.
// No texture, noise field, or third-party shader source is included.
const vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0., 1.); }`
const fragmentSource = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float t = time * .22;
  vec3 light = vec3(0.);
  for (int layer = 0; layer < 2; layer++) {
    float l = float(layer);
    float center = .29 + l * .39 + .016 * sin(t * .7 + l * 2.);
    float x = (uv.x - center) / (.19 - l * .025);
    float taper = exp(-pow(abs(x), 4.) * 2.);
    float curve = .975 - l * .01 + .009 * sin(x * 2. + t + l * 2.) + .007 * x * x;
    float thickness = .012 + .007 * (.5 + .5 * sin(x * 2.5 - t));
    float d = (uv.y - curve) / thickness;
    float body = exp(-d * d * .65) * taper;
    float glow = exp(-d * d * .065) * taper * .14;
    float sheen = exp(-pow(d - .35, 2.) * 9.) * taper * .18;
    vec3 color = mix(vec3(.16, .94, .71), vec3(.30, .58, 1.), l);
    light += color * (body * .8 + glow) + vec3(.65, .96, 1.) * sheen;
  }
  gl_FragColor = vec4(vec3(.0196, .0392, .075) + light, 1.);
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
