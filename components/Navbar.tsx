'use client'
import React from 'react';
import Link from 'next/link';
import { ModeToggle } from './ModeToggle';
import { useSession } from 'next-auth/react';
import SignIn from '@/app/sign-in/page';

function Navbar() {
    const { status, data } = useSession()
    return (
        <div className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo on the left */}
                <div className="flex items-center">
                    <Link href="/">
                        <span className="text-white text-xl font-bold">Investor Imaan</span>
                    </Link>
                </div>

                {/* Buttons on the right */}
                <div className="flex space-x-4">
                    <Link href="/shariah-stocks"
                        className="text-white  hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        Shariah Compliant Stocks
                    </Link>
                    <Link href="/portfolio"
                        className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        My Portfolio
                    </Link>
                    <Link href="/sip" className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        Calculator
                    </Link>
                    <Link className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium" href={status === "unauthenticated" ? "/sign-in" : "/portfolio"}>
                        Portfolio

                    </Link>
                    <ModeToggle />

                    <SignIn />
                </div>
            </div>
        </div >
    );
}

export default Navbar;