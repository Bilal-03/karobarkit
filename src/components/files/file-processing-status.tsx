interface FileProcessingStatusProps {
  status: 'idle' | 'processing' | 'complete' | 'error';
  message?: string | null;
}

export function FileProcessingStatus({ status, message }: FileProcessingStatusProps) {
  if (status === 'idle') return null;
  return (
    <div
      className={`file-processing-status file-processing-status--${status}`}
      role={status === 'error' ? 'alert' : 'status'}
    >
      {message ??
        (status === 'processing'
          ? 'Processing locally…'
          : status === 'complete'
            ? 'Ready.'
            : 'We could not process that file.')}
    </div>
  );
}
