import { useEffect, useRef, useState } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { useMotion } from '../hooks/useMotion';

const DURATION_MS = 600;

// A plain requestAnimationFrame loop rather than driving this through reanimated:
// there's no fragility-free way to animate formatted, unit-suffixed text (e.g.
// "1.4 L") through useAnimatedProps, and a JS-thread loop is plenty smooth for a
// once-per-mount dashboard number. tabular-nums keeps the layout from jittering as
// the digit count changes mid-count.
export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  style,
}: {
  value: number;
  format?: (n: number) => string;
  // Widened past plain TextStyle so a caller (HydrationBottle) can pass an
  // animated style, e.g. a colour that crossfades as a shared value moves.
  style?: StyleProp<AnimatedStyle<TextStyle>>;
}) {
  const { reduced } = useMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const fromRef = useRef(display);

  useEffect(() => {
    if (reduced) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);

  return (
    <Animated.Text style={[{ fontVariant: ['tabular-nums'] }, style]}>
      {format(display)}
    </Animated.Text>
  );
}
