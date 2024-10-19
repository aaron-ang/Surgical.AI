'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic } from 'lucide-react'
import Image from 'next/image'
import { TypewriterEffect } from './ui/typewriter-effect'
import { TextGenerateEffect } from './ui/text-generate-effect'

type Message = {
  text: string
  sender: 'user' | 'ai'
}

export default function SurgicalChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, sender: 'user' }])
      setInputMessage('')
      simulateAIResponse()
    }
  }

  const simulateAIResponse = () => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { 
        text: "I'm processing your request. Please wait a moment.", 
        sender: 'ai' 
      }])
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      setIsRecording(true)
      visualize()
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    setAudioLevel(0)
  }

  const visualize = () => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    const updateLevel = () => {
      analyserRef.current!.getByteFrequencyData(dataArray)
      const level = Math.max(...dataArray) / 255
      setAudioLevel(level)
      if (isRecording) {
        requestAnimationFrame(updateLevel)
      }
    }
    updateLevel()
  }

  return (
    <div className="w-[395px] h-screen flex flex-col bg-gray-100">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <TextGenerateEffect 
                words={message.text}
              />
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
      <div className="p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Send
          </button>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full ${
              isRecording ? 'bg-red-500' : 'bg-gray-200'
            }`}
          >
            <Mic className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}