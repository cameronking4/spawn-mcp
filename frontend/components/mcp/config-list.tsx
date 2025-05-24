"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ConfigForm } from "./config-form";

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

interface ConfigListProps {
  configs: MCPConfig[];
  onRefresh: () => void;
}

export function ConfigList({ configs, onRefresh }: ConfigListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<MCPConfig | null>(null);
  const { toast } = useToast();

  const handleCopyEndpoint = (id: number) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/${id}`;
    navigator.clipboard.writeText(url).then(
      () => {
        toast({
          title: "Copied!",
          description: "SSE endpoint URL copied to clipboard",
        });
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this configuration?")) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/configs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete configuration");
      }

      toast({
        title: "Success",
        description: "Configuration deleted successfully",
      });
      
      onRefresh();
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast({
        title: "Error",
        description: "Failed to delete configuration",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Configurations</h2>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button>Create New</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogTitle>Create Configuration</DialogTitle>
            <ConfigForm
              onSuccess={() => {
                setShowCreateForm(false);
                onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">No configurations found. Create your first one!</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Server Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => {
                const serverName = config.config && config.config.mcpServers 
                  ? Object.keys(config.config.mcpServers)[0] || "Unknown"
                  : "Unknown";
                
                return (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{serverName}</TableCell>
                    <TableCell>{formatDate(config.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyEndpoint(config.id)}
                        >
                          Copy URL
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingConfig(config)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          {editingConfig && editingConfig.id === config.id && (
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogTitle>Edit Configuration</DialogTitle>
                              <ConfigForm
                                initialData={{
                                  id: config.id,
                                  name: config.name,
                                  config: JSON.stringify(config.config, null, 2),
                                }}
                                onSuccess={() => {
                                  setEditingConfig(null);
                                  onRefresh();
                                }}
                              />
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
