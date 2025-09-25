"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, CheckCircle, AlertCircle } from "lucide-react"

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    url: "",
    title: "",
    description: "",
    category: "",
    tags: "",
    submitterEmail: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSubmitStatus("idle")
    
    // TODO: 实现实际的网站提交逻辑
    console.log("Submitting website:", formData)
    
    // 模拟API调用
    setTimeout(() => {
      setIsLoading(false)
      setSubmitStatus("success")
      // 重置表单
      setFormData({
        url: "",
        title: "",
        description: "",
        category: "",
        tags: "",
        submitterEmail: ""
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-full">
              <Globe className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Submit a Website</h1>
          <p className="text-lg text-muted-foreground">
            Share a great website with our community. We&apos;ll review it and add it to our directory.
          </p>
        </div>

        {/* Success Message */}
        {submitStatus === "success" && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Website submitted successfully! We&apos;ll review it and get back to you soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {submitStatus === "error" && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Something went wrong. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Website Information</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help us review your submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Website URL */}
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

              {/* Website Title */}
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

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this website is about and why it's useful..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("description", e.target.value)}
                  required
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              {/* Category */}
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

              {/* Tags */}
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

              {/* Submitter Email */}
              <div className="space-y-2">
                <Label htmlFor="submitterEmail">Your Email (optional)</Label>
                <Input
                  id="submitterEmail"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.submitterEmail}
                  onChange={(e) => handleInputChange("submitterEmail", e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll use this to contact you about your submission status
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Website"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Submission Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-muted-foreground">
              <li>• Make sure the website is functional and accessible</li>
              <li>• Provide accurate and detailed descriptions</li>
              <li>• Check that the website isn&apos;t already in our directory</li>
              <li>• We review all submissions manually and will notify you of the status</li>
              <li>• Spam, adult content, or malicious websites will be rejected</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
