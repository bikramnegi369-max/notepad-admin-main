import React from 'react';
import { IoClose } from 'react-icons/io5';

interface AttachmentTrayProps {
  file: File;
  preview: string;
  onRemove: () => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({
  file,
  preview,
  onRemove,
}) => {
  const isImage = file.type.startsWith('image/');
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="absolute bottom-[4.5rem] left-4 right-4 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-xl shadow-xl z-20 p-3 animate-fade-in-up">
      <button
        className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-2 dark:hover:bg-meta-4 text-black dark:text-white transition-colors"
        onClick={onRemove}
      >
        <IoClose size={18} />
      </button>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-2 dark:bg-meta-4 flex items-center justify-center flex-shrink-0 border border-stroke dark:border-strokedark">
          {isImage ? (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-primary font-bold text-[10px] uppercase">
              {file.name.split('.').pop()}
            </div>
          )}
        </div>
        <div className="min-w-0 pr-6">
          <p className="text-sm font-semibold text-black dark:text-white truncate">
            {file.name}
          </p>
          <p className="text-[10px] text-bodydark mt-0.5 uppercase tracking-tighter">
            {sizeInMB} MB · {file.type || 'Unknown Type'}
          </p>
        </div>
      </div>
    </div>
  );
};
