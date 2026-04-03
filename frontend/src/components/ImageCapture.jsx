import { useState, useRef } from 'react';

export default function ImageCapture({ label = 'Photo', onCapture }) {
  const [preview, setPreview] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const openCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setStream(s);
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
    } catch {
      alert('Camera not accessible. Please use gallery upload.');
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const compressImage = (file, callback) => {
    const MAX_PX = 1200;
    const QUALITY = 0.75;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
        else                { width  = Math.round(width  * MAX_PX / height); height = MAX_PX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        callback(compressed, URL.createObjectURL(blob));
      }, 'image/jpeg', QUALITY);
    };
    img.src = url;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const raw = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      compressImage(raw, (file, previewUrl) => {
        setPreview(previewUrl);
        onCapture(file);
        closeCamera();
      });
    }, 'image/jpeg', 0.92);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (compressed, previewUrl) => {
      setPreview(previewUrl);
      onCapture(compressed);
    });
  };

  const clearImage = () => {
    setPreview(null);
    onCapture(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="image-capture">
      <div className="capture-label">{label}</div>

      {!cameraOpen && !preview && (
        <div className="capture-buttons">
          <button type="button" className="capture-btn camera" onClick={openCamera}>
            📷 Open Camera
          </button>
          <button type="button" className="capture-btn gallery" onClick={() => fileRef.current.click()}>
            🖼️ Upload from Gallery
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {cameraOpen && (
        <div className="camera-view">
          <video ref={videoRef} autoPlay playsInline className="camera-feed" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-actions">
            <button type="button" className="capture-btn camera" onClick={capturePhoto}>📸 Capture</button>
            <button type="button" className="capture-btn cancel" onClick={closeCamera}>✕ Cancel</button>
          </div>
        </div>
      )}

      {preview && (
        <div className="capture-preview">
          <img src={preview} alt="Captured"
            style={{ width: '100%', height: 'auto', maxHeight: '400px',
              objectFit: 'contain', display: 'block', borderRadius: 8,
              background: '#000' }} />
          <button type="button" className="capture-btn cancel" onClick={clearImage}>🗑️ Remove Photo</button>
        </div>
      )}
    </div>
  );
}
