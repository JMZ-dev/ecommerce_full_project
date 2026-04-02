<template>
  <div class="container py-4">
    <div v-if="loading" class="text-muted">Chargement...</div>
    <div v-else-if="!order" class="alert alert-danger">Commande introuvable</div>

    <div v-else>
      <div class="d-flex justify-content-between align-items-center">
        <h2>Commande #{{ order.id_commande }}</h2>
        <button class="btn btn-outline-secondary" @click="printInvoice">Imprimer facture</button>
      </div>

      <div class="mt-3">
        <div>Statut: {{ order.statut }}</div>
        <div>Total: {{ Number(order.total).toFixed(2) }} $</div>
        <div>Date: {{ new Date(order.date_commande).toLocaleString() }}</div>
      </div>

      <h4 class="mt-4">Articles</h4>
      <ul class="list-group">
        <li v-for="line in order.lignes" :key="line.id_ligne" class="list-group-item d-flex justify-content-between">
          <div>{{ line.nom }} x {{ line.quantite }}</div>
          <div>{{ Number(line.sous_total || line.prix_unitaire * line.quantite).toFixed(2) }} $</div>
        </li>
      </ul>

      <h4 class="mt-4">Facture</h4>
      <div class="card p-3">
        <div>ID facture: {{ order.facture?.id_facture || '-' }}</div>
        <div>Montant: {{ Number(order.facture?.montant_total || 0).toFixed(2) }} $</div>
        <div>Mode paiement: {{ order.facture?.mode_paiement || '-' }}</div>
        <div>Statut paiement: {{ order.facture?.statut_paiement || '-' }}</div>
      </div>

      <h4 class="mt-4">Livraison</h4>
      <div class="card p-3">
        <div>Adresse: {{ order.livraison?.adresse_livraison || '-' }}</div>
        <div>Ville: {{ order.livraison?.ville_livraison || '-' }}</div>
        <div>Code postal: {{ order.livraison?.code_postal_livraison || '-' }}</div>
        <div>Date prevue: {{ order.livraison?.date_livraison_prevue || '-' }}</div>
        <div>Statut: {{ order.livraison?.statut_livraison || '-' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const loading = ref(false)
const order = ref(null)
const stripeLoading = ref(false)

const isPaid = computed(() => order.value?.facture?.statut_paiement === 'Paye')
const showStripePay = computed(
  () =>
    Boolean(order.value?.facture?.mode_paiement === 'Stripe') &&
    Boolean(order.value?.id_commande) &&
    !isPaid.value
)

const printInvoice = () => {
  window.print()
}

const payWithStripe = async () => {
  if (!order.value?.id_commande) return
  stripeLoading.value = true
  try {
    const res = await api.post('/payments/stripe/checkout', { orderId: order.value.id_commande })
    window.location.href = res.data.url
  } catch (err) {
    stripeLoading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get(`/orders/${route.params.id}`)
    order.value = res.data
  } catch (err) {
    order.value = null
  } finally {
    loading.value = false
  }
})
</script>
