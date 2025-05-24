"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";

interface ConfigFormProps {
  onSuccess?: () => void;
  initialData?: {
    id?: number;
    name: string;
    config: string;
  };
}

export function ConfigForm({ onSuccess, initialData }: ConfigFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [config, setConfig] = useState(
    initialData?.config || JSON.stringify({
      mcpServers: {
        playwright: {
          command: "npx",
          args: ["@playwright/mcp@latest"]
        }
      }
    }, null, 2)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateJson = (json: string): boolean => {
    try {
      JSON.parse(json);
      setJsonError(null);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(error.message);
      } else {
        setJsonError("Invalid JSON");
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a configuration name",
        variant: "destructive",
      });
      return;
    }

    if (!validateJson(config)) {
      toast({
        title: "Error",
        description: "Invalid JSON configuration",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const url = initialData?.id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/configs/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/configs`;
      
      const method = initialData?.id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          config: JSON.parse(config),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      toast({
        title: "Success",
        description: initialData?.id 
          ? "Configuration updated successfully" 
          : "Configuration created successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Playwright MCP"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config">Configuration JSON</Label>
            <div className="relative">
              <Textarea
                id="config"
                value={config}
                onChange={(e) => {
                  setConfig(e.target.value);
                  validateJson(e.target.value);
                }}
                placeholder="Enter your MCP configuration JSON"
                className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                disabled={isSubmitting}
              />
              {jsonError && (
                <div className="text-sm text-destructive mt-1">{jsonError}</div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !!jsonError}>
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
