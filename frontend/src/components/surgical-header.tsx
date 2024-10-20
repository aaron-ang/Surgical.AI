'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'


export default function SurgicalHeader() {
  const [time, setTime] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <header className="flex items-center justify-between bg-[#F6F6F6] shadow-sm z-[2]">
      <div className="ml-[24px] mb-[16px] mt-[16px] flex items-center">
      <Link href="/" className="cursor-pointer">
          <Image
            src="/logo.svg"
            alt="Surgical.AI Logo"
            width={119.13}
            height={24.67}
          />
        </Link>
      </div>
      <div className="text-[24px] font-bold">{formatTime(time)}</div>
      <div className="text-sm text-[#000000] font-medium mr-[24px] mb-[16px] mt-[16px]">
        <span style={{ opacity: 0.5 }}>N. Hopkins</span>
        <span className="">&nbsp;&nbsp;</span>
        <span className="">CPT Code 27130</span>
      </div>
    </header>
  )
}