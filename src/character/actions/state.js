// @flow

export type ActionsState = {
    +skills: Array<number>,
    +knowledge: Array<number>
};

export const DEFAULT_ACTIONS_STATE: ActionsState = {
    skills: [],
    knowledge: []
}
