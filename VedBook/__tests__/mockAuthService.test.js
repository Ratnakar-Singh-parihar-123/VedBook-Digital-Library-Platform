import { mockAuthService, DEMO_CREDENTIALS } from '../src/services/mockAuthService';
import {
  getOnboardingCompleted,
  getSavedSession,
} from '../src/storage/asyncStorage';

describe('mockAuthService', () => {
  beforeEach(async () => {
    await mockAuthService.logout();
  });

  it('successfully logs in with valid demo credentials', async () => {
    const cred = DEMO_CREDENTIALS[0];
    const { session, profile } = await mockAuthService.login(cred.email, cred.password);

    expect(session).toBeDefined();
    expect(session.email).toBe(cred.email);
    expect(profile.fullName).toBe(cred.fullName);

    const onboarded = await getOnboardingCompleted();
    expect(onboarded).toBe(true);
  });

  it('rejects invalid password', async () => {
    await expect(
      mockAuthService.login('demo@vedbook.com', 'wrongpassword'),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects empty credentials', async () => {
    await expect(mockAuthService.login('', '')).rejects.toThrow(
      'Please enter both email and password',
    );
  });

  it('registers a new user and creates session', async () => {
    const newEmail = `user_${Date.now()}@test.com`;
    const { session, profile } = await mockAuthService.register({
      fullName: 'Gargi Vachaknavi',
      email: newEmail,
      password: 'SecurePassword123!',
    });

    expect(session.email).toBe(newEmail);
    expect(profile.fullName).toBe('Gargi Vachaknavi');

   */ Should be able to log in with new user credentials
    const loginRes = await mockAuthService.login(newEmail, 'SecurePassword123!');
    expect(loginRes.profile.fullName).toBe('Gargi Vachaknavi');
  });

  it('rejects registration with invalid email format', async () => {
    await expect(
      mockAuthService.register({
        fullName: 'Test User',
        email: 'invalid-email',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Please provide a valid email address');
  });

  it('rejects registration with short password', async () => {
    await expect(
      mockAuthService.register({
        fullName: 'Test User',
        email: 'valid@example.com',
        password: '123',
      }),
    ).rejects.toThrow('Password must be at least 6 characters long');
  });

  it('simulates forgot password instructions', async () => {
    const res = await mockAuthService.forgotPassword('demo@vedbook.com');
    expect(res.success).toBe(true);
    expect(res.message).toContain('demo@vedbook.com');
  });

  it('clears session on logout', async () => {
    const cred = DEMO_CREDENTIALS[0];
    await mockAuthService.login(cred.email, cred.password);
    await mockAuthService.logout();

    const session = await getSavedSession();
    expect(session).toBeNull();
  });
});
