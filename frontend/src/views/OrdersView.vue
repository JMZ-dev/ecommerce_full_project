<template>
  <div class="container py-4">
    <h2 class="mb-3">Mes commandes</h2>
    <div v-if="loading" class="text-muted">Chargement...</div>
    <div v-else-if="orders.length === 0" class="alert alert-info">Aucune commande</div>

    <div v-else class="row g-3">
      <div v-for="order in orders" :key="order.id_commande" class="col-md-6">
        <div class="card p-3">
          <div class="d-flex justify-content-between">
            <div class="fw-bold">Commande #{{ order.id_commande }}</div>
            <div class="text-muted">{{ new Date(order.date_commande).toLocaleString() }}</div>
          </div>
          <div class="mt-2">Statut: {{ order.statut }}</div>
          <div>Total: {{ Number(order.total).toFixed(2) }} $</div>
          <div class="text-muted small">Paiement: {{ order.facture?.statut_paiement || 'N/A' }}</div>
          <router-link class="btn btn-sm btn-outline-primary mt-3" :to="`/orders/${order.id_commande}`">
            Voir details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'

const loading = ref(false)
const orders = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/orders')
    orders.value = res.data
  } catch (err) {
    orders.value = []
  } finally {
    loading.value = false
  }
})
</script>
