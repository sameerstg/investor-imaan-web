'use client'
import React from 'react';
import Link from 'next/link';
import { ModeToggle } from './ModeToggle';
import { signIn, signOut, useSession } from 'next-auth/react';
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
                    
                    <Link href="/sip" className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                        Calculator
                    </Link>
                    <Link className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium" href={status === "unauthenticated" ? "/sign-in" : "/portfolio"}>
                        Portfolio Tracker

                    </Link>
                    {/* Auth button */}
                    {status === "authenticated" ? (
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={async () => await signIn("google", { redirect: true })
                            }
                            className="text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Sign In
                        </button>
                    )}
                    <ModeToggle />

                </div>
            </div>
        </div >
    );
}

export default Navbar;