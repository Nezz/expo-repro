import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Easing, useDerivedValue, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';

const BORDER_SHADER_SOURCE = Skia.RuntimeEffect.Make(`
  uniform float  iTime;
  uniform float  intensity;
  uniform float2 iResolution;

  uniform float  uOverflow;
  uniform float  uRadius;
  uniform float  uNoiseScale;
  uniform float  uNoiseSpeed;
  uniform float  uNoiseStrength;
  uniform float  uGlowSpeed;
  uniform float  uGlowSaturation;
  uniform float  uGlowLightness;
  uniform float  uShimmerAmount;
  uniform float  uShimmerSpeed;

  uniform int    uColorCount;
  uniform float4 uColor0;
  uniform float4 uColor1;
  uniform float4 uColor2;
  uniform float4 uColor3;
  uniform float4 uColor4;
  uniform float4 uColor5;
  uniform float4 uColor6;
  uniform float4 uColor7;

  float3 hash33(float3 p3) {
    p3 = fract(p3 * float3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(float3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
  }

  float snoise3(float3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    float3 i  = floor(p + (p.x + p.y + p.z) * K1);
    float3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    float3 e  = step(float3(0.0), d0 - d0.yzx);
    float3 i1 = e * (1.0 - e.zxy);
    float3 i2 = 1.0 - e.zxy * (1.0 - e);
    float3 d1 = d0 - (i1 - K2);
    float3 d2 = d0 - (i2 - K1);
    float3 d3 = d0 - 0.5;
    float4 h = max(0.6 - float4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
    float4 n = h * h * h * h * float4(
      dot(d0, hash33(i)), dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
    return dot(float4(31.316), n);
  }

  float3 hsl2rgb(float h, float s, float l) {
    float3 rgb = clamp(abs(mod(h * 6.0 + float3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  float4 getColor(int idx) {
    if (idx == 0) return uColor0;
    if (idx == 1) return uColor1;
    if (idx == 2) return uColor2;
    if (idx == 3) return uColor3;
    if (idx == 4) return uColor4;
    if (idx == 5) return uColor5;
    if (idx == 6) return uColor6;
    return uColor7;
  }

  float4 sampleGradient(float t) {
    float ft = fract(t) * float(uColorCount);
    int i0 = int(floor(ft));
    int i1 = i0 + 1;
    if (i1 >= uColorCount) i1 = 0;
    float f = fract(ft);
    f = f * f * (3.0 - 2.0 * f);
    return mix(getColor(i0), getColor(i1), f);
  }

  half4 main(float2 fragCoord) {
    float2 uv = fragCoord / iResolution;

    float2 center = iResolution * 0.5;
    float2 halfSize = center - uOverflow;
    float r = min(uRadius, min(halfSize.x, halfSize.y));
    float2 q = abs(fragCoord - center) - halfSize + r;
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    float vol   = 0.35 + 0.15 * sin(iTime * 2.0);
    float noise = max(0.0, snoise3(float3(uv * uNoiseScale, iTime / uNoiseSpeed)) * (vol * uNoiseStrength));

    float noisyDist = abs(dist) - noise * uOverflow * 0.4;
    float alpha = smoothstep(uOverflow, 0.0, noisyDist);

    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float t     = fract((angle / 6.2832) - iTime * uGlowSpeed);

    float4 glowColor;
    if (uColorCount > 0) {
      glowColor = sampleGradient(t);
    } else {
      glowColor = float4(hsl2rgb(t, uGlowSaturation, uGlowLightness), 1.0);
    }

    float3 glow = glowColor.rgb;
    float shimmer = 0.5 + 0.5 * sin(angle * 3.0 + iTime * uShimmerSpeed);
    glow = mix(glow, glow * 1.4, shimmer * uShimmerAmount);

    float a = alpha * intensity * glowColor.a;
    return half4(half3(glow) * a, a);
  }
`)!;

type RGBA = [number, number, number, number];
const ZERO4: RGBA = [0, 0, 0, 0];

function hexToRgba(hex: string): RGBA {
  let h = hex.replace('#', '');
  if (h.length <= 4)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const hasAlpha = h.length === 8;
  const n = parseInt(hasAlpha ? h.slice(0, 6) : h, 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255, a];
}

const OVERFLOW = 8;

interface GlowBorderProps {
  children: React.ReactNode;
  colors: string[];
  borderRadius?: number;
}

export function GlowBorder({ children, colors, borderRadius = 16 }: GlowBorderProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const canvasWidth = layout.width + OVERFLOW * 2;
  const canvasHeight = layout.height + OVERFLOW * 2;

  const colorRgbas = colors.map(hexToRgba);

  const iTime = useSharedValue(0);
  const intensity = useSharedValue(1);

  useFrameCallback((frameInfo) => {
    iTime.value = frameInfo.timeSinceFirstFrame / 1000;
  });

  const animateIntensity = useCallback(
    (focused: boolean) => {
      intensity.value = withTiming(focused ? 1 : 0, { duration: focused ? 600 : 400, easing: Easing.out(Easing.quad) });
    },
    [intensity],
  );

  void animateIntensity; // exported for future use

  const uniforms = useDerivedValue(() => ({
    iTime: iTime.value,
    intensity: intensity.value,
    iResolution: [canvasWidth, canvasHeight],
    uOverflow: OVERFLOW,
    uRadius: borderRadius,
    uNoiseScale: 2.0,
    uNoiseSpeed: 4.0,
    uNoiseStrength: 0.6,
    uGlowSpeed: 0.12,
    uGlowSaturation: 1.0,
    uGlowLightness: 0.65,
    uShimmerAmount: 0.3,
    uShimmerSpeed: 2.5,
    uColorCount: colorRgbas.length,
    uColor0: colorRgbas[0] ?? ZERO4,
    uColor1: colorRgbas[1] ?? ZERO4,
    uColor2: colorRgbas[2] ?? ZERO4,
    uColor3: colorRgbas[3] ?? ZERO4,
    uColor4: colorRgbas[4] ?? ZERO4,
    uColor5: colorRgbas[5] ?? ZERO4,
    uColor6: ZERO4,
    uColor7: ZERO4,
  }));

  return (
    <View
      style={{ overflow: 'visible' }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {layout.width > 0 && (
        <Canvas
          style={{ position: 'absolute', top: -OVERFLOW, left: -OVERFLOW, width: canvasWidth, height: canvasHeight }}
          pointerEvents="none"
        >
          <Fill>
            <Shader source={BORDER_SHADER_SOURCE} uniforms={uniforms} />
          </Fill>
        </Canvas>
      )}
      {children}
    </View>
  );
}
