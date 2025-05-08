import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, AlertCircle, Info } from 'lucide-react'
import { parseTemplateVariables } from '@/lib/utils/template'
import type { PersonalizationData } from '@/lib/types/dm'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PersonalizationEditorProps {
  template: string
  personalization: PersonalizationData
  onChange: (value: PersonalizationData) => void
}

export function PersonalizationEditor({
  template,
  personalization,
  onChange,
}: PersonalizationEditorProps) {
  const [variables, setVariables] = useState<string[]>([])
  const [fallbackChains, setFallbackChains] = useState<Record<string, string[]>>({})
  const [customVariables, setCustomVariables] = useState<string[]>([])
  const [newCustomVar, setNewCustomVar] = useState('')

  // Parse template variables when template changes
  useEffect(() => {
    if (!template) {
      setVariables([])
      setFallbackChains({})
      return
    }

    const parsedVars = parseTemplateVariables(template)
    const templateVars: string[] = []
    const chains: Record<string, string[]> = {}

    parsedVars.forEach(variable => {
      if (variable.includes('|')) {
        // Handle fallback chain variables
        const fallbackChain = variable.split('|').map(v => v.trim())
        chains[variable] = fallbackChain
        
        // Add each variable in the chain to the variables list if not already present
        fallbackChain.forEach(chainVar => {
          if (!templateVars.includes(chainVar)) {
            templateVars.push(chainVar)
          }
        })
      } else {
        // Regular variable
        if (!templateVars.includes(variable)) {
          templateVars.push(variable)
        }
      }
    })

    setVariables(templateVars)
    setFallbackChains(chains)

    // Keep any custom variables that are not in the template
    setCustomVariables(prev => 
      prev.filter(customVar => !templateVars.includes(customVar))
    )
  }, [template])

  // Handle value change
  const handleValueChange = (variable: string, value: string) => {
    const updatedPersonalization = { ...personalization, [variable]: value }
    onChange(updatedPersonalization)
  }

  // Add a custom variable
  const handleAddCustomVariable = () => {
    if (!newCustomVar || variables.includes(newCustomVar) || customVariables.includes(newCustomVar)) {
      return
    }
    
    setCustomVariables(prev => [...prev, newCustomVar])
    setNewCustomVar('')
  }

  // Remove a custom variable
  const handleRemoveCustomVariable = (variable: string) => {
    setCustomVariables(prev => prev.filter(v => v !== variable))
    
    // Also remove it from personalization data
    const updatedPersonalization = { ...personalization }
    delete updatedPersonalization[variable]
    onChange(updatedPersonalization)
  }

  // Check if a variable is part of a fallback chain
  const isInFallbackChain = (variable: string) => {
    return Object.values(fallbackChains).some(chain => chain.includes(variable))
  }

  // Get fallback chain string for a variable
  const getFallbackChainString = (variable: string) => {
    for (const [key, chain] of Object.entries(fallbackChains)) {
      if (chain.includes(variable)) {
        return key
      }
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Personalization Variables</Label>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>
                  Set fallback values for template variables. You can create fallback chains 
                  in your template using the format <code>{'{{var1|var2|var3}}'}</code>.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {template && variables.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Variable</TableHead>
                <TableHead>Fallback Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable) => (
                <TableRow key={variable}>
                  <TableCell className="font-medium">
                    {variable}
                    {isInFallbackChain(variable) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="ml-2">
                              Fallback Chain
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Part of chain: {getFallbackChainString(variable)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Enter fallback value"
                      value={personalization[variable] || ''}
                      onChange={(e) => handleValueChange(variable, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Custom variables not in the template */}
              {customVariables.map((variable) => (
                <TableRow key={variable}>
                  <TableCell className="font-medium flex items-center">
                    {variable}
                    <Badge variant="secondary" className="ml-2">Custom</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-2"
                      onClick={() => handleRemoveCustomVariable(variable)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Enter value"
                      value={personalization[variable] || ''}
                      onChange={(e) => handleValueChange(variable, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center p-4 border rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No variables found in template</span>
            </div>
          </div>
        )}
      </div>

      {/* Add custom variable */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="custom-variable" className="text-sm">
            Add Custom Variable
          </Label>
          <Input
            id="custom-variable"
            placeholder="Variable name"
            value={newCustomVar}
            onChange={(e) => setNewCustomVar(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleAddCustomVariable}
          disabled={!newCustomVar || variables.includes(newCustomVar) || customVariables.includes(newCustomVar)}
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  )
} 