"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfigList } from "@/components/mcp/config-list";
import { SSETester } from "@/components/mcp/sse-tester";

// Define the MCP configuration type
interface MCPConfig {
  id: number;
  name: string;
  config: {
    mcpServers: Record<string, {
      command: string;
      args?: string[];
    }>;
  };
  created_at: string;
}

export default function DashboardPage() {
  const [configs, setConfigs] = useState<MCPConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Fetch configurations from the API
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/configs`);
        if (!response.ok) {
          throw new Error("Failed to fetch configurations");
        }
        const data = await response.json();
        setConfigs(data);
      } catch (error) {
        console.error("Error fetching configurations:", error);
        toast({
          title: "Error",
          description: "Failed to load configurations. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Manage your MCP server configurations and SSE endpoints.</p>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="endpoints">SSE Endpoints</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Configurations</CardTitle>
              <CardDescription>
                Create and manage your MCP server configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ConfigList 
                  configs={configs} 
                  onRefresh={() => {
                    setLoading(true);
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/configs`)
                      .then(response => {
                        if (!response.ok) {
                          throw new Error("Failed to fetch configurations");
                        }
                        return response.json();
                      })
                      .then(data => {
                        setConfigs(data);
                        setLoading(false);
                      })
                      .catch(error => {
                        console.error("Error fetching configurations:", error);
                        toast({
                          title: "Error",
                          description: "Failed to load configurations. Please try again.",
                          variant: "destructive",
                        });
                        setLoading(false);
                      });
                  }} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSE Endpoints</CardTitle>
              <CardDescription>
                View and test your SSE endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SSETester 
                defaultUrl={configs.length > 0 ? `${process.env.NEXT_PUBLIC_API_URL}/sse/${configs[0].id}` : ""} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>
                Learn how to use the MCP SSE Server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-medium">What is MCP?</h3>
              <p>
                The Model Context Protocol (MCP) is a lightweight, STDIO-based specification for 
                interacting with language models over a standard input/output interface. It allows 
                for real-time streaming of model responses and is designed to be simple and extensible.
              </p>
              
              <h3 className="text-lg font-medium">How to Use SSE Endpoints</h3>
              <p>
                Once you&apos;ve created a configuration, you&apos;ll get an SSE URL that you can use in any 
                SSE-capable client. Here&apos;s an example of how to use it in JavaScript:
              </p>
              
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <code>{`const eventSource = new EventSource("${process.env.NEXT_PUBLIC_API_URL}/sse/1");

eventSource.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  console.log("Token:", data.token);
});

eventSource.addEventListener("error", (event) => {
  console.error("Error:", event);
});

eventSource.addEventListener("close", (event) => {
  console.log("Connection closed:", event);
  eventSource.close();
});`}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
