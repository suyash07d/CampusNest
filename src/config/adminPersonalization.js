/**
 * CampusNest Admin Personalization Configuration
 * 
 * Maps verified administrator emails (whose public.profiles row has role === 'admin')
 * to custom display names, welcome messages, and badges.
 * 
 * SECURITY:
 * Authentication and authorization are strictly enforced by Supabase Auth and database
 * RLS (public.profiles.role === 'admin'). This configuration is strictly for presentation
 * and customized greetings AFTER authoritative admin verification has succeeded.
 */

export const ADMIN_PERSONALIZATION_MAP = {
  'vishalbhutekar01@gmail.com': {
    displayName: 'Vishal Bhutekar',
    welcomeGreeting: 'Welcome, Shreya Che Husband! 😂',
    subGreeting: 'CampusNest Control Center is ready.',
    badge: 'Operations Admin',
    tagline: 'Special Admin Access Granted',
    isEasterEgg: true,
  },
  'suyashdhengle540@gmail.com': {
    displayName: 'Suyash Gajanan Dhengle',
    welcomeGreeting: 'Welcome, Suyash Gajanan Dhengle!',
    subGreeting: 'CampusNest Control Center is ready.',
    badge: 'Founder & Lead Architect',
    tagline: 'Platform Founder & Lead Administrator',
    isEasterEgg: false,
  },
};

/**
 * Resolves the personalization details for an authenticated admin profile.
 * Falls back gracefully to public.profiles.full_name or "Administrator" for any other admin.
 * 
 * @param {object} profile - public.profiles row (must have role === 'admin')
 * @returns {object} personalization details
 */
export function getAdminPersonalization(profile) {
  const email = (profile?.email || '').toLowerCase().trim();
  const custom = ADMIN_PERSONALIZATION_MAP[email];

  if (custom) {
    return {
      email,
      displayName: custom.displayName,
      welcomeGreeting: custom.welcomeGreeting,
      subGreeting: custom.subGreeting,
      badge: custom.badge,
      tagline: custom.tagline,
      isEasterEgg: !!custom.isEasterEgg,
    };
  }

  // Graceful fallback for any other administrator not in the map
  const fallbackName = (profile?.full_name || (email ? email.split('@')[0] : '') || 'Administrator').trim();
  return {
    email,
    displayName: fallbackName,
    welcomeGreeting: `Welcome, ${fallbackName}!`,
    subGreeting: 'CampusNest Control Center is ready.',
    badge: 'System Administrator',
    tagline: 'CampusNest Operations',
    isEasterEgg: false,
  };
}
