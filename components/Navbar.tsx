"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { signIn, signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react"; // hamburger & close icons

function Navbar() {
  const { status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <span className="text-white text-xl font-bold">Investor Imaan</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link
            href="/shariah-stocks"
            className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Shariah Compliant Stocks
          </Link>
          <Link
            href="/sip"
            className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Calculator
          </Link>
          <Link
            href={status === "unauthenticated" ? "/sign-in" : "/portfolio"}
            className="text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Portfolio Tracker
          </Link>

          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={async () => await signIn("google", { redirect: true })}
              className="text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </button>
          )}

          <ModeToggle />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-2 space-y-2 px-2">
          <Link
            href="/shariah-stocks"
            className="block text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Shariah Compliant Stocks
          </Link>
          <Link
            href="/sip"
            className="block text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Calculator
          </Link>
          <Link
            href={status === "unauthenticated" ? "/sign-in" : "/portfolio"}
            className="block text-white hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
          >
            Portfolio Tracker
          </Link>
          {status === "authenticated" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left text-white hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={async () => await signIn("google", { redirect: true })}
              className="w-full text-left text-white hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </button>
          )}
          <ModeToggle />
        </div>
      )}
    </nav>
  );
}

export default Navbar;
