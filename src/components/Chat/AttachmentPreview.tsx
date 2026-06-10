import { useState } from 'react';
import { IoClose, IoDownloadOutline, IoOpenOutline } from 'react-icons/io5';
import { AiOutlineFilePdf } from 'react-icons/ai';
import {
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkText,
  BsFileEarmarkZip,
  BsFileEarmark,
  BsFileEarmarkImage,
} from 'react-icons/bs';

interface Props {
  url: string;
  fileName?: string;
  isSender: boolean;
  isOptimistic?: boolean;
}

type FileCategory = 'image' | 'pdf' | 'word' | 'excel' | 'text' | 'zip' | 'other';

function getCategory(url: string): FileCategory {
  const clean = url.split('?')[0].toLowerCase();
  if (/\.(jpeg|jpg|gif|png|webp|svg|avif|heic)$/.test(clean) || url.startsWith('blob:')) return 'image';
  if (clean.endsWith('.pdf')) return 'pdf';
  if (/\.(doc|docx)$/.test(clean)) return 'word';
  if (/\.(xls|xlsx|csv)$/.test(clean)) return 'excel';
  if (/\.(txt|md|log|rtf)$/.test(clean)) return 'text';
  if (/\.(zip|rar|7z|tar|gz)$/.test(clean)) return 'zip';
  return 'other';
}

function getFileName(url: string): string {
  try {
    const parts = url.split('?')[0].split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'attachment';
  } catch {
    return 'attachment';
  }
}

function FileIcon({ category, size = 40 }: { category: FileCategory; size?: number }) {
  const props = { size, className: 'opacity-80' };
  switch (category) {
    case 'image':   return <BsFileEarmarkImage {...props} className="opacity-80 text-blue-400" />;
    case 'pdf':     return <AiOutlineFilePdf {...props} className="opacity-80 text-red-400" />;
    case 'word':    return <BsFileEarmarkWord {...props} className="opacity-80 text-blue-500" />;
    case 'excel':   return <BsFileEarmarkExcel {...props} className="opacity-80 text-green-500" />;
    case 'text':    return <BsFileEarmarkText {...props} className="opacity-80 text-gray-400" />;
    case 'zip':     return <BsFileEarmarkZip {...props} className="opacity-80 text-yellow-500" />;
    default:        return <BsFileEarmark {...props} className="opacity-80 text-gray-400" />;
  }
}

// Pre-send tray preview (before sending)
export function AttachmentTray({
  file,
  preview,
  onRemove,
}: {
  file: File;
  preview: string;
  onRemove: () => void;
}) {
  const category = getCategory(file.name);
  const isImage = file.type.startsWith('image/');

  return (
    <div className="absolute bottom-[4.5rem] left-4 right-4 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-xl z-20 p-3">
      <button
        className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-2 dark:hover:bg-meta-4 text-black dark:text-white transition-colors"
        onClick={onRemove}
      >
        <IoClose size={18} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-2 dark:bg-meta-4 flex items-center justify-center flex-shrink-0">
          {isImage ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <FileIcon category={category} size={28} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-black dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-bodydark mt-0.5">
            {(file.size / 1024).toFixed(1)} KB · {file.type || 'Unknown type'}
          </p>
        </div>
      </div>
    </div>
  );
}

// In-message attachment bubble
export function AttachmentBubble({ url, fileName, isSender, isOptimistic }: Props) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const category = getCategory(url);
  const displayName = fileName || getFileName(url);
  const isImage = category === 'image';

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = displayName;
    a.target = '_blank';
    a.click();
  };

  const textColor = isSender ? 'text-white/90' : 'text-black dark:text-white';
  const subColor = isSender ? 'text-white/60' : 'text-bodydark';
  const bgColor = isSender
    ? 'bg-white/10 border-white/20'
    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10';

  return (
    <>
      <div className={`rounded-xl border overflow-hidden mb-1.5 ${bgColor}`}>
        {isImage && (
          <div
            className="relative cursor-pointer group"
            onClick={() => !isOptimistic && setLightboxOpen(true)}
          >
            <img
              src={url}
              alt={displayName}
              className="max-h-52 w-full object-cover rounded-t-xl"
              style={{ display: 'block' }}
            />
            {isOptimistic && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-t-xl">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!isOptimistic && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-t-xl flex items-center justify-center">
                <IoOpenOutline size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5 px-3 py-2">
          {!isImage && (
            <div className="flex-shrink-0">
              <FileIcon category={category} size={28} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${textColor}`}>{displayName}</p>
            <p className={`text-[10px] ${subColor}`}>
              {category === 'pdf' ? 'PDF Document'
                : category === 'word' ? 'Word Document'
                : category === 'excel' ? 'Spreadsheet'
                : category === 'text' ? 'Text File'
                : category === 'zip' ? 'Archive'
                : category === 'image' ? 'Image'
                : 'File'}
            </p>
          </div>
          {!isOptimistic && (
            <button
              onClick={handleDownload}
              className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
                isSender ? 'hover:bg-white/20 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white'
              }`}
              title="Download"
            >
              <IoDownloadOutline size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox for images */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <IoClose size={24} />
          </button>
          <div className="flex flex-col items-center gap-3 max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt={displayName} className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl" />
            <div className="flex items-center gap-3">
              <p className="text-white/80 text-sm">{displayName}</p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-white bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm transition-colors"
              >
                <IoDownloadOutline size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
