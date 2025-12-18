"use client";

import React, { useState } from 'react';
import { Header, Footer } from '@/components';

export default function ConfirmarCompra() {
  const [deliveryAddress, setDeliveryAddress] = useState('my-address');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showQR, setShowQR] = useState(false);

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8">Finalizar compra</h1>

        <div className="grid gap-6">
          {/* Step 1: Endereço de entrega */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-gray-400">1</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-4">Endereço de entrega</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="my-address"
                        checked={deliveryAddress === 'my-address'}
                        onChange={() => setDeliveryAddress('my-address')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="my-address" className="text-sm font-medium cursor-pointer">
                        Meu endereço
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="other-address"
                        checked={deliveryAddress === 'other'}
                        onChange={() => setDeliveryAddress('other')}
                        className="w-4 h-4"
                      />
                      <label htmlFor="other-address" className="text-sm font-medium cursor-pointer">
                        Outro
                      </label>
                    </div>
                  </div>

                  {deliveryAddress === 'other' && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium">Endereço</label>
                        <input id="address" placeholder="Rua..." className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label htmlFor="number" className="block text-sm font-medium">Nº</label>
                        <input id="number" placeholder="Número..." className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label htmlFor="neighborhood" className="block text-sm font-medium">Bairro</label>
                        <input id="neighborhood" placeholder="Bairro..." className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium">Cidade</label>
                        <input id="city" placeholder="Cidade..." className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                      <div className="col-span-2">
                        <label htmlFor="complement" className="block text-sm font-medium">Complemento</label>
                        <input id="complement" placeholder="Complemento..." className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Método de pagamento */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-gray-400">2</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-4">Método de pagamento</h2>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    { id: 'pix', label: 'Pix', icon: '◇' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => { setPaymentMethod(method.id); setShowQR(true); }}
                      className={`p-3 rounded border-2 font-medium text-sm transition-colors ${
                        paymentMethod === method.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {method.label} {method.icon}
                    </button>
                  ))}
                </div>

                {showQR && (
                  <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold mb-4">QR Code para Pagamento</h3>
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pagamento%20Pix%20R%24%20114,20" 
                      alt="QR Code Pix" 
                      className="mx-auto border rounded"
                    />
                    <p className="mt-4 text-sm text-gray-600">Escaneie o QR Code com seu aplicativo de banco para realizar o pagamento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Ofertas */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-gray-400">3</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-4">Ofertas</h2>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="coupon1" className="block text-xs text-gray-600">Cupom</label>
                    <input id="coupon1" placeholder="VIM19020" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50" />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="coupon2" className="block text-xs text-gray-600">Código promocional</label>
                    <input id="coupon2" placeholder="Insira um cupom" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Itens e envio */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-gray-400">4</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-4">Itens e envio</h2>
                
                <div className="bg-gray-100 rounded p-4 mb-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                  <div className="w-20 h-20 bg-gray-200 rounded"></div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ 127,00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Desconto</span>
                    <span>-R$ 25,40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Frete</span>
                    <span>R$ 13,00</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Valor total</span>
                    <span>R$ 114,20</span>
                  </div>
                </div>

                <button className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-6 text-lg rounded-md">
                  Finalizar pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
