<template>
  <div class="container py-4">
    <div v-if="loading" class="text-muted">Chargement...</div>
    <div v-else-if="!product" class="alert alert-danger">Produit introuvable</div>

    <div v-else class="row g-4">
      <div class="col-md-6">
        <div class="border rounded p-3 text-center">
          <img
            v-if="product.image"
            :src="imageUrl(product)"
            :alt="product.nom"
            class="img-fluid"
            style="max-height: 320px;"
            @error="onImageError"
          />
          <div v-else class="text-muted">Pas d'image</div>
        </div>
      </div>
      <div class="col-md-6">
        <h2>{{ product.nom }}</h2>
        <div class="text-muted mb-2">{{ product.categorie }}</div>
        <p>{{ product.description }}</p>
        <div class="fw-bold mb-3">{{ Number(product.prix).toFixed(2) }} $</div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" @click="addToCart(product)">Ajouter au panier</button>
          <router-link class="btn btn-outline-secondary" to="/cart">Voir panier</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { addToCart } from '../state/cart'

const route = useRoute()
const loading = ref(false)
const product = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get(`/products/${route.params.id}`)
    product.value = res.data
  } catch (err) {
    product.value = null
  } finally {
    loading.value = false
  }
})

const imageUrl = (product) => {
  if (!product?.image) return ''
  return `/images/${product.image}`
}

const onImageError = (event) => {
  const target = event?.target
  if (!target || target.dataset.fallback === '1') return
  const name = encodeURIComponent(target.alt || 'Produit')
  target.dataset.fallback = '1'
  target.src = `https://placehold.co/800x600/f5f2ea/1f2a37?text=${name}`
}
</script>
