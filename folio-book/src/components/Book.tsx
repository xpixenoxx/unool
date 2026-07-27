import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';

gsap.registerPlugin();

// Extend Three.js classes for JSX
extend({
  BoxGeometry: THREE.BoxGeometry,
  PlaneGeometry: THREE.PlaneGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  TorusGeometry: THREE.TorusGeometry,
  ConeGeometry: THREE.ConeGeometry,
});

// ============================================
// SHADER DEFINITIONS
// ============================================

// --- ADVANCED LEATHER SHADER ---
const leatherVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying vec3 vBitangent;
  attribute vec4 tangent;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * tangent.xyz);
    vBitangent = cross(vNormal, vTangent) * tangent.w;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const leatherFragmentShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying vec3 vBitangent;

  uniform float uTime;
  uniform sampler2D uLeatherNormal;
  uniform sampler2D uLeatherRoughness;
  uniform sampler2D uLeatherAlbedo;
  uniform sampler2D uFoilMask;
  uniform vec3 uCameraPos;
  uniform vec3 uLightPos;
  uniform float uFoilWear;

  const vec3 LEATHER_BASE = vec3(0.045, 0.038, 0.030);  // Deep charcoal leather
  const vec3 GOLD_FOIL = vec3(0.82, 0.68, 0.22);        // Bright antique gold
  const vec3 GOLD_FOIL_DARK = vec3(0.55, 0.42, 0.12);   // Worn gold
  const float PI = 3.14159265359;

  // GGX Distribution
  float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float denom = NdotH2 * (a2 - 1.0) + 1.0;
    return a2 / (PI * denom * denom);
  }

  // Schlick-GGX Geometry
  float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
  }

  float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
  }

  vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
  }

  // TBN Matrix from normal map
  mat3 cotangent_frame(vec3 N, vec3 p, vec2 uv) {
    vec3 dp1 = dFdx(p);
    vec3 dp2 = dFdy(p);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
    return mat3(T, B, N);
  }

  vec3 perturb_normal(mat3 TBN, vec3 mapN, float strength) {
    return normalize(TBN * mix(vec3(0.0, 0.0, 1.0), mapN, strength));
  }

  void main() {
    // Sample normal map with triplanar projection for seams
    vec3 normalMap = texture2D(uLeatherNormal, vUv * 15.0).rgb;
    vec3 normal = normalize(normalMap * 2.0 - 1.0);

    // Breathing micro-displacement
    float breathe = sin(uTime * 0.4 + vWorldPos.x * 8.0 + vWorldPos.y * 5.0) * 0.00015;
    normal += vec3(breathe);
    normal = normalize(normal);

    // TBN for anisotropic highlight on leather grain
    mat3 TBN = cotangent_frame(normal, vWorldPos, vUv);

    // Roughness with micro-variation
    float roughness = texture2D(uLeatherRoughness, vUv * 10.0).r;
    roughness += sin(uTime * 0.1 + vWorldPos.x * 12.0) * 0.02;
    roughness = clamp(roughness, 0.3, 0.95);

    // Gold foil mask with wear
    vec3 foil = texture2D(uFoilMask, vUv).rgb;
    float foilAmount = foil.r * (1.0 - uFoilWear * 0.3);

    // Base albedo with subtle color variation
    vec3 albedo = texture2D(uLeatherAlbedo, vUv * 8.0).rgb;
    albedo = mix(LEATHER_BASE, albedo, 0.7);

    // Metallic blend
    vec3 baseColor = mix(albedo, mix(GOLD_FOIL, GOLD_FOIL_DARK, uFoilWear), foilAmount * 0.9);
    float metalness = foilAmount * 0.98;
    roughness = mix(roughness, 0.03 + uFoilWear * 0.15, foilAmount * 0.95);

    // Lighting
    vec3 N = normal;
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = normalize(uLightPos - vWorldPos);
    vec3 H = normalize(V + L);

    // Anisotropic highlight along grain direction
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float NdotH = max(dot(N, H), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    // Tangent space anisotropic
    vec3 T = normalize(TBN[0]);
    float TdotH = max(dot(T, H), 0.0);

    // GGX Specular
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F0 = mix(vec3(0.03), mix(GOLD_FOIL, GOLD_FOIL_DARK, uFoilWear), metalness);
    vec3 F = FresnelSchlick(NdotV, F0);

    // Anisotropic highlight for leather grain
    float NDF_aniso = DistributionGGX(N, H, roughness * 0.3) * pow(TdotH, 256.0 * (1.0 - roughness));

    vec3 specular = (NDF + NDF_aniso * 0.3) * G * F / (4.0 * NdotV * NdotL + 0.001);
    vec3 kS = F;
    vec3 kD = (1.0 - kS) * (1.0 - metalness);
    vec3 diffuse = kD * baseColor / PI;

    // Subsurface scattering for paper-like translucency
    float ssr = max(dot(N, L) + dot(N, V), 0.0) * 0.5;
    vec3 subsurface = baseColor * ssr * 0.08 * (1.0 - metalness);

    // Rim lighting on edges
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.5);
    vec3 rimColor = mix(GOLD_FOIL_DARK, GOLD_FOIL, foilAmount) * rim * 0.15 * foilAmount;

    // Ambient occlusion from spine
    float ao = 1.0 - smoothstep(-0.1, 0.1, vWorldPos.x) * 0.25;

    vec3 color = (diffuse + specular + subsurface) * NdotL * vec3(1.0, 0.96, 0.88);
    color += rimColor;
    color *= ao;

    // Vignette for depth
    color *= 1.0 - length(vUv - 0.5) * 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// const PI = 3.14159265359;
// const TAU = PI * 2.0;

// --- PAGE VERTEX SHADER WITH REALISTIC CURL ---
const pageVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying float vCurl;
  varying vec3 vPageNormal;
  varying vec2 vUvUnwrapped;
  uniform float uCurlProgress;
  uniform float uFlutter;
  uniform float uTime;
  uniform float uPageIndex;
  uniform bool uIsTurning;
  uniform vec3 uTurnAxis;
  attribute vec3 tangent;

  const float PI = 3.14159265359;

  // Curl a plane around Y axis with paper physics
  vec3 curlPage(vec3 pos, float curl, float pageIdx) {
    if (curl <= 0.0) return pos;

    // Page thickness offset
    float thickness = pageIdx * 0.0012;  // 1.2mm per page

    // Curl parameters
    float maxAngle = PI * 0.98;
    float angle = curl * maxAngle;

    // Paper doesn't bend uniformly - it's stiffer near spine
    float stiffness = 1.0 - smoothstep(0.0, 0.3, pos.x / 1.52) * 0.4;
    float localAngle = angle * stiffness;

    // Curl center offset (spine is at x = 0)
    float centerX = -0.76;  // Half page width
    float x = pos.x - centerX;
    float z = pos.z;

    // Apply curl rotation
    float cosA = cos(localAngle);
    float sinA = sin(localAngle);

    float newX = centerX + x * cosA - z * sinA;
    float newZ = x * sinA + z * cosA;

    // Add flutter - paper vibration during turn
    float flutterAmount = sin(uTime * 25.0 + pos.y * 15.0 + pos.x * 10.0) * uFlutter * (1.0 - curl * 0.5);
    newZ += flutterAmount;

    // Add subtle gravity sag on long edge
    float sag = sin(pos.y / 2.28 * PI) * 0.003 * (1.0 - curl);
    newZ += sag;

    return vec3(newX, pos.y + thickness, newZ);
  }

  vec3 calcNormal(vec3 pos, float curl, float pageIdx) {
    float eps = 0.001;

    vec3 p = curlPage(pos, curl, pageIdx);
    vec3 px = curlPage(pos + vec3(eps, 0, 0), curl, pageIdx);
    vec3 py = curlPage(pos + vec3(0, eps, 0), curl, pageIdx);

    vec3 tangent = normalize(px - p);
    vec3 bitangent = normalize(py - p);
    return normalize(cross(tangent, bitangent));
  }

  void main() {
    vUv = uv;
    vUvUnwrapped = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

    // Tangent for anisotropic shading
    vTangent = normalize(normalMatrix * tangent.xyz);

    // Calculate curl deformation
    float curl = uCurlProgress;
    float flutter = sin(uTime * 15.0 + vWorldPos.y * 12.0) * uFlutter;

    vCurl = curl;

    if (curl > 0.0) {
      vec3 curled = curlPage(position, curl, uPageIndex);
      vWorldPos = (modelMatrix * vec4(curled, 1.0)).xyz;
      vNormal = calcNormal(position, curl, uPageIndex);
    } else {
      vNormal = normalize(normalMatrix * normal);
    }

    // Unwrapped UV for content texturing
    vPageNormal = vNormal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vWorldPos, 1.0);
  }
