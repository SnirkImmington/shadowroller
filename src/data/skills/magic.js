// @flow

import type { SkillMap } from '.';
import * as ALL_MAGIC_SKILLS from './magic.json';

(ALL_MAGIC_SKILLS: SkillMap);

export type MagicSkill = $Keys<typeof ALL_MAGIC_SKILLS>;

export { ALL_MAGIC_SKILLS };
