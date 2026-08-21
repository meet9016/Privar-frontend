import React from 'react'
import Carousel from '../../components/webComponents/Carousel'
import About from '../../components/webComponents/About'
import Members from '../../components/webComponents/CommitteeMember'
import Memories from '../../components/webComponents/Memories'
import Events from '../../components/webComponents/Events'
import TopStudents from '../../components/webComponents/TopStudents'
import Donors from '../../components/webComponents/Donors'
import Businesses from '../../components/webComponents/Businesses'

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Carousel Section */}
      <section id="home" className="w-full bg-gradient-to-b from-white via-white to-gray-50">
        <div className="mx-auto">
          <Carousel
            autoplay={true}
            autoplayInterval={5000}
            showArrows={true}
            showDots={true}
            showCounter={false}
          />
        </div>
      </section>

      <About />
      <Members />
      <Memories />
      <Events />
      <TopStudents />
      <Businesses />
      <Donors />
    </div>
  )
}

