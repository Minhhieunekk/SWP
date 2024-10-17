import React from 'react';
import Modal from 'react-modal';

const ImageAlertModal = ({ isOpen, onClose, message, imageUrl }) => {
  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
      <h2>Alert</h2>
      <img src={imageUrl} alt="Alert" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </Modal>
  );
};

export default ImageAlertModal;