
'use client';

import type { FC } from 'react';
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { invoiceSchema } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoUploader } from '@/components/logo-uploader';
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, roundToNearestTenCents } from '@/lib/utils';

interface InvoiceEditorProps {
  invoice: Invoice;
  onInvoiceChange: (invoice: Invoice) => void;
  logo: string | null;
  onLogoChange: (logo: string | null) => void;
}

export const InvoiceEditor: FC<InvoiceEditorProps> = ({ invoice, onInvoiceChange, logo, onLogoChange }) => {
  const form = useForm<Invoice>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const items = form.watch('items');

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Auto-calculate total when quantity, unitPrice, or isRisk changes
      if (name && (name.includes('.quantity') || name.includes('.unitPrice') || name.includes('.isRisk'))) {
        const itemIndex = parseInt(name.split('.')[1], 10);
        if (!isNaN(itemIndex)) {
          const item = form.getValues(`items.${itemIndex}`);
          let newTotal = (item.quantity || 0) * (item.unitPrice || 0);
          if (item.isRisk) {
            newTotal = newTotal / 100;
          }
          const roundedTotal = roundToNearestTenCents(newTotal);
          form.setValue(`items.${itemIndex}.total`, roundedTotal, { shouldDirty: true, shouldValidate: true });
        }
      }

      if (type === 'change') {
          form.trigger().then(isValid => {
              if(isValid) {
                  onInvoiceChange(value as Invoice);
              }
          })
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onInvoiceChange]);

  const handleNumericInput = (field: any, value: string) => {
    const parsedValue = parseFloat(value);
    field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Sua Empresa</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <LogoUploader logo={logo} onLogoChange={onLogoChange} />
            </div>
            <div className="flex-grow space-y-4">
              <FormField name="companyName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Nome da Empresa</FormLabel><FormControl><Input placeholder="Sua Empresa Inc." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Detalhes da Nota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <FormField name="clientName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
             <FormField name="service" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Tipo de Serviço</FormLabel><FormControl><Input placeholder="Ex: Instalação de Rodapés" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="invoiceNumber" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Ref. da Nota</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="issueDate" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Data</FormLabel><FormControl><Input type="date" {...field} disabled /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-2 items-end p-3 border rounded-md"
              >
                <div className="col-span-12 md:col-span-2 space-y-1">
                    <FormField name={`items.${index}.ref`} control={form.control} render={({ field }) => (
                      <FormItem><FormLabel className={index !== 0 ? 'sr-only' : ''}>Referência</FormLabel><FormControl><Input placeholder="Referência" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="col-span-12 md:col-span-7 space-y-1">
                    <FormField name={`items.${index}.description`} control={form.control} render={({ field }) => (
                      <FormItem><FormLabel className={index !== 0 ? 'sr-only' : ''}>Descrição</FormLabel><FormControl><Input placeholder="Descrição do item" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <div className="col-span-full hidden">
                    <FormField
                        control={form.control}
                        name={`items.${index}.isRisk`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-2">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                    É um risco? (medido em cm)
                                </FormLabel>
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="col-span-4 space-y-1 hidden">
                  <FormField name={`items.${index}.quantity`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>QUANTIDADE/COMPRIMENTO</FormLabel><FormControl><Input type="number" placeholder="1" {...field} onChange={e => handleNumericInput(field, e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-4 space-y-1 hidden">
                  <FormField name={`items.${index}.unitPrice`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Valor Unit. (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="10,00" {...field} onChange={e => handleNumericInput(field, e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <div className="col-span-12 md:col-span-2 space-y-1">
                  <FormField name={`items.${index}.total`} control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Valor Final (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => handleNumericInput(field, e.target.value)} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="col-span-12 md:col-span-1 flex md:items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive md:w-full ml-auto"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ id: `item-${Date.now()}`, ref: '', description: '', isRisk: false, quantity: 1, unitPrice: 0, total: 0 })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Ajuste Final</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField name="deliveryFee" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Taxa de Entrega</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} onChange={e => handleNumericInput(field, e.target.value)} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="adjustment" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Desconto ou Acréscimo</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} onChange={e => handleNumericInput(field, e.target.value)} /></FormControl>
                <FormDescription>Use um valor negativo para descontos (ex: -50.00).</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
