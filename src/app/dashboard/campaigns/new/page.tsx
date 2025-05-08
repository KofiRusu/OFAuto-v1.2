'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CampaignForm } from '@/components/dashboard/campaigns/CampaignForm'
import { useToast } from '@/components/ui/use-toast'

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const handleCancel = () => {
    router.push('/dashboard/campaigns')
  }
  
  const handleSubmit = (data) => {
    // In a real implementation, this would call your API
    console.log('Campaign data:', data)
    
    toast({
      title: "Campaign created",
      description: data.saveAsDraft 
        ? "Campaign has been saved as a draft."
        : "Campaign has been created and activated."
    })
    
    router.push('/dashboard/campaigns')
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCancel}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Create Campaign</h1>
      </div>
      
      <Card className="p-6">
        <CampaignForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </Card>
    </div>
  )
} 