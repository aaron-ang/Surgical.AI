'use client'
import React from 'react'
import ToolStatus from './tool-status'
import { useToolContext } from './tool-context'

const SurgicalTools = () => {
  const { toolData } = useToolContext();

  const mapStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'out of place':
        return 'inUse';
      case 'in place':
        return 'inPlace';
      case 'missing':
        return 'missing';
      default:
        return 'unknown'; // You might want to handle unexpected status values
    }
  };

  return (
    <div className="w-[395px] h-[379px] bg-[#F9F9F9] shadow-sm ">
        <div className="mt-[35px] ml-[24px]">
            <span className="text-[16px] text-[#000000] text-opacity-50 text-base font-medium ">
                Tool Status
            </span>
        </div>
        {toolData.map((tool) => (
          <ToolStatus 
            key={tool.tool} 
            tool={tool.tool} 
            status={mapStatus(tool.status) as 'missing' | 'inUse' | 'inPlace'} 
          />
        ))}
    </div>
  )
}

export default SurgicalTools;