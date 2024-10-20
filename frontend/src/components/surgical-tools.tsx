'use client'
import React from 'react'
import ToolStatus from './tool-status'

const SurgicalTools = () => {
  return (
    <div className="w-[395px] h-[379px] bg-[#F9F9F9] shadow-sm ">
        <div className="mt-[35px] ml-[24px]">
            <span className="text-[16px] text-[#000000] text-opacity-50 text-base font-medium ">
                Tool Status
            </span>
        </div>
        <ToolStatus tool="Scissors" status="missing" />
        <ToolStatus tool="Forceps" status="inPlace" />
        <ToolStatus tool="Gauze" status="inUse" />
      
    </div>
  )
}

export default SurgicalTools;
