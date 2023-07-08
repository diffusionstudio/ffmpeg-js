export const SUPPORTED_VIDEO_CONVERSIONS = [
  ['mp4', 'mp4'],
  ['mp4', 'avi'],
  ['mp4', 'mov'],
  ['mp4', 'wmv'],
  ['avi', 'mp4'],
  ['avi', 'avi'],
  ['avi', 'mov'],
  ['avi', 'wmv'],
  ['mov', 'mp4'],
  ['mov', 'avi'],
  ['mov', 'mov'],
  ['mov', 'wmv'],
  ['ogg', 'mp4'],
  ['ogg', 'avi'],
  ['ogg', 'mov'],
  ['ogg', 'wmv'],
  ['webm', 'mp4'],
  ['webm', 'avi'],
  ['webm', 'mov'],
  ['webm', 'wmv'],
  ['mkv', 'mp4'],
  ['mkv', 'avi'],
  ['mkv', 'mov'],
  ['mkv', 'wmv'],
  ['wmv', 'mp4'],
  ['wmv', 'avi'],
  ['wmv', 'mov'],
  ['wmv', 'wmv'],
] as const;

export const VIDEO_EXTENSIONS = [
  'mp4',
  'avi',
  'mov',
  'ogg',
  'webm',
  'wmv',
  'mkv',
] as const;