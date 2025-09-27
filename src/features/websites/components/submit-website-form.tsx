"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface SubmitWebsiteFormProps {
  title?: string
  description?: string
  redirectOnUnauthed?: boolean
}

export function SubmitWebsiteForm({
  title = "Submit a Website",
  description = "Share a great website with our community. We'll review it and add it to our directory.",
  redirectOnUnauthed = true,
}: SubmitWebsiteFormProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    category: "",
    tags: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: 接入真实的提交逻辑
    console.log("Submitting website:", formData)

    // 模拟 API 调用
    setTimeout(() => {
      setIsLoading(false)
      setFormData({
        url: "",
        title: "",
        description: "",
        category: "",
        tags: "",
      })
    }, 2000)
  }

  if (redirectOnUnauthed && isLoaded && !isSignedIn) {
    router.push("/sign-in")
    return null
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Website Information</CardTitle>
          <CardDescription>Provide as much detail as possible to help us review your submission.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => handleInputChange("url", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Website Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter website title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what this website is about and why it's useful..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange("description", e.target.value)
                }
                required
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                type="text"
                placeholder="e.g., Development, Design, Productivity"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                type="text"
                placeholder="e.g., react, javascript, frontend (comma separated)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Website"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submission Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Ensure the website is functional and accessible.</li>
            <li>• Provide accurate and detailed descriptions.</li>
            <li>• Check that the website isn't already in our directory.</li>
            <li>• All submissions are reviewed manually before publishing.</li>
            <li>• Spam, adult content, or malicious websites will be rejected.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubmitWebsiteForm
