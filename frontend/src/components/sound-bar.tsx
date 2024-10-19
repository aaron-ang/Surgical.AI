'use client'
import React from 'react'
import { Mic } from 'lucide-react'

interface SoundBarProps {
  audioLevels: number[]
}

export default function SoundBar({ audioLevels }: SoundBarProps) {
  return (
    <div className="flex bg-[#A6E1DB] w-[351px] h-[52px] rounded-[5px]">
      <div className="ml-[20px] mt-[14px]">
        <svg width="18" height="23" viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.00004 14.333C8.02782 14.333 7.20143 13.9927 6.52087 13.3122C5.84032 12.6316 5.50004 11.8052 5.50004 10.833V3.83301C5.50004 2.86079 5.84032 2.0344 6.52087 1.35384C7.20143 0.673286 8.02782 0.333008 9.00004 0.333008C9.97226 0.333008 10.7987 0.673286 11.4792 1.35384C12.1598 2.0344 12.5 2.86079 12.5 3.83301V10.833C12.5 11.8052 12.1598 12.6316 11.4792 13.3122C10.7987 13.9927 9.97226 14.333 9.00004 14.333ZM7.83337 22.4997V18.9122C5.81115 18.6399 4.13893 17.7358 2.81671 16.1997C1.49448 14.6636 0.833374 12.8747 0.833374 10.833H3.16671C3.16671 12.4469 3.73565 13.8228 4.87354 14.9607C6.01143 16.0986 7.38693 16.6671 9.00004 16.6663C10.6132 16.6656 11.989 16.0966 13.1277 14.9595C14.2664 13.8224 14.8349 12.4469 14.8334 10.833H17.1667C17.1667 12.8747 16.5056 14.6636 15.1834 16.1997C13.8612 17.7358 12.1889 18.6399 10.1667 18.9122V22.4997H7.83337Z" fill="black"/>
        </svg>
      </div>
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
  )
}