"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ShareDialog from "@/components/templates/share-dialog"
import { apiService } from "@/lib/api"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
// import { WebsocketProvider } from "y-websocket"
// import * as Y from "yjs"

import { Users, ArrowLeft, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
// import { yCursorPlugin, yjsPlugin } from "@/lib/collaboration"

interface User {
  _id: string
  fullName: string
  email: string
  avatar: string
}
interface UserRes {
  data: User
}
interface OnlineUser {
  id: string
  fullName: string
  avatar: string
  cursor: { x: number; y: number } | null
}

export interface Document {
  _id: string
  title: string
  content: string
  owner: string
  sharedWith: {
    role: "editor" | "viewer"
    user: {
      _id: string
      fullName: string
      email: string
      avatar?: string
    }
  }[]
  publicAccess: boolean
  publicRole: "viewer" | "editor"
}

export default function DocumentEditor() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<UserRes | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [title, setTitle] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) return router.push("/")
    const parsedUser = JSON.parse(userData)


    setUser(parsedUser.data)
    fetchDoc(parsedUser.data)
  }, [params.id])

  const fetchDoc = async (parsedUser: User) => {
    const docId = params.id
    if (!docId) return
    try {
      const res = await apiService.getDocumentByDocumentId(docId as string)
      if (res?.data) {
        setDocument(res.data)
        setTitle(res.data.title)
      }
      const mockOnlineUsers: OnlineUser[] = [
        { id: parsedUser._id, fullName: parsedUser.fullName, avatar: parsedUser.avatar, cursor: null }
      ]
      setOnlineUsers(mockOnlineUsers)
    } catch (error) {
      console.error("Failed to fetch document:", error)
    }
  }

  // const ydoc = new Y.Doc()
  // const provider = new WebsocketProvider(
  //   "ws://localhost:5000/yjs",
  //   `doc-${params.id}`,
  //   ydoc
  // );
  // const yXmlFragment = ydoc.getXmlFragment("content")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // yjsPlugin(yXmlFragment),
      // yCursorPlugin(provider.awareness, user as any)
    ],
    editorProps: {
      attributes: {
        class: "tiptap prose prose-lg focus:outline-none max-w-none whitespace-pre-wrap break-words"
      }
    }
  })

  useEffect(() => {
    if (!document) return
    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true)
        const html = editor?.getHTML()
        await apiService.updateDocument(document._id, { title, content: html || "" })
        setLastSaved(new Date())
      } catch (error) {
        console.error("Auto-save failed:", error)
      } finally {
        setIsSaving(false)
      }
    }, 10000)
    return () => clearTimeout(timeout)
  }, [document?.content, title])

  const handleShare = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const role = formData.get("role") as "editor" | "viewer"
    if (!document || !email || !role) return
    if (document.sharedWith.some(user => user.user.email === email)) return
    try {
      const res = await apiService.shareDocument(document._id, email, role)
      if (res?.data) {
        setDocument(prev => prev ? {
          ...prev,
          sharedWith: [...prev.sharedWith, res.data]
        } : prev)
      }
      setIsShareDialogOpen(false)
    } catch (error) {
      console.error("Error sharing document:", error)
    }
  }

  if (!user || !document) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 px-6 py-3 bg-white/80 backdrop-blur border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-3xl font-semibold border-none bg-transparent shadow-none px-0"
            placeholder="Untitled document"
          />
          {isSaving && <Badge variant="secondary">Saving...</Badge>}
          {!isSaving && lastSaved && <span className="text-sm text-gray-500">Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center space-x-4">
          <Users className="h-4 w-4 text-gray-500" />
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 3).map(u => (
              <Avatar key={u.id} className="h-8 w-8 border-2 border-white">
                <AvatarImage src={u?.avatar} />
                <AvatarFallback>{u?.fullName[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <ShareDialog doc={document} />
        </div>
      </header>

      {editor && (
        <div className="sticky top-[64px] z-10 bg-white px-6 py-3 flex flex-wrap gap-2 border-b">
          <Button variant={editor.isActive("bold") ? "default" : "outline"} onClick={() => editor.chain().focus().toggleBold().run()}>Bold</Button>
          <Button variant={editor.isActive("italic") ? "default" : "outline"} onClick={() => editor.chain().focus().toggleItalic().run()}>Italic</Button>
          <Button variant={editor.isActive("underline") ? "default" : "outline"} onClick={() => editor.chain().focus().toggleUnderline().run()}>Underline</Button>
          <Button variant={editor.isActive("heading", { level: 1 }) ? "default" : "outline"} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Button>
          <Button variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
          <Button onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Button>
          <Button onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Button>
          <Button onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Button>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 py-8 min-h-[700px]">
        <EditorContent editor={editor} className="prose prose-lg max-w-none" />
      </main>
    </div>
  )
}
