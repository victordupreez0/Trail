export type User = {
  id: string;
  displayName: string;
  initials: string;
  email: string;
  hydrationGoalMl: number;
};

export const currentUser: User = {
  id: 'me',
  displayName: 'Victor',
  initials: 'V',
  email: 'victor@example.com',
  hydrationGoalMl: 2000,
};
