
'use client';

import type { FC } from 'react';
import { forwardRef } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoicePreviewProps {
  invoice: Invoice;
  logo: string | null;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice, logo }, ref) => {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.total || 0), 0);

  const deliveryFee = invoice.deliveryFee || 0;
  const adjustment = invoice.adjustment || 0;
  const total = subtotal + deliveryFee + adjustment;

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Data Inválida';
      // Add time to handle timezone issues
      return format(new Date(`${dateString}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data Inválida';
    }
  };

  return (
    <Card ref={ref} className="p-4 sm:p-8 shadow-lg invoice-preview bg-white text-black font-sans">
      <CardContent className="p-0">
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 sm:pb-8">
          <div className="flex-1 flex items-center gap-4">
             {logo ? (
                <div className="w-36 h-36 sm:w-40 sm:h-40 relative">
                    <Image src={logo} alt="Logo da Empresa" layout="fill" objectFit="contain" />
                </div>
            ) : (
                <div className="w-36 h-36 sm:w-40 sm:h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center">Logo da Empresa</span>
                </div>
            )}
            {/* Nome da empresa removido: a logo substitui o texto */}
          </div>
          <div className="text-right">
            <h1 className="text-base font-semibold font-headline text-blue-600">Nota de pagamento</h1>
            <p className="text-xs text-gray-500 break-all mt-1">Ref: {invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500 mt-1">{formatDate(invoice.issueDate)}</p>
          </div>
        </header>

        <Separator className="my-4 sm:my-6 bg-gray-200" />

        <section className="pb-4 sm:pb-8">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <h2 className="font-semibold font-headline text-sm mb-1 text-gray-500">POR CLIENTE</h2>
                    <p className="font-bold text-2xl sm:text-3xl">{invoice.clientName || 'Nome do Cliente'}</p>
                </div>
                 <div className="text-right">
                    <h2 className="font-semibold font-headline text-sm mb-1 text-gray-500">TIPO DE SERVIÇO</h2>
                    <p className="font-bold text-base sm:text-lg">{invoice.service || 'Serviço Prestado'}</p>
                 </div>
             </div>
        </section>

        <section>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="font-headline text-gray-600">REF.</TableHead>
                  <TableHead className="font-headline text-gray-600">DESCRIÇÃO</TableHead>
                  <TableHead className="text-right font-headline text-gray-600">VALOR FINAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.length > 0 ? invoice.items.map((item) => (
                    <TableRow key={item.id} className="border-b-gray-200">
                      <TableCell>{item.ref || '-'}</TableCell>
                      <TableCell className="font-medium">{item.description || 'Descrição do Item'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.total || 0)}</TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">Nenhum item adicionado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
        
        <Separator className="my-4 sm:my-6 bg-gray-200" />

        <section className="flex justify-end">
            <div className='w-full max-w-xs'>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                </div>
                 {deliveryFee !== 0 && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Taxa de Entrega</span>
                        <span className="text-gray-800">{formatCurrency(deliveryFee)}</span>
                    </div>
                )}
                 {adjustment !== 0 && (
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">{adjustment > 0 ? 'Acréscimo' : 'Desconto'}</span>
                        <span className="text-gray-800">{formatCurrency(adjustment)}</span>
                    </div>
                )}
                <Separator className="my-2 bg-gray-200" />
                 <div className="flex justify-between items-center mt-2">
                    <span className="font-bold text-lg font-headline text-blue-600">Valor Final</span>
                    <span className="font-bold text-lg text-blue-600">{formatCurrency(total)}</span>
                </div>
            </div>
        </section>

        <footer className="pt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500">Aguardando o pagamento e o envio do comprovante</p>
        </footer>

      </CardContent>
    </Card>
  );
});

InvoicePreview.displayName = 'InvoicePreview';
