"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import { Share, Copy, Users, Globe, Mail, UserPlus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { apiService } from "@/lib/api"
import { Document } from "@/app/document/[id]/page"
import toast from "react-hot-toast"



export default function ShareDialog({ doc }: {
    doc: Document
}) {
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
    const [document, setDocument] = useState<Document>(doc)
    const [copied, setCopied] = useState(false)
    const [publicAccess, setPublicAccess] = useState(document.publicAccess || false)



    const handleCopyLink = async () => {
        const link = `${window.location.origin}/document/share/${document._id}`
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Coppied')

    }

    const getInitials = (name: string, email: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
        }
        return email.split("@")[0].slice(0, 2).toUpperCase()
    }

    const getRoleColor = (role: string) => {
        return role === "editor" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
    }
    const handleShare = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const role = formData.get("role") as "editor" | "viewer"
        if (!document || !email || !role) return
        if (document.sharedWith.some(user => user.user.email === email)) return
        try {
            const res = await apiService.shareDocument(document._id, email, role)
            if (res?.data && res.data.user && res.data.role) {
                setDocument(prev => prev ? {
                    ...prev,
                    sharedWith: [...prev.sharedWith, res.data.data]
                } : prev)
                toast.success('Share success')
            } else {
                toast.error('Unexpected API response')
            }

            setIsShareDialogOpen(false)
        } catch (error) {
            console.error("Error sharing document:", error)
            toast.success('Error sharing document')
        }
    }
    const updatePublicAccess = async (value: "viewer" | "editor") => {
        try {
            const res = await apiService.setPublicAccess(
                document._id,
                true,
                value
            );

            if (!res.error) throw new Error(res.message || "Failed to update");
            toast.success('Updated')

            setDocument((prev) => ({
                ...prev,
                publicRole: value,
            }));
        } catch (error) {
            toast.success('Public access update error')
            console.error("Public access update error:", error);
        }
    };


    const togglePublicAccess = async (enabled: boolean) => {
        try {
            const res = await apiService.setPublicAccess(
                document._id,
                enabled,
                document.publicRole
            );

            if (!res.data) throw new Error(res.message || "Failed to toggle");
            toast.success('Permission updated!')
            setDocument((prev) => ({
                ...prev,
                publicAccess: enabled,
            }));
            setPublicAccess(enabled);
        } catch (error) {
            console.error("Public access toggle error:", error);
            setPublicAccess(!enabled);
        }
    };


    return (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Share className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="flex items-center gap-2">
                        <Share className="h-5 w-5" />
                        Share Document
                    </DialogTitle>
                    <DialogDescription>Invite people to collaborate on "{document.title}"</DialogDescription>
                </DialogHeader>

                <Card className="border-dashed">
                    <CardContent className="pt-6">
                        <form onSubmit={handleShare} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Invite by email
                                </Label>
                                <Input id="email" name="email" type="email" placeholder="Enter email address" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium">
                                    Permission
                                </Label>
                                <Select name="role" defaultValue="viewer">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Can view</SelectItem>
                                        <SelectItem value="editor">Can edit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Send Invite
                            </Button>
                        </form>
                    </CardContent>
                </Card>


                {document.sharedWith.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">People with access</Label>
                            <Badge variant="secondary" className="ml-auto">
                                {document.sharedWith.length}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {document.sharedWith.map((shared, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={`/placeholder-user.jpg`} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(shared.user?.fullName || "", shared.user?.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {shared.user?.fullName || shared.user?.email?.split("@")[0]}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{shared.user?.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className={getRoleColor(shared.role)}>
                                        {shared.role === "editor" ? "Can edit" : "Can view"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Public Access */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <Label className="text-sm font-medium">Public access</Label>
                        </div>
                        <Switch checked={publicAccess} onCheckedChange={togglePublicAccess} aria-label="Toggle public access" />
                    </div>

                    {publicAccess && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Anyone with the link can:</span>
                                <Select
                                    value={document.publicRole}
                                    onValueChange={(value: "viewer" | "editor") => updatePublicAccess(value)}
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">View</SelectItem>
                                        <SelectItem value="editor">Edit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={`${window.location.origin}/document/share/${document._id}`}
                                    className="font-mono text-xs"
                                />
                                <Button variant="outline" size="sm" onClick={handleCopyLink} className="shrink-0">
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>

                            {copied && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Link copied to clipboard
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
