import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EyeIcon, RefreshCw } from 'lucide-react'
import { createTemplateSamplePreview, applyTemplate } from '@/lib/utils/template'
import type { PersonalizationData } from '@/lib/types/dm'

interface TemplatePreviewProps {
  template: string
  personalization?: PersonalizationData
  previewMode?: 'sample' | 'personalized'
}

export function TemplatePreview({
  template,
  personalization = {},
  previewMode = 'personalized',
}: TemplatePreviewProps) {
  const [previewContent, setPreviewContent] = useState<string>('')
  const [useSample, setUseSample] = useState<boolean>(previewMode === 'sample')

  useEffect(() => {
    if (!template) {
      setPreviewContent('')
      return
    }

    if (useSample) {
      // Use sample data for all variables
      setPreviewContent(createTemplateSamplePreview(template, personalization))
    } else {
      // Use provided personalization data
      setPreviewContent(applyTemplate(template, personalization))
    }
  }, [template, personalization, useSample])

  const togglePreviewMode = () => {
    setUseSample(prev => !prev)
  }

  // Function to highlight variables in the content
  const highlightVariables = (content: string) => {
    if (!content) return null
    
    // Replace {{variable}} with highlighted span
    const parts = content.split(/(\{\{[^}]+\}\})/g)
    
    return parts.map((part, index) => {
      if (part.match(/^\{\{[^}]+\}\}$/)) {
        // This is a variable placeholder
        const varName = part.slice(2, -2)
        return (
          <Badge key={index} variant="outline" className="font-mono bg-muted">
            {part}
          </Badge>
        )
      }
      
      return <span key={index}>{part}</span>
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Template Preview</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={togglePreviewMode}
          className="h-8 gap-1"
        >
          {useSample ? (
            <>
              <EyeIcon className="h-3.5 w-3.5" />
              <span>View Personalized</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>View Sample</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-md bg-card whitespace-pre-wrap">
          {useSample ? (
            // Sample preview - no highlighting
            previewContent || (
              <span className="text-muted-foreground">Preview will appear here...</span>
            )
          ) : (
            // Personalized view with variable highlighting
            template ? (
              highlightVariables(template)
            ) : (
              <span className="text-muted-foreground">No template content to preview</span>
            )
          )}
        </div>
        
        <div className="mt-2">
          <Badge variant={useSample ? "default" : "outline"}>
            {useSample ? "Sample Preview" : "Template with Variables"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
} 