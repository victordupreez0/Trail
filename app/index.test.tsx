import { render } from '@testing-library/react-native';

import Home from './index';

test('renders the app name', async () => {
  const { getByText } = await render(<Home />);
  expect(getByText('Trail')).toBeTruthy();
});
