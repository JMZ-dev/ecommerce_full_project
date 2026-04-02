<template>
  <div class="container py-4">
    <div class="admin-panel p-4">
      <div class="d-flex flex-wrap gap-3 align-items-center mb-3">
        <div>
          <div class="text-uppercase text-muted small">Espace admin</div>
          <h2 class="section-title">Gestion des produits</h2>
        </div>
        <button class="btn btn-outline-secondary ms-auto" @click="resetForm">Nouveau produit</button>
      </div>

      <form class="row g-3" @submit.prevent="save">
        <div class="col-md-6">
          <label class="form-label">Nom</label>
          <input v-model.trim="form.nom" class="form-control" required />
        </div>
        <div class="col-md-3">
          <label class="form-label">Prix</label>
          <input v-model.number="form.prix" type="number" min="0" step="0.01" class="form-control" required />
        </div>
        <div class="col-md-3">
          <label class="form-label">Stock</label>
          <input v-model.number="form.stock" type="number" min="0" step="1" class="form-control" />
        </div>
        <div class="col-12">
          <label class="form-label">Description</label>
          <textarea v-model.trim="form.description" class="form-control" rows="3"></textarea>
        </div>
        <div class="col-md-6">
          <label class="form-label">Image (nom de fichier)</label>
          <input v-model.trim="form.image" class="form-control" placeholder="ex: laptop.jpg" />
        </div>
        <div class="col-md-6">
          <label class="form-label">Categorie</label>
          <input v-model.trim="form.categorie" class="form-control" />
        </div>
        <div class="col-12 d-flex gap-2">
          <button class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement...' : form.id_produit ? 'Mettre a jour' : 'Ajouter' }}
          </button>
          <button v-if="form.id_produit" class="btn btn-outline-secondary" type="button" @click="resetForm">
            Annuler
          </button>
        </div>
        <div v-if="error" class="col-12">
          <div class="alert alert-danger">{{ error }}</div>
        </div>
      </form>
    </div>

    <div class="mt-4">
      <h4 class="section-title mb-3">Catalogue</h4>
      <div v-if="loading" class="text-muted">Chargement...</div>
      <div v-else class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Categorie</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id_produit">
              <td>{{ p.id_produit }}</td>
              <td>{{ p.nom }}</td>
              <td>{{ Number(p.prix).toFixed(2) }} $</td>
              <td>{{ p.stock }}</td>
              <td>{{ p.categorie }}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-primary me-2" @click="editProduct(p)">Modifier</button>
                <button class="btn btn-sm btn-outline-danger" @click="removeProduct(p)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'

const products = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const form = ref({
  id_produit: null,
  nom: '',
  description: '',
  prix: 0,
  stock: 0,
  image: '',
  categorie: ''
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await api.get('/products')
    products.value = res.data
  } catch (err) {
    products.value = []
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    id_produit: null,
    nom: '',
    description: '',
    prix: 0,
    stock: 0,
    image: '',
    categorie: ''
  }
  error.value = ''
}

const editProduct = (p) => {
  form.value = {
    id_produit: p.id_produit,
    nom: p.nom,
    description: p.description || '',
    prix: Number(p.prix),
    stock: Number(p.stock || 0),
    image: p.image || '',
    categorie: p.categorie || ''
  }
  error.value = ''
}

const save = async () => {
  saving.value = true
  error.value = ''
  try {
    if (form.value.id_produit) {
      await api.put(`/admin/products/${form.value.id_produit}`, form.value)
    } else {
      await api.post('/admin/products', form.value)
    }
    await fetchProducts()
    resetForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de sauvegarde'
  } finally {
    saving.value = false
  }
}

const removeProduct = async (product) => {
  if (!confirm(`Supprimer ${product.nom} ?`)) return
  try {
    await api.delete(`/admin/products/${product.id_produit}`)
    await fetchProducts()
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur de suppression'
  }
}

onMounted(fetchProducts)
</script>
