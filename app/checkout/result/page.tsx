'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

function CheckoutResultContent() {
    const searchParams = useSearchParams();

    // Parámetros que envía Mercado Pago
    const status = searchParams.get('status') || searchParams.get('collection_status');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
    const externalReference = searchParams.get('external_reference');
    const preferenceId = searchParams.get('preference_id');
    const paymentType = searchParams.get('payment_type');

    const getStatusInfo = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle className="h-16 w-16 text-emerald-500" />,
                    title: '¡Pago Exitoso!',
                    message: 'Tu pago ha sido procesado correctamente. Recibirás un correo con los detalles de tu pedido.',
                    bgColor: 'bg-emerald-50',
                    borderColor: 'border-emerald-200',
                };
            case 'pending':
            case 'in_process':
                return {
                    icon: <Clock className="h-16 w-16 text-amber-500" />,
                    title: 'Pago Pendiente',
                    message: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-16 w-16 text-red-500" />,
                    title: 'Pago Rechazado',
                    message: 'Lo sentimos, tu pago no pudo ser procesado. Por favor, intenta con otro método de pago.',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                };
            default:
                return {
                    icon: <AlertCircle className="h-16 w-16 text-slate-500" />,
                    title: 'Estado del Pago',
                    message: 'Estamos verificando el estado de tu pago. Por favor, espera un momento.',
                    bgColor: 'bg-slate-50',
                    borderColor: 'border-slate-200',
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="container py-12">
            <div className={`mx-auto max-w-lg rounded-2xl border ${statusInfo.borderColor} ${statusInfo.bgColor} p-8 text-center shadow-sm`}>
                <div className="flex justify-center">{statusInfo.icon}</div>
                <h1 className="mt-6 text-2xl font-bold text-slate-900">{statusInfo.title}</h1>
                <p className="mt-3 text-slate-700">{statusInfo.message}</p>

                {paymentId && (
                    <div className="mt-6 rounded-xl bg-white p-4 text-left text-sm">
                        <div className="grid gap-2">
                            <div className="flex justify-between">
                                <span className="text-slate-600">ID de Pago:</span>
                                <span className="font-mono font-semibold">{paymentId}</span>
                            </div>
                            {externalReference && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Referencia:</span>
                                    <span className="font-mono font-semibold">{externalReference.slice(0, 8)}...</span>
                                </div>
                            )}
                            {paymentType && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Método:</span>
                                    <span className="font-semibold capitalize">{paymentType.replace('_', ' ')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link href="/" className="btn-primary">
                        Volver a la tienda
                    </Link>
                    {externalReference && (
                        <Link href={`/order/${externalReference}`} className="btn">
                            Ver mi pedido
                        </Link>
                    )}
                </div>

                <p className="mt-6 text-xs text-slate-500">
                    ¿Tienes preguntas?{' '}
                    <Link href="/contacto" className="underline">
                        Contáctanos
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function CheckoutResultPage() {
    return (
        <Suspense fallback={
            <div className="container py-12">
                <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="text-lg font-semibold text-slate-700">Cargando resultado...</div>
                </div>
            </div>
        }>
            <CheckoutResultContent />
        </Suspense>
    );
}
