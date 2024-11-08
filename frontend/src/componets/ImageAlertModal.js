import React from 'react';
import Modal from 'react-modal';

const ImageAlertModal = ({ isOpen, onClose, message, imageUrl }) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
      <img src={imageUrl} alt="Alert" style={{ width: '100%', objectFit: 'fill' }} />
      {/* <Card.Img
          variant="top"
          src={`/images/${image}`}
          alt={name}
          className="img-fluid"
          onLoad={() => console.log("Image loaded successfully")}
          onError={() => console.log("Image URL:", image)}
      /> */}
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </Modal>
  );
};

export default ImageAlertModal;