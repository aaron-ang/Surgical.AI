import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

import Svg1 from '../../public/picOne.svg'
import Svg2 from '../../public//picTwo.svg'
import Svg3 from '../../public//picThree.svg'
import Svg4 from '../../public//picFour.svg'
import logo from '../../public/white_logo.svg'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#46B5AA] text-white">
      <header className="container flex justify-between items-center">
        <div className="flex items-center space-x-2 mt-[28px]">
        <Image alt="white logo" src={logo}  />


        </div>
        <div className="space-x-4 mt-[32px]">
          <Button className="bg-[#33A095] text-white font-medium">Log In</Button>
          <Link href="/surgery">
          <Button variant="outline" className="bg-white text-[#33A095] font-bold">Try Now</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">
          An AI Tool Tracker for Your Surgical Safety
        </h1>
        <div className="flex justify-center space-x-4 mb-12">
          <Button size="lg" className="w-[236px] h-[46px] bg-[#33A095] text-white font-medium text-[20px]">Watch Demo</Button>
          <Link href="/surgery">
          <Button size="lg" variant="outline" className="w-[236px] h-[46px] bg-white text-[#33A095] text-[20px] font-bold">Try Now</Button>
          </Link>
        </div>

        <Image src={Svg1} alt="SVG 1" className="absolute top-[348px] left-[271px]" />

        <Image src={Svg2} alt="SVG 2" className="absolute top-[580px] left-[1025px]" />
        <Image src={Svg3} alt="SVG 3" className="absolute top-[413px] left-[1141px]" />
        <Image src={Svg4} alt="SVG 4" className="absolute top-[220px] left-[411px]" />



       
      </main>
    </div>
  )
}