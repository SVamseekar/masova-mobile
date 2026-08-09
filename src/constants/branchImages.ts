/**
 * AI-generated branch hero images for Home “All branches”.
 * Mapped by storeCode / id; falls back by index for extra stores.
 */

import { ImageSourcePropType } from 'react-native';

/* eslint-disable @typescript-eslint/no-require-imports */
const BRANCH_1 = require('../../assets/branches/branch-1.jpg');
const BRANCH_2 = require('../../assets/branches/branch-2.jpg');
const BRANCH_3 = require('../../assets/branches/branch-3.jpg');

const BY_CODE: Record<string, ImageSourcePropType> = {
  DOM001: BRANCH_1,
  DOM002: BRANCH_2,
  DOM003: BRANCH_3,
};

const BY_INDEX = [BRANCH_1, BRANCH_2, BRANCH_3];

export function branchImageFor(
  storeCodeOrId?: string | null,
  index = 0
): ImageSourcePropType {
  if (storeCodeOrId) {
    const key = storeCodeOrId.toUpperCase();
    if (BY_CODE[key]) return BY_CODE[key];
    // partial match e.g. store id containing DOM001
    for (const code of Object.keys(BY_CODE)) {
      if (key.includes(code)) return BY_CODE[code];
    }
  }
  return BY_INDEX[index % BY_INDEX.length];
}
