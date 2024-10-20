import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useToolContext } from './tool-context';

interface ItemOverlayProps {
  item: string;
  onClose: () => void;
}

const ItemOverlay: React.FC<ItemOverlayProps> = ({ item, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toolData } = useToolContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch video URL when component mounts or when 'item' changes
  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const toolInfo = toolData.find(
          (tool) => tool.tool.toLowerCase() === item.toLowerCase()
        );
        if (!toolInfo) {
          throw new Error('Tool information not found');
        }

        const videoPath = toolInfo.last_seen;
        const storageRef = ref(storage, videoPath);

        const url = await getDownloadURL(storageRef);
        console.log('Firebase Video URL:', url);

        setVideoUrl(url);
      } catch (error) {
        console.error('Error fetching video URL:', error);
        setError('Failed to load video. Please try again later.');
      }
    };

    fetchVideoUrl();
  }, [item, toolData]);

  // Set up auto-close timer when component mounts
  useEffect(() => {
    console.log('Setting up auto-close timer');
    timerRef.current = setTimeout(() => {
      console.log('Auto-close timer triggered');
      onClose();
    }, 7000); // Close after 7 seconds

    // Clean up timer on component unmount
    return () => {
      console.log('Cleaning up timer');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onClose]); // Only depends on 'onClose'

  // Auto-play video when URL is set
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current
        .play()
        .catch((e) => {
          console.error('Error auto-playing video:', e);
          setError('Error auto-playing video. Please try playing manually.');
        });
    }
  }, [videoUrl]);

  const closeOverlay = useCallback(() => {
    console.log('Closing overlay');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-[#46B5AA] bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-[5px] w-[1216px] h-[764px] relative">
        <button
          onClick={closeOverlay}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
        <div className="mt-[42px] ml-[52px]">
          <p className="text-[32px] font-medium text-black text-opacity-50">Track Tools</p>
          <p className="text-[56px] font-medium mt-[4px]">{item}</p>
        </div>
        <div className="ml-[52px] flex justify-center mt-[20px]">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : videoUrl ? (
            <video
              ref={videoRef}
              width="700px"
              controls
              src={videoUrl}
              autoPlay
              muted // Add muted attribute to allow autoplay in most browsers
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <p>Loading video...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemOverlay;
