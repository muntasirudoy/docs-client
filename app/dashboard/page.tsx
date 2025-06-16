"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, FileText, Share, Trash2, MoreVertical, LogOut, Search } from "lucide-react"
import { apiService } from "@/lib/api"
import toast from "react-hot-toast"

interface Document {
  _id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  owner: string
  sharedWith: string[]
  role: "owner" | "editor" | "viewer"
}

interface User {
  _id: string
  fullName: string
  email: string
  avatar: string
}
interface UserRes {
  data: User
}

export default function Dashboard() {
  const [user, setUser] = useState<UserRes | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    getDocuments(parsedUser)



    const mockSharedDocuments: Document[] = [
      {
        _id: "3",
        title: "Team Guidelines",
        content: "Shared team guidelines...",
        createdAt: "2024-01-10",
        updatedAt: "2024-01-12",
        owner: "other-user",
        sharedWith: [parsedUser.email],
        role: "editor",
      },
    ]

    setSharedDocuments(mockSharedDocuments)
  }, [router])

  const handleCreateDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log(user);

    const formData = new FormData(e.currentTarget)
    const title = formData.get("title") as string
    let res = await apiService.createDocument({
      content: '',
      // eslint-disable-next-line
      owner: user?.data?._id || '',
      role: 'owner',
      title,
      sharedWith: []
    })

    if (res) {
      toast.success('Document Created')
      if (!user?.data._id) return
      getDocuments(user.data)
    }


    // setDocuments((prev) => [newDoc, ...prev])
    setIsCreateDialogOpen(false)
  }

  const getDocuments = async (userInfo: User) => {
    console.log('hi', userInfo);

    if (!userInfo?._id) return
    console.log('hi');

    try {
      let res = await apiService.getDocumentsByUserId(userInfo?._id)
      console.log(res);
      setDocuments(res.data)
    } catch (error) {
      toast.error('Fail to get document')
      console.log(error);

    }
  }

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc._id !== docId))
  }
  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    router.push("/")
  }

  const filteredDocuments = documents?.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredSharedDocuments = sharedDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">DocShare</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                  <DialogDescription>Give your document a title to get started.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDocument}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Document Title</Label>
                      <Input id="title" name="title" placeholder="Enter document title" required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Document</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.data.avatar || "/placeholder.svg"} alt={user?.data.fullName} />
                    <AvatarFallback>{user?.data.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block">{user?.data.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="my-docs" className="w-full">
          <TabsList>
            <TabsTrigger value="my-docs">My Documents</TabsTrigger>
            <TabsTrigger value="shared-docs">Shared with Me</TabsTrigger>
          </TabsList>

          <TabsContent value="my-docs" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments?.map((doc) => (
                <Card key={doc._id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium line-clamp-1">{doc.title}</CardTitle>
                        <CardDescription className="mt-1">Updated {doc.updatedAt}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/document/${doc._id}`)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteDocument(doc._id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" onClick={() => router.push(`/document/${doc._id}`)}>
                    <p className="text-sm text-gray-600 line-clamp-3">{doc.content || "No content yet..."}</p>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="secondary">{doc.sharedWith.length > 0 ? "Shared" : "Private"}</Badge>
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shared-docs" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSharedDocuments.map((doc) => (
                <Card key={doc._id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium line-clamp-1">{doc.title}</CardTitle>
                        <CardDescription className="mt-1">Updated {doc.updatedAt}</CardDescription>
                      </div>
                      <Badge variant={doc.role === "editor" ? "default" : "secondary"}>{doc.role}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0" onClick={() => router.push(`/document/${doc._id}`)}>
                    <p className="text-sm text-gray-600 line-clamp-3">{doc.content || "No content yet..."}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-gray-500">Shared by owner</span>
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
