import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createClient, LiveTranscriptionEvents, LiveClient, LiveTTSEvents } from "@deepgram/sdk";
import { TextGenerateEffect } from './ui/text-generate-effect'; // Assuming you have this component
import { generateAIResponse } from '../lib/gemini';
import SurgicalTools from './surgical-tools';


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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const deepgramRef = useRef<LiveClient | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Set up audio element
    if (audioRef.current) {
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Error playing audio');
      });
    }

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', () => {});
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
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      mediaStreamRef.current = stream;
      console.log('Recording started successfully.');

      // Initialize Deepgram client
      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY as string);

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContextRef.current.sampleRate;

      deepgramRef.current = deepgram.listen.live({
        model: "nova",
        language: "en-US",
        smart_format: true,
        encoding: 'linear16', // PCM signed 16-bit little-endian
        sample_rate: sampleRate,
      });

      console.log('Deepgram client initialized.');

      deepgramRef.current.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened.');

        // Send audio data to Deepgram
        const source = audioContextRef.current!.createMediaStreamSource(stream);
        const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
        audioProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(audioContextRef.current!.destination);

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16DataBuffer = convertFloat32ToInt16(inputData);
          if (deepgramRef.current) {
            deepgramRef.current.send(int16DataBuffer);
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
          resetSilenceTimeout(transcript);
        } else {
          console.log('Received empty transcript.');
        }
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Error, (error: Error) => {
        console.error('Deepgram error:', error);
        setError('Error with transcription service');
      });

      deepgramRef.current.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed.');
      });

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Error accessing microphone');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    setIsRecording(false);
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      console.log('Audio processor disconnected.');
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      console.log('Audio context closed.');
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      console.log('Media stream tracks stopped.');
    }
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

  const resetSilenceTimeout = (transcript: string) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(async () => {
      console.log('Silence detected. Generating AI response...');
      setIsTyping(true);
      try {
        const userMessage = transcript;
        console.log("User message being sent to OpenAI: " + userMessage);
        const aiResponse = await generateAIResponse(userMessage);
        if (aiResponse !== null) {
          console.log('Adding AI message:', aiResponse);
          setMessages(prevMessages => [...prevMessages, { sender: 'ai', text: aiResponse }]);
          await generateAndPlayTTS(aiResponse);
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        setError('Error generating AI response');
      } finally {
        setIsTyping(false);
      }
    }, 3000);
  };

  const generateAndPlayTTS = async (text: string) => {
    try {
      const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY as string);
      const dgConnection = deepgram.speak.live({ 
        model: "aura-asteria-en",
        encoding: 'linear16',
        sample_rate: 24000
      });
  
      let audioChunks: Uint8Array[] = [];
  
      dgConnection.on(LiveTTSEvents.Open, () => {
        console.log("TTS Connection opened");
        dgConnection.sendText(text);
        dgConnection.flush();
      });
  
      dgConnection.on(LiveTTSEvents.Audio, (data) => {
        console.log("Received audio chunk");
        audioChunks.push(new Uint8Array(data));
      });
  
      dgConnection.on(LiveTTSEvents.Flushed, () => {
        console.log("TTS Flushed");
        if (audioChunks.length > 0) {
          const audioBlob = createWavBlob(audioChunks);
          const url = URL.createObjectURL(audioBlob);
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play()
              .then(() => console.log("Audio playback started"))
              .catch(e => {
                console.error("Error playing audio:", e);
                setError('Error playing audio: ' + e.message);
              });
          } else {
            console.error("Audio element not found");
            setError('Audio element not found');
          }
        } else {
          console.error("No audio data received");
          setError('No audio data received');
        }
      });
  
      dgConnection.on(LiveTTSEvents.Error, (err) => {
        console.error("TTS Error:", err);
        setError('Error generating speech: ' + err.message);
      });
  
      dgConnection.on(LiveTTSEvents.Close, () => {
        console.log("TTS Connection closed");
      });
  
    } catch (err) {
      console.error('Error generating TTS:', err);
      setError('Error generating speech: ' + (err as Error).message);
    }
  };
  
  // Helper function to create a WAV blob from PCM audio data
  function createWavBlob(audioChunks: Uint8Array[]): Blob {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const audioData = concatenateUint8Arrays(audioChunks);
    
    const wavHeader = createWavHeader(audioData.length, numChannels, sampleRate, bitsPerSample);
    const wavFile = new Uint8Array(wavHeader.length + audioData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(audioData, wavHeader.length);
    
    return new Blob([wavFile], { type: 'audio/wav' });
  }
  
  function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, array) => acc + array.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const array of arrays) {
      result.set(array, offset);
      offset += array.length;
    }
    return result;
  }
  
  function createWavHeader(dataLength: number, numChannels: number, sampleRate: number, bitsPerSample: number): Uint8Array {
    const headerLength = 44;
    const wavHeader = new ArrayBuffer(headerLength);
    const view = new DataView(wavHeader);
  
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);
  
    return new Uint8Array(wavHeader);
  }
  
  function writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

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

  const convertFloat32ToInt16 = (buffer: Float32Array) => {
    let l = buffer.length;
    const buf = new Int16Array(l);

    while (l--) {
      buf[l] = Math.max(-1, Math.min(1, buffer[l])) * 0x7FFF;
    }
    return buf.buffer;
  };

    return (
        <div className="w-[395px] h-[886.42px] flex flex-col bg-[#FFFFFF] overflow-hidden">
        <audio ref={audioRef} style={{ display: 'none' }} />

        <div className="flex-1 overflow-hidden flex flex-col">
        <SurgicalTools />
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
        </div>
  
        <div className='p-4'>
          <div className="flex bg-[#A6E1DB] w-full h-[52px] rounded-[5px]">
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