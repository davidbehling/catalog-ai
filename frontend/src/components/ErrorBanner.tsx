type ErrorBannerProps = {
  message: string;
  onClose: () => void;
};

export default function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="error-banner global-error">
      {message}
      <button onClick={onClose} aria-label="Fechar aviso">×</button>
    </div>
  );
}
