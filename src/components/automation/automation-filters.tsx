import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { TriggerType } from '@/lib/orchestration/triggerEngine';

interface AutomationFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  triggerType?: TriggerType;
  setTriggerType?: (value: TriggerType | undefined) => void;
  isActive?: boolean | undefined;
  setIsActive?: (value: boolean | undefined) => void;
  platformFilter?: string;
  setPlatformFilter?: (value: string | undefined) => void;
  showFilters?: boolean;
  setShowFilters?: (value: boolean) => void;
}

export default function AutomationFilters({
  searchTerm,
  setSearchTerm,
  triggerType,
  setTriggerType,
  isActive,
  setIsActive,
  platformFilter,
  setPlatformFilter,
  showFilters = false,
  setShowFilters
}: AutomationFiltersProps) {
  // Calculate if any filters are active
  const hasActiveFilters = Boolean(triggerType || isActive !== undefined || platformFilter);
  
  // Reset all filters
  const handleResetFilters = () => {
    if (setTriggerType) setTriggerType(undefined);
    if (setIsActive) setIsActive(undefined);
    if (setPlatformFilter) setPlatformFilter(undefined);
  };
  
  // Trigger type options
  const triggerTypeOptions = [
    { value: TriggerType.SUBSCRIPTION_DIP, label: 'Subscription Dip' },
    { value: TriggerType.ROI_THRESHOLD, label: 'ROI Threshold' },
    { value: TriggerType.CAMPAIGN_UNDERPERFORMANCE, label: 'Campaign Underperformance' },
    { value: TriggerType.CONTENT_PERFORMANCE, label: 'Content Performance' },
    { value: TriggerType.EXPERIMENT_CONCLUSION, label: 'Experiment Conclusion' }
  ];
  
  // Platform options
  const platformOptions = [
    { value: 'onlyfans', label: 'OnlyFans' },
    { value: 'fansly', label: 'Fansly' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' }
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative grow">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {(setShowFilters && setTriggerType && setIsActive && setPlatformFilter) && (
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              </span>
            )}
          </Button>
        )}
      </div>
      
      {showFilters && setTriggerType && setIsActive && setPlatformFilter && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="triggerType">Trigger Type</Label>
                <Select
                  value={triggerType}
                  onValueChange={(value) => setTriggerType(value as TriggerType || undefined)}
                >
                  <SelectTrigger id="triggerType">
                    <SelectValue placeholder="All trigger types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All trigger types</SelectItem>
                    {triggerTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={platformFilter}
                  onValueChange={(value) => setPlatformFilter(value || undefined)}
                >
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All platforms</SelectItem>
                    {platformOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active only</Label>
                  <Switch
                    id="isActive"
                    checked={isActive === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setIsActive(true);
                      } else if (isActive === true) {
                        setIsActive(undefined);
                      } else {
                        setIsActive(false);
                      }
                    }}
                  />
                </div>
                
                {isActive === false && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isInactive">Inactive only</Label>
                    <Switch
                      id="isInactive"
                      checked={isActive === false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setIsActive(false);
                        } else {
                          setIsActive(undefined);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {hasActiveFilters && (
              <div className="mt-6 flex flex-wrap gap-2">
                {triggerType && (
                  <Badge variant="secondary" className="gap-1">
                    {triggerTypeOptions.find(o => o.value === triggerType)?.label}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setTriggerType(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {platformFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {platformOptions.find(o => o.value === platformFilter)?.label}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setPlatformFilter(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {isActive !== undefined && (
                  <Badge variant="secondary" className="gap-1">
                    {isActive ? 'Active' : 'Inactive'}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => setIsActive(undefined)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={handleResetFilters}
                >
                  Reset all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Show just search term filter badges if not showing the full filter UI */}
      {!showFilters && searchTerm && (
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="gap-1">
            Search: {searchTerm}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
} 