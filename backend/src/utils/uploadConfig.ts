import multer from 'multer';

// Allowlist of file types accepted anywhere in the app (personal Files,
// connection files, order documents). Multer's `file.mimetype` is exactly
// what the client's Content-Type header claims — not a guarantee of the
// actual bytes — but rejecting anything outside this list still closes off
// the executable/HTML/SVG-script upload path a client can trivially claim
// to be an image or PDF otherwise. Combined with the Content-Disposition:
// attachment forced on every download URL, this keeps stored files from
// ever being a viable script-injection vector.
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
]);

function fileFilter(_req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
  } else {
    const error: any = new Error(`File type "${file.mimetype}" is not allowed`);
    error.statusCode = 400;
    callback(error);
  }
}

export const createFileUpload = () =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    fileFilter,
  });
