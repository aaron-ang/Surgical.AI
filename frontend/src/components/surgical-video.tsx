import React, { useState, useEffect, useRef, useCallback } from 'react';

const SurgicalVideo = () => {
  const [imageData, setImageData] = useState<string>('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connectWebSocket = useCallback(() => {
    setConnectionStatus('connecting');
    setError(null);

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    ws.current = new WebSocket(`${wsProtocol}://localhost:8080`);
    ws.current.binaryType = 'blob';

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus('connected');
      setError(null);
      reconnectAttempts.current = 0;
    };

    ws.current.onmessage = (event: MessageEvent) => {
      const data = event.data;
      
      if (typeof data === 'string') {
        if (data.startsWith('/')) {
          // This is base64-encoded image data
          setImageData(data);
        } else if (data.startsWith('[')) {
          // This is other data (e.g., metadata)
          try {
            const parsedData = JSON.parse(data);
            setMetadata(parsedData);
          } catch (err) {
            console.error('Error parsing metadata:', err);
          }
        } else {
          console.warn('Received data with unrecognized format:', data);
        }
      } else {
        console.warn('Received non-string data:', data);
      }
    };
    

    ws.current.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      setError('An error occurred with the WebSocket connection. Check console for details.');
    };

    ws.current.onclose = (event: CloseEvent) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setConnectionStatus('disconnected');

      let errorMessage = `WebSocket connection closed. Code: ${event.code}`;
      if (event.code === 1006) {
        errorMessage += '. This indicates an abnormal closure, possibly due to network issues or server problems.';
      }
      setError(errorMessage);

      // Implement exponential backoff for reconnection
      const backoffTime = Math.min(30000, Math.pow(2, reconnectAttempts.current) * 1000);
      console.log(`Attempting to reconnect in ${backoffTime / 1000} seconds...`);

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connectWebSocket();
      }, backoffTime);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (imageData) {
        URL.revokeObjectURL(imageData);
      }
    };
  }, [connectWebSocket]);

  return (
    <div className="w-full max-w-[1117px] h-[886.42px] flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow-md p-4">
      <div className="mb-4 text-lg font-semibold">
        Status: {connectionStatus}
      </div>
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
          {connectionStatus === 'disconnected' && (
            <div className="mt-2">
              Attempting to reconnect... (Attempt {reconnectAttempts.current + 1})
            </div>
          )}
        </div>
      )}
      {imageData ? (
        <img
          src={imageData}
          alt="Surgical video frame"
          className="max-w-full max-h-[70%] object-contain"
        />
      ) : (
        <div className="text-2xl text-gray-500">Waiting for video stream...</div>
      )}
      {Object.keys(metadata).length > 0 && (
        <div className="mt-4 p-4 bg-white rounded shadow w-full max-h-[20%] overflow-auto">
          <h3 className="text-lg font-semibold mb-2">Metadata:</h3>
          <pre className="text-sm">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SurgicalVideo;
