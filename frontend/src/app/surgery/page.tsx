'use client'
import Link from 'next/link'
import SurgicalHeader from '@/components/surgical-header'
import SurgicalChat from '@/components/surgical-chat'
export default function SurgeryPage() {
  return (
    
    <div className='flex flex-col h-screen'>
      <SurgicalHeader />
      
      <SurgicalChat />
    </div>
  )
}