<template>
  <div class="container py-4" style="max-width: 720px;">
    <h2 class="mb-3">Validation de commande</h2>

    <div v-if="!auth.user" class="alert alert-warning">
      Vous devez vous connecter pour commander.
      <div class="mt-2">
        <router-link class="btn btn-sm btn-primary" to="/login">Connexion</router-link>
      </div>
    </div>

    <div v-else>
      <div v-if="cart.items.length === 0" class="alert alert-info">Panier vide</div>
      <form v-else @submit.prevent="submit" class="row g-3">
        <div class="col-12">
          <label class="form-label">Adresse de livraison</label>
          <input v-model.trim="form.adresse_livraison" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Ville</label>
          <input v-model.trim="form.ville_livraison" type="text" class="form-control" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Code postal</label>
          <input v-model.trim="form.code_postal_livraison" type="text" class="form-control" required />
        </div>
        <div class="col-12">
          <label class="form-label">Mode de paiement</label>
          <select v-model="form.mode_paiement" class="form-select" required>
            <option value="Carte">Carte</option>
            <option value="Cash">Cash</option>
            <option value="Virement">Virement</option>
            <option value="Stripe">Stripe (carte)</option>
          </select>
        </div>
        <div class="col-12">
          <div class="fw-bold">Total: {{ total.toFixed(2) }} $</div>
        </div>
        <div class="col-12">
          <button class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Envoi...' : 'Confirmer la commande' }}
          </button>
        </div>
        <div v-if="error" class="col-12">
          <div class="alert alert-danger">{{ error }}</div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { useAuthState } from '../state/auth'
import { useCartState, clearCart, getCartTotal } from '../state/cart'

const router = useRouter()
const auth = useAuthState()
const cart = useCartState()
const total = computed(() => getCartTotal())

const form = ref({
  adresse_livraison: '',
  ville_livraison: '',
  code_postal_livraison: '',
  mode_paiement: 'Carte'
})

const loading = ref(false)
const error = ref('')

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    const payload = {
      items: cart.items.map((i) => ({ id_produit: i.id_produit, quantite: i.quantite })),
      livraison: {
        adresse_livraison: form.value.adresse_livraison,
        ville_livraison: form.value.ville_livraison,
        code_postal_livraison: form.value.code_postal_livraison
      },
      mode_paiement: form.value.mode_paiement
    }
    const res = await api.post('/orders', payload)
    const orderId = res.data.id_commande
    if (form.value.mode_paiement === 'Stripe') {
      const stripeRes = await api.post('/payments/stripe/checkout', { orderId })
      window.location.href = stripeRes.data.url
      return
    }
    clearCart()
    router.push(`/orders/${orderId}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de commande'
  } finally {
    loading.value = false
  }
}
</script>
