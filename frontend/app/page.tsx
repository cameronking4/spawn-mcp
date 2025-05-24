"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl font-bold text-primary">
              MCP SSE Server
            </Link>
          </div>
          <div>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">Model Context Protocol SSE Server</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              A zero-infrastructure solution for deploying MCP servers with real-time streaming via SSE.
              Create, manage, and deploy your MCP configurations with just a few clicks.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signin">Get Started</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Easy Configuration</h3>
                <p className="text-gray-600">
                  Configure your MCP servers with a simple JSON interface. No complex setup required.
                </p>
              </div>
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Real-time Streaming</h3>
                <p className="text-gray-600">
                  Stream model responses in real-time using Server-Sent Events (SSE) technology.
                </p>
              </div>
              <div className="p-6 border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Zero Infrastructure</h3>
                <p className="text-gray-600">
                  No need to manage containers or servers. We handle all the infrastructure for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Sign in now to create your first MCP configuration and start streaming model responses.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} MCP SSE Server. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
