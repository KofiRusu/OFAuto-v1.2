'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  MessageSquare, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  X,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import Link from 'next/link'

interface ScheduledTask {
  id: string
  type: 'post' | 'message'
  title: string
  description: string
  scheduledFor: Date
  status: 'scheduled' | 'processing' | 'completed' | 'failed'
}

export default function OnlyFansSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  
  // Mock scheduled tasks
  const scheduledTasks: ScheduledTask[] = [
    {
      id: 'task-1',
      type: 'post',
      title: 'Weekly subscription promo',
      description: 'Special discount for new subscribers. Check it out!',
      scheduledFor: new Date(2023, 6, 15, 12, 0),
      status: 'scheduled'
    },
    {
      id: 'task-2',
      type: 'post',
      title: 'New photo set teaser',
      description: 'Preview of upcoming beach photoshoot',
      scheduledFor: new Date(2023, 6, 15, 18, 30),
      status: 'scheduled'
    },
    {
      id: 'task-3',
      type: 'message',
      title: 'Renewal reminder to expiring subscribers',
      description: 'Message to subscribers whose subscription expires in the next 3 days',
      scheduledFor: new Date(2023, 6, 16, 10, 0),
      status: 'scheduled'
    },
    {
      id: 'task-4',
      type: 'post',
      title: 'Behind the scenes video',
      description: 'Exclusive video footage from yesterday\'s shoot',
      scheduledFor: new Date(2023, 6, 18, 14, 0),
      status: 'scheduled'
    }
  ]
  
  // Get tasks for the selected date
  const getDayTasks = (date: Date | undefined) => {
    if (!date) return []
    
    return scheduledTasks.filter(task => {
      const taskDate = new Date(task.scheduledFor)
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear()
    }).sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
  }
  
  // Check if a date has tasks
  const hasTasksOnDate = (date: Date) => {
    return scheduledTasks.some(task => {
      const taskDate = new Date(task.scheduledFor)
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear()
    })
  }
  
  // Format time from Date object
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  // Get tasks for selected date
  const tasksForSelectedDate = getDayTasks(selectedDate)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/automation/onlyfans" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">Content Schedule</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/automation/onlyfans">
              Automation Dashboard
            </Link>
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Scheduled Task
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Select a date to view scheduled tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasTasks: (date) => hasTasksOnDate(date)
              }}
              modifiersClassNames={{
                hasTasks: "bg-blue-50 font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              }}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
          </CardFooter>
        </Card>
        
        {/* Tasks for selected date */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5" />
              <span>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'No date selected'}
              </span>
            </CardTitle>
            <CardDescription>
              {tasksForSelectedDate.length > 0 
                ? `${tasksForSelectedDate.length} scheduled tasks` 
                : 'No tasks scheduled for this date'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {tasksForSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {tasksForSelectedDate.map(task => (
                    <div key={task.id} className="border rounded-md overflow-hidden">
                      <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={task.type === 'post' ? 'default' : 'secondary'} className="capitalize">
                            {task.type === 'post' ? (
                              <FileText className="mr-1 h-3 w-3" />
                            ) : (
                              <MessageSquare className="mr-1 h-3 w-3" />
                            )}
                            {task.type}
                          </Badge>
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="flex items-center mr-2">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatTime(task.scheduledFor)}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No tasks scheduled</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No content or messages scheduled for this date.
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule New Task
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>
            View all your upcoming scheduled tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {scheduledTasks.length > 0 ? (
              scheduledTasks
                .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
                .map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between py-2 px-4 hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {task.type === 'post' ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-3">
                        {task.scheduledFor.toLocaleDateString()} at {formatTime(task.scheduledFor)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center py-4 text-muted-foreground">No upcoming tasks</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm">View All Tasks</Button>
        </CardFooter>
      </Card>
    </div>
  )
} 