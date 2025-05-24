"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface SSETesterProps {
  defaultUrl?: string;
}

export function SSETester({ defaultUrl }: SSETesterProps) {
  const [url, setUrl] = useState(defaultUrl || "");
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [configId, setConfigId] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");
  const [isSendingPrompt, setIsSendingPrompt] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Extract config ID from URL
  useEffect(() => {
    if (url) {
      const match = url.match(/\/sse\/(\d+)/);
      if (match && match[1]) {
        setConfigId(parseInt(match[1]));
      } else {
        setConfigId(null);
      }
    }
  }, [url]);

  const connect = () => {
    if (!url) {
      setError("Please enter a valid SSE URL");
      return;
    }

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setError(null);
    setMessages([]);
    setIsConnected(false);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setMessages((prev) => [...prev, "Connection established"]);
      };

      eventSource.addEventListener("connected", (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          setMessages((prev) => [...prev, `Connected to config ID: ${data.id}`]);
          setConfigId(data.id);
        } catch (err) {
          console.error("Error parsing connected event:", err);
        }
      });

      eventSource.addEventListener("message", (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          setMessages((prev) => [...prev, `Message: ${JSON.stringify(data)}`]);
        } catch {
          const messageEvent = event as MessageEvent;
          setMessages((prev) => [...prev, `Message (raw): ${messageEvent.data}`]);
        }
      });

      eventSource.addEventListener("error", (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          setMessages((prev) => [...prev, `Error: ${JSON.stringify(data)}`]);
        } catch {
          setMessages((prev) => [...prev, `Error event received`]);
        }
        setError("Connection error");
        setIsConnected(false);
      });

      eventSource.addEventListener("close", (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          setMessages((prev) => [...prev, `Connection closed with code: ${data.code}`]);
        } catch {
          setMessages((prev) => [...prev, `Connection closed by server`]);
        }
        setIsConnected(false);
      });

      eventSource.addEventListener("heartbeat", (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const data = JSON.parse(messageEvent.data);
          console.log("Heartbeat received:", data);
          // Don't add heartbeats to the messages to avoid cluttering the UI
        } catch (err) {
          console.error("Error parsing heartbeat:", err);
        }
      });
    } catch (err) {
      setError("Failed to establish connection");
      console.error("SSE connection error:", err);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setMessages((prev) => [...prev, "Connection closed by client"]);
    }
  };

  const sendPrompt = async () => {
    if (!configId || !promptText.trim()) {
      toast({
        title: "Error",
        description: "Config ID and prompt text are required",
        variant: "destructive",
      });
      return;
    }

    setIsSendingPrompt(true);

    try {
      // Create a sample MCP prompt
      const mcpPrompt = {
        context: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: promptText }
        ],
        stream: true
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prompt/${configId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: mcpPrompt }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send prompt: ${response.statusText}`);
      }

      const result = await response.json();
      setMessages((prev) => [...prev, `Prompt sent: ${promptText}`]);
      toast({
        title: "Success",
        description: result.message,
      });
      setPromptText("");
    } catch (error) {
      console.error("Error sending prompt:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send prompt",
        variant: "destructive",
      });
    } finally {
      setIsSendingPrompt(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Server Tester</CardTitle>
        <CardDescription>
          Connect to an MCP server via SSE, send prompts, and view the streamed responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sse-url">SSE Endpoint URL</Label>
          <div className="flex space-x-2">
            <Input
              id="sse-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:3000/sse/1"
              disabled={isConnected}
              className="flex-1"
            />
            {isConnected ? (
              <Button onClick={disconnect} variant="destructive">
                Disconnect
              </Button>
            ) : (
              <Button onClick={connect}>Connect</Button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {isConnected && (
          <div className="space-y-2 border rounded-md p-4 bg-gray-50">
            <Label htmlFor="prompt">Send Prompt</Label>
            <Textarea
              id="prompt"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter your prompt here..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={sendPrompt} 
              disabled={isSendingPrompt || !promptText.trim()}
              className="w-full mt-2"
            >
              {isSendingPrompt ? "Sending..." : "Send Prompt"}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label>Response Stream</Label>
          <div className="border rounded-md p-4 h-[300px] overflow-y-auto bg-gray-50 font-mono text-sm">
            {messages.length === 0 ? (
              <p className="text-gray-400">Connect to an SSE endpoint to see responses...</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="py-1">
                  {msg}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        {isConnected ? (
          <span className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Connected to SSE endpoint {configId ? `(Config ID: ${configId})` : ''}
          </span>
        ) : (
          <span>Not connected</span>
        )}
      </CardFooter>
    </Card>
  );
}
