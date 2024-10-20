import React, { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface ItemOverlayProps {
  item: string;
  onClose: () => void;
}

const ItemOverlay: React.FC<ItemOverlayProps> = ({ item, onClose }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        // Construct the video path based on the item name or other logic
        const videoPath = `user_2iFQWfYJvmOcAQadPmvO4YGv2x5_1719130723552.mp4`; // Adjust accordingly
        const videoRef = ref(storage, videoPath);

        // Get the download URL
        const url = await getDownloadURL(videoRef);
        console.log('Firebase Video URL:', url);

        // Set the video URL state
        setVideoUrl(url);
      } catch (error) {
        console.error('Error fetching video URL:', error);
        setError('Failed to load video. Please try again later.');
      }
    };

    fetchVideoUrl();
  }, [item]);

  return (
    <div className="fixed inset-0 bg-[#46B5AA] bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-[5px] w-[1216px] h-[764px] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
        <div className="mt-[42px] ml-[52px]">
          <p className="text-[32px] font-medium text-black text-opacity-50">Track Tools</p>
          <p className="text-[56px] font-medium mt-[4px]">{item}</p>
        </div>
        <div className="ml-[52px]">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : videoUrl ? (
            <video width="1100px" controls src={videoUrl}>
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
