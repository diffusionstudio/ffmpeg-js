/**
 * Defines the available configuration extensions
 */
export interface IFFmpegConfiguration<EXT, CA, CV> {
  extensions?: EXT;
  audioCodecs?: CA;
  videoCodecs?: CV;
}
