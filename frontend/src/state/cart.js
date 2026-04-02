import { reactive } from 'vue'

const state = reactive({
  items: JSON.parse(localStorage.getItem('cart') || '[]')
})

const save = () => {
  localStorage.setItem('cart', JSON.stringify(state.items))
}

export const useCartState = () => state

export const addToCart = (product, qty = 1) => {
  const existing = state.items.find((i) => i.id_produit === product.id_produit)
  if (existing) {
    existing.quantite += qty
  } else {
    state.items.push({
      id_produit: product.id_produit,
      nom: product.nom,
      prix: Number(product.prix),
      image: product.image,
      quantite: qty
    })
  }
  save()
}

export const updateQuantity = (idProduit, qty) => {
  const item = state.items.find((i) => i.id_produit === idProduit)
  if (!item) return
  item.quantite = Math.max(1, Number(qty) || 1)
  save()
}

export const removeFromCart = (idProduit) => {
  const index = state.items.findIndex((i) => i.id_produit === idProduit)
  if (index >= 0) {
    state.items.splice(index, 1)
    save()
  }
}

export const clearCart = () => {
  state.items.splice(0, state.items.length)
  save()
}

export const getCartTotal = () =>
  state.items.reduce((sum, i) => sum + Number(i.prix) * Number(i.quantite), 0)
