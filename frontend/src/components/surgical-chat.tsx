import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";
import { TextGenerateEffect } from './ui/text-generate-effect'; // Assuming you have this component

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const SurgicalChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [audioLevels, setAudioLevels] = useState<number[]>(Array(60).fill(0));
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const deepgramRef = useRef<LiveClient | null>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const startRecording = async () => {
        try {
            console.log('Starting recording...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsRecording(true);
            console.log('Recording started successfully.');

            // Initialize Deepgram client
            const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY as string);
            deepgramRef.current = deepgram.listen.live({
                model: "nova-2",
                language: "en-US",
                smart_format: true,
            });

            console.log('Deepgram client initialized.');

            deepgramRef.current.on(LiveTranscriptionEvents.Open, () => {
                console.log('Deepgram connection opened.');

                // Send audio data to Deepgram
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = audioContext.createMediaStreamSource(stream);
                const processor = audioContext.createScriptProcessor(1024, 1, 1);

                source.connect(processor);
                processor.connect(audioContext.destination);

                processor.onaudioprocess = (e: AudioProcessingEvent) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const uint8Array = new Uint8Array(inputData.buffer);
                    if (deepgramRef.current) {
                        deepgramRef.current.send(uint8Array);
                    }
                    updateAudioLevels(inputData);
                };

                console.log('Audio processing set up.');
            });

            deepgramRef.current.on(LiveTranscriptionEvents.Transcript, (data: any) => {
                console.log('Received transcript:', data);
                const transcript = data.channel.alternatives[0].transcript;
                if (transcript.trim()) {
                    console.log('Adding user message:', transcript);
                    setMessages(prevMessages => [...prevMessages, { sender: 'user', text: transcript }]);
                    resetSilenceTimeout();
                } else {
                    console.log('Received empty transcript.');
                }
            });

            deepgramRef.current.on(LiveTranscriptionEvents.Error, (error: Error) => {
                console.error('Deepgram error:', error);
                setError('Error with transcription service');
            });

        } catch (err) {
            console.error('Error starting recording:', err);
            setError('Error accessing microphone');
        }
    };

    const stopRecording = () => {
        console.log('Stopping recording...');
        setIsRecording(false);
        if (deepgramRef.current) {
            deepgramRef.current.finish();
            console.log('Deepgram connection closed.');
        }
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            console.log('Silence timeout cleared.');
        }
        console.log('Recording stopped.');
    };

    const resetSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => {
            console.log('Silence detected. Generating AI response...');
            setIsTyping(true);
            setTimeout(() => {
                const aiResponse = "I'm an AI response after 3 seconds of silence.";
                console.log('Adding AI message:', aiResponse);
                setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: aiResponse }]);
                setIsTyping(false);
            }, 1500);
        }, 3000);
    };

    const updateAudioLevels = (inputData: Float32Array) => {
        const bufferLength = inputData.length;
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(inputData[i]);
        }
        const average = sum / bufferLength;
        const scaledLevel = Math.min(average * 5, 1); // Scale the level and cap at 1
        setAudioLevels(prevLevels => [...prevLevels.slice(1), scaledLevel]);
    };

    return (
        <div className="w-[395px] h-screen flex flex-col bg-gray-100">
            <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start items-start'
                        }`}
                    >
                        {message.sender === 'ai' && (
                            <div className="w-8 h-8 mr-2 rounded-full overflow-hidden bg-teal-100 flex-shrink-0">
                                <Image
                                    src="/medi.svg"
                                    alt="AI Icon"
                                    width={43}
                                    height={43}
                                />
                            </div>
                        )}
                        <div
                            className={`max-w-[70%] ${
                                message.sender === 'user'
                                    ? 'bg-white rounded-[5px] shadow-sm px-4 py-2'
                                    : 'text-gray-800'
                            }`}
                            style={{
                                backgroundColor: message.sender === 'user' ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                                color: 'rgba(0, 0, 0, 0.9)',
                                fontSize: '16px',
                            }}
                        >
                            {message.sender === 'ai' ? (
                                <TextGenerateEffect words={message.text} />
                            ) : (
                                message.text
                            )}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start items-start">
                        <div className="w-8 h-8 mr-2 rounded-full overflow-hidden bg-teal-100 flex-shrink-0">
                            <Image
                                src="/medi.svg"
                                alt="AI Icon"
                                width={43}
                                height={43}
                            />
                        </div>
                        <div className="text-gray-800">
                            <span className="animate-pulse">...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className='mb-[33px] ml-[24px]'>
                <div className="flex bg-[#A6E1DB] w-[351px] h-[52px] rounded-[5px]">
                    <button onClick={isRecording ? stopRecording : startRecording} className="ml-[20px] mt-[0px] focus:outline-none">
                        <svg width="18" height="23" viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.00004 14.333C8.02782 14.333 7.20143 13.9927 6.52087 13.3122C5.84032 12.6316 5.50004 11.8052 5.50004 10.833V3.83301C5.50004 2.86079 5.84032 2.0344 6.52087 1.35384C7.20143 0.673286 8.02782 0.333008 9.00004 0.333008C9.97226 0.333008 10.7987 0.673286 11.4792 1.35384C12.1598 2.0344 12.5 2.86079 12.5 3.83301V10.833C12.5 11.8052 12.1598 12.6316 11.4792 13.3122C10.7987 13.9927 9.97226 14.333 9.00004 14.333ZM7.83337 22.4997V18.9122C5.81115 18.6399 4.13893 17.7358 2.81671 16.1997C1.49448 14.6636 0.833374 12.8747 0.833374 10.833H3.16671C3.16671 12.4469 3.73565 13.8228 4.87354 14.9607C6.01143 16.0986 7.38693 16.6671 9.00004 16.6663C10.6132 16.6656 11.989 16.0966 13.1277 14.9595C14.2664 13.8224 14.8349 12.4469 14.8334 10.833H17.1667C17.1667 12.8747 16.5056 14.6636 15.1834 16.1997C13.8612 17.7358 12.1889 18.6399 10.1667 18.9122V22.4997H7.83337Z" fill={isRecording ? "red" : "black"}/>
                        </svg>
                    </button>
                    <div className="bg-white w-[280px] h-[35px] mt-[9px] ml-[22px] rounded-[5px] flex items-center justify-between px-[16px]">
                        {audioLevels.map((level, index) => (
                            <div
                                key={index}
                                className="w-[1px] bg-black transition-all duration-100 ease-in-out"
                                style={{ height: `${level * 70}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
            {error && (
                <div className="p-4 bg-red-100 text-red-700">
                    Error: {error}
                </div>
            )}
        </div>
    );
};

export default SurgicalChat;