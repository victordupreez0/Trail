import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { NoteEditor } from '../src/components/NoteEditor';

const mockSave = jest.fn();

jest.mock('../src/state/AppState', () => ({
  useAppState: () => ({ updateSavedTrailNote: mockSave }),
}));

const input = () => screen.getByLabelText("Note for Lion's Head");
const editor = (note = '') => <NoteEditor trailId="a" trailName="Lion's Head" note={note} />;

beforeEach(() => {
  jest.useFakeTimers();
  mockSave.mockReset();
  mockSave.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

test('a burst of typing is saved once, with the final text', async () => {
  await render(editor());
  await fireEvent.changeText(input(), 'Bring');
  await fireEvent.changeText(input(), 'Bring water');
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(mockSave).toHaveBeenCalledWith('a', 'Bring water');
  expect(screen.getByText('Saved')).toBeTruthy();
});

test('leaving straight after typing still saves the note', async () => {
  const view = await render(editor());
  await fireEvent.changeText(input(), 'Bring water');
  expect(mockSave).not.toHaveBeenCalled();
  await view.unmount();
  expect(mockSave).toHaveBeenCalledWith('a', 'Bring water');
});

test('leaving after the save has gone does not save twice', async () => {
  const view = await render(editor());
  await fireEvent.changeText(input(), 'Bring water');
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  await view.unmount();
  expect(mockSave).toHaveBeenCalledTimes(1);
});

test('an older note arriving does not overwrite what is being typed', async () => {
  const view = await render(editor('old'));
  await fireEvent.changeText(input(), 'old and new');
  await view.rerender(editor('older snapshot'));
  expect(input().props.value).toBe('old and new');
});

test('a note arriving when nothing is being typed is shown', async () => {
  const view = await render(editor('old'));
  await view.rerender(editor('from another device'));
  expect(input().props.value).toBe('from another device');
});

test('a failed save tells the person', async () => {
  mockSave.mockRejectedValue(new Error('offline'));
  await render(editor());
  await fireEvent.changeText(input(), 'Bring water');
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  expect(screen.getByText(/Couldn't save/)).toBeTruthy();
});
