// Original analytic shader: continuous, gently advected color fields.
// No texture, noise field, or third-party shader source is included.
const vertexSource = `attribute vec2 position; void main() { gl_Position = vec4(position, 0., 1.); }`
const fragmentSource = `
precision mediump float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  float t = time * .09;
  vec2 p = uv - pointer * .12;
  p.x += .09 * sin(p.y * 4. + t);
  p.y += .07 * cos(p.x * 3. - t * .7);
  float green = exp(-dot((p - vec2(.14 + .08*sin(t), .58)) / vec2(.65,.52), (p - vec2(.14 + .08*sin(t), .58)) / vec2(.65,.52)));
  float blue = exp(-dot((p - vec2(.88, .24 + .1*cos(t*.8))) / vec2(.62,.56), (p - vec2(.88, .24 + .1*cos(t*.8))) / vec2(.62,.56)));
  float veil = .5 + .5*sin(p.x*4. + p.y*3. + t*.6);
  vec3 color = vec3(.031,.063,.079) + green*vec3(.012,.20,.14) + blue*vec3(.035,.11,.23) + veil*vec3(.008,.018,.023);
  gl_FragColor = vec4(color, 1.);
}`

export function createAuroraRenderer(canvas: HTMLCanvasElement, ready: (value: boolean) => void) {
  let gl: WebGLRenderingContext | null = null
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' }) } catch { /* Static fallback remains visible. */ }
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

  const pointerLocation = context.getUniformLocation(program!, 'pointer')
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let bounds = canvas.getBoundingClientRect()
  const cacheBounds = () => { bounds = canvas.getBoundingClientRect() }
  const pointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || !canAnimate()) return
    pointer.targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1))
    pointer.targetY = Math.max(-1, Math.min(1, 1 - (event.clientY - bounds.top) / Math.max(1, bounds.height) * 2))
  }
  const pointerLeave = () => { pointer.targetX = 0; pointer.targetY = 0 }
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
    context.uniform2f(pointerLocation, pointer.x, pointer.y)
    context.drawArrays(context.TRIANGLES, 0, 3)
    if (!rendered) { ready(true); rendered = true }
  }
  const tick = (now: number) => {
    frame = 0
    if (!canAnimate()) return
    if (!last || now - last >= 1000 / 24) {
      elapsed += last ? Math.min((now - last) / 1000, .1) : 0
      pointer.x += (pointer.targetX - pointer.x) * .075
      pointer.y += (pointer.targetY - pointer.y) * .075
      last = now; draw()
    }
    frame = requestAnimationFrame(tick)
  }
  const sync = () => {
    cancelAnimationFrame(frame); frame = 0; last = 0
    if (canAnimate()) frame = requestAnimationFrame(tick)
  }
  const resize = () => {
    cacheBounds()
    // A viewport-bounded decoration, never the full scroll height; at most 260k pixels.
    const scale = Math.min(devicePixelRatio || 1, bounds.width < 640 ? .85 : 1, Math.sqrt(260000 / Math.max(1, bounds.width * bounds.height)))
    canvas.width = Math.max(1, Math.round(bounds.width * scale)); canvas.height = Math.max(1, Math.round(bounds.height * scale))
    context.viewport(0, 0, canvas.width, canvas.height); draw()
  }
  const lostContext = (event: Event) => { event.preventDefault(); lost = true; ready(false); sync() }
  const resizeObserver = new ResizeObserver(resize)
  const visibilityObserver = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync() })
  resizeObserver.observe(canvas); visibilityObserver.observe(canvas)
  document.addEventListener('pointermove', pointerMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', pointerLeave)
  window.addEventListener('scroll', cacheBounds, { passive: true })
  document.addEventListener('visibilitychange', sync)
  motion.addEventListener('change', sync)
  canvas.addEventListener('webglcontextlost', lostContext)
  resize()
  return {
    setPaused(value: boolean) { paused = value; sync() },
    destroy() {
      disposed = true; cancelAnimationFrame(frame)
      resizeObserver.disconnect(); visibilityObserver.disconnect()
      document.removeEventListener('pointermove', pointerMove)
      document.documentElement.removeEventListener('pointerleave', pointerLeave)
      window.removeEventListener('scroll', cacheBounds)
      document.removeEventListener('visibilitychange', sync); motion.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', lostContext)
      release(); context.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
