'use client'
import React from 'react'

interface ToolStatusProps {
  tool: string
  status: 'missing' | 'inUse' | 'inPlace'
}

const statusColors = {
  missing: '#FF1313',
  inUse: '#FF8C00',
  inPlace: '#2EB41A',
}

const statusMessages = {
  missing: 'missing',
  inUse: 'in use',
  inPlace: 'in place',
}

export default function ToolStatus({ tool, status }: ToolStatusProps) {
  return (
    <div className="mt-[16px] ml-[24px] w-[351px] h-[78px] flex items-center bg-white rounded-[5px] border border-black/10 ">
      <div
        className="w-[16px] h-[16px] rounded-full ml-[16px] mr-[24px]"
        style={{
          backgroundColor: statusColors[status],
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      />
      <div>
        <p className="font-bold text-[18px] text-black leading-none mb-[10px]">{tool}</p>
        <p className="text-[16px] font-medium leading-none">
            <span className="text-black text-opacity-50">This tool is currently </span>
            <span className="text-black">{statusMessages[status]}.</span>
        </p>
      </div>
    </div>
  )
}