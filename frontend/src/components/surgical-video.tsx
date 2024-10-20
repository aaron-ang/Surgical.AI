import React, { useState, useEffect, useRef } from "react";
import { useToolContext } from './tool-context';

const SurgicalVideo = () => {
    const [imageData, setImageData] = useState<string>("");
    const { updateToolData } = useToolContext();
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
                if (data.startsWith("image:")) {
                    setImageData(data.slice(6));
                } else if (data.startsWith("[")) {
                    try {
                        const parsedData = JSON.parse(data);
                        updateToolData(parsedData);
                        console.log(parsedData);
                    } catch (error) {
                        console.error("Error parsing tool data:", error);
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
        <div className="w-[1117px] flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow-md">
            <img
                src={
                    imageData
                        ? `data:image/jpeg;base64,${imageData}`
                        : undefined
                }
                alt="Surgical video frame"
                className="w-[1117px] object-contain"
            />
        </div>
    );
};

export default SurgicalVideo;