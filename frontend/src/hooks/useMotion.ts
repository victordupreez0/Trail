import { useReducedMotion, type WithSpringConfig } from 'react-native-reanimated';

const SPRING: WithSpringConfig = { damping: 16, stiffness: 120 };

// Returns plain data (numbers, config objects), not functions that wrap
// withTiming/withSpring: those helpers are called from inside worklets (gesture
// handlers, useAnimatedStyle), and a JS function captured by closure would crash
// there unless it's itself a worklet (see the 'worklet' comment in lib/swipe.ts).
// Plain values captured by closure don't have that problem, so every animation
// site imports withTiming/withSpring directly and feeds it these.
//
// Call sites branch on `reduced` themselves (withTiming(v, {duration: 0}) instead
// of withSpring) rather than this hook trying to fake an instant spring: reanimated
// doesn't treat a zero-duration spring as a snap the way it does for withTiming.
export function useMotion() {
  const reduced = useReducedMotion();
  return {
    reduced,
    duration: {
      fast: reduced ? 0 : 200,
      normal: reduced ? 0 : 400,
      slow: reduced ? 0 : 800,
    },
    spring: SPRING,
  };
}
