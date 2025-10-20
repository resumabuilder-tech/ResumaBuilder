declare module "pdfjs-dist/legacy/build/pdf" {
  export * from "pdfjs-dist/types/src/pdf";
  const pdfjs: any;
  export default pdfjs;
}

declare module "pdfjs-dist/build/pdf.worker.min.mjs?worker&url" {
  const workerSrc: string;
  export default workerSrc;
}
declare module 'pdfjs-dist/build/pdf.worker.min.mjs';
declare module 'pdfjs-dist/build/pdf.worker.min?url';