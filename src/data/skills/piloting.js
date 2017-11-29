// @flow

import type { SkillBase } from '.';

export type PilotingSkillInfo = SkillBase & {|
    type: "piloting"
|};

export const ALL_PILOTING_SKILLS: { [PilotingSkill]: PilotingSkillInfo }
    = import("./piloting.json");

export type PilotingSkill = $Keys<PilotingSkillInfo>;
