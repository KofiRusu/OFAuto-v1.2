import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { PersonalizationEditor } from "@/components/dm/PersonalizationEditor"
import { TemplatePreview } from "@/components/dm/TemplatePreview"
import type { PersonalizationData } from "@/lib/types/dm"
import { useState } from "react"
import { ArrowLeft, Save, SendIcon } from "lucide-react"
import Link from "next/link"

export default function DMCampaignCreatePage() {
  const [name, setName] = useState("")
  const [platform, setPlatform] = useState<string>("")
  const [targetAudience, setTargetAudience] = useState("")
  const [messageTemplate, setMessageTemplate] = useState("")
  const [personalization, setPersonalization] = useState<PersonalizationData>({})
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState("basic")

  const handlePersonalizationChange = (value: PersonalizationData) => {
    setPersonalization(value)
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/automation/dm-campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Create DM Campaign</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            Save Draft
          </Button>
          <Button>
            <SendIcon className="mr-2 h-4 w-4" />
            Activate Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Campaign Details</TabsTrigger>
          <TabsTrigger value="template">Message Template</TabsTrigger>
          <TabsTrigger value="personalization">Personalization</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of your DM campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter campaign name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onlyfans">OnlyFans</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Textarea 
                  id="target-audience" 
                  placeholder="Describe your target audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker 
                  date={startDate}
                  setDate={setStartDate}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => setActiveTab("template")}>
              Continue to Message Template
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Template</CardTitle>
              <CardDescription>
                Create your message template with personalization variables using {{variableName}} format.
                You can create fallback chains with {{var1|var2|var3}} format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-template">Message Template</Label>
                <Textarea 
                  id="message-template" 
                  placeholder="Hey {{firstName|name|username}}, thanks for following me on {{platform}}! Check out my exclusive content at {{profileUrl}}."
                  className="min-h-[200px]"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Use {{variableName}} format to add personalization variables. Example: Hey {{firstName}}, thanks for following me!
                </p>
                <p className="text-sm text-muted-foreground">
                  For fallback chains, use the format {{var1|var2|var3}} - the system will try each variable in order until a non-empty value is found.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("basic")}>
              Back
            </Button>
            <Button onClick={() => setActiveTab("personalization")}>
              Continue to Personalization
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="personalization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalization</CardTitle>
              <CardDescription>
                Set default fallback values for personalization variables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonalizationEditor
                template={messageTemplate}
                personalization={personalization}
                onChange={handlePersonalizationChange}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("template")}>
              Back
            </Button>
            <Button onClick={() => setActiveTab("preview")}>
              Continue to Preview
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p>{name || "Untitled Campaign"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Platform</Label>
                    <p className="capitalize">{platform || "Not selected"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Start Date</Label>
                    <p>{startDate?.toLocaleDateString() || "Not set"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Target Audience</Label>
                    <p className="line-clamp-2">{targetAudience || "Not specified"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <TemplatePreview 
              template={messageTemplate}
              personalization={personalization}
              previewMode="sample"
            />
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("personalization")}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button>
                <SendIcon className="mr-2 h-4 w-4" />
                Activate Campaign
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 