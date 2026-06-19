import React from 'react'
import { FaUserPlus } from 'react-icons/fa'
import { MdFindInPage } from 'react-icons/md'
import { IoMdSend } from 'react-icons/io'

const HowItWorks = () => {
  return (
    <div className='howitworks'>
      <div className="container">
        <h3>How JobZee Works</h3>
        <div className="banner">
          <div className="card">
            <FaUserPlus />
            <p>Create Account</p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime, sunt praesentium. Ex voluptatem tempora itaque consectetur commodi magni eveniet eius odit nisi! Iure, eligendi hic?
            </p>
          </div>

          <div className="card">
            <MdFindInPage />
            <p>Find a job/Post a job</p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime, sunt praesentium. Ex voluptatem tempora itaque consectetur commodi magni eveniet eius odit nisi! Iure, eligendi hic?
            </p>
          </div>

          <div className="card">
            <IoMdSend />
            <p>Apply for Job/Recruit suitable candidates</p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime, sunt praesentium. Ex voluptatem tempora itaque consectetur commodi magni eveniet eius odit nisi! Iure, eligendi hic?
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HowItWorks