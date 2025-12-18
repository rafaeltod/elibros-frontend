"use client";

import React, { useState } from 'react';
import { Header, Footer } from '@/components';

export default function ConfirmarCompra() {
  const [deliveryAddress, setDeliveryAddress] = useState('my-address');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [newCoupon, setNewCoupon] = useState('');
  

  return (
    <>
      <Header />
      <main>
        <form action="/finalizar_compra_postback" method="POST" id="finalizar-compra-form" encType="multipart/form-data">
          <section className="compra mx-auto max-w-4xl mt-10">
            <h1 className="text-2xl font-bold">Finalizar compra</h1>
            <div>
              <div className="compra border-b p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-400 mb-4">1</h2>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Endereço de entrega</h3>
                  <div className="flex gap-12 items-start">
                    <div className="flex flex-col gap-6 min-w-[140px]">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="endereco_tipo" value="meu_endereco" defaultChecked className="peer hidden" />
                        <span className="w-5 h-5 border-2 border-gray-300 rounded-full mr-2.5 relative bg-white peer-checked:bg-yellow-400 peer-checked:border-yellow-400 after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:transform after:-translate-x-1/2 after:-translate-y-1/2 after:w-2.5 after:h-2.5 after:bg-white after:rounded-full peer-checked:after:block after:hidden"></span>
                        Meu endereço
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="endereco_tipo" value="outro_endereco" className="peer hidden" />
                        <span className="w-5 h-5 border-2 border-gray-300 rounded-full mr-2.5 relative bg-white peer-checked:bg-yellow-400 peer-checked:border-yellow-400 after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:transform after:-translate-x-1/2 after:-translate-y-1/2 after:w-2.5 after:h-2.5 after:bg-white after:rounded-full peer-checked:after:block after:hidden"></span>
                        Outro
                      </label>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 outroendereco" style={{ marginTop: '-1em' }}>
                      <label className="col-span-1 flex items-center gap-2">
                        CEP:
                        <input
                          type="text"
                          name="cep"
                          className="border-none bg-transparent w-24"
                          placeholder="_____-___"
                          pattern="\d{5}-?\d{3}"
                          maxLength={9}
                        />
                      </label>
                      <label className="col-span-1 flex items-center gap-1">
                        Complemento:
                        <input
                          type="text"
                          className="border-none bg-transparent w-full"
                          name="complemento"
                          size={30}
                          placeholder="_____________________________"
                        />
                      </label>
                      <label className="col-span-2 flex items-center gap-2">
                        Rua:
                        <input
                          type="text"
                          className="border-none bg-transparent w-full"
                          name="rua"
                          size={85}
                          placeholder="___________________________________________________"
                        />
                      </label>
                      <label className="col-span-1 flex items-center gap-2">
                        Número:
                        <input
                          type="number"
                          className="border-none bg-transparent w-16"
                          name="numero"
                          placeholder="____"
                        />
                      </label>
                      <label className="col-span-1 flex items-center gap-2">
                        Estado:
                        <select name="estado" className="border-none bg-transparent">
                          <option value="-1"></option>
                          <option value="RN">RN</option>
                        </select>
                      </label>
                      <label className="col-span-2 flex items-center gap-2">
                        Cidade:
                        <input
                          type="text"
                          className="border-none bg-transparent w-full"
                          name="cidade"
                          size={30}
                          placeholder="________________________________________________"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="compra border-b p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-400 mb-4">2</h2>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Método de pagamento</h3>
                  <div className="flex justify-center" id="pagamento">
                    <button type="button" onClick={() => setShowQR(true)} className="border border-yellow-400 px-24 py-1.5 rounded">PIX</button>
                  </div>
                  {showQR && (
                    <div className="mt-4 flex flex-col items-center">
                      <h4>QR Code para Pagamento</h4>
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Pagamento%20Pix%20R%24%20114,20" 
                        alt="QR Code Pix" 
                        style={{ border: '1px solid #ccc', borderRadius: '0.25rem' }}
                      />
                      <p style={{ marginTop: '1rem', color: '#666' }}>Escaneie o QR Code com seu aplicativo de banco para realizar o pagamento.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="compra border-b p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-400 mb-4">3</h2>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ofertas</h3>
                  <div id="cupom-section">
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newCoupon}
                        onChange={(e) => setNewCoupon(e.target.value)}
                        placeholder="Insira o código do cupom"
                        className="border border-yellow-400 rounded px-3 py-2 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCoupon.trim()) {
                            setCoupons([...coupons, newCoupon.trim()]);
                            setNewCoupon('');
                          }
                        }}
                        className="text-brown-500 px-4 py-2"
                      >
                        Inserir cupom
                      </button>
                    </div>
                    {coupons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {coupons.map((coupon, index) => (
                          <div key={index} className="px-3 py-1 rounded flex items-center gap-2">
                            <span>{coupon}</span>
                            <button
                              type="button"
                              onClick={() => setCoupons(coupons.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="compra border-b p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-400 mb-4">4</h2>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Itens e envio</h3>
                  <div className="itens">
                    <div className="space-y-4 mb-4">
                      <div className="p-4 border rounded">
                        <div>
                          <p className="font-semibold">Nome do Livro 1</p>
                          <p className="text-gray-600">Autor</p>
                          <p className="text-lg font-bold">R$ 63,50</p>
                        </div>
                      </div>
                      <div className="p-4 border rounded">
                        <div>
                          <p className="font-semibold">Nome do Livro 2</p>
                          <p className="text-gray-600">Autor</p>
                          <p className="text-lg font-bold">R$ 63,50</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right mb-4">
                      <p className="text-lg">
                        <span className="moeda-cart-p">R$</span>
                        <b><span className="preco-maior-cart-p">127,00</span></b>
                      </p>
                      <p>2 itens no pedido</p>
                    </div>
                    <p>Ao finalizar o pedido a entrega será estimada para sexta-feira</p>
                  </div>
                </div>
              </div>
              <div id="final" className="mt-8">
                <div id="total" className="mb-4">
                  <span className="flex justify-between mb-2">
                    <p>Subtotal</p>
                    <p>R$ 127,00</p>
                  </span>

                  <span className="flex justify-between mb-2">
                    <p>Desconto</p>
                    <p>---</p>
                  </span>

                  <span className="flex justify-between mb-2">
                    <p>Frete</p>
                    <p>R$ 13,00</p>
                  </span>

                  <span className="flex justify-between mb-2">
                    <p>Valor Total</p>
                    <p>R$ 114,20</p>
                  </span>
                </div>
                <div className="text-right">
                  <button type="submit" id="finalizar" className="bg-yellow-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition">Finalizar pedido</button>
                </div>
              </div>
            </div>
          </section>
        </form>
      </main>
      <Footer />
    </>
  );
}
