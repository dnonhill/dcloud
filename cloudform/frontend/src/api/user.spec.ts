import { testStrongPassword } from './user';

describe('testStrongPassword', () => {
  it('match 4 of 4 rules', () => {
    expect(testStrongPassword('Aaz9^')).toBe(true);
  });

  it('match 3 of 4 rules', () => {
    expect(testStrongPassword('Aaz^')).toBe(true);
  });

  it('match 2 of 4 rules', () => {
    expect(testStrongPassword('AazZ')).toBe(false);
  });

  it('match 1 of 4 rules', () => {
    expect(testStrongPassword('abc')).toBe(false);
  });
});
