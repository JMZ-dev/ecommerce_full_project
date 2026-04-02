
<template>
	<div class="container py-4">
		<div class="app-hero rounded-4 p-4 mb-4">
			<div class="row g-3 align-items-center">
				<div class="col-lg-7">
					<span class="badge hero-pill mb-2">Livraison rapide, prix malins</span>
					<h1 class="display-6 fw-bold">Ton catalogue tech, clair et efficace</h1>
					<p class="text-muted mb-3">
						Explore des produits fiables, compare les prix et commande en quelques clics.
					</p>
					<div class="input-group" style="max-width: 420px;">
						<input v-model.trim="search" type="text" class="form-control" placeholder="Rechercher un produit" />
						<button class="btn btn-primary" @click="fetchProducts">Chercher</button>
					</div>
				</div>
				<div class="col-lg-5 text-center">
					<div class="p-4 bg-white rounded-4 shadow-sm">
						<div class="fw-bold mb-2">Selection Amazon-style</div>
						<div class="text-muted">Offres tech & accessoires incontournables.</div>
					</div>
				</div>
			</div>
		</div>

		<div class="d-flex flex-wrap gap-2 align-items-center mb-3">
			<h2 class="me-auto section-title">Produits</h2>
			<div class="input-group" style="max-width: 360px;">
				<input v-model.trim="search" type="text" class="form-control" placeholder="Rechercher" />
				<button class="btn btn-outline-secondary" @click="fetchProducts">Chercher</button>
			</div>
		</div>

		<div v-if="loading" class="text-muted">Chargement...</div>
		<div v-else-if="products.length === 0" class="alert alert-info">Aucun produit</div>

		<div v-else class="row g-3">
			<div class="col-md-4" v-for="p in products" :key="p.id_produit">
				<div class="product-card h-100 bg-white">
					<div class="product-image">
						<img
							v-if="p.image"
							:src="imageUrl(p)"
							:alt="p.nom"
							class="img-fluid"
							style="max-height: 180px;"
							@error="onImageError"
						/>
						<div v-else class="text-muted small">Pas d'image</div>
					</div>
					<div class="card-body">
						<div class="fw-bold">{{ p.nom }}</div>
						<div class="text-muted small">{{ p.categorie }}</div>
						<div class="mt-2">{{ Number(p.prix).toFixed(2) }} $</div>
						<p class="mt-2 text-muted" style="min-height: 48px;">{{ p.description }}</p>
					</div>
					<div class="card-footer d-flex gap-2 bg-white border-0">
						<button class="btn btn-sm btn-primary" @click="addToCart(p)">Ajouter</button>
						<router-link class="btn btn-sm btn-outline-secondary" :to="`/products/${p.id_produit}`">
							Details
						</router-link>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'
import { addToCart } from '../state/cart'

const products = ref([])
const search = ref('')
const loading = ref(false)

const fetchProducts = async () => {
	loading.value = true
	try {
		const res = await api.get('/products', {
			params: search.value ? { search: search.value } : {}
		})
		products.value = res.data
	} catch (err) {
		products.value = []
	} finally {
		loading.value = false
	}
}

onMounted(fetchProducts)

const imageUrl = (product) => {
	if (!product?.image) return ''
	return `/images/${product.image}`
}

const onImageError = (event) => {
	const target = event?.target
	if (!target || target.dataset.fallback === '1') return
	const name = encodeURIComponent(target.alt || 'Produit')
	target.dataset.fallback = '1'
	target.src = `https://placehold.co/480x360/f5f2ea/1f2a37?text=${name}`
}
</script>
