"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Child {
  id: string;
  username: string;
  createdAt: string;
}

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  async function fetchChildren() {
    const res = await fetch("/api/children");
    const data = await res.json();
    setChildren(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchChildren();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);

    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create child account");
      setCreating(false);
      return;
    }

    setUsername("");
    setPassword("");
    setDialogOpen(false);
    setCreating(false);
    fetchChildren();
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Children</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            Add Child
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create Child Account</DialogTitle>
                <DialogDescription>
                  Create a username and password for your child to log in with.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="child-username">Username</Label>
                  <Input
                    id="child-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="child-password">Password</Label>
                  <Input
                    id="child-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={4}
                  />
                  <p className="text-xs text-gray-500">
                    Keep it simple — you&apos;ll enter this on their device.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No child accounts yet. Click &quot;Add Child&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} href={`/dashboard/children/${child.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">{child.username}</CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(child.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
