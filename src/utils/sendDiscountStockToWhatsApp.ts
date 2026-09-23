type CartItem = {
  name: string;
  quantity: number;
  price: number;
  note?: string;
  addons?: string[];
};

export function sendDiscountStockToWhatsApp(items: CartItem[]) {
  if (!items || items.length === 0) return;

  let message = "*NOVA BAIXA DE ESTOQUE*\n\n";
  let total = 0;

  items.forEach((item) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    message += `• ${item.name}\n`;
    message += `Quantidade: ${item.quantity}\n`;
    message += `💰 Valor: R$ ${subtotal.toFixed(2)}\n`;

    if (item.addons && item.addons.length > 0) {
      message += `Adicionais: ${item.addons.join(", ")}\n`;
    }

    if (item.note) {
      message += `Obs: ${item.note}\n`;
    }

    message += "\n";
  });

  message += `TOTAL: R$ ${total.toFixed(2)}\n`;
  message += "Baixa registrada pelo site";

  const phone = "5564999999687";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.location.href = url;
}