declare module 'react-signature-canvas' {
  import { Component } from 'react';

  export interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    backgroundColor?: string;
    penColor?: string;
    clearOnResize?: boolean;
    onEnd?: () => void;
    onBegin?: () => void;
  }

  export default class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear: () => void;
    isEmpty: () => boolean;
    getTrimmedCanvas: () => HTMLCanvasElement;
    fromDataURL: (dataURL: string) => void;
    toDataURL: (type?: string, encoderOptions?: number) => string;
  }
}

