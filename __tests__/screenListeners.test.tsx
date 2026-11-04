import { act, screen } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';

let events: string[] = [];

beforeEach(() => {
  events = [];
});

function Layout() {
  return (
    <Stack
      screenListeners={({ route }) => ({
        blur: () => events.push(`blur ${route.name}`),
        removed: () => events.push(`removed ${route.name}`),
      })}
    />
  );
}

async function renderIndex() {
  await renderRouter(
    { _layout: Layout, index: () => <Text>index</Text>, detail: () => <Text>detail</Text> },
    { initialUrl: '/' },
  );
}

it('control: screenListeners hear blur of a screen that stays in the stack', async () => {
  await renderIndex();
  await act(() => router.push('/detail'));
  expect(screen.getByText('detail')).toBeTruthy();
  expect(events).toEqual(['blur index']);
});

it('screenListeners hear removed and blur of a screen popped off the stack', async () => {
  await renderIndex();
  await act(() => router.push('/detail'));
  events = [];
  await act(() => router.back());
  expect(screen.getByText('index')).toBeTruthy();
  expect(events).toEqual(expect.arrayContaining(['blur detail', 'removed detail']));
});
