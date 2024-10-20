import React, { useState, useEffect, useRef } from "react";

const SurgicalVideo = () => {
    const [imageData, setImageData] = useState<string>("");
    const [metadata, setMetadata] = useState<Record<string, any>>({});
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Initialize WebSocket connection
        ws.current = new WebSocket("ws://localhost:8080");

        ws.current.onopen = () => {
            console.log("WebSocket connection established");
        };

        ws.current.onmessage = (event: MessageEvent) => {
            const data = event.data;
            if (typeof data === "string") {
                if (data.startsWith("/")) {
                    setImageData(data);
                } else if (data.startsWith("[")) {
                  
                    try {
                        const parsedMetadata = JSON.parse(data);
                        setMetadata(parsedMetadata);
                    } catch (error) {
                        console.error("Error parsing metadata:", error);
                    }
                }
            }
        };

        ws.current.onerror = (error: Event) => {
            console.error("WebSocket error:", error);
        };

        ws.current.onclose = () => {
            console.log("WebSocket connection closed");
        };

        // Clean up the WebSocket connection on component unmount
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    return (
        <div className="w-full max-w-[1117px] h-[886.42px] flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow-md">
            <img
                src={
                    imageData
                        ? `data:image/jpeg;base64,${imageData}`
                        : undefined
                }
                alt="Surgical video frame"
                className="max-w-full max-h-full object-contain"
            />
            <p>{JSON.stringify(metadata)}</p>
        </div>
    );
};

export default SurgicalVideo;
