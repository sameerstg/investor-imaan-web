'use client'
import { useSession } from 'next-auth/react'
import React from 'react'

function Portfolio() {
  const { data, status } = useSession()
  return (
    <div>
      <>{data?.user.name}</>
      <>{data?.user.email}</>
    </div>
  )
}

export default Portfolio
