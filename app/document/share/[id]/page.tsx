"use client"

import { apiService, PublicDocumentDto } from "@/lib/api"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function PublicViewer() {
    const { id } = useParams()
    const [doc, setDoc] = useState<PublicDocumentDto | null>(null)
    const [loading, setLoading] = useState(true)

    const editor = useEditor({
        extensions: [StarterKit, Underline, TextAlign.configure({ types: ["heading", "paragraph"] })],
        editable: false,
        content: "",
    })

    useEffect(() => {
        async function fetchDoc() {
            setLoading(true)
            try {
                const res = await apiService.getPublicDocument(id as string)

                if (res?.data?.data) {
                    console.log(res.data?.data);
                    setDoc(res.data?.data)

                    const content = typeof res.data.data.content === "string"
                        ? JSON.parse(res.data.data.content)
                        : res.data.data.content

                    if (editor && content?.type === "doc") {
                        editor.commands.setContent(content)
                    } else {
                        console.warn("Invalid document format. Missing 'doc' root.")
                    }
                }
            } catch (error) {
                console.error("Error loading document:", error)

            } finally {
                setLoading(false)
            }
        }

        if (id) fetchDoc()
    }, [id, editor])
    console.log(doc);
    if (loading) return <div className="p-6">Loading...</div>
    if (!doc) return <div className="p-6">This document is not public or does not exist.</div>


    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-4">{doc.title}</h1>
            {/* <EditorContent editor={editor} className="prose prose-lg max-w-none" /> */}
            <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: doc.content }}
            />
        </div>
    )
}
