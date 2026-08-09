/**
 * Public legal / store / support URLs for Account settings.
 * Keep in sync with docs/RELEASE.md and product site when domains change.
 */

const SITE = 'https://masova.souravamseekar.com';

export const APP_LINKS = {
  privacyPolicy: `${SITE}/privacy`,
  termsOfService: `${SITE}/terms`,
  supportEmail: 'mailto:support@masova.com',
  /** Play Store listing (package com.masovamobile) */
  playStore: 'https://play.google.com/store/apps/details?id=com.masovamobile',
  playStoreMarket: 'market://details?id=com.masovamobile',
  website: SITE,
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

export type AppLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
