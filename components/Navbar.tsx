import React from 'react';
import Link from 'next/link';

function Navbar() {
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
                    <Link href="/shariah-stocks">
                        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                            Shariah Compliant Stocks
                        </button>
                    </Link>
                    <Link href="/portfolio">
                        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                            My Portfolio
                        </button>
                    </Link>
                    <Link href="/sip">
                        <button className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                            Calculator
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Navbar;