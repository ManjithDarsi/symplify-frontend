import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import React from 'react'
import { Button } from './ui/button'

const Home = () => {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/clinic')
  })
  return (
    <div className='flex flex-col items-center'>
       
    </div>
    
  )
}

export default Home