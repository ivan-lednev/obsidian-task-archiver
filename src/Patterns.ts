export const LIST_MARKER_PATTERN = /^[-*]|\d+\.\s/;
export const INDENTATION_PATTERN = /^(?: {2}|\t)*/;
export const HEADING_PATTERN = /^(#+)(\s.*)$/;

const BULLET_SIGN = `(?:[-*+]|\\d+\\.)`;
export const LIST_ITEM_PATTERN = new RegExp(`^[ \t]*${BULLET_SIGN}( |\t)`);
export const STRING_WITH_SPACES_PATTERN = new RegExp(`^[ \t]+`);
export const DEFAULT_TASK_PATTERN = `^${BULLET_SIGN} \\[[x ]]`;
export const DEFAULT_COMPLETED_TASK_PATTERN = `^${BULLET_SIGN} \\[x]`;
