declare module "face-api.js" {
  export const nets: {
    tinyFaceDetector: { loadFromUri: (uri: string) => Promise<void> };
    faceExpressionNet: { loadFromUri: (uri: string) => Promise<void> };
    faceLandmark68Net: { loadFromUri: (uri: string) => Promise<void> };
    faceRecognitionNet: { loadFromUri: (uri: string) => Promise<void> };
    ssdMobilenetv1: { loadFromUri: (uri: string) => Promise<void> };
    [key: string]: { loadFromUri: (uri: string) => Promise<void> };
  };

  export interface FaceExpressions {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
    [key: string]: number;
  }

  export interface WithFaceExpressions<T> {
    expressions: FaceExpressions;
    detection: T;
  }

  export interface FaceDetection {
    score: number;
    box: { x: number; y: number; width: number; height: number };
  }

  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }

  export function detectSingleFace(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    options?: TinyFaceDetectorOptions,
  ): {
    withFaceExpressions(): Promise<
      WithFaceExpressions<FaceDetection> | undefined
    >;
  };

  export function detectAllFaces(
    input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
    options?: TinyFaceDetectorOptions,
  ): {
    withFaceExpressions(): Promise<Array<WithFaceExpressions<FaceDetection>>>;
  };
}
