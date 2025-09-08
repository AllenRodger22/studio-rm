
'use client';

import type { FC } from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, FilePlus, FileText, Search, X } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Invoice } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { InvoiceEditor } from '@/components/invoice-editor';
import { InvoicePreview } from '@/components/invoice-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const createDefaultInvoice = (defaultCompanyName: string): Invoice => ({
  id: crypto.randomUUID(),
  invoiceNumber: crypto.randomUUID(),
  clientName: '',
  service: 'Serviço Prestado',
  issueDate: format(new Date(), 'yyyy-MM-dd'),
  items: [{ id: `item-${Date.now()}`, ref: '', description: '', quantity: 1, unitPrice: 0, total: 0 }],
  companyName: defaultCompanyName || 'Sua Empresa',
  pricePerMeter: 0,
  deliveryFee: 0,
  adjustment: 0,
});

const Page: FC = () => {
  const { toast } = useToast();
  const [logo, setLogo] = useLocalStorage<string | null>('rj-notas-logo', null);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('rj-notas-invoices', []);
  const [companyName, setCompanyName] = useLocalStorage<string>('rj-notas-company-name', 'Sua Empresa');
  
  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(() => createDefaultInvoice(companyName));
  
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync currentInvoice with local storage on initial load
  useEffect(() => {
    if (isClient) {
        if (invoices.length > 0) {
            // Check if currentInvoice (or its id) exists in the invoices list
            const currentExists = invoices.some(inv => inv.id === currentInvoice.id);
            if (!currentExists) {
              setCurrentInvoice(invoices[0]);
            }
        } else {
            const initialInvoice = createDefaultInvoice(companyName);
            setCurrentInvoice(initialInvoice);
            setInvoices([initialInvoice]);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, companyName]);


  const previewRef = useRef<HTMLDivElement>(null);

  const handleNewInvoice = () => {
    const newInvoice = createDefaultInvoice(companyName);
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    setCurrentInvoice(newInvoice);
    toast({
      title: 'Nova Nota',
      description: 'Nova nota de pagamento criada.',
    });
    setActiveTab('editor');
  };

  const handleInvoiceChange = useCallback((updatedInvoice: Invoice) => {
    // Save company name to local storage whenever it changes in the editor
    if (updatedInvoice.companyName !== companyName) {
      setCompanyName(updatedInvoice.companyName);
    }
    
    // Always use today's date for issueDate
    const finalInvoice = {
      ...updatedInvoice,
      issueDate: format(new Date(), 'yyyy-MM-dd')
    };

    setCurrentInvoice(finalInvoice);
    
    setInvoices(prevInvoices => {
        const existingIndex = prevInvoices.findIndex((inv) => inv.id === finalInvoice.id);
        if (existingIndex > -1) {
            const updatedInvoices = [...prevInvoices];
            updatedInvoices[existingIndex] = finalInvoice;
            return updatedInvoices;
        }
        return [finalInvoice, ...prevInvoices];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName, setCompanyName]);

  const handleDownloadImage = useCallback(async () => {
    const node = previewRef.current;
    if (!node) return;
    try {
      const dataUrl = await toJpeg(node, {
        cacheBust: true,
        pixelRatio: 3,
        quality: 0.92,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `nota-${currentInvoice.clientName.replace(/\s/g, '_') || 'nota'}.jpeg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Falha no Download',
        description: 'Não foi possível gerar a imagem JPEG.',
      });
    }
  }, [currentInvoice.clientName, toast]);
  
  const handleDownloadPdf = useCallback(async () => {
      const node = previewRef.current;
      if (!node) return;

      try {
          const dataUrl = await toJpeg(node, { pixelRatio: 2 });
          
          // Use the actual dimensions of the node for the PDF
          const pdf = new jsPDF({
            orientation: node.offsetWidth > node.offsetHeight ? 'l' : 'p',
            unit: 'px',
            format: [node.offsetWidth, node.offsetHeight]
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`nota-${currentInvoice.clientName.replace(/\s/g, '_') || 'nota'}.pdf`);
      } catch (error) {
          console.error('oops, something went wrong!', error);
          toast({
              variant: 'destructive',
              title: 'Falha no PDF',
              description: 'Não foi possível gerar o arquivo PDF.',
          });
      }
  }, [currentInvoice.clientName, toast]);

  const selectInvoiceToEdit = (invoice: Invoice) => {
    setCurrentInvoice(invoice);
    setActiveTab('editor');
  }

  const handleDeleteInvoice = (id: string) => {
    const updatedInvoices = invoices.filter(inv => inv.id !== id);
    setInvoices(updatedInvoices);
    
    // If the deleted invoice was the current one, select a new one or create one
    if (currentInvoice.id === id) {
      if (updatedInvoices.length > 0) {
        setCurrentInvoice(updatedInvoices[0]);
      } else {
        handleNewInvoice(); 
        // handleNewInvoice switches to editor, so we need to switch back if we are in the "notas" tab
        setActiveTab('notas');
      }
    }
    
    toast({
        title: 'Nota Apagada',
        description: 'A nota de pagamento foi apagada com sucesso.',
    });
    setInvoiceToDelete(null);
  };

  const openDeleteConfirmation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setInvoiceToDelete(id);
  };

  const filteredInvoices = invoices.filter(invoice => 
    (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold font-headline text-primary text-center">Gerador de Nota de Pagamento</h1>
        <div className="flex gap-2">
            <Button onClick={handleNewInvoice}><FilePlus /> Nova Nota</Button>
        </div>
      </header>

      <main className="p-2 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="editor" className="flex-1">Editor</TabsTrigger>
            <TabsTrigger value="notas" className="flex-1">Minhas Notas</TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <InvoiceEditor
                key={currentInvoice.id} // Add key to force re-render on invoice change
                invoice={currentInvoice}
                onInvoiceChange={handleInvoiceChange}
                logo={logo}
                onLogoChange={setLogo}
              />
              <div id="invoice-preview-container">
                <InvoicePreview ref={previewRef} invoice={currentInvoice} logo={logo} />
                <div className='flex justify-center gap-2 mt-4'>
                    <Button variant="outline" size="sm" onClick={handleDownloadImage} className="bg-green-600 text-white hover:bg-green-700 hover:text-white"><Download className="h-4 w-4 mr-2" />Gerar JPEG</Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="bg-green-600 text-white hover:bg-green-700 hover:text-white"><FileText className="h-4 w-4 mr-2" />Gerar PDF</Button>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="notas">
             <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por cliente ou Ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
             </div>
             <ScrollArea className="h-[70vh]">
                <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                    <Card key={invoice.id} className="cursor-pointer hover:border-primary relative group" onClick={() => selectInvoiceToEdit(invoice)}>
                         <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 z-10 hidden w-6 h-6 rounded-full group-hover:flex"
                            onClick={(e) => openDeleteConfirmation(e, invoice.id)}
                            >
                            <X className="w-4 h-4" />
                         </Button>
                        <CardContent className="p-2 sm:p-4">
                           <div className="transform scale-50 origin-top-left">
                                <InvoicePreview 
                                    invoice={invoice} 
                                    logo={logo} 
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
             </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
        <AlertDialog open={invoiceToDelete !== null} onOpenChange={(isOpen) => !isOpen && setInvoiceToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso apagará permanentemente a nota de pagamento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setInvoiceToDelete(null); }}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={(e) => { e.stopPropagation(); if(invoiceToDelete) handleDeleteInvoice(invoiceToDelete); }}>Apagar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default Page;

    
