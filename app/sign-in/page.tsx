"use client";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInButton() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard"); // change this to your protected route
    }
  }, [status, router]);

  const handleSignIn = async () => {
    await signIn("google", { redirect: true });
  };

  // While loading session, show nothing or a spinner
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <button
        onClick={handleSignIn}
        className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-100 transition"
      >
        {/* Google Logo */}
        <Image
          src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
          alt="Google Logo"
          width={24}
          height={24}
        />
        <span className="text-gray-700 font-medium text-base">
          Sign in with Google
        </span>
      </button>
    </div>
  );
}
