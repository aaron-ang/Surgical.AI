'use client'
import Link from 'next/link'
import SurgicalHeader from '@/components/surgical-header'
import SurgicalChat from '@/components/surgical-chat'
import SurgicalVideo from '@/components/surgical-video'
import { ToolProvider } from '@/components/tool-context'

export default function SurgeryPage() {
  return (
    <ToolProvider>
      <div className='flex flex-col h-screen'>
        <SurgicalHeader />
        
        <div className='flex flex-row'>
          <SurgicalChat />
          <SurgicalVideo />
        </div>
      </div>
    </ToolProvider>
  )
}