'use client'
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@deepgram/sdk';
import { LiveTranscriptionEvents } from '@deepgram/sdk';
import SoundBar from './sound-bar';
import { TextGenerateEffect } from './ui/text-generate-effect';
import Image from 'next/image';

type Message = {
  text: string;
  sender: 'user' | 'ai';
};

const SurgicalChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevels, setAudioLevels] = useState<number[]>(Array(60).fill(0));
    const [transcription, setTranscription] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const deepgramLiveRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
    useEffect(() => {
      const initializeDeepgram = () => {
        try {
          const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
          deepgramLiveRef.current = deepgram.listen.live({ model: 'nova' });
  
          deepgramLiveRef.current.on(LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened successfully.');
          });
  
          deepgramLiveRef.current.on(LiveTranscriptionEvents.Error, (error: any) => {
            console.error('Deepgram error:', error);
            setError(`Deepgram error: ${error.message || 'Unknown error'}`);
          });
  
          deepgramLiveRef.current.on(LiveTranscriptionEvents.Close, () => {
            console.log('Deepgram connection closed.');
          });
  
          deepgramLiveRef.current.on(LiveTranscriptionEvents.Transcript, (data: any) => {
            console.log('Received transcript:', data);
            const transcribedText = data.channel.alternatives[0].transcript;
            if (transcribedText) {
              console.log('Transcribed text:', transcribedText);
              setTranscription(prev => prev + ' ' + transcribedText);
              resetSilenceTimeout();
            }
          });
  
          deepgramLiveRef.current.on('error', (error: any) => {
            console.error('WebSocket error:', error);
            setError(`WebSocket error: ${error.message || 'Unknown error'}`);
          });
  
        } catch (err) {
          console.error('Error initializing Deepgram:', err);
          setError(`Error initializing Deepgram: ${err instanceof Error ? err.message : String(err)}`);
        }
      };
  
      initializeDeepgram();
  
      return () => {
        if (deepgramLiveRef.current) {
          deepgramLiveRef.current.finish();
        }
      };
    }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      setIsRecording(true);
      visualize();

      // Send audio data to Deepgram
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && deepgramLiveRef.current) {
          deepgramLiveRef.current.send(event.data);
        }
      };
      recorder.start(250);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setAudioLevels(Array(60).fill(0));
    if (deepgramLiveRef.current) {
      deepgramLiveRef.current.finish();
    }
    addMessageToChat(transcription, 'user');
    setTranscription('');
    simulateAIResponse();
  };

  const visualize = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const updateLevels = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      const levelSum = dataArray.reduce((sum, value) => sum + value, 0);
      const averageLevel = levelSum / dataArray.length / 255;
      setAudioLevels(prev => [...prev.slice(1), averageLevel]);
      if (isRecording) {
        requestAnimationFrame(updateLevels);
      }
    };
    updateLevels();
  };

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 3000);
  };

  const addMessageToChat = (text: string, sender: 'user' | 'ai') => {
    setMessages(prev => [...prev, { text, sender }]);
  };

  const simulateAIResponse = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessageToChat("I'm processing your request. Please wait a moment.", 'ai');
    }, 2000);
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
        <SoundBar audioLevels={audioLevels} />
      </div>
      <div className="p-4 bg-white">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-2 px-4 rounded ${
            isRecording ? 'bg-red-500' : 'bg-blue-500'
          } text-white`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
};

export default SurgicalChat;