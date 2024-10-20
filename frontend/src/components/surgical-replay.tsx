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
    let objectURL: string | null = null;

    const fetchVideo = async () => {
      // Construct the video path based on the item name
      const videoPath = `1729402855.3459892.mp4`;
      const videoRef = ref(storage, videoPath);

      try {
        const url = await getDownloadURL(videoRef);
        console.log("Firebase URL:", url);

        // Fetch the video data as a Blob
        const response = await fetch(url);
        const blob = await response.blob();

        // Create a local URL for the video blob
        objectURL = URL.createObjectURL(blob);
        setVideoUrl(objectURL);
      } catch (error) {
        console.error("Error fetching video:", error);
        setError("Failed to load video. Please try again later.");
      }
    };

    fetchVideo();

    // Cleanup function to revoke the object URL
    return () => {
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
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
            <video width="1100px" height="auto" controls>
              <source src={videoUrl} type="video/mp4" />
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
