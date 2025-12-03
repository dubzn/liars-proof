import "./ProcessingModal.css";

interface ProcessingModalProps {
  isOpen: boolean;
  title: string;
  message: string;
}

export const ProcessingModal = ({
  isOpen,
  title,
  message,
}: ProcessingModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="processing-modal-overlay">
      <div className="processing-modal">
        <div className="processing-modal-header">
          <h2 className="processing-modal-title">{title}</h2>
        </div>
        
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

