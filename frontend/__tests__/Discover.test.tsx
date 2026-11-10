import { act, fireEvent, render as baseRender, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SwipeDeck } from '../src/components/SwipeDeck';
import type { Trail } from '../src/data/trails';
import { DiscoverScreen } from '../src/screens/DiscoverScreen';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../src/lib/haptics', () => ({ haptics: { medium: jest.fn(), light: jest.fn() } }));
jest.mock('../src/hooks/useTabBarInset', () => ({ useTabBarInset: () => 0 }));
jest.mock('../src/hooks/useMotion', () => ({
  useMotion: () => ({ reduced: false, spring: {} }),
}));

// Gesture Handler 3 only recognises gestures inside its root view, which app/_layout.tsx
// provides in the app.
const render = (ui: ReactElement) => baseRender(ui, { wrapper: GestureHandlerRootView });

const trail = (id: string, name: string): Trail => ({
  id,
  name,
  difficulty: 'easy',
  distanceM: 1000,
  elevationGainM: 100,
  region: 'Test',
  description: '',
  photoUrl: '',
  photo: 1,
  location: { latitude: 0, longitude: 0 },
  path: [],
});

const trails = [trail('a', 'Alpha'), trail('b', 'Bravo'), trail('c', 'Charlie')];

const mockState = {
  savedTrailIds: [] as string[],
  savedTrailsLoading: false,
  setTrailSaved: jest.fn(),
  trails,
};

jest.mock('../src/state/AppState', () => ({ useAppState: () => mockState }));

const save = () => fireEvent.press(screen.getByLabelText('Save this trail'));
const skip = () => fireEvent.press(screen.getByLabelText('Skip this trail'));
const topCard = (name: string) => screen.getByLabelText(`${name}. Open trail details.`);

beforeEach(() => {
  mockState.savedTrailIds = [];
  mockState.savedTrailsLoading = false;
  mockState.setTrailSaved.mockReset();
  mockState.setTrailSaved.mockResolvedValue(undefined);
});

test('saving a card moves straight on to the very next trail', async () => {
  await render(<DiscoverScreen />);
  expect(topCard('Alpha')).toBeTruthy();
  await save();
  expect(mockState.setTrailSaved).toHaveBeenCalledWith('a', true);
  expect(topCard('Bravo')).toBeTruthy();
  expect(screen.getByText('2 trails left')).toBeTruthy();
});

test('skipping a card does not save it', async () => {
  await render(<DiscoverScreen />);
  await skip();
  expect(mockState.setTrailSaved).not.toHaveBeenCalled();
  expect(topCard('Bravo')).toBeTruthy();
});

test('every trail is shown once when saving and skipping in turn', async () => {
  await render(<DiscoverScreen />);
  await save();
  await skip();
  expect(topCard('Charlie')).toBeTruthy();
  await save();
  expect(screen.getByText("That's every trail")).toBeTruthy();
});

test('a failed save brings the card back and says why', async () => {
  mockState.setTrailSaved.mockRejectedValue(new Error('offline'));
  await render(<DiscoverScreen />);
  await save();
  await act(async () => {});
  expect(topCard('Alpha')).toBeTruthy();
  expect(screen.getByText(/Couldn't save Alpha/)).toBeTruthy();
});

test('skipped trails can be brought back at the end of the deck', async () => {
  await render(<DiscoverScreen />);
  await skip();
  await skip();
  await skip();
  await fireEvent.press(screen.getByLabelText('See skipped trails again'));
  expect(topCard('Alpha')).toBeTruthy();
});

test('with nothing skipped there is nothing to bring back', async () => {
  mockState.savedTrailIds = ['a', 'b', 'c'];
  await render(<DiscoverScreen />);
  expect(screen.getByText("That's every trail")).toBeTruthy();
  expect(screen.queryByLabelText('See skipped trails again')).toBeNull();
});

test('no cards appear until the saved list has loaded', async () => {
  mockState.savedTrailsLoading = true;
  await render(<DiscoverScreen />);
  expect(screen.queryByLabelText('Save this trail')).toBeNull();
});

test('the counter reads properly for the last trail', async () => {
  await render(<SwipeDeck data={[trails[0]]} onDecision={jest.fn()} onPressCard={jest.fn()} />);
  expect(screen.getByText('1 trail left')).toBeTruthy();
});
