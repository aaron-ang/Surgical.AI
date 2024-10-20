'use client'
import Link from 'next/link'
import SurgicalHeader from '@/components/surgical-header'
import SurgicalChat from '@/components/surgical-chat'
import SurgicalVideo from '@/components/surgical-video'

export default function SurgeryPage() {
  return (
    
    <div className='flex flex-col h-screen'>
      <SurgicalHeader />
      
      <div className='flex flex-row'>
        <SurgicalChat />
        <SurgicalVideo />
      </div>
    </div>
  )
}