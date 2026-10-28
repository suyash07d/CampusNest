/**
 * Shared presentation details for every authenticated administrator.
 * Authorization is always determined by the verified profile role, never by this config.
 */
export function getAdminPersonalization(profile) {
  const email = (profile?.email || '').toLowerCase().trim();
  const displayName = (profile?.full_name || (email ? email.split('@')[0] : '') || 'Administrator').trim();

  return {
    email,
    displayName,
    welcomeGreeting: `Welcome, ${displayName}!`,
    subGreeting: 'AplaStay Control Center is ready.',
    badge: 'Administrator',
    tagline: 'AplaStay Operations',
  };
}
