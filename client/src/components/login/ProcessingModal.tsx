import "./ProcessingModal.css";

interface ProcessingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  explanation?: string;
}

export const ProcessingModal = ({
  isOpen,
  title,
  message,
  explanation,
}: ProcessingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="processing-modal-overlay">
      <div className="processing-modal">
        <div className="processing-modal-header">
          <h2 className="processing-modal-title">{title}</h2>
        </div>

        {explanation && (
          <div className="processing-modal-explanation">
            <p className="processing-modal-explanation-text">{explanation}</p>
          </div>
        )}

        <div className="processing-modal-content">
          <div className="processing-modal-spinner">
            <div className="spinner"></div>
          </div>
          <p className="processing-modal-message">{message}</p>
        </div>
      </div>
    </div>
  );
};
