"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignUp() {
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    name: string;
  }>({ email: "", password: "", name: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setLoading(false); // Stop loading

      if (res.ok) {
        await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        router.push("/");
      } else {
        const data: { message?: string } = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setLoading(false); // Stop loading
      setError("An error occurred");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
          <svg
            className="animate-spin h-16 w-16 text-white"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              d="M4 12a8 8 0 0 1 16 0"
            ></path>
          </svg>
          <p className="mt-4 text-white">Signing Up...</p>
        </div>
      ) : (
        <div className="bg-gray-900 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
          {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <form>
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 p-2 w-full border border-gray-600 rounded-md bg-gray-800 text-white"
                required
              />
            </form>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-600 rounded-md bg-gray-800 text-white"
              required
            />
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-600 rounded-md bg-gray-800 text-white"
              required
            />

            <Button
              type="submit"
              className="w-full mt-4 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>

          <p className="mt-4 text-center">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
