<template>
  <div class="container py-5" style="max-width: 640px;">
    <div class="card p-4 text-center">
      <h2 class="mb-2">Paiement confirme</h2>
      <p class="text-muted">Votre paiement Stripe est en cours de verification.</p>
      <div v-if="loading" class="text-muted">Validation...</div>
      <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
      <div v-else class="alert alert-success">Paiement confirme.</div>
      <router-link v-if="orderId" class="btn btn-primary mt-3" :to="`/orders/${orderId}`">
        Voir la commande
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const loading = ref(false)
const error = ref('')
const orderId = route.query.orderId
const sessionId = route.query.session_id

onMounted(async () => {
  if (!orderId || !sessionId) {
    error.value = 'Informations de paiement manquantes.'
    return
  }
  loading.value = true
  try {
    await api.post('/payments/stripe/confirm', { orderId, sessionId })
  } catch (err) {
    error.value = err.response?.data?.message || 'Confirmation echouee'
  } finally {
    loading.value = false
  }
})
</script>
