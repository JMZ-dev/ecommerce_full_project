<template>
  <div class="container py-4">
    <h2 class="mb-3">Panier</h2>
    <div v-if="cart.items.length === 0" class="alert alert-info">Panier vide</div>

    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Prix</th>
            <th style="width: 140px;">Quantite</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cart.items" :key="item.id_produit">
            <td>{{ item.nom }}</td>
            <td>{{ item.prix.toFixed(2) }} $</td>
            <td>
              <input
                v-model.number="item.quantite"
                type="number"
                min="1"
                class="form-control"
                @change="updateQuantity(item.id_produit, item.quantite)"
              />
            </td>
            <td>{{ (item.prix * item.quantite).toFixed(2) }} $</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" @click="removeFromCart(item.id_produit)">
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="cart.items.length" class="d-flex justify-content-between align-items-center mt-3">
      <div class="fw-bold">Total: {{ total.toFixed(2) }} $</div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="clearCart">Vider le panier</button>
        <router-link class="btn btn-primary" to="/checkout">Valider</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCartState, updateQuantity, removeFromCart, clearCart, getCartTotal } from '../state/cart'

const cart = useCartState()
const total = computed(() => getCartTotal())
</script>
