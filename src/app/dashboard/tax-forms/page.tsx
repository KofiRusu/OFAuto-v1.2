'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TaxFormTypeSchema } from '@/lib/schemas/taxForm';
import { trpc } from '@/lib/trpc/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

// Form schema for creating a tax form
const createTaxFormSchema = z.object({
  year: z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  type: TaxFormTypeSchema,
});

type CreateTaxFormValues = z.infer<typeof createTaxFormSchema>;

// Form schema for generating a tax form
const generateTaxFormSchema = z.object({
  id: z.string().uuid('Invalid tax form ID'),
  totalIncome: z.coerce.number().min(0),
  platformFees: z.coerce.number().min(0),
  currency: z.string().default('$'),
});

type GenerateTaxFormValues = z.infer<typeof generateTaxFormSchema>;

export default function TaxFormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('create');
  const [selectedTaxForm, setSelectedTaxForm] = useState<string | null>(null);
  
  // Create form setup
  const createForm = useForm<CreateTaxFormValues>({
    resolver: zodResolver(createTaxFormSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      type: 'US_1099',
    },
  });
  
  // Generate form setup
  const generateForm = useForm<GenerateTaxFormValues>({
    resolver: zodResolver(generateTaxFormSchema),
    defaultValues: {
      id: '',
      totalIncome: 0,
      platformFees: 0,
      currency: '$',
    },
  });
  
  // Queries and mutations
  const taxFormsList = trpc.taxForm.list.useQuery({});
  const createTaxFormMutation = trpc.taxForm.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Tax form created',
        description: 'Your tax form has been created successfully.',
      });
      taxFormsList.refetch();
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const generatePdfMutation = trpc.taxForm.generatePdf.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'PDF Generated',
        description: 'Your tax form PDF has been generated successfully.',
        action: (
          <Button variant="outline" size="sm" asChild>
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download
            </a>
          </Button>
        ),
      });
      taxFormsList.refetch();
      generateForm.reset();
      setActiveTab('view');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Event handlers
  const onCreateSubmit = (values: CreateTaxFormValues) => {
    createTaxFormMutation.mutate(values);
  };
  
  const onGenerateSubmit = (values: GenerateTaxFormValues) => {
    // Calculate net income
    const netIncome = values.totalIncome - values.platformFees;
    
    // Prepare data for PDF generation
    const pdfData = {
      totalIncome: values.totalIncome.toFixed(2),
      platformFees: values.platformFees.toFixed(2),
      netIncome: netIncome.toFixed(2),
      currency: values.currency,
      // Add income breakdown
      incomeBreakdown: [
        { category: 'Platform Revenue', amount: values.totalIncome.toFixed(2) },
        { category: 'Platform Fees', amount: `-${values.platformFees.toFixed(2)}` },
      ],
    };
    
    generatePdfMutation.mutate({
      id: values.id,
      data: pdfData,
    });
  };
  
  const handleSelectTaxForm = (id: string) => {
    setSelectedTaxForm(id);
    generateForm.setValue('id', id);
    setActiveTab('generate');
  };
  
  // Helper function to format date
  const formatDate = (date: Date) => {
    return format(new Date(date), 'PP');
  };
  
  // Helper function to get form type label
  const getFormTypeLabel = (type: string) => {
    switch (type) {
      case 'US_1099': return '1099 Form (US)';
      case 'EU_VAT': return 'VAT Form (EU)';
      case 'OTHER': return 'Other Tax Form';
      default: return type;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Tax Forms</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="create">Create Tax Form</TabsTrigger>
          <TabsTrigger value="generate">Generate PDF</TabsTrigger>
          <TabsTrigger value="view">View My Forms</TabsTrigger>
        </TabsList>
        
        {/* Create Tax Form Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Tax Form</CardTitle>
              <CardDescription>
                Set up the basic tax form information. You'll be able to generate the actual PDF later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                  <FormField
                    control={createForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the tax year for this form.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select form type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US_1099">1099 Form (US)</SelectItem>
                            <SelectItem value="EU_VAT">VAT Form (EU)</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of tax form you need.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createTaxFormMutation.isLoading}
                  >
                    {createTaxFormMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Tax Form'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Generate PDF Tab */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate Tax Form PDF</CardTitle>
              <CardDescription>
                Enter your income details to generate a PDF tax form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedTaxForm && taxFormsList.data?.length === 0 ? (
                <div className="text-center py-6">
                  <p>You need to create a tax form first.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('create')}
                  >
                    Create Tax Form
                  </Button>
                </div>
              ) : (
                <Form {...generateForm}>
                  <form onSubmit={generateForm.handleSubmit(onGenerateSubmit)} className="space-y-6">
                    <FormField
                      control={generateForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Tax Form</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a tax form" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taxFormsList.data?.map((form) => (
                                <SelectItem key={form.id} value={form.id}>
                                  {getFormTypeLabel(form.type)} - {form.year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose which tax form you want to generate.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generateForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="$">USD ($)</SelectItem>
                              <SelectItem value="€">EUR (€)</SelectItem>
                              <SelectItem value="£">GBP (£)</SelectItem>
                              <SelectItem value="¥">JPY (¥)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select your currency.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generateForm.control}
                      name="totalIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Income</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter your total income for the tax period.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={generateForm.control}
                      name="platformFees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform Fees</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the total platform fees paid.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={generatePdfMutation.isLoading}
                    >
                      {generatePdfMutation.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        'Generate PDF'
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* View Tax Forms Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>My Tax Forms</CardTitle>
              <CardDescription>
                View and download your tax forms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxFormsList.isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : taxFormsList.data?.length === 0 ? (
                <div className="text-center py-6">
                  <p>You haven't created any tax forms yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('create')}
                  >
                    Create Tax Form
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taxFormsList.data?.map((form) => (
                    <Card key={form.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="bg-gray-100 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{getFormTypeLabel(form.type)}</h3>
                              <p className="text-sm text-gray-600">Year: {form.year}</p>
                              <p className="text-sm text-gray-600">
                                Created: {formatDate(form.generatedAt)}
                              </p>
                            </div>
                            <FileText className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="p-4 flex justify-between">
                          {form.pdfUrl ? (
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={form.pdfUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </a>
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectTaxForm(form.id)}
                            >
                              Generate PDF
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 