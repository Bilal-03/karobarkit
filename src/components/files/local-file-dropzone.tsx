'use client';

import { useRef, useState } from 'react';

interface LocalFileDropzoneProps {
  id: string;
  accept: string;
  multiple?: boolean;
  label: string;
  help: string;
  onFiles: (files: File[]) => void;
}

export function LocalFileDropzone({
  id,
  accept,
  multiple = false,
  label,
  help,
  onFiles,
}: LocalFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function readFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFiles(Array.from(fileList));
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div
      className={`file-dropzone${isDragging ? ' file-dropzone--dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onFiles(Array.from(event.dataTransfer.files));
      }}
      aria-label={label}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(event) => readFiles(event.target.files)}
      />
      <p className="file-dropzone__label">{label}</p>
      <p className="file-dropzone__help">{help}</p>
      <button type="button" className="button button--secondary" onClick={() => inputRef.current?.click()}>
        Choose {multiple ? 'files' : 'a file'}
      </button>
    </div>
  );
}
