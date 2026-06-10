import React, { useState, useMemo } from 'react';
import { IoDownloadOutline, IoOpenOutline, IoClose } from 'react-icons/io5';
import { AiOutlineFilePdf, AiOutlineFileText } from 'react-icons/ai';
import {
  BsFileEarmarkWord,
  BsFileEarmarkExcel,
  BsFileEarmarkZip,
  BsFileEarmarkImage,
  BsFileEarmarkPlay,
  BsFileEarmarkMusic,
  BsFileEarmark,
} from 'react-icons/bs';

interface AttachmentBubbleProps {
  url: string;
  fileName?: string;
  isSender: boolean;
  isOptimistic?: boolean;
}

type FileCategory =
  | 'image'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'text'
  | 'zip'
  | 'video'
  | 'audio'
  | 'other';

function getCategory(url: string, fileName?: string): FileCategory {
  const name = fileName || url.split('?')[0].split('/').pop() || '';
  const clean = name.split('?')[0].toLowerCase();
  if (
    /\.(jpeg|jpg|gif|png|webp|svg|avif|heic)$/.test(clean) ||
    url.startsWith('blob:')
  )
    return 'image';
  if (clean.endsWith('.pdf')) return 'pdf';
  if (/\.(doc|docx)$/.test(clean)) return 'word';
  if (/\.(xls|xlsx|csv)$/.test(clean)) return 'excel';
  if (/\.(txt|md|log|rtf)$/.test(clean)) return 'text';
  if (/\.(zip|rar|7z|tar|gz)$/.test(clean)) return 'zip';
  if (/\.(mp4|mov|avi|mkv|webm)$/.test(clean)) return 'video';
  if (/\.(mp3|wav|ogg|aac|flac)$/.test(clean)) return 'audio';
  return 'other';
}

const FileIcon = ({
  category,
  className,
  size = 28,
}: {
  category: FileCategory;
  className?: string;
  size?: number;
}) => {
  const props = { size, className };
  switch (category) {
    case 'image':
      return <BsFileEarmarkImage {...props} />;
    case 'pdf':
      return <AiOutlineFilePdf {...props} />;
    case 'word':
      return <BsFileEarmarkWord {...props} />;
    case 'excel':
      return <BsFileEarmarkExcel {...props} />;
    case 'text':
      return <AiOutlineFileText {...props} />;
    case 'zip':
      return <BsFileEarmarkZip {...props} />;
    case 'video':
      return <BsFileEarmarkPlay {...props} />;
    case 'audio':
      return <BsFileEarmarkMusic {...props} />;
    default:
      return <BsFileEarmark {...props} />;
  }
};

export const AttachmentBubble: React.FC<AttachmentBubbleProps> = ({
  url,
  fileName,
  isSender,
  isOptimistic,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const category = useMemo(() => getCategory(url, fileName), [url, fileName]);
  const displayName = useMemo(
    () => fileName || url.split('?')[0].split('/').pop() || 'Attachment',
    [url, fileName],
  );
  const isImage = category === 'image';

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = displayName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const textColor = isSender ? 'text-white/90' : 'text-black dark:text-white';
  const subColor = isSender ? 'text-white/60' : 'text-bodydark';
  const bgColor = isSender
    ? 'bg-white/10 border-white/20'
    : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10';

  return (
    <>
      <div
        className={`rounded-xl border overflow-hidden mb-1.5 transition-all hover:shadow-md ${bgColor} ${
          isOptimistic ? 'animate-pulse' : ''
        }`}
      >
        {isImage && !isOptimistic ? (
          <div
            className="relative cursor-pointer group"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={url}
              alt={displayName}
              className="max-h-52 w-full object-cover rounded-t-xl"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <IoOpenOutline
                size={28}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"
              />
            </div>
          </div>
        ) : isImage && isOptimistic ? (
          <div className="h-40 w-full bg-gray-2 dark:bg-meta-4 flex items-center justify-center rounded-t-xl border-b border-stroke dark:border-strokedark">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}

        <div
          className={`flex items-center gap-3 px-3 py-2 ${
            isImage ? 'bg-black/5 dark:bg-white/5' : ''
          }`}
        >
          {!isImage && (
            <div className="flex-shrink-0">
              <FileIcon
                category={category}
                className={isSender ? 'text-white/80' : 'text-primary'}
              />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-2">
            <p
              className={`text-xs font-bold truncate ${textColor}`}
              title={displayName}
            >
              {displayName}
            </p>
            <p
              className={`text-[10px] uppercase font-medium tracking-tight ${subColor}`}
            >
              {category === 'pdf'
                ? 'PDF Document'
                : category === 'word'
                ? 'Word Document'
                : category === 'excel'
                ? 'Spreadsheet'
                : category === 'text'
                ? 'Text File'
                : category === 'zip'
                ? 'Archive'
                : category === 'video'
                ? 'Video'
                : category === 'audio'
                ? 'Audio'
                : category === 'image'
                ? 'Image'
                : 'File'}
            </p>
          </div>
          {!isOptimistic && (
            <button
              onClick={handleDownload}
              className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
                isSender
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white'
              }`}
              title="Download"
            >
              <IoDownloadOutline size={16} />
            </button>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-999 bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <IoClose size={32} />
          </button>
          <img
            src={url}
            alt={displayName}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="mt-4 flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
            <p className="text-white text-sm font-medium">{displayName}</p>
            <button
              onClick={() => handleDownload()}
              className="text-white hover:text-primary flex items-center gap-1 text-sm transition-colors"
            >
              <IoDownloadOutline size={18} /> Download
            </button>
          </div>
        </div>
      )}
    </>
  );
};
