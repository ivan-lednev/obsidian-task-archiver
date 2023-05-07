export const LIST_MARKER_PATTERN = /^[-*]|\d+\.\s/;
export const INDENTATION_PATTERN = /^(?: {2}|\t)*/;
export const HEADING_PATTERN = /^(#+)(\s.*)$/;

const BULLET_SIGN = `(?:[-*+]|\\d+\\.)`;
const CHECKBOX_WITH_ANY_CONTENTS = `\\[[^\\]]]`;
const CHECKBOX_EMPTY = `\\[ ]`;
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

export const DEFAULT_INCOMPLETE_TASK_PATTERN = new RegExp(
    `^${BULLET_SIGN} ${CHECKBOX_EMPTY}`
);

export const CHECKED_TASK_PATTERN = new RegExp(`${BULLET_SIGN} ${CHECKBOX_CHECKED}`);

export const OBSIDIAN_TASKS_COMPLETED_DATE_PATTERN = /✅ (\d{4}-\d{2}-\d{2})/;

export const FILE_EXTENSION_PATTERN = /\.\w+$/;