`;

// --- PAGE FRAGMENT SHADER ---
const paperFragmentShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vTangent;
  varying float vCurl;
  varying vec3 vPageNormal;
  varying vec2 vUvUnwrapped;

  uniform float uTime;
  uniform sampler2D uPaperFibers;
  uniform sampler2D uContentMap;
  uniform sampler2D uWatermark;
  uniform float uPageIndex;
  uniform vec3 uLightDir;
  uniform float uFlutter;
  uniform vec3 uCameraPos;

  const vec3 IVORY_BASE = vec3(0.965, 0.945, 0.915);
  const vec3 IVORY_EDGE = vec3(0.91, 0.88, 0.82);
  const vec3 IVORY_BACK = vec3(0.94, 0.91, 0.87);
  const float PI = 3.14159265359;

  float fiberNoise(vec2 uv, float scale) {
    vec3 n = texture2D(uPaperFibers, uv * scale).rgb;
    return (n.r * 0.5 + n.g * 0.3 + n.b * 0.2) * 0.025;
  }

  // Procedural edge aging
  float edgeAging(vec2 uv) {
    float edgeDist = min(uv.x, 1.0 - uv.x);
    edgeDist = min(edgeDist, min(uv.y, 1.0 - uv.y));
    return smoothstep(0.0, 0.035, edgeDist) * 0.1;
  }

  void main() {
    // Paper fiber texture
    float fibers = fiberNoise(vUv, 180.0) + fiberNoise(vUv * 2.5, 45.0) * 0.4;
    vec3 baseColor = mix(IVORY_BASE, IVORY_EDGE, fibers + edgeAging(vUv));

    // Watermark
    float mark = texture2D(uWatermark, vUv).r * 0.015;
    baseColor -= baseColor * mark;

    // Subtle aging / foxing spots
    float foxing = sin(vUv.x * 100.0 + vUv.y * 50.0) * sin(vUv.x * 73.0 + vUv.y * 120.0);
    foxing = smoothstep(0.85, 1.0, foxing) * 0.02;
    baseColor -= baseColor * foxing;

    // Content texture (would be HTML-rendered in production)
    vec4 content = texture2D(uContentMap, vUvUnwrapped);

    // Determine front/back face
    bool isBack = !gl_FrontFacing;
    vec3 N = isBack ? -vNormal : vNormal;
    float roughness = 0.82 + fibers * 0.12;

    // Lighting
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = uLightDir;
    vec3 H = normalize(V + L);

    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);

    // Anisotropic highlight along paper grain (vertical)
    float TdotH = max(dot(vTangent, H), 0.0);
    float aniso = pow(TdotH, 128.0 * (1.0 - roughness)) * 0.2 * NdotL;

    // Back-face translucency (subsurface)
    float trans = isBack ? 0.22 * NdotL : 0.0;

    // Realistic paper BRDF (Oren-Nayar diffuse + specular)
    float roughnessSq = roughness * roughness;
    float A = 1.0 - 0.5 * roughnessSq / (roughnessSq + 0.33);
    float B = 0.45 * roughnessSq / (roughnessSq + 0.09);
    float theta_r = acos(NdotV);
    float theta_i = acos(NdotL);
    float alphaTheta = max(theta_r, theta_i);
    float beta = min(theta_r, theta_i);
    float oren_nayar = A + B * max(0.0, cos(theta_r - theta_i)) * sin(alphaTheta) * tan(beta);

    // Paper specular (very low, broad)
    float paperSpec = pow(max(dot(N, H), 0.0), 8.0 / roughness) * 0.03 * NdotL;

    float lighting = (oren_nayar * NdotL + paperSpec + aniso + trans) * (1.0 - roughness * 0.25);

    // Stack shadow - pages deeper in book are darker
    float stackShadow = 1.0 - uPageIndex * 0.018;

    // Curl gradient (fold shadow)
    float curlShadow = smoothstep(0.3, 0.7, vCurl) * 0.18 * (1.0 - vUv.x);
    vec3 curlTint = isBack ? IVORY_EDGE * 0.55 : IVORY_BASE * 0.25;

    // Page edge darkening when turned
    float edgeDarken = vCurl * (1.0 - vUv.x) * 0.15;

    vec3 finalColor = (baseColor * lighting + content.rgb * 0.94) * stackShadow;
    finalColor += curlTint * curlShadow;
    finalColor -= baseColor * edgeDarken;
    finalColor += vec3(0.0015) * sin(uTime * 0.3 + vWorldPos.y * 15.0 + vWorldPos.x * 8.0);

    // Subtle caustic shimmer on turned pages
    if (vCurl > 0.5) {
      float caustic = sin(vWorldPos.x * 40.0 + uTime * 2.0) * sin(vWorldPos.y * 30.0 - uTime * 1.5);
      caustic = smoothstep(0.7, 1.0, caustic) * 0.02;
      finalColor += vec3(1.0, 0.95, 0.85) * caustic * NdotL;
    }

    float alpha = isBack ? 0.99 : 1.0;
    if (content.a < 0.01) alpha = 1.0;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- BOOK EDGE / PAGE THICKNESS SHADER ---
const edgeVertexShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uTime;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const edgeFragmentShader = /* glsl */`
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  uniform float uTime;

  const vec3 PAGE_WHITE = vec3(0.95, 0.92, 0.88);
  const vec3 PAGE_AGED = vec3(0.88, 0.83, 0.75);
  const vec3 PAGE_DARK = vec3(0.75, 0.68, 0.58);

  // 3D noise for page edges
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float f = 0.0;
    float a = 0.5;
    for(int i = 0; i < 5; i++) {
      f += a * snoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return f;
  }

  void main() {
    // Edge pattern - vertical stripes for page lines
    float pageLines = sin(vUv.y * 3200.0 + fbm(vWorldPos * 20.0 + uTime * 0.1) * 15.0) * 0.5 + 0.5;
    pageLines = smoothstep(0.4, 0.6, pageLines);

    // Aging gradient from top to bottom
    float age = smoothstep(0.0, 1.0, vUv.y);
    age = pow(age, 1.5);

    // Color variation per "page"
    float pageId = floor(vUv.x * 20.0) + fbm(vWorldPos * 5.0) * 2.0;
    pageId = fract(pageId);

    vec3 color = mix(PAGE_WHITE, PAGE_AGED, age * 0.6 + pageLines * 0.3);
    color = mix(color, PAGE_DARK, pageLines * 0.15 * age);

    // Gold leaf edge glint on some pages
    float goldEdge = sin(pageId * 50.0 + vUv.y * 100.0) * 0.5 + 0.5;
    goldEdge = smoothstep(0.95, 1.0, goldEdge);
    color = mix(color, vec3(0.75, 0.6, 0.25), goldEdge * 0.3 * age);

    // Light response
    float NdotL = max(dot(vNormal, normalize(vec3(0.5, 0.8, 0.3))), 0.0);
    color *= 0.6 + NdotL * 0.4;

    // Subtle breathing
    color += vec3(0.001) * sin(uTime * 0.2 + vWorldPos.z * 50.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// --- DUST PARTICLES ---
const dustVertexShader = /* glsl */`
  attribute float size;
  attribute vec3 customColor;
  attribute float customOpacity;
  attribute float customAngle;
  attribute float customSpeed;
  attribute float customPhase;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vAngle;
  varying float vSpeed;
  varying float vPhase;
  uniform float uTime;
  uniform float uActive;
  uniform float uDrift;
  uniform float uSize;
  void main() {
    vColor = customColor;
    vOpacity = customOpacity;
    vAngle = customAngle;
    vSpeed = customSpeed;
    vPhase = customPhase;
    vec3 pos = position;
    pos.x += sin(uTime * vSpeed + position.y * 10.0 + vPhase) * 0.02 * uActive;
    pos.y += cos(uTime * vSpeed * 0.7 + position.x * 10.0 + vPhase) * 0.015 * uActive;
    pos.z += uDrift * uTime * 0.1 * uActive;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = size * uSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const dustFragmentShader = /* glsl */`
  varying vec3 vColor;
  varying float vOpacity;
  varying float vAngle;
  varying float vSpeed;
  varying float vPhase;
  uniform float uTime;
  uniform float uActive;
  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    float alpha = (1.0 - dist * 2.0) * vOpacity * uActive;
    vec3 color = vColor;
    float shimmer = sin(uTime * 4.0 + vAngle * 15.0 + vPhase) * 0.15 + 0.85;
    float pulse = sin(uTime * 0.5 + vPhase * 10.0) * 0.05 + 1.0;
    gl_FragColor = vec4(color * shimmer * pulse, alpha);
  }
`;

// ============================================
// PROCEDURAL TEXTURE GENERATION
// ============================================

function createFiberTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size, ny = y / size;
      let v = 0;
      v += Math.sin(nx * 400 + ny * 20) * 0.4;
      v += Math.sin(nx * 100 - ny * 160) * 0.3;
      v += Math.sin(nx * 20 + ny * 400) * 0.2;
      v += Math.sin(nx * 800 + ny * 5) * 0.1;
      const val = Math.max(0, Math.min(1, (v + 1) * 0.5));
      data[i] = data[i+1] = data[i+2] = val * 255;
      data[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWatermarkTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);
  ctx.font = 'bold 80px Georgia';
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FOLIO', size/2, size/2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createLeatherNormal(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size, ny = y / size;

      // Multi-scale leather grain
      let h = 0;
      h += Math.sin(nx * 160 + ny * 80) * 0.4;
      h += Math.sin(nx * 40 - ny * 240) * 0.3;
      h += Math.sin(nx * 60 + ny * 300) * 0.2;
      h += Math.sin(nx * 800 + ny * 20) * 0.1;  // Fine pores

      // Pore clusters
      for (let p = 0; p < 3; p++) {
        let px = Math.sin(nx * 1000 + p * 100) * 0.5;
        let py = Math.sin(ny * 1000 + p * 100) * 0.5;
        h += Math.exp(-Math.pow((nx - px*0.01)*1000, 2) - Math.pow((ny - py*0.01)*1000, 2)) * 0.01;
      }

      // Convert height to normal
      const eps = 1.0 / size;
      const hx = (Math.sin((nx+eps)*160) - Math.sin((nx-eps)*160)) * 0.005;
      const hy = (Math.sin((ny+eps)*240) - Math.sin((ny-eps)*240)) * 0.005;

      data[i] = 128 + hx * 128;
      data[i+1] = 128 + hy * 128;
      data[i+2] = 255;
      data[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createLeatherRoughness(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Leather has varying roughness - pores are smoother, grain is rougher
      let val = 0.65 + Math.random() * 0.25;
      val += Math.sin(x/15 + y/15) * 0.04;
      val += Math.sin(x/50 - y/30) * 0.03;
      data[i] = data[i+1] = data[i+2] = Math.max(0.3, Math.min(0.95, val)) * 255;
      data[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createLeatherAlbedo(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const nx = x / size, ny = y / size;

      // Subtle color variation
      let r = 30 + Math.sin(nx * 80 + ny * 40) * 3 + Math.sin(nx * 20 - ny * 120) * 2;
      let g = 24 + Math.sin(nx * 40 - ny * 240) * 2 + Math.sin(nx * 150 + ny * 10) * 1.5;
      let b = 18 + Math.sin(nx * 60 + ny * 300) * 1.5 + Math.sin(nx * 800 + ny * 20) * 1;

      // Occasional darker patches (wear)
      if (Math.sin(nx * 30 + ny * 70) > 0.9 && Math.sin(nx * 10 + ny * 50) > 0.8) {
        r *= 0.7; g *= 0.7; b *= 0.7;
      }

      data[i] = Math.max(10, Math.min(80, r));
      data[i+1] = Math.max(8, Math.min(60, g));
      data[i+2] = Math.max(5, Math.min(45, b));
      data[i+3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFoilMask(type: 'cover' | 'spine'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1024, 1024);

  if (type === 'spine') {
    ctx.fillStyle = '#fff';
    // Raised bands on spine
    for (let i = 0; i < 5; i++) {
      const y = 100 + i * 170;
      ctx.fillRect(150, y, 724, 12);
    }
    // Title
    ctx.font = 'bold 42px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('FOLIO', 512, 920);
    // Author
    ctx.font = '18px Georgia';
    ctx.fillText('Alexander Chen', 512, 960);
  } else {
    ctx.fillStyle = '#fff';
    // Cover border frame
    ctx.fillRect(30, 30, 964, 6);
    ctx.fillRect(30, 30, 6, 964);
    ctx.fillRect(988, 30, 6, 964);
    ctx.fillRect(30, 988, 964, 6);
    // Center medallion
    ctx.beginPath();
    ctx.arc(512, 512, 120, 0, Math.PI * 2);
    ctx.fill();
    // Inner detail
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(512, 512, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(512, 512, 60, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// ============================================
// AUDIO ENGINE (Web Audio API - Procedural)
// ============================================

class BookAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Leather creak - deep, low frequency with slow attack
  playLeatherCreak() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Main oscillator - very low frequency for "creak"
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(45, now);
    osc1.frequency.exponentialRampToValueAtTime(28, now + 1.2);
    osc2.frequency.setValueAtTime(88, now);
    osc2.frequency.exponentialRampToValueAtTime(55, now + 1.0);

    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc1.stop(now + 1.5);
    osc2.start(now);
    osc2.stop(now + 1.5);

    // Add subtle noise burst for "stick-slip" texture
    this.playNoiseBurst(now, 0.2, 0.02);
  }

  // Paper slide/shuffle - broadband noise with envelope
  playPageTurn(intensity = 1.0) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate colored noise (pink-ish for paper)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 2500;
    filter.Q.value = 1.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06 * intensity, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    source.stop(now + 0.5);

    // Add a crisp "tick" at the start
    this.playTick(now);
  }

  private playTick(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.03);
    gain.gain.setValueAtTime(0.02, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  private playNoiseBurst(time: number, duration: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 300;
    source.buffer = buffer;
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(time);
    source.stop(time + duration);
  }

  setVolume(vol: number) {
    if (this.masterGain) this.masterGain.gain.value = vol;
  }
}

export const audioEngine = new BookAudioEngine();

// ============================================
// CONSTANTS
// ============================================

const PAGE_COUNT = 6;
const BOOK_WIDTH = 1.6;
const BOOK_HEIGHT = 2.4;
const BOOK_DEPTH = 0.12;
const SPINE_WIDTH = 0.16;
const PAGE_WIDTH = 1.52;
const PAGE_HEIGHT = 2.28;
const PAGE_THICKNESS = 0.0012; // 1.2mm per page

// ============================================
// HOOKS
// ============================================

function useTime() {
  const ref = useRef({ uTime: 0 });
  useFrame(({ clock }) => { ref.current.uTime = clock.getElapsedTime(); });
  return ref.current;
}

function useMouse() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
  return mouse;
}

// ============================================
// MATERIAL CREATION HOOKS
// ============================================

const DustMaterial = shaderMaterial(
  { uTime: 0, uActive: 0, uDrift: 0, uSize: 1 },
  dustVertexShader,
  dustFragmentShader
);

const EdgeMaterial = shaderMaterial(
  { uTime: 0 },
  edgeVertexShader,
  edgeFragmentShader
);

function useLeatherMaterials(textures: any) {
  return useMemo(() => {
    if (!textures) return { cover: null, back: null, spine: null };
    return {
      cover: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLeatherNormal: { value: textures.leatherNormal },
          uLeatherRoughness: { value: textures.leatherRoughness },
          uLeatherAlbedo: { value: textures.leatherAlbedo },
          uFoilMask: { value: textures.foilCover },
          uCameraPos: { value: new THREE.Vector3(0, 0, 3.5) },
          uLightPos: { value: new THREE.Vector3(2, 3, 2) },
          uFoilWear: { value: 0.15 },
        },
        vertexShader: leatherVertexShader,
        fragmentShader: leatherFragmentShader,
        side: THREE.FrontSide,
      }),
      back: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLeatherNormal: { value: textures.leatherNormal },
          uLeatherRoughness: { value: textures.leatherRoughness },
          uLeatherAlbedo: { value: textures.leatherAlbedo },
          uFoilMask: { value: textures.foilSpine },
          uCameraPos: { value: new THREE.Vector3(0, 0, 3.5) },
          uLightPos: { value: new THREE.Vector3(2, 3, 2) },
          uFoilWear: { value: 0.1 },
        },
        vertexShader: leatherVertexShader,
        fragmentShader: leatherFragmentShader,
        side: THREE.BackSide,
      }),
      spine: new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uLeatherNormal: { value: textures.leatherNormal },
          uLeatherRoughness: { value: textures.leatherRoughness },
          uLeatherAlbedo: { value: textures.leatherAlbedo },
          uFoilMask: { value: textures.foilSpine },
          uCameraPos: { value: new THREE.Vector3(0, 0, 3.5) },
          uLightPos: { value: new THREE.Vector3(2, 3, 2) },
          uFoilWear: { value: 0.2 },
        },
        vertexShader: leatherVertexShader,
        fragmentShader: leatherFragmentShader,
        side: THREE.FrontSide,
      }),
    };
  }, [textures]);
}

function usePageMaterial(
  textures: any,
  pageIndex: number,
  curlProgress: number,
  flutter: number,
  uTime: number,
  cameraPos: THREE.Vector3,
  lightDirInitial: THREE.Vector3,
  isTurning: boolean
) {
  return useMemo(() => {
    if (!textures) return null;
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: uTime },
        uPaperFibers: { value: textures.paperFibers },
        uContentMap: { value: textures.paperFibers },
        uWatermark: { value: textures.watermark },
        uPageIndex: { value: pageIndex },
        uCurlProgress: { value: curlProgress },
        uFlutter: { value: flutter },
        uLightDir: { value: lightDirInitial },
        uCameraPos: { value: cameraPos },
        uIsTurning: { value: isTurning },
      },
      vertexShader: pageVertexShader,
      fragmentShader: paperFragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }, [textures, pageIndex, curlProgress, flutter, uTime, cameraPos, lightDirInitial, isTurning]);
}

// ============================================
// PAGE COMPONENT WITH DRAG-TO-TURN
// ============================================

interface PageProps {
  index: number;
  textures: any;
  isOpen: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  uTime: number;
  cameraPos: THREE.Vector3;
  lightDir: React.MutableRefObject<THREE.Vector3>;
  registerPage: (index: number, api: PageAPI) => void;
  unregisterPage: (index: number) => void;
}

interface PageAPI {
  setCurl: (curl: number, immediate?: boolean) => void;
  getCurl: () => number;
  isTurning: () => boolean;
}

function Page({
  index, textures, isOpen, currentPage, onPageChange, uTime,
  cameraPos, lightDir,
  registerPage, unregisterPage
}: PageProps) {
  const ref = useRef<THREE.Mesh>(null);
  const hingeRef = useRef<THREE.Group>(null);
  const edgeRef = useRef<THREE.Mesh>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startCurl: number;
    targetCurl: number;
  }>({ active: false, startX: 0, startCurl: 0, targetCurl: 0 });

  const [curl, setCurl] = useState(0);
  const [flutter] = useState(0.003 + Math.random() * 0.003);
  const [isTurning, setIsTurning] = useState(false);
  const targetCurlRef = useRef(0);
  const springRef = useRef({ velocity: 0, current: 0 });

  const cameraRef = useRef<THREE.Camera>(null);

  // Get camera in useFrame
  useFrame(({ camera }) => {
    cameraRef.current = camera;
  });

  // Register page API
  useEffect(() => {
    const api: PageAPI = {
      setCurl: (c, immediate) => {
        targetCurlRef.current = c;
        if (immediate) {
          springRef.current.current = c;
          springRef.current.velocity = 0;
          setCurl(c);
        } else {
          setIsTurning(true);
        }
      },
      getCurl: () => curl,
      isTurning: () => isTurning,
    };
    registerPage(index, api);
    return () => unregisterPage(index);
  }, [index, registerPage, unregisterPage]);

  // Spring physics for curl
  useFrame(({ clock, camera }) => {
    const dt = Math.min(clock.getDelta(), 1/30);
    const target = targetCurlRef.current;
    const stiffness = 60;
    const damping = 12;

    let current = springRef.current.current;
    let velocity = springRef.current.velocity;

    const force = (target - current) * stiffness;
    velocity += (force - velocity * damping) * dt;
    current += velocity * dt;

    // Stop spring when settled
    if (Math.abs(target - current) < 0.002 && Math.abs(velocity) < 0.01) {
      current = target;
      velocity = 0;
      if (isTurning) setIsTurning(false);
    }

    springRef.current.current = current;
    springRef.current.velocity = velocity;
    setCurl(current);

    // Update camera/light uniforms
    if (ref.current?.material) {
      (ref.current.material as THREE.ShaderMaterial).uniforms.uCameraPos.value.copy(camera.position);
      (ref.current.material as THREE.ShaderMaterial).uniforms.uLightDir.value.copy(lightDir.current);
      (ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = uTime;
    }
  });

  // Drag to turn page - using R3F event system on the mesh directly (see onPointerDown in JSX)
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current.active) return;

    const dx = dragRef.current.startX - e.clientX;
    const dragProgress = Math.min(1, Math.max(0, dx / 300)); // 300px drag = full turn
    const newCurl = Math.max(0, Math.min(1, dragRef.current.startCurl + dragProgress));

    targetCurlRef.current = newCurl;
    springRef.current.current = newCurl;
    setCurl(newCurl);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    // Decide: complete turn or revert
    if (curl > 0.5) {
      targetCurlRef.current = 1;
      onPageChange(currentPage + 1);
    } else {
      targetCurlRef.current = 0;
    }
  }, [curl, currentPage, onPageChange]);

  // Attach global listeners
  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  if (!textures) return null;

  const pageMaterial = usePageMaterial(textures, index, curl, flutter, uTime, cameraPos, lightDir.current, isTurning);
  const edgeMat = useMemo(() => new EdgeMaterial({ uTime: 0 }), []);

  return (
    <group ref={hingeRef} position={[0, 0, (BOOK_DEPTH/2) - 0.01 - (index * PAGE_THICKNESS)]}>
      {/* Main page plane */}
      <mesh
        ref={ref}
        position={[PAGE_WIDTH/2 + 0.02, 0, 0]}
        castShadow={true}
        receiveShadow={true}
        geometry={new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, 32, 32)}
        material={pageMaterial!}
        onClick={() => isOpen && index === currentPage - 1 && onPageChange(currentPage + 1)}
        onPointerDown={(e) => {
          if (!isOpen || index !== currentPage - 1) return;
          if (!hingeRef.current) return;

          // Raycast intersection point in world space
          const point = e.point;
          if (!point) return;

          // Convert to local space of the hinge
          const localPoint = hingeRef.current.worldToLocal(point.clone());

          // Only allow drag from right 20% and bottom 30% of page
          if (localPoint.x < PAGE_WIDTH * 0.4 || localPoint.y > -PAGE_HEIGHT * 0.3) return;

          e.stopPropagation();
          dragRef.current.active = true;
          dragRef.current.startX = e.nativeEvent.clientX;
          dragRef.current.startCurl = curl;
          dragRef.current.targetCurl = curl;
          setIsTurning(true);
        }}
      />
      {/* Page edge geometry - shows thickness */}
      <mesh
        ref={edgeRef}
        position={[PAGE_WIDTH/2 + 0.02, 0, -PAGE_THICKNESS * 400 - 0.01]}
        castShadow={true}
        receiveShadow={true}
        geometry={new THREE.BoxGeometry(PAGE_THICKNESS * 800, PAGE_HEIGHT, BOOK_DEPTH * 0.8)}
        material={edgeMat}
      />
      {/* Right edge */}
      <mesh
        position={[PAGE_WIDTH + 0.04, 0, 0]}
        castShadow={true}
        receiveShadow={true}
        geometry={new THREE.BoxGeometry(PAGE_THICKNESS * 400, PAGE_HEIGHT, BOOK_DEPTH * 0.6)}
        material={edgeMat}
      />
    </group>
  );
}

// ============================================
// BOOK COMPONENT
// ============================================

interface BookProps {
  isOpen: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  cameraPosition: THREE.Vector3;
  lightPosition: React.MutableRefObject<THREE.Vector3>;
  lightDirection: React.MutableRefObject<THREE.Vector3>;
  onOpenStart: () => void;
}

export function Book({
  isOpen, currentPage, onPageChange,
  cameraPosition, lightPosition, lightDirection,
  onOpenStart
}: BookProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coverHingeRef = useRef<THREE.Group>(null);
  const { uTime } = useTime();

  const [textures, setTextures] = useState<any>(null);
  const pageApis = useRef<Map<number, PageAPI>>(new Map());

  const registerPage = useCallback((index: number, api: PageAPI) => {
    pageApis.current.set(index, api);
  }, []);

  const unregisterPage = useCallback((index: number) => {
    pageApis.current.delete(index);
  }, []);

  // Initialize textures
  useEffect(() => {
    const t = {
      leatherNormal: createLeatherNormal(),
      leatherRoughness: createLeatherRoughness(),
      leatherAlbedo: createLeatherAlbedo(),
      paperFibers: createFiberTexture(),
      watermark: createWatermarkTexture(),
      foilCover: createFoilMask('cover'),
      foilSpine: createFoilMask('spine'),
    };
    setTextures(t);
    return () => Object.values(t).forEach((tex: any) => tex.dispose());
  }, []);

  // Materials
  const leatherMaterials = useLeatherMaterials(textures);

  // Update light uniforms
  useFrame(() => {
    const lightPos = lightPosition.current;
    if (leatherMaterials.cover) {
      leatherMaterials.cover.uniforms.uCameraPos.value.copy(cameraPosition);
      leatherMaterials.cover.uniforms.uLightPos.value.copy(lightPos);
      leatherMaterials.cover.uniforms.uTime.value = uTime;
    }
    if (leatherMaterials.back) {
      leatherMaterials.back.uniforms.uCameraPos.value.copy(cameraPosition);
      leatherMaterials.back.uniforms.uLightPos.value.copy(lightPos);
      leatherMaterials.back.uniforms.uTime.value = uTime;
    }
    if (leatherMaterials.spine) {
      leatherMaterials.spine.uniforms.uCameraPos.value.copy(cameraPosition);
      leatherMaterials.spine.uniforms.uLightPos.value.copy(lightPos);
      leatherMaterials.spine.uniforms.uTime.value = uTime;
    }
  });

  // Book opening animation
  useEffect(() => {
    if (!coverHingeRef.current || !groupRef.current) return;

    if (isOpen) {
      onOpenStart();
      audioEngine.playLeatherCreak();

      const tl = gsap.timeline();
      tl.to(coverHingeRef.current.rotation, {
        y: -Math.PI * 0.98,
        duration: 1.2,
        ease: 'power3.out'
      }, 0)
      .to(groupRef.current.position, {
        x: BOOK_WIDTH / 2,
        z: 0.5,
        duration: 1.2,
        ease: 'power3.out'
      }, 0)
      .to(groupRef.current.rotation, {
        y: 0.15,
        duration: 1.2,
        ease: 'power3.out'
      }, 0);

      // Stagger page turns
      pageApis.current.forEach((api, i) => {
        if (i < currentPage - 1) {
          tl.to({ value: 0 }, {
            value: 1,
            duration: 0.7,
            ease: 'back.out(1.7)',
            onUpdate: function() { api.setCurl(this.targets()[0].value); },
            onComplete: () => { audioEngine.playPageTurn(1.0); }
          }, 0.3 + i * 0.08);
        }
      });
    } else {
      const tl = gsap.timeline();

      // Turn all pages back
      pageApis.current.forEach((api) => {
        tl.to({ value: api.getCurl() }, {
          value: 0,
          duration: 0.6,
          ease: 'power2.inOut',
          onUpdate: function() { api.setCurl(this.targets()[0].value, true); }
        }, 0);
      });

      tl.to(coverHingeRef.current.rotation, {
        y: 0,
        duration: 0.9,
        ease: 'power2.inOut'
      }, 0.2)
      .to(groupRef.current.position, {
        x: 0,
        z: 0,
        duration: 0.9,
        ease: 'power2.inOut'
      }, 0.2)
      .to(groupRef.current.rotation, {
        y: 0,
        duration: 0.9,
        ease: 'power2.inOut'
      }, 0.2);
    }
  }, [isOpen, currentPage, onOpenStart]);

  // Page turning when currentPage changes
  useEffect(() => {
    if (!isOpen) return;

    pageApis.current.forEach((api, i) => {
      const shouldBeTurned = i < currentPage - 1;
      const target = shouldBeTurned ? 1 : 0;
      if (Math.abs(api.getCurl() - target) > 0.1) {
        api.setCurl(target);
        if (shouldBeTurned && api.getCurl() < target) {
          audioEngine.playPageTurn(0.8);
        }
      }
    });
  }, [currentPage, isOpen]);

  // Idle breathing
  useFrame(() => {
    if (!groupRef.current) return;
    const t = uTime;
    groupRef.current.position.y = Math.sin(t * 0.15) * 0.015;
    groupRef.current.rotation.x = Math.sin(t * 0.11) * 0.008;
    groupRef.current.rotation.z = Math.sin(t * 0.09) * 0.004;
  });

  if (!textures) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Front Cover - attached to hinge */}
      <group ref={coverHingeRef} position={[-BOOK_WIDTH/2, 0, BOOK_DEPTH/2]}>
        <mesh position={[BOOK_WIDTH/2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
          <primitive object={leatherMaterials.cover!} attach="material" />
        </mesh>
        {/* Cover inner edge */}
        <mesh position={[BOOK_WIDTH/2, 0, -BOOK_DEPTH/2 + 0.005]} castShadow receiveShadow>
          <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, 0.01]} />
          <primitive object={leatherMaterials.cover!} attach="material" />
        </mesh>
      </group>

      {/* Back Cover */}
      <mesh position={[0, 0, -BOOK_DEPTH/2]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        <primitive object={leatherMaterials.back!} attach="material" />
      </mesh>

      {/* Spine */}
      <mesh position={[-BOOK_WIDTH/2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[SPINE_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        <primitive object={leatherMaterials.spine!} attach="material" />
      </mesh>

      {/* Page edges block - shows thickness of all pages */}
      <PageEdgesBlock isOpen={isOpen} uTime={uTime} />

      {/* Pages */}
      <group position={[-BOOK_WIDTH/2, 0, 0]}>
        {Array.from({ length: PAGE_COUNT }, (_, i) => (
          <Page
            key={i}
            index={i}
            textures={textures}
            isOpen={isOpen}
            currentPage={currentPage}
            onPageChange={onPageChange}
            uTime={uTime}
            cameraPos={cameraPosition}
            lightDir={lightDirection}
            registerPage={registerPage}
            unregisterPage={unregisterPage}
          />
        ))}
      </group>

      {/* Ribbon bookmarks */}
      <RibbonMarkers bookHeight={BOOK_HEIGHT} />
    </group>
  );
}

// ============================================
// PAGE EDGES BLOCK (shows compressed page stack)
// ============================================

interface PageEdgesBlockProps {
  isOpen: boolean;
  uTime: number;
}

function PageEdgesBlock({ isOpen, uTime }: PageEdgesBlockProps) {
  return (
    <group position={[-BOOK_WIDTH/2 + 0.02, 0, -0.01]}>
      {/* Fore-edge - the thick block of page edges */}
      <mesh
        castShadow={true}
        receiveShadow={true}
        position={[PAGE_WIDTH/2 + 0.76, 0, 0]}
        scale={[1, 1, isOpen ? 0.95 : 1]}
      >
        <boxGeometry args={[PAGE_THICKNESS * PAGE_COUNT * 800, PAGE_HEIGHT, BOOK_DEPTH * 0.9]} />
        <primitive object={new EdgeMaterial({ uTime })} attach="material" />
      </mesh>

      {/* Top edge flyleaf */}
      <mesh position={[0, BOOK_HEIGHT/2 - 0.01, 0]} castShadow={true} receiveShadow={true}>
        <boxGeometry args={[BOOK_WIDTH * 0.95, 0.02, BOOK_DEPTH]} />
        <meshStandardMaterial
          color="#F0E8D8"
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Bottom edge */}
      <mesh position={[0, -BOOK_HEIGHT/2 + 0.01, 0]} castShadow={true} receiveShadow={true}>
        <boxGeometry args={[BOOK_WIDTH * 0.95, 0.02, BOOK_DEPTH]} />
        <meshStandardMaterial
          color="#E8DFCE"
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.95}
        />
      </mesh>
    </group>
  );
}

// ============================================
// RIBBON MARKERS
// ============================================

function RibbonMarkers({ bookHeight }: { bookHeight: number }) {
  return (
    <group position={[-SPINE_WIDTH/2 - 0.015, 0, 0]}>
      {Array.from({ length: 3 }, (_, i) => {
        const y = -bookHeight/2 + 0.35 + i * 0.65;
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, 0, Math.PI/2]}>
            <mesh castShadow receiveShadow>
              <planeGeometry args={[0.01, bookHeight * 0.35]} />
              <meshStandardMaterial
                color={i === 0 ? '#C9A84C' : i === 1 ? '#E8C56D' : '#D4A540'}
                side={THREE.DoubleSide}
                transparent
                opacity={0.85}
                depthWrite={false}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
            {/* Ribbon end */}
            <mesh position={[0, bookHeight * 0.175, 0.005]} castShadow receiveShadow>
              <coneGeometry args={[0.025, 0.05, 8]} />
              <meshStandardMaterial
                color={i === 0 ? '#C9A84C' : i === 1 ? '#E8C56D' : '#D4A540'}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ============================================
// DUST SYSTEM
// ============================================

function DustSystem({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = Math.random() * 2.0 + 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta) + 0.1;
      positions[i*3+2] = r * Math.cos(phi) - 0.5;

      sizes[i] = Math.random() * 2.5 + 0.8;
      colors[i*3] = 0.85 + Math.random() * 0.1;
      colors[i*3+1] = 0.72 + Math.random() * 0.1;
      colors[i*3+2] = 0.35 + Math.random() * 0.15;
      opacities[i] = Math.random() * 0.4 + 0.08;
      angles[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('customOpacity', new THREE.BufferAttribute(opacities, 1));
    geometry.setAttribute('customAngle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('customSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('customPhase', new THREE.BufferAttribute(phases, 1));

    const material = new DustMaterial({
      uTime: 0,
      uActive: active ? 1 : 0,
      uDrift: 0.05,
      uSize: 1,
    });
    materialRef.current = material;

    pointsRef.current = new THREE.Points(geometry, material);
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [active]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uActive.value = active ? 1 : 0;
    }
  });

  return pointsRef.current ? <primitive object={pointsRef.current} /> : null;
}

// ============================================
// MAIN CANVAS COMPONENT
// ============================================

interface ViewportProps {
  isOpen: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function BookCanvas({ isOpen, currentPage, onPageChange }: ViewportProps) {
  const { camera } = useThree();
  const mouse = useMouse();
  const lightPos = useRef(new THREE.Vector3(2, 3, 2));
  const lightDir = useRef(new THREE.Vector3(0.5, 0.8, 0.3).normalize());

  // Bind light to mouse position
  useFrame(() => {
    // Smooth follow mouse
    const targetX = mouse.x * 2.5;
    const targetY = -mouse.y * 1.5 + 2;
    const targetZ = 2;

    lightPos.current.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    lightDir.current.lerp(new THREE.Vector3(-targetX, -targetY, -targetZ).normalize(), 0.05);
  });

  const onOpenStart = useCallback(() => {
    audioEngine.resume();
  }, []);

  const keyLightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.SpotLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);

  // Update light positions in render loop
  useFrame(() => {
    if (keyLightRef.current) {
      keyLightRef.current.position.lerp(lightPos.current, 0.05);
    }
    if (fillLightRef.current) {
      const targetX = -lightPos.current.x * 0.8;
      const targetY = 1.5;
      const targetZ = 1;
      fillLightRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.05);
    }
    if (rimLightRef.current) {
      rimLightRef.current.position.lerp(new THREE.Vector3(0, 2.5, -3), 0.03);
    }
  });

  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 42, near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      shadows={{ type: THREE.PCFSoftShadowMap }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={['#F5F0E8']} />
      <fog attach="fog" args={['#F5F0E8', 5, 15]} />

      {/* Dynamic lighting - follows mouse */}
      <spotLight
        ref={keyLightRef}
        position={[lightPos.current.x, lightPos.current.y, lightPos.current.z]}
        angle={0.45}
        penumbra={0.4}
        decay={2}
        intensity={1.5}
        color="#FFF8E8"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={10}
        shadow-bias={-0.0002}
      />
      <spotLight
        ref={fillLightRef}
        position={[-2.5, 1.5, 1]}
        angle={0.8}
        penumbra={1}
        decay={2}
        intensity={0.35}
        color="#FFF8E0"
      />
      <spotLight
        ref={rimLightRef}
        position={[0, 2.5, -3]}
        angle={0.2}
        penumbra={0.5}
        decay={2}
        intensity={0.5}
        color="#E8C56D"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={0.12} color="#FFF8E0" />
      <hemisphereLight groundColor="#1A1A1A" color="#FFF8E0" intensity={0.3} />

      {/* Book */}
      <Book
        isOpen={isOpen}
        currentPage={currentPage}
        onPageChange={onPageChange}
        cameraPosition={camera.position}
        lightPosition={lightPos}
        lightDirection={lightDir}
        onOpenStart={onOpenStart}
      />

      {/* Dust particles */}
      <DustSystem active={isOpen} />

      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI/2 - 0.05}
        minDistance={1.8}
        maxDistance={7}
        dampingFactor={0.06}
        enableDamping={true}
        rotateSpeed={0.4}
        zoomSpeed={0.8}
        autoRotate={!isOpen}
        autoRotateSpeed={0.15}
      />
    </Canvas>
  );
}

// ============================================
// PAGE CONTENT DATA
// ============================================

export const PAGE_CONTENTS = [
  {
    title: 'ALEXANDER CHEN',
    subtitle: 'Creative Technologist & Builder',
    stats: [
      { icon: '◆', label: '12+ Years' },
      { icon: '◆', label: '48 Shipped' },
      { icon: '◆', label: '3 Patents' },
      { icon: '◆', label: '2 Exits' },
    ],
    avatar: true,
  },
  {
    title: 'ABOUT',
    body: `I write code that feels like craft. After a decade building systems at Stripe, Figma, and Vercel, I now help founders turn vision into velocity. When not coding, you'll find me restoring a 1967 Leica M2, brewing single-origin pour-over, or reading Jung on a park bench.`,
    tags: ['Speaking', 'Writing', 'Advising'],
  },
  {
    title: 'EXPERTISE',
    skills: [
      { name: 'WebGL / Three.js', level: 95, category: 'frontend' },
      { name: 'React / R3F', level: 90, category: 'frontend' },
      { name: 'TypeScript', level: 88, category: 'frontend' },
      { name: 'Node / Go / Rust', level: 80, category: 'backend' },
      { name: 'Design Systems', level: 85, category: 'design' },
    ],
  },
  {
    title: 'SELECTED WORK',
    projects: [
      { name: 'VOID', desc: 'Design system for teams', link: 'Case Study' },
      { name: 'MERIDIAN', desc: 'Analytics platform', link: 'Case Study' },
      { name: 'AETHER', desc: 'R3F engine', link: 'GitHub' },
      { name: 'FLUX', desc: 'Motion library', link: 'npm' },
    ],
  },
  {
    title: 'JOURNEY',
    timeline: [
      { year: '2024', role: 'Founder / CTO', company: 'AETHER LABS', details: 'Raised $4.2M, team 0→18, shipped R3F engine v1.0' },
      { year: '2021', role: 'Staff Engineer', company: 'VERCEL', details: 'Next.js Core, Turborepo, RFC: Server Components' },
      { year: '2018', role: 'Senior Eng', company: 'FIGMA', details: 'Multiplayer editing engine, Plugin API v2' },
      { year: '2015', role: 'Engineer', company: 'STRIPE', details: 'Connect onboarding, Radar ML pipeline' },
    ],
  },
  {
    title: "LET'S BUILD",
    contacts: [
      { type: 'email', value: 'alex@aetherlabs.io', action: 'Copy' },
      { type: 'calendar', value: 'cal.com/alexchen', action: 'Book' },
    ],
    social: ['github', 'twitter', 'linkedin', 'email', 'mastodon'],
    note: 'Reply within 24 hours. Serious inquiries only.',
  },
];