import { render } from '@testing-library/react-native';

import Home from '../app/index';

test('renders the app name', async () => {
  const { getByText } = await render(<Home />);
  expect(getByText('Trail')).toBeTruthy();
});
