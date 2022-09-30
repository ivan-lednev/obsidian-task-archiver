export const LIST_MARKER_PATTERN = /^[-*]|\d+\.\s/;
export const INDENTATION_PATTERN = /^(?: {2}|\t)*/;
export const HEADING_PATTERN = /^(#+)(\s.*)$/;

const BULLET_SIGN = `(?:[-*+]|\\d+\\.)`;
const CHECKBOX_WITH_ANY_CONTENTS = `\\[[^\\]]]`;
const CHECKBOX_CHECKED = `\\[[^\\] ]]`;
const CHECKBOX_COMPLETED = `\\[x]`;

export const STRING_WITH_SPACES_PATTERN = new RegExp(`^[ \t]+`);
export const LIST_ITEM_PATTERN = new RegExp(`^[ \t]*${BULLET_SIGN}( |\t)`);

export const DEFAULT_TASK_PATTERN = new RegExp(
    `^${BULLET_SIGN} ${CHECKBOX_WITH_ANY_CONTENTS}`
);
export const DEFAULT_COMPLETED_TASK_PATTERN = new RegExp(
    `^${BULLET_SIGN} ${CHECKBOX_COMPLETED}`
);
export const CHECKED_TASK_PATTERN = new RegExp(`${BULLET_SIGN} ${CHECKBOX_CHECKED}`);
