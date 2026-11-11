export function AlertIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M11 4h2v12h-2V4zm0 14h2v2h-2v-2z" />
    </svg>
  );
}

export function CheckIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M9.3 16.3 5.7 12.7l-1.4 1.4 5 5 11-11-1.4-1.4z"
      />
    </svg>
  );
}

export function QuestionIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M9 8.2C9 6.4 10.4 5 12.3 5 14.1 5 15.5 6.3 15.5 8c0 1.4-.7 2.2-1.8 3.1-.9.8-1.7 1.4-1.7 2.6v.3h2v-.3c0-.6.4-1.1 1.5-2 1.3-1 2.5-2.1 2.5-4.1C18 5.3 15.5 3 12.3 3 8.9 3 7 5.2 7 8.2h2zM11 17h2v2h-2v-2z"
      />
    </svg>
  );
}

export function InfoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
      />
    </svg>
  );
}

export function FlagIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3.2 2.6 20.4h18.8L12 3.2zm0 5.3c.5 0 .9.4.9.9v4.2a.9.9 0 1 1-1.8 0V9.4c0-.5.4-.9.9-.9zm0 8.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"
      />
    </svg>
  );
}

export function StatusGlyph({ status }) {
  if (status === 'caution') return <AlertIcon />;
  if (status === 'lower_concern') return <CheckIcon />;
  return <QuestionIcon />;
}
