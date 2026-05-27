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

const CPF = '857.154.093-49';

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
      return format(new Date(`${dateString}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data Inválida';
    }
  };

  return (
    <Card 
      ref={ref} 
      className="invoice-preview bg-white text-black font-sans shadow-lg"
      style={{ 
        width: '600px',        // Largura fixa ideal para PDF
        maxWidth: '600px',
        margin: '0 auto',
        padding: '32px' 
      }}
    >
      <CardContent className="p-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6">
          <div className="flex-1 flex items-center gap-4">
            {logo ? (
              <div className="w-32 h-32 relative flex-shrink-0">
                <Image src={logo} alt="Logo" fill className="object-contain" />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-gray-500">Logo</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <h1 className="text-lg font-semibold text-blue-600">Nota de pagamento</h1>
            <p className="text-xs text-gray-500 mt-1">Ref: {invoice.invoiceNumber}</p>
            <p className="text-xl font-cursive text-gray-700 mt-1">Rosania Moreira Aragao</p>
            <p className="text-sm text-gray-500">CPF: {CPF}</p>
            <p className="text-sm text-gray-500">{formatDate(invoice.issueDate)}</p>
          </div>
        </header>

        <Separator className="my-6" />

        {/* Cliente e Serviço */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-500 mb-1">POR CLIENTE</p>
            <p className="font-bold text-2xl">{invoice.clientName || 'Nome do Cliente'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">TIPO DE SERVIÇO</p>
            <p className="font-bold">{invoice.service || 'Serviço Prestado'}</p>
          </div>
        </div>

        {/* TABELA - Muito mais controlada */}
        <div className="mb-8">
          <Table className="w-full table-fixed border-collapse" style={{ width: '100%' }}>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="w-20 py-3 text-sm">REF.</TableHead>
                <TableHead className="py-3 text-sm">DESCRIÇÃO</TableHead>
                <TableHead className="w-28 py-3 text-right text-sm">VALOR FINAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.length > 0 ? invoice.items.map((item) => (
                <TableRow key={item.id} className="border-b">
                  <TableCell className="py-3 text-sm align-top">{item.ref || '-'}</TableCell>
                  <TableCell className="py-3 text-sm align-top break-all break-words leading-tight">
                    {item.description}
                  </TableCell>
                  <TableCell className="py-3 text-right font-semibold text-sm align-top">
                    {formatCurrency(item.total || 0)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Separator className="my-6" />

        {/* Totais */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee !== 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxa de Entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            {adjustment !== 0 && (
              <div className="flex justify-between text-sm">
                <span>{adjustment > 0 ? 'Acréscimo' : 'Desconto'}</span>
                <span>{formatCurrency(adjustment)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-blue-600">
              <span>Valor Final</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-gray-500">
          Aguardando o pagamento e o envio do comprovante
        </footer>
      </CardContent>
    </Card>
  );
});

InvoicePreview.displayName = 'InvoicePreview';
